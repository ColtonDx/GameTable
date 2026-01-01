import React, { useState, useEffect, useRef } from 'react';
import '../styles/GameTable.css';
import PlayerZone from './PlayerZone';

const GameTable = ({ gameId, playerId, onBack }) => {
  const [gameState, setGameState] = useState(null);
  const [error, setError] = useState('');
  const ws = useRef(null);

  useEffect(() => {
    // Connect to WebSocket
    const wsUrl = `ws://${window.location.hostname}:3001/ws/${gameId}/${playerId}`;
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      console.log('Connected to game server');
    };

    ws.current.onmessage = (event) => {
      const message = JSON.parse(event.data);
      
      if (message.GameState) {
        const state = JSON.parse(message.GameState.state);
        setGameState(state);
      } else if (message.LifeUpdated) {
        if (gameState) {
          const newState = { ...gameState };
          if (newState.players && newState.players[message.LifeUpdated.player_id]) {
            newState.players[message.LifeUpdated.player_id].life = message.LifeUpdated.life;
            setGameState(newState);
          }
        }
      } else if (message.Error) {
        setError(message.Error.message);
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

  const updateLife = (playerId, delta) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(
        JSON.stringify({
          UpdateLife: { player_id: playerId, delta }
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

  const players = Object.values(gameState.players || {});

  return (
    <div className="game-table">
      <div className="header">
        <h1>Game Table - {gameId.substring(0, 8)}</h1>
        <button onClick={onBack} className="btn btn-secondary">
          Back to Lobby
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="table-container">
        {/* Life Tracker in Center */}
        <div className="center-display">
          <h2>Life Totals</h2>
          <div className="life-tracker">
            {players.map((player, idx) => (
              <div key={player.id} className={`player-life player-${idx}`}>
                <div className="player-name">{player.name}</div>
                <div className="life-value">{player.life}</div>
                <div className="life-controls">
                  <button
                    onClick={() => updateLife(player.id, -1)}
                    className="btn btn-sm"
                  >
                    -1
                  </button>
                  <button
                    onClick={() => updateLife(player.id, 1)}
                    className="btn btn-sm"
                  >
                    +1
                  </button>
                  <button
                    onClick={() => updateLife(player.id, -5)}
                    className="btn btn-sm"
                  >
                    -5
                  </button>
                  <button
                    onClick={() => updateLife(player.id, 5)}
                    className="btn btn-sm"
                  >
                    +5
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Player Zones */}
        <div className="player-zones">
          {players.map((player, idx) => (
            <PlayerZone
              key={player.id}
              player={player}
              playerIndex={idx}
              onDrawCard={drawCard}
              onMoveCard={moveCard}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default GameTable;
