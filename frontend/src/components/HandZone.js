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
    return '/GameTableData/General/blank.jpg';
  };

  const handleSelectCard = () => {
    // Card selection removed - just keep hover feedback
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

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      if (ws && ws.readyState === WebSocket.OPEN && playerId) {
        ws.send(JSON.stringify({
          MoveCard: {
            player_id: playerId,
            card_id: data.card_id,
            from_zone: data.from_zone,
            to_zone: 'hand'
          }
        }));
      }
    } catch (err) {
      console.error('Drop error:', err);
    }
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

  const sendCardTo = (toZone) => {
    if (!contextMenu || !ws || ws.readyState !== WebSocket.OPEN || !playerId) return;

    const payload = {
      MoveCard: {
        player_id: playerId,
        card_id: contextMenu.card.id,
        from_zone: 'hand',
        to_zone: toZone === 'library_top' || toZone === 'library_bottom' || toZone === 'library_shuffle' ? 'library' : toZone
      }
    };

    ws.send(JSON.stringify(payload));
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

      <div className="hand-display-area" onDragOver={handleDragOver} onDrop={handleDrop}>
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
                    className={`card-in-hand ${draggedCard?.card.id === card.id ? 'dragging' : ''} ${card.is_commander ? 'commander' : ''}`}
                    draggable
                    onDragStart={(e) => handleDragStart(e, card, index)}
                    onDragEnd={handleDragEnd}
                    onContextMenu={(e) => handleContextMenu(e, card, index)}
                  >
                    <div 
                      className="card-image"
                      style={{
                        backgroundImage: `url('${getCardImagePath(card)}')`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                      }}
                    >
                      {card.is_token && <div className="token-label">TOKEN</div>}
                    </div>
                    <div className="card-name">{card.name}</div>
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
          <div className="context-submenu-divider"></div>
          <div className="context-submenu">
            <button className="context-menu-item submenu-trigger">
              Send To...
            </button>
            <div className="submenu-items">
              <button className="submenu-item" onClick={() => sendCardTo('hand')}>
                To the Hand
              </button>
              <button className="submenu-item" onClick={() => sendCardTo('exile')}>
                To Exile
              </button>
              <button className="submenu-item" onClick={() => sendCardTo('graveyard')}>
                To the Graveyard
              </button>
              <button className="submenu-item" onClick={() => sendCardTo('library_top')}>
                To the Top of the Library
              </button>
              <button className="submenu-item" onClick={() => sendCardTo('library_bottom')}>
                To the Bottom of the Library
              </button>
              <button className="submenu-item" onClick={() => sendCardTo('library_shuffle')}>
                Shuffled into the Library
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HandZone;
