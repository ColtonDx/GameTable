use axum::{
    extract::State,
    http::StatusCode,
    response::Json,
};
use serde_json::json;
use std::sync::Arc;
use tokio::sync::RwLock;

use crate::game::GameManager;
use crate::users::{LoginRequest, RegisterRequest, ResetPasswordRequest, AuthResponse, create_user, verify_user, user_exists, reset_password, is_admin};
use crate::AppState;

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
    let pool = &*state.db_pool;

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
    let pool = &*state.db_pool;

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
    let pool = &*state.db_pool;

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
