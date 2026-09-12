import React, { useState, useEffect, useRef } from 'react';
import SoundEffects from '../../../utils/SoundEffects';
import { api } from '../../../services/api';
import './FlappyBirdGame.css';

const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 580;

// Progressive Dynamic Difficulty Scaling System for Flappy Bird
// Speeds accelerate, pipe gaps narrow, and moving laser gates appear!
const FLAPPY_DIFFICULTY_LEVELS = [
  { level: 1, name: 'GLIDER', minScore: 0, speed: 2.3, gap: 145, interval: 112, color: '#00e676', multiplier: 1.0 },
  { level: 2, name: 'SPEEDSTER', minScore: 6, speed: 2.6, gap: 135, interval: 104, color: '#00f3ff', multiplier: 1.25 },
  { level: 3, name: 'CYBER DART', minScore: 16, speed: 2.9, gap: 125, interval: 96, color: '#ffd600', multiplier: 1.5 },
  { level: 4, name: 'OVERDRIVE', minScore: 30, speed: 3.2, gap: 115, interval: 88, color: '#ff9100', multiplier: 2.0, wobble: true },
  { level: 5, name: 'CHAOS FALCON', minScore: 50, speed: 3.5, gap: 105, interval: 80, color: '#ff0055', multiplier: 2.5, wobble: true }
];

const getFlappyDifficulty = (score) => {
  for (let i = FLAPPY_DIFFICULTY_LEVELS.length - 1; i >= 0; i--) {
    if (score >= FLAPPY_DIFFICULTY_LEVELS[i].minScore) {
      return FLAPPY_DIFFICULTY_LEVELS[i];
    }
  }
  return FLAPPY_DIFFICULTY_LEVELS[0];
};

