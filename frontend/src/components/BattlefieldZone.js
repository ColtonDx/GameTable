import React, { useState } from 'react';
import '../styles/BattlefieldZone.css';

const BattlefieldZone = ({ player, position, isActive, onUpdateLife, onUpdateCounter, onSpawnCard, onZoom, ws = null, playerId = null, onInspectCard = null }) => {
  const [dragOverZone, setDragOverZone] = useState(false);
  const [contextMenu, setContextMenu] = useState(null);

  const handleZoomClick = (e) => {
    // Only trigger zoom if clicking directly on the battlefield-zone background, not on child elements
    if (e.target.classList.contains('battlefield-zone')) {
      e.preventDefault();
      onZoom && onZoom(position);
    }
  };

  const getCardImagePath = (card) => {
    if (card.is_flipped) {
      return '/GameTableData/General/back.jpg';
    }
    if (card.name && card.name.includes('Blank')) {
      return '/GameTableData/General/blank.jpg';
    }
    return '/GameTableData/General/blank.jpg';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverZone(true);
  };

  const handleDragLeave = () => {
    setDragOverZone(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOverZone(false);
    
    // Only allow dropping onto own battlefield
    if (playerId && ws && ws.readyState === WebSocket.OPEN) {
      try {
        const data = JSON.parse(e.dataTransfer.getData('application/json'));
        if (data.card_id && data.from_zone) {
          ws.send(JSON.stringify({
            MoveCard: {
              card_id: data.card_id,
              from_zone: data.from_zone,
              to_zone: 'battlefield'
            }
          }));
        }
      } catch (err) {
        console.error('Error parsing drop data:', err);
      }
    }
  };

  const handleTapCard = (cardId) => {
    if (ws && ws.readyState === WebSocket.OPEN && playerId) {
      ws.send(JSON.stringify({
        TapCard: {
          player_id: playerId,
          card_id: cardId
        }
      }));
    }
  };

  const handleContextMenu = (e, card) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      card: card
    });
  };

  const handleFlipCard = () => {
    if (contextMenu && ws && ws.readyState === WebSocket.OPEN && playerId) {
      ws.send(JSON.stringify({
        FlipCard: {
          player_id: playerId,
          card_id: contextMenu.card.id
        }
      }));
    }
    setContextMenu(null);
  };

  const handleInspectCard = () => {
    if (contextMenu && onInspectCard) {
      onInspectCard(contextMenu.card);
    }
    setContextMenu(null);
  };

  // Close context menu when clicking elsewhere
  React.useEffect(() => {
    const handleClick = () => setContextMenu(null);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  if (!player) {
    return (
      <div 
        className={`battlefield-zone ${position} empty`}
        onContextMenu={(e) => {
          e.preventDefault();
          onSpawnCard && onSpawnCard(position);
        }}
        onDoubleClick={handleZoomClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className={`empty-seat ${position}`}>
          <span className="seat-label">Empty Seat</span>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`battlefield-zone ${position} ${isActive ? 'active' : ''} ${dragOverZone ? 'drag-over' : ''}`}
      onContextMenu={(e) => {
        e.preventDefault();
        onSpawnCard && onSpawnCard(position);
      }}
      onDoubleClick={handleZoomClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Player Info Card */}
      <div className={`player-card ${position}`}>
        <div className="player-name-with-avatar">
          <div className="player-avatar">
            <img src={player.profile_picture} alt={player.name} />
          </div>
          <div className="player-name">{player.name}</div>
        </div>
        
        <div className="player-life">
          <button 
            className="life-btn life-minus"
            onClick={() => onUpdateLife(player.id, -1)}
            title="Lose 1 life"
          >
            −
          </button>
          <span className="life-icon">❤️</span>
          <span className="life-value">{player.life}</span>
          <button 
            className="life-btn life-plus"
            onClick={() => onUpdateLife(player.id, 1)}
            title="Gain 1 life"
          >
            +
          </button>
        </div>

        {/* Player Counters */}
        <div className="player-counters">
          <div className="counter">
            <button 
              className="counter-btn counter-minus"
              onClick={() => onUpdateCounter(player.id, 'poison', -1)}
              title="Poison -1"
            >
              −
            </button>
            <span className="counter-icon">☠️</span>
            <span className="counter-value">{player.poison || 0}</span>
            <button 
              className="counter-btn counter-plus"
              onClick={() => onUpdateCounter(player.id, 'poison', 1)}
              title="Poison +1"
            >
              +
            </button>
          </div>
          <div className="counter">
            <button 
              className="counter-btn counter-minus"
              onClick={() => onUpdateCounter(player.id, 'energy', -1)}
              title="Energy -1"
            >
              −
            </button>
            <span className="counter-icon">⚡</span>
            <span className="counter-value">{player.energy || 0}</span>
            <button 
              className="counter-btn counter-plus"
              onClick={() => onUpdateCounter(player.id, 'energy', 1)}
              title="Energy +1"
            >
              +
            </button>
          </div>
          <div className="counter">
            <button 
              className="counter-btn counter-minus"
              onClick={() => onUpdateCounter(player.id, 'experience', -1)}
              title="Experience -1"
            >
              −
            </button>
            <span className="counter-icon">⭐</span>
            <span className="counter-value">{player.experience || 0}</span>
            <button 
              className="counter-btn counter-plus"
              onClick={() => onUpdateCounter(player.id, 'experience', 1)}
              title="Experience +1"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* Battlefield Cards */}
      <div className="battlefield-cards">
        {player.battlefield && player.battlefield.map((card) => (
          <div
            key={card.id}
            className={`battlefield-card ${card.is_tapped ? 'tapped' : ''}`}
            onClick={() => handleTapCard(card.id)}
            onContextMenu={(e) => handleContextMenu(e, card)}
            title={`Click to ${card.is_tapped ? 'untap' : 'tap'}`}
          >
            <div
              className="card-image"
              style={{
                backgroundImage: `url('${getCardImagePath(card)}')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            ></div>
          </div>
        ))}
      </div>

      {/* Active Turn Indicator */}
      {isActive && <div className={`active-badge ${position}`}>ACTIVE TURN</div>}

      {/* Context Menu for Card Actions */}
      {contextMenu && (
        <div 
          className="card-context-menu" 
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <button className="context-menu-item" onClick={handleFlipCard}>
            Flip Card
          </button>
          <button className="context-menu-item" onClick={handleInspectCard}>
            Inspect
          </button>
        </div>
      )}
    </div>
  );
};

export default BattlefieldZone;
