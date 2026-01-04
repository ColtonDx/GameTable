import React from 'react';
import '../styles/ZoneViewerModal.css';

const ZoneViewerModal = ({ zoneName, cards, onClose }) => {
  return (
    <div className="zone-viewer-overlay" onClick={onClose}>
      <div className="zone-viewer-container" onClick={(e) => e.stopPropagation()}>
        <div className="zone-viewer-header">
          <h2>{zoneName} ({cards.length} cards)</h2>
          <button className="zone-viewer-close" onClick={onClose}>×</button>
        </div>

        <div className="zone-viewer-grid">
          {cards.map((card, idx) => (
            <div key={card.id} className="zone-card">
              <div className="zone-card-image">
                <div
                  style={{
                    backgroundImage: `url('/GameTableData/General/blank.jpg')`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    width: '100%',
                    height: '100%'
                  }}
                ></div>
              </div>
              <p className="zone-card-name">{card.name}</p>
              <p className="zone-card-order">#{idx + 1}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ZoneViewerModal;
