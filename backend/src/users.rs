use serde::{Deserialize, Serialize};
use sqlx::{postgres::PgPool, Row};
use uuid::Uuid;
use std::fs;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct User {
    pub id: String,
    pub username: String,
    pub profile_picture_url: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct LoginRequest {
    pub username: String,
    pub password: String,
}

#[derive(Debug, Deserialize)]
pub struct RegisterRequest {
    pub username: String,
    pub password: String,
}

#[derive(Debug, Serialize)]
pub struct AuthResponse {
    pub success: bool,
    pub message: String,
    pub user: Option<User>,
}

#[derive(Debug, Deserialize)]
pub struct ResetPasswordRequest {
    pub username: String,
    pub new_password: String,
}

pub async fn create_user(
    pool: &PgPool,
    username: &str,
    password: &str,
) -> Result<User, String> {
    // Hash password
    let hashed_password = bcrypt::hash(password, 10)
        .map_err(|e| format!("Failed to hash password: {}", e))?;

    let user_id = Uuid::new_v4();

    sqlx::query(
        "INSERT INTO users (id, username, password_hash) VALUES ($1, $2, $3)",
    )
    .bind(user_id)
    .bind(username)
    .bind(&hashed_password)
    .execute(pool)
    .await
    .map_err(|e| format!("Failed to create user: {}", e))?;

    // Create user directory
    let user_dir = format!("/GameTableData/Players/{}", username);
    fs::create_dir_all(&user_dir)
        .map_err(|e| format!("Failed to create user directory: {}", e))?;

    // Copy blank.jpg as default sleeve
    let blank_source = "/GameTableData/General/blank.jpg";
    let sleeve_dest = format!("{}/sleeve.jpg", user_dir);
    
    if let Err(e) = fs::copy(blank_source, &sleeve_dest) {
        // Don't fail the user creation if we can't copy the default sleeve
        eprintln!("Warning: Failed to copy default sleeve for {}: {}", username, e);
    }

    Ok(User {
        id: user_id.to_string(),
        username: username.to_string(),
        profile_picture_url: None,
    })
}

pub async fn verify_user(
    pool: &PgPool,
    username: &str,
    password: &str,
) -> Result<User, String> {
    let row = sqlx::query("SELECT id, username, password_hash FROM users WHERE username = $1")
        .bind(username)
        .fetch_optional(pool)
        .await
        .map_err(|e| format!("Database error: {}", e))?
        .ok_or("User not found")?;

    let user_id: Uuid = row.get("id");
    let stored_hash: String = row.get("password_hash");

    if bcrypt::verify(password, &stored_hash)
        .map_err(|e| format!("Verification error: {}", e))?
    {
        Ok(User {
            id: user_id.to_string(),
            username: username.to_string(),
            profile_picture_url: None,
        })
    } else {
        Err("Invalid password".to_string())
    }
}

pub async fn user_exists(pool: &PgPool, username: &str) -> Result<bool, String> {
    let row = sqlx::query("SELECT COUNT(*) as count FROM users WHERE username = $1")
        .bind(username)
        .fetch_one(pool)
        .await
        .map_err(|e| format!("Database error: {}", e))?;

    let count: i64 = row.get("count");
    Ok(count > 0)
}

pub async fn reset_password(
    pool: &PgPool,
    username: &str,
    new_password: &str,
) -> Result<(), String> {
    let hashed_password = bcrypt::hash(new_password, 10)
        .map_err(|e| format!("Failed to hash password: {}", e))?;

    let result = sqlx::query("UPDATE users SET password_hash = $1 WHERE username = $2")
        .bind(&hashed_password)
        .bind(username)
        .execute(pool)
        .await
        .map_err(|e| format!("Database error: {}", e))?;

    if result.rows_affected() == 0 {
        Err("User not found".to_string())
    } else {
        Ok(())
    }
}

pub async fn is_admin(username: &str) -> Result<bool, String> {
    use std::fs;
    use std::path::Path;

    let admin_file = Path::new("/GameTableData/General/admins.txt");
    
    if !admin_file.exists() {
        return Ok(false);
    }

    let content = fs::read_to_string(admin_file)
        .map_err(|e| format!("Failed to read admins.txt: {}", e))?;

    Ok(content
        .lines()
        .map(|line| line.trim())
        .any(|line| line == username))
}
