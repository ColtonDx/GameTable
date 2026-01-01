import React, { useState } from 'react';
import '../styles/MulliganScreen.css';

const MulliganScreen = ({ cards, onKeepHand, onMulligan, mulliganCount = 0 }) => {
  const [selectedCard, setSelectedCard] = useState(null);
  const maxMulligans = 2;

  const handleMulligan = () => {
    if (mulliganCount < maxMulligans) {
      onMulligan();
    }
  };

  return (
    <div className="mulligan-overlay">
      <div className="mulligan-container">
        <div className="mulligan-header">
          <h1>Opening Hand</h1>
          <p className="mulligan-subtitle">
            {mulliganCount === 0 
              ? 'Decide whether to keep this hand' 
              : `Mulligan ${mulliganCount} (${maxMulligans - mulliganCount} left)`}
          </p>
        </div>

        {/* Card Fan Display */}
        <div className="mulligan-cards">
          <div className="cards-fan">
            {cards && cards.length > 0 ? (
              cards.map((card, index) => (
                <div
                  key={card.id || index}
                  className={`mulligan-card ${selectedCard === index ? 'selected' : ''}`}
                  style={{
                    transform: `translateX(${(index - Math.floor(cards.length / 2)) * 70}px) rotateY(${(index - Math.floor(cards.length / 2)) * 12}deg)`,
                    zIndex: selectedCard === index ? 20 : index
                  }}
                  onClick={() => setSelectedCard(index)}
                >
                  <div className="card-content">
                    <div className="card-art">
                      <div className="mana-cost">2</div>
                    </div>
                    <div className="card-details">
                      <div className="card-name">{card.name}</div>
                      <div className="card-type">Creature</div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-cards">No cards available</div>
            )}
          </div>
        </div>

        {/* Action Menu */}
        <div className="mulligan-actions">
          <div className="action-buttons">
            {selectedCard !== null && (
              <>
                <button className="action-btn secondary">
                  Bottom of Library
                </button>
                <button className="action-btn secondary">
                  Exile
                </button>
              </>
            )}
          </div>

          <div className="main-buttons">
            <button 
              className="btn btn-keep"
              onClick={() => onKeepHand()}
            >
              <span className="btn-icon">✓</span>
              Keep This Hand
            </button>
            <button 
              className={`btn btn-mulligan ${mulliganCount >= maxMulligans ? 'disabled' : ''}`}
              onClick={handleMulligan}
              disabled={mulliganCount >= maxMulligans}
            >
              <span className="btn-icon">↻</span>
              Mulligan {mulliganCount > 0 ? `(${mulliganCount}/${maxMulligans})` : ''}
            </button>
          </div>

          <button className="btn btn-options">
            Options ⋮
          </button>
        </div>

        {/* Info Text */}
        <div className="mulligan-info">
          <p>
            {cards && cards.length > 0 
              ? `Your opening hand has ${cards.length} card${cards.length !== 1 ? 's' : ''}`
              : 'Waiting for cards...'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default MulliganScreen;
