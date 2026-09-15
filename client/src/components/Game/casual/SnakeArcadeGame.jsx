import React, { useEffect, useRef, useState } from 'react';
import SoundEffects from '../../../utils/SoundEffects';
import { api } from '../../../services/api';
import './SnakeArcadeGame.css';

const GRID_SIZE = 20;

// Progressive Dynamic Difficulty Scaling System
// Speed accelerates, score multipliers increase, and cyber laser hazards appear!
const SNAKE_DIFFICULTY_LEVELS = [
  { level: 1, name: 'NOVICE', minScore: 0, speed: 125, color: '#00e676', multiplier: 1.0, maxHazards: 0 },
  { level: 2, name: 'SPEEDER', minScore: 80, speed: 102, color: '#00f3ff', multiplier: 1.25, maxHazards: 0 },
  { level: 3, name: 'CYBER HAZARD', minScore: 180, speed: 84, color: '#ffd600', multiplier: 1.5, maxHazards: 3 },
  { level: 4, name: 'OVERDRIVE', minScore: 350, speed: 68, color: '#ff9100', multiplier: 2.0, maxHazards: 6 },
  { level: 5, name: 'CHAOS GOD', minScore: 600, speed: 52, color: '#ff0055', multiplier: 2.5, maxHazards: 9 }
];

const getSnakeDifficulty = (score) => {
  for (let i = SNAKE_DIFFICULTY_LEVELS.length - 1; i >= 0; i--) {
    if (score >= SNAKE_DIFFICULTY_LEVELS[i].minScore) {
      return SNAKE_DIFFICULTY_LEVELS[i];
    }
  }
  return SNAKE_DIFFICULTY_LEVELS[0];
};

