import React, { useRef, useEffect, useState } from 'react';
import SoundEffects from '../../../utils/SoundEffects';
import { api } from '../../../services/api';
import './RooftopSnipersGame.css';

const ARENA_WIDTH = 800;
const ARENA_HEIGHT = 460;
const GRAVITY = 0.42;

const ROOFTOP_MAPS = [
  { name: 'Cyber Skyscraper', roofX: 180, roofY: 340, roofW: 440, color: '#101428', border: '#00f3ff' },
  { name: 'Neon Crane Tower', roofX: 220, roofY: 330, roofW: 360, color: '#1a102a', border: '#ff007f' },
  { name: 'Hover-Train Platform', roofX: 160, roofY: 350, roofW: 480, color: '#0c1a24', border: '#00ff66' },
  { name: 'Golden Penthouse', roofX: 200, roofY: 340, roofW: 400, color: '#241a0c', border: '#ffd600' }
];

const RooftopSnipersGame = ({ user, onLeave }) => {
  const canvasRef = useRef(null);
  const [gameMode, setGameMode] = useState('TWO_PLAYER'); // 'TWO_PLAYER' or 'VS_AI'
  const [currentMapIdx, setCurrentMapIdx] = useState(0);
  const [score, setScore] = useState({ p1: 0, p2: 0 });
  const [roundWinner, setRoundWinner] = useState(null);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null);
  const [unlockedBanner, setUnlockedBanner] = useState(null);

  const stateRef = useRef({
    p1: {
      x: 280,
      y: 280,
      vx: 0,
      vy: 0,
      armAngle: 0,
      armSpeed: 0.08,
      aiming: false,
      grounded: false,
      color: '#00f3ff',
      name: 'Player 1',
      holdingJump: false
    },
    p2: {
      x: 520,
      y: 280,
      vx: 0,
      vy: 0,
      armAngle: Math.PI,
      armSpeed: -0.08,
      aiming: false,
      grounded: false,
      color: '#ff007f',
      name: 'Player 2',
      holdingJump: false
    },
    bullets: [],
    particles: [],
    keys: {},
    roundOver: false,
    active: true
  });

  useEffect(() => {
    resetMatch();
  }, [gameMode]);

  const resetMatch = () => {
    setScore({ p1: 0, p2: 0 });
    setGameOver(false);
    setWinner(null);
    setCurrentMapIdx(Math.floor(Math.random() * ROOFTOP_MAPS.length));
    spawnRound();
  };

  const spawnRound = () => {
    const s = stateRef.current;
    const map = ROOFTOP_MAPS[currentMapIdx];
    s.p1 = {
      x: map.roofX + 80,
      y: map.roofY - 60,
      vx: 0,
      vy: 0,
      armAngle: 0,
      armSpeed: 0.08,
      aiming: false,
      grounded: false,
      color: '#00f3ff',
      name: 'Player 1',
      holdingJump: false
    };
    s.p2 = {
      x: map.roofX + map.roofW - 80,
      y: map.roofY - 60,
      vx: 0,
      vy: 0,
      armAngle: Math.PI,
      armSpeed: -0.08,
      aiming: false,
      grounded: false,
      color: '#ff007f',
      name: gameMode === 'VS_AI' ? 'AI Bot' : 'Player 2',
      holdingJump: false
    };
    s.bullets = [];
    s.particles = [];
    s.roundOver = false;
    setRoundWinner(null);
  };

  // Keyboard Event Listeners (P1: W to Jump, E to Shoot | P2: I/Up to Jump, O/Enter to Shoot)
  useEffect(() => {
    const handleKeyDown = (e) => {
      const s = stateRef.current;
      s.keys[e.code] = true;
      s.keys[e.key.toLowerCase()] = true;

      // P1 Jump (W)
      if (e.code === 'KeyW') {
        if (s.p1.grounded) {
          s.p1.vy = -10.5;
          s.p1.vx = (Math.random() - 0.5) * 2;
          s.p1.grounded = false;
          SoundEffects.playClick();
        }
      }

      // P1 Shoot (E)
      if (e.code === 'KeyE') {
        s.p1.aiming = true;
      }

      // P2 Jump (I or ArrowUp)
      if (e.code === 'KeyI' || e.code === 'ArrowUp') {
        if (gameMode === 'TWO_PLAYER' && s.p2.grounded) {
          s.p2.vy = -10.5;
          s.p2.vx = (Math.random() - 0.5) * 2;
          s.p2.grounded = false;
          SoundEffects.playClick();
        }
      }

      // P2 Shoot (O or Enter)
      if (e.code === 'KeyO' || e.code === 'Enter' || e.code === 'NumpadEnter') {
        if (gameMode === 'TWO_PLAYER') {
          s.p2.aiming = true;
        }
      }
    };

    const handleKeyUp = (e) => {
      const s = stateRef.current;
      s.keys[e.code] = false;
      s.keys[e.key.toLowerCase()] = false;

      // P1 Release to Fire Sniper Bullet
      if (e.code === 'KeyE') {
        if (s.p1.aiming && !s.roundOver) {
          fireSniperBullet('P1');
          s.p1.aiming = false;
        }
      }

      // P2 Release to Fire Sniper Bullet
      if (e.code === 'KeyO' || e.code === 'Enter' || e.code === 'NumpadEnter') {
        if (gameMode === 'TWO_PLAYER' && s.p2.aiming && !s.roundOver) {
          fireSniperBullet('P2');
          s.p2.aiming = false;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameMode, currentMapIdx]);

  // Main 60FPS Game Loop
  useEffect(() => {
    let animId;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const loop = () => {
      update();
      render(ctx);
      if (stateRef.current.active) {
        animId = requestAnimationFrame(loop);
      }
    };
    animId = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(animId);
  }, [gameMode, currentMapIdx, score, gameOver]);

  const fireSniperBullet = (playerKey) => {
    const s = stateRef.current;
    const player = playerKey === 'P1' ? s.p1 : s.p2;
    const speed = 18;
    const muzzleX = player.x + Math.cos(player.armAngle) * 32;
    const muzzleY = player.y - 18 + Math.sin(player.armAngle) * 32;

    s.bullets.push({
      x: muzzleX,
      y: muzzleY,
      vx: Math.cos(player.armAngle) * speed,
      vy: Math.sin(player.armAngle) * speed,
      owner: playerKey,
      color: player.color
    });

    // Gun Recoil Physics (pushes shooter back!)
    player.vx -= Math.cos(player.armAngle) * 4.2;
    player.vy -= Math.sin(player.armAngle) * 2.5;

    // Muzzle particles
    for (let i = 0; i < 8; i++) {
      s.particles.push({
        x: muzzleX,
        y: muzzleY,
        vx: Math.cos(player.armAngle) * (Math.random() * 6) + (Math.random() - 0.5) * 4,
        vy: Math.sin(player.armAngle) * (Math.random() * 6) + (Math.random() - 0.5) * 4,
        color: '#ffd600',
        life: 14
      });
    }

    SoundEffects.playClick();
  };

  const update = () => {
    const s = stateRef.current;
    if (!s.active || gameOver) return;

    const map = ROOFTOP_MAPS[currentMapIdx];

    // --- 1. AI SNIPER BOT LOGIC ---
    if (gameMode === 'VS_AI' && !s.roundOver) {
      const p2 = s.p2;
      const p1 = s.p1;

      // AI Jump randomly or when near edge
      if (p2.grounded && (Math.random() < 0.03 || p2.x < map.roofX + 30 || p2.x > map.roofX + map.roofW - 30)) {
        p2.vy = -10.5;
        p2.vx = p2.x < map.roofX + 50 ? 2 : p2.x > map.roofX + map.roofW - 50 ? -2 : (Math.random() - 0.5) * 2;
        p2.grounded = false;
      }

      // AI Arm Aim Tracking
      const dx = p1.x - p2.x;
      const dy = (p1.y - 18) - (p2.y - 18);
      const targetAngle = Math.atan2(dy, dx);
      let diff = targetAngle - p2.armAngle;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;

      p2.armAngle += Math.sign(diff) * 0.06;

      // AI Shoot Opportunity
      if (Math.abs(diff) < 0.25 && Math.random() < 0.05) {
        fireSniperBullet('P2');
      }
    }

    // --- 2. UPDATE PLAYERS (Physics & Arm Rotation) ---
    [s.p1, s.p2].forEach(p => {
      // Rotate Aiming Arm constantly when aiming / idle
      if (p.aiming || (gameMode !== 'VS_AI' || p === s.p1)) {
        p.armAngle += p.armSpeed;
        if (p.armAngle > Math.PI * 0.4 || p.armAngle < -Math.PI * 0.4) {
          p.armSpeed = -p.armSpeed;
        }
      }

      // Gravity & Velocity
      p.vy += GRAVITY;
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.94; // Horizontal air resistance

      // Rooftop Collision
      if (p.y >= map.roofY && p.y - p.vy <= map.roofY + 12 && p.x >= map.roofX && p.x <= map.roofX + map.roofW) {
        p.y = map.roofY;
        p.vy = 0;
        p.grounded = true;
      } else {
        p.grounded = false;
      }

      // Check Fall Off Rooftop (Round Knockout!)
      if (p.y > ARENA_HEIGHT + 60 && !s.roundOver) {
        s.roundOver = true;
        const winnerKey = p === s.p1 ? 'P2' : 'P1';
        handleKnockout(winnerKey);
      }
    });

    // --- 3. UPDATE SNIPER BULLETS ---
    for (let i = s.bullets.length - 1; i >= 0; i--) {
      const b = s.bullets[i];
      b.x += b.vx;
      b.y += b.vy;

      let hit = false;

      // Check Hit on Opponent
      [s.p1, s.p2].forEach(p => {
        const pKey = p === s.p1 ? 'P1' : 'P2';
        if (b.owner !== pKey) {
          const dist = Math.hypot(b.x - p.x, b.y - (p.y - 20));
          if (dist < 24) {
            hit = true;
            // Massive Knockback Momentum Force!
            p.vx += b.vx * 0.55;
            p.vy += -4.5;
            p.grounded = false;

            // Hit blood/sparks particles
            for (let k = 0; k < 15; k++) {
              s.particles.push({
                x: b.x,
                y: b.y,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                color: p.color,
                life: 18
              });
            }
            SoundEffects.playLoss();
          }
        }
      });

      // Remove out-of-bounds bullets
      if (b.x < 0 || b.x > ARENA_WIDTH || b.y < 0 || b.y > ARENA_HEIGHT || hit) {
        s.bullets.splice(i, 1);
      }
    }

    // --- 4. PARTICLES ---
    for (let i = s.particles.length - 1; i >= 0; i--) {
      const pt = s.particles[i];
      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.life--;
      if (pt.life <= 0) s.particles.splice(i, 1);
    }
  };

  const handleKnockout = async (winnerKey) => {
    SoundEffects.playWin();
    const roundWinnerName = winnerKey === 'P1' ? 'PLAYER 1' : (gameMode === 'VS_AI' ? 'AI BOT' : 'PLAYER 2');
    setRoundWinner(roundWinnerName);

    const nextScore = {
      p1: winnerKey === 'P1' ? score.p1 + 1 : score.p1,
      p2: winnerKey === 'P2' ? score.p2 + 1 : score.p2
    };
    setScore(nextScore);

    // First to 5 Wins Match
    if (nextScore.p1 >= 5 || nextScore.p2 >= 5) {
      setGameOver(true);
      const matchWinner = nextScore.p1 >= 5 ? 'PLAYER 1' : (gameMode === 'VS_AI' ? 'AI BOT' : 'PLAYER 2');
      setWinner(matchWinner);
      const res = await api.submitScore('ROOFTOP_SNIPERS', 600, nextScore.p1 >= 5, user);
      if (res?.unlockedAchievements?.length > 0) setUnlockedBanner(res.unlockedAchievements[0]);
    } else {
      setTimeout(() => {
        setCurrentMapIdx(Math.floor(Math.random() * ROOFTOP_MAPS.length));
        spawnRound();
      }, 1500);
    }
  };

  // --- RENDER CYBER ROOFTOP DUEL ---
  const render = (ctx) => {
    ctx.clearRect(0, 0, ARENA_WIDTH, ARENA_HEIGHT);
    const s = stateRef.current;
    const map = ROOFTOP_MAPS[currentMapIdx];

    // 1. Synthwave Skyline & City Background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, ARENA_HEIGHT);
    bgGrad.addColorStop(0, '#040212');
    bgGrad.addColorStop(0.65, '#160528');
    bgGrad.addColorStop(1, '#05020f');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, ARENA_WIDTH, ARENA_HEIGHT);

    // Background Skyscrapers Silhouette
    ctx.fillStyle = '#0b081c';
    for (let i = 0; i < 16; i++) {
      const bw = 55;
      const bx = i * 55;
      const bh = 140 + Math.sin(i * 1.6) * 70;
      ctx.fillRect(bx, ARENA_HEIGHT - bh, bw - 5, bh);

      // Lit windows
      ctx.fillStyle = i % 2 === 0 ? 'rgba(0, 243, 255, 0.25)' : 'rgba(255, 0, 127, 0.25)';
      for (let w = 0; w < 4; w++) {
        ctx.fillRect(bx + 10 + (w % 2) * 16, ARENA_HEIGHT - bh + 20 + Math.floor(w / 2) * 20, 8, 8);
      }
      ctx.fillStyle = '#0b081c';
    }

    // 2. Main Rooftop Arena Platform
    ctx.fillStyle = map.color;
    ctx.beginPath();
    ctx.roundRect(map.roofX, map.roofY, map.roofW, ARENA_HEIGHT - map.roofY, [12, 12, 0, 0]);
    ctx.fill();

    // Glowing Neon Rooftop Edge
    ctx.strokeStyle = map.border;
    ctx.lineWidth = 4;
    ctx.shadowColor = map.border;
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.moveTo(map.roofX, map.roofY);
    ctx.lineTo(map.roofX + map.roofW, map.roofY);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Platform Vent / Antenna details
    ctx.fillStyle = '#1e2438';
    ctx.fillRect(map.roofX + 40, map.roofY - 14, 28, 14);
    ctx.fillRect(map.roofX + map.roofW - 68, map.roofY - 14, 28, 14);

    // 3. Draw Ragdoll Sniper Characters
    drawSniperCharacter(ctx, s.p1);
    drawSniperCharacter(ctx, s.p2);

    // 4. Draw Bullets
    s.bullets.forEach(b => {
      ctx.fillStyle = b.color;
      ctx.shadowColor = b.color;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    // 5. Draw Particles
    s.particles.forEach(pt => {
      ctx.fillStyle = pt.color;
      ctx.fillRect(pt.x, pt.y, 3, 3);
    });
  };

  const drawSniperCharacter = (ctx, player) => {
    ctx.save();
    ctx.translate(player.x, player.y);

    // Body Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.ellipse(0, 2, 14, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Legs
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-8, -14, 6, 14);
    ctx.fillRect(2, -14, 6, 14);

    // Torso / Trenchcoat
    ctx.fillStyle = player.color;
    ctx.shadowColor = player.color;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.roundRect(-10, -38, 20, 26, 4);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Head / Cyber Helmet with glowing visor
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(0, -48, 9, 0, Math.PI * 2);
    ctx.fill();

    // Glowing Neon Visor
    ctx.fillStyle = player.color;
    ctx.fillRect(-4, -50, 10, 4);

    // Sniper Arm & Rifle (Rotates with Aiming Angle)
    ctx.save();
    ctx.translate(0, -28);
    ctx.rotate(player.armAngle);

    // Arm
    ctx.fillStyle = player.color;
    ctx.fillRect(0, -3, 14, 6);

    // Sniper Rifle Barrel & Scope
    ctx.fillStyle = '#0a0d18';
    ctx.fillRect(10, -4, 28, 5); // Rifle barrel
    ctx.fillStyle = '#ffd600';
    ctx.fillRect(14, -8, 10, 4); // Optical scope
    ctx.fillStyle = '#00f3ff';
    ctx.fillRect(36, -3, 4, 3); // Muzzle brake

    ctx.restore();

    // Player Label
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px Orbitron, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(player.name, 0, -62);

    ctx.restore();
  };

  return (
    <div className="snipers-container glass-panel">
      {/* Top Header */}
      <div className="snipers-header">
        <button className="btn-secondary" onClick={onLeave}>&larr; HUB</button>
        
        {/* Mode Selector */}
        <div className="game-mode-toggle-group">
          <button 
            className={`mode-pill-btn ${gameMode === 'TWO_PLAYER' ? 'active' : ''}`}
            onClick={() => setGameMode('TWO_PLAYER')}
          >
            👥 2-PLAYER DUEL
          </button>
          <button 
            className={`mode-pill-btn ${gameMode === 'VS_AI' ? 'active' : ''}`}
            onClick={() => setGameMode('VS_AI')}
          >
            🤖 VS AI SNIPER
          </button>
        </div>

        <button className="btn-tertiary" onClick={resetMatch}>↺ RESTART</button>
      </div>

      {/* Match Scoreboard */}
      <div className="snipers-scoreboard">
        <div className="player-score-box p1">
          <span>P1 (CYAN)</span>
          <strong className="score-num">{score.p1}</strong>
        </div>

        <div className="match-center-info">
          <span className="first-to-tag">FIRST TO 5 KNOCKOUTS</span>
          <span className="arena-map-name">📍 {ROOFTOP_MAPS[currentMapIdx].name}</span>
        </div>

        <div className="player-score-box p2">
          <span>{gameMode === 'VS_AI' ? 'AI BOT' : 'P2 (PINK)'}</span>
          <strong className="score-num">{score.p2}</strong>
        </div>
      </div>

      {unlockedBanner && (
        <div className="achievement-toast">
          <span>🏆 UNLOCKED: <strong>{unlockedBanner.title}</strong> (+{unlockedBanner.points} pts)</span>
        </div>
      )}

      {/* 2D Physics Arena Canvas */}
      <div className="snipers-canvas-wrap">
        <canvas ref={canvasRef} width={ARENA_WIDTH} height={ARENA_HEIGHT} className="snipers-canvas" />

        {roundWinner && !gameOver && (
          <div className="round-win-overlay">
            <h3 className="neon-text" style={{ color: '#ffd600' }}>
              🎯 {roundWinner} SCORED A KNOCKOUT!
            </h3>
          </div>
        )}
      </div>



      {/* Controls Reference */}
      <div className="snipers-controls-bar">
        <div className="ctrl-group">
          <span style={{ color: '#00f3ff', fontWeight: 'bold' }}>🔵 PLAYER 1:</span>
          <span><strong>W</strong>: Jump &bull; Hold & Release <strong>E</strong>: Aim & Shoot</span>
        </div>
        <div className="ctrl-group">
          <span style={{ color: '#ff007f', fontWeight: 'bold' }}>🔴 {gameMode === 'VS_AI' ? 'AI SNIPER' : 'PLAYER 2'}:</span>
          <span><strong>I</strong> or <strong>↑</strong>: Jump &bull; Hold & Release <strong>O</strong> or <strong>ENTER</strong>: Shoot</span>
        </div>
      </div>

      {gameOver && (
        <div className="finish-overlay">
          <h2 className="neon-text" style={{ color: winner === 'PLAYER 1' ? '#00ff66' : '#ff0055' }}>
            🏆 {winner} WON THE ROOFTOP WAR!
          </h2>
          <p style={{ color: '#fff', fontSize: '1.2rem', margin: '10px 0 20px 0' }}>
            Final Score: {score.p1} - {score.p2}
          </p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn-primary" onClick={resetMatch}>PLAY AGAIN</button>
            <button className="btn-secondary" onClick={onLeave}>BACK TO HUB</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RooftopSnipersGame;
