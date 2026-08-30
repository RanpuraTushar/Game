import React, { useEffect, useRef, useState } from 'react';
import SoundEffects from '../../../utils/SoundEffects';
import { api } from '../../../services/api';
import './FruitSlicerGame.css';

const CANVAS_WIDTH = 760;
const CANVAS_HEIGHT = 480;
const GRAVITY = 0.28;

const FRUITS = [
  { name: 'WATERMELON', color: '#00e676', innerColor: '#ff1744', radius: 32, points: 10, icon: '🍉' },
  { name: 'ORANGE', color: '#ff9100', innerColor: '#ffea00', radius: 26, points: 15, icon: '🍊' },
  { name: 'APPLE', color: '#d50000', innerColor: '#f5f5f5', radius: 24, points: 15, icon: '🍎' },
  { name: 'BANANA', color: '#ffd600', innerColor: '#fff9c4', radius: 25, points: 20, icon: '🍌' },
  { name: 'STRAWBERRY', color: '#ff1744', innerColor: '#ff8a80', radius: 22, points: 25, icon: '🍓' }
];

const FruitSlicerGame = ({ user, onLeave }) => {
  const canvasRef = useRef(null);
  const [gameState, setGameState] = useState('MENU'); // MENU, PLAYING, GAMEOVER
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [highScore, setHighScore] = useState(0);
  const [comboText, setComboText] = useState(null);

  const stateRef = useRef({
    fruits: [],
    halves: [],
    particles: [],
    splashes: [],
    bladePoints: [],
    isSwiping: false,
    score: 0,
    lives: 3,
    spawnTimer: 0,
    currentCombo: 0,
    comboTimer: 0,
    gameOver: false,
    lastTime: 0
  });

  useEffect(() => {
    const saved = localStorage.getItem('fruit_slicer_highscore');
    if (saved) setHighScore(parseInt(saved, 10));
  }, []);

  const startGame = () => {
    SoundEffects.init();
    SoundEffects.playMove();

    stateRef.current = {
      fruits: [],
      halves: [],
      particles: [],
      splashes: [],
      bladePoints: [],
      isSwiping: false,
      score: 0,
      lives: 3,
      spawnTimer: 0,
      currentCombo: 0,
      comboTimer: 0,
      gameOver: false,
      lastTime: performance.now()
    };

    setScore(0);
    setLives(3);
    setGameState('PLAYING');
  };

  const spawnWave = () => {
    const count = 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count; i++) {
      const isBomb = Math.random() < 0.18;
      const x = 120 + Math.random() * (CANVAS_WIDTH - 240);
      const vx = (CANVAS_WIDTH / 2 - x) * 0.015 + (Math.random() - 0.5) * 4;
      const vy = -(11 + Math.random() * 4.5);

      if (isBomb) {
        stateRef.current.fruits.push({
          isBomb: true,
          x,
          y: CANVAS_HEIGHT + 30,
          vx,
          vy,
          rotation: 0,
          vRot: (Math.random() - 0.5) * 0.1,
          radius: 26
        });
      } else {
        const fruitType = FRUITS[Math.floor(Math.random() * FRUITS.length)];
        stateRef.current.fruits.push({
          isBomb: false,
          ...fruitType,
          x,
          y: CANVAS_HEIGHT + 30,
          vx,
          vy,
          rotation: 0,
          vRot: (Math.random() - 0.5) * 0.12
        });
      }
    }
  };

  // Mouse & Touch Swipe Tracking
  const addBladePoint = (x, y) => {
    const state = stateRef.current;
    state.bladePoints.push({ x, y, time: performance.now() });
    if (state.bladePoints.length > 12) state.bladePoints.shift();

    // Check intersection with active fruits
    checkSliceCollisions(x, y);
  };

  const handlePointerDown = (e) => {
    stateRef.current.isSwiping = true;
    const pos = getCanvasPos(e);
    stateRef.current.bladePoints = [{ x: pos.x, y: pos.y, time: performance.now() }];
  };

  const handlePointerMove = (e) => {
    if (!stateRef.current.isSwiping) return;
    const pos = getCanvasPos(e);
    addBladePoint(pos.x, pos.y);
  };

  const handlePointerUp = () => {
    stateRef.current.isSwiping = false;
  };

  const getCanvasPos = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: ((clientX - rect.left) / rect.width) * CANVAS_WIDTH,
      y: ((clientY - rect.top) / rect.height) * CANVAS_HEIGHT
    };
  };

  const checkSliceCollisions = (bx, by) => {
    const state = stateRef.current;
    if (state.bladePoints.length < 2) return;

    const prev = state.bladePoints[state.bladePoints.length - 2];
    const curr = { x: bx, y: by };

    for (let i = state.fruits.length - 1; i >= 0; i--) {
      const f = state.fruits[i];
      const dist = distToSegment(f, prev, curr);

      if (dist < f.radius) {
        // Sliced!
        if (f.isBomb) {
          // DETONATION!
          SoundEffects.playLoss();
          state.gameOver = true;
          handleGameOver(state.score);
          break;
        } else {
          // Slice Fruit
          SoundEffects.playCapture();
          sliceFruit(f);
          state.fruits.splice(i, 1);

          state.score += f.points;
          state.currentCombo += 1;
          state.comboTimer = 0.4; // 400ms combo window

          if (state.currentCombo >= 3) {
            setComboText(`${state.currentCombo}x COMBO! +${state.currentCombo * 10}`);
            state.score += state.currentCombo * 10;
            setTimeout(() => setComboText(null), 800);
          }

          setScore(state.score);
        }
      }
    }
  };

  const distToSegment = (p, v, w) => {
    const l2 = (v.x - w.x) ** 2 + (v.y - w.y) ** 2;
    if (l2 === 0) return Math.hypot(p.x - v.x, p.y - v.y);
    let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(p.x - (v.x + t * (w.x - v.x)), p.y - (v.y + t * (w.y - v.y)));
  };

  const sliceFruit = (f) => {
    const s = stateRef.current;
    // Spawn 2 halves
    s.halves.push({
      x: f.x - 8,
      y: f.y,
      vx: f.vx - 3,
      vy: f.vy - 1,
      rotation: f.rotation,
      vRot: -0.15,
      radius: f.radius,
      color: f.color,
      innerColor: f.innerColor,
      side: 'LEFT'
    });
    s.halves.push({
      x: f.x + 8,
      y: f.y,
      vx: f.vx + 3,
      vy: f.vy - 1,
      rotation: f.rotation,
      vRot: 0.15,
      radius: f.radius,
      color: f.color,
      innerColor: f.innerColor,
      side: 'RIGHT'
    });

    // Juice Splash Particles
    for (let i = 0; i < 18; i++) {
      s.particles.push({
        x: f.x,
        y: f.y,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10,
        color: f.innerColor,
        size: 3 + Math.random() * 4,
        alpha: 1.0
      });
    }

    // Permanent Juice Splash on Background
    if (s.splashes.length < 15) {
      s.splashes.push({
        x: f.x,
        y: f.y,
        radius: 20 + Math.random() * 15,
        color: f.innerColor,
        alpha: 0.35
      });
    }
  };

  // Main Loop
  useEffect(() => {
    let animId;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const loop = (time) => {
      const state = stateRef.current;
      const dt = Math.min((time - (state.lastTime || time)) / 1000, 0.05);
      state.lastTime = time;

      if (gameState === 'PLAYING' && !state.gameOver) {
        // Spawn timer
        state.spawnTimer += dt;
        if (state.spawnTimer > 2.2) {
          state.spawnTimer = 0;
          spawnWave();
        }

        // Combo timer
        if (state.currentCombo > 0) {
          state.comboTimer -= dt;
          if (state.comboTimer <= 0) state.currentCombo = 0;
        }

        // Update Fruits
        for (let i = state.fruits.length - 1; i >= 0; i--) {
          const f = state.fruits[i];
          f.x += f.vx;
          f.y += f.vy;
          f.vy += GRAVITY;
          f.rotation += f.vRot;

          // Dropped off screen check
          if (f.y > CANVAS_HEIGHT + 40 && f.vy > 0) {
            if (!f.isBomb) {
              state.lives -= 1;
              setLives(state.lives);
              SoundEffects.playClick();
              if (state.lives <= 0) {
                state.gameOver = true;
                SoundEffects.playLoss();
                handleGameOver(state.score);
                break;
              }
            }
            state.fruits.splice(i, 1);
          }
        }

        // Update Halves
        for (let i = state.halves.length - 1; i >= 0; i--) {
          const h = state.halves[i];
          h.x += h.vx;
          h.y += h.vy;
          h.vy += GRAVITY;
          h.rotation += h.vRot;
          if (h.y > CANVAS_HEIGHT + 50) state.halves.splice(i, 1);
        }

        // Update Particles
        for (let i = state.particles.length - 1; i >= 0; i--) {
          const p = state.particles[i];
          p.x += p.vx;
          p.y += p.vy;
          p.alpha -= 0.025;
          if (p.alpha <= 0) state.particles.splice(i, 1);
        }

        // Fade old blade points
        const now = performance.now();
        state.bladePoints = state.bladePoints.filter(pt => now - pt.time < 160);
      }

      // Render
      renderCanvas(ctx, state);

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [gameState]);

  const handleGameOver = async (finalScore) => {
    setGameState('GAMEOVER');
    if (finalScore > highScore) {
      setHighScore(finalScore);
      localStorage.setItem('fruit_slicer_highscore', finalScore.toString());
    }

    if (user?.id) {
      try {
        await api.post('/games/score', {
          gameKey: 'FRUIT_SLICER',
          score: finalScore
        });
      } catch (err) {}
    }
  };

  const renderCanvas = (ctx, state) => {
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Dojo Wooden Wall Background
    const bgGrad = ctx.createRadialGradient(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, 50, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, 450);
    bgGrad.addColorStop(0, '#24140a');
    bgGrad.addColorStop(1, '#0e0703');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Splashes on background
    state.splashes.forEach(s => {
      ctx.fillStyle = s.color;
      ctx.globalAlpha = s.alpha;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1.0;
    });

    // Draw Particles
    state.particles.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1.0;
    });

    // Draw Fruit Halves
    state.halves.forEach(h => {
      ctx.save();
      ctx.translate(h.x, h.y);
      ctx.rotate(h.rotation);
      ctx.beginPath();
      ctx.arc(0, 0, h.radius, h.side === 'LEFT' ? Math.PI / 2 : -Math.PI / 2, h.side === 'LEFT' ? (3 * Math.PI) / 2 : Math.PI / 2);
      ctx.fillStyle = h.color;
      ctx.fill();
      ctx.fillStyle = h.innerColor;
      ctx.beginPath();
      ctx.arc(0, 0, h.radius * 0.75, h.side === 'LEFT' ? Math.PI / 2 : -Math.PI / 2, h.side === 'LEFT' ? (3 * Math.PI) / 2 : Math.PI / 2);
      ctx.fill();
      ctx.restore();
    });

    // Draw Whole Fruits / Bombs
    state.fruits.forEach(f => {
      ctx.save();
      ctx.translate(f.x, f.y);
      ctx.rotate(f.rotation);

      if (f.isBomb) {
        // Bomb
        ctx.fillStyle = '#111';
        ctx.beginPath();
        ctx.arc(0, 0, f.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ff0055';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Bomb Fuse Spark
        ctx.fillStyle = '#ffd600';
        ctx.shadowColor = '#ff0055';
        ctx.shadowBlur = 10;
        ctx.fillRect(-3, -f.radius - 8, 6, 8);
        ctx.shadowBlur = 0;
      } else {
        // Fruit Rind
        ctx.fillStyle = f.color;
        ctx.beginPath();
        ctx.arc(0, 0, f.radius, 0, Math.PI * 2);
        ctx.fill();

        // Fruit Inner
        ctx.fillStyle = f.innerColor;
        ctx.beginPath();
        ctx.arc(0, 0, f.radius * 0.78, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });

    // Draw Glowing Blade Swipe Trail
    if (state.bladePoints.length > 1) {
      ctx.strokeStyle = '#00f3ff';
      ctx.shadowColor = '#00f3ff';
      ctx.shadowBlur = 18;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      for (let i = 1; i < state.bladePoints.length; i++) {
        const pt1 = state.bladePoints[i - 1];
        const pt2 = state.bladePoints[i];
        const width = (i / state.bladePoints.length) * 8;
        ctx.lineWidth = Math.max(1, width);
        ctx.beginPath();
        ctx.moveTo(pt1.x, pt1.y);
        ctx.lineTo(pt2.x, pt2.y);
        ctx.stroke();
      }
      ctx.shadowBlur = 0;
    }
  };

  return (
    <div className="fruit-slicer-container">
      <div className="slicer-wrapper">
        {/* Header HUD */}
        <div className="slicer-header">
          <button className="btn-tertiary" onClick={onLeave}>
            ← EXIT TO HUB
          </button>
          <div className="slicer-hud">
            <div className="hud-pill">
              <span style={{ color: '#aaa', fontSize: '0.8rem' }}>SCORE</span>
              <strong style={{ fontSize: '1.4rem', color: '#ff9100' }}>{score}</strong>
            </div>
            <div className="hud-pill">
              <span style={{ color: '#aaa', fontSize: '0.8rem' }}>LIVES</span>
              <div className="lives-box">
                {[...Array(3)].map((_, i) => (
                  <span key={i} style={{ color: i < lives ? '#ff1744' : '#444' }}>
                    {i < lives ? '❤️' : '✖️'}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div style={{ width: '80px' }}></div>
        </div>

        {/* Canvas Area */}
        <div
          className="slicer-canvas-box"
          onMouseDown={handlePointerDown}
          onMouseMove={handlePointerMove}
          onMouseUp={handlePointerUp}
          onTouchStart={handlePointerDown}
          onTouchMove={handlePointerMove}
          onTouchEnd={handlePointerUp}
        >
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="slicer-canvas"
          />

          {/* Combo Floating Badge */}
          {comboText && (
            <div style={{
              position: 'absolute',
              top: '25%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontSize: '2rem',
              fontWeight: '900',
              color: '#ffd600',
              textShadow: '0 0 20px #ff0055',
              pointerEvents: 'none',
              animation: 'bounce 0.5s ease infinite alternate'
            }}>
              {comboText}
            </div>
          )}

          {/* Menus */}
          {gameState === 'MENU' && (
            <div className="slicer-overlay">
              <h1 className="slicer-title">FRUIT BLADE SLICER</h1>
              <p style={{ color: '#ccc', maxWidth: '420px', lineHeight: 1.6 }}>
                Swipe your blade across flying fruits to slice them. Create massive combos and avoid deadly explosive bombs!
              </p>
              <button className="slicer-btn-play" onClick={startGame}>
                START SLICING 🍉
              </button>
            </div>
          )}

          {gameState === 'GAMEOVER' && (
            <div className="slicer-overlay">
              <h1 className="slicer-title" style={{ color: '#ff1744' }}>GAME OVER</h1>
              <p style={{ fontSize: '1.2rem', color: '#fff' }}>
                Final Score: <strong style={{ color: '#ff9100' }}>{score}</strong>
              </p>
              {score >= highScore && score > 0 && (
                <div style={{ color: '#ffd600', fontWeight: 'bold' }}>
                  🏆 NEW HIGH SCORE!
                </div>
              )}
              <button className="slicer-btn-play" onClick={startGame}>
                SLICE AGAIN 🔄
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FruitSlicerGame;
