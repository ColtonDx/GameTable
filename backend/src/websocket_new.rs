use axum::{
    extract::{Path, State, ws::{WebSocket, WebSocketUpgrade}},
    response::IntoResponse,
};
use futures::{SinkExt, StreamExt};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::{RwLock, Mutex};
use uuid::Uuid;

use crate::game::{GameManager, Player, Zone, Card};
use crate::AppState;

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
    #[serde(rename = "LoadLibrary")]
    LoadLibrary { player_id: String, card_count: usize, card_type: String },
    #[serde(rename = "ShuffleLibrary")]
    ShuffleLibrary { player_id: String },
    #[serde(rename = "MoveCard")]
    MoveCard { card_id: String, from_zone: String, to_zone: String, #[serde(skip_serializing_if = "Option::is_none")] position_x: Option<f32>, #[serde(skip_serializing_if = "Option::is_none")] position_y: Option<f32> },
    #[serde(rename = "DrawCard")]
    DrawCard { card_name: String, #[serde(skip_serializing_if = "Option::is_none")] count: Option<usize> },
    #[serde(rename = "MillCard")]
    MillCard { card_name: String },
    #[serde(rename = "DiscardCard")]
    DiscardCard { card_id: String },
    #[serde(rename = "TapCard")]
    TapCard { player_id: String, card_id: String },
    #[serde(rename = "FlipCard")]
    FlipCard { player_id: String, card_id: String },
    #[serde(rename = "Copy")]
    Copy { player_id: String, card_id: String },
    #[serde(rename = "UntapAll")]
    UntapAll { player_id: String },
    #[serde(rename = "MoveCardOnBattlefield")]
    MoveCardOnBattlefield { player_id: String, card_id: String, x: f32, y: f32 },
    #[serde(rename = "NextTurn")]
    NextTurn {},
    #[serde(rename = "UndoTurn")]
    UndoTurn {},
    #[serde(rename = "RestartGame")]
    RestartGame {},
    #[serde(rename = "LeaveTable")]
    LeaveTable {},
    #[serde(rename = "RevealCard")]
    RevealCard { player_id: String, card_id: String, card_name: String, zone: String },
    #[serde(rename = "Scry")]
    Scry { player_id: String, count: usize },
    #[serde(rename = "ScryComplete")]
    ScryComplete { player_id: String, top_cards: Vec<String>, bottom_cards: Vec<String> },
    #[serde(rename = "SurveilComplete")]
    SurveilComplete { player_id: String, top_cards: Vec<String>, graveyard_cards: Vec<String> },
    #[serde(rename = "ManifestCard")]
    ManifestCard { player_id: String, card_id: String, #[serde(skip_serializing_if = "Option::is_none")] position_x: Option<f32>, #[serde(skip_serializing_if = "Option::is_none")] position_y: Option<f32> },
    #[serde(rename = "SpawnCard")]
    SpawnCard { player_id: String, set_code: String, collector_number: String, card_name: String, position: String },
    
    #[serde(rename = "GameState")]
    GameState { state: String },
    #[serde(rename = "Error")]
    Error { message: String },
}

pub async fn ws_handler(
    Path((game_id, player_id, player_name)): Path<(String, String, String)>,
    ws: WebSocketUpgrade,
    State(state): State<AppState>,
) -> impl IntoResponse {
    let game_manager = state.game_manager.clone();
    ws.on_upgrade(|socket| handle_socket(socket, game_id, player_id, player_name, game_manager))
}

async fn handle_socket(
    socket: WebSocket,
    game_id: String,
    player_id: String,
    player_name: String,
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
                let player = Player::new(player_id.clone(), player_name.clone(), join_order);
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
                    Message::MoveCard { card_id, from_zone, to_zone, position_x, position_y } => {
                        let from_enum = match from_zone.as_str() {
                            "hand" => Zone::Hand,
                            "battlefield" => Zone::Battlefield,
                            "graveyard" => Zone::Graveyard,
                            "exile" => Zone::Exile,
                            "command_zone" => Zone::CommandZone,
                            "library" => Zone::Library,
                            _ => Zone::Hand,
                        };
                        let to_enum = match to_zone.as_str() {
                            "hand" => Zone::Hand,
                            "battlefield" => Zone::Battlefield,
                            "graveyard" => Zone::Graveyard,
                            "exile" => Zone::Exile,
                            "command_zone" => Zone::CommandZone,
                            "library" => Zone::Library,
                            _ => Zone::Hand,
                        };
                        let is_moving_to_battlefield = to_enum == Zone::Battlefield;

                        let mut gm = game_manager.write().await;
                        if let Some(game) = gm.get_game_mut(&game_id) {
                            // Check if this is a token moving off battlefield
                            let is_token_leaving = {
                                if let Some(player) = game.get_player_mut(&player_id) {
                                    if let Some(card) = player.battlefield.iter().find(|c| c.id == card_id) {
                                        card.is_token && !is_moving_to_battlefield
                                    } else {
                                        false
                                    }
                                } else {
                                    false
                                }
                            };

                            if is_token_leaving {
                                // Delete the token instead of moving it
                                if let Some(player) = game.get_player_mut(&player_id) {
                                    player.battlefield.retain(|c| c.id != card_id);
                                }
                            } else if game.move_card(&player_id, &card_id, from_enum, to_enum).is_ok() {
                                // If moving to battlefield with position, update card position
                                if is_moving_to_battlefield {
                                    if let Some(player) = game.get_player_mut(&player_id) {
                                        if let Some(card) = player.battlefield.iter_mut().find(|c| c.id == card_id) {
                                            if let Some(x) = position_x {
                                                card.position_x = x;
                                            }
                                            if let Some(y) = position_y {
                                                card.position_y = y;
                                            }
                                        }
                                    }
                                }
                            }
                            game.broadcast_state();
                        }
                    },
                    Message::DrawCard { card_name: _, count } => {
                        let mut gm = game_manager.write().await;
                        if let Some(game) = gm.get_game_mut(&game_id) {
                            if let Some(player) = game.get_player_mut(&player_id) {
                                // Draw one or more cards from library to hand
                                let draw_count = count.unwrap_or(1);
                                for _ in 0..draw_count {
                                    if let Some(card) = player.library.pop() {
                                        player.hand.push(card);
                                    }
                                }
                                game.broadcast_state();
                            }
                        }
                    },
                    Message::MillCard { card_name: _ } => {
                        let mut gm = game_manager.write().await;
                        if let Some(game) = gm.get_game_mut(&game_id) {
                            if let Some(player) = game.get_player_mut(&player_id) {
                                // Move one card from library to graveyard
                                if let Some(card) = player.library.pop() {
                                    player.graveyard.push(card);
                                    game.broadcast_state();
                                }
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
                            let player_name = game.players.get(&player_id).map(|p| &p.name).unwrap_or(&"Unknown".to_string()).clone();
                            game.restart_game();
                            game.broadcast_state();
                            
                            // Broadcast restart notification
                            if let Some(tx) = &game.tx {
                                let msg = serde_json::json!({
                                    "GameRestarted": {
                                        "player_name": player_name
                                    }
                                });
                                let _ = tx.send(msg.to_string());
                            }
                        }
                    },
                    Message::TapCard { player_id: pid, card_id } => {
                        let mut gm = game_manager.write().await;
                        if let Some(game) = gm.get_game_mut(&game_id) {
                            if let Some(player) = game.get_player_mut(&pid) {
                                // Find card in battlefield and toggle tap state
                                if let Some(card) = player.battlefield.iter_mut().find(|c| c.id == card_id) {
                                    card.is_tapped = !card.is_tapped;
                                    game.broadcast_state();
                                }
                            }
                        }
                    },
                    Message::FlipCard { player_id: pid, card_id } => {
                        let mut gm = game_manager.write().await;
                        if let Some(game) = gm.get_game_mut(&game_id) {
                            if let Some(player) = game.get_player_mut(&pid) {
                                // Search for card in all zones and toggle flip state
                                let mut found = false;
                                if let Some(card) = player.hand.iter_mut().find(|c| c.id == card_id) {
                                    card.is_flipped = !card.is_flipped;
                                    found = true;
                                } else if let Some(card) = player.battlefield.iter_mut().find(|c| c.id == card_id) {
                                    card.is_flipped = !card.is_flipped;
                                    found = true;
                                } else if let Some(card) = player.library.iter_mut().find(|c| c.id == card_id) {
                                    card.is_flipped = !card.is_flipped;
                                    found = true;
                                } else if let Some(card) = player.graveyard.iter_mut().find(|c| c.id == card_id) {
                                    card.is_flipped = !card.is_flipped;
                                    found = true;
                                } else if let Some(card) = player.exile.iter_mut().find(|c| c.id == card_id) {
                                    card.is_flipped = !card.is_flipped;
                                    found = true;
                                } else if let Some(card) = player.command_zone.iter_mut().find(|c| c.id == card_id) {
                                    card.is_flipped = !card.is_flipped;
                                    found = true;
                                }
                                if found {
                                    game.broadcast_state();
                                }
                            }
                        }
                    },
                    Message::Copy { player_id: pid, card_id } => {
                        let mut gm = game_manager.write().await;
                        if let Some(game) = gm.get_game_mut(&game_id) {
                            if let Some(player) = game.get_player_mut(&pid) {
                                // Find the card on the battlefield
                                if let Some(card_to_copy) = player.battlefield.iter().find(|c| c.id == card_id) {
                                    // Create a token copy
                                    let token = Card {
                                        id: uuid::Uuid::new_v4().to_string(),
                                        name: card_to_copy.name.clone(),
                                        is_tapped: card_to_copy.is_tapped,
                                        is_flipped: card_to_copy.is_flipped,
                                        is_commander: false,
                                        is_token: true,
                                        position_x: card_to_copy.position_x,
                                        position_y: card_to_copy.position_y,
                                    };
                                    player.battlefield.push(token);
                                    game.broadcast_state();
                                }
                            }
                        }
                    },
                    Message::UntapAll { player_id: pid } => {
                        let mut gm = game_manager.write().await;
                        if let Some(game) = gm.get_game_mut(&game_id) {
                            if let Some(player) = game.get_player_mut(&pid) {
                                // Untap all cards in all zones
                                for card in player.hand.iter_mut() {
                                    card.is_tapped = false;
                                }
                                for card in player.battlefield.iter_mut() {
                                    card.is_tapped = false;
                                }
                                for card in player.library.iter_mut() {
                                    card.is_tapped = false;
                                }
                                for card in player.graveyard.iter_mut() {
                                    card.is_tapped = false;
                                }
                                for card in player.exile.iter_mut() {
                                    card.is_tapped = false;
                                }
                                for card in player.command_zone.iter_mut() {
                                    card.is_tapped = false;
                                }
                                game.broadcast_state();
                            }
                        }
                    },
                    Message::MoveCardOnBattlefield { player_id: pid, card_id, x, y } => {
                        let mut gm = game_manager.write().await;
                        if let Some(game) = gm.get_game_mut(&game_id) {
                            if let Some(player) = game.get_player_mut(&pid) {
                                // Update position of card on battlefield
                                if let Some(card) = player.battlefield.iter_mut().find(|c| c.id == card_id) {
                                    card.position_x = x;
                                    card.position_y = y;
                                    game.broadcast_state();
                                }
                            }
                        }
                    },
                    Message::LeaveTable {} => {
                        let mut gm = game_manager.write().await;
                        if let Some(game) = gm.get_game_mut(&game_id) {
                            // Remove the player from the game
                            game.players.remove(&player_id);
                            // If no players left, delete the game session
                            if game.players.is_empty() {
                                gm.delete_game(&game_id);
                            } else {
                                game.broadcast_state();
                            }
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
                                let _ = tx.send(msg.to_string());
                            }
                        }
                    },
                    Message::LoadLibrary { player_id: pid, card_count, card_type: _ } => {
                        let mut gm = game_manager.write().await;
                        if let Some(game) = gm.get_game_mut(&game_id) {
                            if let Some(player) = game.get_player_mut(&pid) {
                                // Clear all zones before loading
                                player.hand.clear();
                                player.battlefield.clear();
                                player.graveyard.clear();
                                player.exile.clear();
                                player.library.clear();
                                player.command_zone.clear();
                                
                                let lib_count = if card_count > 0 { card_count - 1 } else { 0 };
                                
                                for i in 0..lib_count {
                                    let card = Card {
                                        id: uuid::Uuid::new_v4().to_string(),
                                        name: format!("Blank Card {}", i + 1),
                                        is_tapped: false,
                                        is_flipped: false,
                                        is_commander: false,
                                        is_token: false,
                                        position_x: 0.0,
                                        position_y: 0.0,
                                    };
                                    player.library.push(card);
                                }
                                
                                // Add 1 card to command zone if card_count > 0
                                if card_count > 0 {
                                    let card = Card {
                                        id: uuid::Uuid::new_v4().to_string(),
                                        name: format!("Blank Card {}", card_count),
                                        is_tapped: false,
                                        is_flipped: false,
                                        is_token: false,
                                        is_commander: true,
                                        position_x: 0.0,
                                        position_y: 0.0,
                                    };
                                    player.command_zone.push(card);
                                }
                                
                                game.broadcast_state();
                            }
                        }
                    },
                    Message::ShuffleLibrary { player_id: pid } => {
                        let mut gm = game_manager.write().await;
                        if let Some(game) = gm.get_game_mut(&game_id) {
                            if let Some(player) = game.get_player_mut(&pid) {
                                use rand::seq::SliceRandom;
                                let mut rng = rand::thread_rng();
                                player.library.shuffle(&mut rng);
                                game.broadcast_state();
                            }
                        }
                    },
                    Message::RevealCard { player_id: _, card_id, card_name, zone: _ } => {
                        // Broadcast revealed card to all players
                        let gm = game_manager.read().await;
                        if let Some(game) = gm.get_game(&game_id) {
                            if let Some(tx) = &game.tx {
                                let player_name = game.players.get(&player_id).map(|p| &p.name).unwrap_or(&"Unknown".to_string()).clone();
                                let msg = serde_json::json!({
                                    "RevealCard": {
                                        "card_id": card_id,
                                        "card_name": card_name,
                                        "player_name": player_name
                                    }
                                });
                                let _ = tx.send(msg.to_string());
                            }
                        }
                    },
                    Message::Scry { player_id: _, count: _ } => {
                        // Scry is a private action - no broadcast needed
                        // The frontend already has the library and will show the scry interface
                        // We only process ScryComplete to update the library
                    },
                    Message::ScryComplete { player_id: pid, top_cards, bottom_cards } => {
                        // Reorder library based on scry decisions
                        let mut gm = game_manager.write().await;
                        if let Some(game) = gm.get_game_mut(&game_id) {
                            if let Some(player) = game.get_player_mut(&pid) {
                                // Create mapping of card IDs for lookup
                                let mut remaining_library: Vec<Card> = vec![];
                                
                                // Separate viewed cards from rest of library
                                let mut all_top_bottom: Vec<String> = top_cards.clone();
                                all_top_bottom.extend(bottom_cards.clone());
                                
                                for card in player.library.drain(..) {
                                    if !all_top_bottom.contains(&card.id) {
                                        remaining_library.push(card);
                                    }
                                }
                                
                                // Rebuild library: top cards, then middle, then bottom cards
                                let mut new_library: Vec<Card> = vec![];
                                
                                // Add top cards in order
                                for top_id in &top_cards {
                                    if let Some(pos) = remaining_library.iter().position(|c| &c.id == top_id) {
                                        new_library.push(remaining_library.remove(pos));
                                    }
                                }
                                
                                // Add remaining middle cards
                                new_library.extend(remaining_library);
                                
                                // Add bottom cards in order at the end
                                for bottom_id in &bottom_cards {
                                    if let Some(pos) = new_library.iter().position(|c| &c.id == bottom_id) {
                                        let card = new_library.remove(pos);
                                        new_library.push(card);
                                    }
                                }
                                
                                player.library = new_library;
                                game.broadcast_state();
                            }
                        }
                    },
                    Message::SurveilComplete { player_id: pid, top_cards, graveyard_cards } => {
                        // Reorder library based on surveil decisions
                        let mut gm = game_manager.write().await;
                        if let Some(game) = gm.get_game_mut(&game_id) {
                            if let Some(player) = game.get_player_mut(&pid) {
                                // Create mapping of card IDs for lookup
                                let mut remaining_library: Vec<Card> = vec![];
                                
                                // Separate viewed cards from rest of library
                                let mut all_viewed: Vec<String> = top_cards.clone();
                                all_viewed.extend(graveyard_cards.clone());
                                
                                for card in player.library.drain(..) {
                                    if !all_viewed.contains(&card.id) {
                                        remaining_library.push(card);
                                    }
                                }
                                
                                // Rebuild library: top cards, then middle, then graveyard cards
                                let mut new_library: Vec<Card> = vec![];
                                
                                // Add top cards in order
                                for top_id in &top_cards {
                                    if let Some(pos) = remaining_library.iter().position(|c| &c.id == top_id) {
                                        new_library.push(remaining_library.remove(pos));
                                    }
                                }
                                
                                // Add remaining middle cards
                                new_library.extend(remaining_library);
                                
                                // Move graveyard cards to graveyard
                                for graveyard_id in &graveyard_cards {
                                    if let Some(pos) = new_library.iter().position(|c| &c.id == graveyard_id) {
                                        let card = new_library.remove(pos);
                                        player.graveyard.push(card);
                                    }
                                }
                                
                                player.library = new_library;
                                game.broadcast_state();
                            }
                        }
                    },
                    Message::ManifestCard { player_id: pid, card_id, position_x, position_y } => {
                        // Move a card from library to battlefield face down
                        let mut gm = game_manager.write().await;
                        if let Some(game) = gm.get_game_mut(&game_id) {
                            if let Some(player) = game.get_player_mut(&pid) {
                                // Find and remove card from library
                                if let Some(pos) = player.library.iter().position(|c| c.id == card_id) {
                                    let mut card = player.library.remove(pos);
                                    // Flip the card face down (but keep it as the original card, not a token)
                                    card.is_flipped = true;
                                    // Set position if provided, otherwise use default
                                    if let Some(x) = position_x {
                                        card.position_x = x;
                                    }
                                    if let Some(y) = position_y {
                                        card.position_y = y;
                                    }
                                    player.battlefield.push(card);
                                    game.broadcast_state();
                                }
                            }
                        }
                    },
                    Message::SpawnCard { player_id: pid, set_code, collector_number, card_name, position: _ } => {
                        // Spawn a card token on the battlefield
                        let mut gm = game_manager.write().await;
                        if let Some(game) = gm.get_game_mut(&game_id) {
                            if let Some(player) = game.get_player_mut(&pid) {
                                // Create a token card with the image path
                                let image_path = format!("/GameTableData/Sets/{}/{}/{}.jpg", set_code, set_code, collector_number);
                                let card = Card {
                                    id: format!("token_{}", Uuid::new_v4()),
                                    name: card_name,
                                    image_url: image_path,
                                    is_token: true,
                                    is_flipped: false,
                                    is_tapped: false,
                                    is_commander: false,
                                    position_x: 400.0,  // Center of battlefield
                                    position_y: 300.0,
                                    created_at: chrono::Utc::now(),
                                };
                                player.battlefield.push(card);
                                game.broadcast_state();
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
