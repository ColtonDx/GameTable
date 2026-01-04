import React, { useState } from 'react';
import '../styles/PlayerZone.css';

const PlayerZone = ({ player, playerIndex, isCurrentPlayer, onUpdateLife, onDrawCard, onMoveCard }) => {
  const [newCardName, setNewCardName] = useState('');
  const [expandedZone, setExpandedZone] = useState('hand');

  const handleDrawCard = () => {
    if (newCardName.trim()) {
      onDrawCard(newCardName);
      setNewCardName('');
    }
  };

  const zones = [
    { name: 'hand', label: 'Hand', key: 'hand' },
    { name: 'command_zone', label: 'Commander', key: 'command_zone' },
    { name: 'graveyard', label: 'Graveyard', key: 'graveyard' },
    { name: 'exile', label: 'Exile', key: 'exile' }
  ];

  const isEmptySeat = player.id.startsWith('empty_');

  return (
    <div className={`player-zone ${isCurrentPlayer ? 'current-player' : ''}`}>
      <div className="player-header">
        <img 
          src={`/GameTableData/Players/${player.name}/profile.jpg`}
          alt={`${player.name}'s profile`}
          className="player-profile-pic"
          onError={(e) => {
            // Fallback if profile picture doesn't exist
            e.target.style.display = 'none';
          }}
        />
        <h3>{player.name}</h3>
        {isCurrentPlayer && <span className="you-badge">You</span>}
      </div>

      {!isEmptySeat && (
        <>
          {/* Life Display */}
          <div className="life-display">
            <span className="life-label">Life:</span>
            <span className="life-value">{player.life}</span>
          </div>

          {/* Quick Actions */}
          {isCurrentPlayer && (
            <div className="quick-actions">
              <button 
                onClick={() => onUpdateLife(player.id, -1)}
                className="btn btn-xs btn-danger"
              >
                −1
              </button>
              <button 
                onClick={() => onUpdateLife(player.id, 1)}
                className="btn btn-xs btn-success"
              >
                +1
              </button>
              <button 
                onClick={() => onUpdateLife(player.id, -5)}
                className="btn btn-xs btn-danger"
              >
                −5
              </button>
              <button 
                onClick={() => onUpdateLife(player.id, 5)}
                className="btn btn-xs btn-success"
              >
                +5
              </button>
            </div>
          )}

          {/* Draw Card Section */}
          {isCurrentPlayer && (
            <div className="draw-card-section">
              <input
                type="text"
                placeholder="Card name"
                value={newCardName}
                onChange={(e) => setNewCardName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleDrawCard()}
                className="input input-sm"
              />
              <button onClick={handleDrawCard} className="btn btn-xs btn-primary">
                Add
              </button>
            </div>
          )}

          {/* Card Zones */}
          <div className="zones-container">
            {zones.map((zone) => {
              const zoneCards = player[zone.key] || [];
              return (
                <div key={zone.name} className="zone-compact">
                  <div 
                    className="zone-header"
                    onClick={() => setExpandedZone(expandedZone === zone.name ? null : zone.name)}
                  >
                    <span className="zone-label">{zone.label}</span>
                    <span className="card-count">{zoneCards.length}</span>
                  </div>
                  
                  {expandedZone === zone.name && (
                    <div className="zone-cards">
                      {zoneCards.length > 0 ? (
                        zoneCards.map((card) => (
                          <div key={card.id} className="card-compact">
                            {card.name}
                          </div>
                        ))
                      ) : (
                        <p className="empty">No cards</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default PlayerZone;
