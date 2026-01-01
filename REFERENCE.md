# GameTable - Reference Card

**Quick lookup for common tasks and concepts.**

---

## 🚀 Getting Started

### Start the Application
```bash
# With Docker (recommended)
docker-compose up --build

# Local backend
cd backend && cargo run --release

# Local frontend  
cd frontend && npm start
```

### Access the Game
```
http://localhost:3001
```

---

## 🎮 Gameplay

### Controls
- **Life Buttons**: ±1, ±5 for each player
- **Draw Card**: Type name, click button
- **Card Zones**: See 5 zones per player

### Game State
- **Life Total**: 20 (starting)
- **Players**: 4 per game
- **Zones**: Hand, Battlefield, Graveyard, Exile, Command Zone
- **Turn Tracking**: Manual (players track themselves)

---

## 📡 WebSocket Messages

### Connect
```
ws://localhost:3001/ws/{GAME_ID}/{PLAYER_ID}
```

### Send (Client → Server)
```json
{
  "UpdateLife": { "player_id": "id", "delta": 5 }
}
{
  "DrawCard": { "card_name": "Forest" }
}
{
  "MoveCard": { "card_id": "id", "from_zone": "hand", "to_zone": "battlefield" }
}
```

### Receive (Server → Client)
```json
{
  "GameState": { "state": "{...}" }
}
{
  "LifeUpdated": { "player_id": "id", "life": 25 }
}
{
  "Error": { "message": "..." }
}
```

---

## 🐳 Docker Commands

```bash
# Build and run
docker-compose up --build

# Run in background
docker-compose up -d

# Stop
docker-compose down

# View logs
docker-compose logs -f

# Rebuild without cache
docker-compose build --no-cache
```

---

## 🔧 Rust Backend

### File Locations
- **Entry**: `backend/src/main.rs`
- **Game Logic**: `backend/src/game.rs`
- **WebSocket**: `backend/src/websocket.rs`
- **HTTP Routes**: `backend/src/handlers.rs`

### Compile
```bash
cd backend
cargo build --release     # Optimized
cargo check              # Fast check
cargo clippy             # Lint warnings
cargo test               # Run tests
```

### Common Edits
- **Add zone**: Edit `Player` struct in `game.rs`
- **Add message**: Edit `Message` enum in `websocket.rs`
- **Add endpoint**: Add to `main.rs` routes

---

## ⚛️ React Frontend

### File Locations
- **Main**: `frontend/src/App.js`
- **Lobby**: `frontend/src/components/Lobby.js`
- **Game**: `frontend/src/components/GameTable.js`
- **Zones**: `frontend/src/components/PlayerZone.js`

### Commands
```bash
cd frontend
npm install              # Install dependencies
npm start               # Dev server (hot reload)
npm run build           # Production build
npm test                # Run tests
```

### Common Edits
- **UI Changes**: Edit `.js` or `.css` files
- **Colors**: Edit `src/styles/*.css`
- **Add button**: Edit component `.js` file

---

## 📝 Data Structures

### Game Session
```rust
GameSession {
    id: String,
    players: HashMap<String, Player>,
    current_turn_player: usize,
    turn_number: u32,
    created_at: u64
}
```

### Player
```rust
Player {
    id: String,
    name: String,
    life: i32,
    hand: Vec<Card>,
    battlefield: Vec<Card>,
    graveyard: Vec<Card>,
    exile: Vec<Card>,
    command_zone: Vec<Card>,
    is_active: bool
}
```

### Card
```rust
Card {
    id: String,    // UUID
    name: String
}
```

---

## 📚 Documentation Map

| Need | Document |
|------|----------|
| Get started | [QUICKSTART.md](QUICKSTART.md) |
| Architecture | [SETUP.md](SETUP.md) |
| Code changes | [DEVELOPER.md](DEVELOPER.md) |
| WebSocket API | [API.md](API.md) |
| Testing | [TESTING.md](TESTING.md) |
| Overview | [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) |
| Navigation | [INDEX.md](INDEX.md) |

---

## 🧪 Testing

### Manual Test (4 Players)
1. Open 4 browser tabs
2. Tab 1: Create game
3. Tabs 2-4: Join with same ID
4. Test life buttons
5. Test drawing cards

### Automated Tests
```bash
cd backend
cargo test
```

### Browser Debug
```javascript
// In console
ws.readyState              // 1 = open
JSON.parse(event.data)     // Parse message
```

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| Port 3001 in use | `lsof -i :3001` then kill process |
| WebSocket error | Check firewall, restart server |
| npm install fails | Delete `node_modules`, retry |
| Compilation error | Run `cargo check` for details |
| UI not updating | Hard refresh (Ctrl+Shift+R) |
| Connection refused | Ensure backend on port 3001 |

