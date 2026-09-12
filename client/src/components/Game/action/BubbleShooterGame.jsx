import React, { useRef, useEffect, useState } from 'react';
import SoundEffects from '../../../utils/SoundEffects';
import { api } from '../../../services/api';
import './BubbleShooterGame.css';

const CANVAS_WIDTH = 440;
const CANVAS_HEIGHT = 520;
const BUBBLE_RADIUS = 18;
const BUBBLE_DIAMETER = BUBBLE_RADIUS * 2;
const ROWS = 8;
const COLS = 11;

const BUBBLE_TIERS = [
  { level: 1, name: 'NOVICE', colors: ['#ff3b30', '#00e676', '#2979ff'], dropEvery: 6, mult: 1.0, color: '#00ff66' },
  { level: 2, name: 'ADEPT', colors: ['#ff3b30', '#00e676', '#2979ff', '#ffd600'], dropEvery: 5, mult: 1.25, color: '#00f3ff' },
  { level: 3, name: 'EXPERT', colors: ['#ff3b30', '#00e676', '#2979ff', '#ffd600', '#e040fb'], dropEvery: 5, mult: 1.5, color: '#ffd600' },
  { level: 4, name: 'MASTER', colors: ['#ff3b30', '#00e676', '#2979ff', '#ffd600', '#e040fb', '#00f3ff'], dropEvery: 4, mult: 2.0, color: '#ff9100' },
  { level: 5, name: 'CHAOS LORD', colors: ['#ff3b30', '#00e676', '#2979ff', '#ffd600', '#e040fb', '#00f3ff', '#ff007f'], dropEvery: 3, mult: 2.5, color: '#ff0055' }
];

