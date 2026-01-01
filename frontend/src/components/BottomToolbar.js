import React, { useState } from 'react';
import '../styles/BottomToolbar.css';

const BottomToolbar = ({ gameState, onUpdateLife, onNextTurn, onAction }) => {
  const [manaOpen, setManaOpen] = useState(false);
  const [energy, setEnergy] = useState(0);
  const [poison, setPoison] = useState(0);

  const currentPlayer = gameState?.players ? Object.values(gameState.players)[0] : null;
  const life = currentPlayer?.life || 20;

  const manaTypes = [
    { symbol: '⚪', name: 'White', color: '#f8f8f8' },
    { symbol: '🔵', name: 'Blue', color: '#0066cc' },
    { symbol: '⚫', name: 'Black', color: '#1a1a1a' },
    { symbol: '🔴', name: 'Red', color: '#cc0000' },
    { symbol: '🟢', name: 'Green', color: '#009900' },
    { symbol: '◆', name: 'Colorless', color: '#666' },
  ];

  return (
    <div className="bottom-toolbar">
      {/* Left Section - Game Menu */}
      <div className="toolbar-section left">
        <button className="toolbar-btn with-dropdown">
          <span className="icon">☰</span>
          <span>Game Menu</span>
        </button>
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
        <button className="toolbar-btn">
          <span>⬆️</span>
          <span>Popout</span>
        </button>
        <button className="toolbar-btn">
          <span>🎲</span>
          <span>Dice</span>
        </button>
        <button className="toolbar-btn">
          <span>⚙️</span>
          <span>Settings</span>
        </button>
      </div>
    </div>
  );
};

export default BottomToolbar;