const SnakeArcadeGame = ({ user, onLeave }) => {
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [length, setLength] = useState(3);
  const [gameOver, setGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [unlockedBanner, setUnlockedBanner] = useState(null);
  const [levelUpBanner, setLevelUpBanner] = useState(null);

  const state = useRef({
    snake: [{ x: 10, y: 10 }, { x: 10, y: 11 }, { x: 10, y: 12 }],
    dir: { x: 0, y: -1 },
    nextDir: { x: 0, y: -1 },
    food: { x: 5, y: 5 },
    goldenFood: null,
    hazards: [],
    score: 0,
    speed: 125
  });

  const spawnFood = (snake, hazards) => {
    let newFood;
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE)
      };
      const hitSnake = snake.some(s => s.x === newFood.x && s.y === newFood.y);
      const hitHazard = hazards.some(h => h.x === newFood.x && h.y === newFood.y);
      if (!hitSnake && !hitHazard) break;
    }
    return newFood;
  };

  const spawnHazards = (count, snake, food) => {
    const hazards = [];
    while (hazards.length < count) {
      const candidate = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE)
      };
      // Keep away from snake head and immediate area
      const distToHead = Math.abs(candidate.x - snake[0].x) + Math.abs(candidate.y - snake[0].y);
      if (distToHead <= 3) continue;

      const hitSnake = snake.some(s => s.x === candidate.x && s.y === candidate.y);
      const hitFood = food && food.x === candidate.x && food.y === candidate.y;
      const hitExisting = hazards.some(h => h.x === candidate.x && h.y === candidate.y);
      if (!hitSnake && !hitFood && !hitExisting) {
        hazards.push(candidate);
      }
    }
    return hazards;
  };

  const startNewGame = () => {
    state.current = {
      snake: [{ x: 10, y: 10 }, { x: 10, y: 11 }, { x: 10, y: 12 }],
      dir: { x: 0, y: -1 },
      nextDir: { x: 0, y: -1 },
      food: { x: 5, y: 5 },
      goldenFood: null,
      hazards: [],
      score: 0,
      speed: 125
    };
    setScore(0);
    setLength(3);
    setGameOver(false);
    setIsPaused(false);
    setLevelUpBanner(null);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      const s = state.current;
      if (['ArrowUp', 'KeyW'].includes(e.code) && s.dir.y === 0) s.nextDir = { x: 0, y: -1 };
      else if (['ArrowDown', 'KeyS'].includes(e.code) && s.dir.y === 0) s.nextDir = { x: 0, y: 1 };
      else if (['ArrowLeft', 'KeyA'].includes(e.code) && s.dir.x === 0) s.nextDir = { x: -1, y: 0 };
      else if (['ArrowRight', 'KeyD'].includes(e.code) && s.dir.x === 0) s.nextDir = { x: 1, y: 0 };
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let timerId;

    const tick = async () => {
      if (gameOver || isPaused) return;

      const s = state.current;
      s.dir = s.nextDir;

      const head = { x: s.snake[0].x + s.dir.x, y: s.snake[0].y + s.dir.y };

      // Wall Wrap-around
      if (head.x < 0) head.x = GRID_SIZE - 1;
      if (head.x >= GRID_SIZE) head.x = 0;
      if (head.y < 0) head.y = GRID_SIZE - 1;
      if (head.y >= GRID_SIZE) head.y = 0;

      // Self collision
      const hitSelf = s.snake.some(segment => segment.x === head.x && segment.y === head.y);
      // Hazard collision
      const hitHazard = s.hazards.some(hazard => hazard.x === head.x && hazard.y === head.y);

      if (hitSelf || hitHazard) {
        setGameOver(true);
        SoundEffects.playLoss();
        if (s.score > highScore) setHighScore(s.score);
        const res = await api.submitScore('SNAKE_GAME', s.score, false, user);
        if (res?.unlockedAchievements?.length > 0) setUnlockedBanner(res.unlockedAchievements[0]);
        return;
      }

      s.snake.unshift(head);

      const curDiff = getSnakeDifficulty(s.score);

      // Check Golden Food Eaten
      let ateGolden = false;
      if (s.goldenFood && head.x === s.goldenFood.x && head.y === s.goldenFood.y) {
        ateGolden = true;
        SoundEffects.playTrophy();
        s.score += Math.round(30 * curDiff.multiplier);
        s.goldenFood = null;
      }

      // Check Normal Food Eaten
      if (head.x === s.food.x && head.y === s.food.y) {
        SoundEffects.playSafe();
        s.score += Math.round(10 * curDiff.multiplier);
        s.food = spawnFood(s.snake, s.hazards);

        // Chance to spawn golden bonus apple at level >= 2
        if (curDiff.level >= 2 && !s.goldenFood && Math.random() < 0.35) {
          s.goldenFood = spawnFood(s.snake, [...s.hazards, s.food]);
        }
      } else if (!ateGolden) {
        s.snake.pop();
      }

      setScore(s.score);
      setLength(s.snake.length);

      // Check Level Up!
      const newDiff = getSnakeDifficulty(s.score);
      if (newDiff.level > curDiff.level) {
        SoundEffects.playTrophy();
        setLevelUpBanner(newDiff);
        setTimeout(() => setLevelUpBanner(null), 3000);

        // Spawn hazards for higher levels
        if (newDiff.maxHazards > s.hazards.length) {
          s.hazards = spawnHazards(newDiff.maxHazards, s.snake, s.food);
        }
      }

      // Dynamic Speed calculated by current difficulty tier
      s.speed = Math.max(48, newDiff.speed - Math.min(20, Math.floor(s.snake.length * 0.8)));

      // Render Frame
      const cellSize = canvas.width / GRID_SIZE;
      ctx.fillStyle = '#0a0a14';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Grid dots
      ctx.fillStyle = 'rgba(0, 243, 255, 0.06)';
      for (let x = 0; x < GRID_SIZE; x++) {
        for (let y = 0; y < GRID_SIZE; y++) {
          ctx.fillRect(x * cellSize + cellSize / 2 - 1, y * cellSize + cellSize / 2 - 1, 2, 2);
        }
      }

      // Draw Cyber Hazards
      s.hazards.forEach(hazard => {
        ctx.fillStyle = '#ff0055';
        ctx.shadowColor = '#ff0055';
        ctx.shadowBlur = 10;
        ctx.fillRect(hazard.x * cellSize + 2, hazard.y * cellSize + 2, cellSize - 4, cellSize - 4);
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('✕', hazard.x * cellSize + cellSize / 2, hazard.y * cellSize + cellSize / 2);
      });
      ctx.shadowBlur = 0;

      // Draw Normal Food (Glowing Apple)
      ctx.fillStyle = '#ff2a5f';
      ctx.shadowColor = '#ff2a5f';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(s.food.x * cellSize + cellSize / 2, s.food.y * cellSize + cellSize / 2, cellSize / 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Draw Golden Bonus Apple (if active)
      if (s.goldenFood) {
        ctx.fillStyle = '#ffd600';
        ctx.shadowColor = '#ffd600';
        ctx.shadowBlur = 16;
        ctx.beginPath();
        ctx.arc(s.goldenFood.x * cellSize + cellSize / 2, s.goldenFood.y * cellSize + cellSize / 2, cellSize / 2.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('★', s.goldenFood.x * cellSize + cellSize / 2, s.goldenFood.y * cellSize + cellSize / 2);
        ctx.shadowBlur = 0;
      }

      // Draw Snake Body
      s.snake.forEach((segment, idx) => {
        const isHead = idx === 0;
        ctx.fillStyle = isHead ? newDiff.color : '#00c853';
        ctx.shadowColor = isHead ? newDiff.color : 'transparent';
        ctx.shadowBlur = isHead ? 12 : 0;
        ctx.fillRect(segment.x * cellSize + 1, segment.y * cellSize + 1, cellSize - 2, cellSize - 2);
      });
      ctx.shadowBlur = 0;

      timerId = setTimeout(tick, s.speed);
    };

    timerId = setTimeout(tick, state.current.speed);
    return () => clearTimeout(timerId);
  }, [gameOver, isPaused, highScore]);

  const handleDirection = (dirName) => {
    const s = state.current;
    if (dirName === 'UP' && s.dir.y === 0) s.nextDir = { x: 0, y: -1 };
    else if (dirName === 'DOWN' && s.dir.y === 0) s.nextDir = { x: 0, y: 1 };
    else if (dirName === 'LEFT' && s.dir.x === 0) s.nextDir = { x: -1, y: 0 };
    else if (dirName === 'RIGHT' && s.dir.x === 0) s.nextDir = { x: 1, y: 0 };
  };

  const touchStartRef = useRef(null);
  const handleTouchStart = (e) => {
    if (e.touches && e.touches[0]) {
      touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  };
  const handleTouchEnd = (e) => {
    if (!touchStartRef.current || !e.changedTouches || !e.changedTouches[0]) return;
    const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
    const dy = e.changedTouches[0].clientY - touchStartRef.current.y;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    if (Math.max(absDx, absDy) > 20) {
      if (absDx > absDy) {
        handleDirection(dx > 0 ? 'RIGHT' : 'LEFT');
      } else {
        handleDirection(dy > 0 ? 'DOWN' : 'UP');
      }
    }
    touchStartRef.current = null;
  };

  const currentDiff = getSnakeDifficulty(score);

  return (
    <div className="snake-arcade-container glass-panel">
      {/* Level Up Banner */}
      {levelUpBanner && (
        <div className="snake-levelup-toast" style={{ borderColor: levelUpBanner.color }}>
          <span>⚡ LEVEL UP: <strong>{levelUpBanner.name} (L{levelUpBanner.level})</strong></span>
          <small>Speed increased! • {levelUpBanner.multiplier}x bonus active</small>
        </div>
      )}

      <div className="snake-arcade-header">
        <button className="btn-secondary" onClick={onLeave}>&larr; LEAVE</button>
        <div className="snake-stats-bar">
          <span>SCORE: <strong style={{ color: '#00ff66' }}>{score}</strong></span>
          <span className="snake-diff-pill" style={{ borderColor: currentDiff.color, color: currentDiff.color }}>
            L{currentDiff.level} • {currentDiff.name} ({currentDiff.multiplier}x)
          </span>
          <span>BEST: <strong style={{ color: '#ffd600' }}>{highScore}</strong></span>
        </div>
        <button className="btn-tertiary" onClick={startNewGame}>RESET</button>
      </div>

      {unlockedBanner && (
        <div className="achievement-toast">
          <span>🏆 UNLOCKED: <strong>{unlockedBanner.title}</strong> (+{unlockedBanner.points} pts)</span>
        </div>
      )}

      <div
        className="snake-canvas-wrap"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <canvas ref={canvasRef} width={420} height={420} className="snake-canvas" />
      </div>

      {/* Desktop Keyboard Controls HUD */}
      <div className="snake-desktop-controls-hud">
        <div className="hud-key-pill"><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> or <kbd>▲</kbd><kbd>◀</kbd><kbd>▼</kbd><kbd>▶</kbd> <span>Control Snake Movement</span></div>
      </div>

      {/* Mobile Touch Cyber D-Pad */}
      <div className="snake-mobile-dpad">
        <button
          className="snake-dpad-btn dpad-up"
          onClick={() => handleDirection('UP')}
          onTouchStart={(e) => { e.preventDefault(); handleDirection('UP'); }}
          aria-label="Up"
        >
          ▲
        </button>
        <div className="snake-dpad-middle-row">
          <button
            className="snake-dpad-btn dpad-left"
            onClick={() => handleDirection('LEFT')}
            onTouchStart={(e) => { e.preventDefault(); handleDirection('LEFT'); }}
            aria-label="Left"
          >
            ◀
          </button>
          <div className="snake-dpad-center">⚡</div>
          <button
            className="snake-dpad-btn dpad-right"
            onClick={() => handleDirection('RIGHT')}
            onTouchStart={(e) => { e.preventDefault(); handleDirection('RIGHT'); }}
            aria-label="Right"
          >
            ▶
          </button>
        </div>
        <button
          className="snake-dpad-btn dpad-down"
          onClick={() => handleDirection('DOWN')}
          onTouchStart={(e) => { e.preventDefault(); handleDirection('DOWN'); }}
          aria-label="Down"
        >
          ▼
        </button>
      </div>

      <p className="snake-hint">💡 Eat apples to grow • Watch out for red <strong>✕</strong> cyber laser hazards at higher levels!</p>

      {gameOver && (
        <div className="finish-overlay">
          <h2 className="neon-text" style={{ color: '#ff0055' }}>SNAKE CRASH!</h2>
          <div className="snake-go-stats">
            <p>Level: <strong style={{ color: currentDiff.color }}>L{currentDiff.level} ({currentDiff.name})</strong></p>
            <p>Final Score: <strong style={{ color: '#00ff66' }}>{score}</strong></p>
            <p>Score Multiplier: <strong style={{ color: '#ffd600' }}>{currentDiff.multiplier}x</strong></p>
          </div>
          <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
            <button className="btn-primary" onClick={startNewGame}>PLAY AGAIN</button>
            <button className="btn-secondary" onClick={onLeave}>BACK TO HUB</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SnakeArcadeGame;
