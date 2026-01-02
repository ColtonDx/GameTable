import React from 'react';
import '../styles/BattlefieldZone.css';

const BattlefieldZone = ({ player, position, isActive, onUpdateLife, onSpawnCard }) => {
  if (!player) {
    return (
      <div 
        className={`battlefield-zone ${position} empty`}
        onContextMenu={(e) => {
          e.preventDefault();
          onSpawnCard && onSpawnCard(position);
        }}
      >
        <div className="empty-seat">
          <span className="seat-label">Empty Seat</span>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`battlefield-zone ${position} ${isActive ? 'active' : ''}`}
      onContextMenu={(e) => {
        e.preventDefault();
        onSpawnCard && onSpawnCard(position);
      }}
    >
      {/* Player Info Bar */}
      <div className="player-info-bar">
        <div className="player-name">{player.name}</div>
        <div className="player-life">
          <button 
            className="life-btn life-minus"
            onClick={() => onUpdateLife(player.id, -1)}
            title="Lose 1 life"
          >
            −
          </button>
          <span className="life-icon">❤️</span>
          <span className="life-value">{player.life}</span>
          <button 
            className="life-btn life-plus"
            onClick={() => onUpdateLife(player.id, 1)}
            title="Gain 1 life"
          >
            +
          </button>
        </div>
      </div>

      {/* Player Counters */}
      <div className="player-counters">
        <div className="counter">
          <span className="counter-icon">☠️</span>
          <span className="counter-value">{player.poison || 0}</span>
        </div>
        <div className="counter">
          <span className="counter-icon">⚡</span>
          <span className="counter-value">{player.energy || 0}</span>
        </div>
        <div className="counter">
          <span className="counter-icon">⭐</span>
          <span className="counter-value">{player.experience || 0}</span>
        </div>
      </div>

      {/* Battlefield Cards Area */}
      <div className="battlefield-cards">
        <div className="cards-container">
          {/* Placeholder for rendered cards */}
          <div className="placeholder-text">
            Right-click to spawn card
          </div>
        </div>
      </div>

      {/* Active Turn Indicator */}
      {isActive && <div className="active-badge">ACTIVE TURN</div>}
    </div>
  );
};

export default BattlefieldZone;
