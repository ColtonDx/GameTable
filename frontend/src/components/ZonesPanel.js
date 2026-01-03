import React from 'react';
import '../styles/ZonesPanel.css';

const ZonesPanel = ({ gameState }) => {
  const graveyard = gameState?.players?.[Object.keys(gameState.players || {})[0]]?.graveyard || [];
  const exile = gameState?.players?.[Object.keys(gameState.players || {})[0]]?.exile || [];
  const battlefield = gameState?.battlefield || [];

  const renderZoneStack = (cards, maxShow = 3) => {
    if (cards.length === 0) {
      return <div className="zone-empty">No cards</div>;
    }
    return (
      <div className="zone-stack">
        {cards.slice(-maxShow).map((card, idx) => (
          <div key={card.id} className="stacked-card" style={{ marginTop: idx * 8 }}>
            {card.name}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="zones-panel">
      <div className="zones-container">
        {/* Graveyard */}
        <div className="zone">
          <div className="zone-header">
            <span className="zone-name">Graveyard</span>
            <span className="zone-count">{graveyard.length}</span>
          </div>
          <div className="zone-content">
            {renderZoneStack(graveyard)}
          </div>
        </div>

        {/* Exile */}
        <div className="zone">
          <div className="zone-header">
            <span className="zone-name">Exile</span>
            <span className="zone-count">{exile.length}</span>
          </div>
          <div className="zone-content">
            {renderZoneStack(exile)}
          </div>
        </div>
      </div>

      {/* Battlefield Preview */}
      {battlefield.length > 0 && (
        <div className="battlefield-summary">
          <div className="summary-header">
            <span>Battlefield</span>
            <span className="summary-count">{battlefield.length} permanents</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ZonesPanel;
