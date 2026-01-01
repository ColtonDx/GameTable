import React, { useState } from 'react';
import '../styles/BottomToolbar.css';

const BottomToolbar = ({ gameState, onUpdateLife, onNextTurn, onAction, onGameMenu }) => {
  const [manaOpen, setManaOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [gameMenuOpen, setGameMenuOpen] = useState(false);
  const [energy, setEnergy] = useState(0);
  const [poison, setPoison] = useState(0);

  const currentPlayer = gameState?.players ? Object.values(gameState.players)[0] : null;
  const life = currentPlayer?.life || 40;

  const manaTypes = [
    { symbol: '⚪', name: 'White', color: '#f8f8f8' },
    { symbol: '🔵', name: 'Blue', color: '#0066cc' },
    { symbol: '⚫', name: 'Black', color: '#1a1a1a' },
    { symbol: '🔴', name: 'Red', color: '#cc0000' },
    { symbol: '🟢', name: 'Green', color: '#009900' },
    { symbol: '◆', name: 'Colorless', color: '#666' },
  ];

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
              <button className="menu-item" onClick={onGameMenu}>
                Restart Game
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Center Section - Resource Counters */}
      <div className="toolbar-section center">
        {/* Life Total */}
        <div className="resource-group">
          <div className="counter life-counter">
            <button 
              className="counter-btn minus"
              onClick={() => onUpdateLife(-1)}
              title="Lose 1 life"
            >
              −
            </button>
            <div className="counter-display">
              <span className="counter-icon">❤️</span>
              <span className="counter-value">{life}</span>
            </div>
            <button 
              className="counter-btn plus"
              onClick={() => onUpdateLife(1)}
              title="Gain 1 life"
            >
              +
            </button>
          </div>
        </div>

        {/* Mana Counters */}
        <div className="resource-group">
          <button 
            className="mana-button"
            onClick={() => setManaOpen(!manaOpen)}
            title="Mana pool"
          >
            <span className="mana-symbol">◆</span>
            <span>0</span>
          </button>
          {manaOpen && (
            <div className="mana-popup">
              <div className="mana-grid">
                {manaTypes.map(mana => (
                  <button 
                    key={mana.name}
                    className="mana-type"
                    title={mana.name}
                  >
                    <span className="mana-icon">{mana.symbol}</span>
                    <span className="mana-count">0</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Energy Counter */}
        <div className="resource-group">
          <div className="counter energy-counter">
            <button 
              className="counter-btn minus"
              onClick={() => setEnergy(Math.max(0, energy - 1))}
              title="Lose 1 energy"
            >
              −
            </button>
            <div className="counter-display">
              <span className="counter-icon">⚡</span>
              <span className="counter-value">{energy}</span>
            </div>
            <button 
              className="counter-btn plus"
              onClick={() => setEnergy(energy + 1)}
              title="Gain 1 energy"
            >
              +
            </button>
          </div>
        </div>

        {/* Poison Counter */}
        <div className="resource-group">
          <div className="counter poison-counter">
            <button 
              className="counter-btn minus"
              onClick={() => setPoison(Math.max(0, poison - 1))}
              title="Lose 1 poison"
            >
              −
            </button>
            <div className="counter-display">
              <span className="counter-icon">☠️</span>
              <span className="counter-value">{poison}</span>
            </div>
            <button 
              className="counter-btn plus"
              onClick={() => setPoison(poison + 1)}
              title="Gain 1 poison"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* Right Section - Action Buttons */}
      <div className="toolbar-section right">
        <button 
          className="toolbar-btn action-btn"
          onClick={onNextTurn}
        >
          <span>Next Turn</span>
        </button>
        <button 
          className="toolbar-btn action-btn"
          onClick={onAction}
        >
          <span>Actions</span>
        </button>
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
