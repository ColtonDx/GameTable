mod game;
mod websocket_new;
mod handlers;
mod users;
mod upload;
mod scryfall;

// Re-export websocket_new as websocket for compatibility
use websocket_new as websocket;

use axum::{
    extract::DefaultBodyLimit,
    routing::{get, post},
    Router,
};
use std::sync::Arc;
use tokio::sync::RwLock;
use tower_http::cors::CorsLayer;
use tower_http::services::ServeDir;
use tracing_subscriber;
use sqlx::postgres::PgPool;
use std::path::Path;

use game::GameManager;

#[derive(Clone)]
pub struct AppState {
    pub game_manager: Arc<RwLock<GameManager>>,
    pub db_pool: Arc<PgPool>,
}

#[tokio::main]
async fn main() {
    // Initialize tracing
    tracing_subscriber::fmt::init();

    // Initialize database
    let database_url = std::env::var("DATABASE_URL")
        .unwrap_or_else(|_| "postgres://gametable:gametable_dev_pass@localhost:5432/gametable_db".to_string());
    
    let pool = PgPool::connect(&database_url)
        .await
        .expect("Failed to connect to database");

    // Run migrations
    sqlx::query(
        "CREATE TABLE IF NOT EXISTS users (
            id UUID PRIMARY KEY,
            username VARCHAR(255) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )"
    )
    .execute(&pool)
    .await
    .expect("Failed to create users table");

    sqlx::query(
        "CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)"
    )
    .execute(&pool)
    .await
    .expect("Failed to create index");

    // Create cards table
    sqlx::query(
        "CREATE TABLE IF NOT EXISTS cards (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            collector_number VARCHAR(20) NOT NULL,
            set_code VARCHAR(10) NOT NULL,
            set_name VARCHAR(255) NOT NULL,
            is_two_sided BOOLEAN NOT NULL DEFAULT false,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(name, collector_number, set_code)
        )"
    )
    .execute(&pool)
    .await
    .expect("Failed to create cards table");

    sqlx::query(
        "CREATE INDEX IF NOT EXISTS idx_cards_set_collector ON cards(set_code, collector_number)"
    )
    .execute(&pool)
    .await
    .expect("Failed to create index");

    sqlx::query(
        "CREATE INDEX IF NOT EXISTS idx_cards_set_code ON cards(set_code)"
    )
    .execute(&pool)
    .await
    .expect("Failed to create index");

    sqlx::query(
        "CREATE INDEX IF NOT EXISTS idx_cards_name ON cards(name)"
    )
    .execute(&pool)
    .await
    .expect("Failed to create index");

    // Sync Scryfall cards
    tracing::info!("Starting Scryfall card sync...");
    let pool_clone = pool.clone();
    tokio::spawn(async move {
        if let Ok(setcodes_content) = tokio::fs::read_to_string("/GameTableData/General/setcodes.txt").await {
            let set_codes: Vec<String> = setcodes_content
                .lines()
                .map(|s| s.trim().to_string())
                .filter(|s| !s.is_empty())
                .collect();

            if !set_codes.is_empty() {
                if let Err(e) = scryfall::sync_all_sets(&pool_clone, &set_codes).await {
                    tracing::error!("Failed to sync Scryfall cards: {}", e);
                }
            }
        } else {
            tracing::warn!("setcodes.txt not found, skipping card sync");
        }
    });

    let game_manager = Arc::new(RwLock::new(GameManager::new()));

    let state = AppState {
        game_manager,
        db_pool: Arc::new(pool),
    };

    let cors = CorsLayer::permissive();

    // API routes
    let api_routes = Router::new()
        .route("/health", get(handlers::health_handler))
        .route("/game/create", get(handlers::create_game_handler))
        .route("/auth/register", post(handlers::register_handler))
        .route("/auth/login", post(handlers::login_handler))
        .route("/auth/reset-password", post(handlers::reset_password_handler))
        .route("/cards/query", get(handlers::query_card_handler))
        .route("/cards/search", get(handlers::search_cards_handler))
        .route("/upload", post(upload::upload_handler))
        .route("/ws/:game_id/:player_id/:player_name", get(websocket::ws_handler))
        .with_state(state.clone());

    // Serve card images from /GameTableData
    let card_data_routes = Router::new()
        .nest_service("/GameTableData", ServeDir::new("/GameTableData"));

    // Serve static files from /app/public (React build output)
    let static_routes = Router::new()
        .nest_service("/", ServeDir::new("/app/public"))
        .fallback_service(ServeDir::new("/app/public"));

    // Combine routes
    let app = Router::new()
        .nest("/", api_routes)
        .nest("/", card_data_routes)
        .fallback_service(static_routes)
        .layer(cors)
        .layer(DefaultBodyLimit::max(1024 * 1024 * 50));  // 50MB for file uploads

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3001")
        .await
        .expect("Failed to bind to port 3001");

    tracing::info!("Server running on http://0.0.0.0:3001");

    axum::serve(listener, app)
        .await
        .expect("Server error");
}
