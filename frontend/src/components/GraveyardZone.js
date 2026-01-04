import React, { useState, useContext } from 'react';
import '../styles/GraveyardZone.css';
import { WebSocketContext } from './GameTable';

const GraveyardZone = ({ cards = [], onInspectCard = null, playerName = null, onViewZone = null, playerId = null, onMoveCard = null }) => {
  const ws = useContext(WebSocketContext);
  const cardCount = cards?.length || 0;
  const [dragOverZone, setDragOverZone] = useState(false);

  const handleZoneClick = () => {
    if (onViewZone && cardCount > 0) {
      onViewZone('Graveyard', cards);
    }
  };

  const handleDragStart = (e, card) => {
    e.stopPropagation();
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/json', JSON.stringify({ 
      card_id: card.id, 
      from_zone: 'graveyard' 
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
            to_zone: 'graveyard'
          }
        }));
        
        // Call onMoveCard callback if provided
        if (onMoveCard) {
          onMoveCard(data.card_id, data.from_zone, 'graveyard');
        }
      }
    } catch (err) {
      console.error('Drop error:', err);
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

      <div 
        className={`graveyard-cards ${dragOverZone ? 'drag-over' : ''}`}
        onClick={handleZoneClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{ cursor: cardCount > 0 ? 'pointer' : 'default' }}
      >
        {cardCount > 0 ? (
          <div className="graveyard-stack">
            {cards.length > 0 && (
              <div
                key={cards[cards.length - 1].id}
                className="graveyard-card"
                draggable
                onDragStart={(e) => handleDragStart(e, cards[cards.length - 1])}
                onClick={(e) => {
                  e.stopPropagation();
                  if (onViewZone) {
                    onViewZone('Graveyard', cards);
                  }
                }}
                title={`Click to view all ${cards.length} cards in graveyard`}
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
