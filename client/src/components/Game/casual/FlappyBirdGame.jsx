import React, { useState, useEffect, useRef } from 'react';
import SoundEffects from '../../../utils/SoundEffects';
import { api } from '../../../services/api';
import './FlappyBirdGame.css';

const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 580;

const FlappyBirdGame = ({ user, onLeave }) => {
  const canvasRef = useRef(null);
  const [gameState, setGameState] = useState('START'); // 'START', 'PLAYING', 'GAMEOVER'
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(() => {
    return parseInt(localStorage.getItem('cyber_flappy_best') || '0', 10);
  });
  const [unlockedBanner, setUnlockedBanner] = useState(null);

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
    pipeSpeed: 2.4,
    pipeSpawnInterval: 105,
    gapHeight: 140
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
    setScore(0);
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

    const res = await api.submitScore('FLAPPY_BIRD', s.score * 50, s.score >= 10, user);
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
          const minPipeY = 60;
          const maxPipeY = CANVAS_HEIGHT - 30 - s.gapHeight - 60;
          const topHeight = Math.floor(Math.random() * (maxPipeY - minPipeY)) + minPipeY;
          s.pipes.push({
            x: CANVAS_WIDTH,
            topHeight: topHeight,
            bottomY: topHeight + s.gapHeight,
            width: 52,
            passed: false
          });
        }

        // Move Pipes & Check Collision
        s.pipes.forEach(p => {
          p.x -= s.pipeSpeed;

          // Score check
          if (!p.passed && p.x + p.width < s.bird.x) {
            p.passed = true;
            s.score++;
            setScore(s.score);
            SoundEffects.playClick();
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
        topGrad.addColorStop(0, '#00b0ff');
        topGrad.addColorStop(0.5, '#00e5ff');
        topGrad.addColorStop(1, '#0088cc');
        ctx.fillStyle = topGrad;
        ctx.fillRect(p.x, 0, p.width, p.topHeight);

        // Pipe Lip / Cap
        ctx.fillStyle = '#ff007f';
        ctx.fillRect(p.x - 3, p.topHeight - 16, p.width + 6, 16);
        ctx.strokeStyle = '#00f3ff';
        ctx.lineWidth = 2;
        ctx.strokeRect(p.x - 3, p.topHeight - 16, p.width + 6, 16);

        // Bottom Pipe
        ctx.fillStyle = topGrad;
        ctx.fillRect(p.x, p.bottomY, p.width, CANVAS_HEIGHT - 30 - p.bottomY);

        ctx.fillStyle = '#ff007f';
        ctx.fillRect(p.x - 3, p.bottomY, p.width + 6, 16);
        ctx.strokeRect(p.x - 3, p.bottomY, p.width + 6, 16);

        // Neon Glow accents
        ctx.fillStyle = 'rgba(0, 243, 255, 0.35)';
        ctx.fillRect(p.x + 6, 0, 4, p.topHeight - 16);
        ctx.fillRect(p.x + 6, p.bottomY + 16, 4, CANVAS_HEIGHT - 30 - p.bottomY - 16);
      });

      // Ground / Floor
      ctx.fillStyle = '#0a0a14';
      ctx.fillRect(0, CANVAS_HEIGHT - 30, CANVAS_WIDTH, 30);
      ctx.strokeStyle = '#00f3ff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, CANVAS_HEIGHT - 30);
      ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT - 30);
      ctx.stroke();

      // Moving Grid Line
      ctx.strokeStyle = 'rgba(0, 243, 255, 0.25)';
      ctx.lineWidth = 1;
      const offset = (s.frames * 2) % 24;
      for (let x = -offset; x < CANVAS_WIDTH; x += 24) {
        ctx.beginPath();
        ctx.moveTo(x, CANVAS_HEIGHT - 30);
        ctx.lineTo(x, CANVAS_HEIGHT);
        ctx.stroke();
      }

      // Render Particles
      s.particles.forEach(pt => {
        ctx.save();
        ctx.globalAlpha = Math.max(0, pt.alpha);
        ctx.fillStyle = pt.color;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Render Cyber Bird
      ctx.save();
      ctx.translate(s.bird.x, s.bird.y);
      ctx.rotate(s.bird.rotation);

      // Glowing Aura
      ctx.shadowColor = '#00f3ff';
      ctx.shadowBlur = 12;

      // Body (Sleek Cyber Drone)
      const bodyGrad = ctx.createRadialGradient(-2, -2, 2, 0, 0, 14);
      bodyGrad.addColorStop(0, '#ffffff');
      bodyGrad.addColorStop(0.6, '#00f3ff');
      bodyGrad.addColorStop(1, '#0066ff');
      ctx.fillStyle = bodyGrad;
      ctx.beginPath();
      ctx.ellipse(0, 0, 16, 12, 0, 0, Math.PI * 2);
      ctx.fill();

      // Cyber Visor
      ctx.fillStyle = '#ff007f';
      ctx.beginPath();
      ctx.ellipse(6, -2, 6, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Neon Wing
      ctx.fillStyle = '#ffd600';
      ctx.beginPath();
      const wingY = Math.sin(s.frames * 0.25) * 4;
      ctx.ellipse(-4, wingY, 8, 5, -0.3, 0, Math.PI * 2);
      ctx.fill();

      // Thruster Nozzle
      ctx.fillStyle = '#ff3366';
      ctx.fillRect(-16, -3, 4, 6);

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

  return (
    <div className="flappy-master-container glass-panel">
      <div className="flappy-top-bar">
        <button className="btn-secondary" onClick={onLeave}>&larr; HUB</button>
        <h2 className="neon-text flappy-title">CYBER FLAPPY</h2>
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
            <div className="flappy-key-hint">⚡ Dodge Neon Laser Pipes</div>
          </div>
        )}

        {gameState === 'GAMEOVER' && (
          <div className="flappy-overlay-screen gameover">
            <h2 className="flappy-over-title">SYSTEM CRASH</h2>
            <div className="flappy-stats-card">
              <div className="stat-row"><span>SCORE</span><strong>{score}</strong></div>
              <div className="stat-row"><span>BEST</span><strong>{bestScore}</strong></div>
              <div className="medal-row">
                <span>MEDAL</span>
                <strong>
                  {score >= 30 ? '💎 PLATINUM' : score >= 20 ? '🥇 GOLD' : score >= 10 ? '🥈 SILVER' : score >= 5 ? '🥉 BRONZE' : 'NONE'}
                </strong>
              </div>
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
