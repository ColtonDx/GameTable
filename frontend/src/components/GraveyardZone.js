import React from 'react';
import '../styles/GraveyardZone.css';

const GraveyardZone = ({ cards = [], onInspectCard = null, playerName = null }) => {
  const cardCount = cards?.length || 0;

  return (
    <div className="graveyard-zone">
      <div className="graveyard-header">
        <div className="graveyard-zone-header">
          <div className="graveyard-zone-title">Graveyard</div>
          <div className="card-count">{cardCount}</div>
        </div>
      </div>

      <div className="graveyard-cards">
        {cardCount > 0 ? (
          <div className="graveyard-stack">
            {cards.map((card, idx) => (
              <div
                key={card.id}
                className="graveyard-card"
                style={{
                  zIndex: idx,
                  transform: `translateY(${idx * 4}px)`
                }}
                onClick={() => onInspectCard && onInspectCard(card, playerName)}
                title={card.name}
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
            ))}
          </div>
        ) : (
          <div className="empty-graveyard">No cards</div>
        )}
      </div>
    </div>
  );
};

export default GraveyardZone;
