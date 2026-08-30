import React, { useRef, useEffect, useState } from 'react';
import SoundEffects from '../../../utils/SoundEffects';
import { api } from '../../../services/api';
import './CannonBlastGame.css';

const CANVAS_WIDTH = 560;
const CANVAS_HEIGHT = 320;
const GROUND_Y = 270;

const CannonBlastGame = ({ user, onLeave }) => {
  const canvasRef = useRef(null);
  const [angle, setAngle] = useState(45);
  const [power, setPower] = useState(65);
  const [score, setScore] = useState(0);
  const [shotsLeft, setShotsLeft] = useState(5);
  const [targetsDestroyed, setTargetsDestroyed] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [unlockedBanner, setUnlockedBanner] = useState(null);

  const gameState = useRef({
    cannon: { x: 40, y: GROUND_Y },
    target: { x: 420, y: GROUND_Y - 25, width: 35, height: 25 },
    projectile: null,
    trajectory: [],
    particles: [],
    wind: (Math.random() - 0.5) * 2,
    active: true
  });

  useEffect(() => {
    resetTarget();

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
      cancelAnimationFrame(animationId);
    };
  }, []);

  const resetTarget = () => {
    const s = gameState.current;
    s.target = {
      x: 320 + Math.random() * 180,
      y: GROUND_Y - 25,
      width: 35,
      height: 25
    };
    s.wind = (Math.random() - 0.5) * 2;
    s.trajectory = [];
  };

  const handleFire = () => {
    const s = gameState.current;
    if (s.projectile || shotsLeft <= 0 || gameOver) return;

    const rad = (angle * Math.PI) / 180;
    const velocity = power * 0.28;

    s.projectile = {
      x: s.cannon.x + Math.cos(rad) * 28,
      y: s.cannon.y - Math.sin(rad) * 28,
      vx: Math.cos(rad) * velocity,
      vy: -Math.sin(rad) * velocity
    };
    s.trajectory = [];

    setShotsLeft(sl => sl - 1);
    SoundEffects.playClick();
  };

  const update = () => {
    const s = gameState.current;
    if (!s.active) return;

    // Move Projectile
    const p = s.projectile;
    if (p) {
      s.trajectory.push({ x: p.x, y: p.y });
      p.x += p.vx + s.wind * 0.05;
      p.y += p.vy;
      p.vy += 0.35; // Gravity

      // Check Target Hit
      const t = s.target;
      if (p.x >= t.x && p.x <= t.x + t.width && p.y >= t.y && p.y <= t.y + t.height) {
        // Direct Hit!
        s.projectile = null;
        SoundEffects.playSafe();
        setScore(sc => sc + 200);
        setTargetsDestroyed(td => td + 1);
        setShotsLeft(sl => sl + 2); // Award bonus shots!

        // Particle sparks
        for (let i = 0; i < 20; i++) {
          s.particles.push({
            x: t.x + t.width / 2,
            y: t.y + t.height / 2,
            vx: (Math.random() - 0.5) * 6,
            vy: (Math.random() - 0.5) * 6,
            color: '#ff3d00',
            life: 30
          });
        }

        setTimeout(() => resetTarget(), 600);
      } else if (p.y >= GROUND_Y || p.x >= CANVAS_WIDTH || p.x < 0) {
        // Hit Ground or Off Screen
        s.projectile = null;
        SoundEffects.playTokenStep();

        if (shotsLeft <= 1) {
          handleGameOver();
        }
      }
    }

    // Update Particles
    s.particles.forEach(pt => {
      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.life--;
    });
    s.particles = s.particles.filter(pt => pt.life > 0);
  };

  const handleGameOver = async () => {
    gameState.current.active = false;
    setGameOver(true);
    SoundEffects.playLoss();
    const res = await api.submitScore('CANNON_BLAST', score, targetsDestroyed > 0, user);
    if (res?.unlockedAchievements?.length > 0) setUnlockedBanner(res.unlockedAchievements[0]);
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const s = gameState.current;

    // Sky Background
    ctx.fillStyle = '#060914';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Ground
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, GROUND_Y, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_Y);
    ctx.strokeStyle = '#00f3ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    ctx.lineTo(CANVAS_WIDTH, GROUND_Y);
    ctx.stroke();

    // Draw Trajectory Trace
    ctx.strokeStyle = 'rgba(0, 243, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    s.trajectory.forEach((pt, idx) => {
      if (idx === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    });
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw Target Bunker
    const t = s.target;
    ctx.fillStyle = '#ff0055';
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#ff0055';
    ctx.fillRect(t.x, t.y, t.width, t.height);

    // Draw Cannon
    const rad = (angle * Math.PI) / 180;
    ctx.strokeStyle = '#ff9100';
    ctx.shadowColor = '#ff9100';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(s.cannon.x, s.cannon.y);
    ctx.lineTo(s.cannon.x + Math.cos(rad) * 26, s.cannon.y - Math.sin(rad) * 26);
    ctx.stroke();

    // Cannon Base
    ctx.fillStyle = '#ffd600';
    ctx.beginPath();
    ctx.arc(s.cannon.x, s.cannon.y, 10, Math.PI, 0);
    ctx.fill();

    // Draw Flying Shell
    if (s.projectile) {
      ctx.fillStyle = '#ffea00';
      ctx.shadowBlur = 8;
      ctx.shadowColor = '#ffea00';
      ctx.beginPath();
      ctx.arc(s.projectile.x, s.projectile.y, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw Particles
    s.particles.forEach(pt => {
      ctx.fillStyle = pt.color;
      ctx.fillRect(pt.x, pt.y, 3, 3);
    });

    ctx.shadowBlur = 0;
  };

  const restartGame = () => {
    gameState.current.active = true;
    gameState.current.projectile = null;
    gameState.current.particles = [];
    setScore(0);
    setShotsLeft(5);
    setTargetsDestroyed(0);
    setGameOver(false);
    resetTarget();
  };

  return (
    <div className="cannon-container glass-panel">
      <div className="cannon-header">
        <button className="btn-secondary" onClick={onLeave}>&larr; LEAVE</button>
        <div className="cannon-stats">
          <span>AMMO: <strong style={{ color: shotsLeft > 1 ? '#00ff66' : '#ff0055' }}>{shotsLeft} 💣</strong></span>
          <span>BUNKERS: <strong style={{ color: '#ffea00' }}>{targetsDestroyed}</strong></span>
          <span>SCORE: <strong style={{ color: '#00f3ff' }}>{score}</strong></span>
        </div>
      </div>

      {unlockedBanner && (
        <div className="achievement-toast">
          <span>🏆 UNLOCKED: <strong>{unlockedBanner.title}</strong> (+{unlockedBanner.points} pts)</span>
        </div>
      )}

      <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="cannon-canvas" />

      {/* Sliders & Fire Controls */}
      <div className="cannon-controls-panel">
        <div className="slider-group">
          <label>ANGLE: <strong style={{ color: '#ff9100' }}>{angle}°</strong></label>
          <input
            type="range"
            min="10"
            max="85"
            value={angle}
            onChange={(e) => setAngle(Number(e.target.value))}
            className="neon-range"
          />
        </div>

        <div className="slider-group">
          <label>POWER: <strong style={{ color: '#00f3ff' }}>{power}%</strong></label>
          <input
            type="range"
            min="20"
            max="100"
            value={power}
            onChange={(e) => setPower(Number(e.target.value))}
            className="neon-range"
          />
        </div>

        <button className="btn-primary fire-artillery-btn" onClick={handleFire} disabled={shotsLeft <= 0 || gameOver}>
          🚀 FIRE CANNON
        </button>
      </div>

      {gameOver && (
        <div className="finish-overlay">
          <h2 className="neon-text" style={{ color: '#ff3366' }}>OUT OF AMMUNITION!</h2>
          <p style={{ color: '#fff', fontSize: '1.2rem', marginBottom: '15px' }}>
            Bunkers Destroyed: {targetsDestroyed} | Final Score: {score}
          </p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn-primary" onClick={restartGame}>RELOAD & FIRE</button>
            <button className="btn-secondary" onClick={onLeave}>BACK TO HUB</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CannonBlastGame;
