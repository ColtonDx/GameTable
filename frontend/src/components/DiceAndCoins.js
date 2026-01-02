import React, { useState } from 'react';
import '../styles/DiceAndCoins.css';

const DiceAndCoins = ({ onRoll }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [result, setResult] = useState(null);

  const handleCoinFlip = () => {
    const result = Math.random() < 0.5 ? 'Heads' : 'Tails';
    setResult({ type: 'coin', value: result });
    onRoll({ type: 'coin', result });
  };

  const handleD6Roll = () => {
    const value = Math.floor(Math.random() * 6) + 1;
    setResult({ type: 'd6', value });
    onRoll({ type: 'd6', result: value });
  };

  const handleD20Roll = () => {
    const value = Math.floor(Math.random() * 20) + 1;
    setResult({ type: 'd20', value });
    onRoll({ type: 'd20', result: value });
  };

  return (
    <div className="dice-and-coins">
      <div className="menu-container">
        <button 
          className="toolbar-btn with-dropdown"
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className="icon">🎲</span>
          <span>Dice & Coins</span>
        </button>
        {isOpen && (
          <div className="toolbar-menu dice-menu-dropdown">
            <button className="menu-item" onClick={handleCoinFlip}>
              🪙 Flip a Coin
            </button>
            <button className="menu-item" onClick={handleD6Roll}>
              🎲 Roll a D6
            </button>
            <button className="menu-item" onClick={handleD20Roll}>
              🎲 Roll a D20
            </button>
          </div>
        )}
      </div>

      {result && (
        <div className={`roll-result result-${result.type}`}>
          {result.type === 'coin' ? (
            <span>{result.value}</span>
          ) : (
            <span>{result.value}</span>
          )}
        </div>
      )}
    </div>
  );
};

export default DiceAndCoins;
