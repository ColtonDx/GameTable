use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use uuid::Uuid;

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
    pub battlefield: Vec<Card>,
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
            battlefield: Vec::new(),
            graveyard: Vec::new(),
            exile: Vec::new(),
            command_zone: Vec::new(),
            is_active: true,
        }
    }

    pub fn get_zone(&self, zone: &Zone) -> &Vec<Card> {
        match zone {
            Zone::Hand => &self.hand,
            Zone::Battlefield => &self.battlefield,
            Zone::Graveyard => &self.graveyard,
            Zone::Exile => &self.exile,
            Zone::CommandZone => &self.command_zone,
        }
    }

    pub fn get_zone_mut(&mut self, zone: &Zone) -> &mut Vec<Card> {
        match zone {
            Zone::Hand => &mut self.hand,
            Zone::Battlefield => &mut self.battlefield,
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
    pub current_turn_player: usize,
    pub turn_number: u32,
    pub created_at: u64,
}

impl GameSession {
    pub fn new(game_id: String) -> Self {
        Self {
            id: game_id,
            players: HashMap::new(),
            current_turn_player: 0,
            turn_number: 1,
            created_at: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs(),
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
        let game_id = Uuid::new_v4().to_string();
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
