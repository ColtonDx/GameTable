# GameTable - Developer Guide

This guide helps you understand and modify the codebase.

## Project Layout

```
backend/
├── Cargo.toml              # Dependencies
└── src/
    ├── main.rs             # Entry point & routing
    ├── game.rs             # Data structures & game logic
    ├── websocket.rs        # WebSocket message handling
    └── handlers.rs         # HTTP endpoints

frontend/
├── package.json            # npm dependencies
├── public/
│   └── index.html          # HTML template
└── src/
    ├── index.js            # React entry point
    ├── App.js              # Root component
    ├── components/         # React components
    │   ├── Lobby.js
    │   ├── GameTable.js
    │   └── PlayerZone.js
    └── styles/             # CSS files
```

---

## Understanding the Flow

### 1. Player Joins Game

```
Browser → click "Create Game"
Browser → GET /game/create
Server  → creates GameSession, returns game_id
Browser → connects ws://localhost:3001/ws/{game_id}/{player_id}
Server  → adds Player to GameSession
Server  → sends GameState message
Browser → renders all 4 player zones with life = 20
```

### 2. Player Updates Life

```
Browser → clicks "+1" button for Player 1
Browser → sends UpdateLife { player_id, delta: 1 }
Server  → updates game state in memory
Server  → broadcasts LifeUpdated { player_id, life: 21 }
Browser → receives message and updates UI
All Browsers → automatically see updated life total
```

### 3. Player Draws Card

```
Browser → types "Forest" in draw box
Browser → clicks "Draw Card"
Browser → sends DrawCard { card_name: "Forest" }
Server  → creates Card with UUID
Server  → adds to current player's hand
Server  → (future: broadcasts CardAdded)
Browser → shows "Forest" in Hand zone
```

---

## Key Data Structures

