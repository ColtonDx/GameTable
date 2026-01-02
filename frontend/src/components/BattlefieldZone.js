import React from 'react';
import '../styles/BattlefieldZone.css';

const BattlefieldZone = ({ player, position, isActive }) => {
  if (!player) {
    return (
      <div className={`battlefield-zone ${position} empty`}>
        <div className="empty-seat">
          <span className="seat-label">Empty Seat</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`battlefield-zone ${position} ${isActive ? 'active' : ''}`}>
      {/* Player Info Bar */}
      <div className="player-info-bar">
        <div className="player-name">{player.name}</div>
        <div className="player-life">
          <span className="life-icon">❤️</span>
          <span className="life-value">{player.life}</span>
        </div>
      </div>

      {/* Battlefield Cards Area */}
      <div className="battlefield-cards">
        <div className="cards-container">
          {/* Placeholder for rendered cards */}
          <div className="placeholder-text">
            {player.hand && player.hand.length > 0
              ? `${player.hand.length} card${player.hand.length !== 1 ? 's' : ''}`
              : 'Empty'}
          </div>
        </div>
      </div>

      {/* Active Turn Indicator */}
      {isActive && <div className="active-badge">ACTIVE TURN</div>}
    </div>
  );
};

export default BattlefieldZone;
