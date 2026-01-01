import React from 'react';
import '../styles/PlayerProfile.css';

const PlayerProfile = ({ playerName, life }) => {
  return (
    <div className="player-profile">
      <div className="profile-card">
        {/* Hexagonal Avatar */}
        <div className="avatar-container">
          <div className="hexagon-avatar">
            <div className="hex-inner">
              {playerName.substring(0, 1).toUpperCase()}
            </div>
          </div>
        </div>

        {/* Player Info */}
        <div className="player-info">
          <div className="player-name">{playerName}</div>
          <div className="player-status">Ready</div>
        </div>

        {/* Life Total Display */}
        <div className="life-section">
          <div className="life-display">
            <span className="life-icon">❤️</span>
            <span className="life-total">{life}</span>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="quick-stats">
        <div className="stat-box">
          <span className="stat-label">Cards in Hand</span>
          <span className="stat-value">7</span>
        </div>
        <div className="stat-box">
          <span className="stat-label">Cards in Deck</span>
          <span className="stat-value">53</span>
        </div>
      </div>
    </div>
  );
};

export default PlayerProfile;