### Game Session
Location: [backend/src/game.rs](backend/src/game.rs#L47)

```rust
pub struct GameSession {
    pub id: String,                        // UUID
    pub players: HashMap<String, Player>,  // player_id -> Player
    pub current_turn_player: usize,        // Index into players
    pub turn_number: u32,                  // Track turns
    pub created_at: u64,                   // Unix timestamp
}
```

**Methods:**
- `new(game_id)` - Create new session
- `add_player(player)` - Add player
- `update_life(player_id, delta)` - Modify life total
- `move_card(...)` - Move card between zones

### Player
Location: [backend/src/game.rs](backend/src/game.rs#L23)

```rust
pub struct Player {
    pub id: String,
    pub name: String,
    pub life: i32,
    pub hand: Vec<Card>,
    pub battlefield: Vec<Card>,
    pub graveyard: Vec<Card>,
    pub exile: Vec<Card>,
    pub command_zone: Vec<Card>,
    pub is_active: bool,  // For rejoin tracking
}
```

**Methods:**
- `new(id, name)` - Create player
- `get_zone(&zone)` - Read-only zone access
- `get_zone_mut(&zone)` - Mutable zone access

### Card
Location: [backend/src/game.rs](backend/src/game.rs#L11)

```rust
pub struct Card {
    pub id: String,   // UUID - unique per instance
    pub name: String, // Card name
}
```

---

## Common Modifications

### Add a New Card Zone

**Step 1**: Add field to Player struct

```rust
// In backend/src/game.rs
pub struct Player {
    // ... existing fields ...
    pub my_new_zone: Vec<Card>,  // ← ADD THIS
}
```

**Step 2**: Initialize in Player::new()

```rust
impl Player {
    pub fn new(id: String, name: String) -> Self {
        Self {
            // ... existing ...
            my_new_zone: Vec::new(),  // ← ADD THIS
            is_active: true,
        }
    }
}
```

**Step 3**: Add to get_zone() match

```rust
pub fn get_zone(&self, zone: &Zone) -> &Vec<Card> {
    match zone {
        // ... existing ...
        Zone::MyNewZone => &self.my_new_zone,  // ← ADD THIS
    }
}

pub fn get_zone_mut(&mut self, zone: &Zone) -> &mut Vec<Card> {
    match zone {
        // ... existing ...
        Zone::MyNewZone => &mut self.my_new_zone,  // ← ADD THIS
    }
}
```

**Step 4**: Add to Zone enum

```rust
pub enum Zone {
    Hand,
    Battlefield,
    Graveyard,
    Exile,
    CommandZone,
    MyNewZone,  // ← ADD THIS
}
```

**Step 5**: Update frontend PlayerZone.js

```javascript
const zones = [
    // ... existing ...
    { name: 'my_new_zone', label: 'My New Zone' },  // ← ADD THIS
];
```

### Add a New Message Type

**Step 1**: Add variant to Message enum

```rust
// In backend/src/websocket.rs
pub enum Message {
    // ... existing ...
    MyNewAction { data: String },  // ← ADD THIS
    // ... server messages ...
}
```

**Step 2**: Add handler in WebSocket

```rust
// In handle_socket async fn
match client_msg {
    Message::MyNewAction { data } => {
        // Your logic here
        let response = Message::Error { 
            message: "Not implemented yet".to_string() 
        };
        let _ = sender.send(axum::extract::ws::Message::Text(
            serde_json::to_string(&response).unwrap_or_default(),
        )).await;
    },
    // ... other handlers ...
}
```

**Step 3**: Send from frontend

```javascript
// In frontend component
if (ws.current && ws.current.readyState === WebSocket.OPEN) {
    ws.current.send(
        JSON.stringify({
            MyNewAction: { data: "some value" }
        })
    );
}
```

### Add a New HTTP Endpoint

**Step 1**: Add handler in handlers.rs

```rust
// In backend/src/handlers.rs
pub async fn my_endpoint_handler() -> &'static str {
    "Response"
}
```

**Step 2**: Add route in main.rs

```rust
// In main()
let app = Router::new()
    .route("/ws/:game_id/:player_id", get(websocket::ws_handler))
    .route("/health", get(handlers::health_handler))
    .route("/game/create", get(handlers::create_game_handler))
    .route("/my/endpoint", get(handlers::my_endpoint_handler))  // ← ADD THIS
    // ... rest
```

**Step 3**: Call from frontend

```javascript
const response = await fetch('/my/endpoint');
const data = await response.json();
```

### Modify Life Tracking

**Step 1**: Change default life

```rust
// In game.rs Player::new()
pub fn new(id: String, name: String) -> Self {
    Self {
        life: 30,  // ← CHANGE THIS (was 20)
        // ...
    }
}
```

**Step 2**: Add new button values

```javascript
// In frontend GameTable.js
<button onClick={() => updateLife(player.id, -10)} className="btn btn-sm">-10</button>
<button onClick={() => updateLife(player.id, 10)} className="btn btn-sm">+10</button>
```

### Add Card Validation

**Step 1**: Create validation module

```rust
// In backend/src/card.rs (new file)
pub fn is_valid_card_name(name: &str) -> bool {
    !name.is_empty() && name.len() < 100
}
```

**Step 2**: Use in DrawCard handler

```rust
Message::DrawCard { card_name } => {
    if !card::is_valid_card_name(&card_name) {
        let response = Message::Error { 
            message: "Invalid card name".to_string() 
        };
        // Send error...
    } else {
        // Add card to hand...
    }
}
```

---

## Testing Your Changes

### Backend Tests

```bash
cd backend
cargo test

# Test specific function
cargo test game::Player::new
```

### Frontend Hot Reload

```bash
cd frontend
npm start  # Auto-recompiles on file changes
```

### Manual Testing

1. Make change
2. Rebuild/restart
3. Open browser
4. Test feature
5. Check DevTools console for errors

### Check for Errors

```rust
// cargo check - fast syntax check without building
cargo check

// cargo clippy - lint warnings
cargo clippy
```

---

## Debugging Tips

### Backend Logging

```rust
// Add logging
tracing::info!("Player joined: {}", player_id);
tracing::warn!("Invalid state");
tracing::error!("Failed to move card: {}", error);

// Run with logging
RUST_LOG=debug cargo run --release
```

### Frontend Debugging

```javascript
// Browser console
console.log('Game state:', gameState);
console.log('Message:', message);

// DevTools breakpoints
// Click line number to set breakpoint
// Use Step Over/Into to debug

// Network tab
// View WebSocket frames
// See message formats
```

### Common Errors

**"Player not found"**  
- Check player_id matches game records
- Ensure player joined before action

**"WebSocket error"**  
- Check port 3001 available
- Check firewall rules
- Check browser console

**"serde serialization error"**  
- Verify Message enum matches client format
- Check JSON structure

---

## Code Style Guide

### Rust
```rust
// Constants: UPPER_CASE
const MAX_PLAYERS: usize = 4;

// Functions: snake_case
pub fn get_player(&self) -> Option<&Player> { }

// Structs/Enums: PascalCase
pub struct GameSession { }

// Use meaningful variable names
let current_player = game.get_player(&player_id)?;

// Add comments for complex logic
// Move card from source zone to destination
let from_zone = player.get_zone_mut(&from_enum);
from_zone.retain(|c| c.id != card_id);
```

### JavaScript/React
```javascript
// Constants: UPPER_CASE
const GAME_ID = 'abc123';

// Functions: camelCase
const handleJoinGame = () => { };

// Components: PascalCase
const GameTable = () => { };

// Descriptive names
const [gameState, setGameState] = useState(null);

// Comments for complex logic
// Establish WebSocket connection and listen for updates
const wsUrl = `ws://...`;
```

---

## Performance Considerations

### Rust (Backend)

- ✅ Use `Arc<RwLock<>>` for shared state
- ✅ Use `async/await` for I/O
- ✅ Avoid blocking operations
- ⚠️ HashMap lookups are O(1) average

### JavaScript (Frontend)

- ✅ Use React hooks efficiently
- ✅ Avoid re-rendering entire state
- ✅ Use `.map()` for lists
- ⚠️ WebSocket parsing is JSON.parse()

---

## Deployment Changes

### Update Docker image
```bash
docker-compose build --no-cache
docker-compose up
```

### Update dependencies

**Rust:**
```bash
cd backend
cargo update
cargo build --release
```

**Node:**
```bash
cd frontend
npm update
npm run build
```

---

## Architecture Decision Log

### Why Arc<RwLock>?
Multiple WebSocket connections need to share game state safely. Arc allows multiple ownership, RwLock allows concurrent reads and exclusive writes.

### Why in-memory state?
Fast development iteration. For production, add PostgreSQL + Redis.

### Why Axum?
Lightweight, composable, excellent Tokio integration.

### Why React (not Vue/Svelte)?
Larger ecosystem, more game UI examples, easier for team onboarding.

---

## Resources

- [Rust Book](https://doc.rust-lang.org/book/)
- [Tokio Docs](https://tokio.rs/)
- [Axum Examples](https://github.com/tokio-rs/axum/tree/main/examples)
- [React Docs](https://react.dev/)
- [WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)

---

## Getting Help

1. **Check existing code** - Similar patterns likely exist
2. **Read error messages** - Usually very helpful
3. **Use compiler warnings** - `cargo clippy` suggests fixes
4. **Browser console** - JavaScript errors logged
5. **Server logs** - Run with `RUST_LOG=debug`

---

**Last Updated**: January 2026
