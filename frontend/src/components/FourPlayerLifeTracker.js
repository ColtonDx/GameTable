import React, { useState } from 'react';
import '../styles/FourPlayerLifeTracker.css';

const FourPlayerLifeTracker = ({ gameState, currentPlayerId, onUpdatePlayerLife }) => {
  const [editingPlayerId, setEditingPlayerId] = useState(null);
  const [inputValue, setInputValue] = useState('');

  const handleStartEdit = (playerId, currentLife) => {
    setEditingPlayerId(playerId);
    setInputValue(currentLife.toString());
  };

  const handleConfirmEdit = (playerId, currentLife) => {
    const newLife = parseInt(inputValue) || 0;
    const delta = newLife - currentLife;
    onUpdatePlayerLife(playerId, delta);
    setEditingPlayerId(null);
    setInputValue('');
  };

  const handleCancelEdit = () => {
    setEditingPlayerId(null);
    setInputValue('');
  };

  const handleKeyDown = (e, playerId, currentLife) => {
    if (e.key === 'Enter') {
      handleConfirmEdit(playerId, currentLife);
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };
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
            isEditing={editingPlayerId === getPlayerAtIndex(0).id}
            inputValue={inputValue}
            onStartEdit={() => handleStartEdit(getPlayerAtIndex(0).id, getPlayerAtIndex(0).life)}
            onConfirmEdit={() => handleConfirmEdit(getPlayerAtIndex(0).id, getPlayerAtIndex(0).life)}
            onCancelEdit={handleCancelEdit}
            onInputChange={(val) => setInputValue(val)}
            onKeyDown={(e) => handleKeyDown(e, getPlayerAtIndex(0).id, getPlayerAtIndex(0).life)}
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
            isEditing={editingPlayerId === getPlayerAtIndex(1).id}
            inputValue={inputValue}
            onStartEdit={() => handleStartEdit(getPlayerAtIndex(1).id, getPlayerAtIndex(1).life)}
            onConfirmEdit={() => handleConfirmEdit(getPlayerAtIndex(1).id, getPlayerAtIndex(1).life)}
            onCancelEdit={handleCancelEdit}
            onInputChange={(val) => setInputValue(val)}
            onKeyDown={(e) => handleKeyDown(e, getPlayerAtIndex(1).id, getPlayerAtIndex(1).life)}
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
            isEditing={editingPlayerId === getPlayerAtIndex(3).id}
            inputValue={inputValue}
            onStartEdit={() => handleStartEdit(getPlayerAtIndex(3).id, getPlayerAtIndex(3).life)}
            onConfirmEdit={() => handleConfirmEdit(getPlayerAtIndex(3).id, getPlayerAtIndex(3).life)}
            onCancelEdit={handleCancelEdit}
            onInputChange={(val) => setInputValue(val)}
            onKeyDown={(e) => handleKeyDown(e, getPlayerAtIndex(3).id, getPlayerAtIndex(3).life)}
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
            isEditing={editingPlayerId === getPlayerAtIndex(2).id}
            inputValue={inputValue}
            onStartEdit={() => handleStartEdit(getPlayerAtIndex(2).id, getPlayerAtIndex(2).life)}
            onConfirmEdit={() => handleConfirmEdit(getPlayerAtIndex(2).id, getPlayerAtIndex(2).life)}
            onCancelEdit={handleCancelEdit}
            onInputChange={(val) => setInputValue(val)}
            onKeyDown={(e) => handleKeyDown(e, getPlayerAtIndex(2).id, getPlayerAtIndex(2).life)}
          />
        </div>
      </div>
    </div>
  );
};

const PlayerLifeCard = ({ player, onIncrease, onDecrease, isActive, position, isEditing, inputValue, onStartEdit, onConfirmEdit, onCancelEdit, onInputChange, onKeyDown }) => {
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
        {isEditing ? (
          <input 
            type="number"
            className="life-input-four-player"
            value={inputValue}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={onKeyDown}
            onBlur={onConfirmEdit}
            autoFocus
          />
        ) : (
          <span 
            className="life-value"
            onClick={onStartEdit}
            title="Click to set life total"
          >
            {player.life}
          </span>
        )}
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
