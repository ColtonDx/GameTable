use axum::{
    extract::{Multipart, State},
    http::StatusCode,
    Json,
};
use serde::Serialize;
use std::fs;

use crate::AppState;

#[derive(Serialize)]
pub struct UploadResponse {
    pub success: bool,
    pub message: String,
}

pub async fn upload_handler(
    State(_state): State<AppState>,
    mut multipart: Multipart,
) -> (StatusCode, Json<UploadResponse>) {
    let mut username = String::new();
    let mut upload_type = String::new();
    let mut file_data: Option<Vec<u8>> = None;
    let mut file_name = String::new();

    // Parse multipart form data
    while let Ok(Some(field)) = multipart.next_field().await {
        let field_name = field.name().unwrap_or("").to_string();
        
        if field_name == "username" {
            username = field.text().await.unwrap_or_default();
        } else if field_name == "type" {
            upload_type = field.text().await.unwrap_or_default();
        } else if field_name == "file" {
            let file_name_opt = field.file_name().map(|s| s.to_string());
            let bytes = field.bytes().await.unwrap_or_default();
            
            if let Some(name) = file_name_opt {
                file_name = name;
                file_data = Some(bytes.to_vec());
            }
        }
    }

    // Validate inputs
    if username.is_empty() || upload_type.is_empty() || file_data.is_none() {
        return (
            StatusCode::BAD_REQUEST,
            Json(UploadResponse {
                success: false,
                message: "Missing required fields".to_string(),
            }),
        );
    }

    let file_data = file_data.unwrap();

    // Validate file type
    if !file_name.to_lowercase().ends_with(".jpg") 
        && !file_name.to_lowercase().ends_with(".jpeg") {
        return (
            StatusCode::BAD_REQUEST,
            Json(UploadResponse {
                success: false,
                message: "Only JPG files are allowed".to_string(),
            }),
        );
    }

    // Validate file size (25MB)
    if file_data.len() > 25 * 1024 * 1024 {
        return (
            StatusCode::BAD_REQUEST,
            Json(UploadResponse {
                success: false,
                message: "File size exceeds 25MB limit".to_string(),
            }),
        );
    }

    // Create user directory if it doesn't exist
    let user_dir = format!("/GameTableData/Players/{}", username);
    if let Err(e) = fs::create_dir_all(&user_dir) {
        return (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(UploadResponse {
                success: false,
                message: format!("Failed to create user directory: {}", e),
            }),
        );
    }

    // Determine target filename
    let target_filename = match upload_type.as_str() {
        "profile-picture" => "profile.jpg",
        "card-sleeve" => "sleeve.jpg",
        "playmat" => "playmat.jpg",
        _ => {
            return (
                StatusCode::BAD_REQUEST,
                Json(UploadResponse {
                    success: false,
                    message: "Invalid upload type".to_string(),
                }),
            );
        }
    };

    let file_path = format!("{}/{}", user_dir, target_filename);

    // Write file
    match fs::write(&file_path, &file_data) {
        Ok(_) => (
            StatusCode::OK,
            Json(UploadResponse {
                success: true,
                message: format!("File uploaded successfully to {}", file_path),
            }),
        ),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(UploadResponse {
                success: false,
                message: format!("Failed to save file: {}", e),
            }),
        ),
    }
}
