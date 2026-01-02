import React, { useState, useEffect, useRef } from 'react';
import '../styles/GameTableNew.css';
import LeftSidebar from './LeftSidebar';
import BattlefieldZone from './BattlefieldZone';
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
                />
              </div>
              {/* Top-Right Player (Player 1) */}
              <div className="board-cell top-right">
                <BattlefieldZone 
                  player={players[1]}
                  position="top-right"
                  isActive={activePlayerIndex === 1}
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
                />
              </div>
              {/* Bottom-Right Player (Player 2) */}
              <div className="board-cell bottom-right">
                <BattlefieldZone 
                  player={players[2]}
                  position="bottom-right"
                  isActive={activePlayerIndex === 2}
                />
              </div>
            </div>
          </div>

          {/* Current Player's Hand & Zones */}
          <div className="player-panels">
            {/* Left Panel: Zones */}
            <div className="panel zones-panel">
              <div className="panel-header">Zones</div>
              <ZonesPanel gameState={gameState} />
            </div>

            {/* Right Panel: Hand */}
            <div className="panel hand-panel">
              <div className="panel-header">Hand ({currentPlayer?.hand?.length || 0})</div>
              <HandZone 
                cards={currentPlayer?.hand || []}
                onSelectCard={() => {}}
                onHandOptions={() => {}}
              />
            </div>
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
      />
    </div>
  );
};

export default GameTable;
