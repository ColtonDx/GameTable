import React, { useState, useEffect, useRef } from 'react';
import '../styles/GameTableNew.css';
import LeftSidebar from './LeftSidebar';
import BattlefieldZone from './BattlefieldZone';
import HandZone from './HandZone';
import CollapsibleZones from './CollapsibleZones';
import BottomToolbar from './BottomToolbar';

const GameTable = ({ gameId, playerId, playerName, onBack }) => {
  const [gameState, setGameState] = useState(null);
  const [playerJoinOrder, setPlayerJoinOrder] = useState(0);
  const [error, setError] = useState('');
  const [handScale, setHandScale] = useState(1);
  const [zoomedPosition, setZoomedPosition] = useState(null);
  const [sessionValid, setSessionValid] = useState(true);
  const [diceRoll, setDiceRoll] = useState(null);
  const [gameRestart, setGameRestart] = useState(null);
  const [inspectedCard, setInspectedCard] = useState(null);
  const [inspectViewFlipped, setInspectViewFlipped] = useState(false);
  const ws = useRef(null);
  const diceRollTimeoutRef = useRef(null);
  const restartTimeoutRef = useRef(null);
  const connectionAttempts = useRef(0);
  const connectionTimeoutRef = useRef(null);
  const maxConnectionAttempts = 3;
  const connectionTimeout = 8000; // 8 seconds timeout

  useEffect(() => {
    // Set a timeout for the connection attempt
    connectionTimeoutRef.current = setTimeout(() => {
      if (ws.current && ws.current.readyState !== WebSocket.OPEN) {
        console.log('WebSocket connection timeout - session likely invalid');
        ws.current?.close();
        setSessionValid(false);
        setError('Connection timeout. Session may have expired. Returning to lobby...');
        setTimeout(() => {
          onBack();
        }, 2000);
      }
    }, connectionTimeout);

    // Connect to WebSocket
    const wsUrl = `ws://${window.location.hostname}:3001/ws/${gameId}/${playerId}`;
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      console.log('Connected to game server');
      // Clear the connection timeout since we successfully connected
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
      }
      connectionAttempts.current = 0; // Reset attempts on successful connection
      
      // Send player name to backend
      if (playerName) {
        const setNameMsg = {
          SetPlayerName: {
            player_id: playerId,
            name: playerName
          }
        };
        ws.current.send(JSON.stringify(setNameMsg));
      }
    };

    ws.current.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        if (message.GameState && message.GameState.state) {
          const state = JSON.parse(message.GameState.state);
          setGameState(state);
          // Store the player's join order for seat rotation
          if (message.GameState.player_join_order !== undefined) {
            setPlayerJoinOrder(message.GameState.player_join_order);
          }
        } else if (message.DiceRoll) {
          setDiceRoll(message.DiceRoll);
          // Auto-hide dice roll after 4 seconds
          if (diceRollTimeoutRef.current) {
            clearTimeout(diceRollTimeoutRef.current);
          }
          diceRollTimeoutRef.current = setTimeout(() => {
            setDiceRoll(null);
          }, 4000);
        } else if (message.GameRestarted) {
          setGameRestart(message.GameRestarted);
          // Auto-hide restart notification after 5 seconds
          if (restartTimeoutRef.current) {
            clearTimeout(restartTimeoutRef.current);
          }
          restartTimeoutRef.current = setTimeout(() => {
            setGameRestart(null);
          }, 5000);
        } else if (message.Error) {
          setError(message.Error.message);
          setTimeout(() => setError(''), 5000);
        }
      } catch (err) {
        console.error('Error parsing WebSocket message:', err);
      }
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
      setError('Connection error. Attempting to reconnect...');
      connectionAttempts.current += 1;
      
      // If we've failed multiple times, the session is likely invalid
      if (connectionAttempts.current >= maxConnectionAttempts) {
        setSessionValid(false);
        setError('Session expired or invalid. Returning to lobby...');
        setTimeout(() => {
          onBack();
        }, 2000);
      }
    };

    ws.current.onclose = () => {
      console.log('WebSocket closed');
      // If closed unexpectedly (not by user), it might be a session issue
      if (sessionValid && ws.current && ws.current.readyState === WebSocket.CLOSED) {
        connectionAttempts.current += 1;
        if (connectionAttempts.current >= maxConnectionAttempts) {
          setSessionValid(false);
          setError('Lost connection to game server. Returning to lobby...');
          setTimeout(() => {
            onBack();
          }, 2000);
        }
      }
    };

    return () => {
      // Clear the connection timeout if component unmounts
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
      }
      if (diceRollTimeoutRef.current) {
        clearTimeout(diceRollTimeoutRef.current);
      }
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
      }
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [gameId, playerId, playerName]);

  // Debug logging for hand zone
  useEffect(() => {
    if (gameState?.players) {
      const allPlayers = Object.values(gameState.players);
      console.log('Game state players:', allPlayers);
      allPlayers.forEach(player => {
        console.log(`Player ${player.id} hand:`, player.hand);
      });
    }
  }, [gameState]);

  const updatePlayerLife = (playerId, delta) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(
        JSON.stringify({
          UpdateLife: { player_id: playerId, delta }
        })
      );
    }
  };

  const updatePlayerCounter = (playerId, counterType, delta) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(
        JSON.stringify({
          UpdateCounter: {
            player_id: playerId,
            counter_type: counterType,
            delta: delta
          }
        })
      );
    }
  };

  const handleNextTurn = () => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(
        JSON.stringify({
          NextTurn: {}
        })
      );
    }
  };

  const handleUndoTurn = () => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(
        JSON.stringify({
          UndoTurn: {}
        })
      );
    }
  };

  const handleAction = () => {
    console.log('Action clicked');
  };

  const handleGameMenu = () => {
    // Restart game or other game menu actions
    if (window.confirm('Are you sure you want to restart the game?')) {
      // Send restart message to backend
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        ws.current.send(
          JSON.stringify({
            RestartGame: {}
          })
        );
      }
    }
  };

  const handleSpawnCard = (position) => {
    console.log('Right-clicked to spawn card at position:', position);
    // Card spawning is now a placeholder - can be extended later
  };

  const handleZoom = (position) => {
    // Toggle zoom - if already zoomed into this position, zoom out
    setZoomedPosition(zoomedPosition === position ? null : position);
  };

  const handleCloseInspection = () => {
    setInspectedCard(null);
    setInspectViewFlipped(false);
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

  if (!sessionValid) {
    return <div className="game-table-new loading">Returning to lobby...</div>;
  }

  if (!gameState) {
    return <div className="game-table-new loading">Connecting to game...</div>;
  }

  const players = gameState?.players ? Object.values(gameState.players) : [];
  
  // Sort players by join_order to ensure correct positions
  const sortedPlayers = [...players].sort((a, b) => a.join_order - b.join_order);
  
  // Rotate players so current player is always at bottom-left
  // Each player sees themselves at bottom-left, with others going counter-clockwise
  // BL=current, BR=next in join order, TR=next+1, TL=next+2
  const rotatedPlayers = [
    sortedPlayers[playerJoinOrder % 4],
    sortedPlayers[(playerJoinOrder + 3) % 4],
    sortedPlayers[(playerJoinOrder + 2) % 4],
    sortedPlayers[(playerJoinOrder + 1) % 4]
  ];
  
  const currentPlayer = rotatedPlayers[0];
  const activePlayerJoinOrder = gameState?.current_turn_player || 0;
  
  // Map the backend's active player index to the rotated view
  // The backend uses the original player order, we need to find which rotated index it corresponds to
  let activeRotatedIndex = -1;
  if (activePlayerJoinOrder === playerJoinOrder % 4) {
    activeRotatedIndex = 0; // Current player is active
  } else if (activePlayerJoinOrder === (playerJoinOrder + 3) % 4) {
    activeRotatedIndex = 1; // BR player is active
  } else if (activePlayerJoinOrder === (playerJoinOrder + 2) % 4) {
    activeRotatedIndex = 2; // TR player is active
  } else if (activePlayerJoinOrder === (playerJoinOrder + 1) % 4) {
    activeRotatedIndex = 3; // TL player is active
  }

  // Get the zoomed player and their index if zoomed
  let zoomedPlayer = null;
  let zoomedIndex = -1;
  if (zoomedPosition) {
    const positions = ['bottom-left', 'bottom-right', 'top-right', 'top-left'];
    zoomedIndex = positions.indexOf(zoomedPosition);
    zoomedPlayer = rotatedPlayers[zoomedIndex];
  }

  return (
    <div className="game-table-new">
      {error && <div className="error-banner">{error}</div>}

      {/* Game Restart Notification */}
      {gameRestart && (
        <div className="game-restart-notification">
          <div className="notification-content">
            <span className="notification-icon">🔄</span>
            <span className="notification-text">Game restarted by {gameRestart.player_name}</span>
          </div>
        </div>
      )}

      {/* Dice Roll Broadcast */}
      {diceRoll && (
        <div className="dice-roll-broadcast">
          <div className="broadcast-content">
            <span className="broadcast-player">
              {diceRoll.roll_type === 'coin' ? `${diceRoll.player_name} flipped:` : `${diceRoll.player_name} rolled:`}
            </span>
            <span className="broadcast-result">
              {diceRoll.roll_type === 'coin' ? '🪙' : '🎲'} {diceRoll.result}
            </span>
          </div>
        </div>
      )}

      {/* Zoomed Player View */}
      {zoomedPlayer && (
        <div className="zoomed-view-overlay">
          <div className="zoomed-player-container">
            <BattlefieldZone 
              player={zoomedPlayer}
              position={zoomedPosition}
              isActive={activeRotatedIndex === zoomedIndex}
              onUpdateLife={updatePlayerLife}
              onUpdateCounter={updatePlayerCounter}
              onSpawnCard={handleSpawnCard}
              onZoom={handleZoom}
              ws={zoomedIndex === 0 ? ws.current : null}
              playerId={zoomedIndex === 0 ? playerId : null}
              onInspectCard={setInspectedCard}
            />
            <div className="zoom-hint">Double-click to exit zoom</div>
          </div>
        </div>
      )}

      {/* Card Inspection Overlay */}
      {inspectedCard && (
        <div className="card-inspection-overlay" onClick={handleCloseInspection}>
          <div className="card-inspection-container" onClick={(e) => e.stopPropagation()}>
            <div
              className="inspected-card-image"
              style={{
                backgroundImage: `url('${inspectViewFlipped ? '/GameTableData/General/back.jpg' : '/GameTableData/General/blank.jpg'}')`,
                backgroundSize: 'contain',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
              }}
            ></div>
            <div className="card-inspection-info">
              <h3>{inspectedCard.name}</h3>
              <div className="inspection-controls">
                <button 
                  className="flip-in-inspect-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setInspectViewFlipped(!inspectViewFlipped);
                  }}
                  title={inspectViewFlipped ? 'Show front' : 'Show back'}
                >
                  {inspectViewFlipped ? '📋 Front' : '🔄 Back'}
                </button>
              </div>
              <p className="close-hint">Click outside to close</p>
            </div>
          </div>
        </div>
      )}

      <div className="game-container" style={{ display: zoomedPlayer ? 'none' : 'flex' }}>
        {/* Left Sidebar */}
        <div className="sidebar-section">
          <LeftSidebar gameId={gameId} playerId={playerId} ws={ws.current} />
        </div>

        {/* Main Game Area */}
        <div className="main-game-area">
          {/* 4-Player Battlefield Board */}
          <div className="battlefield-board">
            {/* Top Row */}
            <div className="board-row top-row">
              {/* Top-Left Player (rotatedPlayers[3]) */}
              <div className="board-cell top-left">
                <BattlefieldZone 
                  player={rotatedPlayers[3]}
                  position="top-left"
                  isActive={activeRotatedIndex === 3}
                  onUpdateLife={updatePlayerLife}
                  onUpdateCounter={updatePlayerCounter}
                  onSpawnCard={handleSpawnCard}
                  onZoom={handleZoom}
                />
              </div>
              {/* Top-Right Player (rotatedPlayers[2]) */}
              <div className="board-cell top-right">
                <BattlefieldZone 
                  player={rotatedPlayers[2]}
                  position="top-right"
                  isActive={activeRotatedIndex === 2}
                  onUpdateLife={updatePlayerLife}
                  onUpdateCounter={updatePlayerCounter}
                  onSpawnCard={handleSpawnCard}
                  onZoom={handleZoom}
                />
              </div>
            </div>

            {/* Bottom Row */}
            <div className="board-row bottom-row">
              {/* Bottom-Left Player (Current/rotatedPlayers[0]) */}
              <div className="board-cell bottom-left">
                <BattlefieldZone 
                  player={rotatedPlayers[0]}
                  position="bottom-left"
                  isActive={activeRotatedIndex === 0}
                  onUpdateLife={updatePlayerLife}
                  onUpdateCounter={updatePlayerCounter}
                  onSpawnCard={handleSpawnCard}
                  onZoom={handleZoom}
                  ws={ws.current}
                  playerId={playerId}
                  onInspectCard={setInspectedCard}
                />
              </div>
              {/* Bottom-Right Player (rotatedPlayers[1]) */}
              <div className="board-cell bottom-right">
                <BattlefieldZone 
                  player={rotatedPlayers[1]}
                  position="bottom-right"
                  isActive={activeRotatedIndex === 1}
                  onUpdateLife={updatePlayerLife}
                  onUpdateCounter={updatePlayerCounter}
                  onSpawnCard={handleSpawnCard}
                  onZoom={handleZoom}
                />
              </div>
            </div>
          </div>

          {/* Current Player's Hand */}
          <div className="hand-section" style={{ height: `${handScale * 120}px` }}>
            <HandZone 
              cards={currentPlayer?.hand || []}
              onSelectCard={() => {}}
              onHandOptions={() => {}}
              scale={handScale}
              ws={ws.current}
              playerId={playerId}
              position="bottom-left"
              onInspectCard={setInspectedCard}
            />
          </div>

          {/* Hand Resize Handle */}
          <div 
            className="hand-resize-handle"
            onMouseDown={(e) => {
              e.preventDefault();
              const startY = e.clientY;
              const startHeight = handScale * 120;
              
              const handleMouseMove = (moveEvent) => {
                const delta = moveEvent.clientY - startY;
                const newHeight = Math.max(60, Math.min(300, startHeight + delta));
                setHandScale(newHeight / 120);
              };
              
              const handleMouseUp = () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
              };
              
              document.addEventListener('mousemove', handleMouseMove);
              document.addEventListener('mouseup', handleMouseUp);
            }}
          />

          {/* Collapsible Zones at Bottom */}
          <div className="zones-section">
            <CollapsibleZones gameState={gameState} />
          </div>
        </div>
      </div>

      {/* Bottom Toolbar */}
      <BottomToolbar 
        gameState={gameState}
        turnNumber={gameState?.turn_number || 1}
        onNextTurn={handleNextTurn}
        onAction={handleAction}
        onGameMenu={handleGameMenu}
        onUndoTurn={handleUndoTurn}
        onBack={onBack}
        ws={ws.current}
        playerId={playerId}
      />
    </div>
  );
};

export default GameTable;