const BubbleShooterGame = ({ user, onLeave }) => {
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [shotsUntilDrop, setShotsUntilDrop] = useState(BUBBLE_TIERS[0].dropEvery);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [unlockedBanner, setUnlockedBanner] = useState(null);
  const [levelUpBanner, setLevelUpBanner] = useState(null);

  const gameState = useRef({
    grid: [],
    level: 1,
    shotsFired: 0,
    shooterAngle: -Math.PI / 2,
    currentBubble: null,
    nextBubbleColor: null,
    flyingBubble: null,
    particles: [],
    active: true,
    score: 0
  });

  const getCurrentTier = () => BUBBLE_TIERS[Math.min(gameState.current.level - 1, BUBBLE_TIERS.length - 1)];

  const initGrid = (targetLevel = 1) => {
    const tier = BUBBLE_TIERS[targetLevel - 1] || BUBBLE_TIERS[0];
    gameState.current.level = targetLevel;
    gameState.current.shotsFired = 0;
    setLevel(targetLevel);
    setShotsUntilDrop(tier.dropEvery);

    const colors = tier.colors;
    const grid = [];
    for (let r = 0; r < ROWS; r++) {
      const row = [];
      const colsInRow = r % 2 === 0 ? COLS : COLS - 1;
      for (let c = 0; c < colsInRow; c++) {
        if (r < 4) {
          row.push(colors[Math.floor(Math.random() * colors.length)]);
        } else {
          row.push(null);
        }
      }
      grid.push(row);
    }

    gameState.current.grid = grid;
    gameState.current.currentBubble = colors[Math.floor(Math.random() * colors.length)];
    gameState.current.nextBubbleColor = colors[Math.floor(Math.random() * colors.length)];
    gameState.current.flyingBubble = null;
    gameState.current.active = true;
    setGameOver(false);
    setGameWon(false);
  };

  const restartGame = () => {
    gameState.current.score = 0;
    setScore(0);
    setLevelUpBanner(null);
    initGrid(1);
  };

  const shootBubble = () => {
    const s = gameState.current;
    if (s.flyingBubble || !s.active || gameOver || gameWon) return;

    const angle = s.shooterAngle;
    s.flyingBubble = {
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT - 35,
      vx: Math.cos(angle) * 11,
      vy: Math.sin(angle) * 11,
      color: s.currentBubble
    };

    const colors = getCurrentTier().colors;
    s.currentBubble = s.nextBubbleColor;
    s.nextBubbleColor = colors[Math.floor(Math.random() * colors.length)];
    SoundEffects.playClick();
  };

  const update = () => {
    const s = gameState.current;
    if (!s.active) return;

    // Move Flying Bubble
    const fb = s.flyingBubble;
    if (fb) {
      fb.x += fb.vx;
      fb.y += fb.vy;

      // Wall Bounce (Left & Right)
      if (fb.x <= BUBBLE_RADIUS) {
        fb.x = BUBBLE_RADIUS;
        fb.vx *= -1;
      } else if (fb.x >= CANVAS_WIDTH - BUBBLE_RADIUS) {
        fb.x = CANVAS_WIDTH - BUBBLE_RADIUS;
        fb.vx *= -1;
      }

      // Hit Top Ceiling or Hit another bubble
      let collided = fb.y <= BUBBLE_RADIUS;

      if (!collided) {
        // Check grid bubble collisions
        for (let r = 0; r < ROWS; r++) {
          const isOdd = r % 2 === 1;
          const xOffset = isOdd ? BUBBLE_DIAMETER / 2 + BUBBLE_RADIUS : BUBBLE_RADIUS;
          const yPos = r * (BUBBLE_DIAMETER * 0.86) + BUBBLE_RADIUS;

          for (let c = 0; c < s.grid[r].length; c++) {
            if (s.grid[r][c]) {
              const xPos = xOffset + c * BUBBLE_DIAMETER;
              if (Math.hypot(fb.x - xPos, fb.y - yPos) < BUBBLE_DIAMETER * 0.9) {
                collided = true;
                break;
              }
            }
          }
          if (collided) break;
        }
      }

      if (collided) {
        snapToGrid(fb);
        s.flyingBubble = null;
      }
    }

    // Update Particles
    s.particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
    });
    s.particles = s.particles.filter(p => p.life > 0);
  };

  const snapToGrid = (fb) => {
    const s = gameState.current;
    // Find closest valid empty cell
    let closestCell = null;
    let minDist = Infinity;

    for (let r = 0; r < ROWS; r++) {
      const isOdd = r % 2 === 1;
      const xOffset = isOdd ? BUBBLE_DIAMETER / 2 + BUBBLE_RADIUS : BUBBLE_RADIUS;
      const yPos = r * (BUBBLE_DIAMETER * 0.86) + BUBBLE_RADIUS;

      for (let c = 0; c < s.grid[r].length; c++) {
        if (!s.grid[r][c]) {
          const xPos = xOffset + c * BUBBLE_DIAMETER;
          const dist = Math.hypot(fb.x - xPos, fb.y - yPos);
          if (dist < minDist) {
            minDist = dist;
            closestCell = { r, c };
          }
        }
      }
    }

    if (closestCell) {
      s.grid[closestCell.r][closestCell.c] = fb.color;
      popCluster(closestCell.r, closestCell.c, fb.color);
    }
  };

  const popCluster = (startR, startC, targetColor) => {
    const s = gameState.current;
    const visited = new Set();
    const cluster = [];

    const getNeighbors = (r, c) => {
      const isOdd = r % 2 === 1;
      const offsets = isOdd
        ? [[-1, 0], [-1, 1], [0, -1], [0, 1], [1, 0], [1, 1]]
        : [[-1, -1], [-1, 0], [0, -1], [0, 1], [1, -1], [1, 0]];

      const res = [];
      offsets.forEach(([dr, dc]) => {
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < ROWS && nc >= 0 && nc < s.grid[nr].length) {
          res.push({ r: nr, c: nc });
        }
      });
      return res;
    };

    const queue = [{ r: startR, c: startC }];
    visited.add(`${startR}-${startC}`);

    while (queue.length > 0) {
      const curr = queue.shift();
      cluster.push(curr);

      getNeighbors(curr.r, curr.c).forEach(n => {
        const key = `${n.r}-${n.c}`;
        if (!visited.has(key) && s.grid[n.r][n.c] === targetColor) {
          visited.add(key);
          queue.push(n);
        }
      });
    }

    if (cluster.length >= 3) {
      SoundEffects.playSafe();
      const tier = getCurrentTier();
      const points = Math.round(cluster.length * 35 * tier.mult);
      s.score = (s.score || 0) + points;
      setScore(s.score);

      cluster.forEach(({ r, c }) => {
        const color = s.grid[r][c];
        s.grid[r][c] = null;

        // Particle sparks
        const isOdd = r % 2 === 1;
        const xOffset = isOdd ? BUBBLE_DIAMETER / 2 + BUBBLE_RADIUS : BUBBLE_RADIUS;
        const xPos = xOffset + c * BUBBLE_DIAMETER;
        const yPos = r * (BUBBLE_DIAMETER * 0.86) + BUBBLE_RADIUS;

        for (let i = 0; i < 6; i++) {
          s.particles.push({
            x: xPos,
            y: yPos,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4,
            color,
            life: 20
          });
        }
      });

      // Check Victory (No bubbles left)
      const anyLeft = s.grid.some(row => row.some(c => c !== null));
      if (!anyLeft) {
        if (s.level < 5) {
          const nextLevel = s.level + 1;
          const nextTier = BUBBLE_TIERS[nextLevel - 1];
          s.score += 500 * s.level;
          setScore(s.score);
          SoundEffects.playTrophy();
          setLevelUpBanner({ level: nextLevel, name: nextTier.name, mult: nextTier.mult });
          setTimeout(() => setLevelUpBanner(null), 3000);
          initGrid(nextLevel);
          return;
        } else {
          handleVictory();
          return;
        }
      }
    } else {
      SoundEffects.playTokenStep();
    }

    // Shot fired counter towards ceiling drop
    s.shotsFired += 1;
    const tier = getCurrentTier();
    const remaining = tier.dropEvery - (s.shotsFired % tier.dropEvery);
    setShotsUntilDrop(remaining === tier.dropEvery ? 0 : remaining);

    if (s.shotsFired % tier.dropEvery === 0) {
      dropCeiling();
    } else {
      // Check Loss (Bubble reached bottom row)
      if (s.grid[ROWS - 1].some(c => c !== null)) {
        handleGameOver();
      }
    }
  };

  const dropCeiling = () => {
    const s = gameState.current;
    const tier = getCurrentTier();
    const colors = tier.colors;

    // Check if bottom row already occupied
    if (s.grid[ROWS - 1].some(c => c !== null)) {
      handleGameOver();
      return;
    }

    // Shift rows down
    for (let r = ROWS - 1; r > 0; r--) {
      s.grid[r] = [...s.grid[r - 1]];
    }

    // New top row
    const newTop = [];
    for (let c = 0; c < COLS; c++) {
      newTop.push(colors[Math.floor(Math.random() * colors.length)]);
    }
    s.grid[0] = newTop;
    SoundEffects.playMove();

    if (s.grid[ROWS - 1].some(c => c !== null)) {
      handleGameOver();
    }
  };

  const handleVictory = async () => {
    gameState.current.active = false;
    setGameWon(true);
    SoundEffects.playWin();
    const finalScore = (gameState.current.score || score) + 500;
    const res = await api.submitScore('BUBBLE_SHOOTER', finalScore, true, user);
    if (res?.unlockedAchievements?.length > 0) setUnlockedBanner(res.unlockedAchievements[0]);
  };

  const handleGameOver = async () => {
    gameState.current.active = false;
    setGameOver(true);
    SoundEffects.playLoss();
    const finalScore = gameState.current.score || score;
    const res = await api.submitScore('BUBBLE_SHOOTER', finalScore, false, user);
    if (res?.unlockedAchievements?.length > 0) setUnlockedBanner(res.unlockedAchievements[0]);
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const s = gameState.current;

    // Background
    ctx.fillStyle = '#0a0e1c';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw Grid Bubbles
    for (let r = 0; r < ROWS; r++) {
      const isOdd = r % 2 === 1;
      const xOffset = isOdd ? BUBBLE_DIAMETER / 2 + BUBBLE_RADIUS : BUBBLE_RADIUS;
      const yPos = r * (BUBBLE_DIAMETER * 0.86) + BUBBLE_RADIUS;

      for (let c = 0; c < s.grid[r].length; c++) {
        const color = s.grid[r][c];
        if (color) {
          drawBubble(ctx, xOffset + c * BUBBLE_DIAMETER, yPos, color);
        }
      }
    }

    // Draw Aiming Guide Line
    const originX = CANVAS_WIDTH / 2;
    const originY = CANVAS_HEIGHT - 35;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(originX, originY);
    ctx.lineTo(originX + Math.cos(s.shooterAngle) * 90, originY + Math.sin(s.shooterAngle) * 90);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw Flying Bubble
    if (s.flyingBubble) {
      drawBubble(ctx, s.flyingBubble.x, s.flyingBubble.y, s.flyingBubble.color);
    }

    // Draw Current Loaded Shooter Bubble
    if (s.currentBubble) {
      drawBubble(ctx, originX, originY, s.currentBubble);
    }

    // Draw Next Bubble Indicator
    if (s.nextBubbleColor) {
      drawBubble(ctx, 40, CANVAS_HEIGHT - 35, s.nextBubbleColor, 12);
      ctx.fillStyle = '#aaa';
      ctx.font = '10px Orbitron';
      ctx.fillText('NEXT', 28, CANVAS_HEIGHT - 12);
    }

    // Draw Particles
    s.particles.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, 3, 3);
    });
  };

  const drawBubble = (ctx, x, y, color, r = BUBBLE_RADIUS - 1) => {
    ctx.save();
    ctx.shadowBlur = 8;
    ctx.shadowColor = color;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();

    // Specular Highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.beginPath();
    ctx.arc(x - r * 0.35, y - r * 0.35, r * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  const currentTier = getCurrentTier();

  return (
    <div className="bubble-shooter-container glass-panel">
      <div className="bs-header">
        <button className="btn-secondary" onClick={onLeave}>&larr; HUB</button>
        <div className="bs-stats-group">
          <span>SCORE: <strong style={{ color: '#00e676' }}>{score}</strong></span> &bull;
          <span className="bs-tier-badge" style={{ color: currentTier.color, borderColor: currentTier.color }}>
            LVL {level} &bull; {currentTier.name} ({currentTier.mult}x)
          </span> &bull;
          <span className="bs-drop-tag">DROP: <strong>{shotsUntilDrop || currentTier.dropEvery}</strong></span>
        </div>
        <button className="btn-tertiary" onClick={restartGame}>↺ RESET</button>
      </div>

      {levelUpBanner && (
        <div className="bs-levelup-toast">
          🔮 LEVEL {levelUpBanner.level}: {levelUpBanner.name}! CEILING SPEED &amp; COLORS UP (+{levelUpBanner.mult}x SCORE)
        </div>
      )}

      {unlockedBanner && (
        <div className="achievement-toast">
          <span>🏆 UNLOCKED: <strong>{unlockedBanner.title}</strong> (+{unlockedBanner.points} pts)</span>
        </div>
      )}

      <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="bs-canvas" />

      {(gameOver || gameWon) && (
        <div className="finish-overlay">
          <h2 className="neon-text" style={{ color: gameWon ? '#00ff66' : '#ff3366' }}>
            {gameWon ? '🏆 CEILING CLEARED!' : 'SECTOR OVERRUN!'}
          </h2>
          <p style={{ color: '#fff', fontSize: '1.1rem', marginBottom: '6px' }}>
            Final Score: <strong>{score}</strong>
          </p>
          <p style={{ color: currentTier.color, fontSize: '0.95rem', marginBottom: '15px' }}>
            Tier Reached: Level {level} ({currentTier.name})
          </p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn-primary" onClick={restartGame}>PLAY AGAIN</button>
            <button className="btn-secondary" onClick={onLeave}>BACK TO HUB</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BubbleShooterGame;
