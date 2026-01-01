use axum::{
    extract::State,
    http::StatusCode,
    response::Json,
};
use serde_json::json;
use std::sync::Arc;
use tokio::sync::RwLock;

use crate::game::GameManager;

pub async fn health_handler() -> &'static str {
    "OK"
}

pub async fn create_game_handler(
    State(game_manager): State<Arc<RwLock<GameManager>>>,
) -> (StatusCode, Json<serde_json::Value>) {
    let mut gm = game_manager.write().await;
    let game_id = gm.create_game();

    (
        StatusCode::CREATED,
        Json(json!({
            "game_id": game_id,
            "message": "Game created successfully"
        })),
    )
}
