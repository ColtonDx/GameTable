import React, { useState, useEffect, useRef } from 'react';
import '../styles/GameTableNew.css';
import LeftSidebar from './LeftSidebar';
import BattlefieldZone from './BattlefieldZone';
import HandZone from './HandZone';
import CommandZone from './CommandZone';
import LibraryZone from './LibraryZone';
import GraveyardZone from './GraveyardZone';
import ExileZone from './ExileZone';
import BottomToolbar from './BottomToolbar';
import RevealCardOverlay from './RevealCardOverlay';
import ScryInterface from './ScryInterface';
import ScryCountSelector from './ScryCountSelector';
import SurveilInterface from './SurveilInterface';
import ZoneViewerModal from './ZoneViewerModal';

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
  const [inspectedCardPlayerName, setInspectedCardPlayerName] = useState(null);
  const [inspectViewFlipped, setInspectViewFlipped] = useState(false);
  const [revealedCard, setRevealedCard] = useState(null);
  const [revealedCardPlayer, setRevealedCardPlayer] = useState(null);
  const [revealedCardZone, setRevealedCardZone] = useState('library');
  const [scryActive, setScryActive] = useState(false);
  const [scryCards, setScryCards] = useState([]);
  const [scryCount, setScryCount] = useState(0);
  const [scryCountSelector, setScryCountSelector] = useState(false);
  const [surveilActive, setSurveilActive] = useState(false);
  const [surveilCards, setSurveilCards] = useState([]);
  const [surveilCount, setSurveilCount] = useState(0);
  const [surveilCountSelector, setSurveilCountSelector] = useState(false);
  const [zoneViewerZone, setZoneViewerZone] = useState(null);
  const [zoneViewerCards, setZoneViewerCards] = useState([]);
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
    const wsUrl = `ws://${window.location.hostname}:3001/ws/${gameId}/${playerId}/${playerName}`;
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
        } else if (message.RevealCard) {
          // Display revealed card to all players
          setRevealedCard({
            id: message.RevealCard.card_id,
            name: message.RevealCard.card_name
          });
          setRevealedCardPlayer(message.RevealCard.player_name || 'Player');
          setRevealedCardZone(message.RevealCard.zone || 'library');
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

  const handleInspectCard = (card, playerName) => {
    setInspectedCard(card);
    setInspectedCardPlayerName(playerName);
  };

  const handleCloseInspection = () => {
    setInspectedCard(null);
    setInspectedCardPlayerName(null);
    setInspectViewFlipped(false);
  };

  const handleReveal = (card, zone = 'library') => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      // Broadcast to all players this card is being revealed
      ws.current.send(JSON.stringify({
        RevealCard: {
          player_id: playerId,
          card_id: card.id || '',
          card_name: card.name || 'Unknown',
          zone: zone
        }
      }));
      // Also show it locally
      setRevealedCard(card);
      setRevealedCardPlayer(playerName);
      setRevealedCardZone(zone);
    }
  };

  const handleScry = (cards) => {
    setScryCards(cards);
    setScryCountSelector(true);
  };

  const handleScryCountConfirm = (count) => {
    setScryCount(count);
    setScryCountSelector(false);
    setScryActive(true);
  };

  const handleScryComplete = (topCards, bottomCards) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({
        ScryComplete: {
          player_id: playerId,
          top_cards: topCards.map(c => c.id || ''),
          bottom_cards: bottomCards.map(c => c.id || '')
        }
      }));
    }
    setScryActive(false);
    setScryCards([]);
    setScryCount(0);
  };

  const handleScryCancel = () => {
    setScryCountSelector(false);
    setScryActive(false);
    setScryCards([]);
    setScryCount(0);
  };

  const handleSurveil = (cards) => {
    setSurveilCards(cards);
    setSurveilCountSelector(true);
  };

  const handleSurveilCountConfirm = (count) => {
    setSurveilCount(count);
    setSurveilCountSelector(false);
    setSurveilActive(true);
  };

  const handleSurveilComplete = (topCards, graveyardCards) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      // Send SurveilComplete message to reorder the library
      ws.current.send(JSON.stringify({
        SurveilComplete: {
          player_id: playerId,
          top_cards: topCards.map(c => c.id || ''),
          graveyard_cards: graveyardCards.map(c => c.id || '')
        }
      }));
      
      // Also send individual MoveCard messages for cards going to graveyard
      graveyardCards.forEach(card => {
        ws.current.send(JSON.stringify({
          MoveCard: {
            player_id: playerId,
            card_id: card.id,
            from_zone: 'library',
            to_zone: 'graveyard'
          }
        }));
      });
    }
    setSurveilActive(false);
    setSurveilCards([]);
    setSurveilCount(0);
  };

  const handleSurveilCancel = () => {
    setSurveilCountSelector(false);
    setSurveilActive(false);
    setSurveilCards([]);
    setSurveilCount(0);
  };

  const handleViewZone = (zoneName, cards) => {
    setZoneViewerZone(zoneName);
    setZoneViewerCards(cards);
  };

  const handleCloseZoneViewer = () => {
    setZoneViewerZone(null);
    setZoneViewerCards([]);
  };

  const getCardImagePath = (card, playerName) => {
    if (card.is_flipped) {
      // Check if player has custom sleeve
      return `/GameTableData/Players/${playerName}/sleeve.jpg`;
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
                backgroundImage: `url('${inspectViewFlipped ? `/GameTableData/Players/${inspectedCardPlayerName}/sleeve.jpg` : '/GameTableData/General/blank.jpg'}')`,
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

      {/* Reveal Card Overlay */}
      {revealedCard && (
        <RevealCardOverlay
          playerName={revealedCardPlayer}
          cardName={revealedCard.name}
          cardId={revealedCard.id}
          zone={revealedCardZone}
          onClose={() => {
            setRevealedCard(null);
            setRevealedCardPlayer(null);
            setRevealedCardZone('library');
          }}
        />
      )}

      {/* Scry Count Selector */}
      {scryCountSelector && (
        <ScryCountSelector
          maxCards={currentPlayer?.library?.length || 0}
          onConfirm={handleScryCountConfirm}
          onCancel={handleScryCancel}
        />
      )}

      {/* Scry Interface */}
      {scryActive && (
        <ScryInterface
          libraryCards={scryCards}
          playerName={currentPlayer?.name}
          scryCount={scryCount}
          onComplete={handleScryComplete}
          onCancel={handleScryCancel}
        />
      )}

      {/* Surveil Count Selector */}
      {surveilCountSelector && (
        <ScryCountSelector
          maxCards={currentPlayer?.library?.length || 0}
          onConfirm={handleSurveilCountConfirm}
          onCancel={handleSurveilCancel}
          mode="Surveil"
        />
      )}

      {/* Surveil Interface */}
      {surveilActive && (
        <SurveilInterface
          libraryCards={surveilCards}
          playerName={currentPlayer?.name}
          surveilCount={surveilCount}
          onComplete={handleSurveilComplete}
          onCancel={handleSurveilCancel}
        />
      )}

      {/* Zone Viewer Modal */}
      {zoneViewerZone && (
        <ZoneViewerModal
          zoneName={zoneViewerZone}
          cards={zoneViewerCards}
          onClose={handleCloseZoneViewer}
          ws={ws.current}
          playerId={playerId}
        />
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
                  playmatImage={`/GameTableData/Players/${rotatedPlayers[3]?.name}/playmat.jpg`}
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
                  playmatImage={`/GameTableData/Players/${rotatedPlayers[2]?.name}/playmat.jpg`}
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
                  onInspectCard={handleInspectCard}
                  playmatImage={`/GameTableData/Players/${rotatedPlayers[0]?.name}/playmat.jpg`}
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
                  playmatImage={`/GameTableData/Players/${rotatedPlayers[1]?.name}/playmat.jpg`}
                />
              </div>
            </div>
          </div>

          {/* Current Player's Hand and Command Zone */}
          <div className="hand-and-command-area">
            <div style={{ height: `${handScale * 219}px` }}>
              <LibraryZone
                cards={currentPlayer?.library || []}
                ws={ws.current}
                playerId={playerId}
                playerName={currentPlayer?.name}
                onInspectCard={handleInspectCard}
                onReveal={handleReveal}
                onScry={handleScry}
                onSurveil={handleSurveil}
              />
            </div>

            <div className="hand-section" style={{ height: `${handScale * 219}px`, flex: 1 }}>
              <HandZone 
                cards={currentPlayer?.hand || []}
                onSelectCard={() => {}}
                onHandOptions={() => {}}
                scale={handScale}
                ws={ws.current}
                playerId={playerId}
                playerName={currentPlayer?.name}
                position="bottom-left"
                onInspectCard={handleInspectCard}
                onReveal={handleReveal}
              />
            </div>

            <div style={{ height: `${handScale * 219}px` }}>
              <CommandZone
                cards={currentPlayer?.command_zone || []}
                ws={ws.current}
                playerId={playerId}
                playerName={currentPlayer?.name}
                onInspectCard={handleInspectCard}
              />
            </div>

            <div style={{ height: `${handScale * 219}px` }}>
              <GraveyardZone
                cards={currentPlayer?.graveyard || []}
                onInspectCard={handleInspectCard}
                playerName={currentPlayer?.name}
                onViewZone={handleViewZone}
                ws={ws.current}
                playerId={playerId}
                onMoveCard={() => {}}
              />
            </div>

            <div style={{ height: `${handScale * 219}px` }}>
              <ExileZone
                cards={currentPlayer?.exile || []}
                onInspectCard={handleInspectCard}
                playerName={currentPlayer?.name}
                onViewZone={handleViewZone}
                ws={ws.current}
                playerId={playerId}
                onMoveCard={() => {}}
              />
            </div>
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
