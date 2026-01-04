import React, { useState, useContext } from 'react';
import '../styles/BattlefieldZone.css';
import { WebSocketContext } from './GameTable';

const BattlefieldZone = ({ player, position, isActive, onUpdateLife, onUpdateCounter, onSpawnCard, onZoom, playerId = null, onInspectCard = null, playmatImage = null }) => {
  const ws = useContext(WebSocketContext);
  const [dragOverZone, setDragOverZone] = useState(false);
  const [contextMenu, setContextMenu] = useState(null);
  const [draggedBattlefieldCard, setDraggedBattlefieldCard] = useState(null);
  const [cardBeingDragged, setCardBeingDragged] = useState(null);
  const [editingValue, setEditingValue] = useState(null);
  const [inputValue, setInputValue] = useState('');

  const handleStartEdit = (type, currentValue) => {
    setEditingValue(type);
    setInputValue(currentValue.toString());
  };

  const handleConfirmEdit = (type, currentValue) => {
    const newValue = parseInt(inputValue) || 0;
    const delta = newValue - currentValue;
    
    if (type === 'life') {
      onUpdateLife(player.id, delta);
    } else {
      onUpdateCounter(player.id, type, delta);
    }
    
    setEditingValue(null);
    setInputValue('');
  };

  const handleCancelEdit = () => {
    setEditingValue(null);
    setInputValue('');
  };

  const handleKeyDown = (e, type, currentValue) => {
    if (e.key === 'Enter') {
      handleConfirmEdit(type, currentValue);
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  const handleZoomClick = (e) => {
    // Trigger zoom on double-click anywhere in the battlefield zone
    // But don't trigger if double-clicking on a card
    if (e.target.closest('.battlefield-card')) {
      return; // Don't zoom if clicking on a card
    }
    onZoom && onZoom(position);
  };

  const getCardImagePath = (card) => {
    if (card.is_flipped) {
      return `/GameTableData/Players/${player.name}/sleeve.jpg`;
    }
    if (card.name && card.name.includes('Blank')) {
      return '/GameTableData/General/blank.jpg';
    }
    // Check if this is a dual-faced card showing its back side
    if (card.is_two_sided && card.is_back_face && card.set_code && card.collector_number) {
      return `/GameTableData/Sets/${card.set_code}/${card.set_code}/${card.collector_number}-b.jpg`;
    }
    // Check if this is a dual-faced card showing its front side
    if (card.is_two_sided && !card.is_back_face && card.set_code && card.collector_number) {
      return `/GameTableData/Sets/${card.set_code}/${card.set_code}/${card.collector_number}.jpg`;
    }
    // Check if this is a regular single-sided card with set_code/collector_number
    if (card.set_code && card.collector_number) {
      return `/GameTableData/Sets/${card.set_code}/${card.set_code}/${card.collector_number}.jpg`;
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

  const handlePlayBackside = () => {
    if (contextMenu && ws && ws.readyState === WebSocket.OPEN && playerId) {
      ws.send(JSON.stringify({
        FlipCardFace: {
          player_id: playerId,
          card_id: contextMenu.card.id
        }
      }));
    }
    setContextMenu(null);
  };

  const handleInspectCard = () => {
    if (contextMenu && onInspectCard) {
      // Pass both card and player name
      onInspectCard(contextMenu.card, player.name);
    }
    setContextMenu(null);
  };

  const handleCopyCard = () => {
    if (contextMenu && ws && ws.readyState === WebSocket.OPEN && playerId) {
      ws.send(JSON.stringify({
        Copy: {
          player_id: playerId,
          card_id: contextMenu.card.id
        }
      }));
    }
    setContextMenu(null);
  };

  const sendCardTo = (toZone) => {
    if (!contextMenu || !ws || ws.readyState !== WebSocket.OPEN || !playerId) return;

    const payload = {
      MoveCard: {
        player_id: playerId,
        card_id: contextMenu.card.id,
        from_zone: 'battlefield',
        to_zone: toZone === 'library_top' || toZone === 'library_bottom' || toZone === 'library_shuffle' ? 'library' : toZone
      }
    };

    ws.send(JSON.stringify(payload));
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

  // Add mouse move and up listeners when dragging
  React.useEffect(() => {
    if (!cardBeingDragged) return;

    const handleMouseMove = (e) => {
      const deltaX = e.clientX - cardBeingDragged.startX;
      const deltaY = e.clientY - cardBeingDragged.startY;
      
      setDraggedBattlefieldCard({
        card_id: cardBeingDragged.card_id,
        x: cardBeingDragged.cardX + deltaX,
        y: cardBeingDragged.cardY + deltaY
      });
    };

    const handleMouseUp = (e) => {
      const dragTime = Date.now() - cardBeingDragged.startTime;
      const cardId = cardBeingDragged.card_id;
      
      // If drag time is very short, treat as click (for tap/untap)
      if (dragTime < 150) {
        handleTapCard(cardId);
      } else {
        // Check if card was dragged to hand or command zone area
        const elementAtDrop = document.elementFromPoint(e.clientX, e.clientY);
        const handZone = elementAtDrop?.closest('.hand-display-area') || elementAtDrop?.closest('.hand-section');
        const commandZone = elementAtDrop?.closest('.command-zone');
        const graveyardZone = elementAtDrop?.closest('.graveyard-zone');
        const exileZone = elementAtDrop?.closest('.exile-zone');
        
        if (handZone) {
          // Drag to hand
          if (ws && ws.readyState === WebSocket.OPEN && playerId) {
            ws.send(JSON.stringify({
              MoveCard: {
                player_id: playerId,
                card_id: cardId,
                from_zone: 'battlefield',
                to_zone: 'hand'
              }
            }));
          }
        } else if (commandZone) {
          // Drag to command zone
          if (ws && ws.readyState === WebSocket.OPEN && playerId) {
            ws.send(JSON.stringify({
              MoveCard: {
                player_id: playerId,
                card_id: cardId,
                from_zone: 'battlefield',
                to_zone: 'command_zone'
              }
            }));
          }
        } else if (graveyardZone) {
          // Drag to graveyard
          if (ws && ws.readyState === WebSocket.OPEN && playerId) {
            ws.send(JSON.stringify({
              MoveCard: {
                player_id: playerId,
                card_id: cardId,
                from_zone: 'battlefield',
                to_zone: 'graveyard'
              }
            }));
          }
        } else if (exileZone) {
          // Drag to exile
          if (ws && ws.readyState === WebSocket.OPEN && playerId) {
            ws.send(JSON.stringify({
              MoveCard: {
                player_id: playerId,
                card_id: cardId,
                from_zone: 'battlefield',
                to_zone: 'exile'
              }
            }));
          }
        } else {
          // Stay on battlefield - send new position
          if (ws && ws.readyState === WebSocket.OPEN && playerId) {
            ws.send(JSON.stringify({
              MoveCardOnBattlefield: {
                player_id: playerId,
                card_id: cardId,
                x: cardBeingDragged.cardX + (e.clientX - cardBeingDragged.startX),
                y: cardBeingDragged.cardY + (e.clientY - cardBeingDragged.startY)
              }
            }));
          }
        }
      }
      
      // Clear all drag state
      setCardBeingDragged(null);
      setDraggedBattlefieldCard(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [cardBeingDragged, ws, playerId]);

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
      style={playmatImage ? {
        backgroundImage: `url('${playmatImage}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      } : {}}
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
          <div className="player-info">
            <div className="player-name">{player.name}</div>
            <div className="player-zones-summary">
              (H:{player.hand?.length || 0} L:{player.library?.length || 0} G:{player.graveyard?.length || 0} E:{player.exile?.length || 0})
            </div>
          </div>
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
          {editingValue === 'life' ? (
            <input 
              type="number"
              className="life-input"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, 'life', player.life)}
              onBlur={() => handleConfirmEdit('life', player.life)}
              autoFocus
            />
          ) : (
            <span 
              className="life-value"
              onClick={() => handleStartEdit('life', player.life)}
              title="Click to set life total"
            >
              {player.life}
            </span>
          )}
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
            {editingValue === 'poison' ? (
              <input 
                type="number"
                className="counter-input"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, 'poison', player.poison || 0)}
                onBlur={() => handleConfirmEdit('poison', player.poison || 0)}
                autoFocus
              />
            ) : (
              <span 
                className="counter-value"
                onClick={() => handleStartEdit('poison', player.poison || 0)}
                title="Click to set poison total"
              >
                {player.poison || 0}
              </span>
            )}
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
            {editingValue === 'energy' ? (
              <input 
                type="number"
                className="counter-input"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, 'energy', player.energy || 0)}
                onBlur={() => handleConfirmEdit('energy', player.energy || 0)}
                autoFocus
              />
            ) : (
              <span 
                className="counter-value"
                onClick={() => handleStartEdit('energy', player.energy || 0)}
                title="Click to set energy total"
              >
                {player.energy || 0}
              </span>
            )}
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
            {editingValue === 'experience' ? (
              <input 
                type="number"
                className="counter-input"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, 'experience', player.experience || 0)}
                onBlur={() => handleConfirmEdit('experience', player.experience || 0)}
                autoFocus
              />
            ) : (
              <span 
                className="counter-value"
                onClick={() => handleStartEdit('experience', player.experience || 0)}
                title="Click to set experience total"
              >
                {player.experience || 0}
              </span>
            )}
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
              className={`battlefield-card ${card.is_tapped ? 'tapped' : ''} ${draggedBattlefieldCard?.card_id === card.id ? 'being-dragged' : ''} ${card.is_commander ? 'commander' : ''}`}
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
              >
                {card.is_token && <div className="token-label">TOKEN</div>}
              </div>
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
          {contextMenu.card.is_two_sided && (
            <button className="context-menu-item" onClick={handlePlayBackside}>
              {contextMenu.card.is_back_face ? 'Play Front Side' : 'Play Back Side'}
            </button>
          )}
          <button className="context-menu-item" onClick={handleInspectCard}>
            Inspect
          </button>
          <button className="context-menu-item" onClick={handleCopyCard}>
            Copy (Token)
          </button>
          <div className="context-submenu-divider"></div>
          <div className="context-submenu">
            <button className="context-menu-item submenu-trigger">
              Send To...
            </button>
            <div className="submenu-items">
              <button className="submenu-item" onClick={() => sendCardTo('hand')}>
                To the Hand
              </button>
              <button className="submenu-item" onClick={() => sendCardTo('exile')}>
                To Exile
              </button>
              <button className="submenu-item" onClick={() => sendCardTo('graveyard')}>
                To the Graveyard
              </button>
              <button className="submenu-item" onClick={() => sendCardTo('library_top')}>
                To the Top of the Library
              </button>
              <button className="submenu-item" onClick={() => sendCardTo('library_bottom')}>
                To the Bottom of the Library
              </button>
              <button className="submenu-item" onClick={() => sendCardTo('library_shuffle')}>
                Shuffled into the Library
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BattlefieldZone;
