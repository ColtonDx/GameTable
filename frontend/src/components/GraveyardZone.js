import React from 'react';
import '../styles/GraveyardZone.css';

const GraveyardZone = ({ cards = [], onInspectCard = null, playerName = null, onViewZone = null }) => {
  const cardCount = cards?.length || 0;

  const handleZoneClick = () => {
    if (onViewZone && cardCount > 0) {
      onViewZone('Graveyard', cards);
    }
  };

  return (
    <div className="graveyard-zone">
      <div className="graveyard-header">
        <div className="graveyard-zone-header">
          <div className="graveyard-zone-title">Graveyard</div>
          <div className="card-count">{cardCount}</div>
        </div>
      </div>

      <div className="graveyard-cards" onClick={handleZoneClick} style={{ cursor: cardCount > 0 ? 'pointer' : 'default' }}>
        {cardCount > 0 ? (
          <div className="graveyard-stack">
            {cards.length > 0 && (
              <div
                key={cards[cards.length - 1].id}
                className="graveyard-card"
                onClick={(e) => {
                  e.stopPropagation();
                  onInspectCard && onInspectCard(cards[cards.length - 1], playerName);
                }}
                title={cards[cards.length - 1].name}
              >
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
            )}
          </div>
        ) : (
          <div className="empty-graveyard">No cards</div>
        )}
      </div>
    </div>
  );
};

export default GraveyardZone;
