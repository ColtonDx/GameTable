import React, { useState, useContext } from 'react';
import '../styles/ZoneViewerModal.css';
import { WebSocketContext } from './GameTable';

const ZoneViewerModal = ({ zoneName, cards, onClose, playerId = null }) => {
  const ws = useContext(WebSocketContext);
  const [contextMenu, setContextMenu] = useState(null);

  const handleContextMenu = (e, card) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      card: card
    });
  };

  const sendCardTo = (toZone) => {
    if (!contextMenu || !ws || ws.readyState !== WebSocket.OPEN || !playerId) return;

    const payload = {
      MoveCard: {
        player_id: playerId,
        card_id: contextMenu.card.id,
        from_zone: zoneName.toLowerCase(),
        to_zone: toZone === 'library_top' || toZone === 'library_bottom' || toZone === 'library_shuffle' ? 'library' : toZone
      }
    };

    ws.send(JSON.stringify(payload));
    setContextMenu(null);
  };

  React.useEffect(() => {
    const handleClick = () => setContextMenu(null);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  return (
    <div className="zone-viewer-overlay" onClick={onClose}>
      <div className="zone-viewer-container" onClick={(e) => e.stopPropagation()}>
        <div className="zone-viewer-header">
          <h2>{zoneName} ({cards.length} cards)</h2>
          <button className="zone-viewer-close" onClick={onClose}>×</button>
        </div>

        <div className="zone-viewer-grid">
          {cards.map((card, idx) => (
            <div 
              key={card.id} 
              className="zone-card"
              onContextMenu={(e) => handleContextMenu(e, card)}
            >
              <div className="zone-card-image">
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
              <p className="zone-card-name">{card.name}</p>
              <p className="zone-card-order">#{idx + 1}</p>
            </div>
          ))}
        </div>

        {/* Context Menu for Card Actions */}
        {contextMenu && (
          <div 
            className="card-context-menu" 
            style={{ top: contextMenu.y, left: contextMenu.x }}
          >
            <div className="context-submenu">
              <button className="context-menu-item submenu-trigger">
                Send To...
              </button>
              <div className="submenu-items">
                <button className="submenu-item" onClick={() => sendCardTo('hand')}>
                  To the Hand
                </button>
                <button className="submenu-item" onClick={() => sendCardTo('battlefield')}>
                  To the Battlefield
                </button>
                <button className="submenu-item" onClick={() => sendCardTo('command_zone')}>
                  To the Command Zone
                </button>
                {zoneName !== 'Graveyard' && (
                  <button className="submenu-item" onClick={() => sendCardTo('graveyard')}>
                    To the Graveyard
                  </button>
                )}
                {zoneName !== 'Exile' && (
                  <button className="submenu-item" onClick={() => sendCardTo('exile')}>
                    To Exile
                  </button>
                )}
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
    </div>
  );
};

export default ZoneViewerModal;
