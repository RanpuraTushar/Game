import React, { useRef, useEffect, useState } from 'react';
import SoundEffects from '../../../utils/SoundEffects';
import { api } from '../../../services/api';
import './DinoRunnerGame.css';

const CANVAS_WIDTH = 580;
const CANVAS_HEIGHT = 260;
const GROUND_Y = 210;

const DinoRunnerGame = ({ user, onLeave }) => {
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [unlockedBanner, setUnlockedBanner] = useState(null);

  const gameState = useRef({
    dino: { x: 50, y: GROUND_Y - 40, width: 34, height: 40, vy: 0, isJumping: false, isDucking: false },
    obstacles: [],
    groundOffset: 0,
    speed: 5.5,
    score: 0,
    active: true,
    lastObstacleTime: 0
  });

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['Space', 'ArrowUp', 'KeyW'].includes(e.code)) {
        e.preventDefault();
        jump();
      }
      if (['ArrowDown', 'KeyS'].includes(e.code)) {
        e.preventDefault();
        gameState.current.dino.isDucking = true;
      }
    };

    const handleKeyUp = (e) => {
      if (['ArrowDown', 'KeyS'].includes(e.code)) {
        gameState.current.dino.isDucking = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    let animationId;
    const render = () => {
      update();
      draw();
      if (gameState.current.active) {
        animationId = requestAnimationFrame(render);
      }
    };
    animationId = requestAnimationFrame(render);

    return () => {
      gameState.current.active = false;
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      cancelAnimationFrame(animationId);
    };
  }, []);

  const jump = () => {
    const d = gameState.current.dino;
    if (!d.isJumping) {
      d.vy = -12.5;
      d.isJumping = true;
      SoundEffects.playClick();
    }
  };

  const update = () => {
    const s = gameState.current;
    if (!s.active) return;

    // Dino Physics
    const d = s.dino;
    d.y += d.vy;
    d.vy += 0.65; // gravity

    const currentHeight = d.isDucking ? 24 : 40;
    d.height = currentHeight;

    if (d.y >= GROUND_Y - currentHeight) {
      d.y = GROUND_Y - currentHeight;
      d.vy = 0;
      d.isJumping = false;
    }

    // Move Ground & Obstacles
    s.groundOffset = (s.groundOffset + s.speed) % 40;
    s.speed += 0.001; // subtle speed ramp
    s.score += 0.2;
    setScore(Math.floor(s.score));

    // Spawn Obstacles
    const now = Date.now();
    if (now - s.lastObstacleTime > 1400 / (s.speed / 5.5)) {
      if (Math.random() < 0.65) {
        const isBird = Math.random() < 0.3 && s.score > 150;
        s.obstacles.push({
          x: CANVAS_WIDTH + 20,
          y: isBird ? GROUND_Y - 55 : GROUND_Y - 35,
          width: isBird ? 30 : 20,
          height: isBird ? 18 : 35,
          type: isBird ? 'bird' : 'cactus'
        });
        s.lastObstacleTime = now;
      }
    }

    // Move Obstacles & Check Collisions
    s.obstacles.forEach(o => {
      o.x -= s.speed;

      // Hitbox Collision
      const padding = 4;
      if (
        d.x + padding < o.x + o.width - padding &&
        d.x + d.width - padding > o.x + padding &&
        d.y + padding < o.y + o.height - padding &&
        d.y + d.height - padding > o.y + padding
      ) {
        handleGameOver();
      }
    });

    s.obstacles = s.obstacles.filter(o => o.x > -50);
  };

  const handleGameOver = async () => {
    gameState.current.active = false;
    setGameOver(true);
    SoundEffects.playLoss();
    const finalScore = Math.floor(gameState.current.score);
    if (finalScore > highScore) setHighScore(finalScore);

    const res = await api.submitScore('DINO_RUNNER', finalScore, false, user);
    if (res?.unlockedAchievements?.length > 0) setUnlockedBanner(res.unlockedAchievements[0]);
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const s = gameState.current;

    // Background
    ctx.fillStyle = '#080c1a';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw Ground Line
    ctx.strokeStyle = '#00f3ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    ctx.lineTo(CANVAS_WIDTH, GROUND_Y);
    ctx.stroke();

    // Ground Grid Dots
    ctx.fillStyle = 'rgba(0, 243, 255, 0.4)';
    for (let x = -s.groundOffset; x < CANVAS_WIDTH; x += 30) {
      ctx.fillRect(x, GROUND_Y + 6, 12, 2);
    }

    // Draw Cyber Dino
    const d = s.dino;
    ctx.fillStyle = '#00ff66';
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#00ff66';

    // Body
    ctx.fillRect(d.x, d.y, d.width, d.height);
    // Head / Eye
    ctx.fillStyle = '#080c1a';
    ctx.fillRect(d.x + d.width - 10, d.y + 4, 4, 4);

    // Draw Obstacles
    s.obstacles.forEach(o => {
      ctx.fillStyle = o.type === 'bird' ? '#ff0055' : '#ffea00';
      ctx.shadowColor = ctx.fillStyle;
      ctx.fillRect(o.x, o.y, o.width, o.height);
    });

    ctx.shadowBlur = 0;
  };

  const restartGame = () => {
    gameState.current.dino = { x: 50, y: GROUND_Y - 40, width: 34, height: 40, vy: 0, isJumping: false, isDucking: false };
    gameState.current.obstacles = [];
    gameState.current.speed = 5.5;
    gameState.current.score = 0;
    gameState.current.active = true;
    setGameOver(false);
    setScore(0);
  };

  return (
    <div className="dino-runner-container glass-panel">
      <div className="dino-header">
        <button className="btn-secondary" onClick={onLeave}>&larr; LEAVE</button>
        <div className="dino-score-box">
          <span>HI: <strong style={{ color: '#aaa' }}>{highScore}</strong></span>
          <span>SCORE: <strong style={{ color: '#00ff66' }}>{score}</strong></span>
        </div>
      </div>

      {unlockedBanner && (
        <div className="achievement-toast">
          <span>🏆 UNLOCKED: <strong>{unlockedBanner.title}</strong> (+{unlockedBanner.points} pts)</span>
        </div>
      )}

      <canvas 
        ref={canvasRef} 
        width={CANVAS_WIDTH} 
        height={CANVAS_HEIGHT} 
        className="dino-canvas" 
        onClick={jump}
      />

      <div className="dino-controls-hint">
        <span>💡 Tap / Spacebar / Up to JUMP. Down to DUCK.</span>
      </div>

      {gameOver && (
        <div className="finish-overlay">
          <h2 className="neon-text" style={{ color: '#ff3366' }}>CRASHED!</h2>
          <p style={{ color: '#fff', fontSize: '1.2rem', marginBottom: '15px' }}>
            Distance: {score}m
          </p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn-primary" onClick={restartGame}>RUN AGAIN</button>
            <button className="btn-secondary" onClick={onLeave}>BACK TO HUB</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DinoRunnerGame;
