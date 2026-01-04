import React from 'react';
import '../styles/ExileZone.css';

const ExileZone = ({ cards = [], onInspectCard = null, playerName = null }) => {
  const cardCount = cards?.length || 0;

  return (
    <div className="exile-zone">
      <div className="exile-header">
        <div className="exile-zone-header">
          <div className="exile-zone-title">Exile</div>
          <div className="card-count">{cardCount}</div>
        </div>
      </div>

      <div className="exile-cards">
        {cardCount > 0 ? (
          <div className="exile-stack">
            {cards.length > 0 && (
              <div
                key={cards[cards.length - 1].id}
                className="exile-card"
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
          <div className="empty-exile">No cards</div>
        )}
      </div>
    </div>
  );
};

export default ExileZone;
