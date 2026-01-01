# GameTable Setup & Architecture Guide

## Overview

This is a **prototype** for a 4-player browser-based card game inspired by Magic: The Gathering. The system is designed for real-time gameplay with remote players, state persistence for rejoin capability, and an intuitive web interface.

---

## Tech Stack Decision

### Why Rust + React?

**Backend (Rust + Tokio + Axum)**
- ✅ High performance for concurrent WebSocket connections
- ✅ Memory safe with compile-time guarantees
- ✅ Excellent async/await story via Tokio
- ✅ Minimal overhead for real-time message handling
- ✅ Great for distributed systems

**Frontend (React 18)**
- ✅ Component-based UI architecture
- ✅ Efficient re-rendering
- ✅ Large ecosystem for game UI patterns
- ✅ WebSocket support via native browser APIs
- ✅ Easy to extend with drag-and-drop, animations later

---

## Architecture Diagram

```
┌─────────────────────────────────────────┐
│         Browser Clients (React)         │
│  Player 1 | Player 2 | Player 3 | Player 4│
└──────────────┬────────────────────────────┘
               │ WebSocket
               │ (bidirectional)
               ▼
┌─────────────────────────────────────────┐
│   Axum Web Server (Rust + Tokio)        │
│                                         │
│  ┌──────────────────────────────────┐  │
│  │  Game Manager (Arc<RwLock>)      │  │
│  │  - Game Sessions HashMap         │  │
│  │  - Player State                  │  │
│  │  - Card Zones                    │  │
│  └──────────────────────────────────┘  │
│                                         │
│  ┌──────────────────────────────────┐  │
│  │  WebSocket Handler               │  │
│  │  - Message routing               │  │
│  │  - State updates                 │  │
│  │  - Broadcasting                  │  │
│  └──────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

---

## Core Data Structures

### Game Session
```rust
pub struct GameSession {
    pub id: String,              // Unique game ID
    pub players: HashMap<String, Player>,
    pub current_turn_player: usize,
    pub turn_number: u32,
    pub created_at: u64,         // Unix timestamp
}
```

### Player
```rust
pub struct Player {
    pub id: String,
    pub name: String,
    pub life: i32,               // Current life total
    pub hand: Vec<Card>,
    pub battlefield: Vec<Card>,
    pub graveyard: Vec<Card>,
    pub exile: Vec<Card>,
    pub command_zone: Vec<Card>,
    pub is_active: bool,         // For rejoin tracking
}
```

### Card
```rust
pub struct Card {
    pub id: String,              // UUID for this instance
    pub name: String,            // Card name
}
```

---

## Communication Protocol (WebSocket)

### Server → Client Messages

**GameState** (sent on connection)
```json
{
  "GameState": {
    "state": "{...full game JSON...}"
  }
}
```

**LifeUpdated** (when life changes)
```json
{
  "LifeUpdated": {
    "player_id": "player_123",
    "life": 17
  }
}
```

**CardMoved**
```json
{
  "CardMoved": {
    "player_id": "player_123",
    "card_id": "card_456",
    "from_zone": "hand",
    "to_zone": "battlefield"
  }
}
```

### Client → Server Messages

**UpdateLife**
```json
{
  "UpdateLife": {
    "player_id": "player_123",
    "delta": -3
  }
}
```

**MoveCard**
```json
{
  "MoveCard": {
    "card_id": "card_456",
    "from_zone": "hand",
    "to_zone": "battlefield"
  }
}
```

**DrawCard**
```json
{
  "DrawCard": {
    "card_name": "Lightning Bolt"
  }
}
```

---

## Project Structure

```
GameTable/
│
├── backend/                          # Rust Axum server
│   ├── Cargo.toml                   # Dependencies & config
│   ├── src/
│   │   ├── main.rs                  # Server setup, routes
│   │   ├── game.rs                  # Game logic & data structures
│   │   ├── websocket.rs             # WebSocket handler
│   │   └── handlers.rs              # HTTP endpoint handlers
│   └── target/                      # Build artifacts (git ignored)
│
├── frontend/                        # React TypeScript app
│   ├── package.json                 # Dependencies
│   ├── public/
│   │   └── index.html               # HTML entry point
│   ├── src/
│   │   ├── index.js                 # React DOM render
│   │   ├── App.js                   # Main component
│   │   ├── components/
│   │   │   ├── Lobby.js             # Game lobby & join
│   │   │   ├── GameTable.js         # Main game view
│   │   │   └── PlayerZone.js        # Player card zones
│   │   └── styles/
│   │       ├── index.css
│   │       ├── Lobby.css
│   │       ├── GameTable.css
│   │       └── PlayerZone.css
│   └── node_modules/                # Dependencies (git ignored)
│
├── Dockerfile                       # Multi-stage build
├── docker-compose.yml              # Single container setup
├── .gitignore
├── .dockerignore
├── build.sh                        # Helper build script
└── SETUP.md                        # This file
```

---

## Running the Application

### Option 1: Docker (Recommended)

```bash
cd GameTable
docker-compose up --build
```

Then open `http://localhost:3001` in your browser.

### Option 2: Manual Local Setup

#### Terminal 1 - Backend
```bash
cd backend
cargo build --release
cargo run --release
# Listens on ws://0.0.0.0:3001
```

#### Terminal 2 - Frontend
```bash
cd frontend
npm install
npm start
# Listens on http://localhost:3000
# Auto-proxies API calls to localhost:3001
```

