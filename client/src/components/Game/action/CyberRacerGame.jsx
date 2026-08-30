import React, { useEffect, useRef, useState } from 'react';
import SoundEffects from '../../../utils/SoundEffects';
import { api } from '../../../services/api';
import './CyberRacerGame.css';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 480;
const ROAD_LANES = 4;

const CyberRacerGame = ({ user, onLeave }) => {
  const canvasRef = useRef(null);
  const [gameState, setGameState] = useState('MENU'); // MENU, PLAYING, GAMEOVER
  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState(0);
  const [distance, setDistance] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [nitro, setNitro] = useState(100);
  const [highScore, setHighScore] = useState(0);

  // Game internal loop refs
  const stateRef = useRef({
    playerX: 0, // -1 (left) to 1 (right)
    playerSpeed: 0,
    maxSpeed: 280,
    baseMaxSpeed: 280,
    nitroMaxSpeed: 440,
    accel: 1.8,
    brake: 3.5,
    nitroActive: false,
    nitroAmount: 100,
    score: 0,
    coins: 0,
    distance: 0,
    keys: {},
    traffic: [],
    roadSegments: [],
    collectibleItems: [],
    particles: [],
    lastTime: 0,
    dayNightCycle: 0, // 0 to 1
    gameOver: false
  });

  // Load high score
  useEffect(() => {
    const saved = localStorage.getItem('cyber_racer_highscore');
    if (saved) setHighScore(parseInt(saved, 10));
  }, []);

  const startGame = () => {
    try {
      SoundEffects.init();
      SoundEffects.playMove();
    } catch (e) {}

    stateRef.current = {

      playerX: 0,
      playerSpeed: 60,
      maxSpeed: 280,
      baseMaxSpeed: 280,
      nitroMaxSpeed: 440,
      accel: 2.2,
      brake: 4.0,
      nitroActive: false,
      nitroAmount: 100,
      score: 0,
      coins: 0,
      distance: 0,
      keys: stateRef.current.keys || {},
      traffic: [],
      collectibleItems: [],
      particles: [],
      lastTime: performance.now(),
      dayNightCycle: 0,
      gameOver: false
    };

    // Spawn initial traffic
    for (let i = 0; i < 4; i++) {
      spawnTrafficCar(400 + i * 350);
    }

    setScore(0);
    setCoins(0);
    setDistance(0);
    setNitro(100);
    setGameState('PLAYING');
  };

  const spawnTrafficCar = (zDist) => {
    const laneX = (Math.floor(Math.random() * 4) - 1.5) / 1.5; // -1, -0.33, 0.33, 1
    const carTypes = [
      { color: '#ff3366', speed: 120 + Math.random() * 60, name: 'Sedan' },
      { color: '#00e676', speed: 90 + Math.random() * 40, name: 'Truck' },
      { color: '#ffd600', speed: 150 + Math.random() * 80, name: 'Supercar' },
      { color: '#9d00ff', speed: 110 + Math.random() * 50, name: 'CyberCab' }
    ];
    const type = carTypes[Math.floor(Math.random() * carTypes.length)];
    stateRef.current.traffic.push({
      x: laneX,
      z: zDist,
      speed: type.speed,
      color: type.color,
      width: 0.35,
      length: 0.6
    });
  };

  const spawnCollectible = (zDist) => {
    const laneX = (Math.floor(Math.random() * 4) - 1.5) / 1.5;
    const isNitro = Math.random() < 0.25;
    stateRef.current.collectibleItems.push({
      x: laneX,
      z: zDist,
      type: isNitro ? 'NITRO' : 'COIN',
      size: 0.3
    });
  };

  // Keyboard Event Listeners
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'Shift', 'w', 'a', 's', 'd', 'W', 'A', 'S', 'D'].includes(e.key)) {
        e.preventDefault();
      }
      stateRef.current.keys[e.key.toLowerCase()] = true;
      stateRef.current.keys[e.code] = true;
    };

    const handleKeyUp = (e) => {
      stateRef.current.keys[e.key.toLowerCase()] = false;
      stateRef.current.keys[e.code] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Main Game Loop (Canvas 60FPS)
  useEffect(() => {
    let animId;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const updateAndRender = (currentTime) => {
      const state = stateRef.current;
      const dt = Math.min((currentTime - (state.lastTime || currentTime)) / 1000, 0.05);
      state.lastTime = currentTime;

      if (gameState === 'PLAYING' && !state.gameOver) {
        // --- 1. Handle Input & Speed ---
        const keys = state.keys;
        const accelerating = keys['arrowup'] || keys['w'] || keys['keyw'];
        const braking = keys['arrowdown'] || keys['s'] || keys['keys'];
        const turningLeft = keys['arrowleft'] || keys['a'] || keys['keya'];
        const turningRight = keys['arrowright'] || keys['d'] || keys['keyd'];
        const nitroPressed = (keys['shift'] || keys['shiftleft'] || keys['shiftright'] || keys[' ']) && state.nitroAmount > 5;

        // Nitro Logic
        if (nitroPressed) {
          state.nitroActive = true;
          state.nitroAmount = Math.max(0, state.nitroAmount - 35 * dt);
          state.maxSpeed = state.nitroMaxSpeed;
          state.playerSpeed += state.accel * 2.5;
          // Spawn nitro flame particles
          if (Math.random() < 0.8) {
            state.particles.push({
              x: state.playerX + (Math.random() - 0.5) * 0.1,
              y: CANVAS_HEIGHT - 45,
              vx: (Math.random() - 0.5) * 30,
              vy: 50 + Math.random() * 80,
              color: Math.random() > 0.5 ? '#00f3ff' : '#ff007f',
              size: 4 + Math.random() * 6,
              alpha: 1.0,
              life: 0.3
            });
          }
        } else {
          state.nitroActive = false;
          state.maxSpeed = state.baseMaxSpeed;
          state.nitroAmount = Math.min(100, state.nitroAmount + 6 * dt);
        }

        // Acceleration / Deceleration
        if (accelerating) {
          state.playerSpeed = Math.min(state.maxSpeed, state.playerSpeed + state.accel);
        } else if (braking) {
          state.playerSpeed = Math.max(30, state.playerSpeed - state.brake);
        } else {
          state.playerSpeed = Math.max(60, state.playerSpeed - 0.5);
        }

        // Steering (scales with speed)
        const steerSpeed = 1.6 * (state.playerSpeed / 180);
        if (turningLeft) state.playerX = Math.max(-1.15, state.playerX - steerSpeed * dt);
        if (turningRight) state.playerX = Math.min(1.15, state.playerX + steerSpeed * dt);

        // Distance & Score increment
        state.distance += (state.playerSpeed * dt) / 10;
        state.score += Math.floor((state.playerSpeed / 50) * (state.nitroActive ? 2 : 1));

        // Update state hooks throttled
        setScore(state.score);
        setSpeed(Math.floor(state.playerSpeed));
        setNitro(Math.floor(state.nitroAmount));
        setDistance(Math.floor(state.distance));

        // --- 2. Update Traffic ---
        for (let i = state.traffic.length - 1; i >= 0; i--) {
          const car = state.traffic[i];
          // Traffic moves relative to player
          car.z -= (state.playerSpeed - car.speed) * dt * 4;

          // Collision Check
          if (car.z > 20 && car.z < 75 && Math.abs(car.x - state.playerX) < 0.32) {
            // CRASH!
            state.gameOver = true;
            SoundEffects.playLoss();
            handleGameOver(state.score);
            break;
          }

          // Despawn passed cars & spawn ahead
          if (car.z < -50) {
            state.traffic.splice(i, 1);
            spawnTrafficCar(800 + Math.random() * 400);
          }
        }

        // Spawn new traffic if low
        if (state.traffic.length < 5) {
          spawnTrafficCar(900 + Math.random() * 300);
        }

        // Random Collectibles spawn
        if (Math.random() < 0.03 && state.collectibleItems.length < 4) {
          spawnCollectible(700 + Math.random() * 300);
        }

        // Update Collectibles
        for (let i = state.collectibleItems.length - 1; i >= 0; i--) {
          const item = state.collectibleItems[i];
          item.z -= state.playerSpeed * dt * 4;

          // Pickup check
          if (item.z > 25 && item.z < 75 && Math.abs(item.x - state.playerX) < 0.35) {
            if (item.type === 'NITRO') {
              state.nitroAmount = Math.min(100, state.nitroAmount + 40);
              SoundEffects.playSafe();
            } else {
              state.coins += 1;
              state.score += 250;
              setCoins(state.coins);
              SoundEffects.playWin();
            }
            state.collectibleItems.splice(i, 1);
            continue;
          }

          if (item.z < -40) {
            state.collectibleItems.splice(i, 1);
          }
        }

        // Update particles
        for (let i = state.particles.length - 1; i >= 0; i--) {
          const p = state.particles[i];
          p.y += p.vy * dt;
          p.x += (p.vx * dt) / 100;
          p.alpha -= dt / p.life;
          if (p.alpha <= 0) state.particles.splice(i, 1);
        }
      }

      // --- 3. RENDER 2.5D RETRO SYNTHWAVE WORLD ---
      renderScene(ctx, state);

      animId = requestAnimationFrame(updateAndRender);
    };

    animId = requestAnimationFrame(updateAndRender);
    return () => cancelAnimationFrame(animId);
  }, [gameState]);

  const handleGameOver = async (finalScore) => {
    setGameState('GAMEOVER');
    if (finalScore > highScore) {
      setHighScore(finalScore);
      localStorage.setItem('cyber_racer_highscore', finalScore.toString());
    }

    if (user?.id) {
      try {
        await api.post('/games/score', {
          gameKey: 'CYBER_RACER',
          score: finalScore
        });
      } catch (err) {
        console.error('Failed to submit score', err);
      }
    }
  };

  const renderScene = (ctx, state) => {
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Sky gradient with Retro Sun
    const skyGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT * 0.45);
    skyGrad.addColorStop(0, '#0a021a');
    skyGrad.addColorStop(0.6, '#2a0845');
    skyGrad.addColorStop(1, '#ff007f');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT * 0.45);

    // Neon Synthwave Sun
    const sunY = CANVAS_HEIGHT * 0.35;
    const sunRadius = 60;
    const sunGrad = ctx.createLinearGradient(0, sunY - sunRadius, 0, sunY + sunRadius);
    sunGrad.addColorStop(0, '#ffd600');
    sunGrad.addColorStop(1, '#ff007f');
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(CANVAS_WIDTH / 2, sunY, sunRadius, 0, Math.PI * 2);
    ctx.fill();

    // Sun horizontal scanline slices
    ctx.fillStyle = '#0a021a';
    for (let i = 0; i < 7; i++) {
      const sliceY = sunY + 5 + i * 8;
      ctx.fillRect(CANVAS_WIDTH / 2 - sunRadius - 5, sliceY, (sunRadius + 5) * 2, 2 + i * 0.6);
    }

    // Horizon line
    const horizonY = CANVAS_HEIGHT * 0.45;

    // Perspective Highway (Ground)
    const groundGrad = ctx.createLinearGradient(0, horizonY, 0, CANVAS_HEIGHT);
    groundGrad.addColorStop(0, '#100624');
    groundGrad.addColorStop(1, '#05010a');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, horizonY, CANVAS_WIDTH, CANVAS_HEIGHT - horizonY);

    // Draw Road
    const roadTopWidth = 140;
    const roadBottomWidth = 680;
    const roadTopX = (CANVAS_WIDTH - roadTopWidth) / 2;
    const roadBottomX = (CANVAS_WIDTH - roadBottomWidth) / 2;

    // Road surface
    ctx.beginPath();
    ctx.moveTo(roadTopX, horizonY);
    ctx.lineTo(roadTopX + roadTopWidth, horizonY);
    ctx.lineTo(roadBottomX + roadBottomWidth, CANVAS_HEIGHT);
    ctx.lineTo(roadBottomX, CANVAS_HEIGHT);
    ctx.closePath();
    ctx.fillStyle = '#151025';
    ctx.fill();

    // Glowing Neon Road Curbs
    ctx.strokeStyle = '#00f3ff';
    ctx.lineWidth = 4;
    ctx.shadowColor = '#00f3ff';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.moveTo(roadTopX, horizonY);
    ctx.lineTo(roadBottomX, CANVAS_HEIGHT);
    ctx.stroke();

    ctx.strokeStyle = '#ff007f';
    ctx.shadowColor = '#ff007f';
    ctx.beginPath();
    ctx.moveTo(roadTopX + roadTopWidth, horizonY);
    ctx.lineTo(roadBottomX + roadBottomWidth, CANVAS_HEIGHT);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Moving lane dividers
    const offset = (state.distance * 10) % 60;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 2;
    ctx.setLineDash([15, 25]);
    ctx.lineDashOffset = -offset;

    for (let lane = 1; lane < ROAD_LANES; lane++) {
      const topLaneX = roadTopX + (roadTopWidth / ROAD_LANES) * lane;
      const bottomLaneX = roadBottomX + (roadBottomWidth / ROAD_LANES) * lane;
      ctx.beginPath();
      ctx.moveTo(topLaneX, horizonY);
      ctx.lineTo(bottomLaneX, CANVAS_HEIGHT);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // Sort objects by distance (z) to render furthest to closest
    const allObjects = [
      ...state.traffic.map(t => ({ ...t, kind: 'CAR' })),
      ...state.collectibleItems.map(c => ({ ...c, kind: 'COLLECTIBLE' }))
    ].sort((a, b) => b.z - a.z);

    // Draw 3D projected objects
    allObjects.forEach(obj => {
      const scale = 1 / (1 + obj.z * 0.005);
      const objY = horizonY + (CANVAS_HEIGHT - horizonY) * Math.min(1, Math.max(0, 1 - obj.z / 800));
      const currentRoadWidth = roadTopWidth + (roadBottomWidth - roadTopWidth) * ((objY - horizonY) / (CANVAS_HEIGHT - horizonY));
      const objX = CANVAS_WIDTH / 2 + (obj.x * currentRoadWidth) / 2;

      if (obj.kind === 'CAR') {
        const carW = 60 * scale;
        const carH = 36 * scale;

        // Shadow & Glow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(objX - carW / 2, objY + carH * 0.2, carW, carH * 0.4);

        // Car Body
        ctx.fillStyle = obj.color;
        ctx.shadowColor = obj.color;
        ctx.shadowBlur = 10 * scale;
        ctx.fillRect(objX - carW / 2, objY - carH / 2, carW, carH);
        ctx.shadowBlur = 0;

        // Tail lights
        ctx.fillStyle = '#ff0033';
        ctx.shadowColor = '#ff0033';
        ctx.shadowBlur = 8;
        ctx.fillRect(objX - carW * 0.4, objY + carH * 0.2, carW * 0.25, carH * 0.2);
        ctx.fillRect(objX + carW * 0.15, objY + carH * 0.2, carW * 0.25, carH * 0.2);
        ctx.shadowBlur = 0;

        // Rear window
        ctx.fillStyle = '#111';
        ctx.fillRect(objX - carW * 0.35, objY - carH * 0.3, carW * 0.7, carH * 0.4);
      } else if (obj.kind === 'COLLECTIBLE') {
        const itemRadius = 14 * scale;
        ctx.beginPath();
        ctx.arc(objX, objY, itemRadius, 0, Math.PI * 2);
        if (obj.type === 'NITRO') {
          ctx.fillStyle = '#00f3ff';
          ctx.shadowColor = '#00f3ff';
          ctx.shadowBlur = 15;
          ctx.fill();
          ctx.fillStyle = '#fff';
          ctx.font = `bold ${10 * scale}px sans-serif`;
          ctx.fillText('N', objX - 4 * scale, objY + 4 * scale);
        } else {
          ctx.fillStyle = '#ffd600';
          ctx.shadowColor = '#ffd600';
          ctx.shadowBlur = 15;
          ctx.fill();
          ctx.fillStyle = '#111';
          ctx.font = `bold ${10 * scale}px sans-serif`;
          ctx.fillText('$', objX - 3 * scale, objY + 4 * scale);
        }
        ctx.shadowBlur = 0;
      }
    });

    // --- Draw Particles ---
    state.particles.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.beginPath();
      ctx.arc(CANVAS_WIDTH / 2 + (p.x * roadBottomWidth) / 2, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1.0;
    });

    // --- Draw Player Car ---
    const playerScreenY = CANVAS_HEIGHT - 65;
    const playerScreenX = CANVAS_WIDTH / 2 + (state.playerX * roadBottomWidth) / 2;
    const pWidth = 74;
    const pHeight = 44;

    // Neon underglow
    ctx.shadowColor = state.nitroActive ? '#00f3ff' : '#ff007f';
    ctx.shadowBlur = state.nitroActive ? 30 : 18;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(playerScreenX - pWidth / 2 - 4, playerScreenY - pHeight / 2 - 2, pWidth + 8, pHeight + 4);

    // Player Car Chassis
    const carGrad = ctx.createLinearGradient(playerScreenX, playerScreenY - pHeight / 2, playerScreenX, playerScreenY + pHeight / 2);
    carGrad.addColorStop(0, '#00f3ff');
    carGrad.addColorStop(1, '#0055ff');
    ctx.fillStyle = carGrad;
    ctx.fillRect(playerScreenX - pWidth / 2, playerScreenY - pHeight / 2, pWidth, pHeight);

    // Rear Lights (Cyan / Hot Pink)
    ctx.fillStyle = state.nitroActive ? '#00f3ff' : '#ff0055';
    ctx.shadowColor = state.nitroActive ? '#00f3ff' : '#ff0055';
    ctx.shadowBlur = 12;
    ctx.fillRect(playerScreenX - pWidth * 0.42, playerScreenY + pHeight * 0.25, pWidth * 0.3, pHeight * 0.2);
    ctx.fillRect(playerScreenX + pWidth * 0.12, playerScreenY + pHeight * 0.25, pWidth * 0.3, pHeight * 0.2);
    ctx.shadowBlur = 0;

    // Windshield & Roof
    ctx.fillStyle = '#080c18';
    ctx.fillRect(playerScreenX - pWidth * 0.36, playerScreenY - pHeight * 0.35, pWidth * 0.72, pHeight * 0.45);
    ctx.fillStyle = '#00f3ff';
    ctx.fillRect(playerScreenX - pWidth * 0.28, playerScreenY - pHeight * 0.3, pWidth * 0.56, 3);
  };

  return (
    <div className="cyber-racer-container">
      <div className="racer-wrapper">
        {/* Top Header */}
        <div className="racer-top-bar">
          <button className="btn-tertiary" onClick={onLeave}>
            ← EXIT TO HUB
          </button>
          <div className="racer-stats">
            <div className="stat-item">
              <span className="stat-label">SPEED</span>
              <span className="stat-value">{speed} <small style={{ fontSize: '0.7rem' }}>KM/H</small></span>
            </div>
            <div className="stat-item">
              <span className="stat-label">SCORE</span>
              <span className="stat-value">{score}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">NITRO</span>
              <span className="stat-value" style={{ color: nitro > 20 ? '#00f3ff' : '#ff007f' }}>
                {nitro}%
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">COINS</span>
              <span className="stat-value" style={{ color: '#ffd600' }}>🪙 {coins}</span>
            </div>
          </div>
        </div>

        {/* Canvas Game Area */}
        <div className="canvas-container">
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="racer-canvas"
          />

          {/* Menu / Game Over Overlay */}
          {gameState === 'MENU' && (
            <div className="racer-overlay" onClick={(e) => e.stopPropagation()}>
              <h1 className="overlay-title">CYBER HIGHWAY RACER</h1>
              <p className="overlay-subtitle">
                Dodge neon synthwave traffic at breakneck speeds. Collect energy coins and trigger Nitro Boost to shatter records!
              </p>
              <div className="racer-controls-guide">
                <span>🎮 <strong>A / D</strong> or <strong>← / →</strong> : Steer</span>
                <span>⚡ <strong>W / ↑</strong> : Gas</span>
                <span>🔥 <strong>SHIFT / SPACE</strong> : Nitro</span>
              </div>
              <button
                className="racer-btn-play"
                onClick={(e) => {
                  e.stopPropagation();
                  startGame();
                }}
              >
                START RACE 🏁
              </button>
            </div>
          )}

          {gameState === 'GAMEOVER' && (
            <div className="racer-overlay" onClick={(e) => e.stopPropagation()}>
              <h1 className="overlay-title" style={{ color: '#ff007f' }}>CRASHED! 💥</h1>
              <p className="overlay-subtitle">
                Final Score: <strong style={{ color: '#00f3ff' }}>{score}</strong> | Distance: {distance}m
              </p>
              {score >= highScore && score > 0 && (
                <div style={{ color: '#ffd600', fontWeight: 'bold', fontSize: '1.1rem' }}>
                  🏆 NEW HIGH SCORE!
                </div>
              )}
              <button
                className="racer-btn-play"
                onClick={(e) => {
                  e.stopPropagation();
                  startGame();
                }}
              >
                RACE AGAIN 🔄
              </button>
            </div>
          )}

        </div>

        {/* Mobile / Touch Screen Controls */}
        <div className="touch-controls-bar">
          <button
            className="touch-btn"
            onTouchStart={() => (stateRef.current.keys['arrowleft'] = true)}
            onTouchEnd={() => (stateRef.current.keys['arrowleft'] = false)}
            onMouseDown={() => (stateRef.current.keys['arrowleft'] = true)}
            onMouseUp={() => (stateRef.current.keys['arrowleft'] = false)}
          >
            ◀ LEFT
          </button>
          <button
            className="touch-btn nitro-touch-btn"
            onTouchStart={() => (stateRef.current.keys['shift'] = true)}
            onTouchEnd={() => (stateRef.current.keys['shift'] = false)}
            onMouseDown={() => (stateRef.current.keys['shift'] = true)}
            onMouseUp={() => (stateRef.current.keys['shift'] = false)}
          >
            🔥 NITRO
          </button>
          <button
            className="touch-btn"
            onTouchStart={() => (stateRef.current.keys['arrowright'] = true)}
            onTouchEnd={() => (stateRef.current.keys['arrowright'] = false)}
            onMouseDown={() => (stateRef.current.keys['arrowright'] = true)}
            onMouseUp={() => (stateRef.current.keys['arrowright'] = false)}
          >
            RIGHT ▶
          </button>
        </div>
      </div>
    </div>
  );
};

export default CyberRacerGame;