const FlappyBirdGame = ({ user, onLeave }) => {
  const canvasRef = useRef(null);
  const [gameState, setGameState] = useState('START'); // 'START', 'PLAYING', 'GAMEOVER'
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(() => {
    return parseInt(localStorage.getItem('cyber_flappy_best') || '0', 10);
  });
  const [unlockedBanner, setUnlockedBanner] = useState(null);
  const [levelUpBanner, setLevelUpBanner] = useState(null);

  const stateRef = useRef({
    bird: {
      x: 80,
      y: 250,
      velocity: 0,
      radius: 14,
      rotation: 0
    },
    pipes: [],
    particles: [],
    score: 0,
    frames: 0,
    gameState: 'START',
    gravity: 0.38,
    jumpStrength: -6.8,
    pipeSpeed: 2.3,
    pipeSpawnInterval: 112,
    gapHeight: 145
  });

  const jump = () => {
    const s = stateRef.current;
    if (s.gameState === 'START') {
      s.gameState = 'PLAYING';
      setGameState('PLAYING');
      s.bird.velocity = s.jumpStrength;
      SoundEffects.playMove();
    } else if (s.gameState === 'PLAYING') {
      s.bird.velocity = s.jumpStrength;
      SoundEffects.playMove();

      // Emit jump engine trail particles
      for (let i = 0; i < 6; i++) {
        s.particles.push({
          x: s.bird.x - 10,
          y: s.bird.y + (Math.random() - 0.5) * 6,
          vx: -(Math.random() * 2 + 1),
          vy: (Math.random() - 0.5) * 2,
          radius: Math.random() * 3 + 1,
          color: Math.random() > 0.5 ? '#00f3ff' : '#ff007f',
          alpha: 1
        });
      }
    } else if (s.gameState === 'GAMEOVER') {
      resetGame();
    }
  };

  const resetGame = () => {
    const s = stateRef.current;
    s.bird = {
      x: 80,
      y: 250,
      velocity: 0,
      radius: 14,
      rotation: 0
    };
    s.pipes = [];
    s.particles = [];
    s.score = 0;
    s.frames = 0;
    s.gameState = 'START';
    s.pipeSpeed = 2.3;
    s.gapHeight = 145;
    s.pipeSpawnInterval = 112;
    setScore(0);
    setLevelUpBanner(null);
    setGameState('START');
  };

  const handleGameOver = async () => {
    const s = stateRef.current;
    s.gameState = 'GAMEOVER';
    setGameState('GAMEOVER');
    SoundEffects.playLoss();

    if (s.score > bestScore) {
      setBestScore(s.score);
      localStorage.setItem('cyber_flappy_best', s.score.toString());
    }

    const curDiff = getFlappyDifficulty(s.score);
    const finalPoints = Math.round(s.score * 50 * curDiff.multiplier);
    const res = await api.submitScore('FLAPPY_BIRD', finalPoints, s.score >= 10, user);
    if (res?.unlockedAchievements?.length > 0) {
      setUnlockedBanner(res.unlockedAchievements[0]);
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;

    const gameLoop = () => {
      const s = stateRef.current;
      s.frames++;

      // 1. UPDATE PHYSICS
      if (s.gameState === 'PLAYING') {
        // Gravity
        s.bird.velocity += s.gravity;
        s.bird.y += s.bird.velocity;
        s.bird.rotation = Math.min(Math.PI / 4, Math.max(-Math.PI / 4, s.bird.velocity * 0.08));

        // Floor / Ceiling Collision
        if (s.bird.y + s.bird.radius >= CANVAS_HEIGHT - 30) {
          s.bird.y = CANVAS_HEIGHT - 30 - s.bird.radius;
          handleGameOver();
        }
        if (s.bird.y - s.bird.radius <= 0) {
          s.bird.y = s.bird.radius;
          s.bird.velocity = 0;
        }

        // Spawn Pipes
        if (s.frames % s.pipeSpawnInterval === 0) {
          const curDiff = getFlappyDifficulty(s.score);
          const minPipeY = 55;
          const maxPipeY = CANVAS_HEIGHT - 30 - s.gapHeight - 55;
          const topHeight = Math.floor(Math.random() * (maxPipeY - minPipeY)) + minPipeY;
          s.pipes.push({
            x: CANVAS_WIDTH,
            topHeight: topHeight,
            bottomY: topHeight + s.gapHeight,
            width: 52,
            passed: false,
            wobble: curDiff.wobble || false
          });
        }

        // Move Pipes & Check Collision
        s.pipes.forEach(p => {
          p.x -= s.pipeSpeed;

          // Wobble laser pipes at higher levels
          if (p.wobble) {
            const dy = Math.sin((s.frames + p.x) * 0.05) * 0.7;
            p.topHeight += dy;
            p.bottomY += dy;
          }

          // Score check & progressive difficulty scaling
          if (!p.passed && p.x + p.width < s.bird.x) {
            p.passed = true;
            const prevDiff = getFlappyDifficulty(s.score);
            s.score++;
            setScore(s.score);
            SoundEffects.playClick();

            const nextDiff = getFlappyDifficulty(s.score);
            if (nextDiff.level > prevDiff.level) {
              SoundEffects.playTrophy();
              setLevelUpBanner(nextDiff);
              setTimeout(() => setLevelUpBanner(null), 3000);
            }

            s.pipeSpeed = nextDiff.speed;
            s.gapHeight = nextDiff.gap;
            s.pipeSpawnInterval = nextDiff.interval;
          }

          // Pipe Box Collision
          const bird = s.bird;
          const inX = bird.x + bird.radius > p.x && bird.x - bird.radius < p.x + p.width;
          const inTopY = bird.y - bird.radius < p.topHeight;
          const inBottomY = bird.y + bird.radius > p.bottomY;

          if (inX && (inTopY || inBottomY)) {
            handleGameOver();
          }
        });

        // Remove Offscreen Pipes
        s.pipes = s.pipes.filter(p => p.x + p.width > -20);
      } else if (s.gameState === 'START') {
        // Idle hover
        s.bird.y = 250 + Math.sin(s.frames * 0.06) * 8;
        s.bird.rotation = 0;
      }

      // Update Particles
      s.particles.forEach(pt => {
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.alpha -= 0.035;
      });
      s.particles = s.particles.filter(pt => pt.alpha > 0);

      // 2. RENDER SCENE
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Cyberpunk Sky Gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
      skyGrad.addColorStop(0, '#060814');
      skyGrad.addColorStop(0.6, '#0f172a');
      skyGrad.addColorStop(1, '#1e1b4b');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Distant City Skyline
      ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
      for (let i = 0; i < 8; i++) {
        const h = 80 + ((i * 37) % 90);
        ctx.fillRect(i * 55, CANVAS_HEIGHT - 30 - h, 45, h);
      }

      // Render Pipes
      s.pipes.forEach(p => {
        // Top Pipe
        const topGrad = ctx.createLinearGradient(p.x, 0, p.x + p.width, 0);
        topGrad.addColorStop(0, '#00e676');
        topGrad.addColorStop(1, '#00b0ff');
        ctx.fillStyle = topGrad;
        ctx.fillRect(p.x, 0, p.width, p.topHeight);

        // Pipe Lip Top
        ctx.fillStyle = '#00f3ff';
        ctx.fillRect(p.x - 3, p.topHeight - 16, p.width + 6, 16);

        // Bottom Pipe
        ctx.fillStyle = topGrad;
        ctx.fillRect(p.x, p.bottomY, p.width, CANVAS_HEIGHT - 30 - p.bottomY);

        // Pipe Lip Bottom
        ctx.fillStyle = '#00f3ff';
        ctx.fillRect(p.x - 3, p.bottomY, p.width + 6, 16);
      });

      // Render Particles
      s.particles.forEach(pt => {
        ctx.save();
        ctx.globalAlpha = pt.alpha;
        ctx.fillStyle = pt.color;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Render Ground
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, CANVAS_HEIGHT - 30, CANVAS_WIDTH, 30);
      ctx.fillStyle = '#00f3ff';
      ctx.fillRect(0, CANVAS_HEIGHT - 30, CANVAS_WIDTH, 2);

      // Render Cyber Bird
      ctx.save();
      ctx.translate(s.bird.x, s.bird.y);
      ctx.rotate(s.bird.rotation);

      // Bird Body
      ctx.fillStyle = '#ffd600';
      ctx.shadowColor = '#ffd600';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(0, 0, s.bird.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Cyber Visor Eye
      ctx.fillStyle = '#00f3ff';
      ctx.fillRect(4, -6, 8, 4);

      // Cyber Wing
      ctx.fillStyle = '#ff9100';
      ctx.beginPath();
      const wingY = Math.sin(s.frames * 0.25) * 4;
      ctx.ellipse(-4, wingY, 8, 5, -0.3, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      // UI Overlay in Playing Mode
      if (s.gameState === 'PLAYING') {
        ctx.font = '900 36px Orbitron, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#00f3ff';
        ctx.shadowBlur = 15;
        ctx.fillText(s.score.toString(), CANVAS_WIDTH / 2, 60);
        ctx.shadowBlur = 0;
      }

      animId = requestAnimationFrame(gameLoop);
    };

    animId = requestAnimationFrame(gameLoop);

    return () => cancelAnimationFrame(animId);
  }, [bestScore]);

  // Spacebar and Key handling
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        jump();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const currentDiff = getFlappyDifficulty(score);

  return (
    <div className="flappy-master-container glass-panel">
      {/* Floating Level Up Banner */}
      {levelUpBanner && (
        <div className="flappy-levelup-toast" style={{ borderColor: levelUpBanner.color }}>
          <span>⚡ LEVEL UP: <strong>{levelUpBanner.name} (L{levelUpBanner.level})</strong></span>
          <small>Pipes faster & narrower! • {levelUpBanner.multiplier}x bonus active</small>
        </div>
      )}

      <div className="flappy-top-bar">
        <button className="btn-secondary" onClick={onLeave}>&larr; HUB</button>
        <div className="flappy-diff-pill" style={{ borderColor: currentDiff.color, color: currentDiff.color }}>
          L{currentDiff.level} • {currentDiff.name} ({currentDiff.multiplier}x)
        </div>
        <div className="flappy-score-badge">BEST: {bestScore}</div>
      </div>

      {unlockedBanner && (
        <div className="achievement-toast">
          🏆 UNLOCKED: <strong>{unlockedBanner.title}</strong> (+{unlockedBanner.points} pts)
        </div>
      )}

      <div
        className="flappy-canvas-wrap"
        onClick={jump}
        onTouchStart={(e) => {
          e.preventDefault();
          jump();
        }}
      >
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="flappy-canvas"
        />

        {gameState === 'START' && (
          <div className="flappy-overlay-screen">
            <h1 className="flappy-hero-text">CYBER FLAP</h1>
            <p className="flappy-prompt-text">TAP OR PRESS SPACE TO FLY</p>
            <div className="flappy-key-hint">⚡ Dodge Neon Laser Pipes • Progressively Accelerates</div>
          </div>
        )}

        {gameState === 'GAMEOVER' && (
          <div className="flappy-overlay-screen gameover">
            <h2 className="flappy-over-title">SYSTEM CRASH</h2>
            <div className="flappy-stats-card">
              <div className="stat-row"><span>SCORE</span><strong>{score}</strong></div>
              <div className="stat-row"><span>LEVEL</span><strong style={{ color: currentDiff.color }}>{currentDiff.name}</strong></div>
              <div className="stat-row"><span>MULTIPLIER</span><strong style={{ color: '#ffd600' }}>{currentDiff.multiplier}x</strong></div>
              <div className="stat-row"><span>BEST</span><strong>{bestScore}</strong></div>
            </div>
            <button className="btn-primary flappy-restart-btn" onClick={resetGame}>
              RE-LAUNCH 🚀
            </button>
          </div>
        )}
      </div>

      <p className="flappy-footer-hint">
        Click, Tap Screen, or Press <strong>SPACEBAR / UP ARROW</strong> to flap wings.
      </p>
    </div>
  );
};

export default FlappyBirdGame;
