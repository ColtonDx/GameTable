import React, { useState, useContext } from 'react';
import '../styles/ExileZone.css';
import { WebSocketContext } from './GameTable';

const ExileZone = ({ cards = [], onInspectCard = null, playerName = null, onViewZone = null, playerId = null, onMoveCard = null }) => {
  const ws = useContext(WebSocketContext);
  const cardCount = cards?.length || 0;
  const [dragOverZone, setDragOverZone] = useState(false);

  const handleZoneClick = () => {
    if (onViewZone && cardCount > 0) {
      onViewZone('Exile', cards);
    }
  };

  const handleDragStart = (e, card) => {
    e.stopPropagation();
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/json', JSON.stringify({ 
      card_id: card.id, 
      from_zone: 'exile' 
    }));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    setDragOverZone(true);
  };

  const handleDragLeave = () => {
    setDragOverZone(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverZone(false);
    
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      if (data.card_id && data.from_zone && ws && ws.readyState === WebSocket.OPEN && playerId) {
        // Send move card message
        ws.send(JSON.stringify({
          MoveCard: {
            player_id: playerId,
            card_id: data.card_id,
            from_zone: data.from_zone,
            to_zone: 'exile'
          }
        }));
        
        // Call onMoveCard callback if provided
        if (onMoveCard) {
          onMoveCard(data.card_id, data.from_zone, 'exile');
        }
      }
    } catch (err) {
      console.error('Drop error:', err);
    }
  };

  return (
    <div className="exile-zone">
      <div className="exile-header">
        <div className="exile-zone-header">
          <div className="exile-zone-title">Exile</div>
          <div className="card-count">{cardCount}</div>
        </div>
      </div>

      <div 
        className={`exile-cards ${dragOverZone ? 'drag-over' : ''}`}
        onClick={handleZoneClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{ cursor: cardCount > 0 ? 'pointer' : 'default' }}
      >
        {cardCount > 0 ? (
          <div className="exile-stack">
            {cards.length > 0 && (
              <div
                key={cards[cards.length - 1].id}
                className="exile-card"
                draggable
                onDragStart={(e) => handleDragStart(e, cards[cards.length - 1])}
                onClick={(e) => {
                  e.stopPropagation();
                  if (onViewZone) {
                    onViewZone('Exile', cards);
                  }
                }}
                title={`Click to view all ${cards.length} cards in exile`}
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
