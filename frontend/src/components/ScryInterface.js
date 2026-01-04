import React, { useState } from 'react';
import '../styles/ScryInterface.css';

const ScryInterface = ({ libraryCards, playerName, scryCount, onComplete, onCancel }) => {
  const cardsToView = libraryCards.slice(0, scryCount || libraryCards.length);
  const [viewingCards, setViewingCards] = useState(cardsToView);
  const [topCards, setTopCards] = useState([]);
  const [bottomCards, setBottomCards] = useState([]);

  const handleDragStart = (e, card, source) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/json', JSON.stringify({ cardId: card.id, source }));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDropToTop = (e) => {
    e.preventDefault();
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      const cardId = data.cardId;
      let card = null;

      if (data.source === 'viewing') {
        const index = viewingCards.findIndex(c => c.id === cardId);
        if (index !== -1) {
          card = viewingCards[index];
          setViewingCards(viewingCards.filter((_, i) => i !== index));
        }
      } else if (data.source === 'bottom') {
        const index = bottomCards.findIndex(c => c.id === cardId);
        if (index !== -1) {
          card = bottomCards[index];
          setBottomCards(bottomCards.filter((_, i) => i !== index));
        }
      }

      if (card && !topCards.find(c => c.id === cardId)) {
        setTopCards([...topCards, card]);
      }
    } catch (err) {
      console.error('Drop error:', err);
    }
  };

  const handleDropToBottom = (e) => {
    e.preventDefault();
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      const cardId = data.cardId;
      let card = null;

      if (data.source === 'viewing') {
        const index = viewingCards.findIndex(c => c.id === cardId);
        if (index !== -1) {
          card = viewingCards[index];
          setViewingCards(viewingCards.filter((_, i) => i !== index));
        }
      } else if (data.source === 'top') {
        const index = topCards.findIndex(c => c.id === cardId);
        if (index !== -1) {
          card = topCards[index];
          setTopCards(topCards.filter((_, i) => i !== index));
        }
      }

      if (card && !bottomCards.find(c => c.id === cardId)) {
        setBottomCards([...bottomCards, card]);
      }
    } catch (err) {
      console.error('Drop error:', err);
    }
  };

  const handleDropToViewing = (e) => {
    e.preventDefault();
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      const cardId = data.cardId;
      let card = null;

      if (data.source === 'top') {
        const index = topCards.findIndex(c => c.id === cardId);
        if (index !== -1) {
          card = topCards[index];
          setTopCards(topCards.filter((_, i) => i !== index));
        }
      } else if (data.source === 'bottom') {
        const index = bottomCards.findIndex(c => c.id === cardId);
        if (index !== -1) {
          card = bottomCards[index];
          setBottomCards(bottomCards.filter((_, i) => i !== index));
        }
      }

      if (card && !viewingCards.find(c => c.id === cardId)) {
        setViewingCards([...viewingCards, card]);
      }
    } catch (err) {
      console.error('Drop error:', err);
    }
  };

  const handleComplete = () => {
    const finalTop = [...topCards, ...viewingCards];
    onComplete(finalTop, bottomCards);
  };

  return (
    <div className="scry-overlay">
      <div className="scry-container">
        <div className="scry-header">
          <h3>{playerName} is Scrying ({scryCount || cardsToView.length} cards)</h3>
        </div>

        <div className="scry-columns">
          {/* Browsing Column */}
          <div className="scry-column">
            <div className="scry-column-title">Browsing ({viewingCards.length})</div>
            <div 
              className="scry-drop-zone"
              onDragOver={handleDragOver}
              onDrop={handleDropToViewing}
            >
              {viewingCards.map(card => (
                <div
                  key={card.id}
                  className="scry-card-item"
                  draggable
                  onDragStart={(e) => handleDragStart(e, card, 'viewing')}
                >
                  <div className="scry-card-image">
                    <div
                      style={{
                        backgroundImage: `url('/GameTableData/General/blank.jpg')`,
                        backgroundSize: 'contain',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                        width: '100%',
                        height: '100%'
                      }}
                    ></div>
                  </div>
                  <p className="scry-card-name">{card.name}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Put on Top Column */}
          <div className="scry-column">
            <div className="scry-column-title">Put on Top ({topCards.length})</div>
            <div 
              className="scry-drop-zone"
              onDragOver={handleDragOver}
              onDrop={handleDropToTop}
            >
              {topCards.map(card => (
                <div
                  key={card.id}
                  className="scry-card-item"
                  draggable
                  onDragStart={(e) => handleDragStart(e, card, 'top')}
                >
                  <div className="scry-card-image">
                    <div
                      style={{
                        backgroundImage: `url('/GameTableData/General/blank.jpg')`,
                        backgroundSize: 'contain',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                        width: '100%',
                        height: '100%'
                      }}
                    ></div>
                  </div>
                  <p className="scry-card-name">{card.name}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Put on Bottom Column */}
          <div className="scry-column">
            <div className="scry-column-title">Put on Bottom ({bottomCards.length})</div>
            <div 
              className="scry-drop-zone"
              onDragOver={handleDragOver}
              onDrop={handleDropToBottom}
            >
              {bottomCards.map(card => (
                <div
                  key={card.id}
                  className="scry-card-item"
                  draggable
                  onDragStart={(e) => handleDragStart(e, card, 'bottom')}
                >
                  <div className="scry-card-image">
                    <div
                      style={{
                        backgroundImage: `url('/GameTableData/General/blank.jpg')`,
                        backgroundSize: 'contain',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                        width: '100%',
                        height: '100%'
                      }}
                    ></div>
                  </div>
                  <p className="scry-card-name">{card.name}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="scry-buttons">
          <button className="scry-btn scry-complete-btn" onClick={handleComplete}>
            Complete Scry
          </button>
          <button className="scry-btn scry-cancel-btn" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScryInterface;
