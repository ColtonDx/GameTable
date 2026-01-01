import React, { useState } from 'react';
import '../styles/LeftSidebar.css';

const LeftSidebar = () => {
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [expandedMenus, setExpandedMenus] = useState({
    playtester: true,
    gameinfo: true
  });

  const toggleMenu = (menu) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menu]: !prev[menu]
    }));
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
                <button className="action-btn">Mulligan</button>
                <button className="action-btn">Reveal Hand</button>
                <button className="action-btn">Reset Game</button>
                <button className="action-btn">Print Decklist</button>
              </div>
            )}
          </div>

          {/* Game Info */}
          <div className="menu-section">
            <button 
              className="menu-toggle"
              onClick={() => toggleMenu('gameinfo')}
            >
              <span className="toggle-icon">
                {expandedMenus.gameinfo ? '▼' : '▶'}
              </span>
              <span>Game Info</span>
            </button>
            {expandedMenus.gameinfo && (
              <div className="menu-content game-info">
                <div className="info-item">
                  <span className="label">Format:</span>
                  <span className="value">Commander</span>
                </div>
                <div className="info-item">
                  <span className="label">Players:</span>
                  <span className="value">4</span>
                </div>
                <div className="info-item">
                  <span className="label">Started:</span>
                  <span className="value">Just now</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LeftSidebar;
