import React, { useState, useEffect, useRef } from 'react';
import '../styles/GameTableNew.css';
import LeftSidebar from './LeftSidebar';
import BattlefieldZone from './BattlefieldZone';
import HandZone from './HandZone';
import CollapsibleZones from './CollapsibleZones';
import BottomToolbar from './BottomToolbar';

const GameTable = ({ gameId, playerId, playerName, onBack }) => {
  const [gameState, setGameState] = useState(null);
  const [error, setError] = useState('');
  const [handScale, setHandScale] = useState(1);
  const ws = useRef(null);

  useEffect(() => {
    // Connect to WebSocket
    const wsUrl = `ws://${window.location.hostname}:3001/ws/${gameId}/${playerId}`;
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      console.log('Connected to game server');
      // Send player name to backend
      if (playerName) {
        const setNameMsg = {
          SetPlayerName: {
            player_id: playerId,
            name: playerName
          }
        };
        ws.current.send(JSON.stringify(setNameMsg));
      }
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
  }, [gameId, playerId, playerName]);

  const updatePlayerLife = (playerId, delta) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(
        JSON.stringify({
          UpdateLife: { player_id: playerId, delta }
        })
      );
    }
  };

  const updatePlayerCounter = (playerId, counterType, delta) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(
        JSON.stringify({
          UpdateCounter: {
            player_id: playerId,
            counter_type: counterType,
            delta: delta
          }
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

  const handleSpawnCard = (position) => {
    console.log('Right-clicked to spawn card at position:', position);
    // Card spawning is now a placeholder - can be extended later
  };

  if (!gameState) {
    return <div className="game-table-new loading">Connecting to game...</div>;
  }

  const players = gameState?.players ? Object.values(gameState.players) : [];
  const currentPlayer = players[0];
  const activePlayerIndex = gameState?.current_turn_player || 0;

  return (
    <div className="game-table-new">
      {error && <div className="error-banner">{error}</div>}

      <div className="game-container">
        {/* Left Sidebar */}
        <div className="sidebar-section">
          <LeftSidebar />
        </div>

        {/* Main Game Area */}
        <div className="main-game-area">
          {/* 4-Player Battlefield Board */}
          <div className="battlefield-board">
            {/* Top Row */}
            <div className="board-row top-row">
              {/* Top-Left Player (Player 3) */}
              <div className="board-cell top-left">
                <BattlefieldZone 
                  player={players[3]}
                  position="top-left"
                  isActive={activePlayerIndex === 3}
                  onUpdateLife={updatePlayerLife}
                  onUpdateCounter={updatePlayerCounter}
                  onSpawnCard={handleSpawnCard}
                />
              </div>
              {/* Top-Right Player (Player 1) */}
              <div className="board-cell top-right">
                <BattlefieldZone 
                  player={players[1]}
                  position="top-right"
                  isActive={activePlayerIndex === 1}
                  onUpdateLife={updatePlayerLife}
                  onUpdateCounter={updatePlayerCounter}
                  onSpawnCard={handleSpawnCard}
                />
              </div>
            </div>

            {/* Bottom Row */}
            <div className="board-row bottom-row">
              {/* Bottom-Left Player (Current/Player 0) */}
              <div className="board-cell bottom-left">
                <BattlefieldZone 
                  player={players[0]}
                  position="bottom-left"
                  isActive={activePlayerIndex === 0}
                  onUpdateLife={updatePlayerLife}
                  onUpdateCounter={updatePlayerCounter}
                  onSpawnCard={handleSpawnCard}
                />
              </div>
              {/* Bottom-Right Player (Player 2) */}
              <div className="board-cell bottom-right">
                <BattlefieldZone 
                  player={players[2]}
                  position="bottom-right"
                  isActive={activePlayerIndex === 2}
                  onUpdateLife={updatePlayerLife}
                  onUpdateCounter={updatePlayerCounter}
                  onSpawnCard={handleSpawnCard}
                />
              </div>
            </div>
          </div>

          {/* Current Player's Hand */}
          <div className="hand-section" style={{ height: `${handScale * 120}px` }}>
            <HandZone 
              cards={currentPlayer?.hand || []}
              onSelectCard={() => {}}
              onHandOptions={() => {}}
              scale={handScale}
            />
          </div>

          {/* Hand Resize Handle */}
          <div 
            className="hand-resize-handle"
            onMouseDown={(e) => {
              e.preventDefault();
              const startY = e.clientY;
              const startHeight = handScale * 120;
              
              const handleMouseMove = (moveEvent) => {
                const delta = moveEvent.clientY - startY;
                const newHeight = Math.max(60, Math.min(300, startHeight + delta));
                setHandScale(newHeight / 120);
              };
              
              const handleMouseUp = () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
              };
              
              document.addEventListener('mousemove', handleMouseMove);
              document.addEventListener('mouseup', handleMouseUp);
            }}
          />

          {/* Collapsible Zones at Bottom */}
          <div className="zones-section">
            <CollapsibleZones gameState={gameState} />
          </div>
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
        onBack={onBack}
      />
    </div>
  );
};

export default GameTable;
