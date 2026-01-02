import React from 'react';
import '../styles/BattlefieldZone.css';

const BattlefieldZone = ({ player, position, isActive, onUpdateLife, onUpdateCounter, onSpawnCard, onZoom }) => {
  if (!player) {
    return (
      <div 
        className={`battlefield-zone ${position} empty`}
        onContextMenu={(e) => {
          e.preventDefault();
          onSpawnCard && onSpawnCard(position);
        }}
        onDoubleClick={(e) => {
          e.preventDefault();
          onZoom && onZoom(position);
        }}
      >
        <div className={`empty-seat ${position}`}>
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
      onDoubleClick={(e) => {
        e.preventDefault();
        onZoom && onZoom(position);
      }}
    >
      {/* Player Info Card */}
      <div className={`player-card ${position}`}>
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

        {/* Player Counters */}
        <div className="player-counters">
          <div className="counter">
            <button 
              className="counter-btn counter-minus"
              onClick={() => onUpdateCounter(player.id, 'poison', -1)}
              title="Poison -1"
            >
              −
            </button>
            <span className="counter-icon">☠️</span>
            <span className="counter-value">{player.poison || 0}</span>
            <button 
              className="counter-btn counter-plus"
              onClick={() => onUpdateCounter(player.id, 'poison', 1)}
              title="Poison +1"
            >
              +
            </button>
          </div>
          <div className="counter">
            <button 
              className="counter-btn counter-minus"
              onClick={() => onUpdateCounter(player.id, 'energy', -1)}
              title="Energy -1"
            >
              −
            </button>
            <span className="counter-icon">⚡</span>
            <span className="counter-value">{player.energy || 0}</span>
            <button 
              className="counter-btn counter-plus"
              onClick={() => onUpdateCounter(player.id, 'energy', 1)}
              title="Energy +1"
            >
              +
            </button>
          </div>
          <div className="counter">
            <button 
              className="counter-btn counter-minus"
              onClick={() => onUpdateCounter(player.id, 'experience', -1)}
              title="Experience -1"
            >
              −
            </button>
            <span className="counter-icon">⭐</span>
            <span className="counter-value">{player.experience || 0}</span>
            <button 
              className="counter-btn counter-plus"
              onClick={() => onUpdateCounter(player.id, 'experience', 1)}
              title="Experience +1"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* Active Turn Indicator */}
      {isActive && <div className="active-badge">ACTIVE TURN</div>}
    </div>
  );
};

export default BattlefieldZone;
