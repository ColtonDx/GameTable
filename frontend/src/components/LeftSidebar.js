import React, { useState } from 'react';
import '../styles/LeftSidebar.css';

const LeftSidebar = ({ gameId, playerId, ws }) => {
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState({
    library: false
  });
  const [showLoadLibraryModal, setShowLoadLibraryModal] = useState(false);

  const toggleMenu = (menu) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menu]: !prev[menu]
    }));
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

  const handleMillCard = () => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        MillCard: {
          card_name: 'Card'
        }
      }));
    }
  };

  const handleShuffleLibrary = () => {
    if (ws && ws.readyState === WebSocket.OPEN && playerId) {
      ws.send(JSON.stringify({
        ShuffleLibrary: {
          player_id: playerId
        }
      }));
    }
  };

  const handleLoadBlankCards = () => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        LoadLibrary: {
          player_id: playerId,
          card_count: 100,
          card_type: 'blank_white'
        }
      }));
      setShowLoadLibraryModal(false);
    }
  };

  return (
    <div className={`left-sidebar ${!sidebarVisible ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <h2>Game Tools</h2>
        <button 
          className="collapse-btn"
          onClick={() => setSidebarVisible(!sidebarVisible)}
          title={sidebarVisible ? 'Collapse' : 'Expand'}
        >
          {sidebarVisible ? '◀' : '▶'}
        </button>
      </div>

      {sidebarVisible && (
        <div className="sidebar-menu">
          {/* Game Code Section */}
          <div className="game-code-section">
            <div className="game-code-label">Game Code</div>
            <div className="game-code-display">
              <span className="code-value">{gameId}</span>
            </div>
          </div>

          {/* Library Section */}
          <div className="menu-section">
            <button 
              className="menu-toggle"
              onClick={() => toggleMenu('library')}
            >
              <span className="toggle-icon">
                {expandedMenus.library ? '▼' : '▶'}
              </span>
              <span>Library</span>
            </button>
            {expandedMenus.library && (
              <div className="menu-content">
                <button 
                  className="action-btn"
                  onClick={() => setShowLoadLibraryModal(true)}
                >
                  Load a Deck
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Load Deck Modal */}
      {showLoadLibraryModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Load a Deck</h3>
              <button 
                className="modal-close"
                onClick={() => setShowLoadLibraryModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <button 
                className="library-option"
                onClick={handleLoadBlankCards}
              >
                <span className="option-icon">⚪</span>
                <span className="option-name">100 Blank White Cards</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeftSidebar;
