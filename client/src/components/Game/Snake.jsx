import React, { useEffect, useState, useRef } from 'react';
import './Snake.css';
import { soundFX } from '../../utils/SoundEffects';

const PLAYER_COLORS = ['#ff3b30', '#00e676', '#ffea00', '#2979ff'];
const CELL_PALETTE = ['#f8d7da', '#d1ecf1', '#d4edda', '#fff3cd', '#ffffff'];

const Snake = ({ socket, room, user, onLeave }) => {
  const [gameState, setGameState] = useState(room);
  const [displayPositions, setDisplayPositions] = useState({});
  const [isRolling, setIsRolling] = useState(false);
  const [displayDiceValue, setDisplayDiceValue] = useState(room?.lastRoll?.value || 1);
  const [isLanded, setIsLanded] = useState(false);
  const [isAnimatingMove, setIsAnimatingMove] = useState(false);
  const [copied, setCopied] = useState(false);
  const animationRef = useRef(null);
  const rollCycleRef = useRef(null);
  const rollTimerRef = useRef(null);

  // Initialize display positions
  useEffect(() => {
    const initPos = {};
    (room?.players || []).forEach(p => {
      initPos[p.socketId] = p.position || 1;
    });
    setDisplayPositions(initPos);
  }, []);

  useEffect(() => {
    const handleRoomUpdated = (updatedRoom) => {
      setGameState(updatedRoom);

      if (updatedRoom.lastRoll) {
        const { socketId, initialPos, targetPos, finalPos, eventType, value } = updatedRoom.lastRoll;

        soundFX.playDiceRoll();
        setIsRolling(true);
        setIsLanded(false);

        // Cycle through random dice numbers during the 1100ms roll
        if (rollCycleRef.current) clearInterval(rollCycleRef.current);
        rollCycleRef.current = setInterval(() => {
          setDisplayDiceValue(Math.floor(Math.random() * 6) + 1);
        }, 90);

        if (rollTimerRef.current) clearTimeout(rollTimerRef.current);
        rollTimerRef.current = setTimeout(() => {
          clearInterval(rollCycleRef.current);
          setDisplayDiceValue(value);
          setIsRolling(false);
          setIsLanded(true);

          setTimeout(() => setIsLanded(false), 800);

          // Give player 450ms to clearly see and understand the rolled number before moving
          if (initialPos !== undefined && targetPos !== undefined) {
            setTimeout(() => {
              animatePawnSteps(socketId, initialPos, targetPos, finalPos, eventType);
            }, 450);
          } else {
            const newPositions = {};
            updatedRoom.players.forEach(p => {
              newPositions[p.socketId] = p.position || 1;
            });
            setDisplayPositions(newPositions);
          }
        }, 1100);

      } else {
        const newPositions = {};
        updatedRoom.players.forEach(p => {
          newPositions[p.socketId] = p.position || 1;
        });
        setDisplayPositions(newPositions);
      }

      if (updatedRoom.status === 'FINISHED' && updatedRoom.winner === socket.id) {
        soundFX.playWinFanfare();
      }
    };

    socket.on('roomUpdated', handleRoomUpdated);
    return () => {
      socket.off('roomUpdated', handleRoomUpdated);
      if (animationRef.current) clearTimeout(animationRef.current);
      if (rollCycleRef.current) clearInterval(rollCycleRef.current);
      if (rollTimerRef.current) clearTimeout(rollTimerRef.current);
    };
  }, [socket]);

  const animatePawnSteps = (socketId, startPos, targetPos, finalPos, eventType) => {
    setIsAnimatingMove(true);
    let current = startPos;
    const stepInterval = 260; // Clear, readable hopping speed

    const hopNext = () => {
      if (current < targetPos) {
        current += 1;
        soundFX.playTokenStep();
        setDisplayPositions(prev => ({ ...prev, [socketId]: current }));
        animationRef.current = setTimeout(hopNext, stepInterval);
      } else {
        if (eventType === 'LADDER') {
          setTimeout(() => {
            soundFX.playLadderClimb();
            setDisplayPositions(prev => ({ ...prev, [socketId]: finalPos }));
            setIsAnimatingMove(false);
          }, 400);
        } else if (eventType === 'SNAKE') {
          setTimeout(() => {
            soundFX.playSnakeBite();
            setDisplayPositions(prev => ({ ...prev, [socketId]: finalPos }));
            setIsAnimatingMove(false);
          }, 400);
        } else {
          setIsAnimatingMove(false);
        }
      }
    };

    animationRef.current = setTimeout(hopNext, 100);
  };

  const handleRollDice = () => {
    if (gameState.status !== 'PLAYING' || isRolling || isAnimatingMove) return;
    if (gameState.currentTurn !== socket.id) return;

    socket.emit('rollDice', { roomId: gameState.id });
  };

  const handleReset = () => {
    socket.emit('resetGame', { roomId: gameState.id });
  };

  const handleLeave = () => {
    socket.emit('leaveRoom');
    onLeave();
  };

  const isMyTurn = gameState.currentTurn === socket.id;
  const me = gameState.players?.find(p => p.socketId === socket.id);

  // Convert cell number to percentage coords (0-100)
  const getCellCoords = (cellNum) => {
    const row = Math.floor((cellNum - 1) / 10);
    const col = (cellNum - 1) % 10;
    const gridRow = 9 - row; // 1 is at bottom
    const gridCol = row % 2 !== 0 ? 9 - col : col; // Zig-zag snaking

    return {
      x: gridCol * 10 + 5,
      y: gridRow * 10 + 5
    };
  };

  // Generate realistic organic S-curve serpentine winding path and head orientation
  const getSnakePathData = (s, e) => {
    const dx = e.x - s.x;
    const dy = e.y - s.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist === 0) return { path: `M ${s.x} ${s.y}`, headAngle: 0, dist: 0 };

    const ux = dx / dist;
    const uy = dy / dist;
    const nx = -uy;
    const ny = ux;

    // S-curve frequency and amplitude based on length
    const waveCount = dist > 48 ? 3 : dist > 24 ? 2 : 1;
    const amp = Math.min(dist * 0.15, 5.2);

    let path = `M ${s.x} ${s.y}`;
    let firstDirX = dx;
    let firstDirY = dy;

    if (waveCount === 1) {
      const cp1x = s.x + dx * 0.5 + nx * amp;
      const cp1y = s.y + dy * 0.5 + ny * amp;
      path = `M ${s.x} ${s.y} Q ${cp1x} ${cp1y} ${e.x} ${e.y}`;
      firstDirX = cp1x - s.x;
      firstDirY = cp1y - s.y;
    } else if (waveCount === 2) {
      const p1x = s.x + dx * 0.5;
      const p1y = s.y + dy * 0.5;
      const cp1x = s.x + dx * 0.25 + nx * amp;
      const cp1y = s.y + dy * 0.25 + ny * amp;
      const cp2x = s.x + dx * 0.75 - nx * amp;
      const cp2y = s.y + dy * 0.75 - ny * amp;
      path = `M ${s.x} ${s.y} Q ${cp1x} ${cp1y} ${p1x} ${p1y} Q ${cp2x} ${cp2y} ${e.x} ${e.y}`;
      firstDirX = cp1x - s.x;
      firstDirY = cp1y - s.y;
    } else {
      const p1x = s.x + dx * (1 / 3);
      const p1y = s.y + dy * (1 / 3);
      const p2x = s.x + dx * (2 / 3);
      const p2y = s.y + dy * (2 / 3);

      const cp1x = s.x + dx * (1 / 6) + nx * amp;
      const cp1y = s.y + dy * (1 / 6) + ny * amp;
      const cp2x = s.x + dx * 0.5 - nx * amp;
      const cp2y = s.y + dy * 0.5 - ny * amp;
      const cp3x = s.x + dx * (5 / 6) + nx * amp;
      const cp3y = s.y + dy * (5 / 6) + ny * amp;

      path = `M ${s.x} ${s.y} Q ${cp1x} ${cp1y} ${p1x} ${p1y} Q ${cp2x} ${cp2y} ${p2x} ${p2y} Q ${cp3x} ${cp3y} ${e.x} ${e.y}`;
      firstDirX = cp1x - s.x;
      firstDirY = cp1y - s.y;
    }

    const headAngle = Math.atan2(firstDirY, firstDirX) * (180 / Math.PI) + 90;
    return { path, headAngle, dist };
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

  const renderGrid = () => {
    const cells = [];
    for (let row = 0; row < 10; row++) {
      for (let col = 0; col < 10; col++) {
        const invertedRow = 9 - row;
        const cellNum = invertedRow % 2 === 0
          ? invertedRow * 10 + col + 1
          : invertedRow * 10 + (9 - col) + 1;

        const bgColor = CELL_PALETTE[cellNum % CELL_PALETTE.length];
        const presentPlayers = (gameState.players || []).filter(
          p => (displayPositions[p.socketId] || 1) === cellNum
        );

        cells.push(
          <div
            key={cellNum}
            className="grid-cell"
            style={{ backgroundColor: bgColor }}
          >
            <span className="cell-num">{cellNum}</span>

            {presentPlayers.length > 0 && (
              <div className="tokens-container">
                {presentPlayers.map((p) => {
                  const pColor = PLAYER_COLORS[p.colorIndex % PLAYER_COLORS.length];
                  return (
                    <div
                      key={p.socketId}
                      className={`token-pawn ${isAnimatingMove && gameState.lastRoll?.socketId === p.socketId ? 'hopping' : ''}`}
                      style={{
                        backgroundColor: pColor,
                        borderColor: '#fff',
                        boxShadow: `0 0 8px ${pColor}`
                      }}
                      title={p.username}
                    />
                  );
                })}
              </div>
            )}
          </div>
        );
      }
    }
    return cells;
  };

  if (!gameState || !gameState.players) {
    return (
      <div className="glass-panel" style={{ maxWidth: '500px', margin: '40px auto', padding: '40px', textAlign: 'center' }}>
        <h2 className="neon-text" style={{ fontSize: '1.8rem', marginBottom: '15px' }}>CONNECTING TO SNAKE ARENA...</h2>
        <p style={{ color: '#aaa', marginBottom: '20px' }}>Loading board coordinates & synchronizing state...</p>
        <button className="btn-secondary" onClick={onLeave}>&larr; BACK TO HUB</button>
      </div>
    );
  }

  return (
    <div className="snake-container">
      <div className="snake-panel">
        {/* Header */}
        <div className="snake-header">
          <h2 className="snake-title">SNAKES & LADDERS</h2>
          <div className="room-badge">ROOM: {gameState.id}</div>
        </div>

        {/* Players Status Bar */}
        <div className="players-bar">
          {(gameState.players || []).map((p) => {
            const pColor = PLAYER_COLORS[p.colorIndex % PLAYER_COLORS.length];
            const isTurn = gameState.currentTurn === p.socketId && gameState.status === 'PLAYING';
            const pos = displayPositions[p.socketId] || 1;

            return (
              <div
                key={p.socketId}
                className={`player-card ${isTurn ? 'active-turn' : ''}`}
                style={{ borderTop: `4px solid ${pColor}` }}
              >
                <div className="p-name" style={{ color: pColor }}>
                  {p.username} {p.socketId === socket.id ? '(You)' : ''}
                </div>
                <div className="p-pos">Tile {pos}</div>
              </div>
            );
          })}
        </div>

        {/* Board Area */}
        <div className="board-wrapper">
          <div className="board-grid">
            {renderGrid()}
          </div>

          {/* Realistic 3D Scaled SVG Overlay with Viper Snakes and Metallic Ladders */}
          <svg
            viewBox="0 0 100 100"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
              zIndex: 5
            }}
          >
            <defs>
              {/* Soft Ambient 3D Shadow */}
              <filter id="boardDropShadow" x="-25%" y="-25%" width="150%" height="150%">
                <feDropShadow dx="0.8" dy="1.4" stdDeviation="0.9" floodColor="#000000" floodOpacity="0.7" />
              </filter>

              {/* Realistic Snake Body Scale Gradient */}
              <linearGradient id="snakeSkinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1b5e20" />
                <stop offset="30%" stopColor="#2e7d32" />
                <stop offset="60%" stopColor="#00c853" />
                <stop offset="90%" stopColor="#1b5e20" />
                <stop offset="100%" stopColor="#0a2e0e" />
              </linearGradient>

              {/* Viper Head 3D Contour Gradient */}
              <radialGradient id="snakeHeadGrad" cx="45%" cy="40%" r="60%">
                <stop offset="0%" stopColor="#388e3c" />
                <stop offset="55%" stopColor="#1b5e20" />
                <stop offset="90%" stopColor="#0d3810" />
                <stop offset="100%" stopColor="#051a07" />
              </radialGradient>

              {/* Dorsal Spine Diamond Pattern Gradient */}
              <linearGradient id="snakeBackPattern" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#ffeb3b" stopOpacity="0.9" />
                <stop offset="50%" stopColor="#ff9800" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#e65100" stopOpacity="0.6" />
              </linearGradient>

              {/* Metallic Brass Ladder Rail Gradient */}
              <linearGradient id="ladderRailGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#8d5b12" />
                <stop offset="25%" stopColor="#e5a93b" />
                <stop offset="50%" stopColor="#fff2c2" />
                <stop offset="75%" stopColor="#e5a93b" />
                <stop offset="100%" stopColor="#603808" />
              </linearGradient>

              {/* Metallic Ladder Rung Gradient */}
              <linearGradient id="ladderRungGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#fff8e1" />
                <stop offset="45%" stopColor="#ffb300" />
                <stop offset="80%" stopColor="#c67d00" />
                <stop offset="100%" stopColor="#5d3200" />
              </linearGradient>
            </defs>

            {/* Ladders */}
            {Object.entries(gameState.snakesAndLadders?.ladders || {}).map(([start, end]) => {
              const s = getCellCoords(parseInt(start));
              const e = getCellCoords(end);

              const dx = e.x - s.x;
              const dy = e.y - s.y;
              const length = Math.sqrt(dx * dx + dy * dy);
              const angle = Math.atan2(dy, dx);
              const rungCount = Math.max(3, Math.floor(length / 5.5));

              const pX = Math.cos(angle + Math.PI / 2) * 2.5;
              const pY = Math.sin(angle + Math.PI / 2) * 2.5;

              const rungs = [];
              for (let i = 1; i < rungCount; i++) {
                const fraction = i / rungCount;
                const rX = s.x + dx * fraction;
                const rY = s.y + dy * fraction;
                rungs.push(
                  <g key={i}>
                    {/* Rung Shadow */}
                    <line
                      x1={rX - pX + 0.4} y1={rY - pY + 0.7}
                      x2={rX + pX + 0.4} y2={rY + pY + 0.7}
                      stroke="rgba(0,0,0,0.5)"
                      strokeWidth="1.2"
                      strokeLinecap="round"
                    />
                    {/* 3D Rung */}
                    <line
                      x1={rX - pX} y1={rY - pY}
                      x2={rX + pX} y2={rY + pY}
                      stroke="url(#ladderRungGrad)"
                      strokeWidth="1.2"
                      strokeLinecap="round"
                    />
                    {/* Metallic Brackets/Bolts at connection */}
                    <circle cx={rX - pX} cy={rY - pY} r="0.65" fill="#ffe082" stroke="#4e2c00" strokeWidth="0.2" />
                    <circle cx={rX + pX} cy={rY + pY} r="0.65" fill="#ffe082" stroke="#4e2c00" strokeWidth="0.2" />
                  </g>
                );
              }

              return (
                <g key={`ladder-${start}`} filter="url(#boardDropShadow)">
                  {/* Left Rail */}
                  <line x1={s.x - pX} y1={s.y - pY} x2={e.x - pX} y2={e.y - pY} stroke="url(#ladderRailGrad)" strokeWidth="1.5" strokeLinecap="round" />
                  {/* Right Rail */}
                  <line x1={s.x + pX} y1={s.y + pY} x2={e.x + pX} y2={e.y + pY} stroke="url(#ladderRailGrad)" strokeWidth="1.5" strokeLinecap="round" />
                  {rungs}
                </g>
              );
            })}

            {/* Realistic 3D Snakes */}
            {Object.entries(gameState.snakesAndLadders?.snakes || {}).map(([start, end]) => {
              const s = getCellCoords(parseInt(start)); // Head
              const e = getCellCoords(end); // Tail
              const { path, headAngle } = getSnakePathData(s, e);

              return (
                <g key={`snake-${start}`}>
                  {/* 1. Realistic Drop Shadow */}
                  <path
                    d={path}
                    fill="none"
                    stroke="rgba(0, 0, 0, 0.65)"
                    strokeWidth="4.6"
                    strokeLinecap="round"
                    filter="url(#boardDropShadow)"
                  />

                  {/* 2. Snake Outer Body / Dark Scale Border */}
                  <path
                    d={path}
                    fill="none"
                    stroke="#09210c"
                    strokeWidth="3.6"
                    strokeLinecap="round"
                  />

                  {/* 3. Snake 3D Scaled Muscular Body */}
                  <path
                    d={path}
                    fill="none"
                    stroke="url(#snakeSkinGrad)"
                    strokeWidth="2.8"
                    strokeLinecap="round"
                  />

                  {/* 4. Realistic Diamond-Back Dorsal Scales Pattern */}
                  <path
                    d={path}
                    fill="none"
                    stroke="url(#snakeBackPattern)"
                    strokeWidth="1.1"
                    strokeLinecap="round"
                    strokeDasharray="1.8 2.2"
                  />

                  {/* 5. 3D Specular Spine Glint / Highlight */}
                  <path
                    d={path}
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.45)"
                    strokeWidth="0.6"
                    strokeLinecap="round"
                    strokeDasharray="4 6"
                  />

                  {/* 6. Tail Tip / Rattle Bands */}
                  <circle cx={e.x} cy={e.y} r="1.1" fill="#2e7d32" stroke="#09210c" strokeWidth="0.3" />
                  <circle cx={e.x} cy={e.y} r="0.6" fill="#ffb300" />

                  {/* 7. Realistic Anatomical Viper Head & Face */}
                  <g transform={`translate(${s.x}, ${s.y}) rotate(${headAngle})`}>
                    {/* Flicking Forked Red Tongue */}
                    <path
                      d="M 0,-3.0 L 0,-5.2 L -0.9,-6.8 M 0,-5.2 L 0.9,-6.8"
                      fill="none"
                      stroke="#e53935"
                      strokeWidth="0.5"
                      strokeLinecap="round"
                    />

                    {/* Viper Diamond Head Skull with Flared Venom Sacs */}
                    <path
                      d="M 0,-3.4 C 1.5,-3.4 2.4,-1.8 2.5,0.2 C 2.7,2.0 1.5,2.8 0,3.0 C -1.5,2.8 -2.7,2.0 -2.5,0.2 C -2.4,-1.8 -1.5,-3.4 0,-3.4 Z"
                      fill="url(#snakeHeadGrad)"
                      stroke="#061a08"
                      strokeWidth="0.4"
                    />

                    {/* Cranial Brow Ridge & Scale Crest */}
                    <path
                      d="M -1.2,-2.0 C 0,-1.2 1.2,-2.0 0,-0.4 Z"
                      fill="#08210b"
                      opacity="0.75"
                    />

                    {/* Left Eye: Amber Predatory Iris with Vertical Slit Pupil */}
                    <ellipse
                      cx="-1.3"
                      cy="-0.7"
                      rx="0.75"
                      ry="0.5"
                      transform="rotate(-20 -1.3 -0.7)"
                      fill="#ffb300"
                      stroke="#000"
                      strokeWidth="0.15"
                    />
                    <line
                      x1="-1.3"
                      y1="-1.1"
                      x2="-1.3"
                      y2="-0.3"
                      stroke="#000000"
                      strokeWidth="0.32"
                      strokeLinecap="round"
                    />
                    <circle cx="-1.5" cy="-0.9" r="0.14" fill="#ffffff" />

                    {/* Right Eye: Amber Predatory Iris with Vertical Slit Pupil */}
                    <ellipse
                      cx="1.3"
                      cy="-0.7"
                      rx="0.75"
                      ry="0.5"
                      transform="rotate(20 1.3 -0.7)"
                      fill="#ffb300"
                      stroke="#000"
                      strokeWidth="0.15"
                    />
                    <line
                      x1="1.3"
                      y1="-1.1"
                      x2="1.3"
                      y2="-0.3"
                      stroke="#000000"
                      strokeWidth="0.32"
                      strokeLinecap="round"
                    />
                    <circle cx="1.1" cy="-0.9" r="0.14" fill="#ffffff" />

                    {/* Snout Nostril Pits */}
                    <circle cx="-0.5" cy="-2.6" r="0.18" fill="#041206" />
                    <circle cx="0.5" cy="-2.6" r="0.18" fill="#041206" />
                  </g>
                </g>
              );
            })}
          </svg>

          {/* Waiting for Opponent Overlay */}
          {gameState.status === 'WAITING' && (
            <div className="finish-overlay">
              <h2 className="neon-text" style={{ color: 'var(--neon-pink)', marginBottom: '15px' }}>
                WAITING FOR PLAYERS ({gameState.players?.length || 1}/{gameState.maxPlayers || 2})
              </h2>
              <p style={{ color: '#aaa', marginBottom: '15px' }}>Share room code with friends</p>
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
                  border: '2px dashed #00ff66',
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

          {/* Game Finished Victory Overlay */}
          {gameState.status === 'FINISHED' && (
            <div className="finish-overlay">
              <h1 className="neon-text win-text" style={{ fontSize: '2.5rem', marginBottom: '15px' }}>
                {gameState.winner === socket.id ? '🏆 YOU WON!' : 'GAME OVER'}
              </h1>
              <p style={{ fontSize: '1.2rem', color: '#00f3ff', marginBottom: '25px' }}>
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

        {/* Bottom Control Bar with 3D Rolling Dice & Rolled Value Banner */}
        <div className="controls-area">
          {gameState.status === 'PLAYING' && (
            <div className="dice-container-3d">
              {isMyTurn && !isRolling && !isAnimatingMove && (
                <>
                  <div className="dice-turn-glow" />
                  <div className="roll-prompt-badge">ROLL!</div>
                </>
              )}
              <button
                className={`dice-button-premium ${isRolling ? 'dice-rolling-3d' : ''} ${isLanded ? 'dice-landed-pop' : ''} ${isMyTurn && !isRolling && !isAnimatingMove ? 'my-turn-idle' : ''}`}
                onClick={handleRollDice}
                disabled={!isMyTurn || isRolling || isAnimatingMove}
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

export default Snake;
