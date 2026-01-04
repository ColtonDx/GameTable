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
            {cards.length > 0 && (
              <div
                key={cards[cards.length - 1].id}
                className="graveyard-card"
                onClick={() => onInspectCard && onInspectCard(cards[cards.length - 1], playerName)}
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
