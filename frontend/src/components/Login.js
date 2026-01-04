import React, { useState } from 'react';
import '../styles/Login.css';

const Login = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const endpoint = isRegistering ? '/auth/register' : '/auth/login';

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      const data = await response.json();

      if (data.success && data.user) {
        // Store user info in localStorage
        localStorage.setItem('currentUser', JSON.stringify(data.user));
        onLoginSuccess(data.user);
      } else {
        setError(data.message || 'Authentication failed');
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container" style={{
      backgroundImage: "url('/GameTableData/General/wallpaper.jpg')",
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed'
    }}>
      <div className="login-card">
        <h1 className="login-title">Game Table</h1>
        <form onSubmit={handleAuth}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value.toUpperCase())}
              disabled={loading}
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              autoComplete={isRegistering ? "new-password" : "current-password"}
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="auth-button"
          >
            {loading ? 'Loading...' : isRegistering ? 'Register' : 'Login'}
          </button>
        </form>

        <div className="auth-toggle">
          <p>
            {isRegistering ? 'Already have an account? ' : "Don't have an account? "}
            <button
              type="button"
              onClick={() => setIsRegistering(!isRegistering)}
              className="toggle-button"
            >
              {isRegistering ? 'Login' : 'Register'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
