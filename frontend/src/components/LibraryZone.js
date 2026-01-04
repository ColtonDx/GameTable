import React, { useState } from 'react';
import '../styles/LibraryZone.css';
import ScryCountSelector from './ScryCountSelector';

const LibraryZone = ({ cards = [], ws = null, playerId = null, playerName = null, onInspectCard = null, onReveal = null, onScry = null, onSurveil = null }) => {
  const [contextMenu, setContextMenu] = useState(null);
  const [showMillSelector, setShowMillSelector] = useState(false);

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

  const handleSurveil = () => {
    if (cards && cards.length > 0 && onSurveil) {
      onSurveil(cards);
    }
    setContextMenu(null);
  };

  const handleManifest = () => {
    if (ws && ws.readyState === WebSocket.OPEN && playerId && cards && cards.length > 0) {
      // Take the top card and put it on the battlefield face down
      ws.send(JSON.stringify({
        ManifestCard: {
          player_id: playerId,
          card_id: cards[0]?.id,
          position_x: 250,
          position_y: 250
        }
      }));
    }
    setContextMenu(null);
  };

  const handleMillCard = () => {
    setShowMillSelector(true);
    setContextMenu(null);
  };

  const handleMillConfirm = (count) => {
    if (ws && ws.readyState === WebSocket.OPEN && playerId && cards && cards.length > 0) {
      // Mill the top 'count' cards
      for (let i = 0; i < count && i < cards.length; i++) {
        ws.send(JSON.stringify({
          MoveCard: {
            player_id: playerId,
            card_id: cards[i].id,
            from_zone: 'library',
            to_zone: 'graveyard'
          }
        }));
      }
    }
    setShowMillSelector(false);
  };

  const handleMillCancel = () => {
    setShowMillSelector(false);
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
          <button className="context-menu-item" onClick={handleMillCard}>
            Mill
          </button>
          <button className="context-menu-item" onClick={handleReveal}>
            Reveal
          </button>
          <button className="context-menu-item" onClick={handleScry}>
            Scry
          </button>
          <button className="context-menu-item" onClick={handleSurveil}>
            Surveil
          </button>
          <button className="context-menu-item" onClick={handleManifest}>
            Manifest
          </button>
        </div>
      )}

      {/* Mill Count Selector */}
      {showMillSelector && (
        <ScryCountSelector
          maxCards={cards.length}
          onConfirm={handleMillConfirm}
          onCancel={handleMillCancel}
          mode="Mill"
        />
      )}
    </div>
  );
};

export default LibraryZone;
