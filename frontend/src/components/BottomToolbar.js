import React, { useState } from 'react';
import '../styles/BottomToolbar.css';

const BottomToolbar = ({ gameState, turnNumber, onNextTurn, onAction, onGameMenu, onUndoTurn }) => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [gameMenuOpen, setGameMenuOpen] = useState(false);

  const keybinds = [
    { key: 'Space', action: 'Pass Priority' },
    { key: 'Tab', action: 'Toggle Grid' },
    { key: 'M', action: 'Mute/Unmute' },
    { key: 'Esc', action: 'Open Menu' },
    { key: 'Enter', action: 'Confirm Action' },
  ];

  return (
    <div className="bottom-toolbar">
      {/* Left Section - Game Menu */}
      <div className="toolbar-section left">
        <div className="menu-container">
          <button 
            className="toolbar-btn with-dropdown"
            onClick={() => setGameMenuOpen(!gameMenuOpen)}
          >
            <span className="icon">☰</span>
            <span>Game Menu</span>
          </button>
          {gameMenuOpen && (
            <div className="toolbar-menu game-menu-dropdown">
              <button className="menu-item" onClick={onUndoTurn}>
                Undo Turn
              </button>
              <button className="menu-item" onClick={onGameMenu}>
                Restart Game
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Center Section - Action Buttons */}
      <div className="toolbar-section center">
        <button 
          className="toolbar-btn action-btn"
          onClick={onAction}
        >
          <span>Actions</span>
        </button>
      </div>

      {/* Right Section - Turn Info & Settings */}
      <div className="toolbar-section right">
        {/* Turn Counter */}
        <div className="turn-counter">
          <span className="turn-label">Turn</span>
          <span className="turn-number">{turnNumber || 1}</span>
        </div>

        {/* Next Turn Button */}
        <button 
          className="toolbar-btn action-btn"
          onClick={onNextTurn}
          title="Pass turn to next player"
        >
          <span>Next Turn</span>
        </button>

        {/* Settings Button */}
        <button 
          className="toolbar-btn"
          onClick={() => setSettingsOpen(!settingsOpen)}
        >
          <span>⚙️</span>
          <span>Settings</span>
        </button>
      </div>

      {/* Settings Menu */}
      {settingsOpen && (
        <div className="toolbar-menu settings-menu">
          <div className="settings-header">
            <h3>Settings</h3>
            <button 
              className="close-btn"
              onClick={() => setSettingsOpen(false)}
            >
              ✕
            </button>
          </div>

          <div className="settings-section">
            <h4>Keybinds</h4>
            <div className="keybinds-list">
              {keybinds.map(bind => (
                <div key={bind.key} className="keybind-row">
                  <span className="keybind-action">{bind.action}</span>
                  <span className="keybind-key">{bind.key}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="settings-section">
            <h4>Display</h4>
            <label className="setting-label">
              <input type="checkbox" defaultChecked />
              Sound Effects
            </label>
            <label className="setting-label">
              <input type="checkbox" defaultChecked />
              Show Animations
            </label>
          </div>
        </div>
      )}
    </div>
  );
};

export default BottomToolbar;
