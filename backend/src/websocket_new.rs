use axum::{
    extract::{Path, State, ws::{WebSocket, WebSocketUpgrade}},
    response::IntoResponse,
};
use futures::{SinkExt, StreamExt};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::{RwLock, Mutex};

use crate::game::{GameManager, Player, Zone, Card};

#[derive(Debug, Serialize, Deserialize)]
pub enum Message {
    #[serde(rename = "UpdateLife")]
    UpdateLife { player_id: String, delta: i32 },
    #[serde(rename = "UpdateCounter")]
    UpdateCounter { player_id: String, counter_type: String, delta: i32 },
    #[serde(rename = "SetPlayerName")]
    SetPlayerName { player_id: String, name: String },
    #[serde(rename = "DiceRoll")]
    DiceRoll { player_id: String, roll_type: String, result: String },
    #[serde(rename = "MoveCard")]
    MoveCard { card_id: String, from_zone: String, to_zone: String },
    #[serde(rename = "DrawCard")]
    DrawCard { card_name: String },
    #[serde(rename = "DiscardCard")]
    DiscardCard { card_id: String },
    #[serde(rename = "NextTurn")]
    NextTurn {},
    #[serde(rename = "UndoTurn")]
    UndoTurn {},
    #[serde(rename = "RestartGame")]
    RestartGame {},
    
    #[serde(rename = "GameState")]
    GameState { state: String },
    #[serde(rename = "Error")]
    Error { message: String },
}

pub async fn ws_handler(
    Path((game_id, player_id)): Path<(String, String)>,
    ws: WebSocketUpgrade,
    State(game_manager): State<Arc<RwLock<GameManager>>>,
) -> impl IntoResponse {
    ws.on_upgrade(|socket| handle_socket(socket, game_id, player_id, game_manager))
}

