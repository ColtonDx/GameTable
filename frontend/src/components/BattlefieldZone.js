import React, { useState } from 'react';
import '../styles/BattlefieldZone.css';

const BattlefieldZone = ({ player, position, isActive, onUpdateLife, onUpdateCounter, onSpawnCard, onZoom, ws = null, playerId = null, onInspectCard = null }) => {
  const [dragOverZone, setDragOverZone] = useState(false);
  const [contextMenu, setContextMenu] = useState(null);
  const [draggedBattlefieldCard, setDraggedBattlefieldCard] = useState(null);
  const [cardBeingDragged, setCardBeingDragged] = useState(null);

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
          // Calculate center position for the dropped card
          const battlefieldElement = e.currentTarget.querySelector('.battlefield-cards');
          const centerX = battlefieldElement ? (battlefieldElement.offsetWidth / 2) - 30 : 100;
          const centerY = battlefieldElement ? (battlefieldElement.offsetHeight / 2) - 43 : 100;
          
          ws.send(JSON.stringify({
            MoveCard: {
              card_id: data.card_id,
              from_zone: data.from_zone,
              to_zone: 'battlefield',
              position_x: centerX,
              position_y: centerY
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

  const handleCardMouseDown = (e, card) => {
    // Don't drag if right-clicking (context menu) or already dragging
    if (e.button !== 0) return;
    e.preventDefault();
    
    setCardBeingDragged({
      card_id: card.id,
      startX: e.clientX,
      startY: e.clientY,
      cardX: card.position_x,
      cardY: card.position_y,
      startTime: Date.now()
    });
  };

  const handleMouseMove = (e) => {
    if (!cardBeingDragged) return;
    
    const deltaX = e.clientX - cardBeingDragged.startX;
    const deltaY = e.clientY - cardBeingDragged.startY;
    
    setDraggedBattlefieldCard({
      card_id: cardBeingDragged.card_id,
      x: cardBeingDragged.cardX + deltaX,
      y: cardBeingDragged.cardY + deltaY
    const cardId = cardBeingDragged.card_id;
    
    // If drag time is very short, treat as click (for tap/untap)
    if (dragTime < 150) {
      handleTapCard(cardId);
    } else if (draggedBattlefieldCard && ws && ws.readyState === WebSocket.OPEN && playerId) {
      // Send new position to server only if card actually moved
      ws.send(JSON.stringify({
        MoveCardOnBattlefield: {
          player_id: playerId,
          card_id: draggedBattlefieldCard.card_id,
          x: draggedBattlefieldCard.x,
          y: draggedBattlefieldCard.y
        }
      }));
    }
    
    // Clear all drag state      player_id: playerId,
          card_id: draggedBattlefieldCard.card_id,
          x: draggedBattlefieldCard.x,
          y: draggedBattlefieldCard.y
        }
      }));
    }
    
    setCardBeingDragged(null);
    setDraggedBattlefieldCard(null);
  };

  // Add mouse move and up listeners when dragging
  React.useEffect(() => {
    if (cardBeingDragged) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        // Ensure drag state is cleared on unmount
        setCardBeingDragged(null);
        setDraggedBattlefieldCard(null
    }
  }, [cardBeingDragged, draggedBattlefieldCard, player, ws, playerId]);

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
        {player.battlefield && player.battlefield.map((card) => {
          // Use real position if available, otherwise use drag position
          const displayCard = draggedBattlefieldCard?.card_id === card.id 
            ? { ...card, position_x: draggedBattlefieldCard.x, position_y: draggedBattlefieldCard.y }
            : card;
          
          return (
            <div
              key={card.id}
              className={`battlefield-card ${card.is_tapped ? 'tapped' : ''} ${draggedBattlefieldCard?.card_id === card.id ? 'being-dragged' : ''}`}
              style={{
                position: 'absolute',
                left: `${displayCard.position_x}px`,
                top: `${displayCard.position_y}px`,
                cursor: cardBeingDragged?.card_id === card.id ? 'grabbing' : 'grab'
              }}
              onMouseDown={(e) => handleCardMouseDown(e, card)}
              onContextMenu={(e) => handleContextMenu(e, card)}
              title="Drag to move, click to tap, right-click for options"
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
          );
        })}
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
