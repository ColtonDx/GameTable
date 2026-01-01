import React, { useState } from 'react';
import '../styles/PlayerZone.css';

const PlayerZone = ({ player, playerIndex, onDrawCard, onMoveCard }) => {
  const [newCardName, setNewCardName] = useState('');

  const handleDrawCard = () => {
    if (newCardName.trim()) {
      onDrawCard(newCardName);
      setNewCardName('');
    }
  };

  const zones = [
    { name: 'hand', label: 'Hand' },
    { name: 'battlefield', label: 'Battlefield' },
    { name: 'graveyard', label: 'Graveyard' },
    { name: 'exile', label: 'Exile' },
    { name: 'command_zone', label: 'Command Zone' }
  ];

  return (
    <div className={`player-zone player-${playerIndex}`}>
      <h3>{player.name}</h3>

      <div className="draw-card-section">
        <input
          type="text"
          placeholder="Card name"
          value={newCardName}
          onChange={(e) => setNewCardName(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleDrawCard()}
          className="input"
        />
        <button onClick={handleDrawCard} className="btn btn-sm btn-primary">
          Draw Card
        </button>
      </div>

      <div className="zones">
        {zones.map((zone) => (
          <div key={zone.name} className="zone">
            <h4>{zone.label}</h4>
            <div className="card-list">
              {player[zone.name.replace('_', '_')] && player[zone.name.replace('_', '_')].length > 0 ? (
                player[zone.name.replace('_', '_')].map((card) => (
                  <div key={card.id} className="card">
                    <span>{card.name}</span>
                  </div>
                ))
              ) : (
                <p className="empty">No cards</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlayerZone;
