import React, { useState } from 'react';
import '../styles/LibraryZone.css';

const LibraryZone = ({ cards = [], ws = null, playerId = null, onInspectCard = null }) => {
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
            onContextMenu={handleContextMenu}
            title="Right-click for options"
            style={{
              backgroundImage: `url('/GameTableData/General/back.jpg')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
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
        </div>
      )}
    </div>
  );
};

export default LibraryZone;
