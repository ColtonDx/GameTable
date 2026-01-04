import React, { useState } from 'react';
import '../styles/ScryCountSelector.css';

const ScryCountSelector = ({ maxCards, onConfirm, onCancel }) => {
  const [count, setCount] = useState(Math.min(5, maxCards));

  const handleConfirm = () => {
    if (count > 0 && count <= maxCards) {
      onConfirm(count);
    }
  };

  return (
    <div className="scry-count-overlay">
      <div className="scry-count-container">
        <h3>How many cards would you like to scry?</h3>
        <div className="scry-count-input-group">
          <button 
            className="scry-count-btn"
            onClick={() => setCount(Math.max(1, count - 1))}
            disabled={count <= 1}
          >
            −
          </button>
          <input 
            type="number" 
            min="1" 
            max={maxCards}
            value={count}
            onChange={(e) => {
              const val = Math.min(maxCards, Math.max(1, parseInt(e.target.value) || 1));
              setCount(val);
            }}
            className="scry-count-input"
          />
          <button 
            className="scry-count-btn"
            onClick={() => setCount(Math.min(maxCards, count + 1))}
            disabled={count >= maxCards}
          >
            +
          </button>
        </div>
        <p className="scry-count-info">Maximum: {maxCards} cards</p>
        <div className="scry-count-buttons">
          <button 
            className="scry-count-confirm"
            onClick={handleConfirm}
          >
            Scry {count}
          </button>
          <button 
            className="scry-count-cancel"
            onClick={onCancel}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScryCountSelector;
