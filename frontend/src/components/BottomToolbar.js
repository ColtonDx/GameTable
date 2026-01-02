import React, { useState } from 'react';
import '../styles/BottomToolbar.css';
import DiceAndCoins from './DiceAndCoins';

const BottomToolbar = ({ gameState, turnNumber, onNextTurn, onAction, onGameMenu, onUndoTurn }) => {
  const [gameMenuOpen, setGameMenuOpen] = useState(false);
  const [diceResult, setDiceResult] = useState(null);

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

      {/* Center Section - Action Buttons */}
      <div className="toolbar-section center">
      </div>

      {/* Right Section - Turn Info & Settings */}
      <div className="toolbar-section right">
        {/* Dice and Coins */}
        <DiceAndCoins 
          onRoll={(result) => {
            setDiceResult(result);
            // Could emit to WebSocket here to show to all players
          }}
        />

        {/* Turn Counter */}
        <div className="turn-counter">
          <span className="turn-label">Turn</span>
          <span className="turn-number">{turnNumber || 1}</span>
        </div>

        {/* Back a Turn Button */}
        <button 
          className="toolbar-btn action-btn"
          onClick={onUndoTurn}
          title="Go back to the previous turn"
        >
          <span>Back a Turn</span>
        </button>

        {/* Next Turn Button */}
        <button 
          className="toolbar-btn action-btn"
          onClick={onNextTurn}
          title="Pass turn to next player"
        >
          <span>Next Turn</span>
        </button>
      </div>
    </div>
  );
};

export default BottomToolbar;
