use axum::{
    extract::{Path, State, ws::{WebSocket, WebSocketUpgrade}},
    response::IntoResponse,
};
use futures::{sink::SinkExt, stream::StreamExt};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::RwLock;

use crate::game::{GameManager, Player, Zone, Card};

#[derive(Debug, Serialize, Deserialize)]
pub enum Message {
    // Client -> Server
    JoinGame { player_name: String },
    UpdateLife { player_id: String, delta: i32 },
    MoveCard { card_id: String, from_zone: String, to_zone: String },
    DrawCard { card_name: String },
    DiscardCard { card_id: String },
    
    // Server -> Client
    PlayerJoined { player_id: String, player_name: String },
    GameState { state: String }, // JSON string of full game state
    LifeUpdated { player_id: String, life: i32 },
    CardMoved { player_id: String, card_id: String, from_zone: String, to_zone: String },
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
    let (mut sender, mut receiver) = socket.split();

    // Check if player is rejoining or new
    {
        let mut gm = game_manager.write().await;
        if let Some(game) = gm.get_game_mut(&game_id) {
            if !game.players.contains_key(&player_id) {
                // New player - add them
                let player = Player::new(player_id.clone(), format!("Player {}", game.players.len() + 1));
                game.add_player(player);
            } else {
                // Rejoin - mark as active
                if let Some(p) = game.get_player_mut(&player_id) {
                    p.is_active = true;
                }
            }
        }
    }

    // Send initial game state
    {
        let gm = game_manager.read().await;
        if let Some(game) = gm.get_game(&game_id) {
            let state_json = serde_json::to_string(&game).unwrap_or_default();
            let msg = Message::GameState { state: state_json };
            let _ = sender.send(axum::extract::ws::Message::Text(
                serde_json::to_string(&msg).unwrap_or_default(),
            )).await;
        }
    }

    // Handle incoming messages
    while let Some(Ok(msg)) = receiver.next().await {
        if let axum::extract::ws::Message::Text(text) = msg {
            if let Ok(client_msg) = serde_json::from_str::<Message>(&text) {
                match client_msg {
                    Message::UpdateLife { player_id: pid, delta } => {
                        let mut gm = game_manager.write().await;
                        if let Some(game) = gm.get_game_mut(&game_id) {
                            match game.update_life(&pid, delta) {
                                Ok(new_life) => {
                                    let response = Message::LifeUpdated {
                                        player_id: pid.clone(),
                                        life: new_life,
                                    };
                                    let _ = sender.send(axum::extract::ws::Message::Text(
                                        serde_json::to_string(&response).unwrap_or_default(),
                                    )).await;
                                }
                                Err(e) => {
                                    let response = Message::Error { message: e };
                                    let _ = sender.send(axum::extract::ws::Message::Text(
                                        serde_json::to_string(&response).unwrap_or_default(),
                                    )).await;
                                }
                            }
                        }
                    },
                    Message::MoveCard { card_id, from_zone, to_zone } => {
                        let from_enum = match from_zone.as_str() {
                            "hand" => Zone::Hand,
                            "battlefield" => Zone::Battlefield,
                            "graveyard" => Zone::Graveyard,
                            "exile" => Zone::Exile,
                            "command_zone" => Zone::CommandZone,
                            _ => Zone::Hand,
                        };
                        let to_enum = match to_zone.as_str() {
                            "hand" => Zone::Hand,
                            "battlefield" => Zone::Battlefield,
                            "graveyard" => Zone::Graveyard,
                            "exile" => Zone::Exile,
                            "command_zone" => Zone::CommandZone,
                            _ => Zone::Hand,
                        };

                        let mut gm = game_manager.write().await;
                        if let Some(game) = gm.get_game_mut(&game_id) {
                            match game.move_card(&player_id, &card_id, from_enum, to_enum) {
                                Ok(_) => {
                                    let response = Message::CardMoved {
                                        player_id: player_id.clone(),
                                        card_id,
                                        from_zone,
                                        to_zone,
                                    };
                                    let _ = sender.send(axum::extract::ws::Message::Text(
                                        serde_json::to_string(&response).unwrap_or_default(),
                                    )).await;
                                }
                                Err(e) => {
                                    let response = Message::Error { message: e };
                                    let _ = sender.send(axum::extract::ws::Message::Text(
                                        serde_json::to_string(&response).unwrap_or_default(),
                                    )).await;
                                }
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
}
