import React, { useRef, useEffect, useState } from 'react';
import SoundEffects from '../../../utils/SoundEffects';
import { api } from '../../../services/api';
import './AsteroidsGame.css';

const CANVAS_WIDTH = 540;
const CANVAS_HEIGHT = 480;

const AsteroidsGame = ({ user, onLeave }) => {
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameOver, setGameOver] = useState(false);
  const [unlockedBanner, setUnlockedBanner] = useState(null);

  const gameState = useRef({
    ship: {
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT / 2,
      angle: -Math.PI / 2,
      vx: 0,
      vy: 0,
      radius: 13,
      invulnerableUntil: Date.now() + 2500
    },
    lasers: [],
    asteroids: [],
    particles: [],
    stars: [],
    keys: { left: false, right: false, up: false },
    mouseAim: true,
    lastShotTime: 0,
    active: true
  });

  useEffect(() => {
    initStars();
    initAsteroids(4);

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Mouse Aim: Ship points toward cursor
    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const s = gameState.current;
      s.ship.angle = Math.atan2(mouseY - s.ship.y, mouseX - s.ship.x);
    };

    const handleMouseDown = (e) => {
      if (e.button === 0) {
        // Left Click: Fire Laser
        fireLaser();
      } else if (e.button === 2) {
        // Right Click: Thrust
        e.preventDefault();
        gameState.current.keys.up = true;
      }
    };

    const handleMouseUp = (e) => {
      if (e.button === 2) {
        gameState.current.keys.up = false;
      }
    };

    const handleContextMenu = (e) => e.preventDefault();

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('contextmenu', handleContextMenu);

    // Keyboard Controls
    const handleKeyDown = (e) => {
      if (['ArrowLeft', 'KeyA'].includes(e.code)) gameState.current.keys.left = true;
      if (['ArrowRight', 'KeyD'].includes(e.code)) gameState.current.keys.right = true;
      if (['ArrowUp', 'KeyW'].includes(e.code)) gameState.current.keys.up = true;
      if (e.code === 'Space') {
        e.preventDefault();
        fireLaser();
      }
    };

    const handleKeyUp = (e) => {
      if (['ArrowLeft', 'KeyA'].includes(e.code)) gameState.current.keys.left = false;
      if (['ArrowRight', 'KeyD'].includes(e.code)) gameState.current.keys.right = false;
      if (['ArrowUp', 'KeyW'].includes(e.code)) gameState.current.keys.up = false;
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
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      cancelAnimationFrame(animationId);
    };
  }, []);

  const initStars = () => {
    const stars = [];
    for (let i = 0; i < 40; i++) {
      stars.push({
        x: Math.random() * CANVAS_WIDTH,
        y: Math.random() * CANVAS_HEIGHT,
        size: Math.random() * 1.8 + 0.5,
        alpha: Math.random() * 0.7 + 0.3
      });
    }
    gameState.current.stars = stars;
  };

  const initAsteroids = (count) => {
    const asts = [];
    for (let i = 0; i < count; i++) {
      let x, y;
      do {
        x = Math.random() * CANVAS_WIDTH;
        y = Math.random() * CANVAS_HEIGHT;
      } while (Math.hypot(x - CANVAS_WIDTH / 2, y - CANVAS_HEIGHT / 2) < 120);

      const speed = 0.8 + Math.random() * 1.2;
      const angle = Math.random() * Math.PI * 2;

      asts.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 32,
        tier: 3,
        rotation: 0,
        rotSpeed: (Math.random() - 0.5) * 0.03,
        points: generateAsteroidPoints(32)
      });
    }
    gameState.current.asteroids = asts;
  };

  const generateAsteroidPoints = (r) => {
    const numPoints = 8 + Math.floor(Math.random() * 4);
    const pts = [];
    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * Math.PI * 2;
      const dist = r * (0.75 + Math.random() * 0.45);
      pts.push({ x: Math.cos(angle) * dist, y: Math.sin(angle) * dist });
    }
    return pts;
  };

  const fireLaser = () => {
    const s = gameState.current;
    const now = Date.now();
    if (now - s.lastShotTime > 180 && !gameOver) {
      const angle = s.ship.angle;
      s.lasers.push({
        x: s.ship.x + Math.cos(angle) * 18,
        y: s.ship.y + Math.sin(angle) * 18,
        vx: Math.cos(angle) * 8.5 + s.ship.vx * 0.25,
        vy: Math.sin(angle) * 8.5 + s.ship.vy * 0.25,
        life: 50
      });
      s.lastShotTime = now;
      SoundEffects.playClick();
    }
  };

  const update = () => {
    const s = gameState.current;
    if (!s.active) return;

    // 1. Keyboard Rotation
    if (s.keys.left) s.ship.angle -= 0.07;
    if (s.keys.right) s.ship.angle += 0.07;

    // 2. Thrust Movement
    if (s.keys.up) {
      s.ship.vx += Math.cos(s.ship.angle) * 0.22;
      s.ship.vy += Math.sin(s.ship.angle) * 0.22;

      // Exhaust particles
      if (Math.random() < 0.6) {
        const backAngle = s.ship.angle + Math.PI + (Math.random() - 0.5) * 0.5;
        s.particles.push({
          x: s.ship.x + Math.cos(backAngle) * 12,
          y: s.ship.y + Math.sin(backAngle) * 12,
          vx: Math.cos(backAngle) * 3 + (Math.random() - 0.5) * 1.5,
          vy: Math.sin(backAngle) * 3 + (Math.random() - 0.5) * 1.5,
          color: Math.random() < 0.5 ? '#ff9100' : '#ffd600',
          life: 18
        });
      }
    }

    // Velocity Clamping & Inertia Drag
    const currentSpeed = Math.hypot(s.ship.vx, s.ship.vy);
    if (currentSpeed > 7) {
      s.ship.vx = (s.ship.vx / currentSpeed) * 7;
      s.ship.vy = (s.ship.vy / currentSpeed) * 7;
    }
    s.ship.vx *= 0.985;
    s.ship.vy *= 0.985;

    // Screen Wrap for Ship
    s.ship.x = (s.ship.x + s.ship.vx + CANVAS_WIDTH) % CANVAS_WIDTH;
    s.ship.y = (s.ship.y + s.ship.vy + CANVAS_HEIGHT) % CANVAS_HEIGHT;

    // 3. Move Lasers
    s.lasers.forEach(l => {
      l.x = (l.x + l.vx + CANVAS_WIDTH) % CANVAS_WIDTH;
      l.y = (l.y + l.vy + CANVAS_HEIGHT) % CANVAS_HEIGHT;
      l.life--;
    });
    s.lasers = s.lasers.filter(l => l.life > 0);

    // 4. Move Asteroids
    s.asteroids.forEach(a => {
      a.x = (a.x + a.vx + CANVAS_WIDTH) % CANVAS_WIDTH;
      a.y = (a.y + a.vy + CANVAS_HEIGHT) % CANVAS_HEIGHT;
      a.rotation += a.rotSpeed;
    });

    // 5. Laser <-> Asteroid Collision
    const newAsteroids = [];
    s.lasers.forEach(l => {
      s.asteroids.forEach(a => {
        if (a.radius > 0 && Math.hypot(l.x - a.x, l.y - a.y) < a.radius) {
          l.life = 0;
          a.radius = 0; // Mark destroyed
          SoundEffects.playTokenStep();
          setScore(sc => sc + (4 - a.tier) * 30);

          // Particle blast
          for (let p = 0; p < 12; p++) {
            s.particles.push({
              x: a.x,
              y: a.y,
              vx: (Math.random() - 0.5) * 5,
              vy: (Math.random() - 0.5) * 5,
              color: '#e040fb',
              life: 25
            });
          }

          // Split into 2 smaller asteroids
          if (a.tier > 1) {
            const nextTier = a.tier - 1;
            const nextR = a.tier === 3 ? 20 : 12;
            for (let k = 0; k < 2; k++) {
              const splitAngle = Math.random() * Math.PI * 2;
              const splitSpeed = 1.2 + Math.random() * 1.5;
              newAsteroids.push({
                x: a.x,
                y: a.y,
                vx: Math.cos(splitAngle) * splitSpeed,
                vy: Math.sin(splitAngle) * splitSpeed,
                radius: nextR,
                tier: nextTier,
                rotation: 0,
                rotSpeed: (Math.random() - 0.5) * 0.05,
                points: generateAsteroidPoints(nextR)
              });
            }
          }
        }
      });
    });

    s.asteroids = s.asteroids.filter(a => a.radius > 0).concat(newAsteroids);

    // If wave cleared, spawn next asteroid wave
    if (s.asteroids.length === 0) {
      initAsteroids(5);
      SoundEffects.playSafe();
    }

    // 6. Ship <-> Asteroid Collision (with Invulnerability Grace Period)
    const isInvulnerable = Date.now() < s.ship.invulnerableUntil;
    if (!isInvulnerable) {
      s.asteroids.forEach(a => {
        if (Math.hypot(s.ship.x - a.x, s.ship.y - a.y) < a.radius + s.ship.radius) {
          // Crash!
          SoundEffects.playLoss();
          s.ship.x = CANVAS_WIDTH / 2;
          s.ship.y = CANVAS_HEIGHT / 2;
          s.ship.vx = 0;
          s.ship.vy = 0;
          s.ship.invulnerableUntil = Date.now() + 2500;

          // Death explosion particles
          for (let p = 0; p < 20; p++) {
            s.particles.push({
              x: s.ship.x,
              y: s.ship.y,
              vx: (Math.random() - 0.5) * 6,
              vy: (Math.random() - 0.5) * 6,
              color: '#00f3ff',
              life: 30
            });
          }

          setLives(l => {
            const nextLives = l - 1;
            if (nextLives <= 0) handleGameOver();
            return nextLives;
          });
        }
      });
    }

    // 7. Update Particles
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
    const res = await api.submitScore('ASTEROIDS', score, false, user);
    if (res?.unlockedAchievements?.length > 0) setUnlockedBanner(res.unlockedAchievements[0]);
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const s = gameState.current;

    // Deep Space Background
    ctx.fillStyle = '#050711';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Starfield
    s.stars.forEach(star => {
      ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha})`;
      ctx.fillRect(star.x, star.y, star.size, star.size);
    });

    // Draw Asteroids
    ctx.strokeStyle = '#e040fb';
    ctx.shadowColor = '#e040fb';
    ctx.shadowBlur = 10;
    ctx.lineWidth = 2;
    s.asteroids.forEach(a => {
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.rotate(a.rotation);
      ctx.beginPath();
      a.points.forEach((pt, idx) => {
        if (idx === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      });
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
    });

    // Draw Lasers
    ctx.fillStyle = '#00ff66';
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#00ff66';
    s.lasers.forEach(l => {
      ctx.beginPath();
      ctx.arc(l.x, l.y, 3, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw Spaceship
    const isInvuln = Date.now() < s.ship.invulnerableUntil;
    const showShip = !isInvuln || Math.floor(Date.now() / 120) % 2 === 0;

    if (showShip) {
      ctx.save();
      ctx.translate(s.ship.x, s.ship.y);
      ctx.rotate(s.ship.angle);

      // Invulnerability Energy Shield
      if (isInvuln) {
        ctx.strokeStyle = 'rgba(0, 243, 255, 0.7)';
        ctx.shadowColor = '#00f3ff';
        ctx.shadowBlur = 12;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, s.ship.radius + 6, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Ship Hull (Neon Cyan Vector)
      ctx.strokeStyle = '#00f3ff';
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#00f3ff';
      ctx.lineWidth = 2.5;

      ctx.beginPath();
      ctx.moveTo(16, 0);       // Nose
      ctx.lineTo(-12, -10);    // Left Wing
      ctx.lineTo(-7, 0);       // Engine Inset
      ctx.lineTo(-12, 10);     // Right Wing
      ctx.closePath();
      ctx.stroke();

      // Thruster Flame
      if (s.keys.up) {
        ctx.strokeStyle = '#ff9100';
        ctx.shadowColor = '#ff9100';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-7, 0);
        ctx.lineTo(-16 - Math.random() * 8, (Math.random() - 0.5) * 4);
        ctx.stroke();
      }
      ctx.restore();
    }

    // Draw Particles
    s.particles.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, 2.5, 2.5);
    });

    ctx.shadowBlur = 0;
  };

  const restartGame = () => {
    gameState.current.ship = {
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT / 2,
      angle: -Math.PI / 2,
      vx: 0,
      vy: 0,
      radius: 13,
      invulnerableUntil: Date.now() + 2500
    };
    gameState.current.lasers = [];
    gameState.current.particles = [];
    gameState.current.active = true;
    setScore(0);
    setLives(3);
    setGameOver(false);
    initAsteroids(4);
  };

  return (
    <div className="asteroids-container glass-panel">
      <div className="ast-header">
        <button className="btn-secondary" onClick={onLeave}>&larr; LEAVE</button>
        <div className="ast-stats">
          <span>SCORE: <strong style={{ color: '#00f3ff' }}>{score}</strong></span>
          <span>LIVES: <strong style={{ color: '#ff0055' }}>{'🚀'.repeat(lives)}</strong></span>
        </div>
      </div>

      {unlockedBanner && (
        <div className="achievement-toast">
          <span>🏆 UNLOCKED: <strong>{unlockedBanner.title}</strong> (+{unlockedBanner.points} pts)</span>
        </div>
      )}

      {/* Main Canvas Arena */}
      <canvas 
        ref={canvasRef} 
        width={CANVAS_WIDTH} 
        height={CANVAS_HEIGHT} 
        className="ast-canvas"
      />

      {/* Control Legend Guide HUD */}
      <div className="ast-controls-hud">
        <div className="hud-pill">🎯 <strong>Mouse:</strong> Move to Aim & Left-Click to Shoot</div>
        <div className="hud-pill">🚀 <strong>W / Up / Right-Click:</strong> Forward Thrust</div>
        <div className="hud-pill">🔄 <strong>A / D:</strong> Rotate</div>
      </div>

      {/* Interactive Mobile & Touch Buttons */}
      <div className="ast-mobile-controls">
        <button 
          className="ast-btn"
          onPointerDown={() => { gameState.current.keys.left = true; }}
          onPointerUp={() => { gameState.current.keys.left = false; }}
          onPointerLeave={() => { gameState.current.keys.left = false; }}
        >
          ↺ LEFT
        </button>
        <button 
          className="ast-btn thrust-btn"
          onPointerDown={() => { gameState.current.keys.up = true; }}
          onPointerUp={() => { gameState.current.keys.up = false; }}
          onPointerLeave={() => { gameState.current.keys.up = false; }}
        >
          ▲ THRUST
        </button>
        <button 
          className="ast-btn fire-btn"
          onClick={fireLaser}
        >
          ⚡ FIRE
        </button>
        <button 
          className="ast-btn"
          onPointerDown={() => { gameState.current.keys.right = true; }}
          onPointerUp={() => { gameState.current.keys.right = false; }}
          onPointerLeave={() => { gameState.current.keys.right = false; }}
        >
          ↻ RIGHT
        </button>
      </div>

      {gameOver && (
        <div className="finish-overlay">
          <h2 className="neon-text" style={{ color: '#ff3366' }}>VESSEL DESTROYED</h2>
          <p style={{ color: '#fff', fontSize: '1.2rem', marginBottom: '15px' }}>
            Final Score: {score}
          </p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn-primary" onClick={restartGame}>RETRY MISSION</button>
            <button className="btn-secondary" onClick={onLeave}>BACK TO HUB</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AsteroidsGame;
