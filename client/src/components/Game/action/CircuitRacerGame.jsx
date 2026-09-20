import React, { useState, useEffect, useRef } from 'react';
import soundFX from '../../../utils/SoundEffects';
import { api } from '../../../services/api';
import './CircuitRacerGame.css';

const CANVAS_WIDTH = 900;
const CANVAS_HEIGHT = 560;

// Track Definitions with Waypoints, Boost Pads, and Theme
const TRACKS = [
  {
    id: 'METROPOLIS',
    name: 'Neon Metropolis Circuit',
    icon: '🏙️',
    theme: { bg: '#080e1a', road: '#152238', kerb1: '#00f3ff', kerb2: '#ff007f', line: '#00ff66' },
    waypoints: [
      { x: 200, y: 460 }, { x: 700, y: 460 }, { x: 800, y: 380 },
      { x: 780, y: 180 }, { x: 680, y: 100 }, { x: 450, y: 120 },
      { x: 380, y: 220 }, { x: 280, y: 220 }, { x: 200, y: 140 },
      { x: 100, y: 220 }, { x: 110, y: 380 }
    ],
    boostPads: [{ x: 450, y: 460, angle: 0 }, { x: 750, y: 280, angle: -Math.PI / 2 }],
    itemBoxes: [{ x: 600, y: 460 }, { x: 330, y: 220 }, { x: 120, y: 300 }]
  },
  {
    id: 'VOLCANO',
    name: 'Cyber Magma Speedway',
    icon: '🌋',
    theme: { bg: '#140606', road: '#261212', kerb1: '#ff3300', kerb2: '#ffd600', line: '#ff9900' },
    waypoints: [
      { x: 250, y: 480 }, { x: 650, y: 480 }, { x: 780, y: 400 },
      { x: 800, y: 160 }, { x: 650, y: 80 }, { x: 480, y: 160 },
      { x: 380, y: 80 }, { x: 150, y: 120 }, { x: 100, y: 300 }, { x: 150, y: 440 }
    ],
    boostPads: [{ x: 450, y: 480, angle: 0 }, { x: 790, y: 260, angle: -Math.PI / 2 }],
    itemBoxes: [{ x: 550, y: 480 }, { x: 480, y: 160 }]
  },
  {
    id: 'SYNTHWAVE',
    name: 'Synthwave 80s Oval',
    icon: '🌴',
    theme: { bg: '#10051a', road: '#220b33', kerb1: '#e040fb', kerb2: '#00f3ff', line: '#ffd600' },
    waypoints: [
      { x: 220, y: 450 }, { x: 680, y: 450 }, { x: 790, y: 350 },
      { x: 790, y: 200 }, { x: 680, y: 100 }, { x: 220, y: 100 },
      { x: 110, y: 200 }, { x: 110, y: 350 }
    ],
    boostPads: [{ x: 450, y: 450, angle: 0 }, { x: 450, y: 100, angle: Math.PI }],
    itemBoxes: [{ x: 580, y: 450 }, { x: 320, y: 100 }]
  }
];

