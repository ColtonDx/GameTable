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
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const gameIdInputRef = useRef(null);

  useEffect(() => {
    // Check if user is logged in from localStorage (on mount)
    const user = localStorage.getItem('currentUser');
    if (user) {
      const userData = JSON.parse(user);
      setCurrentUser(userData);
    }
  }, []);

  useEffect(() => {
    // Update playerName whenever currentUser changes
    if (currentUser && currentUser.username) {
      setPlayerName(currentUser.username);
    }
  }, [currentUser]);

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
    if (!gameId) {
      setError('Please enter a game ID');
      return;
    }
    if (!playerName) {
      setError('Player name not found. Please log in again.');
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

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordError('');
    
    if (!newPassword || !confirmPassword) {
      setPasswordError('Please fill in both password fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }

    setPasswordLoading(true);

    try {
      const response = await fetch('/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: currentUser.username,
          new_password: newPassword,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setPasswordError('');
        setNewPassword('');
        setConfirmPassword('');
        setShowPasswordChange(false);
        alert('Password changed successfully!');
      } else {
        setPasswordError(data.message || 'Failed to change password');
      }
    } catch (err) {
      setPasswordError('Network error: ' + err.message);
    } finally {
      setPasswordLoading(false);
    }
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
          
          {!showPasswordChange ? (
            <>
              <button onClick={() => setShowPasswordChange(true)} className="btn btn-primary">
                Change Password
              </button>
              <button onClick={handleLogout} className="btn btn-secondary">
                Logout
              </button>
              <button onClick={() => setShowSettings(false)} className="btn btn-secondary">
                Close
              </button>
            </>
          ) : (
            <>
              <form onSubmit={handlePasswordChange}>
                <div className="form-group">
                  <label htmlFor="new-password">New Password</label>
                  <input
                    id="new-password"
                    type="password"
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={passwordLoading}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="confirm-password">Confirm Password</label>
                  <input
                    id="confirm-password"
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={passwordLoading}
                  />
                </div>
                {passwordError && <p style={{ color: '#ff6b6b', fontSize: '12px' }}>{passwordError}</p>}
                <button type="submit" disabled={passwordLoading} className="btn btn-primary">
                  {passwordLoading ? 'Changing...' : 'Change Password'}
                </button>
                <button 
                  type="button" 
                  onClick={() => {
                    setShowPasswordChange(false);
                    setNewPassword('');
                    setConfirmPassword('');
                    setPasswordError('');
                  }} 
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              </form>
            </>
          )}
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
        <button onClick={handleStartJoin} className="btn btn-primary">
          Join Existing Game
        </button>
      </div>
      {error && <p className="error">{error}</p>}
    </div>
  );
};

export default Lobby;
