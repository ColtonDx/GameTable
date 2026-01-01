use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use uuid::Uuid;
use tokio::sync::broadcast;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Card {
    pub id: String,
    pub name: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum Zone {
    Hand,
    Battlefield,
    Graveyard,
    Exile,
    CommandZone,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Player {
    pub id: String,
    pub name: String,
    pub life: i32,
    pub hand: Vec<Card>,
    pub graveyard: Vec<Card>,
    pub exile: Vec<Card>,
    pub command_zone: Vec<Card>,
    pub is_active: bool,
}

impl Player {
    pub fn new(id: String, name: String) -> Self {
        Self {
            id,
            name,
            life: 20,
            hand: Vec::new(),
            graveyard: Vec::new(),
            exile: Vec::new(),
            command_zone: Vec::new(),
            is_active: true,
        }
    }

    pub fn get_zone(&self, zone: &Zone) -> &Vec<Card> {
        match zone {
            Zone::Hand => &self.hand,
            Zone::Battlefield => &self.hand,
            Zone::Graveyard => &self.graveyard,
            Zone::Exile => &self.exile,
            Zone::CommandZone => &self.command_zone,
        }
    }

    pub fn get_zone_mut(&mut self, zone: &Zone) -> &mut Vec<Card> {
        match zone {
            Zone::Hand => &mut self.hand,
            Zone::Battlefield => &mut self.hand,
            Zone::Graveyard => &mut self.graveyard,
            Zone::Exile => &mut self.exile,
            Zone::CommandZone => &mut self.command_zone,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GameSession {
    pub id: String,
    pub players: HashMap<String, Player>,
    pub battlefield: Vec<Card>,
    pub current_turn_player: usize,
    pub turn_number: u32,
    pub created_at: u64,
    #[serde(skip)]
    pub tx: Option<broadcast::Sender<String>>,
}

impl GameSession {
    pub fn new(game_id: String) -> Self {
        let (tx, _) = broadcast::channel(100);
        Self {
            id: game_id,
            players: HashMap::new(),
            battlefield: Vec::new(),
            current_turn_player: 0,
            turn_number: 1,
            created_at: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs(),
            tx: Some(tx),
        }
    }

    pub fn add_player(&mut self, player: Player) {
        self.players.insert(player.id.clone(), player);
    }

    pub fn get_player(&self, player_id: &str) -> Option<&Player> {
        self.players.get(player_id)
    }

    pub fn get_player_mut(&mut self, player_id: &str) -> Option<&mut Player> {
        self.players.get_mut(player_id)
    }

    pub fn update_life(&mut self, player_id: &str, life_delta: i32) -> Result<i32, String> {
        if let Some(player) = self.get_player_mut(player_id) {
            player.life += life_delta;
            Ok(player.life)
        } else {
            Err(format!("Player {} not found", player_id))
        }
    }

    pub fn move_card(
        &mut self,
        player_id: &str,
        card_id: &str,
        from_zone: Zone,
        to_zone: Zone,
    ) -> Result<(), String> {
        if let Some(player) = self.get_player_mut(player_id) {
            let from = player.get_zone(&from_zone);
            let card = from
                .iter()
                .find(|c| c.id == card_id)
                .ok_or("Card not found")?
                .clone();

            // Remove from source zone
            let from_zone_vec = player.get_zone_mut(&from_zone);
            from_zone_vec.retain(|c| c.id != card_id);

            // Add to destination zone
            let to_zone_vec = player.get_zone_mut(&to_zone);
            to_zone_vec.push(card);

            Ok(())
        } else {
            Err(format!("Player {} not found", player_id))
        }
    }

    pub fn broadcast_state(&self) {
        if let Some(tx) = &self.tx {
            let state_json = serde_json::to_string(&self).unwrap_or_default();
            let msg = serde_json::json!({
                "GameState": {
                    "state": state_json
                }
            }).to_string();
            let _ = tx.send(msg);
        }
    }
}

pub struct GameManager {
    games: HashMap<String, GameSession>,
}

impl GameManager {
    pub fn new() -> Self {
        Self {
            games: HashMap::new(),
        }
    }

    pub fn create_game(&mut self) -> String {
        let game_id = generate_short_id();
        self.games.insert(game_id.clone(), GameSession::new(game_id.clone()));
        game_id
    }

    pub fn get_game(&self, game_id: &str) -> Option<&GameSession> {
        self.games.get(game_id)
    }

    pub fn get_game_mut(&mut self, game_id: &str) -> Option<&mut GameSession> {
        self.games.get_mut(game_id)
    }

    pub fn delete_game(&mut self, game_id: &str) {
        self.games.remove(game_id);
    }
}

fn generate_short_id() -> String {
    use std::fmt::Write;
    let uuid = Uuid::new_v4();
    let bytes = uuid.as_bytes();
    let mut result = String::new();
    for i in 0..2 {
        write!(&mut result, "{:02X}", bytes[i]).unwrap();
    }
    result
}
