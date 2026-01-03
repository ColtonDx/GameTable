import React, { useState, useRef, useEffect } from 'react';
import '../styles/Lobby.css';
import Login from './Login';

const Lobby = ({ onStartGame }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [playerName, setPlayerName] = useState('');
  const [gameId, setGameId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [gameSelected, setGameSelected] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const gameIdInputRef = useRef(null);

  useEffect(() => {
    // Check if user is logged in
    const user = localStorage.getItem('currentUser');
    if (user) {
      const userData = JSON.parse(user);
      setCurrentUser(userData);
      setPlayerName(userData.username);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    setCurrentUser(null);
    setPlayerName('');
    setGameId('');
    setGameSelected(false);
  };

  if (!currentUser) {
    return <Login onLoginSuccess={setCurrentUser} />;
  }

  const handleGameIdChange = (e) => {
    // Convert to uppercase for game ID input
    const newValue = e.target.value.toUpperCase();
    setGameId(newValue);
  };

  const handleCreateGame = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/game/create');
      const data = await response.json();
      setGameId(data.game_id);
      setGameSelected(true);
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
    // Generate and store a persistent player ID for this game session
    // This ensures the player maintains their seat if they reload the page
    let playerId = sessionStorage.getItem(`playerId_${gameId}`);
    if (!playerId) {
      playerId = `player_${Date.now()}`;
      sessionStorage.setItem(`playerId_${gameId}`, playerId);
    }
    // Ensure gameId is uppercase before sending
    onStartGame(gameId.toUpperCase(), playerId, playerName);
  };

  const handleStartJoin = () => {
    if (!gameId) {
      setError('Please enter a game ID');
      return;
    }
    setGameSelected(true);
  };

  if (gameSelected) {
    return (
      <div 
        className="lobby"
        style={{
          backgroundImage: "url('/GameTableData/General/wallpaper.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }}
      >
        <h1>Game Table</h1>
        <div className="game-info">
          <p className="game-id">Game ID: <strong>{gameId}</strong></p>
          <input
            id="player-name-input-2"
            type="text"
            placeholder="Enter your name"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleJoinGame()}
            className="input"
            autoComplete="off"
            autoFocus
          />
          <button onClick={handleJoinGame} className="btn btn-primary">
            Join Game
          </button>
          <button onClick={() => {
            // Clear the stored player ID for this game when going back
            sessionStorage.removeItem(`playerId_${gameId}`);
            setGameSelected(false);
            setGameId('');
            setPlayerName('');
          }} className="btn btn-secondary">
            Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="lobby"
      style={{
        backgroundImage: "url('/GameTableData/General/wallpaper.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      <button className="settings-btn" onClick={() => setShowSettings(!showSettings)} title="Settings">
        ⚙️
      </button>
      
      <h1>Game Table</h1>
      
      {showSettings && (
        <div className="settings-menu">
          <h3>Settings</h3>
          <p>Logged in as: <strong>{currentUser.username}</strong></p>
          <button onClick={handleLogout} className="btn btn-secondary">
            Logout
          </button>
          <button onClick={() => setShowSettings(false)} className="btn btn-secondary">
            Close
          </button>
        </div>
      )}
      
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
          ref={gameIdInputRef}
          id="game-id-input"
          type="text"
          placeholder="Enter Game ID"
          value={gameId}
          onChange={handleGameIdChange}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleStartJoin();
            }
          }}
          className="input"
          autoComplete="off"
          spellCheck="false"
        />
        <input
          id="player-name-input"
          type="text"
          placeholder="Enter your name"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleStartJoin()}
          className="input"
          autoComplete="off"
        />
        <button onClick={handleStartJoin} className="btn btn-primary">
          Join Existing Game
        </button>
      </div>
      {error && <p className="error">{error}</p>}
    </div>
  );
};

export default Lobby;
