import React, { useState } from 'react';
import '../styles/HandZone.css';

const HandZone = ({ cards, onSelectCard, onHandOptions, scale = 1 }) => {
  const [selectedCardIndex, setSelectedCardIndex] = useState(null);
  const [scrollOffset, setScrollOffset] = useState(0);

  // Debug logging
  React.useEffect(() => {
    console.log('HandZone received cards:', cards);
  }, [cards]);

  const getCardImagePath = (card) => {
    // For now, all blank cards use the blank.jpg image
    if (card.name && card.name.includes('Blank')) {
      return '/GameTableData/General/blank.jpg';
    }
    // Future: implement set-based lookup here
    // For now, default to blank if image not found
    return '/GameTableData/General/blank.jpg';
  };

  const handleSelectCard = (index) => {
    // Toggle deselection if clicking the same card
    if (selectedCardIndex === index) {
      setSelectedCardIndex(null);
    } else {
      setSelectedCardIndex(index);
      if (onSelectCard) onSelectCard(cards[index]);
    }
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

      <div className="hand-container" style={{ transform: `scale(${scale})`, transformOrigin: 'center' }}>
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
                  onClick={() => handleSelectCard(index)}
                >
                  <div className="card-content">
                    <div 
                      className="card-image"
                      style={{
                        backgroundImage: `url('${getCardImagePath(card)}')`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                      }}
                    ></div>
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
