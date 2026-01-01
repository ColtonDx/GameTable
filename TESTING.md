# GameTable - Testing Guide

## Pre-Launch Checklist

- [ ] Code compiles (`cargo build --release` in backend/)
- [ ] No TypeScript errors in frontend
- [ ] Docker can build successfully
- [ ] Port 3001 is available

## Unit Testing

### Backend
```bash
cd backend
cargo test
```

Tests data structure integrity and game logic.

### Frontend
```bash
cd frontend
npm test
```

## Integration Testing

### Manual 4-Player Local Test

**Setup:**
1. Start server: `docker-compose up --build`
2. Open 4 browser tabs to `http://localhost:3001`

**Test Sequence:**

**Tab 1 - Create Game**
- [ ] Click "Create New Game"
- [ ] Copy game ID
- [ ] Enter name "Player 1"
- [ ] Click "Join Game"
- [ ] Verify life total shows 20

**Tabs 2-4 - Join Existing**
- [ ] Paste game ID
- [ ] Enter names "Player 2/3/4"
- [ ] Click "Join Game"
- [ ] Verify all 4 players appear in center life display

**Test Life Tracking**
- [ ] Click "+1" on Player 1
  - [ ] Life should change to 21
  - [ ] All other tabs should update
- [ ] Click "-5" on Player 2
  - [ ] Life should change to 15
  - [ ] Update visible everywhere
- [ ] Click "+5" on Player 3
  - [ ] Life should change to 25
- [ ] Click "-1" on Player 4 (5 times)
  - [ ] Life should change to 15

**Test Card Drawing**
- [ ] Tab 1:
  - [ ] Type "Black Lotus" in draw box
  - [ ] Click "Draw Card"
  - [ ] Card appears in Hand zone for Player 1
- [ ] Tab 2:
  - [ ] Type "Lightning Bolt" 
  - [ ] Click "Draw Card"
  - [ ] Card appears for Player 2

**Test Card Zones**
- [ ] Tab 1: Draw 3 more cards (any names)
- [ ] Verify 4 cards in Hand
- [ ] Verify counts update

**Test Disconnect/Rejoin**
- [ ] Tab 1: Note current game ID and player info
- [ ] Tab 1: Close tab
- [ ] Tab 1: Reopen `http://localhost:3001`
  - [ ] Manually join same game ID
  - [ ] Use same player ID if possible
  - [ ] Verify game state restored

### Browser Console Testing

Open DevTools → Console in any tab:

```javascript
// Check WebSocket connection
ws.readyState  // Should be 1 (OPEN)

// Check last message
lastMessage    // Shows last received server message

// Send a test message
ws.send(JSON.stringify({
  UpdateLife: { player_id: "YOUR_PLAYER_ID", delta: 1 }
}))
```

### Network Tab Testing

DevTools → Network → WS (filter):

- [ ] See "ws://" connection to /ws/{game_id}/{player_id}
- [ ] Status should be "101 Switching Protocols"
- [ ] Messages tab shows JSON exchanges
- [ ] On life update: Should see `LifeUpdated` message
- [ ] On card draw: Should see game state broadcast

## Stress Testing

### Multi-Game Testing
```bash
# Terminal 1
curl http://localhost:3001/game/create
# {"game_id":"game_1"}

# Terminal 2
curl http://localhost:3001/game/create
# {"game_id":"game_2"}

# Browser: Create 2-3 concurrent games
# Tab 1-2: game_1
# Tab 3-4: game_2
# Verify isolation (changes in game_1 don't affect game_2)
```

### Rapid Life Changes
- [ ] Click life buttons rapidly (>10 clicks/sec)
- [ ] Verify all updates received
- [ ] No corrupted state
- [ ] Correct final value

### Long Session
- [ ] Keep game open for 5+ minutes
- [ ] Draw 20+ cards
- [ ] Make 50+ life changes
- [ ] Check memory usage stays reasonable
- [ ] No memory leaks (Task Manager or Activity Monitor)

## Edge Cases

### Connection Loss
- [ ] DevTools → Network → Throttle (offline)
  - [ ] Click button (no effect)
  - [ ] DevTools → Network → Back Online
  - [ ] Game resumes, no data loss

### Concurrent Actions
- [ ] Multiple players click life buttons simultaneously
  - [ ] All changes processed
  - [ ] No race conditions
  - [ ] Final state consistent

### Large Card Names
- [ ] Draw card with name: "A" repeated 100 times
  - [ ] No UI crash
  - [ ] Text wraps correctly
  - [ ] Still functional

### Invalid Zone Names
```javascript
ws.send(JSON.stringify({
  MoveCard: {
    card_id: "card_1",
    from_zone: "invalid",
    to_zone: "hand"
  }
}))
// Should receive Error message
```

## Performance Benchmarks

### Target Metrics
- **Connection time**: < 1 second
- **Life update latency**: < 200ms
- **Card draw latency**: < 500ms
- **4-player sync time**: < 2s (turn-based)
- **Memory per session**: < 10MB

### Measurement
```bash
# Server-side logs (should show timing)
RUST_LOG=info cargo run --release

# Browser: 
# Open DevTools → Performance
# Record 30s of gameplay
# Check frame rate (target: 60fps)
```

## Regression Testing Checklist

Before each release, verify:

- [ ] Game creation works
- [ ] Player join works  
- [ ] Life changes sync across clients
- [ ] Card drawing works
- [ ] Card zones display correctly
- [ ] UI responsive (no freezing)
- [ ] Network errors handled gracefully
- [ ] Rejoin functionality works
- [ ] 4 players can play simultaneously
- [ ] No console errors
- [ ] Mobile viewport works

## Known Limitations (Prototype)

- ⚠️ No data persistence (restart = new game)
- ⚠️ No deck validation
- ⚠️ No turn enforcement
- ⚠️ No undo functionality
- ⚠️ Cards cannot be moved between zones yet
- ⚠️ No card images

## Reporting Issues

When reporting a bug, include:

1. **Steps to reproduce** (numbered)
2. **Expected behavior**
3. **Actual behavior**
4. **Browser + OS**
5. **Browser console errors** (if any)
6. **Network tab screenshot**
7. **Server logs**

Example:
```
Title: Life updates not syncing to other players

Steps:
1. Create game with game ID "abc123"
2. Join from 2 browser tabs
3. Click "+1" life in Tab 1
4. Observe Tab 2

Expected: Tab 2 life updates to 21
Actual: Tab 2 shows 20 still
Browser: Chrome 122 / macOS 14.1
Console: No errors
```

---

Last Updated: January 2026
