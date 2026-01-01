import React, { useState, useEffect } from 'react';
import './App.css';
import GameTable from './components/GameTable';
import Lobby from './components/Lobby';

function App() {
  const [gameId, setGameId] = useState(null);
  const [playerId, setPlayerId] = useState(null);

  const handleStartGame = (gId, pId) => {
    setGameId(gId);
    setPlayerId(pId);
  };

  const handleBackToLobby = () => {
    setGameId(null);
    setPlayerId(null);
  };

  return (
    <div className="App">
      {gameId ? (
        <GameTable gameId={gameId} playerId={playerId} onBack={handleBackToLobby} />
      ) : (
        <Lobby onStartGame={handleStartGame} />
      )}
    </div>
  );
}

export default App;
