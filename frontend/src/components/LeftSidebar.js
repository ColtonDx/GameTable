import React, { useState } from 'react';
import '../styles/LeftSidebar.css';

const LeftSidebar = ({ gameId }) => {
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState({
    playtester: false
  });

  const toggleMenu = (menu) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menu]: !prev[menu]
    }));
  };

  const copyGameCode = () => {
    navigator.clipboard.writeText(gameId);
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
              <button 
                className="copy-btn"
                onClick={copyGameCode}
                title="Copy game code"
              >
                📋
              </button>
            </div>
          </div>

          {/* Playtester Actions */}
          <div className="menu-section">
            <button 
              className="menu-toggle"
              onClick={() => toggleMenu('playtester')}
            >
              <span className="toggle-icon">
                {expandedMenus.playtester ? '▼' : '▶'}
              </span>
              <span>Playtester Actions</span>
            </button>
            {expandedMenus.playtester && (
              <div className="menu-content">
                <button className="action-btn">Draw Card</button>
                <button className="action-btn">Reveal Hand</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LeftSidebar;
