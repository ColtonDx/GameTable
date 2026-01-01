import React, { useState } from 'react';
import '../styles/Lobby.css';

const Lobby = ({ onStartGame }) => {
  const [playerName, setPlayerName] = useState('');
  const [gameId, setGameId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreateGame = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/game/create');
      const data = await response.json();
      setGameId(data.game_id);
      setLoading(false);
    } catch (err) {
      setError('Failed to create game');
      setLoading(false);
    }
  };

  const handleJoinGame = () => {
    if (!gameId || !playerName) {
      setError('Please enter both game ID and player name');
      return;
    }
    const playerId = `player_${Date.now()}`;
    onStartGame(gameId, playerId, playerName);
  };

  if (gameId) {
    return (
      <div className="lobby">
        <h1>Game Table</h1>
        <div className="game-info">
          <p className="game-id">Game ID: <strong>{gameId}</strong></p>
          <input
            type="text"
            placeholder="Enter your name"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            className="input"
          />
          <button onClick={handleJoinGame} className="btn btn-primary">
            Join Game
          </button>
          <button onClick={() => setGameId('')} className="btn btn-secondary">
            Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="lobby">
      <h1>Game Table</h1>
      <div className="lobby-buttons">
        <button
          onClick={handleCreateGame}
          disabled={loading}
          className="btn btn-primary"
        >
          {loading ? 'Creating...' : 'Create New Game'}
        </button>
        <p className="divider">OR</p>
        <input
          type="text"
          placeholder="Enter Game ID"
          value={gameId}
          onChange={(e) => setGameId(e.target.value)}
          className="input"
        />
        <input
          type="text"
          placeholder="Enter your name"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          className="input"
        />
        <button onClick={handleJoinGame} className="btn btn-primary">
          Join Existing Game
        </button>
      </div>
      {error && <p className="error">{error}</p>}
    </div>
  );
};

export default Lobby;