async fn handle_socket(
    socket: WebSocket,
    game_id: String,
    player_id: String,
    game_manager: Arc<RwLock<GameManager>>,
) {
    let (sender, mut receiver) = socket.split();
    let sender = Arc::new(Mutex::new(sender));

    // Get broadcast channel
    let tx = {
        let mut gm = game_manager.write().await;
        if let Some(game) = gm.get_game_mut(&game_id) {
            let is_new_player = !game.players.contains_key(&player_id);
            
            if is_new_player {
                let join_order = game.players.len();
                let player = Player::new(player_id.clone(), format!("Player {}", join_order + 1), join_order);
                game.add_player(player);
                // Broadcast state to all players so they see the new player joined
                game.broadcast_state();
            } else {
                if let Some(p) = game.get_player_mut(&player_id) {
                    p.is_active = true;
                }
            }
            game.tx.clone()
        } else {
            return;
        }
    };

    if tx.is_none() {
        return;
    }

    let tx = tx.unwrap();
    let mut rx = tx.subscribe();

    // Send initial game state with player's seat position
    {
        let gm = game_manager.read().await;
        if let Some(game) = gm.get_game(&game_id) {
            let player_join_order = game.players
                .get(&player_id)
                .map(|p| p.join_order)
                .unwrap_or(0);
            
            let state_json = serde_json::to_string(&game).unwrap_or_default();
            let msg = serde_json::json!({
                "GameState": {
                    "state": state_json,
                    "player_id": player_id,
                    "player_join_order": player_join_order
                }
            }).to_string();
            let mut s = sender.lock().await;
            let _ = s.send(axum::extract::ws::Message::Text(msg)).await;
        }
    }

    // Spawn task to broadcast state updates to this client
    let sender_clone = Arc::clone(&sender);
    let rx_handle = tokio::spawn(async move {
        let sender = sender_clone;
        while let Ok(msg) = rx.recv().await {
            let mut s = sender.lock().await;
            if s.send(axum::extract::ws::Message::Text(msg)).await.is_err() {
                break;
            }
        }
    });

    // Handle incoming messages from client
    while let Some(Ok(msg)) = receiver.next().await {
        if let axum::extract::ws::Message::Text(text) = msg {
            if let Ok(client_msg) = serde_json::from_str::<Message>(&text) {
                match client_msg {
                    Message::UpdateLife { player_id: pid, delta } => {
                        let mut gm = game_manager.write().await;
                        if let Some(game) = gm.get_game_mut(&game_id) {
                            if game.update_life(&pid, delta).is_ok() {
                                game.broadcast_state();
                            }
                        }
                    },
                    Message::SetPlayerName { player_id: pid, name } => {
                        let mut gm = game_manager.write().await;
                        if let Some(game) = gm.get_game_mut(&game_id) {
                            if let Some(player) = game.get_player_mut(&pid) {
                                player.name = name;
                                game.broadcast_state();
                            }
                        }
                    },
                    Message::UpdateCounter { player_id: pid, counter_type, delta } => {
                        let mut gm = game_manager.write().await;
                        if let Some(game) = gm.get_game_mut(&game_id) {
                            if let Some(player) = game.get_player_mut(&pid) {
                                match counter_type.as_str() {
                                    "poison" => player.poison = (player.poison + delta).max(0),
                                    "energy" => player.energy = (player.energy + delta).max(0),
                                    "experience" => player.experience = (player.experience + delta).max(0),
                                    _ => {}
                                }
                                game.broadcast_state();
                            }
                        }
                    },
                    Message::MoveCard { card_id, from_zone, to_zone } => {
                        let from_enum = match from_zone.as_str() {
                            "hand" => Zone::Hand,
                            "graveyard" => Zone::Graveyard,
                            "exile" => Zone::Exile,
                            "command_zone" => Zone::CommandZone,
                            _ => Zone::Hand,
                        };
                        let to_enum = match to_zone.as_str() {
                            "hand" => Zone::Hand,
                            "graveyard" => Zone::Graveyard,
                            "exile" => Zone::Exile,
                            "command_zone" => Zone::CommandZone,
                            _ => Zone::Hand,
                        };

                        let mut gm = game_manager.write().await;
                        if let Some(game) = gm.get_game_mut(&game_id) {
                            if game.move_card(&player_id, &card_id, from_enum, to_enum).is_ok() {
                                game.broadcast_state();
                            }
                        }
                    },
                    Message::DrawCard { card_name } => {
                        let mut gm = game_manager.write().await;
                        if let Some(game) = gm.get_game_mut(&game_id) {
                            if let Some(player) = game.get_player_mut(&player_id) {
                                let card = Card {
                                    id: uuid::Uuid::new_v4().to_string(),
                                    name: card_name,
                                };
                                player.hand.push(card);
                                game.broadcast_state();
                            }
                        }
                    },
                    Message::NextTurn {} => {
                        let mut gm = game_manager.write().await;
                        if let Some(game) = gm.get_game_mut(&game_id) {
                            game.next_turn();
                            game.broadcast_state();
                        }
                    },
                    Message::UndoTurn {} => {
                        let mut gm = game_manager.write().await;
                        if let Some(game) = gm.get_game_mut(&game_id) {
                            game.undo_turn();
                            game.broadcast_state();
                        }
                    },
                    Message::RestartGame {} => {
                        let mut gm = game_manager.write().await;
                        if let Some(game) = gm.get_game_mut(&game_id) {
                            game.restart_game();
                            game.broadcast_state();
                        }
                    },
                    Message::DiceRoll { player_id: _, roll_type, result } => {
                        // Just broadcast the dice roll to all players
                        let gm = game_manager.read().await;
                        if let Some(game) = gm.get_game(&game_id) {
                            if let Some(tx) = &game.tx {
                                let msg = serde_json::json!({
                                    "DiceRoll": {
                                        "roll_type": roll_type,
                                        "result": result,
                                        "player_name": game.players.get(&player_id).map(|p| &p.name).unwrap_or(&"Unknown".to_string()).clone()
                                    }
                                });
                                let _ = tx.send(axum::extract::ws::Message::Text(msg.to_string()));
                            }
                        }
                    },
                    _ => {}
                }
            }
        }
    }

    // Mark as inactive on disconnect
    {
        let mut gm = game_manager.write().await;
        if let Some(game) = gm.get_game_mut(&game_id) {
            if let Some(player) = game.get_player_mut(&player_id) {
                player.is_active = false;
            }
        }
    }

    rx_handle.abort();
}