---

## 📊 Limits & Performance

| Metric | Value |
|--------|-------|
| Max players/game | 4 |
| Max zones/player | 5 |
| Message latency | <100ms |
| Starting life | 20 |
| Memory/session | ~100KB |
| Max games | Unlimited (RAM) |

---

## 🔑 Key Files to Modify

### Add Card Zone
1. `backend/src/game.rs` - Add to `Player` struct
2. `frontend/src/components/PlayerZone.js` - Add to zones array

### Add Message Type
1. `backend/src/websocket.rs` - Add to `Message` enum
2. Add handler in `handle_socket` function
3. `frontend/src/components/GameTable.js` - Send from UI

### Add HTTP Endpoint
1. `backend/src/handlers.rs` - Add handler function
2. `backend/src/main.rs` - Add route

### Change UI Colors
1. `frontend/src/styles/*.css` - Edit color values

---

## 🌐 Network

### Ports
- **Game Server**: 3001 (WebSocket + HTTP)
- **Dev Frontend**: 3000 (proxies to 3001)

### URLs
```
Game:          http://localhost:3001
WebSocket:     ws://localhost:3001/ws/{game_id}/{player_id}
Health:        http://localhost:3001/health
Create Game:   http://localhost:3001/game/create
```

---

## 📦 Dependencies

### Backend (Cargo.toml)
```toml
tokio        # Async runtime
axum         # Web framework
serde        # Serialization
tower        # Networking layers
tracing      # Logging
```

### Frontend (package.json)
```json
react@18
react-dom@18
react-scripts@5
```

---

## 🏗️ Architecture Diagram

```
┌─────────────────────────┐
│   Browser (React)       │
│   4 Tabs = 4 Players    │
└────────┬────────────────┘
         │ WebSocket
         ↓
┌─────────────────────────┐
│  Axum Web Server        │
│  (Tokio Runtime)        │
│                         │
│  GameManager ────────→  │
│    GameSession ────→    │
│      Players ────→      │
│        Zones            │
└─────────────────────────┘
```

---

## 📈 Scalability

### Current
- 1 server process
- 1-4 games per restart
- In-memory state

### Next Step
- Multiple server instances
- Redis for session store
- Load balancer

### Future
- Distributed state
- Event sourcing
- Microservices

---

## ✨ Code Quality

- Type-safe Rust
- React Hooks
- Clear naming
- Well documented
- Docker ready

---

## 🎯 Common Tasks (5 min each)

### Restart Server
```bash
docker-compose down
docker-compose up --build
```

### Test 4 Players
Open 4 browser tabs to `http://localhost:3001`

### Check Logs
```bash
docker-compose logs -f game-server
```

### View WebSocket Messages
Browser DevTools → Network → WS → Messages

### Debug Backend
```bash
RUST_LOG=debug cargo run --release
```

### Hot Reload Frontend
```bash
npm start  # Auto-recompiles on changes
```

---

## 🚀 Deploy to Production

```bash
# Build image
docker build -t gametable:1.0 .

# Push to registry
docker push your-registry/gametable:1.0

# Deploy (example)
docker run -p 3001:3001 gametable:1.0
```

---

## 📞 Quick Help

**Where's the game logic?** → `backend/src/game.rs`

**How do messages work?** → `backend/src/websocket.rs`

**How to add a UI feature?** → [DEVELOPER.md](DEVELOPER.md)

**WebSocket format?** → [API.md](API.md)

**How to test?** → [TESTING.md](TESTING.md)

---

## 📋 Project Files

```
├── backend/                (Rust - 400 lines)
├── frontend/               (React - 600 lines)
├── Dockerfile
├── docker-compose.yml
├── README.md              (Features)
├── QUICKSTART.md          (5-min setup)
├── SETUP.md               (Architecture)
├── API.md                 (WebSocket)
├── DEVELOPER.md           (Code mods)
├── TESTING.md             (Testing)
├── PROJECT_SUMMARY.md     (Overview)
└── INDEX.md               (Navigation)
```

---

## 💡 Pro Tips

1. **Dev with Docker**: `docker-compose up --build`
2. **Frontend hot reload**: `npm start` auto-compiles
3. **Check syntax fast**: `cargo check` (faster than build)
4. **Debug WebSocket**: DevTools → Network → WS
5. **See server logs**: `RUST_LOG=debug cargo run --release`
6. **Test with friends**: Share your IP + game ID

---

**Bookmark this page!** It's your quick reference.

---

*Last Updated: January 2026*
