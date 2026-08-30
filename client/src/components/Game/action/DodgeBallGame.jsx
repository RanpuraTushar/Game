import React, { useRef, useEffect, useState } from 'react';
import SoundEffects from '../../../utils/SoundEffects';
import { api } from '../../../services/api';
import './DodgeBallGame.css';

const CANVAS_WIDTH = 480;
const CANVAS_HEIGHT = 440;

const DodgeBallGame = ({ user, onLeave }) => {
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [survivalTime, setSurvivalTime] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [unlockedBanner, setUnlockedBanner] = useState(null);

  const gameState = useRef({
    player: { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2, radius: 10 },
    hazards: [],
    coins: [],
    particles: [],
    startTime: Date.now(),
    score: 0,
    active: true
  });

  useEffect(() => {
    initGame();

    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const s = gameState.current;
      s.player.x = Math.max(s.player.radius, Math.min(CANVAS_WIDTH - s.player.radius, e.clientX - rect.left));
      s.player.y = Math.max(s.player.radius, Math.min(CANVAS_HEIGHT - s.player.radius, e.clientY - rect.top));
    };

    const handleTouchMove = (e) => {
      if (e.touches.length > 0) {
        const rect = canvas.getBoundingClientRect();
        const s = gameState.current;
        s.player.x = Math.max(s.player.radius, Math.min(CANVAS_WIDTH - s.player.radius, e.touches[0].clientX - rect.left));
        s.player.y = Math.max(s.player.radius, Math.min(CANVAS_HEIGHT - s.player.radius, e.touches[0].clientY - rect.top));
      }
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('touchmove', handleTouchMove);

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
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('touchmove', handleTouchMove);
      cancelAnimationFrame(animationId);
    };
  }, []);

  const initGame = () => {
    const s = gameState.current;
    s.player = { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2, radius: 10 };
    s.hazards = [];
    s.coins = [];
    s.particles = [];
    s.startTime = Date.now();
    s.score = 0;
    s.active = true;

    // Spawn 5 initial hazards
    for (let i = 0; i < 5; i++) {
      spawnHazard(s);
    }

    setScore(0);
    setSurvivalTime(0);
    setGameOver(false);
  };

  const spawnHazard = (s) => {
    const edge = Math.floor(Math.random() * 4);
    let x, y;
    if (edge === 0) { x = Math.random() * CANVAS_WIDTH; y = 0; }
    else if (edge === 1) { x = CANVAS_WIDTH; y = Math.random() * CANVAS_HEIGHT; }
    else if (edge === 2) { x = Math.random() * CANVAS_WIDTH; y = CANVAS_HEIGHT; }
    else { x = 0; y = Math.random() * CANVAS_HEIGHT; }

    const speed = 2 + Math.random() * 2.5;
    const angle = Math.atan2(CANVAS_HEIGHT / 2 - y, CANVAS_WIDTH / 2 - x) + (Math.random() - 0.5) * 0.8;

    s.hazards.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: 8 + Math.random() * 4,
      color: Math.random() < 0.5 ? '#ff0055' : '#ff9100'
    });
  };

  const spawnCoin = (s) => {
    if (s.coins.length < 3 && Math.random() < 0.04) {
      s.coins.push({
        x: 40 + Math.random() * (CANVAS_WIDTH - 80),
        y: 40 + Math.random() * (CANVAS_HEIGHT - 80),
        radius: 8
      });
    }
  };

  const update = () => {
    const s = gameState.current;
    if (!s.active) return;

    const elapsedSec = Math.floor((Date.now() - s.startTime) / 1000);
    setSurvivalTime(elapsedSec);

    s.score += 0.5;
    setScore(Math.floor(s.score));

    // Gradually add more hazards over time
    if (Math.random() < 0.02 && s.hazards.length < 22) {
      spawnHazard(s);
    }
    spawnCoin(s);

    // Move Hazards & Wall Bounce
    s.hazards.forEach(h => {
      h.x += h.vx;
      h.y += h.vy;

      if (h.x <= h.radius || h.x >= CANVAS_WIDTH - h.radius) h.vx *= -1;
      if (h.y <= h.radius || h.y >= CANVAS_HEIGHT - h.radius) h.vy *= -1;

      // Check Collision with Player
      if (Math.hypot(s.player.x - h.x, s.player.y - h.y) < s.player.radius + h.radius) {
        handleGameOver();
      }
    });

    // Check Coin Collection
    s.coins.forEach((c, idx) => {
      if (Math.hypot(s.player.x - c.x, s.player.y - c.y) < s.player.radius + c.radius) {
        s.coins.splice(idx, 1);
        s.score += 150;
        SoundEffects.playSafe();

        for (let i = 0; i < 8; i++) {
          s.particles.push({
            x: c.x,
            y: c.y,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4,
            color: '#ffd600',
            life: 20
          });
        }
      }
    });

    // Update Particles
    s.particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
    });
    s.particles = s.particles.filter(p => p.life > 0);
  };

  const handleGameOver = async () => {
    gameState.current.active = false;
    setGameOver(true);
    SoundEffects.playLoss();
    const finalScore = Math.floor(gameState.current.score);
    const res = await api.submitScore('DODGE_BALL', finalScore, false, user);
    if (res?.unlockedAchievements?.length > 0) setUnlockedBanner(res.unlockedAchievements[0]);
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const s = gameState.current;

    // Background
    ctx.fillStyle = '#0a0d1a';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw Coins
    s.coins.forEach(c => {
      ctx.fillStyle = '#ffd600';
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#ffd600';
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw Hazards
    s.hazards.forEach(h => {
      ctx.fillStyle = h.color;
      ctx.shadowBlur = 8;
      ctx.shadowColor = h.color;
      ctx.beginPath();
      ctx.arc(h.x, h.y, h.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw Player Orb
    ctx.fillStyle = '#00f3ff';
    ctx.shadowBlur = 12;
    ctx.shadowColor = '#00f3ff';
    ctx.beginPath();
    ctx.arc(s.player.x, s.player.y, s.player.radius, 0, Math.PI * 2);
    ctx.fill();

    // Draw Particles
    s.particles.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, 3, 3);
    });

    ctx.shadowBlur = 0;
  };

  return (
    <div className="dodge-ball-container glass-panel">
      <div className="db-header">
        <button className="btn-secondary" onClick={onLeave}>&larr; LEAVE</button>
        <div className="db-stats">
          <span>SURVIVED: <strong style={{ color: '#00ff66' }}>{survivalTime}s</strong></span>
          <span>SCORE: <strong style={{ color: '#00f3ff' }}>{score}</strong></span>
        </div>
      </div>

      {unlockedBanner && (
        <div className="achievement-toast">
          <span>🏆 UNLOCKED: <strong>{unlockedBanner.title}</strong> (+{unlockedBanner.points} pts)</span>
        </div>
      )}

      <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="dodge-canvas" />

      {gameOver && (
        <div className="finish-overlay">
          <h2 className="neon-text" style={{ color: '#ff3366' }}>ENERGY OVERLOAD!</h2>
          <p style={{ color: '#fff', fontSize: '1.2rem', marginBottom: '15px' }}>
            Survived: {survivalTime}s | Final Score: {score}
          </p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn-primary" onClick={initGame}>DODGE AGAIN</button>
            <button className="btn-secondary" onClick={onLeave}>BACK TO HUB</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DodgeBallGame;
