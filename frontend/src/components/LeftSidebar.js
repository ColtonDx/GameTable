import React, { useState } from 'react';
import '../styles/LeftSidebar.css';

const LeftSidebar = () => {
  const [expandedMenus, setExpandedMenus] = useState({});

  const toggleMenu = (menu) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menu]: !prev[menu]
    }));
  };

  return (
    <div className="left-sidebar">
      <div className="sidebar-header">
        <h2>Game Tools</h2>
      </div>

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

        {/* Keybinds */}
        <div className="menu-section">
          <button 
            className="menu-toggle"
            onClick={() => toggleMenu('keybinds')}
          >
            <span className="toggle-icon">
              {expandedMenus.keybinds ? '▼' : '▶'}
            </span>
            <span>Keybinds</span>
          </button>
          {expandedMenus.keybinds && (
            <div className="menu-content keybinds-list">
              <div className="keybind-item">
                <span className="key">Space</span>
                <span className="description">Pass Priority</span>
              </div>
              <div className="keybind-item">
                <span className="key">Tab</span>
                <span className="description">Toggle Grid</span>
              </div>
              <div className="keybind-item">
                <span className="key">M</span>
                <span className="description">Mute/Unmute</span>
              </div>
              <div className="keybind-item">
                <span className="key">Esc</span>
                <span className="description">Open Menu</span>
              </div>
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
                <span className="label">Started:</span>
                <span className="value">Just now</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeftSidebar;
