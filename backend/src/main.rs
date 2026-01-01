mod game;
mod websocket;
mod handlers;

use axum::{
    extract::DefaultBodyLimit,
    http::Method,
    routing::get,
    Router,
};
use std::sync::Arc;
use tokio::sync::RwLock;
use tower_http::cors::{AllowOrigin, CorsLayer};
use tracing_subscriber;

use game::GameManager;

#[tokio::main]
async fn main() {
    // Initialize tracing
    tracing_subscriber::fmt::init();

    let game_manager = Arc::new(RwLock::new(GameManager::new()));

    let cors = CorsLayer::permissive();

    let app = Router::new()
        .route("/ws/:game_id/:player_id", get(websocket::ws_handler))
        .route("/health", get(handlers::health_handler))
        .route("/game/create", get(handlers::create_game_handler))
        .layer(cors)
        .layer(DefaultBodyLimit::max(1024))
        .with_state(game_manager.clone());

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3001")
        .await
        .expect("Failed to bind to port 3001");

    tracing::info!("Server running on ws://0.0.0.0:3001");

    axum::serve(listener, app)
        .await
        .expect("Server error");
}
