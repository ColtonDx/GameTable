use axum::{
    extract::{State, Query},
    http::StatusCode,
    response::Json,
};
use serde::{Deserialize, Serialize};
use serde_json::json;

use crate::users::{LoginRequest, RegisterRequest, ResetPasswordRequest, AuthResponse, create_user, verify_user, user_exists, reset_password};
use crate::AppState;

#[derive(Debug, Serialize, Deserialize)]
pub struct CardQuery {
    pub set_code: String,
    pub collector_number: String,
}

#[derive(Debug, Serialize)]
pub struct CardResponse {
    pub found: bool,
    pub name: Option<String>,
    pub image_path: Option<String>,
    pub is_two_sided: Option<bool>,
    pub message: String,
}

pub async fn health_handler() -> &'static str {
    "OK"
}

pub async fn create_game_handler(
    State(state): State<AppState>,
) -> (StatusCode, Json<serde_json::Value>) {
    let mut gm = state.game_manager.write().await;
    let game_id = gm.create_game();

    (
        StatusCode::CREATED,
        Json(json!({
            "game_id": game_id,
            "message": "Game created successfully"
        })),
    )
}

pub async fn register_handler(
    State(state): State<AppState>,
    Json(payload): Json<RegisterRequest>,
) -> (StatusCode, Json<AuthResponse>) {
    let pool = state.db_pool.as_ref();

    // Check if user already exists
    match user_exists(pool, &payload.username).await {
        Ok(true) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(AuthResponse {
                    success: false,
                    message: "Username already exists".to_string(),
                    user: None,
                }),
            );
        }
        Err(e) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(AuthResponse {
                    success: false,
                    message: format!("Database error: {}", e),
                    user: None,
                }),
            );
        }
        _ => {}
    }

    // Create new user
    match create_user(pool, &payload.username, &payload.password).await {
        Ok(user) => (
            StatusCode::CREATED,
            Json(AuthResponse {
                success: true,
                message: "User created successfully".to_string(),
                user: Some(user),
            }),
        ),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(AuthResponse {
                success: false,
                message: format!("Failed to create user: {}", e),
                user: None,
            }),
        ),
    }
}

pub async fn login_handler(
    State(state): State<AppState>,
    Json(payload): Json<LoginRequest>,
) -> (StatusCode, Json<AuthResponse>) {
    let pool = state.db_pool.as_ref();

    match verify_user(pool, &payload.username, &payload.password).await {
        Ok(user) => (
            StatusCode::OK,
            Json(AuthResponse {
                success: true,
                message: "Login successful".to_string(),
                user: Some(user),
            }),
        ),
        Err(e) => (
            StatusCode::UNAUTHORIZED,
            Json(AuthResponse {
                success: false,
                message: format!("Login failed: {}", e),
                user: None,
            }),
        ),
    }
}

pub async fn reset_password_handler(
    State(state): State<AppState>,
    Json(payload): Json<ResetPasswordRequest>,
) -> (StatusCode, Json<AuthResponse>) {
    let pool = state.db_pool.as_ref();

    match reset_password(pool, &payload.username, &payload.new_password).await {
        Ok(_) => (
            StatusCode::OK,
            Json(AuthResponse {
                success: true,
                message: "Password reset successfully".to_string(),
                user: None,
            }),
        ),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(AuthResponse {
                success: false,
                message: format!("Password reset failed: {}", e),
                user: None,
            }),
        ),
    }
}
pub async fn query_card_handler(
    State(state): State<AppState>,
    Query(params): Query<CardQuery>,
) -> (StatusCode, Json<CardResponse>) {
    let pool = state.db_pool.as_ref();

    tracing::info!("Querying card: set_code={}, collector_number={}", params.set_code, params.collector_number);

    match sqlx::query_as::<_, (String, bool)>(
        "SELECT name, is_two_sided FROM cards WHERE set_code = $1 AND collector_number = $2 LIMIT 1"
    )
    .bind(&params.set_code)
    .bind(&params.collector_number)
    .fetch_optional(pool)
    .await
    {
        Ok(Some((name, is_two_sided))) => {
            tracing::info!("Card found: {}", name);
            let image_path = format!("/GameTableData/Sets/{}/{}/{}.jpg", params.set_code, params.set_code, params.collector_number);
            (
                StatusCode::OK,
                Json(CardResponse {
                    found: true,
                    name: Some(name),
                    image_path: Some(image_path),
                    is_two_sided: Some(is_two_sided),
                    message: "Card found".to_string(),
                }),
            )
        }
        Ok(None) => {
            tracing::warn!("Card not found: set_code={}, collector_number={}", params.set_code, params.collector_number);
            (
                StatusCode::NOT_FOUND,
                Json(CardResponse {
                    found: false,
                    name: None,
                    image_path: None,
                    is_two_sided: None,
                    message: "Card not found".to_string(),
                }),
            )
        }
        Err(e) => {
            tracing::error!("Database error querying card: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(CardResponse {
                    found: false,
                    name: None,
                    image_path: None,
                    is_two_sided: None,
                    message: format!("Database error: {}", e),
                }),
            )
        }
    }
}

pub async fn search_cards_handler(
    State(state): State<AppState>,
    Query(params): Query<serde_json::Value>,
) -> (StatusCode, Json<serde_json::Value>) {
    let pool = state.db_pool.as_ref();

    let query = params.get("q")
        .and_then(|v| v.as_str())
        .unwrap_or("");

    let set_code = params.get("set_code")
        .and_then(|v| v.as_str());

    let limit = 50;

    tracing::info!("Searching cards: query={}, set_code={:?}", query, set_code);

    let results = if let Some(set) = set_code {
        sqlx::query_as::<_, (String, String)>(
            "SELECT name, collector_number FROM cards WHERE set_code = $1 AND name ILIKE $2 LIMIT $3"
        )
        .bind(set)
        .bind(format!("%{}%", query))
        .bind(limit as i64)
        .fetch_all(pool)
        .await
    } else {
        sqlx::query_as::<_, (String, String)>(
            "SELECT DISTINCT name, collector_number FROM cards WHERE name ILIKE $1 LIMIT $2"
        )
        .bind(format!("%{}%", query))
        .bind(limit as i64)
        .fetch_all(pool)
        .await
    };

    match results {
        Ok(cards) => {
            tracing::info!("Search found {} cards", cards.len());
            (
                StatusCode::OK,
                Json(json!({
                    "success": true,
                    "cards": cards.iter().map(|(name, collector_number)| {
                        json!({
                            "name": name,
                            "collector_number": collector_number,
                        })
                    }).collect::<Vec<_>>()
                })),
            )
        }
        Err(e) => {
            tracing::error!("Search error: {}", e);
        Err(e) => {
            tracing::error!("Search error: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({
                    "success": false,
                    "message": format!("Search failed: {}", e),
                    "cards": []
                })),
            )
        }
    }
}