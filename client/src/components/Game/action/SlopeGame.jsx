import React, { useRef, useEffect, useState } from 'react';
import SoundEffects from '../../../utils/SoundEffects';
import { api } from '../../../services/api';
import './SlopeGame.css';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 480;

const SlopeGame = ({ user, onLeave }) => {
  const canvasRef = useRef(null);
  const [gameState, setGameState] = useState('MENU'); // MENU, PLAYING, GAMEOVER
  const [score, setScore] = useState(0);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const [distance, setDistance] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [unlockedBanner, setUnlockedBanner] = useState(null);

  const stateRef = useRef({
    ballX: 0, // -1 to 1
    ballY: 0, // height above slope
    ballZ: 0,
    ballVy: 0,
    ballRollAngle: 0,
    speed: 12,
    ramps: [],
    obstacles: [],
    gems: [],
    particles: [],
    steerDir: 0,
    keys: {},
    score: 0,
    distance: 0,
    multiplier: 1,
    lastTime: 0,
    active: true
  });

  useEffect(() => {
    const saved = localStorage.getItem('slope_neon_highscore');
    if (saved) setHighScore(parseInt(saved, 10));
  }, []);

  const startGame = () => {
    SoundEffects.playClick();
    const ramps = [];
    const obstacles = [];
    const gems = [];

    // Pre-generate initial slope path
    let curZ = 0;
    let curX = 0;
    for (let i = 0; i < 20; i++) {
      const segLen = 140;
      const segWidth = Math.max(140, 220 - i * 3);
      ramps.push({
        x: curX,
        z: curZ,
        length: segLen,
        width: segWidth,
        tilt: 0
      });

      if (i > 3) {
        // Spawn obstacles on ramp
        if (Math.random() < 0.6) {
          const obsX = curX + (Math.random() - 0.5) * (segWidth * 0.6);
          obstacles.push({
            x: obsX,
            z: curZ + segLen * 0.5,
            w: 30,
            h: 30
          });
        }

        // Spawn bonus gems
        if (Math.random() < 0.4) {
          const gemX = curX + (Math.random() - 0.5) * (segWidth * 0.6);
          gems.push({
            x: gemX,
            z: curZ + segLen * 0.7,
            collected: false
          });
        }
      }

      curZ += segLen;
      curX += (Math.random() - 0.5) * 60;
    }

    stateRef.current = {
      ballX: 0,
      ballY: 0,
      ballZ: 0,
      ballVy: 0,
      ballRollAngle: 0,
      speed: 14,
      ramps,
      obstacles,
      gems,
      particles: [],
      steerDir: 0,
      keys: stateRef.current.keys || {},
      score: 0,
      distance: 0,
      multiplier: 1,
      lastTime: performance.now(),
      active: true
    };

    setScore(0);
    setDistance(0);
    setSpeedMultiplier(1);
    setGameState('PLAYING');
  };

  // Keyboard Event Listeners
  useEffect(() => {
    const handleKeyDown = (e) => {
      stateRef.current.keys[e.code] = true;
      stateRef.current.keys[e.key.toLowerCase()] = true;
    };

    const handleKeyUp = (e) => {
      stateRef.current.keys[e.code] = false;
      stateRef.current.keys[e.key.toLowerCase()] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Main 60FPS Game Loop
  useEffect(() => {
    let animId;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const loop = (time) => {
      update(time);
      render(ctx);
      if (stateRef.current.active) {
        animId = requestAnimationFrame(loop);
      }
    };
    animId = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(animId);
  }, [gameState, score]);

  const update = (time) => {
    const s = stateRef.current;
    const dt = Math.min((time - (s.lastTime || time)) / 1000, 0.05);
    s.lastTime = time;

    if (gameState !== 'PLAYING') return;

    // --- 1. Handle Steering & Speed Acceleration ---
    const k = s.keys;
    const left = k['KeyA'] || k['ArrowLeft'];
    const right = k['KeyD'] || k['ArrowRight'];

    if (left) s.ballX -= 4.2 * dt;
    if (right) s.ballX += 4.2 * dt;

    // Speed gradually escalates!
    s.speed = Math.min(36, s.speed + 0.4 * dt);
    const forwardStep = s.speed * dt * 45;
    s.ballZ += forwardStep;
    s.ballRollAngle += s.speed * dt * 0.8;
    s.distance += forwardStep / 10;
    s.score += Math.floor(forwardStep * s.multiplier * 0.1);

    const curMultiplier = 1 + Math.floor(s.distance / 300);
    s.multiplier = curMultiplier;
    setSpeedMultiplier(curMultiplier);
    setScore(s.score);
    setDistance(Math.floor(s.distance));

    // --- 2. Ramp Collision & Falling Check ---
    const currentRamp = s.ramps.find(r => s.ballZ >= r.z && s.ballZ <= r.z + r.length);

    if (currentRamp) {
      const halfW = currentRamp.width / 2;
      const relX = (s.ballX * 120);

      // Check if ball went off the ramp ledge (Free fall!)
      if (relX < currentRamp.x - halfW || relX > currentRamp.x + halfW) {
        s.ballVy += 35 * dt;
        s.ballY += s.ballVy;
        if (s.ballY > 200) {
          handleCrash('FALLEN OFF SLOPE!');
          return;
        }
      } else {
        s.ballY = 0;
        s.ballVy = 0;
      }
    } else {
      // Gap in slope
      s.ballVy += 35 * dt;
      s.ballY += s.ballVy;
      if (s.ballY > 200) {
        handleCrash('FALLEN INTO ABYSS!');
        return;
      }
    }

    // --- 3. Obstacle Collisions ---
    for (let i = s.obstacles.length - 1; i >= 0; i--) {
      const obs = s.obstacles[i];
      const relX = (s.ballX * 120);

      // Check collision with Red Obstacle Block
      if (Math.abs(s.ballZ - obs.z) < 18 && Math.abs(relX - obs.x) < 26 && s.ballY < 20) {
        spawnExplosion();
        SoundEffects.playLoss();
        handleCrash('SMASHED INTO BARRIER!');
        return;
      }
    }

    // --- 4. Collectible Neon Gems ---
    for (let i = s.gems.length - 1; i >= 0; i--) {
      const gem = s.gems[i];
      const relX = (s.ballX * 120);

      if (!gem.collected && Math.abs(s.ballZ - gem.z) < 22 && Math.abs(relX - gem.x) < 26) {
        gem.collected = true;
        s.score += 500;
        SoundEffects.playWin();
      }
    }

    // --- 5. Infinite Procedural Slope Generation ---
    const lastRamp = s.ramps[s.ramps.length - 1];
    if (lastRamp && lastRamp.z - s.ballZ < 1200) {
      const segLen = 140;
      const nextZ = lastRamp.z + lastRamp.length;
      const nextX = lastRamp.x + (Math.random() - 0.5) * 80;
      const segWidth = Math.max(120, 200 - Math.min(80, s.distance * 0.05));

      s.ramps.push({
        x: nextX,
        z: nextZ,
        length: segLen,
        width: segWidth,
        tilt: 0
      });

      // Spawn Red Obstacles on new segment
      if (Math.random() < 0.65) {
        const obsX = nextX + (Math.random() - 0.5) * (segWidth * 0.6);
        s.obstacles.push({
          x: obsX,
          z: nextZ + segLen * 0.5,
          w: 30,
          h: 30
        });
      }

      // Spawn Gems
      if (Math.random() < 0.4) {
        const gemX = nextX + (Math.random() - 0.5) * (segWidth * 0.6);
        s.gems.push({
          x: gemX,
          z: nextZ + segLen * 0.7,
          collected: false
        });
      }
    }

    // Clean up passed ramps & obstacles
    s.ramps = s.ramps.filter(r => r.z + r.length > s.ballZ - 200);
    s.obstacles = s.obstacles.filter(o => o.z > s.ballZ - 100);
    s.gems = s.gems.filter(g => g.z > s.ballZ - 100);

    // Update Particles
    for (let i = s.particles.length - 1; i >= 0; i--) {
      const p = s.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.alpha -= dt / p.life;
      if (p.alpha <= 0) s.particles.splice(i, 1);
    }
  };

  const spawnExplosion = () => {
    for (let i = 0; i < 35; i++) {
      stateRef.current.particles.push({
        x: CANVAS_WIDTH / 2,
        y: CANVAS_HEIGHT * 0.75,
        vx: (Math.random() - 0.5) * 350,
        vy: (Math.random() - 0.5) * 350,
        color: i % 2 === 0 ? '#00f3ff' : '#ff0055',
        size: 3 + Math.random() * 5,
        alpha: 1.0,
        life: 0.7
      });
    }
  };

  const handleCrash = async (reason) => {
    const s = stateRef.current;
    s.active = false;
    setGameState('GAMEOVER');

    if (s.score > highScore) {
      setHighScore(s.score);
      localStorage.setItem('slope_neon_highscore', s.score.toString());
    }

    const res = await api.submitScore('SLOPE_3D', s.score, s.score >= 1000, user);
    if (res?.unlockedAchievements?.length > 0) setUnlockedBanner(res.unlockedAchievements[0]);
  };

  // --- RENDER 3D PERSPECTIVE NEON SLOPE ---
  const render = (ctx) => {
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    const s = stateRef.current;
    const horizonY = CANVAS_HEIGHT * 0.35;

    // 1. Neon Deep Space Sky
    const skyGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    skyGrad.addColorStop(0, '#02020a');
    skyGrad.addColorStop(0.5, '#0a0520');
    skyGrad.addColorStop(1, '#020108');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Cyber Geometric Grid Lines in Distance
    ctx.strokeStyle = 'rgba(0, 243, 255, 0.12)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 12; i++) {
      ctx.beginPath();
      ctx.moveTo(0, horizonY + i * 20);
      ctx.lineTo(CANVAS_WIDTH, horizonY + i * 20);
      ctx.stroke();
    }

    // 2. 3D Polygonal Ramps Projection (Back to Front)
    const visibleRamps = s.ramps
      .filter(r => r.z + r.length > s.ballZ && r.z < s.ballZ + 900)
      .sort((a, b) => b.z - a.z);

    visibleRamps.forEach(ramp => {
      const nearDist = Math.max(1, ramp.z - s.ballZ);
      const farDist = Math.max(1, ramp.z + ramp.length - s.ballZ);

      const pNear = Math.max(0.08, 1 - nearDist / 900);
      const pFar = Math.max(0.04, 1 - farDist / 900);

      const yNear = horizonY + (CANVAS_HEIGHT - horizonY) * (pNear * pNear);
      const yFar = horizonY + (CANVAS_HEIGHT - horizonY) * (pFar * pFar);

      const wNear = ramp.width * (pNear * 2.2);
      const wFar = ramp.width * (pFar * 2.2);

      const xNear = CANVAS_WIDTH / 2 + (ramp.x - s.ballX * 120) * (pNear * 2.2);
      const xFar = CANVAS_WIDTH / 2 + (ramp.x - s.ballX * 120) * (pFar * 2.2);

      // Ramp Polygonal Surface
      ctx.fillStyle = '#0a1024';
      ctx.beginPath();
      ctx.moveTo(xFar - wFar / 2, yFar);
      ctx.lineTo(xFar + wFar / 2, yFar);
      ctx.lineTo(xNear + wNear / 2, yNear);
      ctx.lineTo(xNear - wNear / 2, yNear);
      ctx.closePath();
      ctx.fill();

      // Glowing Neon Ramp Edges
      ctx.strokeStyle = '#00f3ff';
      ctx.lineWidth = Math.max(1, 3 * pNear);
      ctx.shadowColor = '#00f3ff';
      ctx.shadowBlur = 10;
      ctx.stroke();
      ctx.shadowBlur = 0;
    });

    // 3. Draw Red Obstacle Blocks
    s.obstacles
      .filter(o => o.z > s.ballZ && o.z < s.ballZ + 900)
      .sort((a, b) => b.z - a.z)
      .forEach(obs => {
        const p = Math.max(0.05, 1 - (obs.z - s.ballZ) / 900);
        const y = horizonY + (CANVAS_HEIGHT - horizonY) * (p * p);
        const x = CANVAS_WIDTH / 2 + (obs.x - s.ballX * 120) * (p * 2.2);
        const size = 32 * (p * 2);

        // Glowing Red Barrier
        ctx.fillStyle = '#ff0055';
        ctx.shadowColor = '#ff0055';
        ctx.shadowBlur = 14;
        ctx.fillRect(x - size / 2, y - size, size, size);
        ctx.shadowBlur = 0;

        // Block Inner Highlight
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x - size * 0.3, y - size * 0.8, size * 0.6, size * 0.6);
      });

    // 4. Draw Collectible Gems
    s.gems
      .filter(g => !g.collected && g.z > s.ballZ && g.z < s.ballZ + 900)
      .forEach(gem => {
        const p = Math.max(0.05, 1 - (gem.z - s.ballZ) / 900);
        const y = horizonY + (CANVAS_HEIGHT - horizonY) * (p * p);
        const x = CANVAS_WIDTH / 2 + (gem.x - s.ballX * 120) * (p * 2.2);
        const size = 20 * p;

        ctx.fillStyle = '#00ff66';
        ctx.font = `${Math.max(12, size * 1.5)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText('💎', x, y - 10);
      });

    // 5. Draw 3D Rolling Neon Ball (Center Foreground)
    const ballScreenX = CANVAS_WIDTH / 2;
    const ballScreenY = CANVAS_HEIGHT * 0.76 + s.ballY;
    const ballRadius = 22;

    ctx.save();
    ctx.translate(ballScreenX, ballScreenY);
    ctx.rotate(s.ballRollAngle);

    // Ball Ground Glow Shadow
    ctx.fillStyle = 'rgba(0, 243, 255, 0.4)';
    ctx.beginPath();
    ctx.ellipse(0, ballRadius * 0.8, ballRadius * 1.2, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // 3D Polygonal Sphere Gradient
    const ballGrad = ctx.createRadialGradient(-6, -6, 2, 0, 0, ballRadius);
    ballGrad.addColorStop(0, '#ffffff');
    ballGrad.addColorStop(0.3, '#00f3ff');
    ballGrad.addColorStop(0.85, '#0066aa');
    ballGrad.addColorStop(1, '#050a14');

    ctx.fillStyle = ballGrad;
    ctx.shadowColor = '#00f3ff';
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.arc(0, 0, ballRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Geometric Hexagonal Grid Texture on Ball
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, ballRadius * 0.6, 0, Math.PI * 2);
    ctx.moveTo(-ballRadius, 0);
    ctx.lineTo(ballRadius, 0);
    ctx.moveTo(0, -ballRadius);
    ctx.lineTo(0, ballRadius);
    ctx.stroke();

    ctx.restore();

    // 6. Draw Explosion Particles
    s.particles.forEach(pt => {
      ctx.fillStyle = pt.color;
      ctx.globalAlpha = pt.alpha;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1.0;
    });
  };

  return (
    <div className="slope-container glass-panel">
      {/* Top Header */}
      <div className="slope-header">
        <button className="btn-secondary" onClick={onLeave}>&larr; HUB</button>
        
        <div className="slope-hud-metrics">
          <div className="hud-box">
            <span className="hud-lbl">MULTIPLIER</span>
            <strong style={{ color: '#ffd600' }}>{speedMultiplier}x</strong>
          </div>
          <div className="hud-box">
            <span className="hud-lbl">DISTANCE</span>
            <strong style={{ color: '#00f3ff' }}>{distance} M</strong>
          </div>
          <div className="hud-box">
            <span className="hud-lbl">SCORE</span>
            <strong style={{ color: '#00ff66' }}>{score} PTS</strong>
          </div>
        </div>

        <button className="btn-tertiary" onClick={startGame}>↺ RESTART</button>
      </div>

      {unlockedBanner && (
        <div className="achievement-toast">
          <span>🏆 UNLOCKED: <strong>{unlockedBanner.title}</strong> (+{unlockedBanner.points} pts)</span>
        </div>
      )}

      {/* 3D Slope Canvas Area */}
      <div className="slope-canvas-wrap">
        <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="slope-canvas" />

        {gameState === 'MENU' && (
          <div className="finish-overlay">
            <h1 className="neon-text" style={{ fontSize: '2.4rem', color: '#00f3ff' }}>
              🌐 SLOPE 3D NEON RUNNER
            </h1>
            <p style={{ color: '#a4acc4', fontSize: '1.05rem', margin: '12px 0 24px 0', maxWidth: '480px' }}>
              Roll down infinite steep 3D ramps, steer past red barrier blocks, collect neon gems, and survive the endless speed rush!
            </p>
            <button className="btn-primary" style={{ padding: '14px 36px', fontSize: '1.1rem' }} onClick={startGame}>
              🚀 LAUNCH SLOPE RUN
            </button>
          </div>
        )}

        {gameState === 'GAMEOVER' && (
          <div className="finish-overlay">
            <h2 className="neon-text" style={{ color: '#ff0055' }}>
              💥 RUN TERMINATED
            </h2>
            <div className="gameover-stats">
              <div>FINAL SCORE: <strong style={{ color: '#00ff66' }}>{score} PTS</strong></div>
              <div>DISTANCE SURVIVED: <strong style={{ color: '#00f3ff' }}>{distance} METERS</strong></div>
              <div>TOP SPEED MULTIPLIER: <strong style={{ color: '#ffd600' }}>{speedMultiplier}x</strong></div>
              <div>ALL-TIME HIGH SCORE: <strong style={{ color: '#ff007f' }}>{highScore} PTS</strong></div>
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <button className="btn-primary" onClick={startGame}>PLAY AGAIN</button>
              <button className="btn-secondary" onClick={onLeave}>BACK TO HUB</button>
            </div>
          </div>
        )}
      </div>


      {/* Controls Reference */}
      <div className="slope-controls-bar">
        <span>🎮 <strong>STEER BALL:</strong> <strong>A</strong> / <strong>D</strong> Keys or <strong>◀ / ▶</strong> Arrow Keys</span>
        <span>⚡ <strong>GOAL:</strong> Dodge Red Obstacles, Stay on the Ramps, and Survive!</span>
      </div>
    </div>
  );
};

export default SlopeGame;
