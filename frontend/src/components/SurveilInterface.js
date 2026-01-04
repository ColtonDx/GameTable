import React, { useState } from 'react';
import '../styles/SurveilInterface.css';

const SurveilInterface = ({ libraryCards, playerName, surveilCount, onComplete, onCancel }) => {
  const cardsToView = libraryCards.slice(0, surveilCount || libraryCards.length);
  const [viewingCards, setViewingCards] = useState(cardsToView);
  const [graveyardCards, setGraveyardCards] = useState([]);

  const handleDragStart = (e, card, source) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/json', JSON.stringify({ cardId: card.id, source }));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDropToGraveyard = (e) => {
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
      } else if (data.source === 'graveyard') {
        const index = graveyardCards.findIndex(c => c.id === cardId);
        if (index !== -1) {
          card = graveyardCards[index];
          setGraveyardCards(graveyardCards.filter((_, i) => i !== index));
        }
      }

      if (card && !graveyardCards.find(c => c.id === cardId)) {
        setGraveyardCards([...graveyardCards, card]);
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

      if (data.source === 'graveyard') {
        const index = graveyardCards.findIndex(c => c.id === cardId);
        if (index !== -1) {
          card = graveyardCards[index];
          setGraveyardCards(graveyardCards.filter((_, i) => i !== index));
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
    // Cards not placed stay on top of library
    const finalTop = [...viewingCards];
    onComplete(finalTop, graveyardCards);
  };

  return (
    <div className="surveil-overlay">
      <div className="surveil-container">
        <div className="surveil-header">
          <h3>{playerName} is Surveiling ({surveilCount || cardsToView.length} cards)</h3>
        </div>

        <div className="surveil-columns">
          {/* Browsing Column */}
          <div className="surveil-column">
            <div className="surveil-column-title">Browsing ({viewingCards.length})</div>
            <div 
              className="surveil-drop-zone"
              onDragOver={handleDragOver}
              onDrop={handleDropToViewing}
            >
              {viewingCards.map(card => (
                <div
                  key={card.id}
                  className="surveil-card-item"
                  draggable
                  onDragStart={(e) => handleDragStart(e, card, 'viewing')}
                >
                  <div className="surveil-card-image">
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
                  <p className="surveil-card-name">{card.name}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Put in Graveyard Column */}
          <div className="surveil-column">
            <div className="surveil-column-title">Send to Graveyard ({graveyardCards.length})</div>
            <div 
              className="surveil-drop-zone"
              onDragOver={handleDragOver}
              onDrop={handleDropToGraveyard}
            >
              {graveyardCards.map(card => (
                <div
                  key={card.id}
                  className="surveil-card-item"
                  draggable
                  onDragStart={(e) => handleDragStart(e, card, 'graveyard')}
                >
                  <div className="surveil-card-image">
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
                  <p className="surveil-card-name">{card.name}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="surveil-buttons">
          <button className="surveil-btn surveil-complete-btn" onClick={handleComplete}>
            Complete Surveil
          </button>
          <button className="surveil-btn surveil-cancel-btn" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default SurveilInterface;
