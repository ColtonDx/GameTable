use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use std::path::Path;
use tokio::fs;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::Arc;

// Global rate limiter: track last request time
static LAST_REQUEST_TIME: AtomicU64 = AtomicU64::new(0);
const MIN_DELAY_MS: u64 = 75; // 75ms = ~13 requests per second (conservative)

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CardImageUris {
    pub normal: Option<String>,
    pub large: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CardFace {
    pub image_uris: Option<CardImageUris>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScryfallCard {
    pub name: String,
    pub collector_number: String,
    pub set: String,
    pub set_name: String,
    pub layout: String,
    pub image_uris: Option<CardImageUris>,
    pub card_faces: Option<Vec<CardFace>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScryfallResponse {
    pub data: Vec<ScryfallCard>,
    pub has_more: bool,
    pub next_page: Option<String>,
}

async fn rate_limit() {
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_millis() as u64;
    
    let last = LAST_REQUEST_TIME.load(Ordering::SeqCst);
    let elapsed = now.saturating_sub(last);
    
    if elapsed < MIN_DELAY_MS {
        let wait_ms = MIN_DELAY_MS - elapsed;
        tokio::time::sleep(tokio::time::Duration::from_millis(wait_ms)).await;
    }
    
    LAST_REQUEST_TIME.store(
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_millis() as u64,
        Ordering::SeqCst,
    );
}

pub async fn fetch_cards_from_scryfall(set_code: &str) -> Result<Vec<ScryfallCard>, Box<dyn std::error::Error>> {
    let client = reqwest::Client::new();
    let mut cards = Vec::new();
    let mut url = format!("https://api.scryfall.com/cards/search?q=e%3A{}&unique=prints", set_code);

    loop {
        // Apply rate limiting before each request
        rate_limit().await;
        
        tracing::info!("Fetching cards from Scryfall: {}", url);
        
        let response = client
            .get(&url)
            .header("User-Agent", "GameTable/1.0")
            .send()
            .await?;

        let body: ScryfallResponse = response.json().await?;
        cards.extend(body.data);

        if body.has_more && body.next_page.is_some() {
            url = body.next_page.unwrap();
        } else {
            break;
        }
    }

    Ok(cards)
}

pub async fn insert_cards_into_db(
    pool: &PgPool,
    cards: &[ScryfallCard],
) -> Result<usize, Box<dyn std::error::Error>> {
    let mut inserted_count = 0;
    let mut skipped_count = 0;

    for card in cards {
        // Check if card already exists before attempting insert
        let exists: (bool,) = sqlx::query_as(
            "SELECT EXISTS(SELECT 1 FROM cards WHERE name = $1 AND collector_number = $2 AND set_code = $3)"
        )
        .bind(&card.name)
        .bind(&card.collector_number)
        .bind(&card.set)
        .fetch_one(pool)
        .await?;

        if exists.0 {
            tracing::debug!("Card already exists: {} #{} ({})", card.name, card.collector_number, card.set);
            skipped_count += 1;
            continue;
        }

        let is_two_sided = card.layout == "transform" 
            || card.layout == "modal_dfc" 
            || card.layout == "meld"
            || (card.card_faces.is_some() && card.card_faces.as_ref().unwrap().len() > 1);

        let result = sqlx::query(
            r#"
            INSERT INTO cards (name, collector_number, set_code, set_name, is_two_sided)
            VALUES ($1, $2, $3, $4, $5)
            "#
        )
        .bind(&card.name)
        .bind(&card.collector_number)
        .bind(&card.set)
        .bind(&card.set_name)
        .bind(is_two_sided)
        .execute(pool)
        .await?;

        if result.rows_affected() > 0 {
            inserted_count += 1;
            tracing::debug!("Inserted card: {} #{} ({})", card.name, card.collector_number, card.set);
        }
    }

    if skipped_count > 0 {
        tracing::info!("Skipped {} cards that already exist in database", skipped_count);
    }

    Ok(inserted_count)
}

pub async fn download_card_images(
    cards: &[ScryfallCard],
) -> Result<(), Box<dyn std::error::Error>> {
    let client = reqwest::Client::new();

    for card in cards {
        // Create directory structure
        let dir_path = format!("/GameTableData/Sets/{}/{}", card.set, card.set);
        fs::create_dir_all(&dir_path).await?;

        // Download front image
        if let Some(image_uris) = &card.image_uris {
            if let Some(image_url) = &image_uris.normal {
                let front_path = format!("{}/{}.jpg", dir_path, card.collector_number);
                download_image(&client, image_url, &front_path).await?;
            }
        }

        // Download back image for dual-faced cards
        let is_two_sided = card.layout == "transform" 
            || card.layout == "modal_dfc" 
            || card.layout == "meld";

        if is_two_sided && card.card_faces.is_some() {
            let card_faces = card.card_faces.as_ref().unwrap();
            if card_faces.len() > 1 {
                if let Some(back_face) = card_faces.get(1) {
                    if let Some(back_uris) = &back_face.image_uris {
                        if let Some(back_url) = &back_uris.normal {
                            let back_path = format!("{}/{}-b.jpg", dir_path, card.collector_number);
                            download_image(&client, back_url, &back_path).await?;
                        }
                    }
                }
            }
        }
    }

    Ok(())
}

async fn download_image(client: &reqwest::Client, url: &str, path: &str) -> Result<(), Box<dyn std::error::Error>> {
    // Check if file already exists
    if Path::new(path).exists() {
        tracing::debug!("Image already exists, skipping: {}", path);
        return Ok(());
    }

    // Apply rate limiting before image download
    rate_limit().await;

    tracing::info!("Downloading image to: {}", path);
    
    let response = client
        .get(url)
        .header("User-Agent", "GameTable/1.0")
        .send()
        .await?;

    if !response.status().is_success() {
        tracing::warn!("Failed to download image from {}: {}", url, response.status());
        return Ok(()); // Don't fail the entire sync if one image fails
    }

    let bytes = response.bytes().await?;
    
    // Ensure directory exists
    if let Some(parent) = Path::new(path).parent() {
        fs::create_dir_all(parent).await?;
    }
    
    fs::write(path, bytes).await?;
    tracing::debug!("Successfully downloaded image: {}", path);

    Ok(())
}

pub async fn sync_all_sets(pool: &PgPool, set_codes: &[String]) -> Result<(), Box<dyn std::error::Error>> {
    for set_code in set_codes {
        tracing::info!("Syncing set: {}", set_code);
        
        match fetch_cards_from_scryfall(set_code).await {
            Ok(cards) => {
                tracing::info!("Fetched {} cards from set {}", cards.len(), set_code);
                
                match insert_cards_into_db(pool, &cards).await {
                    Ok(inserted) => {
                        if inserted > 0 {
                            tracing::info!("Inserted {} new cards from set {}", inserted, set_code);
                        } else {
                            tracing::info!("No new cards to insert for set {} (all already in database)", set_code);
                        }
                    }
                    Err(e) => {
                        tracing::error!("Failed to insert cards for set {}: {}", set_code, e);
                    }
                }

                match download_card_images(&cards).await {
                    Ok(_) => {
                        tracing::info!("Processed images for set {} (skipped existing files)", set_code);
                    }
                    Err(e) => {
                        tracing::error!("Failed to download images for set {}: {}", set_code, e);
                    }
                }
            }
            Err(e) => {
                tracing::error!("Failed to fetch cards from Scryfall for set {}: {}", set_code, e);
            }
        }
    }

    Ok(())
}

