import React, { useState } from 'react';
import '../styles/HandZone.css';

const HandZone = ({ cards, onSelectCard, onHandOptions, scale = 1, ws = null, playerId = null, playerName = null, position = 'bottom-left', onInspectCard = null, onReveal = null }) => {
  const [selectedCardIndex, setSelectedCardIndex] = useState(null);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [draggedCard, setDraggedCard] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const [handMenu, setHandMenu] = useState(false);

  // Debug logging
  React.useEffect(() => {
    console.log('HandZone received cards:', cards);
  }, [cards]);

  const getCardImagePath = (card) => {
    // Show back if card is flipped
    if (card.is_flipped) {
      return `/GameTableData/Players/${playerName}/sleeve.jpg`;
    }
    // For now, all blank cards use the blank.jpg image
    if (card.name && card.name.includes('Blank')) {
      return '/GameTableData/General/blank.jpg';
    }
    // Check if this is a dual-faced card showing its back side
    if (card.is_two_sided && card.is_back_face && card.set_code && card.collector_number) {
      return `/GameTableData/Sets/${card.set_code}/${card.set_code}/${card.collector_number}-b.jpg`;
    }
    // Check if this is a dual-faced card showing its front side
    if (card.is_two_sided && !card.is_back_face && card.set_code && card.collector_number) {
      return `/GameTableData/Sets/${card.set_code}/${card.set_code}/${card.collector_number}.jpg`;
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

  const handlePlayBackside = () => {
    if (!contextMenu) return;
    
    if (ws && ws.readyState === WebSocket.OPEN && playerId) {
      ws.send(JSON.stringify({
        FlipCardFace: {
          player_id: playerId,
          card_id: contextMenu.card.id
        }
      }));
    }
    setContextMenu(null);
  };

  const handleInspectCard = () => {
    if (contextMenu && onInspectCard) {
      onInspectCard(contextMenu.card, playerName);
    }
    setContextMenu(null);
  };

  const handleReveal = () => {
    if (contextMenu && onReveal) {
      onReveal(contextMenu.card, 'hand');
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

  // Hand Menu Actions
  const handleDiscardHand = () => {
    if (!ws || ws.readyState !== WebSocket.OPEN || !playerId || cards.length === 0) return;

    cards.forEach(card => {
      ws.send(JSON.stringify({
        MoveCard: {
          player_id: playerId,
          card_id: card.id,
          from_zone: 'hand',
          to_zone: 'graveyard'
        }
      }));
    });
    setHandMenu(false);
  };

  const handleDiscardRandom = () => {
    if (!ws || ws.readyState !== WebSocket.OPEN || !playerId || cards.length === 0) return;

    const randomIndex = Math.floor(Math.random() * cards.length);
    const randomCard = cards[randomIndex];

    ws.send(JSON.stringify({
      MoveCard: {
        player_id: playerId,
        card_id: randomCard.id,
        from_zone: 'hand',
        to_zone: 'graveyard'
      }
    }));
    setHandMenu(false);
  };

  const handleWheel = () => {
    if (!ws || ws.readyState !== WebSocket.OPEN || !playerId || cards.length === 0) return;

    const handSize = cards.length;

    // Discard all cards
    cards.forEach(card => {
      ws.send(JSON.stringify({
        MoveCard: {
          player_id: playerId,
          card_id: card.id,
          from_zone: 'hand',
          to_zone: 'graveyard'
        }
      }));
    });

    // Draw the same number of cards
    ws.send(JSON.stringify({
      DrawCard: {
        card_name: 'Card',
        count: handSize
      }
    }));

    setHandMenu(false);
  };

  const handleHandMenuClick = (e) => {
    e.stopPropagation();
    setHandMenu(!handMenu);
  };

  // Close hand menu when clicking elsewhere
  React.useEffect(() => {
    const handleClick = () => setHandMenu(false);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

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
        <div className="hand-options-wrapper">
          <button 
            className="hand-options-btn"
            onClick={handleHandMenuClick}
            title="Hand options menu"
          >
            ⋮
          </button>
          {handMenu && (
            <div className="hand-menu">
              <button 
                className="hand-menu-item"
                onClick={handleDiscardHand}
                disabled={cards.length === 0}
              >
                Discard Hand
              </button>
              <button 
                className="hand-menu-item"
                onClick={handleDiscardRandom}
                disabled={cards.length === 0}
              >
                Discard at Random
              </button>
              <button 
                className="hand-menu-item"
                onClick={handleWheel}
                disabled={cards.length === 0}
              >
                Wheel
              </button>
            </div>
          )}
        </div>
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
          {contextMenu.card.is_two_sided && (
            <button className="context-menu-item" onClick={handlePlayBackside}>
              {contextMenu.card.is_back_face ? 'Play Front Side' : 'Play Back Side'}
            </button>
          )}
          <button className="context-menu-item" onClick={handleInspectCard}>
            Inspect
          </button>
          <button className="context-menu-item" onClick={handleReveal}>
            Reveal
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
