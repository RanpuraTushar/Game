import React, { useEffect, useRef, useState } from 'react';
import SoundEffects from '../../../utils/SoundEffects';
import { api } from '../../../services/api';
import './BrickBreakerGame.css';

const BRICK_DIFFICULTY_LEVELS = [
  { level: 1, name: 'ROOKIE', minScore: 0, speed: 4.4, paddleWidth: 86, color: '#00e676', multiplier: 1.0 },
  { level: 2, name: 'STRIKER', minScore: 120, speed: 5.2, paddleWidth: 76, color: '#00f3ff', multiplier: 1.25 },
  { level: 3, name: 'CYBER BLASTER', minScore: 300, speed: 6.0, paddleWidth: 68, color: '#ffd600', multiplier: 1.5 },
  { level: 4, name: 'OVERDRIVE', minScore: 600, speed: 6.9, paddleWidth: 60, color: '#ff9100', multiplier: 2.0 },
  { level: 5, name: 'CHAOS BUSTER', minScore: 1000, speed: 7.8, paddleWidth: 52, color: '#ff0055', multiplier: 2.5 }
];

const getBrickDifficulty = (score) => {
  for (let i = BRICK_DIFFICULTY_LEVELS.length - 1; i >= 0; i--) {
    if (score >= BRICK_DIFFICULTY_LEVELS[i].minScore) {
      return BRICK_DIFFICULTY_LEVELS[i];
    }
  }
  return BRICK_DIFFICULTY_LEVELS[0];
};

