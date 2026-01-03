import React, { useState, useEffect } from 'react';
import './App.css';
import GameTable from './components/GameTable';
import Lobby from './components/Lobby';

function App() {
  const [gameId, setGameId] = useState(null);
  const [playerId, setPlayerId] = useState(null);
  const [playerName, setPlayerName] = useState(null);

  // Load session from localStorage on mount
  useEffect(() => {
    const savedGameId = localStorage.getItem('gameId');
    const savedPlayerId = localStorage.getItem('playerId');
    const savedPlayerName = localStorage.getItem('playerName');
    
    if (savedGameId && savedPlayerId && savedPlayerName) {
      setGameId(savedGameId);
      setPlayerId(savedPlayerId);
      setPlayerName(savedPlayerName);
    }
  }, []);

  const handleStartGame = (gId, pId, pName) => {
    // Store session in localStorage
    localStorage.setItem('gameId', gId);
    localStorage.setItem('playerId', pId);
    localStorage.setItem('playerName', pName);
    
    setGameId(gId);
    setPlayerId(pId);
    setPlayerName(pName);
  };

  const handleBackToLobby = () => {
    // Clear session from localStorage when returning to lobby
    // This ensures invalid/expired sessions don't persist across page reloads
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
