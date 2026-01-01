import React, { useState, useEffect, useRef } from 'react';
import '../styles/GameTable.css';
import '../styles/CommanderLayout.css';
import PlayerZone from './PlayerZone';

const GameTable = ({ gameId, playerId, playerName, onBack }) => {
  const [gameState, setGameState] = useState(null);
  const [error, setError] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const ws = useRef(null);

  useEffect(() => {
    // Connect to WebSocket
    const wsUrl = `ws://${window.location.hostname}:3001/ws/${gameId}/${playerId}`;
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      console.log('Connected to game server');
    };

    ws.current.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        if (message.GameState && message.GameState.state) {
          // Full game state update - parse and set entire state
          const state = JSON.parse(message.GameState.state);
          setGameState(state);
        } else if (message.Error) {
          setError(message.Error.message);
          setTimeout(() => setError(''), 5000);
        }
      } catch (err) {
        console.error('Error parsing WebSocket message:', err);
      }
    };

    ws.current.onerror = (error) => {
      setError('WebSocket error: ' + error);
    };

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [gameId, playerId]);

  const updateLife = (targetPlayerId, delta) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(
        JSON.stringify({
          UpdateLife: { player_id: targetPlayerId, delta }
        })
      );
    }
  };

  const moveCard = (cardId, fromZone, toZone) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(
        JSON.stringify({
          MoveCard: { card_id: cardId, from_zone: fromZone, to_zone: toZone }
        })
      );
    }
  };

  const drawCard = (cardName) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(
        JSON.stringify({
          DrawCard: { card_name: cardName }
        })
      );
    }
  };

  if (!gameState) {
    return <div className="game-table loading">Connecting to game...</div>;
  }

  // Get array of players
  const playersArray = Object.entries(gameState.players || {}).map(([id, player]) => ({
    ...player,
    id
  }));

  // Ensure exactly 4 players (pad with empty slots if needed)
  while (playersArray.length < 4) {
    playersArray.push({
      id: `empty_${playersArray.length}`,
      name: 'Empty Seat',
      life: 20,
      hand: [],
      graveyard: [],
      exile: [],
      command_zone: [],
    });
  }

  // Limit to first 4 players
  const displayPlayers = playersArray.slice(0, 4);

  // Map players to corners: [top-left, top-right, bottom-right, bottom-left]
  const cornerPositions = ['top-left', 'top-right', 'bottom-right', 'bottom-left'];

  return (
    <div className="commander-table">
      {/* Compact Menu Bar */}
      <div className="menu-bar">
        <div className="menu-left">
          <span className="game-id">#{gameId.substring(0, 4)}</span>
        </div>
        <div className="menu-center">
          <h1>Command Zone</h1>
        </div>
        <div className="menu-right">
          <button 
            onClick={() => setMenuOpen(!menuOpen)}
            className="menu-btn"
            title="Game Info"
          >
            ⚙️
          </button>
        </div>
      </div>

      {/* Game Menu Overlay */}
      {menuOpen && (
        <div className="menu-overlay" onClick={() => setMenuOpen(false)}>
          <div className="menu-content" onClick={e => e.stopPropagation()}>
            <h2>Game Info</h2>
            <div className="menu-item">
              <strong>Game ID:</strong> {gameId}
            </div>
            <div className="menu-item">
              <strong>Your ID:</strong> {playerId}
            </div>
            <div className="menu-item">
              <strong>Your Name:</strong> {playerName}
            </div>
            <div className="menu-item">
              <strong>Players:</strong> {playersArray.filter(p => !p.id.startsWith('empty_')).length}/4
            </div>
            <button onClick={onBack} className="btn btn-secondary">
              Leave Game
            </button>
            <button onClick={() => setMenuOpen(false)} className="btn btn-primary">
              Close
            </button>
          </div>
        </div>
      )}

      {error && <div className="error-banner">{error}</div>}

      {/* Main Game Table with 4 Corners */}
      <div className="table-layout">
        {/* Player Zones in 4 Corners */}
        {displayPlayers.map((player, idx) => (
          <div key={player.id} className={`player-corner ${cornerPositions[idx]}`}>
            <PlayerZone
              player={player}
              playerIndex={idx}
              isCurrentPlayer={player.id === playerId}
              onUpdateLife={updateLife}
              onDrawCard={drawCard}
              onMoveCard={moveCard}
            />
          </div>
        ))}

        {/* Central Play Area */}
        <div className="central-area">
          {/* Shared Battlefield */}
          <div className="shared-battlefield">
            <div className="battlefield-title">Battlefield</div>
            {gameState.battlefield && gameState.battlefield.length > 0 ? (
              <div className="battlefield-cards">
                {gameState.battlefield.map(card => (
                  <div key={card.id} className="card-token">
                    {card.name}
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-battlefield">No permanents</div>
            )}
          </div>

          {/* Central Life Tracker */}
          <div className="central-life">
            <div className="life-grid">
              {displayPlayers.map((player, idx) => (
                <div key={player.id} className={`life-box life-${cornerPositions[idx]}`}>
                  <div className="life-player-name">{player.name.split(' ').pop()}</div>
                  <div className="life-value">{player.life}</div>
                  <div className="life-buttons">
                    <button 
                      onClick={() => updateLife(player.id, -1)}
                      className="life-btn minus"
                      title="-1 Life"
                    >
                      −
                    </button>
                    <button 
                      onClick={() => updateLife(player.id, 1)}
                      className="life-btn plus"
                      title="+1 Life"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameTable;
