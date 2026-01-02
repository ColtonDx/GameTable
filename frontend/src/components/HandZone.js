import React, { useState } from 'react';
import '../styles/HandZone.css';

const HandZone = ({ cards, onSelectCard, onHandOptions, scale = 1 }) => {
  const [selectedCardIndex, setSelectedCardIndex] = useState(null);
  const [scrollOffset, setScrollOffset] = useState(0);

  const handleSelectCard = (index) => {
    setSelectedCardIndex(index);
    if (onSelectCard) onSelectCard(cards[index]);
  };

  const handleScroll = (direction) => {
    const maxScroll = Math.max(0, cards.length - 3);
    const newOffset = direction === 'left' 
      ? Math.max(0, scrollOffset - 1)
      : Math.min(maxScroll, scrollOffset + 1);
    setScrollOffset(newOffset);
  };

  return (
    <div className="hand-zone">
      <div className="hand-header">
        <div className="hand-title">
          <span className="title-text">Hand</span>
          <span className="card-count">{cards.length} card{cards.length !== 1 ? 's' : ''}</span>
        </div>
        <button 
          className="hand-options-btn"
          onClick={onHandOptions}
          title="Hand options menu"
        >
          ⋮
        </button>
      </div>

      <div className="hand-container" style={{ transform: `scale(${scale})`, transformOrigin: 'top center' }}>
        {/* Left Navigation Arrow */}
        {cards.length > 0 && (
          <button 
            className="nav-arrow left-arrow"
            onClick={() => handleScroll('left')}
            disabled={scrollOffset === 0}
          >
            ◀
          </button>
        )}

        {/* Card Fan Display */}
        <div className="cards-fan-wrapper">
          <div className="cards-fan">
            {cards.length > 0 ? (
              cards.map((card, index) => (
                <div
                  key={card.id}
                  className={`card-in-hand ${selectedCardIndex === index ? 'selected' : ''}`}
                  style={{
                    transform: `translateX(${(index - scrollOffset) * 60}px) rotateY(${(index - scrollOffset) * 8}deg)`,
                    zIndex: selectedCardIndex === index ? 10 : index
                  }}
                  onClick={() => handleSelectCard(index)}
                >
                  <div className="card-content">
                    <div className="card-image"></div>
                    <div className="card-name">{card.name}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-hand">No cards in hand</div>
            )}
          </div>
        </div>

        {/* Right Navigation Arrow */}
        {cards.length > 0 && (
          <button 
            className="nav-arrow right-arrow"
            onClick={() => handleScroll('right')}
            disabled={scrollOffset >= Math.max(0, cards.length - 3)}
          >
            ▶
          </button>
        )}
      </div>
    </div>
  );
};

export default HandZone;
