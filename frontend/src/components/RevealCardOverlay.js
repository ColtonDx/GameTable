import React from 'react';
import '../styles/RevealCardOverlay.css';

const RevealCardOverlay = ({ playerName, cardName, cardId, onClose }) => {
  return (
    <div className="reveal-overlay" onClick={onClose}>
      <div className="reveal-container" onClick={(e) => e.stopPropagation()}>
        <div className="reveal-header">
          <h3>{playerName} Reveals:</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="reveal-card-image">
          <div
            style={{
              backgroundImage: `url('/GameTableData/General/blank.jpg')`,
              backgroundSize: 'contain',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              width: '100%',
              height: '100%'
            }}
          ></div>
        </div>
        
        <div className="reveal-card-name">
          <p>{cardName}</p>
        </div>
        
        <button className="close-btn-large" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
};

export default RevealCardOverlay;
