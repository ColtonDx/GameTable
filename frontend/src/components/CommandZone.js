import React, { useState } from 'react';
import '../styles/CommandZone.css';

const CommandZone = ({ cards, ws = null, playerId = null, playerName = null, onInspectCard = null }) => {
  const [draggedCard, setDraggedCard] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);

  const getCardImagePath = (card) => {
    // Show back if card is flipped
    if (card.is_flipped) {
      return `/GameTableData/Players/${playerName}/sleeve.jpg`;
    }
    // For now, all blank cards use the blank.jpg image
    if (card.name && card.name.includes('Blank')) {
      return '/GameTableData/General/blank.jpg';
    }
    return '/GameTableData/General/blank.jpg';
  };

  const handleDragStart = (e, card, index) => {
    setDraggedCard({ card, index });
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/json', JSON.stringify({ card_id: card.id, from_zone: 'command_zone' }));
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
            to_zone: 'command_zone'
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
    }
    setContextMenu(null);
  };

  const handleInspectCard = () => {
    if (contextMenu && onInspectCard) {
      onInspectCard(contextMenu.card, playerName);
    }
    setContextMenu(null);
  };

  const sendCardTo = (toZone) => {
    if (!contextMenu || !ws || ws.readyState !== WebSocket.OPEN || !playerId) return;

    const payload = {
      MoveCard: {
        player_id: playerId,
        card_id: contextMenu.card.id,
        from_zone: 'command_zone',
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
    <div className="command-zone">
      <div className="command-zone-header">
        <span className="command-zone-title">Command Zone</span>
        <span className="card-count">{cards.length} card{cards.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="command-zone-cards" onDragOver={handleDragOver} onDrop={handleDrop}>
        {cards.length > 0 ? (
          <div className="command-stack">
            {cards.map((card, index) => (
              <div
                key={card.id}
                className={`command-card ${draggedCard?.card.id === card.id ? 'dragging' : ''} ${card.is_commander ? 'commander' : ''}`}
                draggable
                onDragStart={(e) => handleDragStart(e, card, index)}
                onDragEnd={handleDragEnd}
                onContextMenu={(e) => handleContextMenu(e, card, index)}
                onClick={() => onInspectCard && onInspectCard(card, playerName)}
                title={card.name}
                style={{ zIndex: index }}
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
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-command">No cards</div>
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

export default CommandZone;
