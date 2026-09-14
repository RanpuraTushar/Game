import React, { useRef, useEffect, useState } from 'react';
import SoundEffects from '../../../utils/SoundEffects';
import { api } from '../../../services/api';
import './TankBattleGame.css';

const ARENA_WIDTH = 680;
const ARENA_HEIGHT = 440;
const TANK_SIZE = 26;
const BULLET_SPEED = 6.5;
const TANK_SPEED = 2.8;
const MAX_BOUNCES = 1;

const INITIAL_WALLS = [
  // Outer perimeter obstacles & central maze
  { x: 140, y: 80, w: 24, h: 100, destructible: true, hp: 2 },
  { x: 140, y: 260, w: 24, h: 100, destructible: true, hp: 2 },
  { x: 516, y: 80, w: 24, h: 100, destructible: true, hp: 2 },
  { x: 516, y: 260, w: 24, h: 100, destructible: true, hp: 2 },
  { x: 260, y: 140, w: 160, h: 24, destructible: false, hp: 999 },
  { x: 260, y: 276, w: 160, h: 24, destructible: false, hp: 999 },
  { x: 328, y: 180, w: 24, h: 80, destructible: true, hp: 3 }
];

const TankBattleGame = ({ user, onLeave }) => {
  const canvasRef = useRef(null);
  const [gameMode, setGameMode] = useState('TWO_PLAYER'); // 'TWO_PLAYER' or 'VS_AI'
  const [score, setScore] = useState({ p1: 0, p2: 0 });
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null);
  const [unlockedBanner, setUnlockedBanner] = useState(null);

  const stateRef = useRef({
    p1: { x: 70, y: ARENA_HEIGHT / 2, angle: 0, vx: 0, vy: 0, hp: 100, shield: false, triple: false, color: '#00f3ff' },
    p2: { x: ARENA_WIDTH - 70, y: ARENA_HEIGHT / 2, angle: Math.PI, vx: 0, vy: 0, hp: 100, shield: false, triple: false, color: '#ff007f' },
    bullets: [],
    walls: [],
    particles: [],
    powerups: [],
    keys: {},
    active: true,
    lastP1Shot: 0,
    lastP2Shot: 0
  });

  useEffect(() => {
    resetRound();
  }, [gameMode]);

  const resetRound = () => {
    const s = stateRef.current;
    s.p1 = { x: 70, y: ARENA_HEIGHT / 2, angle: 0, vx: 0, vy: 0, hp: 100, shield: false, triple: false, color: '#00f3ff' };
    s.p2 = { x: ARENA_WIDTH - 70, y: ARENA_HEIGHT / 2, angle: Math.PI, vx: 0, vy: 0, hp: 100, shield: false, triple: false, color: '#ff007f' };
    s.bullets = [];
    s.particles = [];
    s.powerups = [
      { x: ARENA_WIDTH / 2, y: 70, type: 'SHIELD', icon: '🛡️' },
      { x: ARENA_WIDTH / 2, y: ARENA_HEIGHT - 70, type: 'TRIPLE', icon: '🔥' }
    ];
    s.walls = INITIAL_WALLS.map(w => ({ ...w }));
    s.active = true;
    setGameOver(false);
  };

  // Keyboard input listeners
  useEffect(() => {
    const handleKeyDown = (e) => {
      stateRef.current.keys[e.code] = true;
      if (e.code === 'Space') {
        fireCannon('P1');
      }
      if (e.code === 'Enter' || e.code === 'NumpadEnter') {
        if (gameMode === 'TWO_PLAYER') fireCannon('P2');
      }
    };

    const handleKeyUp = (e) => {
      stateRef.current.keys[e.code] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameMode, gameOver]);

  const handleTouchKey = (code, isDown) => {
    stateRef.current.keys[code] = isDown;
  };

  const handleTouchFire = (player) => {
    fireCannon(player);
  };

  // Main 60fps Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationId;

    const loop = () => {
      update();
      render(ctx);
      if (stateRef.current.active) {
        animationId = requestAnimationFrame(loop);
      }
    };
    animationId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [gameOver, score, gameMode]);

  const fireCannon = (playerKey) => {
    const s = stateRef.current;
    const now = Date.now();
    const tank = playerKey === 'P1' ? s.p1 : s.p2;
    const lastShot = playerKey === 'P1' ? s.lastP1Shot : s.lastP2Shot;

    if (now - lastShot < 380 || gameOver) return;

    if (playerKey === 'P1') s.lastP1Shot = now;
    else s.lastP2Shot = now;

    SoundEffects.playClick();

    const spawnBullet = (ang) => {
      s.bullets.push({
        x: tank.x + Math.cos(ang) * (TANK_SIZE / 2 + 6),
        y: tank.y + Math.sin(ang) * (TANK_SIZE / 2 + 6),
        vx: Math.cos(ang) * BULLET_SPEED,
        vy: Math.sin(ang) * BULLET_SPEED,
        owner: playerKey,
        color: tank.color,
        bounces: 0
      });
    };

    spawnBullet(tank.angle);
    if (tank.triple) {
      spawnBullet(tank.angle - 0.25);
      spawnBullet(tank.angle + 0.25);
    }
  };

  const update = () => {
    const s = stateRef.current;
    if (!s.active || gameOver) return;

    // --- 1. Move Player 1 (W/A/S/D) ---
    const p1 = s.p1;
    const k = s.keys;
    if (k['KeyA']) p1.angle -= 0.06;
    if (k['KeyD']) p1.angle += 0.06;
    if (k['KeyW']) {
      p1.vx = Math.cos(p1.angle) * TANK_SPEED;
      p1.vy = Math.sin(p1.angle) * TANK_SPEED;
    } else if (k['KeyS']) {
      p1.vx = -Math.cos(p1.angle) * (TANK_SPEED * 0.6);
      p1.vy = -Math.sin(p1.angle) * (TANK_SPEED * 0.6);
    } else {
      p1.vx = 0;
      p1.vy = 0;
    }

    // --- 2. Move Player 2 (Arrows or AI) ---
    const p2 = s.p2;
    if (gameMode === 'TWO_PLAYER') {
      if (k['ArrowLeft']) p2.angle -= 0.06;
      if (k['ArrowRight']) p2.angle += 0.06;
      if (k['ArrowUp']) {
        p2.vx = Math.cos(p2.angle) * TANK_SPEED;
        p2.vy = Math.sin(p2.angle) * TANK_SPEED;
      } else if (k['ArrowDown']) {
        p2.vx = -Math.cos(p2.angle) * (TANK_SPEED * 0.6);
        p2.vy = -Math.sin(p2.angle) * (TANK_SPEED * 0.6);
      } else {
        p2.vx = 0;
        p2.vy = 0;
      }
    } else {
      // Simple AI Tank Patrol & Aim
      const dx = p1.x - p2.x;
      const dy = p1.y - p2.y;
      const targetAngle = Math.atan2(dy, dx);
      let diff = targetAngle - p2.angle;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;

      p2.angle += Math.sign(diff) * 0.04;
      p2.vx = Math.cos(p2.angle) * (TANK_SPEED * 0.75);
      p2.vy = Math.sin(p2.angle) * (TANK_SPEED * 0.75);

      if (Math.abs(diff) < 0.25 && Math.random() < 0.04) {
        fireCannon('P2');
      }
    }

    // Apply Tank Movements & Boundaries
    applyTankPosition(p1);
    applyTankPosition(p2);

    // --- 3. Update Bullets ---
    for (let i = s.bullets.length - 1; i >= 0; i--) {
      const b = s.bullets[i];
      b.x += b.vx;
      b.y += b.vy;

      let destroyed = false;

      // Arena Border Bounce
      if (b.x < 10 || b.x > ARENA_WIDTH - 10) {
        b.vx = -b.vx;
        b.bounces++;
      }
      if (b.y < 10 || b.y > ARENA_HEIGHT - 10) {
        b.vy = -b.vy;
        b.bounces++;
      }

      if (b.bounces > MAX_BOUNCES) {
        destroyed = true;
      }

      // Wall Collisions
      s.walls.forEach(w => {
        if (b.x >= w.x && b.x <= w.x + w.w && b.y >= w.y && b.y <= w.y + w.h) {
          destroyed = true;
          if (w.destructible) {
            w.hp--;
            spawnSparks(b.x, b.y, '#ffd600');
          }
        }
      });

      // Tank Hit Checks
      const targetTank = b.owner === 'P1' ? p2 : p1;
      const dist = Math.hypot(b.x - targetTank.x, b.y - targetTank.y);

      if (dist < TANK_SIZE / 2 + 4) {
        destroyed = true;
        spawnExplosion(targetTank.x, targetTank.y, targetTank.color);
        SoundEffects.playLoss();

        if (targetTank.shield) {
          targetTank.shield = false; // break shield
        } else {
          targetTank.hp -= 35;
          if (targetTank.hp <= 0) {
            handleRoundEnd(b.owner === 'P1' ? 'PLAYER 1' : (gameMode === 'VS_AI' ? 'AI TANK' : 'PLAYER 2'));
            return;
          }
        }
      }

      if (destroyed) {
        s.bullets.splice(i, 1);
      }
    }

    // Clean up destroyed walls
    s.walls = s.walls.filter(w => w.hp > 0);

    // --- 4. Powerup Pickups ---
    s.powerups.forEach((pw, idx) => {
      [p1, p2].forEach(t => {
        if (Math.hypot(t.x - pw.x, t.y - pw.y) < TANK_SIZE / 2 + 12) {
          SoundEffects.playSafe();
          if (pw.type === 'SHIELD') t.shield = true;
          if (pw.type === 'TRIPLE') t.triple = true;
          s.powerups.splice(idx, 1);
        }
      });
    });

    // --- 5. Update Particles ---
    s.particles.forEach(pt => {
      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.life--;
    });
    s.particles = s.particles.filter(pt => pt.life > 0);
  };

  const applyTankPosition = (tank) => {
    const s = stateRef.current;
    const nextX = tank.x + tank.vx;
    const nextY = tank.y + tank.vy;

    // Check Wall Collisions
    let collides = false;
    s.walls.forEach(w => {
      if (nextX + TANK_SIZE / 2 > w.x && nextX - TANK_SIZE / 2 < w.x + w.w &&
          nextY + TANK_SIZE / 2 > w.y && nextY - TANK_SIZE / 2 < w.y + w.h) {
        collides = true;
      }
    });

    if (!collides) {
      tank.x = Math.max(TANK_SIZE, Math.min(ARENA_WIDTH - TANK_SIZE, nextX));
      tank.y = Math.max(TANK_SIZE, Math.min(ARENA_HEIGHT - TANK_SIZE, nextY));
    }
  };

  const spawnSparks = (x, y, color) => {
    for (let i = 0; i < 8; i++) {
      stateRef.current.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 5,
        vy: (Math.random() - 0.5) * 5,
        color,
        life: 14
      });
    }
  };

  const spawnExplosion = (x, y, color) => {
    for (let i = 0; i < 25; i++) {
      stateRef.current.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        color: i % 2 === 0 ? color : '#ffd600',
        life: 25
      });
    }
  };

  const handleRoundEnd = async (roundWinner) => {
    const s = stateRef.current;
    s.active = false;
    SoundEffects.playWin();

    const nextScore = {
      p1: roundWinner === 'PLAYER 1' ? score.p1 + 1 : score.p1,
      p2: roundWinner !== 'PLAYER 1' ? score.p2 + 1 : score.p2
    };
    setScore(nextScore);

    if (nextScore.p1 >= 5 || nextScore.p2 >= 5) {
      setGameOver(true);
      setWinner(nextScore.p1 >= 5 ? 'PLAYER 1' : (gameMode === 'VS_AI' ? 'AI TANK' : 'PLAYER 2'));
      const res = await api.submitScore('TANK_BATTLE', 500, nextScore.p1 >= 5, user);
      if (res?.unlockedAchievements?.length > 0) setUnlockedBanner(res.unlockedAchievements[0]);
    } else {
      setTimeout(() => resetRound(), 1200);
    }
  };

  const render = (ctx) => {
    ctx.clearRect(0, 0, ARENA_WIDTH, ARENA_HEIGHT);
    const s = stateRef.current;

    // Arena Background & Grid
    ctx.fillStyle = '#060814';
    ctx.fillRect(0, 0, ARENA_WIDTH, ARENA_HEIGHT);

    // Neon Perimeter
    ctx.strokeStyle = 'rgba(0, 243, 255, 0.35)';
    ctx.lineWidth = 3;
    ctx.strokeRect(4, 4, ARENA_WIDTH - 8, ARENA_HEIGHT - 8);

    // Walls
    s.walls.forEach(w => {
      ctx.fillStyle = w.destructible ? '#ff9100' : '#1e293b';
      ctx.strokeStyle = w.destructible ? '#ffea00' : 'rgba(0, 243, 255, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.fillRect(w.x, w.y, w.w, w.h);
      ctx.strokeRect(w.x, w.y, w.w, w.h);
    });

    // Powerups
    s.powerups.forEach(pw => {
      ctx.fillStyle = '#00f3ff';
      ctx.font = '16px sans-serif';
      ctx.fillText(pw.icon, pw.x - 8, pw.y + 6);
    });

    // Particles
    s.particles.forEach(pt => {
      ctx.fillStyle = pt.color;
      ctx.fillRect(pt.x, pt.y, 3, 3);
    });

    // Draw Tanks
    drawTank(ctx, s.p1);
    drawTank(ctx, s.p2);

    // Draw Bullets
    s.bullets.forEach(b => {
      ctx.fillStyle = b.color;
      ctx.shadowColor = b.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    });
  };

  const drawTank = (ctx, tank) => {
    ctx.save();
    ctx.translate(tank.x, tank.y);
    ctx.rotate(tank.angle);

    // Shield Aura
    if (tank.shield) {
      ctx.strokeStyle = '#00ff66';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, TANK_SIZE * 0.9, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Tank Body
    ctx.fillStyle = tank.color;
    ctx.shadowColor = tank.color;
    ctx.shadowBlur = 10;
    ctx.fillRect(-TANK_SIZE / 2, -TANK_SIZE / 2, TANK_SIZE, TANK_SIZE);

    // Tank Tracks
    ctx.fillStyle = '#111528';
    ctx.fillRect(-TANK_SIZE / 2 - 2, -TANK_SIZE / 2 - 3, TANK_SIZE + 4, 4);
    ctx.fillRect(-TANK_SIZE / 2 - 2, TANK_SIZE / 2 - 1, TANK_SIZE + 4, 4);

    // Cannon Turret
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, -3, TANK_SIZE / 2 + 8, 6);
    ctx.beginPath();
    ctx.arc(0, 0, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  };

  return (
    <div className="tank-container glass-panel">
      {/* Top Header */}
      <div className="tank-header">
        <button className="btn-secondary" onClick={onLeave}>&larr; HUB</button>
        
        {/* Mode Selector */}
        <div className="game-mode-toggle-group">
          <button 
            className={`mode-pill-btn ${gameMode === 'TWO_PLAYER' ? 'active' : ''}`}
            onClick={() => { setGameMode('TWO_PLAYER'); setScore({ p1: 0, p2: 0 }); }}
          >
            👥 2-PLAYER DUEL
          </button>
          <button 
            className={`mode-pill-btn ${gameMode === 'VS_AI' ? 'active' : ''}`}
            onClick={() => { setGameMode('VS_AI'); setScore({ p1: 0, p2: 0 }); }}
          >
            🤖 VS AI TANK
          </button>
        </div>

        <button className="btn-tertiary" onClick={resetRound}>↺ RESTART</button>
      </div>

      {/* Score & Health Bar */}
      <div className="tank-status-bar">
        <div className="tank-player-score p1">
          <span>P1 (CYAN): <strong>{score.p1} WINS</strong></span>
          <div className="tank-hp-bar">
            <div className="tank-hp-fill p1" style={{ width: `${stateRef.current.p1.hp}%` }} />
          </div>
        </div>

        <div className="tank-target-badge">FIRST TO 5 WINS</div>

        <div className="tank-player-score p2">
          <span>{gameMode === 'VS_AI' ? 'AI TANK: ' : 'P2 (PINK): '}<strong>{score.p2} WINS</strong></span>
          <div className="tank-hp-bar">
            <div className="tank-hp-fill p2" style={{ width: `${stateRef.current.p2.hp}%` }} />
          </div>
        </div>
      </div>

      {unlockedBanner && (
        <div className="achievement-toast">
          <span>🏆 UNLOCKED: <strong>{unlockedBanner.title}</strong> (+{unlockedBanner.points} pts)</span>
        </div>
      )}

      {/* 2D Arena Canvas */}
      <div className="tank-canvas-wrap">
        <canvas ref={canvasRef} width={ARENA_WIDTH} height={ARENA_HEIGHT} className="tank-canvas" />
      </div>



      {/* Controls Reference */}
      <div className="tank-controls-legend">
        <div>🔵 <strong>P1:</strong> W/A/S/D to Drive &bull; <strong style={{ color: '#00f3ff' }}>SPACE</strong> to Fire</div>
        <div>🔴 <strong>P2:</strong> Arrow Keys to Drive &bull; <strong style={{ color: '#ff007f' }}>ENTER</strong> to Fire</div>
      </div>

      {gameOver && (
        <div className="finish-overlay">
          <h2 className="neon-text" style={{ color: winner === 'PLAYER 1' ? '#00ff66' : '#ff0055' }}>
            🏆 {winner} WON THE TANK WAR!
          </h2>
          <p style={{ color: '#fff', fontSize: '1.2rem', margin: '10px 0 20px 0' }}>
            Final Score: {score.p1} - {score.p2}
          </p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn-primary" onClick={() => { setScore({ p1: 0, p2: 0 }); resetRound(); }}>
              PLAY AGAIN
            </button>
            <button className="btn-secondary" onClick={onLeave}>BACK TO HUB</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TankBattleGame;
