import React from 'react';
import '../styles/FourPlayerLifeTracker.css';

const FourPlayerLifeTracker = ({ gameState, currentPlayerId, onUpdatePlayerLife }) => {
  const players = gameState?.players ? Object.values(gameState.players) : [];
  
  // Get all 4 players, or create placeholders for empty seats
  const getPlayerAtIndex = (index) => {
    if (players[index]) return players[index];
    return {
      id: `empty-${index}`,
      name: `Seat ${index + 1}`,
      life: 40,
      isPlaceholder: true
    };
  };

  const updateLife = (playerId, delta) => {
    if (!getPlayerAtIndex(players.findIndex(p => p?.id === playerId))?.isPlaceholder) {
      onUpdatePlayerLife(playerId, delta);
    }
  };

  return (
    <div className="four-player-life-tracker">
      {/* Top Row */}
      <div className="tracker-row top-row">
        {/* Top-Left Player */}
        <div className="life-box top-left">
          <PlayerLifeCard 
            player={getPlayerAtIndex(0)}
            onIncrease={() => updateLife(getPlayerAtIndex(0).id, 1)}
            onDecrease={() => updateLife(getPlayerAtIndex(0).id, -1)}
            isActive={getPlayerAtIndex(0)?.id === currentPlayerId}
            position="top-left"
          />
        </div>

        {/* Top-Right Player */}
        <div className="life-box top-right">
          <PlayerLifeCard 
            player={getPlayerAtIndex(1)}
            onIncrease={() => updateLife(getPlayerAtIndex(1).id, 1)}
            onDecrease={() => updateLife(getPlayerAtIndex(1).id, -1)}
            isActive={getPlayerAtIndex(1)?.id === currentPlayerId}
            position="top-right"
          />
        </div>
      </div>

      {/* Bottom Row */}
      <div className="tracker-row bottom-row">
        {/* Bottom-Left Player */}
        <div className="life-box bottom-left">
          <PlayerLifeCard 
            player={getPlayerAtIndex(3)}
            onIncrease={() => updateLife(getPlayerAtIndex(3).id, 1)}
            onDecrease={() => updateLife(getPlayerAtIndex(3).id, -1)}
            isActive={getPlayerAtIndex(3)?.id === currentPlayerId}
            position="bottom-left"
          />
        </div>

        {/* Bottom-Right Player */}
        <div className="life-box bottom-right">
          <PlayerLifeCard 
            player={getPlayerAtIndex(2)}
            onIncrease={() => updateLife(getPlayerAtIndex(2).id, 1)}
            onDecrease={() => updateLife(getPlayerAtIndex(2).id, -1)}
            isActive={getPlayerAtIndex(2)?.id === currentPlayerId}
            position="bottom-right"
          />
        </div>
      </div>
    </div>
  );
};

const PlayerLifeCard = ({ player, onIncrease, onDecrease, isActive, position }) => {
  return (
    <div className={`player-life-card ${isActive ? 'active' : ''} ${player.isPlaceholder ? 'placeholder' : ''}`}>
      {/* Player Name */}
      <div className="player-name-display">{player.name}</div>

      {/* Life Display */}
      <div className="life-display-box">
        <button 
          className="life-btn decrease-btn"
          onClick={onDecrease}
          disabled={player.isPlaceholder}
          title="Lose 1 life"
        >
          −
        </button>
        <div className="life-number">
          <span className="life-value">{player.life}</span>
        </div>
        <button 
          className="life-btn increase-btn"
          onClick={onIncrease}
          disabled={player.isPlaceholder}
          title="Gain 1 life"
        >
          +
        </button>
      </div>

      {/* Active Indicator */}
      {isActive && <div className="active-indicator">ACTIVE</div>}
    </div>
  );
};

export default FourPlayerLifeTracker;
