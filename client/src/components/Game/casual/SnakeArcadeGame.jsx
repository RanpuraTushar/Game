import React, { useEffect, useRef, useState } from 'react';
import SoundEffects from '../../../utils/SoundEffects';
import { api } from '../../../services/api';
import './SnakeArcadeGame.css';

const GRID_SIZE = 20;

const SnakeArcadeGame = ({ user, onLeave }) => {
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [length, setLength] = useState(3);
  const [gameOver, setGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [unlockedBanner, setUnlockedBanner] = useState(null);

  const state = useRef({
    snake: [{ x: 10, y: 10 }, { x: 10, y: 11 }, { x: 10, y: 12 }],
    dir: { x: 0, y: -1 },
    nextDir: { x: 0, y: -1 },
    food: { x: 5, y: 5 },
    goldenFood: null,
    score: 0,
    speed: 120
  });

  const spawnFood = (snake) => {
    let newFood;
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE)
      };
      if (!snake.some(s => s.x === newFood.x && s.y === newFood.y)) break;
    }
    return newFood;
  };

  const startNewGame = () => {
    state.current = {
      snake: [{ x: 10, y: 10 }, { x: 10, y: 11 }, { x: 10, y: 12 }],
      dir: { x: 0, y: -1 },
      nextDir: { x: 0, y: -1 },
      food: { x: 5, y: 5 },
      goldenFood: null,
      score: 0,
      speed: 120
    };
    setScore(0);
    setLength(3);
    setGameOver(false);
    setIsPaused(false);
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
      if (s.snake.some(segment => segment.x === head.x && segment.y === head.y)) {
        setGameOver(true);
        SoundEffects.playLoss();
        if (s.score > highScore) setHighScore(s.score);
        const res = await api.submitScore('SNAKE_GAME', s.score, false, user);
        if (res?.unlockedAchievements?.length > 0) setUnlockedBanner(res.unlockedAchievements[0]);
        return;
      }

      s.snake.unshift(head);

      // Check Food Eaten
      if (head.x === s.food.x && head.y === s.food.y) {
        s.score += 10;
        setScore(s.score);
        setLength(s.snake.length);
        s.food = spawnFood(s.snake);
        SoundEffects.playSafe();
        s.speed = Math.max(65, 120 - Math.floor(s.snake.length * 1.5));
      } else {
        s.snake.pop();
      }

      // Draw Grid
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

      // Draw Food (Glowing Apple)
      ctx.fillStyle = '#ff0055';
      ctx.shadowColor = '#ff0055';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(s.food.x * cellSize + cellSize / 2, s.food.y * cellSize + cellSize / 2, cellSize / 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Draw Snake Body
      s.snake.forEach((segment, idx) => {
        const isHead = idx === 0;
        ctx.fillStyle = isHead ? '#00ff66' : '#00c853';
        ctx.shadowColor = isHead ? '#00ff66' : 'transparent';
        ctx.shadowBlur = isHead ? 10 : 0;
        ctx.fillRect(segment.x * cellSize + 1, segment.y * cellSize + 1, cellSize - 2, cellSize - 2);
      });
      ctx.shadowBlur = 0;

      timerId = setTimeout(tick, s.speed);
    };

    timerId = setTimeout(tick, state.current.speed);
    return () => clearTimeout(timerId);
  }, [gameOver, isPaused, highScore]);

  return (
    <div className="snake-arcade-container glass-panel">
      <div className="snake-arcade-header">
        <button className="btn-secondary" onClick={onLeave}>&larr; LEAVE</button>
        <div className="snake-stats-bar">
          <span>SCORE: <strong style={{ color: '#00ff66' }}>{score}</strong></span>
          <span>LENGTH: <strong style={{ color: '#00f3ff' }}>{length}</strong></span>
          <span>BEST: <strong style={{ color: '#ffd600' }}>{highScore}</strong></span>
        </div>
        <button className="btn-tertiary" onClick={startNewGame}>RESET</button>
      </div>

      {unlockedBanner && (
        <div className="achievement-toast">
          <span>🏆 UNLOCKED: <strong>{unlockedBanner.title}</strong> (+{unlockedBanner.points} pts)</span>
        </div>
      )}

      <div className="snake-canvas-wrap">
        <canvas ref={canvasRef} width={420} height={420} className="snake-canvas" />
      </div>

      <p className="snake-hint">💡 Use <strong>Arrow Keys</strong> or <strong>WASD</strong> to slither.</p>

      {gameOver && (
        <div className="finish-overlay">
          <h2 className="neon-text" style={{ color: '#ff0055' }}>SNAKE CRASH!</h2>
          <p style={{ color: '#fff', fontSize: '1.3rem', marginBottom: '15px' }}>Final Score: {score}</p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn-primary" onClick={startNewGame}>PLAY AGAIN</button>
            <button className="btn-secondary" onClick={onLeave}>BACK TO HUB</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SnakeArcadeGame;
