import React, { useState } from 'react';
import '../styles/HandZone.css';

const HandZone = ({ cards, onSelectCard, onHandOptions, scale = 1, ws = null, playerId = null, position = 'bottom-left', onInspectCard = null }) => {
  const [selectedCardIndex, setSelectedCardIndex] = useState(null);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [draggedCard, setDraggedCard] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);

  // Debug logging
  React.useEffect(() => {
    console.log('HandZone received cards:', cards);
  }, [cards]);

  const getCardImagePath = (card) => {
    // Show back if card is flipped
    if (card.is_flipped) {
      return '/GameTableData/General/back.jpg';
    }
    // For now, all blank cards use the blank.jpg image
    if (card.name && card.name.includes('Blank')) {
      return '/GameTableData/General/blank.jpg';
    }
    // Future: implement set-based lookup here
    // For now, default to blank if image not found
    retCard selection removed - just keep hover feedback setSelectedCardIndex(null);
    } else {
      setSelectedCardIndex(index);
      if (onSelectCard) onSelectCard(cards[index]);
    }
  };

  const handleScroll = (direction) => {
    const maxScroll = Math.max(0, cards.length - 3);
    const newOffset = direction === 'left' 
      ? Math.max(0, scrollOffset - 1)
      : Math.min(maxScroll, scrollOffset + 1);
    setScrollOffset(newOffset);
  };

  const handleDragStart = (e, card, index) => {
    setDraggedCard({ card, index });
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/json', JSON.stringify({ card_id: card.id, from_zone: 'hand' }));
  };

  const handleDragEnd = () => {
    setDraggedCard(null);
  };

  const handleContextMenu = (e, card, index) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      card: card,
      cardIndex: index
    });
  };

  const handleFlipCard = () => {
    if (!contextMenu) return;
    
    if (ws && ws.readyState === WebSocket.OPEN && playerId) {
      ws.send(JSON.stringify({
        FlipCard: {
          player_id: playerId,
          card_id: contextMenu.card.id
        }
      }));
    } else {
      console.warn('Cannot flip card - WebSocket not ready or playerId missing', { ws, playerId, readyState: ws?.readyState });
    }
    setContextMenu(null);
  };

  const handleInspectCard = () => {
    if (contextMenu && onInspectCard) {
      onInspectCard(contextMenu.card);
    }
    setContextMenu(null);
  };

  // Close context menu when clicking elsewhere
  React.useEffect(() => {
    const handleClick = () => setContextMenu(null);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  return (
    <div className="hand-zone">
      <div className="hand-header">
        <div className="hand-title">
          <span className="title-text">Hand</span>
          <span className="card-count">{cards.length} card{cards.length !== 1 ? 's' : ''}</span>
        </div>
        <button 
          className="hand-options-btn"
          onClick={onHandOptions}
          title="Hand options menu"
        >
          ⋮
        </button>
      </div>

      <div className="hand-display-area">
        {/* Left Navigation Arrow - Outside scaled container */}
        {cards.length > 0 && (
          <button 
            className="nav-arrow left-arrow"
            onClick={() => handleScroll('left')}
            disabled={scrollOffset === 0}
          >
            ◀
          </button>
        )}

        {/* Scaled Cards Container */}
        <div className="hand-container" style={{ transform: `scale(${scale})`, transformOrigin: 'center' }}>
          {/* Card Fan Display */}
          <div className="cards-fan-wrapper">
            <div className="cards-fan">
              {cards.length > 0 ? (
                cards.map((card, index) => (
                  <div
                    key={card.id}
                    className={`card-in-hand ${selectedCardIndex === index ? 'selected' : ''} ${draggedCard?.card.id === card.id ? 'dragging' : ''}`}
                    onClick={() => handleSelectCard(index)}
                    draggable
                    onDragStart={(e) => handleDragStart(e, card, index)}
                    onDragEnd={handleDragEnd}
                    onContextMenu={(e) => handleContextMenu(e, card, index)}
                  >draggedCard?.card.id === card.id ? 'dragging' : ''}`
                      <div 
                        className="card-image"
                        style={{
                          backgroundImage: `url('${getCardImagePath(card)}')`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center'
                        }}
                      ></div>
                      <div className="card-name">{card.name}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-hand">No cards in hand</div>
              )}
            </div>
          </div>
        </div>

        {/* Right Navigation Arrow - Outside scaled container */}
        {cards.length > 0 && (
          <button 
            className="nav-arrow right-arrow"
            onClick={() => handleScroll('right')}
            disabled={scrollOffset >= Math.max(0, cards.length - 3)}
          >
            ▶
          </button>
        )}
      </div>

      {/* Context Menu for Card Actions */}
      {contextMenu && (
        <div 
          className="card-context-menu" 
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <button className="context-menu-item" onClick={handleFlipCard}>
            Flip Card
          </button>
          <button className="context-menu-item" onClick={handleInspectCard}>
            Inspect
          </button>
        </div>
      )}
    </div>
  );
};

export default HandZone;