const BrickBreakerGame = ({ user, onLeave }) => {
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [unlockedBanner, setUnlockedBanner] = useState(null);
  const [levelUpBanner, setLevelUpBanner] = useState(null);

  const state = useRef({
    paddleX: 200,
    paddleWidth: 86,
    paddleHeight: 12,
    ballX: 240,
    ballY: 340,
    ballVx: 3.2,
    ballVy: -3.8,
    ballRadius: 6,
    bricks: [],
    particles: [],
    score: 0,
    lives: 3
  });

  const initBricks = () => {
    const bricks = [];
    const rows = 5;
    const cols = 8;
    const padding = 6;
    const offsetTop = 40;
    const offsetLeft = 20;
    const brickW = 50;
    const brickH = 18;
    const rowColors = ['#ff0055', '#ff9100', '#ffd600', '#00e676', '#00f3ff'];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const isArmored = r === 0; // Top row has reinforced armor
        bricks.push({
          x: offsetLeft + c * (brickW + padding),
          y: offsetTop + r * (brickH + padding),
          w: brickW,
          h: brickH,
          color: rowColors[r],
          active: true,
          hp: isArmored ? 2 : 1,
          points: (rows - r) * 15
        });
      }
    }
    state.current.bricks = bricks;
  };

  useEffect(() => {
    initBricks();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;

    const updatePaddlePosition = (clientX) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / (rect.width || 1);
      const mouseX = (clientX - rect.left) * scaleX;
      const s = state.current;
      s.paddleX = Math.max(0, Math.min(canvas.width - s.paddleWidth, mouseX - s.paddleWidth / 2));
    };

    const handleMouseMove = (e) => {
      updatePaddlePosition(e.clientX);
    };

    const handleTouchMove = (e) => {
      if (e.touches && e.touches[0]) {
        updatePaddlePosition(e.touches[0].clientX);
      }
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('touchmove', handleTouchMove, { passive: true });
    canvas.addEventListener('touchstart', handleTouchMove, { passive: true });

    const loop = () => {
      const s = state.current;
      const w = canvas.width;
      const h = canvas.height;

      // Clear Canvas
      ctx.fillStyle = '#0a0a16';
      ctx.fillRect(0, 0, w, h);

      if (!gameOver && !gameWon) {
        // Move Ball
        s.ballX += s.ballVx;
        s.ballY += s.ballVy;

        // Wall Bounce
        if (s.ballX - s.ballRadius <= 0) {
          s.ballX = s.ballRadius;
          s.ballVx = Math.abs(s.ballVx);
          SoundEffects.playClick();
        } else if (s.ballX + s.ballRadius >= w) {
          s.ballX = w - s.ballRadius;
          s.ballVx = -Math.abs(s.ballVx);
          SoundEffects.playClick();
        }
        if (s.ballY - s.ballRadius <= 0) {
          s.ballY = s.ballRadius;
          s.ballVy = Math.abs(s.ballVy);
          SoundEffects.playClick();
        }

        const curDiff = getBrickDifficulty(s.score);
        s.paddleWidth = curDiff.paddleWidth;

        // Paddle Collision
        if (s.ballY + s.ballRadius >= h - 30 && s.ballY - s.ballRadius <= h - 18) {
          if (s.ballX >= s.paddleX && s.ballX <= s.paddleX + s.paddleWidth) {
            s.ballVy = -Math.abs(s.ballVy);
            const deltaX = s.ballX - (s.paddleX + s.paddleWidth / 2);
            s.ballVx = deltaX * 0.16;

            // Re-normalize ball speed to difficulty speed
            const currentSpeed = Math.sqrt(s.ballVx * s.ballVx + s.ballVy * s.ballVy);
            if (currentSpeed > 0) {
              const targetSpeed = curDiff.speed;
              s.ballVx = (s.ballVx / currentSpeed) * targetSpeed;
              s.ballVy = (s.ballVy / currentSpeed) * targetSpeed;
            }
            SoundEffects.playTokenMove();
          }
        }

        // Brick Collision
        let activeBricks = 0;
        s.bricks.forEach(b => {
          if (!b.active) return;
          activeBricks++;

          if (s.ballX + s.ballRadius >= b.x &&
              s.ballX - s.ballRadius <= b.x + b.w &&
              s.ballY + s.ballRadius >= b.y &&
              s.ballY - s.ballRadius <= b.y + b.h) {
            
            b.hp = (b.hp || 1) - 1;
            if (b.hp <= 0) {
              b.active = false;
            } else {
              // Armored brick damaged: shift color to red cracked
              b.color = '#ff1744';
            }

            s.ballVy = -s.ballVy;
            const prevDiff = getBrickDifficulty(s.score);
            s.score += Math.round(b.points * curDiff.multiplier);
            setScore(s.score);
            SoundEffects.playSafe();

            // Check Level Up!
            const nextDiff = getBrickDifficulty(s.score);
            if (nextDiff.level > prevDiff.level) {
              SoundEffects.playTrophy();
              setLevelUpBanner(nextDiff);
              setTimeout(() => setLevelUpBanner(null), 3000);
            }

            // Spawn Particles
            for (let i = 0; i < 6; i++) {
              s.particles.push({
                x: b.x + b.w / 2,
                y: b.y + b.h / 2,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                color: b.color,
                life: 20
              });
            }
          }
        });

        // Check Victory
        if (activeBricks === 0) {
          setGameWon(true);
          SoundEffects.playWin();
          api.submitScore('BRICK_BREAKER', Math.round((s.score + 250) * curDiff.multiplier), true, user);
        }

        // Ball Lost (Bottom)
        if (s.ballY > h) {
          s.lives -= 1;
          setLives(s.lives);
          if (s.lives <= 0) {
            setGameOver(true);
            SoundEffects.playLoss();
            api.submitScore('BRICK_BREAKER', s.score, false, user);
          } else {
            // Reset Ball Position
            s.ballX = s.paddleX + s.paddleWidth / 2;
            s.ballY = 320;
            s.ballVx = curDiff.speed * 0.7 * (Math.random() > 0.5 ? 1 : -1);
            s.ballVy = -curDiff.speed * 0.7;
          }
        }
      }

      // Draw Bricks
      s.bricks.forEach(b => {
        if (!b.active) return;
        ctx.fillStyle = b.color;
        ctx.shadowColor = b.color;
        ctx.shadowBlur = b.hp > 1 ? 14 : 8;
        ctx.fillRect(b.x, b.y, b.w, b.h);
        if (b.hp > 1) {
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(b.x + 1, b.y + 1, b.w - 2, b.h - 2);
        }
        ctx.shadowBlur = 0;
      });

      // Update & Draw Particles
      for (let i = s.particles.length - 1; i >= 0; i--) {
        const p = s.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, 3, 3);
        if (p.life <= 0) s.particles.splice(i, 1);
      }

      // Draw Paddle
      ctx.fillStyle = '#00f3ff';
      ctx.shadowColor = '#00f3ff';
      ctx.shadowBlur = 12;
      ctx.fillRect(s.paddleX, h - 28, s.paddleWidth, s.paddleHeight);

      // Draw Ball
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#ffea00';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(s.ballX, s.ballY, s.ballRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      if (!gameOver && !gameWon) {
        animId = requestAnimationFrame(loop);
      }
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchstart', handleTouchMove);
    };
  }, [gameOver, gameWon]);

  const restartGame = () => {
    initBricks();
    state.current.ballX = 240;
    state.current.ballY = 320;
    state.current.ballVx = 3.2;
    state.current.ballVy = -3.8;
    state.current.score = 0;
    state.current.lives = 3;
    setScore(0);
    setLives(3);
    setGameOver(false);
    setGameWon(false);
    setLevelUpBanner(null);
  };

  const currentDiff = getBrickDifficulty(score);

  return (
    <div className="brick-container glass-panel">
      {/* Level Up Banner */}
      {levelUpBanner && (
        <div className="brick-levelup-toast" style={{ borderColor: levelUpBanner.color }}>
          <span>⚡ LEVEL UP: <strong>{levelUpBanner.name} (L{levelUpBanner.level})</strong></span>
          <small>Ball speed boosted • {levelUpBanner.multiplier}x bonus active</small>
        </div>
      )}

      <div className="brick-header">
        <button className="btn-secondary" onClick={onLeave}>&larr; LEAVE</button>
        <div className="brick-score-bar">
          <span>SCORE: <strong style={{ color: '#00f3ff' }}>{score}</strong></span>
          <span className="brick-diff-pill" style={{ borderColor: currentDiff.color, color: currentDiff.color }}>
            L{currentDiff.level} • {currentDiff.name} ({currentDiff.multiplier}x)
          </span>
          <span>LIVES: <strong style={{ color: '#ff0055' }}>{'❤️'.repeat(lives)}</strong></span>
        </div>
        <button className="btn-tertiary" onClick={restartGame}>RESET</button>
      </div>

      <div className="brick-canvas-wrap">
        <canvas ref={canvasRef} width={480} height={420} className="brick-canvas" />
      </div>
      <p className="brick-hint">💡 Move mouse horizontally across canvas • Speed & armors scale with score!</p>

      {(gameOver || gameWon) && (
        <div className="finish-overlay">
          <h2 className="neon-text" style={{ color: gameWon ? '#00ff66' : '#ff0055' }}>
            {gameWon ? '🏆 MATRIX DEMOLISHED!' : 'SYSTEM COLLAPSE'}
          </h2>
          <div className="brick-go-stats">
            <p>Level: <strong style={{ color: currentDiff.color }}>L{currentDiff.level} ({currentDiff.name})</strong></p>
            <p>Final Score: <strong style={{ color: '#00f3ff' }}>{score}</strong></p>
            <p>Score Multiplier: <strong style={{ color: '#ffd600' }}>{currentDiff.multiplier}x</strong></p>
          </div>
          <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
            <button className="btn-primary" onClick={restartGame}>PLAY AGAIN</button>
            <button className="btn-secondary" onClick={onLeave}>BACK TO HUB</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BrickBreakerGame;
