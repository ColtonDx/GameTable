import React, { useState, useEffect, useRef } from 'react';
import '../styles/GameTableNew.css';
import LeftSidebar from './LeftSidebar';
import PlayerProfile from './PlayerProfile';
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

  const updateLife = (delta) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(
        JSON.stringify({
          UpdateLife: { player_id: playerId, delta }
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

  const handleNextTurn = () => {
    console.log('Next turn clicked');
  };

  const handleAction = () => {
    console.log('Action clicked');
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

        {/* Top-Right: Player Profile */}
        <div className="quadrant top-right">
          <PlayerProfile 
            playerName={playerName || 'Player'} 
            life={currentPlayer?.life || 20}
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
        onUpdateLife={updateLife}
        onNextTurn={handleNextTurn}
        onAction={handleAction}
      />
    </div>
  );
};

export default GameTable;
