# GameTable - API Reference

Quick reference for WebSocket message formats.

## Connection

```
ws://localhost:3001/ws/{GAME_ID}/{PLAYER_ID}
```

**Parameters:**
- `GAME_ID`: UUID from `/game/create` endpoint
- `PLAYER_ID`: UUID generated client-side (e.g., `player_${Date.now()}`)

## Messages

### Client → Server

All messages are JSON objects with a single key indicating message type.

#### UpdateLife
Modify a player's life total.

```json
{
  "UpdateLife": {
    "player_id": "string",
    "delta": -3
  }
}
```

**Parameters:**
- `player_id`: Player UUID
- `delta`: Amount to change (positive or negative)

---

#### MoveCard
Move a card between zones.

```json
{
  "MoveCard": {
    "card_id": "string",
    "from_zone": "hand|battlefield|graveyard|exile|command_zone",
    "to_zone": "hand|battlefield|graveyard|exile|command_zone"
  }
}
```

---

#### DrawCard
Add a card to a player's hand.

```json
{
  "DrawCard": {
    "card_name": "Lightning Bolt"
  }
}
```

---

#### DiscardCard
Remove a card from play (queued for implementation).

```json
{
  "DiscardCard": {
    "card_id": "string"
  }
}
```

---

### Server → Client

#### GameState
Full game state snapshot (sent on connection).

```json
{
  "GameState": {
    "state": "{\"id\":\"...\",\"players\":{...},\"current_turn_player\":0,\"turn_number\":1}"
  }
}
```

The `state` field is a JSON string containing:
```json
{
  "id": "game_uuid",
  "players": {
    "player_id": {
      "id": "player_id",
      "name": "Player One",
      "life": 20,
      "hand": [{"id":"card_1","name":"Forest"}],
      "battlefield": [],
      "graveyard": [],
      "exile": [],
      "command_zone": [],
      "is_active": true
    }
  },
  "current_turn_player": 0,
  "turn_number": 1,
  "created_at": 1704067200
}
```

---

#### LifeUpdated
Player's life total changed.

```json
{
  "LifeUpdated": {
    "player_id": "player_uuid",
    "life": 17
  }
}
```

---

#### CardMoved
Card was moved between zones.

```json
{
  "CardMoved": {
    "player_id": "player_uuid",
    "card_id": "card_uuid",
    "from_zone": "hand",
    "to_zone": "battlefield"
  }
}
```

---

#### Error
An error occurred processing a request.

```json
{
  "Error": {
    "message": "Player not found"
  }
}
```

---

## HTTP Endpoints

### GET /health
Health check.

**Response:** `OK`

---

### GET /game/create
Create a new game session.

**Response:**
```json
{
  "game_id": "uuid",
  "message": "Game created successfully"
}
```

---

## Example Flow

1. **Create Game**
```bash
curl http://localhost:3001/game/create
# Response: {"game_id":"abc123","message":"Game created successfully"}
```

2. **Connect WebSocket**
```javascript
const ws = new WebSocket('ws://localhost:3001/ws/abc123/player_1234');

ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  // Handle message
};
```

3. **Update Life**
```javascript
ws.send(JSON.stringify({
  UpdateLife: {
    player_id: "player_1234",
    delta: -3
  }
}));
```

4. **Receive Update**
```javascript
// Server broadcasts: 
// {
//   "LifeUpdated": {
//     "player_id": "player_1234",
//     "life": 17
//   }
// }
```

---

## Status Codes

**HTTP:**
- `200 OK`: Successful request
- `201 CREATED`: Resource created
- `400 BAD REQUEST`: Invalid input
- `404 NOT FOUND`: Resource not found
- `500 INTERNAL SERVER ERROR`: Server error

**WebSocket:**
- Connected: `readyState === 1`
- Disconnected: `readyState !== 1`
- Errors: Check `onerror` callback

---

## Rate Limiting

Currently unlimited. Future versions may add:
- Life change cooldown: 100ms per player
- Card movement cooldown: 200ms per player
- Message queue depth: 100 pending

---

## Best Practices

1. **Validate player_id locally** before sending updates
2. **Check WebSocket state** before sending messages
3. **Handle reconnection** with exponential backoff
4. **Deduplicate messages** on client side if needed
5. **Log all errors** for debugging

---

Last Updated: January 2026
