import React, { useEffect, useRef, useState } from 'react';
import SoundEffects from '../../../utils/SoundEffects';
import { api } from '../../../services/api';
import './FlappyBirdGame.css';

const FlappyBirdGame = ({ user, onLeave }) => {
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [unlockedBanner, setUnlockedBanner] = useState(null);

  const state = useRef({
    birdY: 200,
    birdVelocity: 0,
    gravity: 0.38,
    jump: -6.8,
    birdSize: 14,
    pipes: [],
    frame: 0,
    score: 0
  });

  const jump = () => {
    if (gameOver) return;
    if (!isPlaying) {
      setIsPlaying(true);
    }
    state.current.birdVelocity = state.current.jump;
    SoundEffects.playClick();
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        jump();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, gameOver]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;

    const loop = () => {
      const s = state.current;
      const w = canvas.width;
      const h = canvas.height;

      // Clear Screen
      ctx.fillStyle = '#0a0a1a';
      ctx.fillRect(0, 0, w, h);

      // Draw Grid Backdrop
      ctx.strokeStyle = 'rgba(0, 243, 255, 0.08)';
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 30) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
      }
      for (let y = 0; y < h; y += 30) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }

      if (isPlaying && !gameOver) {
        s.frame++;
        // Apply Gravity
        s.birdVelocity += s.gravity;
        s.birdY += s.birdVelocity;

        // Spawn Pipes
        if (s.frame % 90 === 0) {
          const gap = 110;
          const topHeight = Math.floor(Math.random() * (h - gap - 80)) + 40;
          s.pipes.push({
            x: w,
            topHeight,
            bottomY: topHeight + gap,
            passed: false
          });
        }

        // Update Pipes
        for (let i = s.pipes.length - 1; i >= 0; i--) {
          const p = s.pipes[i];
          p.x -= 2.5;

          // Check Score
          if (!p.passed && p.x < 70) {
            p.passed = true;
            s.score += 1;
            setScore(s.score);
            SoundEffects.playSafe();
          }

          // Check Collision
          if (p.x < 70 + s.birdSize && p.x + 45 > 70 - s.birdSize) {
            if (s.birdY - s.birdSize < p.topHeight || s.birdY + s.birdSize > p.bottomY) {
              handleGameOver();
            }
          }

          // Remove offscreen
          if (p.x < -60) s.pipes.splice(i, 1);
        }

        // Floor / Ceiling Collision
        if (s.birdY + s.birdSize >= h || s.birdY - s.birdSize <= 0) {
          handleGameOver();
        }
      }

      // Draw Pipes
      s.pipes.forEach(p => {
        // Top Pipe
        ctx.fillStyle = '#00e5ff';
        ctx.shadowColor = '#00e5ff';
        ctx.shadowBlur = 10;
        ctx.fillRect(p.x, 0, 45, p.topHeight);

        // Bottom Pipe
        ctx.fillRect(p.x, p.bottomY, 45, h - p.bottomY);
        ctx.shadowBlur = 0;
      });

      // Draw Cyber Bird
      ctx.fillStyle = '#ffea00';
      ctx.shadowColor = '#ffea00';
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(70, s.birdY, s.birdSize, 0, Math.PI * 2);
      ctx.fill();

      // Wing
      ctx.fillStyle = '#ff9100';
      ctx.beginPath();
      ctx.ellipse(65, s.birdY + 2, 7, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      if (!gameOver) {
        animId = requestAnimationFrame(loop);
      }
    };

    const handleGameOver = async () => {
      setGameOver(true);
      SoundEffects.playLoss();
      const currentScore = state.current.score;
      if (currentScore > highScore) setHighScore(currentScore);

      const res = await api.submitScore('FLAPPY_BIRD', currentScore, false, user);
      if (res?.unlockedAchievements?.length > 0) {
        setUnlockedBanner(res.unlockedAchievements[0]);
      }
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, gameOver, highScore]);

  const restartGame = () => {
    state.current = {
      birdY: 200,
      birdVelocity: 0,
      gravity: 0.38,
      jump: -6.8,
      birdSize: 14,
      pipes: [],
      frame: 0,
      score: 0
    };
    setScore(0);
    setGameOver(false);
    setIsPlaying(false);
  };

  return (
    <div className="flappy-container glass-panel">
      <div className="flappy-header">
        <button className="btn-secondary" onClick={onLeave}>&larr; LEAVE</button>
        <div className="flappy-score-box">
          <span>SCORE: <strong style={{ color: '#00f3ff' }}>{score}</strong></span>
          <span>BEST: <strong style={{ color: '#ffd600' }}>{highScore}</strong></span>
        </div>
        <button className="btn-tertiary" onClick={restartGame}>RESET</button>
      </div>

      {unlockedBanner && (
        <div className="achievement-toast">
          <span>🏆 UNLOCKED: <strong>{unlockedBanner.title}</strong> (+{unlockedBanner.points} pts)</span>
        </div>
      )}

      <div className="flappy-canvas-wrap" onClick={jump}>
        <canvas ref={canvasRef} width={400} height={480} className="flappy-canvas" />
        {!isPlaying && !gameOver && (
          <div className="flappy-start-overlay">
            <div className="tap-pulse">TAP / SPACE TO FLAP</div>
          </div>
        )}
      </div>

      <p className="flappy-hint">💡 Press <strong>Spacebar</strong> or click/tap anywhere on canvas to flap.</p>

      {gameOver && (
        <div className="finish-overlay">
          <h2 className="neon-text" style={{ color: '#ff0055' }}>SYSTEM CRASH!</h2>
          <p style={{ color: '#fff', fontSize: '1.4rem', marginBottom: '10px' }}>Gates Passed: {score}</p>
          <div style={{ display: 'flex', gap: '12px', marginTop: '15px' }}>
            <button className="btn-primary" onClick={restartGame}>TRY AGAIN</button>
            <button className="btn-secondary" onClick={onLeave}>BACK TO HUB</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FlappyBirdGame;
