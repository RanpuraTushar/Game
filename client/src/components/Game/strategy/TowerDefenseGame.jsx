import React, { useRef, useEffect, useState } from 'react';
import SoundEffects from '../../../utils/SoundEffects';
import { api } from '../../../services/api';
import './TowerDefenseGame.css';

const CANVAS_WIDTH = 540;
const CANVAS_HEIGHT = 380;

// Path Waypoints
const PATH = [
  { x: 0, y: 80 },
  { x: 160, y: 80 },
  { x: 160, y: 280 },
  { x: 360, y: 280 },
  { x: 360, y: 120 },
  { x: 540, y: 120 }
];

const TURRET_TYPES = {
  LASER: { name: 'Laser Turret', cost: 100, range: 95, damage: 1.5, color: '#00f3ff', icon: '🔫' },
  PLASMA: { name: 'Plasma Cannon', cost: 220, range: 125, damage: 4.5, color: '#e040fb', icon: '💥' }
};

const TowerDefenseGame = ({ user, onLeave }) => {
  const canvasRef = useRef(null);
  const [credits, setCredits] = useState(250);
  const [baseHp, setBaseHp] = useState(20);
  const [wave, setWave] = useState(1);
  const [score, setScore] = useState(0);
  const [selectedTurretType, setSelectedTurretType] = useState('LASER');
  const [gameOver, setGameOver] = useState(false);
  const [unlockedBanner, setUnlockedBanner] = useState(null);

  const gameState = useRef({
    turrets: [],
    creeps: [],
    projectiles: [],
    wave: 1,
    active: true,
    lastSpawnTime: 0,
    spawnCount: 0,
    spawnsPerWave: 8
  });

  useEffect(() => {
    startWave(1);

    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleCanvasClick = (e) => {
      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;
      placeTurret(clickX, clickY);
    };

    canvas.addEventListener('click', handleCanvasClick);

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
      canvas.removeEventListener('click', handleCanvasClick);
      cancelAnimationFrame(animationId);
    };
  }, [selectedTurretType, credits]);

  const startWave = (w) => {
    const s = gameState.current;
    s.wave = w;
    s.spawnCount = 0;
    s.spawnsPerWave = 6 + w * 3;
    s.lastSpawnTime = Date.now();
  };

  const placeTurret = (x, y) => {
    const cfg = TURRET_TYPES[selectedTurretType];
    if (credits < cfg.cost || gameOver) return;

    // Check distance from path (Cannot place directly on the road)
    const onPath = PATH.some((pt, idx) => {
      if (idx === PATH.length - 1) return false;
      const next = PATH[idx + 1];
      const minX = Math.min(pt.x, next.x) - 25;
      const maxX = Math.max(pt.x, next.x) + 25;
      const minY = Math.min(pt.y, next.y) - 25;
      const maxY = Math.max(pt.y, next.y) + 25;
      return x >= minX && x <= maxX && y >= minY && y <= maxY;
    });

    if (onPath) return;

    // Check collision with other turrets
    const s = gameState.current;
    const overlap = s.turrets.some(t => Math.hypot(t.x - x, t.y - y) < 32);
    if (overlap) return;

    s.turrets.push({
      x,
      y,
      type: selectedTurretType,
      range: cfg.range,
      damage: cfg.damage,
      color: cfg.color,
      lastFireTime: 0
    });

    setCredits(c => c - cfg.cost);
    SoundEffects.playSafe();
  };

  const update = () => {
    const s = gameState.current;
    if (!s.active) return;

    const now = Date.now();

    // 1. Spawn Creeps
    if (s.spawnCount < s.spawnsPerWave && now - s.lastSpawnTime > 1200) {
      const isBoss = (s.spawnCount + 1) === s.spawnsPerWave && s.wave % 3 === 0;
      s.creeps.push({
        x: PATH[0].x,
        y: PATH[0].y,
        pathIdx: 0,
        hp: isBoss ? 60 * s.wave : 12 * s.wave,
        maxHp: isBoss ? 60 * s.wave : 12 * s.wave,
        speed: isBoss ? 0.8 : 1.5,
        isBoss,
        radius: isBoss ? 16 : 10,
        reward: isBoss ? 50 : 15
      });
      s.spawnCount++;
      s.lastSpawnTime = now;
    }

    // 2. Move Creeps
    s.creeps.forEach(c => {
      const target = PATH[c.pathIdx + 1];
      if (target) {
        const dx = target.x - c.x;
        const dy = target.y - c.y;
        const dist = Math.hypot(dx, dy);

        if (dist < c.speed) {
          c.x = target.x;
          c.y = target.y;
          c.pathIdx++;
        } else {
          c.x += (dx / dist) * c.speed;
          c.y += (dy / dist) * c.speed;
        }
      } else {
        // Reached End of Path (Damage Core)
        c.hp = 0;
        setBaseHp(prev => {
          const nextHp = prev - (c.isBoss ? 5 : 1);
          if (nextHp <= 0) handleGameOver();
          return Math.max(0, nextHp);
        });
        SoundEffects.playLoss();
      }
    });

    // 3. Turrets Target & Fire
    s.turrets.forEach(t => {
      if (now - t.lastFireTime > 400) {
        // Find closest creep in range
        const inRange = s.creeps.filter(c => c.hp > 0 && Math.hypot(c.x - t.x, c.y - t.y) <= t.range);
        if (inRange.length > 0) {
          const target = inRange[0];
          target.hp -= t.damage;
          t.lastFireTime = now;

          s.projectiles.push({
            x1: t.x,
            y1: t.y,
            x2: target.x,
            y2: target.y,
            color: t.color,
            life: 6
          });

          if (target.hp <= 0) {
            setCredits(cr => cr + target.reward);
            setScore(sc => sc + target.reward * 10);
            SoundEffects.playTokenStep();
          }
        }
      }
    });

    // 4. Clean Dead Creeps
    s.creeps = s.creeps.filter(c => c.hp > 0);

    // 5. Check Wave Cleared
    if (s.spawnCount >= s.spawnsPerWave && s.creeps.length === 0) {
      SoundEffects.playWin();
      setWave(w => {
        const nextW = w + 1;
        startWave(nextW);
        return nextW;
      });
      setCredits(cr => cr + 80);
    }

    // 6. Update Projectiles
    s.projectiles.forEach(p => { p.life--; });
    s.projectiles = s.projectiles.filter(p => p.life > 0);
  };

  const handleGameOver = async () => {
    gameState.current.active = false;
    setGameOver(true);
    SoundEffects.playLoss();
    const res = await api.submitScore('TOWER_DEFENSE', score, false, user);
    if (res?.unlockedAchievements?.length > 0) setUnlockedBanner(res.unlockedAchievements[0]);
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const s = gameState.current;

    // Background
    ctx.fillStyle = '#0a0f1d';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw Pathway
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 36;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    PATH.forEach((pt, idx) => {
      if (idx === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    });
    ctx.stroke();

    // Pathway Center Line
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw Turrets
    s.turrets.forEach(t => {
      ctx.fillStyle = t.color;
      ctx.shadowBlur = 8;
      ctx.shadowColor = t.color;
      ctx.beginPath();
      ctx.arc(t.x, t.y, 14, 0, Math.PI * 2);
      ctx.fill();

      // Range indicator
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(t.x, t.y, t.range, 0, Math.PI * 2);
      ctx.stroke();
    });

    // Draw Laser Projectiles
    s.projectiles.forEach(p => {
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 3;
      ctx.shadowBlur = 6;
      ctx.shadowColor = p.color;
      ctx.beginPath();
      ctx.moveTo(p.x1, p.y1);
      ctx.lineTo(p.x2, p.y2);
      ctx.stroke();
    });

    // Draw Creeps
    s.creeps.forEach(c => {
      ctx.fillStyle = c.isBoss ? '#ff0055' : '#00ff66';
      ctx.shadowBlur = 8;
      ctx.shadowColor = ctx.fillStyle;
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.radius, 0, Math.PI * 2);
      ctx.fill();

      // Health bar above creep
      const hpPct = c.hp / c.maxHp;
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(c.x - 12, c.y - c.radius - 8, 24, 4);
      ctx.fillStyle = '#00ff66';
      ctx.fillRect(c.x - 12, c.y - c.radius - 8, 24 * hpPct, 4);
    });

    ctx.shadowBlur = 0;
  };

  const restartGame = () => {
    gameState.current.turrets = [];
    gameState.current.creeps = [];
    gameState.current.projectiles = [];
    gameState.current.active = true;
    setCredits(250);
    setBaseHp(20);
    setWave(1);
    setScore(0);
    setGameOver(false);
    startWave(1);
  };

  return (
    <div className="td-container glass-panel">
      <div className="td-header">
        <button className="btn-secondary" onClick={onLeave}>&larr; LEAVE</button>
        <div className="td-stats">
          <span>⚡ CREDITS: <strong style={{ color: '#ffd600' }}>{credits}</strong></span>
          <span>WAVE: <strong style={{ color: '#00f3ff' }}>{wave}</strong></span>
          <span>CORE HP: <strong style={{ color: baseHp > 5 ? '#00ff66' : '#ff3b30' }}>{baseHp} ❤️</strong></span>
        </div>
      </div>

      {unlockedBanner && (
        <div className="achievement-toast">
          <span>🏆 UNLOCKED: <strong>{unlockedBanner.title}</strong> (+{unlockedBanner.points} pts)</span>
        </div>
      )}

      <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="td-canvas" />

      {/* Turret Selector Bar */}
      <div className="td-turret-bar">
        <span style={{ fontSize: '0.85rem', color: '#aaa' }}>SELECT DEFENSE:</span>
        {Object.entries(TURRET_TYPES).map(([typeKey, cfg]) => (
          <button
            key={typeKey}
            className={`turret-select-btn ${selectedTurretType === typeKey ? 'active' : ''}`}
            onClick={() => setSelectedTurretType(typeKey)}
            style={{ borderColor: cfg.color }}
          >
            <span>{cfg.icon} {cfg.name}</span>
            <small style={{ color: '#ffd600' }}>({cfg.cost} ⚡)</small>
          </button>
        ))}
      </div>

      {gameOver && (
        <div className="finish-overlay">
          <h2 className="neon-text" style={{ color: '#ff3366' }}>CORE COMPROMISED!</h2>
          <p style={{ color: '#fff', fontSize: '1.2rem', marginBottom: '15px' }}>
            Final Score: {score} | Waves Survived: {wave - 1}
          </p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn-primary" onClick={restartGame}>PLAY AGAIN</button>
            <button className="btn-secondary" onClick={onLeave}>BACK TO HUB</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TowerDefenseGame;
