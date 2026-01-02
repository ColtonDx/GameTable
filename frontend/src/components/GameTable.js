import React, { useState, useEffect, useRef } from 'react';
import '../styles/GameTableNew.css';
import LeftSidebar from './LeftSidebar';
import FourPlayerLifeTracker from './FourPlayerLifeTracker';
import HandZone from './HandZone';
import ZonesPanel from './ZonesPanel';
import BottomToolbar from './BottomToolbar';

const GameTable = ({ gameId, playerId, playerName, onBack }) => {
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
      try {
        const message = JSON.parse(event.data);
        
        if (message.GameState && message.GameState.state) {
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

  const updatePlayerLife = (playerId, delta) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(
        JSON.stringify({
          UpdateLife: { player_id: playerId, delta }
        })
      );
    }
  };

  const handleNextTurn = () => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(
        JSON.stringify({
          NextTurn: {}
        })
      );
    }
  };

  const handleUndoTurn = () => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(
        JSON.stringify({
          UndoTurn: {}
        })
      );
    }
  };

  const handleAction = () => {
    console.log('Action clicked');
  };

  const handleGameMenu = () => {
    // Restart game or other game menu actions
    if (window.confirm('Are you sure you want to restart the game?')) {
      // Send restart message to backend
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        ws.current.send(
          JSON.stringify({
            RestartGame: {}
          })
        );
      }
    }
  };

  if (!gameState) {
    return <div className="game-table-new loading">Connecting to game...</div>;
  }

  const currentPlayer = gameState?.players ? Object.values(gameState.players)[0] : null;

  return (
    <div className="game-table-new">
      {error && <div className="error-banner">{error}</div>}

      {/* Main 4-Quadrant Layout */}
      <div className="main-layout">
        {/* Top-Left: Sidebar */}
        <div className="quadrant top-left">
          <LeftSidebar />
        </div>

        {/* Top-Right: Life Tracker (4 Players) */}
        <div className="quadrant top-right">
          <FourPlayerLifeTracker 
            gameState={gameState}
            currentPlayerId={gameState?.current_turn_player !== undefined ? Object.keys(gameState.players || {})[gameState.current_turn_player] : null}
            onUpdatePlayerLife={updatePlayerLife}
          />
        </div>

        {/* Bottom-Left: Hand Zone */}
        <div className="quadrant bottom-left">
          <HandZone 
            cards={currentPlayer?.hand || []}
            onSelectCard={() => {}}
            onHandOptions={() => {}}
          />
        </div>

        {/* Bottom-Right: Zones Panel */}
        <div className="quadrant bottom-right">
          <ZonesPanel gameState={gameState} />
        </div>
      </div>

      {/* Bottom Toolbar */}
      <BottomToolbar 
        gameState={gameState}
        turnNumber={gameState?.turn_number || 1}
        onNextTurn={handleNextTurn}
        onAction={handleAction}
        onGameMenu={handleGameMenu}
        onUndoTurn={handleUndoTurn}
      />
    </div>
  );
};

export default GameTable;
