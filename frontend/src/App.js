import React, { useState, useEffect } from 'react';
import './App.css';
import GameTable from './components/GameTable';
import Lobby from './components/Lobby';

function App() {
  const [gameId, setGameId] = useState(null);
  const [playerId, setPlayerId] = useState(null);
  const [playerName, setPlayerName] = useState(null);

  // Don't load session from localStorage on mount
  // Sessions should not persist after page reloads or docker rebuilds
  // Users must explicitly rejoin through the lobby

  const handleStartGame = (gId, pId, pName) => {
    // Don't store in localStorage - sessions are transient
    setGameId(gId);
    setPlayerId(pId);
    setPlayerName(pName);
  };

  const handleBackToLobby = () => {
    // Clear session when returning to lobby
    // Clear sessionStorage player ID for this game
    if (gameId) {
      sessionStorage.removeItem(`playerId_${gameId}`);
    }
    // Clear localStorage just in case any old sessions exist
    localStorage.removeItem('gameId');
    localStorage.removeItem('playerId');
    localStorage.removeItem('playerName');
    
    setGameId(null);
    setPlayerId(null);
    setPlayerName(null);
  };

  return (
    <div className="App">
      {gameId ? (
        <GameTable gameId={gameId} playerId={playerId} playerName={playerName} onBack={handleBackToLobby} />
      ) : (
        <Lobby onStartGame={handleStartGame} />
      )}
    </div>
  );
}

export default App;