export default function CircuitRacerGame({ user, onLeave }) {
  const canvasRef = useRef(null);
  const [gameState, setGameState] = useState('MENU'); // MENU, RACING, FINISHED
  const [selectedTrackIdx, setSelectedTrackIdx] = useState(0);

  // HUD stats
  const [currentLap, setCurrentLap] = useState(1);
  const [totalLaps] = useState(3);
  const [position, setPosition] = useState('1st');
  const [lapTime, setLapTime] = useState(0);
  const [bestLap, setBestLap] = useState(null);
  const [speedGauge, setSpeedGauge] = useState(0);
  const [activePowerUp, setActivePowerUp] = useState(null); // 'TURBO', 'SHIELD', 'EMP', 'MINE'
  const [highScore, setHighScore] = useState(0);

  // Key controls
  const keysRef = useRef({
    up: false, down: false, left: false, right: false, drift: false, useItem: false
  });

  // Engine state in ref
  const engineRef = useRef({
    player: {
      x: 200, y: 460, angle: 0, speed: 0, maxSpeed: 7.5,
      accel: 0.18, brake: 0.15, friction: 0.98, turnSpeed: 0.048,
      isDrifting: false, driftCharge: 0, boostTimer: 0, shieldTimer: 0,
      currentLap: 1, nextCheckpoint: 1, lapStartTime: 0, finished: false,
      item: null, color: '#00f3ff'
    },
    aiRacers: [],
    skidmarks: [],
    particles: [],
    mines: [],
    startTime: 0,
    activeTrack: TRACKS[0]
  });

  useEffect(() => {
    const saved = localStorage.getItem('circuit_racer_best');
    if (saved) setHighScore(parseFloat(saved));
  }, []);

  const startRace = (trackIdx = selectedTrackIdx) => {
    soundFX.playClick();
    soundFX.playBoost();
    const track = TRACKS[trackIdx];
    setSelectedTrackIdx(trackIdx);

    const now = Date.now();
    const pStart = track.waypoints[0];

    // Setup player
    engineRef.current = {
      activeTrack: track,
      startTime: now,
      skidmarks: [],
      particles: [],
      mines: [],
      player: {
        x: pStart.x,
        y: pStart.y,
        angle: 0,
        speed: 0,
        maxSpeed: 7.5,
        accel: 0.2,
        brake: 0.15,
        friction: 0.98,
        turnSpeed: 0.048,
        isDrifting: false,
        driftCharge: 0,
        boostTimer: 0,
        shieldTimer: 0,
        currentLap: 1,
        nextCheckpoint: 1,
        lapStartTime: now,
        finished: false,
        item: 'TURBO',
        color: '#00f3ff'
      },
      // 3 AI Rivals
      aiRacers: [
        {
          id: 1, x: pStart.x - 40, y: pStart.y - 20, angle: 0, speed: 0,
          targetSpeed: 6.8, currentWP: 1, currentLap: 1, color: '#ff007f', boostTimer: 0
        },
        {
          id: 2, x: pStart.x - 80, y: pStart.y + 15, angle: 0, speed: 0,
          targetSpeed: 6.5, currentWP: 1, currentLap: 1, color: '#ffd600', boostTimer: 0
        },
        {
          id: 3, x: pStart.x - 120, y: pStart.y - 10, angle: 0, speed: 0,
          targetSpeed: 6.3, currentWP: 1, currentLap: 1, color: '#00ff66', boostTimer: 0
        }
      ]
    };

    setCurrentLap(1);
    setBestLap(null);
    setActivePowerUp('TURBO');
    setGameState('RACING');
  };

  // Keyboard Event Listeners
  useEffect(() => {
    const handleKeyDown = (e) => {
      const k = keysRef.current;
      if (e.code === 'ArrowUp' || e.code === 'KeyW') k.up = true;
      if (e.code === 'ArrowDown' || e.code === 'KeyS') k.down = true;
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') k.left = true;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') k.right = true;
      if (e.code === 'Space' || e.code === 'ShiftLeft') k.drift = true;
      if (e.code === 'KeyE' || e.code === 'Enter') handleUseItem();
    };

    const handleKeyUp = (e) => {
      const k = keysRef.current;
      if (e.code === 'ArrowUp' || e.code === 'KeyW') k.up = false;
      if (e.code === 'ArrowDown' || e.code === 'KeyS') k.down = false;
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') k.left = false;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') k.right = false;
      if (e.code === 'Space' || e.code === 'ShiftLeft') {
        k.drift = false;
        // Trigger mini turbo if drift charge was accumulated
        const p = engineRef.current.player;
        if (p.driftCharge > 40) {
          p.boostTimer = 60; // 1 second boost
          soundFX.playBoost();
          createBoostSparks(p.x, p.y, p.color, 25);
        }
        p.driftCharge = 0;
        p.isDrifting = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const handleUseItem = () => {
    const p = engineRef.current.player;
    if (!p.item) return;

    if (p.item === 'TURBO') {
      p.boostTimer = 100;
      soundFX.playBoost();
      createBoostSparks(p.x, p.y, '#ffd600', 30);
    } else if (p.item === 'SHIELD') {
      p.shieldTimer = 240; // 4 seconds
      soundFX.playSafe();
    } else if (p.item === 'EMP') {
      soundFX.playSlash();
      // Stun AI
      engineRef.current.aiRacers.forEach(ai => {
        ai.speed = 0;
      });
      createBoostSparks(p.x, p.y, '#00f3ff', 40);
    } else if (p.item === 'MINE') {
      soundFX.playClick();
      engineRef.current.mines.push({ x: p.x, y: p.y, r: 12 });
    }

    p.item = null;
    setActivePowerUp(null);
  };

  const handleTouchDriftStart = (e) => {
    if (e && e.cancelable) e.preventDefault();
    keysRef.current.drift = true;
  };

  const handleTouchDriftEnd = (e) => {
    if (e && e.cancelable) e.preventDefault();
    keysRef.current.drift = false;
    const p = engineRef.current?.player;
    if (p && p.driftCharge > 40) {
      p.boostTimer = 60;
      soundFX.playBoost();
      createBoostSparks(p.x, p.y, p.color, 25);
    }
    if (p) {
      p.driftCharge = 0;
      p.isDrifting = false;
    }
  };

  const createBoostSparks = (x, y, color, count) => {
    const eng = engineRef.current;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 6 + 2;
      eng.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        alpha: 1,
        color,
        size: Math.random() * 3 + 2
      });
    }
  };

  // High-Fidelity Sleek Sports Car Rendering Helper
  const drawDetailedSportsCar = (ctx, x, y, angle, bodyColor, isPlayer, hasShield, isBoosting) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    // 1. Ground Underglow Neon Lighting
    ctx.shadowColor = bodyColor;
    ctx.shadowBlur = isPlayer ? 16 : 8;
    ctx.fillStyle = bodyColor;
    ctx.globalAlpha = 0.45;
    ctx.fillRect(-14, -8, 28, 16);
    ctx.globalAlpha = 1.0;
    ctx.shadowBlur = 0;

    // 2. Shield Bubble
    if (hasShield) {
      ctx.strokeStyle = '#00f3ff';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#00f3ff';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(0, 0, 26, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // 3. 4 Rubber Tires with Rims (Top-down view)
    const drawWheel = (wx, wy) => {
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.roundRect(wx - 5, wy - 3, 10, 6, 2);
      ctx.fill();
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(wx - 2, wy - 1, 4, 2);
    };
    drawWheel(-12, -11); // Rear left
    drawWheel(-12, 11);  // Rear right
    drawWheel(12, -11);  // Front left
    drawWheel(12, 11);   // Front right

    // 4. Sculpted Aerodynamic Body
    ctx.fillStyle = bodyColor;
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.moveTo(20, 0);       // Front nose
    ctx.lineTo(16, -6);      // Front left bumper
    ctx.lineTo(8, -8);       // Front left fender
    ctx.lineTo(-6, -9);      // Side air scoop
    ctx.lineTo(-18, -9);     // Rear left quarter
    ctx.lineTo(-19, -4);     // Rear left bumper
    ctx.lineTo(-19, 4);      // Rear right bumper
    ctx.lineTo(-18, 9);      // Rear right quarter
    ctx.lineTo(-6, 9);       // Side air scoop
    ctx.lineTo(8, 8);        // Front right fender
    ctx.lineTo(16, 6);       // Front right bumper
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Carbon fiber front splitter
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(16, -7, 4, 14);

    // Curved Aerodynamic Tinted Cockpit Glass
    const glassGrad = ctx.createLinearGradient(-5, -6, 10, 6);
    glassGrad.addColorStop(0, '#0284c7');
    glassGrad.addColorStop(0.5, '#38bdf8');
    glassGrad.addColorStop(1, '#0f172a');
    ctx.fillStyle = glassGrad;
    ctx.beginPath();
    ctx.roundRect(-6, -6, 14, 12, 4);
    ctx.fill();
    ctx.strokeStyle = '#e0f2fe';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Helmeted driver visor
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.arc(0, 0, 3, 0, Math.PI * 2);
    ctx.fill();

    // Rear GT Wing Spoiler
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-22, -12, 4, 24); // Spoiler wing
    ctx.fillStyle = bodyColor;
    ctx.fillRect(-22, -12, 4, 3);  // Endplate left
    ctx.fillRect(-22, 9, 4, 3);   // Endplate right

    // Front Xenon Headlight Beams
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(18, -5, 2, 3);
    ctx.fillRect(18, 2, 2, 3);

    // Light beam cone on tarmac
    ctx.fillStyle = 'rgba(255, 255, 255, 0.16)';
    ctx.beginPath();
    ctx.moveTo(20, -4);
    ctx.lineTo(60, -18);
    ctx.lineTo(60, 18);
    ctx.lineTo(20, 4);
    ctx.closePath();
    ctx.fill();

    // Rear Glowing Tail/Brake Lights
    ctx.fillStyle = '#ff0055';
    ctx.shadowColor = '#ff0055';
    ctx.shadowBlur = 6;
    ctx.fillRect(-20, -7, 2, 3);
    ctx.fillRect(-20, 4, 2, 3);
    ctx.shadowBlur = 0;

    // Nitro Boost Jet Exhaust Flames
    if (isBoosting) {
      ctx.fillStyle = '#00f3ff';
      ctx.shadowColor = '#00f3ff';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(-22, -3);
      ctx.lineTo(-32 - Math.random() * 8, 0);
      ctx.lineTo(-22, 3);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    ctx.restore();
  };

  // Main 60FPS Game Loop
  useEffect(() => {
    let animId;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const loop = () => {
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      const eng = engineRef.current;
      const track = eng.activeTrack;
      const p = eng.player;
      const k = keysRef.current;

      // 1. Draw Track Environment & Tarmac
      ctx.fillStyle = track.theme.bg;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Draw Closed Circuit Road
      ctx.beginPath();
      track.waypoints.forEach((wp, i) => {
        if (i === 0) ctx.moveTo(wp.x, wp.y);
        else ctx.lineTo(wp.x, wp.y);
      });
      ctx.closePath();

      // Outer kerb border
      ctx.strokeStyle = track.theme.kerb1;
      ctx.lineWidth = 90;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.stroke();

      // Asphalt tarmac
      ctx.strokeStyle = track.theme.road;
      ctx.lineWidth = 74;
      ctx.stroke();

      // Dashed lane guide
      ctx.strokeStyle = track.theme.line;
      ctx.lineWidth = 3;
      ctx.setLineDash([12, 12]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Finish / Start Line at Waypoint 0
      const wp0 = track.waypoints[0];
      ctx.save();
      ctx.translate(wp0.x, wp0.y);
      ctx.fillStyle = '#ffffff';
      for (let y = -36; y <= 36; y += 12) {
        ctx.fillRect(-6, y, 6, 6);
        ctx.fillRect(0, y + 6, 6, 6);
      }
      ctx.restore();

      // Draw Boost Pads
      track.boostPads.forEach(bp => {
        ctx.save();
        ctx.translate(bp.x, bp.y);
        ctx.rotate(bp.angle);
        ctx.fillStyle = '#ffd600';
        ctx.shadowColor = '#ffd600';
        ctx.shadowBlur = 15;
        // Arrow symbol
        ctx.beginPath();
        ctx.moveTo(-15, -15);
        ctx.lineTo(15, 0);
        ctx.lineTo(-15, 15);
        ctx.lineTo(-5, 0);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.restore();

        // Player boost collision
        if (Math.hypot(p.x - bp.x, p.y - bp.y) < 35 && p.boostTimer <= 0) {
          p.boostTimer = 70;
          soundFX.playBoost();
          createBoostSparks(p.x, p.y, '#ffd600', 20);
        }
      });

      // Draw Item Boxes
      track.itemBoxes.forEach(ib => {
        ctx.save();
        ctx.translate(ib.x, ib.y);
        ctx.rotate(Date.now() * 0.003);
        ctx.fillStyle = 'rgba(224, 64, 251, 0.75)';
        ctx.strokeStyle = '#00f3ff';
        ctx.lineWidth = 2;
        ctx.fillRect(-12, -12, 24, 24);
        ctx.strokeRect(-12, -12, 24, 24);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px Inter';
        ctx.textAlign = 'center';
        ctx.fillText('?', 0, 4);
        ctx.restore();

        // Player item pickup
        if (!p.item && Math.hypot(p.x - ib.x, p.y - ib.y) < 30) {
          const items = ['TURBO', 'SHIELD', 'EMP', 'MINE'];
          p.item = items[Math.floor(Math.random() * items.length)];
          setActivePowerUp(p.item);
          soundFX.playSafe();
        }
      });

      // Draw Skid Marks
      for (let i = eng.skidmarks.length - 1; i >= 0; i--) {
        const sm = eng.skidmarks[i];
        sm.alpha -= 0.005;
        if (sm.alpha <= 0) {
          eng.skidmarks.splice(i, 1);
          continue;
        }
        ctx.fillStyle = `rgba(0, 0, 0, ${sm.alpha * 0.5})`;
        ctx.beginPath();
        ctx.arc(sm.x, sm.y, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw Laser Mines
      eng.mines.forEach((m, idx) => {
        ctx.fillStyle = '#ff0055';
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();

        // Check if AI hit mine
        eng.aiRacers.forEach(ai => {
          if (Math.hypot(ai.x - m.x, ai.y - m.y) < 25) {
            ai.speed = 0;
            createBoostSparks(m.x, m.y, '#ff0055', 25);
            eng.mines.splice(idx, 1);
          }
        });
      });

      // 2. Physics & Controls for Player
      if (gameState === 'RACING' && !p.finished) {
        // Boost timer
        if (p.boostTimer > 0) {
          p.boostTimer--;
          p.speed = Math.min(p.speed + 0.3, 11);
        } else if (k.up) {
          p.speed = Math.min(p.speed + p.accel, p.maxSpeed);
        } else if (k.down) {
          p.speed = Math.max(p.speed - p.brake, -2.5);
        } else {
          p.speed *= p.friction;
        }

        // Steering & Drift
        if (k.drift && p.speed > 3) {
          p.isDrifting = true;
          p.driftCharge += 1.2;
          p.turnSpeed = 0.07; // tighter drift rotation
          soundFX.playDrift();

          // Spawn smoke & skid
          eng.skidmarks.push({ x: p.x, y: p.y, alpha: 1 });
          createBoostSparks(p.x, p.y, '#e040fb', 2);
        } else {
          p.turnSpeed = 0.048;
        }

        if (k.left) p.angle -= p.turnSpeed * (p.speed / p.maxSpeed);
        if (k.right) p.angle += p.turnSpeed * (p.speed / p.maxSpeed);

        p.x += Math.cos(p.angle) * p.speed;
        p.y += Math.sin(p.angle) * p.speed;

        setSpeedGauge(Math.round(p.speed * 25));

        // Lap and Checkpoint Progression
        const nextWP = track.waypoints[p.nextCheckpoint];
        if (Math.hypot(p.x - nextWP.x, p.y - nextWP.y) < 60) {
          p.nextCheckpoint = (p.nextCheckpoint + 1) % track.waypoints.length;
          // Completed lap
          if (p.nextCheckpoint === 1) {
            const lapDuration = (Date.now() - p.lapStartTime) / 1000;
            if (!bestLap || lapDuration < bestLap) {
              setBestLap(lapDuration);
            }
            p.lapStartTime = Date.now();

            if (p.currentLap >= totalLaps) {
              p.finished = true;
              setGameState('FINISHED');
              soundFX.playWinFanfare();
              const raceTotal = (Date.now() - eng.startTime) / 1000;
              const earnedScore = Math.round(10000 / Math.max(raceTotal, 1));
              if (highScore === 0 || raceTotal < highScore) {
                setHighScore(raceTotal);
                localStorage.setItem('circuit_racer_best', raceTotal.toFixed(2));
              }
              if (user?.id) {
                api.submitScore('CIRCUIT_RACER', earnedScore, true, user).catch(() => {});
              }
            } else {
              p.currentLap++;
              setCurrentLap(p.currentLap);
              soundFX.playSafe();
            }
          }
        }
      }

      // 3. AI Racers Behavior
      eng.aiRacers.forEach(ai => {
        const targetWP = track.waypoints[ai.currentWP];
        const angleToWP = Math.atan2(targetWP.y - ai.y, targetWP.x - ai.x);

        // Turn towards waypoint
        ai.angle = angleToWP;
        ai.speed = Math.min(ai.speed + 0.15, ai.targetSpeed);

        ai.x += Math.cos(ai.angle) * ai.speed;
        ai.y += Math.sin(ai.angle) * ai.speed;

        if (Math.hypot(ai.x - targetWP.x, ai.y - targetWP.y) < 55) {
          ai.currentWP = (ai.currentWP + 1) % track.waypoints.length;
          if (ai.currentWP === 1) ai.currentLap++;
        }

        // Draw High-Fidelity AI Racing Car
        drawDetailedSportsCar(ctx, ai.x, ai.y, ai.angle, ai.color, false, false, ai.speed > 4);
      });

      // 4. Draw Player High-Fidelity Cyber Supercar
      drawDetailedSportsCar(ctx, p.x, p.y, p.angle, p.color, true, p.shieldTimer > 0, p.boostTimer > 0);

      // 5. Draw Particles
      for (let i = eng.particles.length - 1; i >= 0; i--) {
        const pt = eng.particles[i];
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.alpha -= 0.03;
        if (pt.alpha <= 0) {
          eng.particles.splice(i, 1);
          continue;
        }
        ctx.fillStyle = pt.color;
        ctx.globalAlpha = pt.alpha;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1.0;

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [gameState, bestLap]);

  return (
    <div className="circuit-racer-container">
      {/* HUD Header */}
      <div className="circuit-header">
        <div className="circuit-title-group">
          <h2>🏎️ NEON GRAND PRIX RACER</h2>
          <p>{TRACKS[selectedTrackIdx].name} • Drift & Speed Boost Zones</p>
        </div>

        <div className="race-hud-stats">
          <div className="hud-stat">
            <span className="hud-lbl">LAP</span>
            <span className="hud-val lap">{currentLap} / {totalLaps}</span>
          </div>
          <div className="hud-stat">
            <span className="hud-lbl">SPEED</span>
            <span className="hud-val">{speedGauge} KM/H</span>
          </div>
          <div className="hud-stat">
            <span className="hud-lbl">ITEM</span>
            <span className="hud-val" style={{ color: '#ffd600' }}>
              {activePowerUp || 'NONE'}
            </span>
          </div>
          <div className="hud-stat">
            <span className="hud-lbl">BEST LAP</span>
            <span className="hud-val">{bestLap ? `${bestLap.toFixed(2)}s` : '--'}</span>
          </div>
        </div>
      </div>

      {/* Main Track View Canvas */}
      <div className="circuit-canvas-wrapper">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="circuit-canvas"
        />

        {/* Menu Overlay */}
        {gameState === 'MENU' && (
          <div className="circuit-overlay">
            <h1 className="overlay-title" style={{ color: '#00f3ff' }}>NEON CIRCUIT RACER</h1>
            <p className="overlay-sub">Select your track and dominate the leaderboard with drift boosts!</p>

            <div className="track-picker-grid">
              {TRACKS.map((t, idx) => (
                <div
                  key={t.id}
                  className={`track-card ${selectedTrackIdx === idx ? 'active' : ''}`}
                  onClick={() => setSelectedTrackIdx(idx)}
                >
                  <span className="track-icon">{t.icon}</span>
                  <h4>{t.name}</h4>
                  <p style={{ color: '#a0aec0', fontSize: '0.75rem', marginTop: 4 }}>
                    {t.id === 'METROPOLIS' ? 'Technical Chicane' : t.id === 'VOLCANO' ? 'Hyper Straightways' : 'High-Speed Oval'}
                  </p>
                </div>
              ))}
            </div>

            <div className="overlay-btn-group">
              <button className="btn-primary" onClick={() => startRace(selectedTrackIdx)}>
                START RACE 🚦
              </button>
              <button className="btn-secondary" onClick={onLeave}>EXIT TO HUB</button>
            </div>
          </div>
        )}

        {/* Finished Overlay */}
        {gameState === 'FINISHED' && (
          <div className="circuit-overlay">
            <h1 className="overlay-title" style={{ color: '#00ff66' }}>RACE FINISHED! 🏁</h1>
            <p className="overlay-sub">You crossed the checkered flag in 1st place!</p>

            <div className="overlay-stats">
              <div className="overlay-stat-box">
                <div className="val">{bestLap ? `${bestLap.toFixed(2)}s` : '--'}</div>
                <div className="lbl">BEST LAP</div>
              </div>
              <div className="overlay-stat-box">
                <div className="val">{highScore ? `${highScore}s` : '--'}</div>
                <div className="lbl">CIRCUIT RECORD</div>
              </div>
            </div>

            <div className="overlay-btn-group">
              <button className="btn-primary" onClick={() => startRace(selectedTrackIdx)}>RACE AGAIN 🔄</button>
              <button className="btn-secondary" onClick={onLeave}>EXIT TO HUB</button>
            </div>
          </div>
        )}
      </div>

      {/* Desktop Keyboard Controls HUD */}
      <div className="circuit-desktop-controls-hud">
        <div className="hud-key-pill"><kbd>W</kbd> or <kbd>▲</kbd> <span>Accelerate</span></div>
        <div className="hud-key-pill"><kbd>A</kbd><kbd>D</kbd> or <kbd>◀</kbd><kbd>▶</kbd> <span>Steer</span></div>
        <div className="hud-key-pill"><kbd>S</kbd> or <kbd>▼</kbd> <span>Brake</span></div>
        <div className="hud-key-pill"><kbd>SPACE</kbd> <span>Drift & Boost</span></div>
        <div className="hud-key-pill"><kbd>E</kbd> <span>Use Item</span></div>
      </div>
    </div>
  );
}
