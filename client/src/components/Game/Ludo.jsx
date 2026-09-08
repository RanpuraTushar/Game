import React, { useEffect, useState } from 'react';
import './Ludo.css';
import { soundFX } from '../../utils/SoundEffects';
import { api } from '../../services/api';

const COLOR_MAP = {
  RED: { hex: '#ff3b30', name: 'Red', homeRow: 7, homeColStart: 1, baseRow: 0, baseCol: 0 },
  GREEN: { hex: '#00e676', name: 'Green', homeCol: 7, homeRowStart: 1, baseRow: 0, baseCol: 9 },
  YELLOW: { hex: '#ffea00', name: 'Yellow', homeRow: 7, homeColStart: 9, baseRow: 9, baseCol: 9 },
  BLUE: { hex: '#2979ff', name: 'Blue', homeCol: 7, homeRowStart: 9, baseRow: 9, baseCol: 0 }
};

// 52 Common Track Coordinates on a 15x15 Grid: [row, col] (0 to 14)
const COMMON_TRACK_COORDS = [
  [6, 1], [6, 2], [6, 3], [6, 4], [6, 5],
  [5, 6], [4, 6], [3, 6], [2, 6], [1, 6], [0, 6],
  [0, 7],
  [0, 8], [1, 8], [2, 8], [3, 8], [4, 8], [5, 8],
  [6, 9], [6, 10], [6, 11], [6, 12], [6, 13], [6, 14],
  [7, 14],
  [8, 14], [8, 13], [8, 12], [8, 11], [8, 10], [8, 9],
  [9, 8], [10, 8], [11, 8], [12, 8], [13, 8], [14, 8],
  [14, 7],
  [14, 6], [13, 6], [12, 6], [11, 6], [10, 6], [9, 6],
  [8, 5], [8, 4], [8, 3], [8, 2], [8, 1], [8, 0],
  [7, 0], [6, 0]
];

// Home Path Coordinates for each color (5 steps leading to center)
const HOME_PATH_COORDS = {
  RED: [[7, 1], [7, 2], [7, 3], [7, 4], [7, 5]],
  GREEN: [[1, 7], [2, 7], [3, 7], [4, 7], [5, 7]],
  YELLOW: [[7, 13], [7, 12], [7, 11], [7, 10], [7, 9]],
  BLUE: [[13, 7], [12, 7], [11, 7], [10, 7], [9, 7]]
};

// Center Goal Coordinates per color
const CENTER_GOAL_COORDS = {
  RED: [7, 6],
  GREEN: [6, 7],
  YELLOW: [7, 8],
  BLUE: [8, 7]
};

// Base Token Slot Offsets within each quadrant
const BASE_SLOT_OFFSETS = [
  [1.5, 1.5], [1.5, 3.5], [3.5, 1.5], [3.5, 3.5]
];

// Center finish offset so all 4 finished tokens are distinctly visible
const FINISH_SLOT_OFFSETS = [
  [-0.22, -0.22], [-0.22, 0.22], [0.22, -0.22], [0.22, 0.22]
];

const SAFE_STAR_INDICES = [0, 8, 13, 21, 26, 34, 39, 47];