---

## Game Flow

1. **Lobby Phase**
   - Player creates a new game or joins existing game with ID
   - Player enters their name
   - System generates unique player_id

2. **Connection**
   - Browser connects to `ws://server:3001/ws/{game_id}/{player_id}`
   - Server sends full game state (all players, life, cards)
   - Player marked as active

3. **Gameplay**
   - Players modify life totals (±1, ±5 buttons)
   - Players draw cards into zones
   - Cards can be moved between zones
   - All actions broadcast via WebSocket

4. **Disconnect/Rejoin**
   - If connection drops, player marked inactive
   - Player can rejoin with same game_id + player_id
   - Game state restored from server

---

## Key Design Decisions

### 1. In-Memory Game State
**Decision**: Store all game state in RAM (HashMap)
**Rationale**: 
- Prototype speed
- Sub-millisecond access
- Simplicity
**Future**: Add PostgreSQL/Redis for persistence

### 2. Arc<RwLock<GameManager>>
**Decision**: Thread-safe shared state via Arc + RwLock
**Rationale**:
- Multiple concurrent WebSocket connections
- Safe concurrent mutations
- Standard Rust concurrency pattern
**Alternative**: Could use Channels for actor pattern

### 3. Player Rejoin via ID
**Decision**: Players use generated ID to rejoin
**Rationale**:
- No authentication complexity yet
- Unique per session
- Easy for testing
**Future**: Integrate with user accounts

### 4. Turn-Based with 2s Tolerance
**Decision**: No strict turn enforcement on server
**Rationale**:
- Manual game management by players
- Fits MTG play style (players track turns themselves)
- Simpler logic
**Could add**: Turn timer, phase validation if needed

### 5. Card Zones as Vec<Card>
**Decision**: Simple vectors, no advanced indexing
**Rationale**:
- Small hand/zone sizes
- Easy to implement
- Clear semantics
**Future**: Could optimize with indices/BTreeMap if performance needed

---

## Extensibility Points

### Adding New Game Features

**New Card Zone?**
Add to `Player` struct in `game.rs`:
```rust
pub struct Player {
    // ... existing
    pub graveyard: Vec<Card>,
    pub my_new_zone: Vec<Card>,  // <-- Add here
}
```

**New Life Modifier?**
Extend `UpdateLife` in `websocket.rs` handler.

**New Message Type?**
Add variant to `Message` enum in `websocket.rs`:
```rust
pub enum Message {
    // ... existing
    MyNewAction { data: String },
}
```

**New HTTP Endpoint?**
Add route in `main.rs` and handler in `handlers.rs`.

---

## Performance Considerations

### Current Limits
- **Concurrent Players**: 4 (by game design, easily scales)
- **Game Sessions**: Limited by RAM
- **Message Throughput**: ~1000s msgs/sec per connection (Tokio capable)
- **Latency**: <10ms typical (localhost), <100ms over internet

### Scalability Path
1. ✅ Current: Single binary, in-memory
2. Next: Multiple server instances with Redis session store
3. Future: Distributed state with event sourcing

---

## Testing the Prototype

### 1. Local 4-Player Game
Open 4 browser tabs on `http://localhost:3001`:
1. Create game (copy game ID)
2. Tabs 2-4: Join same game ID with different names
3. Click life buttons, draw cards, test card movement

### 2. Disconnect/Rejoin
1. In one tab, open DevTools → Network → Disconnect
2. Try clicking buttons (should fail gracefully)
3. Reconnect (browser auto-reconnects)
4. Game state restored

### 3. Multi-Device Testing
1. Get your machine's local IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
2. From another device: `http://{your_ip}:3001`
3. Connect players from different machines to same game

---

## Common Issues & Fixes

**"Connection Refused"**
- Ensure backend is running: `ps aux | grep game-table`
- Check port 3001: `lsof -i :3001`

**"WebSocket Error"**
- Check firewall allows port 3001
- Browser console logs detailed error

**Frontend not updating**
- Browser DevTools → Network → WS
- Look for incoming messages from server

**Docker build fails**
- `docker system prune -a` to clean build cache
- Check Rust toolchain: `rustup update`

---

## Next Steps (Post-Prototype)

1. **Deck Management**
   - Load deck files (JSON)
   - Validate deck legality
   - Deck zone UI

2. **UI Improvements**
   - Drag-and-drop card movement
   - Card images (from Scryfall API)
   - Animations & transitions
   - Mobile responsive

3. **Game Rules**
   - Turn order enforcement
   - Phase tracking (main, combat, etc.)
   - Stack management
   - Priority system

4. **Persistence**
   - PostgreSQL for game history
   - Redis for active sessions
   - Game replay/spectate

5. **Multiplayer**
   - Async spectators
   - Chat system
   - Elo ranking

---

## Architecture Review Checklist

- [x] Async/concurrent request handling (Tokio)
- [x] Real-time state sync (WebSocket)
- [x] Thread-safe state (Arc + RwLock)
- [x] Message validation
- [x] Connection lifecycle handling
- [x] Error handling
- [x] Rejoin capability
- [x] Responsive UI (React)
- [x] Docker deployment
- [ ] Authentication
- [ ] Persistent storage
- [ ] Horizontal scaling
- [ ] Comprehensive tests
- [ ] Monitoring/logging

---

**Last Updated**: January 2026
**Status**: Prototype - Ready for 4-player testing
