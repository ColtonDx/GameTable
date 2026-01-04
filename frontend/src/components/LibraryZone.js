import React, { useState } from 'react';
import '../styles/LibraryZone.css';

const LibraryZone = ({ cards = [], ws = null, playerId = null, playerName = null, onInspectCard = null, onReveal = null, onScry = null }) => {
  const [contextMenu, setContextMenu] = useState(null);

  const handleContextMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      x: e.clientX,
      y: e.clientY
    });
  };

  const handleShuffleLibrary = () => {
    if (ws && ws.readyState === WebSocket.OPEN && playerId) {
      ws.send(JSON.stringify({
        ShuffleLibrary: {
          player_id: playerId
        }
      }));
    }
    setContextMenu(null);
  };

  const handleReveal = () => {
    if (cards && cards.length > 0 && onReveal) {
      onReveal(cards[0], 'library');
    }
    setContextMenu(null);
  };

  const handleScry = () => {
    if (cards && cards.length > 0 && onScry) {
      onScry(cards);
    }
    setContextMenu(null);
  };

  const handleDrawCard = () => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        DrawCard: {
          card_name: 'Card'
        }
      }));
    }
  };

  // Close context menu when clicking elsewhere
  React.useEffect(() => {
    const handleClick = () => setContextMenu(null);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const cardCount = cards?.length || 0;

  return (
    <div className="library-zone">
      <div className="library-header">
        <div className="library-zone-header">
          <div className="library-zone-title">Library</div>
          <div className="card-count">{cardCount}</div>
        </div>
      </div>

      <div className="library-cards">
        {cardCount > 0 ? (
          <div
            className="library-card back-card"
            onClick={handleDrawCard}
            onContextMenu={handleContextMenu}
            title="Click to draw a card, right-click for options"
            style={{
              backgroundImage: `url('/GameTableData/Players/${playerName}/sleeve.jpg')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              cursor: 'pointer'
            }}
          ></div>
        ) : (
          <div className="empty-library">No cards</div>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div 
          className="card-context-menu" 
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <button className="context-menu-item" onClick={handleShuffleLibrary}>
            Shuffle Library
          </button>
          <button className="context-menu-item" onClick={handleReveal}>
            Reveal
          </button>
          <button className="context-menu-item" onClick={handleScry}>
            Scry
          </button>
        </div>
      )}
    </div>
  );
};

export default LibraryZone;