const Ludo = ({ socket, room, user, onLeave }) => {
  const [gameState, setGameState] = useState(room);
  const [isRolling, setIsRolling] = useState(false);
  const [displayDiceValue, setDisplayDiceValue] = useState(room?.lastRoll?.value || 1);
  const [isLanded, setIsLanded] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let rollCycleInterval = null;
    let rollCompleteTimeout = null;
    let popTimeout = null;

    const handleRoomUpdated = (updatedRoom) => {
      setGameState(updatedRoom);

      if (updatedRoom.lastRoll) {
        soundFX.playDiceRoll();
        setIsRolling(true);
        setIsLanded(false);

        // Cycle through random faces during the 1100ms roll
        if (rollCycleInterval) clearInterval(rollCycleInterval);
        rollCycleInterval = setInterval(() => {
          setDisplayDiceValue(Math.floor(Math.random() * 6) + 1);
        }, 90);

        if (rollCompleteTimeout) clearTimeout(rollCompleteTimeout);
        rollCompleteTimeout = setTimeout(() => {
          clearInterval(rollCycleInterval);
          setDisplayDiceValue(updatedRoom.lastRoll.value);
          setIsRolling(false);
          setIsLanded(true);

          if (popTimeout) clearTimeout(popTimeout);
          popTimeout = setTimeout(() => setIsLanded(false), 800);
        }, 1100);
      }

      if (updatedRoom.lastMove) {
        if (updatedRoom.lastMove.captured) {
          soundFX.playCapture();
        } else if (updatedRoom.lastMove.reachedHome) {
          soundFX.playLadderClimb();
        } else {
          soundFX.playTokenStep();
        }
      }

      if (updatedRoom.status === 'FINISHED' && updatedRoom.winner === socket?.id) {
        soundFX.playWinFanfare();
        if (user?.id) {
          api.submitScore('LUDO', 500, true, user).catch(() => {});
        }
      }
    };

    if (socket) socket.on('roomUpdated', handleRoomUpdated);
    return () => {
      if (socket) socket.off('roomUpdated', handleRoomUpdated);
      if (rollCycleInterval) clearInterval(rollCycleInterval);
      if (rollCompleteTimeout) clearTimeout(rollCompleteTimeout);
      if (popTimeout) clearTimeout(popTimeout);
    };
  }, [socket, user]);

  const handleRollDice = () => {
    if (gameState.status !== 'PLAYING' || isRolling || gameState.waitingForTokenChoice) return;
    if (gameState.currentTurn !== socket?.id) return;

    socket?.emit('rollDiceLudo', { roomId: gameState.id });
  };

  const handleSelectToken = (tokenId) => {
    if (gameState.status !== 'PLAYING') return;
    if (gameState.currentTurn !== socket?.id) return;
    if (!gameState.movableTokens || !gameState.movableTokens.includes(tokenId)) return;

    socket?.emit('moveLudoToken', { roomId: gameState.id, tokenId });
  };

  const handleReset = () => {
    socket?.emit('resetGame', { roomId: gameState.id });
  };

  const handleLeave = () => {
    socket?.emit('leaveRoom');
    onLeave();
  };

  const isMyTurn = gameState?.currentTurn === socket?.id;
  const me = gameState?.players?.find(p => p.socketId === socket?.id);

  if (!gameState || !gameState.players) {
    return (
      <div className="glass-panel" style={{ maxWidth: '500px', margin: '40px auto', padding: '40px', textAlign: 'center' }}>
        <h2 className="neon-text" style={{ fontSize: '1.8rem', marginBottom: '15px' }}>CONNECTING TO LUDO...</h2>
        <p style={{ color: '#aaa', marginBottom: '20px' }}>Loading arena assets & synchronizing state...</p>
        <button className="btn-secondary" onClick={onLeave}>&larr; BACK TO HUB</button>
      </div>
    );
  }

  // Convert player token step to [row, col] on 15x15 board
  const getTokenCoords = (player, token) => {
    const color = player.color || 'RED';

    if (token.step === -1) {
      // In Base
      const baseInfo = COLOR_MAP[color];
      const offset = BASE_SLOT_OFFSETS[token.id % 4];
      return [baseInfo.baseRow + offset[0], baseInfo.baseCol + offset[1]];
    }

    if (token.step >= 0 && token.step <= 50) {
      // On common track
      const startOffsets = { RED: 0, GREEN: 13, YELLOW: 26, BLUE: 39 };
      const commonIdx = (startOffsets[color] + token.step) % 52;
      return COMMON_TRACK_COORDS[commonIdx];
    }

    if (token.step >= 51 && token.step <= 55) {
      // On Home Column Path (5 steps)
      const homePath = HOME_PATH_COORDS[color];
      return homePath[token.step - 51];
    }

    // Finished in center (step 56 or token.finished)
    const baseCenter = CENTER_GOAL_COORDS[color];
    const finishOffset = FINISH_SLOT_OFFSETS[token.id % 4];
    return [baseCenter[0] + finishOffset[0], baseCenter[1] + finishOffset[1]];
  };

  const renderDiceDots = (val) => {
    const dotPositions = {
      1: [4],
      2: [0, 8],
      3: [0, 4, 8],
      4: [0, 2, 6, 8],
      5: [0, 2, 4, 6, 8],
      6: [0, 2, 3, 5, 6, 8]
    };
    const active = dotPositions[val] || [4];
    const isOne = val === 1;

    return (
      <div className="dice-face-3d">
        {Array(9).fill(null).map((_, i) => (
          <div
            key={i}
            className={`dice-pip ${isOne && i === 4 ? 'pip-center-one' : ''}`}
            style={{ opacity: active.includes(i) ? 1 : 0 }}
          />
        ))}
      </div>
    );
  };

  // Render authentic 3D Royal Pawn Piece with Crown Insignia & Cylindrical Shading
  const render3DPawn = (colorKey, isMovable) => {
    const colorData = {
      RED: { gradStart: '#ff8a80', gradMid: '#d50000', gradDark: '#7f0000' },
      GREEN: { gradStart: '#b9f6ca', gradMid: '#00c853', gradDark: '#004d40' },
      YELLOW: { gradStart: '#ffff8d', gradMid: '#ffd600', gradDark: '#ff6d00' },
      BLUE: { gradStart: '#80d8ff', gradMid: '#0091ea', gradDark: '#01579b' }
    };
    const c = colorData[colorKey] || colorData.RED;

    return (
      <svg viewBox="0 0 32 38" className="ludo-pawn-svg" width="100%" height="100%">
        <defs>
          {/* Sphere Head 3D Radial Gradient */}
          <radialGradient id={`pawnHead-${colorKey}`} cx="32%" cy="28%" r="68%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="28%" stopColor={c.gradStart} />
            <stop offset="70%" stopColor={c.gradMid} />
            <stop offset="100%" stopColor={c.gradDark} />
          </radialGradient>

          {/* Base Pedestal Linear Gradient */}
          <linearGradient id={`pawnBase-${colorKey}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={c.gradDark} />
            <stop offset="35%" stopColor={c.gradStart} />
            <stop offset="65%" stopColor={c.gradMid} />
            <stop offset="100%" stopColor={c.gradDark} />
          </linearGradient>

          {/* Gold Metallic Trim Gradient */}
          <linearGradient id={`pawnGold-${colorKey}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ffb300" />
            <stop offset="50%" stopColor="#fff9c4" />
            <stop offset="100%" stopColor="#ff8f00" />
          </linearGradient>
        </defs>

        {/* 1. Ground Drop Shadow */}
        <ellipse cx="16" cy="35" rx="10.5" ry="2.8" fill="rgba(0,0,0,0.45)" filter="blur(0.8px)" />

        {/* 2. Flared 3D Pedestal Base */}
        <path
          d="M 6,32 C 6,30 10,29 16,29 C 22,29 26,30 26,32 C 26,34 22,35 16,35 C 10,35 6,34 6,32 Z"
          fill={`url(#pawnBase-${colorKey})`}
          stroke="rgba(0,0,0,0.4)"
          strokeWidth="0.4"
        />
        {/* Tapered Waist */}
        <path
          d="M 8.5,31 C 9.5,23 11.5,17 13.5,14 L 18.5,14 C 20.5,17 22.5,23 23.5,31 C 20,32.5 12,32.5 8.5,31 Z"
          fill={`url(#pawnBase-${colorKey})`}
          stroke="rgba(0,0,0,0.3)"
          strokeWidth="0.4"
        />

        {/* 3. Gold Metallic Neck Collar Ring */}
        <ellipse cx="16" cy="14" rx="4.8" ry="1.4" fill={`url(#pawnGold-${colorKey})`} stroke="#b26a00" strokeWidth="0.25" />

        {/* 4. Glossy 3D Sphere Head */}
        <circle cx="16" cy="9.5" r="7.2" fill={`url(#pawnHead-${colorKey})`} stroke="rgba(0,0,0,0.25)" strokeWidth="0.4" />

        {/* 5. Specular Top Catchlight Reflection */}
        <ellipse cx="13.8" cy="6.8" rx="2.4" ry="1.4" transform="rotate(-30 13.8 6.8)" fill="#ffffff" opacity="0.85" />

        {/* 6. Royal Crown Insignia Engraved on Head */}
        <path
          d="M 12.8,11.5 L 13.4,9 L 14.8,10.2 L 16,8 L 17.2,10.2 L 18.6,9 L 19.2,11.5 Z"
          fill={`url(#pawnGold-${colorKey})`}
          stroke="#7f4300"
          strokeWidth="0.25"
        />
        <circle cx="13.4" cy="8.8" r="0.35" fill="#ffffff" />
        <circle cx="16" cy="7.8" r="0.45" fill="#ffffff" />
        <circle cx="18.6" cy="8.8" r="0.35" fill="#ffffff" />
      </svg>
    );
  };

  // Collect all tokens with computed coordinates
  const allTokens = [];
  (gameState.players || []).forEach(player => {
    (player.tokens || []).forEach(token => {
      const coords = getTokenCoords(player, token);
      const isMovable = isMyTurn &&
        gameState.waitingForTokenChoice &&
        player.socketId === socket.id &&
        gameState.movableTokens?.includes(token.id);

      allTokens.push({
        player,
        token,
        coords,
        isMovable
      });
    });
  });

  return (
    <div className="ludo-container">
      <div className="ludo-panel">
        {/* Header */}
        <div className="ludo-header">
          <h2 className="ludo-title">LUDO KINGDOM</h2>
          <div className="room-badge">ROOM: {gameState.id}</div>
        </div>

        {/* Players Grid */}
        <div className="ludo-players-grid">
          {(gameState.players || []).map(p => {
            const pInfo = COLOR_MAP[p.color] || COLOR_MAP.RED;
            const isTurn = gameState.currentTurn === p.socketId && gameState.status === 'PLAYING';
            const finishedTokens = (p.tokens || []).filter(t => t.finished).length;

            return (
              <div
                key={p.socketId}
                className={`ludo-player-card ${isTurn ? 'active-turn' : ''}`}
                style={{
                  borderTop: `4px solid ${pInfo.hex}`,
                  color: pInfo.hex
                }}
              >
                <div className="lp-name">
                  {p.username} {p.socketId === socket.id ? '(You)' : ''}
                </div>
                <div className="lp-tokens">
                  {p.hasWon ? '👑 Won!' : `Home: ${finishedTokens}/4`}
                </div>
              </div>
            );
          })}
        </div>

        {/* 15x15 Ludo Board */}
        <div className="ludo-board-wrapper">
          <div className="ludo-board-grid">
            {Array(15).fill(null).map((_, row) =>
              Array(15).fill(null).map((_, col) => {
                const isRedBase = row < 6 && col < 6;
                const isGreenBase = row < 6 && col >= 9;
                const isBlueBase = row >= 9 && col < 6;
                const isYellowBase = row >= 9 && col >= 9;

                const isCenter = row >= 6 && row <= 8 && col >= 6 && col <= 8;

                const isRedHomePath = row === 7 && col >= 1 && col <= 5;
                const isGreenHomePath = col === 7 && row >= 1 && row <= 5;
                const isYellowHomePath = row === 7 && col >= 9 && col <= 13;
                const isBlueHomePath = col === 7 && row >= 9 && row <= 13;

                const commonTrackIndex = COMMON_TRACK_COORDS.findIndex(
                  c => c[0] === row && c[1] === col
                );
                const isSafeCell = commonTrackIndex !== -1 && SAFE_STAR_INDICES.includes(commonTrackIndex);

                const isRedStart = row === 6 && col === 1;
                const isGreenStart = row === 1 && col === 8;
                const isYellowStart = row === 8 && col === 13;
                const isBlueStart = row === 13 && col === 6;

                let cellBg = '#ffffff';
                if (isRedBase) cellBg = '#ff3b30';
                else if (isGreenBase) cellBg = '#00e676';
                else if (isYellowBase) cellBg = '#ffea00';
                else if (isBlueBase) cellBg = '#2979ff';
                else if (isRedHomePath || isRedStart) cellBg = 'rgba(255, 59, 48, 0.4)';
                else if (isGreenHomePath || isGreenStart) cellBg = 'rgba(0, 230, 118, 0.4)';
                else if (isYellowHomePath || isYellowStart) cellBg = 'rgba(255, 234, 0, 0.4)';
                else if (isBlueHomePath || isBlueStart) cellBg = 'rgba(41, 121, 255, 0.4)';

                if (isRedBase && row === 0 && col === 0) {
                  return (
                    <div
                      key={`${row}-${col}`}
                      className="ludo-base"
                      style={{ gridArea: '1 / 1 / 7 / 7', background: '#ff3b30' }}
                    >
                      <div className="ludo-base-inner">
                        {Array(4).fill(null).map((_, idx) => (
                          <div key={idx} className="base-token-slot" />
                        ))}
                      </div>
                    </div>
                  );
                }
                if (isGreenBase && row === 0 && col === 9) {
                  return (
                    <div
                      key={`${row}-${col}`}
                      className="ludo-base"
                      style={{ gridArea: '1 / 10 / 7 / 16', background: '#00e676' }}
                    >
                      <div className="ludo-base-inner">
                        {Array(4).fill(null).map((_, idx) => (
                          <div key={idx} className="base-token-slot" />
                        ))}
                      </div>
                    </div>
                  );
                }
                if (isBlueBase && row === 9 && col === 0) {
                  return (
                    <div
                      key={`${row}-${col}`}
                      className="ludo-base"
                      style={{ gridArea: '10 / 1 / 16 / 7', background: '#2979ff' }}
                    >
                      <div className="ludo-base-inner">
                        {Array(4).fill(null).map((_, idx) => (
                          <div key={idx} className="base-token-slot" />
                        ))}
                      </div>
                    </div>
                  );
                }
                if (isYellowBase && row === 9 && col === 9) {
                  return (
                    <div
                      key={`${row}-${col}`}
                      className="ludo-base"
                      style={{ gridArea: '10 / 10 / 16 / 16', background: '#ffea00' }}
                    >
                      <div className="ludo-base-inner">
                        {Array(4).fill(null).map((_, idx) => (
                          <div key={idx} className="base-token-slot" />
                        ))}
                      </div>
                    </div>
                  );
                }

                if (isRedBase || isGreenBase || isBlueBase || isYellowBase) {
                  return null;
                }

                if (isCenter) {
                  if (row === 6 && col === 6) {
                    return (
                      <div
                        key="center-finish"
                        className="ludo-center-triangle"
                        style={{ gridArea: '7 / 7 / 10 / 10' }}
                      >
                        <div className="center-triangle-red" />
                        <div className="center-triangle-green" />
                        <div className="center-triangle-yellow" />
                        <div className="center-triangle-blue" />
                      </div>
                    );
                  }
                  return null;
                }

                return (
                  <div
                    key={`${row}-${col}`}
                    className="ludo-cell"
                    style={{ backgroundColor: cellBg }}
                  >
                    {isSafeCell && <span className="safe-star">★</span>}
                  </div>
                );
              })
            )}
          </div>

          {/* Tokens Overlay */}
          {allTokens.map(({ player, token, coords, isMovable }) => {
            const color = player.color || 'RED';
            const topPct = (coords[0] / 15) * 100 + (100 / 30);
            const leftPct = (coords[1] / 15) * 100 + (100 / 30);

            return (
              <div
                key={`${player.socketId}-${token.id}`}
                className={`ludo-token-piece ${isMovable ? 'movable' : ''}`}
                onClick={() => isMovable && handleSelectToken(token.id)}
                style={{
                  position: 'absolute',
                  top: `${topPct}%`,
                  left: `${leftPct}%`,
                  transform: 'translate(-50%, -50%)'
                }}
                title={`${player.username} (${color} Pawn ${token.id + 1})`}
              >
                {render3DPawn(color, isMovable)}
              </div>
            );
          })}

          {/* Waiting for Opponent Overlay */}
          {gameState.status === 'WAITING' && (
            <div className="finish-overlay">
              <h2 className="neon-text" style={{ color: '#ff00ff', marginBottom: '12px' }}>
                WAITING FOR PLAYERS ({gameState.players?.length || 1}/{gameState.maxPlayers || 2})
              </h2>
              <p style={{ color: '#aaa', marginBottom: '12px' }}>Share Room Code:</p>
              <div
                className="room-badge"
                onClick={() => {
                  navigator.clipboard.writeText(gameState.id);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                style={{
                  fontSize: '1.6rem',
                  padding: '10px 24px',
                  cursor: 'pointer',
                  border: '2px dashed var(--neon-pink)',
                  background: 'rgba(0,0,0,0.7)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '10px'
                }}
                title="Click to copy room code"
              >
                <span>{gameState.id}</span>
                <span style={{ fontSize: '1rem', color: copied ? '#00ff66' : '#aaa' }}>
                  {copied ? '✓ Copied!' : '📋'}
                </span>
              </div>
            </div>
          )}

          {/* Finished Victory Overlay */}
          {gameState.status === 'FINISHED' && (
            <div className="finish-overlay">
              <h1 className="neon-text win-text" style={{ fontSize: '2.5rem', marginBottom: '15px' }}>
                {gameState.winner === socket.id ? '🏆 VICTORY!' : 'GAME OVER'}
              </h1>
              <p style={{ fontSize: '1.2rem', color: '#00f3ff', marginBottom: '20px' }}>
                Winner: {gameState.players?.find(p => p.socketId === gameState.winner)?.username || 'Winner'}
              </p>
              <div style={{ display: 'flex', gap: '15px' }}>
                {gameState.hostId === me?.userId && (
                  <button className="btn-primary" onClick={handleReset} style={{ padding: '10px 25px', fontSize: '1.1rem' }}>
                    PLAY AGAIN
                  </button>
                )}
                <button className="btn-secondary" onClick={handleLeave} style={{ padding: '10px 25px', fontSize: '1.1rem' }}>
                  EXIT
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Choice Prompt */}
        {isMyTurn && gameState.waitingForTokenChoice && (
          <div style={{ textAlign: 'center', marginTop: '10px' }}>
            <span className="ludo-choice-prompt">
              👉 CLICK A HIGHLIGHTED TOKEN TO MOVE
            </span>
          </div>
        )}

        {/* Bottom Control Bar with 3D Rolling Dice & Rolled Value Banner */}
        <div className="controls-area">
          {gameState.status === 'PLAYING' && (
            <div className="dice-container-3d">
              {isMyTurn && !gameState.waitingForTokenChoice && !isRolling && (
                <>
                  <div className="dice-turn-glow" />
                  <div className="roll-prompt-badge">ROLL!</div>
                </>
              )}
              <button
                className={`dice-button-premium ${isRolling ? 'dice-rolling-3d' : ''} ${isLanded ? 'dice-landed-pop' : ''} ${isMyTurn && !gameState.waitingForTokenChoice && !isRolling ? 'my-turn-idle' : ''}`}
                onClick={handleRollDice}
                disabled={!isMyTurn || isRolling || gameState.waitingForTokenChoice}
                title={isMyTurn ? 'Roll the Dice' : "Opponent's Turn"}
              >
                {renderDiceDots(displayDiceValue)}
              </button>
            </div>
          )}

          {/* Clear Rolled Number Display & Current Turn */}
          <div className="turn-info-card">
            {gameState.lastRoll && (
              <div className={`roll-result-banner ${gameState.lastRoll.value === 6 ? 'six-banner' : ''}`}>
                <span className="roll-banner-icon">🎲</span>
                <span className="roll-banner-text">
                  {isRolling ? (
                    <span className="rolling-text">Rolling...</span>
                  ) : (
                    <>
                      <strong>{gameState.lastRoll.username || 'Player'}</strong> rolled <span className="roll-highlight-num">{gameState.lastRoll.value}</span>
                      {gameState.lastRoll.value === 6 && <span className="bonus-tag">🔥 +1 ROLL</span>}
                    </>
                  )}
                </span>
              </div>
            )}

            <div style={{ textAlign: 'left', marginTop: '4px' }}>
              <div style={{ fontSize: '0.8rem', color: '#aaa', letterSpacing: '1px' }}>CURRENT TURN</div>
              <div style={{
                fontSize: '1.15rem',
                fontWeight: 'bold',
                color: isMyTurn ? '#00ff66' : '#ff00ff'
              }}>
                {isMyTurn ? '👉 YOUR TURN' : `${gameState.players?.find(p => p.socketId === gameState.currentTurn)?.username || 'Opponent'}'s Turn`}
              </div>
            </div>
          </div>

          <button className="btn-secondary" onClick={handleLeave} style={{ padding: '10px 20px', fontSize: '1rem' }}>
            LEAVE
          </button>
        </div>
      </div>
    </div>
  );
};

export default Ludo;
