import React, { useState } from 'react';
import ZonesPanel from './ZonesPanel';
import '../styles/CollapsibleZones.css';

const CollapsibleZones = ({ gameState }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`collapsible-zones ${isOpen ? 'open' : 'closed'}`}>
      <button 
        className="zones-toggle"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="toggle-icon">{isOpen ? '▼' : '▲'}</span>
        <span className="toggle-text">Zones</span>
      </button>

      {isOpen && (
        <div className="zones-content">
          <ZonesPanel gameState={gameState} />
        </div>
      )}
    </div>
  );
};

export default CollapsibleZones;
