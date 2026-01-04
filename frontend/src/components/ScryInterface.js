import React, { useState } from 'react';
import '../styles/ScryInterface.css';

const ScryInterface = ({ libraryCards, playerName, onComplete, onCancel }) => {
  const [topCards, setTopCards] = useState([]);
  const [bottomCards, setBottomCards] = useState([]);
  const [viewingCards, setViewingCards] = useState(libraryCards.slice(0, Math.min(libraryCards.length, 5)));
  const [cardsToView, setCardsToView] = useState(Math.min(libraryCards.length, 5));

  const handleDragStart = (e, cardId, source) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/json', JSON.stringify({ cardId, source }));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDropToTop = (e) => {
    e.preventDefault();
    const data = JSON.parse(e.dataTransfer.getData('application/json'));
    const { cardId, source } = data;
    
    // Find card in current location
    let card = null;
    let newViewing = [...viewingCards];
    let newTop = [...topCards];
    let newBottom = [...bottomCards];

    if (source === 'viewing') {
      card = newViewing.find(c => c.id === cardId);
      newViewing = newViewing.filter(c => c.id !== cardId);
    } else if (source === 'bottom') {
      card = newBottom.find(c => c.id === cardId);
      newBottom = newBottom.filter(c => c.id !== cardId);
    }

    if (card) {
      newTop = [card, ...newTop];
      setTopCards(newTop);
      setViewingCards(newViewing);
      setBottomCards(newBottom);
    }
  };

  const handleDropToBottom = (e) => {
    e.preventDefault();
    const data = JSON.parse(e.dataTransfer.getData('application/json'));
    const { cardId, source } = data;
    
    let card = null;
    let newViewing = [...viewingCards];
    let newTop = [...topCards];
    let newBottom = [...bottomCards];

    if (source === 'viewing') {
      card = newViewing.find(c => c.id === cardId);
      newViewing = newViewing.filter(c => c.id !== cardId);
    } else if (source === 'top') {
      card = newTop.find(c => c.id === cardId);
      newTop = newTop.filter(c => c.id !== cardId);
    }

    if (card) {
      newBottom = [...newBottom, card];
      setBottomCards(newBottom);
      setViewingCards(newViewing);
      setTopCards(newTop);
    }
  };

  const handleComplete = () => {
    // Cards not placed stay in the viewing pile and go back on top
    const finalTop = [...topCards, ...viewingCards];
    onComplete(finalTop, bottomCards);
  };

  return (
    <div className="scry-overlay" onClick={onCancel}>
      <div className="scry-container" onClick={(e) => e.stopPropagation()}>
        <div className="scry-header">
          <h3>Scry - {playerName}</h3>
          <button className="close-btn" onClick={onCancel}>×</button>
        </div>

        <div className="scry-content">
          {/* Viewing Cards */}
          <div className="scry-section">
            <h4>Viewing (Top {cardsToView} cards)</h4>
            <div className="scry-cards-viewing">
              {viewingCards.map((card) => (
                <div
                  key={card.id}
                  className="scry-card"
                  draggable
                  onDragStart={(e) => handleDragStart(e, card.id, 'viewing')}
                >
                  {card.name}
                </div>
              ))}
            </div>
          </div>

          <div className="scry-columns">
            {/* Put on Top */}
            <div className="scry-section">
              <h4>Put on Top</h4>
              <div
                className="scry-drop-zone"
                onDragOver={handleDragOver}
                onDrop={handleDropToTop}
              >
                {topCards.map((card) => (
                  <div
                    key={card.id}
                    className="scry-card"
                    draggable
                    onDragStart={(e) => handleDragStart(e, card.id, 'top')}
                  >
                    {card.name}
                  </div>
                ))}
              </div>
            </div>

            {/* Put on Bottom */}
            <div className="scry-section">
              <h4>Put on Bottom</h4>
              <div
                className="scry-drop-zone"
                onDragOver={handleDragOver}
                onDrop={handleDropToBottom}
              >
                {bottomCards.map((card) => (
                  <div
                    key={card.id}
                    className="scry-card"
                    draggable
                    onDragStart={(e) => handleDragStart(e, card.id, 'bottom')}
                  >
                    {card.name}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="scry-buttons">
          <button className="btn btn-primary" onClick={handleComplete}>
            Done Scrying
          </button>
          <button className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScryInterface;
