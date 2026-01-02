import React, { useState, useEffect } from 'react';
import '../styles/DiceAndCoins.css';

const DiceAndCoins = ({ onRoll }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (result) {
      const timer = setTimeout(() => {
        setResult(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [result]);

  const handleCoinFlip = () => {
    const rollResult = Math.random() < 0.5 ? 'Heads' : 'Tails';
    setResult({ type: 'coin', value: rollResult });
    setIsOpen(false);
    onRoll({ type: 'coin', result: rollResult });
  };

  const handleD6Roll = () => {
    const value = Math.floor(Math.random() * 6) + 1;
    setResult({ type: 'd6', value });
    setIsOpen(false);
    onRoll({ type: 'd6', result: value });
  };

  const handleD20Roll = () => {
    const value = Math.floor(Math.random() * 20) + 1;
    setResult({ type: 'd20', value });
    setIsOpen(false);
    onRoll({ type: 'd20', result: value });
  };

  return (
    <>
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
      </div>

      {result && (
        <div className={`roll-result-overlay result-${result.type}`}>
          <div className="roll-result-content">
            {result.type === 'coin' ? (
              <>
                <div className="result-icon">🪙</div>
                <div className="result-value">{result.value}</div>
                <div className="result-label">COIN FLIP</div>
              </>
            ) : result.type === 'd6' ? (
              <>
                <div className="result-icon">🎲</div>
                <div className="result-value">{result.value}</div>
                <div className="result-label">D6 ROLL</div>
              </>
            ) : (
              <>
                <div className="result-icon">🎲</div>
                <div className="result-value">{result.value}</div>
                <div className="result-label">D20 ROLL</div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default DiceAndCoins;
  );
};

export default DiceAndCoins;
