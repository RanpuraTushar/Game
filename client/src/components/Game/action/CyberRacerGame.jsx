import React, { useEffect, useRef, useState } from 'react';
import SoundEffects from '../../../utils/SoundEffects';
import { api } from '../../../services/api';
import './CyberRacerGame.css';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 480;

// Garage Supercars with realistic specs & body types
const CAR_SELECTION = [
  {
    id: 'GTR',
    name: 'NEON GT-R V-SPEC',
    color: '#00f3ff',
    bodyStyle: 'SUPERCAR',
    secondaryColor: '#006699',
    maxSpeed: 300,
    accel: 2.4,
    handling: 2.0,
    special: '⚡ Balanced Track Monster'
  },
  {
    id: 'HYPERION',
    name: 'CYBER HYPERION HYPERCAR',
    color: '#ff007f',
    bodyStyle: 'HYPERCAR',
    secondaryColor: '#99004d',
    maxSpeed: 350,
    accel: 3.0,
    handling: 1.7,
    special: '🔥 Extreme Nitro Boost'
  },
  {
    id: 'TITAN',
    name: 'ARMORED TITAN GT',
    color: '#ffd600',
    bodyStyle: 'ARMORED',
    secondaryColor: '#998000',
    maxSpeed: 270,
    accel: 2.0,
    handling: 2.2,
    special: '🛡️ Reinforced Crash Shield'
  },
  {
    id: 'PHANTOM',
    name: 'PHANTOM PROTO-EV',
    color: '#00ff66',
    bodyStyle: 'CONCEPT',
    secondaryColor: '#00993d',
    maxSpeed: 320,
    accel: 2.6,
    handling: 2.4,
    special: '🛸 Agile Drift Handling'
  }
];

const HIGHWAY_ZONES = [
  { zone: 1, name: 'CRUISING', minDistance: 0, maxTraffic: 5, mult: 1.0, color: '#00ff66' },
  { zone: 2, name: 'HIGHWAY RUSH', minDistance: 400, maxTraffic: 6, mult: 1.25, color: '#00f3ff' },
  { zone: 3, name: 'CYBER GRIDLOCK', minDistance: 1200, maxTraffic: 7, mult: 1.5, color: '#ffd600' },
  { zone: 4, name: 'OVERDRIVE', minDistance: 2500, maxTraffic: 8, mult: 2.0, color: '#ff9100' },
  { zone: 5, name: 'CHAOS ASPHALT', minDistance: 4500, maxTraffic: 9, mult: 2.5, color: '#ff0055' }
];

const getZoneForDistance = (dist) => {
  for (let i = HIGHWAY_ZONES.length - 1; i >= 0; i--) {
    if (dist >= HIGHWAY_ZONES[i].minDistance) return HIGHWAY_ZONES[i];
  }
  return HIGHWAY_ZONES[0];
};

const CyberRacerGame = ({ user, onLeave }) => {
  const canvasRef = useRef(null);
  const [gameState, setGameState] = useState('MENU'); // MENU, PLAYING, GAMEOVER
  const [gameMode, setGameMode] = useState('ENDLESS'); // 'ENDLESS', 'TIME_ATTACK', 'TWO_PLAYER'
  const [selectedCarIdx, setSelectedCarIdx] = useState(0);
  const [selectedCar2Idx, setSelectedCar2Idx] = useState(1);
  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState(0);
  const [distance, setDistance] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [nitro, setNitro] = useState(100);
  const [timeLeft, setTimeLeft] = useState(45);
  const [highScore, setHighScore] = useState(0);
  const [currentZone, setCurrentZone] = useState(HIGHWAY_ZONES[0]);
  const [levelUpBanner, setLevelUpBanner] = useState(null);
  const [unlockedBanner, setUnlockedBanner] = useState(null);

  const stateRef = useRef({
    p1: {
      x: 0,
      speed: 80,
      nitro: 100,
      nitroActive: false,
      braking: false,
      steerDir: 0,
      shield: false,
      alive: true
    },
    p2: {
      x: 0.35,
      speed: 80,
      nitro: 100,
      nitroActive: false,
      braking: false,
      steerDir: 0,
      shield: false,
      alive: true
    },
    traffic: [],
    collectibles: [],
    particles: [],
    streetlights: [],
    roadOffset: 0,
    roadCurve: 0,
    keys: {},
    timeRemaining: 45,
    score: 0,
    coins: 0,
    distance: 0,
    zone: 1,
    lastTime: 0,
    active: true
  });

  useEffect(() => {
    const saved = localStorage.getItem('cyber_racer_highscore');
    if (saved) setHighScore(parseInt(saved, 10));
  }, []);

  const startGame = () => {
    SoundEffects.playClick();
    const car1 = CAR_SELECTION[selectedCarIdx];
    const car2 = CAR_SELECTION[selectedCar2Idx];

    stateRef.current = {
      p1: {
        x: gameMode === 'TWO_PLAYER' ? -0.35 : 0,
        speed: 80,
        nitro: 100,
        nitroActive: false,
        braking: false,
        steerDir: 0,
        shield: car1.id === 'TITAN',
        alive: true
      },
      p2: {
        x: 0.35,
        speed: 80,
        nitro: 100,
        nitroActive: false,
        braking: false,
        steerDir: 0,
        shield: car2.id === 'TITAN',
        alive: true
      },
      traffic: [],
      collectibles: [],
      particles: [],
      streetlights: [
        { z: 200 }, { z: 400 }, { z: 600 }, { z: 800 }
      ],
      roadOffset: 0,
      roadCurve: 0,
      keys: stateRef.current.keys || {},
      timeRemaining: 45,
      score: 0,
      coins: 0,
      distance: 0,
      lastTime: performance.now(),
      active: true
    };

    // Pre-populate traffic with realistic spacing
    for (let i = 0; i < 5; i++) {
      spawnTrafficCar(450 + i * 260);
    }

    setScore(0);
    setCoins(0);
    setDistance(0);
    setNitro(100);
    setTimeLeft(45);
    setGameState('PLAYING');
  };

  const spawnTrafficCar = (zDist) => {
    const lanePositions = [-0.75, -0.25, 0.25, 0.75];
    const laneX = lanePositions[Math.floor(Math.random() * lanePositions.length)];
    const carTypes = [
      { color: '#ff3366', speed: 110 + Math.random() * 40, type: 'SEDAN', name: 'Cyber Sedan' },
      { color: '#00e676', speed: 85 + Math.random() * 25, type: 'TRUCK', name: 'Heavy Hauler' },
      { color: '#ffd600', speed: 145 + Math.random() * 55, type: 'SUPERCAR', name: 'Diablo GT' },
      { color: '#a855f7', speed: 125 + Math.random() * 35, type: 'COUPE', name: 'Viper Coupe' }
    ];
    const picked = carTypes[Math.floor(Math.random() * carTypes.length)];
    stateRef.current.traffic.push({
      x: laneX,
      z: zDist,
      speed: picked.speed,
      color: picked.color,
      type: picked.type,
      name: picked.name
    });
  };

  const spawnCollectible = (zDist) => {
    const lanePositions = [-0.75, -0.25, 0.25, 0.75];
    const laneX = lanePositions[Math.floor(Math.random() * lanePositions.length)];
    const roll = Math.random();
    const type = roll < 0.35 ? 'NITRO' : roll < 0.5 ? 'SHIELD' : 'COIN';

    stateRef.current.collectibles.push({
      x: laneX,
      z: zDist,
      type
    });
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
  }, [gameState, gameMode, selectedCarIdx, selectedCar2Idx]);

  const update = (time) => {
    const s = stateRef.current;
    const dt = Math.min((time - (s.lastTime || time)) / 1000, 0.05);
    s.lastTime = time;

    if (gameState !== 'PLAYING') return;

    const car1Meta = CAR_SELECTION[selectedCarIdx];
    const car2Meta = CAR_SELECTION[selectedCar2Idx];
    const k = s.keys;

    // Time Attack Countdown
    if (gameMode === 'TIME_ATTACK') {
      s.timeRemaining -= dt;
      setTimeLeft(Math.ceil(s.timeRemaining));
      if (s.timeRemaining <= 0) {
        handleGameOver('TIME UP!');
        return;
      }
    }

    // --- 1. PLAYER 1 CONTROLS ---
    const p1 = s.p1;
    if (p1.alive) {
      const p1Left = k['KeyA'] || (gameMode !== 'TWO_PLAYER' && k['ArrowLeft']);
      const p1Right = k['KeyD'] || (gameMode !== 'TWO_PLAYER' && k['ArrowRight']);
      const p1Accelerate = k['KeyW'] || (gameMode !== 'TWO_PLAYER' && k['ArrowUp']);
      const p1Brake = k['KeyS'] || (gameMode !== 'TWO_PLAYER' && k['ArrowDown']);
      const p1Nitro = (k['Space'] || k['ShiftLeft']) && p1.nitro > 5;

      p1.braking = p1Brake;
      p1.steerDir = p1Left ? -1 : p1Right ? 1 : 0;

      // Nitro & Speed
      if (p1Nitro) {
        p1.nitroActive = true;
        p1.nitro = Math.max(0, p1.nitro - 42 * dt);
        p1.speed = Math.min(car1Meta.maxSpeed + 75, p1.speed + car1Meta.accel * 3.8);
        spawnNitroExhaust(p1.x, car1Meta.color);
      } else {
        p1.nitroActive = false;
        p1.nitro = Math.min(100, p1.nitro + 9 * dt);
        if (p1Accelerate) p1.speed = Math.min(car1Meta.maxSpeed, p1.speed + car1Meta.accel * 1.5);
        else if (p1Brake) p1.speed = Math.max(35, p1.speed - 5.0);
        else p1.speed = Math.max(60, p1.speed - 0.7);
      }

      // Steering with momentum
      const steerP1 = car1Meta.handling * (p1.speed / 130);
      if (p1Left) p1.x = Math.max(-0.95, p1.x - steerP1 * dt);
      if (p1Right) p1.x = Math.min(0.95, p1.x + steerP1 * dt);
    }

    // --- 2. PLAYER 2 CONTROLS (2-Player Mode) ---
    const p2 = s.p2;
    if (gameMode === 'TWO_PLAYER' && p2.alive) {
      const p2Left = k['ArrowLeft'];
      const p2Right = k['ArrowRight'];
      const p2Accelerate = k['ArrowUp'];
      const p2Brake = k['ArrowDown'];
      const p2Nitro = (k['Enter'] || k['NumpadEnter'] || k['ShiftRight']) && p2.nitro > 5;

      p2.braking = p2Brake;
      p2.steerDir = p2Left ? -1 : p2Right ? 1 : 0;

      if (p2Nitro) {
        p2.nitroActive = true;
        p2.nitro = Math.max(0, p2.nitro - 42 * dt);
        p2.speed = Math.min(car2Meta.maxSpeed + 75, p2.speed + car2Meta.accel * 3.8);
        spawnNitroExhaust(p2.x, car2Meta.color);
      } else {
        p2.nitroActive = false;
        p2.nitro = Math.min(100, p2.nitro + 9 * dt);
        if (p2Accelerate) p2.speed = Math.min(car2Meta.maxSpeed, p2.speed + car2Meta.accel * 1.5);
        else if (p2Brake) p2.speed = Math.max(35, p2.speed - 5.0);
        else p2.speed = Math.max(60, p2.speed - 0.7);
      }

      const steerP2 = car2Meta.handling * (p2.speed / 130);
      if (p2Left) p2.x = Math.max(-0.95, p2.x - steerP2 * dt);
      if (p2Right) p2.x = Math.min(0.95, p2.x + steerP2 * dt);
    }

    // Reference speed for world scroll
    const dominantSpeed = Math.max(p1.alive ? p1.speed : 0, p2.alive ? p2.speed : 0);
    s.roadOffset += dominantSpeed * dt * 9;
    s.distance += (dominantSpeed * dt) / 10;

    const activeZone = getZoneForDistance(s.distance);
    if (activeZone.zone > s.zone) {
      s.zone = activeZone.zone;
      setCurrentZone(activeZone);
      SoundEffects.playTrophy();
      setLevelUpBanner({ zone: activeZone.zone, name: activeZone.name, mult: activeZone.mult });
      setTimeout(() => setLevelUpBanner(null), 3200);
    }

    s.score += Math.floor((dominantSpeed / 35) * (p1.nitroActive || p2.nitroActive ? 2 : 1) * activeZone.mult);

    // Road Curvature
    s.roadCurve = Math.sin(time * 0.0006) * 0.45;

    // Update Streetlights
    s.streetlights.forEach(sl => {
      sl.z -= dominantSpeed * dt * 4;
      if (sl.z < -40) sl.z = 900;
    });

    setScore(s.score);
    setSpeed(Math.floor(p1.speed));
    setNitro(Math.floor(p1.nitro));
    setDistance(Math.floor(s.distance));

    // --- 3. TRAFFIC UPDATE & REALISTIC HITBOXES ---
    for (let i = s.traffic.length - 1; i >= 0; i--) {
      const car = s.traffic[i];
      car.z -= (dominantSpeed - car.speed) * dt * 4;

      // P1 Collision
      if (p1.alive && car.z > 25 && car.z < 95 && Math.abs(car.x - p1.x) < 0.32) {
        if (p1.shield) {
          p1.shield = false;
          spawnCrashSparks(p1.x, '#ffd600');
          SoundEffects.playSafe();
          s.traffic.splice(i, 1);
          continue;
        } else {
          p1.alive = false;
          spawnCrashSparks(p1.x, car1Meta.color);
          SoundEffects.playLoss();
          if (gameMode !== 'TWO_PLAYER' || !p2.alive) {
            handleGameOver(gameMode === 'TWO_PLAYER' ? 'PLAYER 2 WINS!' : 'CRASHED!');
            return;
          }
        }
      }

      // P2 Collision
      if (gameMode === 'TWO_PLAYER' && p2.alive && car.z > 25 && car.z < 95 && Math.abs(car.x - p2.x) < 0.32) {
        if (p2.shield) {
          p2.shield = false;
          spawnCrashSparks(p2.x, '#ffd600');
          SoundEffects.playSafe();
          s.traffic.splice(i, 1);
          continue;
        } else {
          p2.alive = false;
          spawnCrashSparks(p2.x, car2Meta.color);
          SoundEffects.playLoss();
          if (!p1.alive) {
            handleGameOver('PLAYER 1 WINS!');
            return;
          }
        }
      }

      // Despawn passed cars
      if (car.z < -60) {
        s.traffic.splice(i, 1);
        spawnTrafficCar(750 + Math.random() * 350);
      }
    }

    const currentMaxTraffic = getZoneForDistance(s.distance).maxTraffic;
    if (s.traffic.length < currentMaxTraffic) {
      spawnTrafficCar(800 + Math.random() * 300);
    }

    // --- 4. COLLECTIBLES UPDATE ---
    if (Math.random() < 0.035 && s.collectibles.length < 4) {
      spawnCollectible(650 + Math.random() * 300);
    }

    for (let i = s.collectibles.length - 1; i >= 0; i--) {
      const item = s.collectibles[i];
      item.z -= dominantSpeed * dt * 4;

      [p1, p2].forEach(p => {
        if (p.alive && item.z > 20 && item.z < 90 && Math.abs(item.x - p.x) < 0.35) {
          if (item.type === 'NITRO') {
            p.nitro = Math.min(100, p.nitro + 50);
            SoundEffects.playSafe();
          } else if (item.type === 'SHIELD') {
            p.shield = true;
            SoundEffects.playSafe();
          } else {
            s.coins += 1;
            s.score += 300;
            if (gameMode === 'TIME_ATTACK') s.timeRemaining += 4;
            setCoins(s.coins);
            SoundEffects.playWin();
          }
          s.collectibles.splice(i, 1);
        }
      });

      if (item.z < -40) s.collectibles.splice(i, 1);
    }

    // --- 5. PARTICLES UPDATE ---
    for (let i = s.particles.length - 1; i >= 0; i--) {
      const p = s.particles[i];
      p.y += p.vy * dt;
      p.x += p.vx * dt;
      p.alpha -= dt / p.life;
      if (p.alpha <= 0) s.particles.splice(i, 1);
    }
  };

  const spawnNitroExhaust = (laneX, color) => {
    const screenX = (CANVAS_WIDTH / 2) + (laneX * (CANVAS_WIDTH * 0.40));
    // Dual exhaust plumes
    [-22, 22].forEach(offset => {
      for (let i = 0; i < 2; i++) {
        stateRef.current.particles.push({
          x: screenX + offset + (Math.random() - 0.5) * 6,
          y: CANVAS_HEIGHT - 35,
          vx: (Math.random() - 0.5) * 30,
          vy: 180 + Math.random() * 100,
          color: Math.random() > 0.4 ? '#00f3ff' : '#ff007f',
          size: 5 + Math.random() * 6,
          alpha: 1.0,
          life: 0.22
        });
      }
    });
  };

  const spawnCrashSparks = (laneX, color) => {
    const screenX = (CANVAS_WIDTH / 2) + (laneX * (CANVAS_WIDTH * 0.40));
    for (let i = 0; i < 35; i++) {
      stateRef.current.particles.push({
        x: screenX,
        y: CANVAS_HEIGHT - 65,
        vx: (Math.random() - 0.5) * 350,
        vy: (Math.random() - 0.5) * 350,
        color: i % 2 === 0 ? color : '#ffd600',
        size: 3 + Math.random() * 4,
        alpha: 1.0,
        life: 0.7
      });
    }
  };

  const handleGameOver = async (reason) => {
    const s = stateRef.current;
    s.active = false;
    setGameState('GAMEOVER');

    if (s.score > highScore) {
      setHighScore(s.score);
      localStorage.setItem('cyber_racer_highscore', s.score.toString());
    }

    const res = await api.submitScore('CYBER_RACER', s.score, s.score >= 1000, user);
    if (res?.unlockedAchievements?.length > 0) setUnlockedBanner(res.unlockedAchievements[0]);
  };

  // --- RENDER REALISTIC 2.5D SYNTHWAVE WORLD ---
  const render = (ctx) => {
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    const s = stateRef.current;
    const horizonY = CANVAS_HEIGHT * 0.52;
    const roadBottomW = CANVAS_WIDTH * 0.86;
    const roadTopW = CANVAS_WIDTH * 0.14;

    // 1. Synthwave Sky & Horizon
    const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
    skyGrad.addColorStop(0, '#040212');
    skyGrad.addColorStop(0.65, '#190632');
    skyGrad.addColorStop(1, '#ff007f');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, CANVAS_WIDTH, horizonY);

    // Glowing Sun
    const sunY = horizonY - 45;
    const sunGrad = ctx.createRadialGradient(CANVAS_WIDTH / 2, sunY, 15, CANVAS_WIDTH / 2, sunY, 80);
    sunGrad.addColorStop(0, '#ffffa0');
    sunGrad.addColorStop(0.45, '#ffd600');
    sunGrad.addColorStop(1, '#ff007f');
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(CANVAS_WIDTH / 2, sunY, 75, 0, Math.PI, true);
    ctx.fill();

    // Sun Horizontal Scanlines
    ctx.fillStyle = '#040212';
    for (let i = 0; i < 8; i++) {
      ctx.fillRect(CANVAS_WIDTH / 2 - 80, sunY - 55 + i * 8, 160, 2 + i * 0.4);
    }

    // Cyber Skyline Silhouette
    ctx.fillStyle = '#0b0622';
    const bldCount = 28;
    const bldWidth = CANVAS_WIDTH / bldCount;
    for (let i = 0; i < bldCount; i++) {
      const h = 25 + Math.sin(i * 1.8) * 30 + (i % 4) * 16;
      ctx.fillRect(i * bldWidth, horizonY - h, bldWidth + 1, h);
    }

    // 2. Asphalt Highway & Moving Curvature
    const curveShift = s.roadCurve * 70;
    ctx.fillStyle = '#080a18'; // Dark asphalt
    ctx.beginPath();
    ctx.moveTo((CANVAS_WIDTH - roadTopW) / 2 + curveShift, horizonY);
    ctx.lineTo((CANVAS_WIDTH + roadTopW) / 2 + curveShift, horizonY);
    ctx.lineTo((CANVAS_WIDTH + roadBottomW) / 2, CANVAS_HEIGHT);
    ctx.lineTo((CANVAS_WIDTH - roadBottomW) / 2, CANVAS_HEIGHT);
    ctx.closePath();
    ctx.fill();

    // Glowing Neon Highway Guardrails
    ctx.strokeStyle = '#00f3ff';
    ctx.lineWidth = 4;
    ctx.shadowColor = '#00f3ff';
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.moveTo((CANVAS_WIDTH - roadTopW) / 2 + curveShift, horizonY);
    ctx.lineTo((CANVAS_WIDTH - roadBottomW) / 2, CANVAS_HEIGHT);
    ctx.moveTo((CANVAS_WIDTH + roadTopW) / 2 + curveShift, horizonY);
    ctx.lineTo((CANVAS_WIDTH + roadBottomW) / 2, CANVAS_HEIGHT);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Road Lane Stripes
    const numStripes = 16;
    for (let i = 0; i < numStripes; i++) {
      const p = ((i + (s.roadOffset % 40) / 40) / numStripes);
      const y = horizonY + (CANVAS_HEIGHT - horizonY) * (p * p);
      const w = roadTopW + (roadBottomW - roadTopW) * (p * p);
      const xLeft = (CANVAS_WIDTH - w) / 2 + s.roadCurve * (1 - p) * 70;

      for (let lane = 1; lane <= 3; lane++) {
        const lx = xLeft + (w / 4) * lane;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.fillRect(lx - 2.5, y, 5, 14 * p);
      }
    }

    // 3. 3D Streetlights Passing By
    s.streetlights.forEach(sl => {
      const p = Math.max(0.04, 1 - (sl.z / 900));
      const y = horizonY + (CANVAS_HEIGHT - horizonY) * (p * p);
      const w = roadTopW + (roadBottomW - roadTopW) * (p * p);
      const xLeft = (CANVAS_WIDTH - w) / 2 + s.roadCurve * (1 - p) * 70;
      const xRight = (CANVAS_WIDTH + w) / 2 + s.roadCurve * (1 - p) * 70;

      // Left & Right Streetlight Pillars
      const poleH = 70 * p;
      ctx.strokeStyle = '#00f3ff';
      ctx.lineWidth = Math.max(1, 3 * p);
      ctx.beginPath();
      ctx.moveTo(xLeft - 10 * p, y);
      ctx.lineTo(xLeft - 10 * p, y - poleH);
      ctx.lineTo(xLeft + 5 * p, y - poleH);
      ctx.moveTo(xRight + 10 * p, y);
      ctx.lineTo(xRight + 10 * p, y - poleH);
      ctx.lineTo(xRight - 5 * p, y - poleH);
      ctx.stroke();

      // Neon Lamp Glow
      ctx.fillStyle = '#00f3ff';
      ctx.shadowColor = '#00f3ff';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(xLeft + 5 * p, y - poleH, 4 * p, 0, Math.PI * 2);
      ctx.arc(xRight - 5 * p, y - poleH, 4 * p, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    // 4. Collectibles
    s.collectibles.forEach(item => {
      const p = Math.max(0.05, 1 - (item.z / 900));
      const y = horizonY + (CANVAS_HEIGHT - horizonY) * (p * p);
      const w = roadTopW + (roadBottomW - roadTopW) * (p * p);
      const x = (CANVAS_WIDTH / 2) + (item.x * (w * 0.45)) + s.roadCurve * (1 - p) * 70;
      const size = 22 * p;

      ctx.font = `${Math.max(14, size)}px sans-serif`;
      ctx.textAlign = 'center';
      const icon = item.type === 'NITRO' ? '⚡' : item.type === 'SHIELD' ? '🛡️' : '🪙';
      ctx.fillText(icon, x, y);
    });

    // 5. Draw Traffic Cars (3D Realistic Models)
    s.traffic.forEach(car => {
      const p = Math.max(0.05, 1 - (car.z / 900));
      const y = horizonY + (CANVAS_HEIGHT - horizonY) * (p * p);
      const w = roadTopW + (roadBottomW - roadTopW) * (p * p);
      const x = (CANVAS_WIDTH / 2) + (car.x * (w * 0.45)) + s.roadCurve * (1 - p) * 70;
      const carScale = Math.max(0.2, p * 1.35);

      drawRealisticSupercar(ctx, x, y, carScale, car.color, false, false, 0, false);
    });

    // 6. Draw Player 1 Supercar (High-Detail Real Perspective)
    const car1Meta = CAR_SELECTION[selectedCarIdx];
    if (s.p1.alive) {
      const p1ScreenX = (CANVAS_WIDTH / 2) + (s.p1.x * (roadBottomW * 0.45));
      drawRealisticSupercar(
        ctx,
        p1ScreenX,
        CANVAS_HEIGHT - 60,
        1.15,
        car1Meta.color,
        s.p1.nitroActive,
        s.p1.braking,
        s.p1.steerDir,
        s.p1.shield,
        'P1'
      );
    }

    // Draw Player 2 Supercar (in 2-Player Mode)
    const car2Meta = CAR_SELECTION[selectedCar2Idx];
    if (gameMode === 'TWO_PLAYER' && s.p2.alive) {
      const p2ScreenX = (CANVAS_WIDTH / 2) + (s.p2.x * (roadBottomW * 0.45));
      drawRealisticSupercar(
        ctx,
        p2ScreenX,
        CANVAS_HEIGHT - 60,
        1.15,
        car2Meta.color,
        s.p2.nitroActive,
        s.p2.braking,
        s.p2.steerDir,
        s.p2.shield,
        'P2'
      );
    }

    // 7. Exhaust Particles & Nitro Flames
    s.particles.forEach(pt => {
      ctx.fillStyle = pt.color;
      ctx.globalAlpha = pt.alpha;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1.0;
    });
  };

  /**
   * High-Detail Realistic 3D Rear-View Supercar Renderer
   * Renders: Wide racing tires with tread, sleek sculpted metallic chassis,
   * carbon-fiber GT rear wing spoiler, smoked fastback rear glass,
   * continuous LED cyber taillight bar with brake flare, quad chrome exhaust tips,
   * carbon rear diffuser, and steering camber roll physics!
   */
  const drawRealisticSupercar = (
    ctx,
    x,
    y,
    scale,
    bodyColor,
    isNitro,
    isBraking,
    steerDir = 0,
    hasShield = false,
    playerBadge = ''
  ) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    // Chassis Steering Lean / Body Roll Angle
    const rollAngle = steerDir * 0.08;
    ctx.rotate(rollAngle);

    const baseW = 100;
    const baseH = 58;

    // 1. Shield Energy Dome
    if (hasShield) {
      ctx.strokeStyle = '#ffd600';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#ffd600';
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.ellipse(0, -baseH * 0.2, baseW * 0.72, baseH * 0.75, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // 2. Headlight Road Reflection Cone & Ground Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
    ctx.beginPath();
    ctx.ellipse(0, 6, baseW * 0.58, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // 3. Wide Racing Rubber Tires (Left & Right)
    const tireW = 20;
    const tireH = 34;

    ctx.fillStyle = '#0a0a0f'; // Dark rubber
    // Left Tire
    ctx.beginPath();
    ctx.roundRect(-baseW * 0.48, -tireH * 0.4, tireW, tireH, 5);
    ctx.fill();
    // Left Rim Detail
    ctx.fillStyle = '#1e2238';
    ctx.fillRect(-baseW * 0.48 + 4, -tireH * 0.3, tireW - 8, tireH * 0.6);

    // Right Tire
    ctx.fillStyle = '#0a0a0f';
    ctx.beginPath();
    ctx.roundRect(baseW * 0.48 - tireW, -tireH * 0.4, tireW, tireH, 5);
    ctx.fill();
    // Right Rim Detail
    ctx.fillStyle = '#1e2238';
    ctx.fillRect(baseW * 0.48 - tireW + 4, -tireH * 0.3, tireW - 8, tireH * 0.6);

    // 4. Lower Carbon Rear Diffuser & Exhaust Tips
    ctx.fillStyle = '#070914';
    ctx.beginPath();
    ctx.roundRect(-baseW * 0.36, 0, baseW * 0.72, 14, [0, 0, 6, 6]);
    ctx.fill();

    // Diffuser Fins
    ctx.fillStyle = '#161a2e';
    [-20, -7, 7, 20].forEach(fx => {
      ctx.fillRect(fx - 1.5, 2, 3, 11);
    });

    // Quad Chrome Exhaust Tailpipes
    [-30, -22, 22, 30].forEach(ex => {
      ctx.fillStyle = isNitro ? '#00f3ff' : '#64748b';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(ex, 8, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      if (isNitro) {
        ctx.fillStyle = '#00f3ff';
        ctx.shadowColor = '#00f3ff';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(ex, 12, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    });

    // 5. Sculpted Supercar Rear Bumper & Body Fender Curves
    const bodyGrad = ctx.createLinearGradient(0, -baseH * 0.6, 0, 10);
    bodyGrad.addColorStop(0, bodyColor);
    bodyGrad.addColorStop(0.5, '#12162a');
    bodyGrad.addColorStop(1, '#080a14');

    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.moveTo(-baseW * 0.42, 4);
    ctx.lineTo(-baseW * 0.45, -baseH * 0.3);
    ctx.lineTo(-baseW * 0.36, -baseH * 0.65);
    ctx.lineTo(baseW * 0.36, -baseH * 0.65);
    ctx.lineTo(baseW * 0.45, -baseH * 0.3);
    ctx.lineTo(baseW * 0.42, 4);
    ctx.closePath();
    ctx.fill();

    // Metallic Edge Highlight Lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 6. Fastback Smoked Glass Cabin & Engine Louvers
    ctx.fillStyle = '#050711';
    ctx.beginPath();
    ctx.moveTo(-baseW * 0.26, -baseH * 0.62);
    ctx.lineTo(-baseW * 0.22, -baseH * 0.98);
    ctx.lineTo(baseW * 0.22, -baseH * 0.98);
    ctx.lineTo(baseW * 0.26, -baseH * 0.62);
    ctx.closePath();
    ctx.fill();

    // Roof & Rear Glass Reflection Glare
    const glassGrad = ctx.createLinearGradient(-baseW * 0.2, -baseH * 0.95, baseW * 0.2, -baseH * 0.65);
    glassGrad.addColorStop(0, 'rgba(0, 243, 255, 0.35)');
    glassGrad.addColorStop(0.6, 'rgba(255, 255, 255, 0.1)');
    glassGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = glassGrad;
    ctx.fill();

    // Glass Louver Horizontal Lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    for (let l = 1; l <= 3; l++) {
      const ly = -baseH * (0.68 + l * 0.08);
      ctx.beginPath();
      ctx.moveTo(-baseW * (0.23 - l * 0.01), ly);
      ctx.lineTo(baseW * (0.23 - l * 0.01), ly);
      ctx.stroke();
    }

    // 7. Continuous LED Cyber Taillight Cluster (Audi / Porsche style)
    const tailY = -baseH * 0.32;
    ctx.fillStyle = isBraking ? '#ff0033' : isNitro ? '#00f3ff' : '#ff0055';
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = isBraking || isNitro ? 22 : 12;

    ctx.beginPath();
    ctx.moveTo(-baseW * 0.40, tailY);
    ctx.lineTo(-baseW * 0.15, tailY - 3);
    ctx.lineTo(baseW * 0.15, tailY - 3);
    ctx.lineTo(baseW * 0.40, tailY);
    ctx.lineTo(baseW * 0.38, tailY + 4);
    ctx.lineTo(-baseW * 0.38, tailY + 4);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;

    // Glowing Turn Indicators
    if (steerDir === -1) {
      ctx.fillStyle = '#ffd600';
      ctx.shadowColor = '#ffd600';
      ctx.shadowBlur = 10;
      ctx.fillRect(-baseW * 0.42, tailY, 8, 4);
      ctx.shadowBlur = 0;
    } else if (steerDir === 1) {
      ctx.fillStyle = '#ffd600';
      ctx.shadowColor = '#ffd600';
      ctx.shadowBlur = 10;
      ctx.fillRect(baseW * 0.42 - 8, tailY, 8, 4);
      ctx.shadowBlur = 0;
    }

    // 8. Carbon Fiber GT Rear Wing / Spoiler
    const wingY = -baseH * 0.72;
    // Wing Mount Struts
    ctx.fillStyle = '#101424';
    ctx.fillRect(-baseW * 0.22, wingY, 5, baseH * 0.18);
    ctx.fillRect(baseW * 0.22 - 5, wingY, 5, baseH * 0.18);

    // Aerodynamic Wing Blade
    ctx.fillStyle = '#060814';
    ctx.strokeStyle = bodyColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(-baseW * 0.44, wingY - 6, baseW * 0.88, 7, 3);
    ctx.fill();
    ctx.stroke();

    // Wing Endplates (Side Aero Wings)
    ctx.fillStyle = bodyColor;
    ctx.fillRect(-baseW * 0.46, wingY - 10, 4, 14);
    ctx.fillRect(baseW * 0.46 - 4, wingY - 10, 4, 14);

    // 9. Cyber License Plate
    ctx.fillStyle = '#02040a';
    ctx.fillRect(-16, -10, 32, 9);
    ctx.fillStyle = '#00f3ff';
    ctx.font = 'bold 6px Orbitron, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('NEON-GT', 0, -3.5);

    // 10. Player Badge Flag
    if (playerBadge) {
      ctx.fillStyle = playerBadge === 'P1' ? '#00f3ff' : '#ff007f';
      ctx.font = 'bold 10px Orbitron, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`▲ ${playerBadge}`, 0, -baseH * 1.08);
    }

    ctx.restore();
  };

  return (
    <div className="racer-container glass-panel">
      {/* Top Header */}
      <div className="racer-header">
        <button className="btn-secondary" onClick={onLeave}>&larr; HUB</button>
        
        {/* Mode Selector */}
        <div className="game-mode-toggle-group">
          <button 
            className={`mode-pill-btn ${gameMode === 'ENDLESS' ? 'active' : ''}`}
            onClick={() => { setGameMode('ENDLESS'); setGameState('MENU'); }}
          >
            🏁 ENDLESS HIGHWAY
          </button>
          <button 
            className={`mode-pill-btn ${gameMode === 'TIME_ATTACK' ? 'active' : ''}`}
            onClick={() => { setGameMode('TIME_ATTACK'); setGameState('MENU'); }}
          >
            ⏱️ TIME ATTACK
          </button>
          <button 
            className={`mode-pill-btn ${gameMode === 'TWO_PLAYER' ? 'active' : ''}`}
            onClick={() => { setGameMode('TWO_PLAYER'); setGameState('MENU'); }}
          >
            👥 2-PLAYER CLASH
          </button>
        </div>

        <button className="btn-tertiary" onClick={() => setGameState('MENU')}>🚗 GARAGE</button>
      </div>

      {levelUpBanner && (
        <div className="racer-levelup-toast">
          ⚡ ENTERING ZONE {levelUpBanner.zone}: {levelUpBanner.name}! TRAFFIC DENSITY &amp; SPEED UP (+{levelUpBanner.mult}x SCORE)
        </div>
      )}

      {unlockedBanner && (
        <div className="achievement-toast">
          <span>🏆 UNLOCKED: <strong>{unlockedBanner.title}</strong> (+{unlockedBanner.points} pts)</span>
        </div>
      )}

      {/* In-Game HUD Dashboard */}
      {gameState === 'PLAYING' && (
        <div className="racer-hud-bar">
          <div className="hud-metric">
            <span className="hud-lbl">ZONE:</span>
            <span className="hud-val zone-badge" style={{ color: currentZone.color, borderColor: currentZone.color }}>
              Z{currentZone.zone} &bull; {currentZone.name} ({currentZone.mult}x)
            </span>
          </div>

          <div className="hud-metric">
            <span className="hud-lbl">SPEED:</span>
            <span className="hud-val speed" style={{ color: '#00f3ff' }}>{speed} KM/H</span>
          </div>

          <div className="hud-metric">
            <span className="hud-lbl">NITRO BOOST:</span>
            <div className="hud-nitro-meter">
              <div className="hud-nitro-fill" style={{ width: `${nitro}%` }} />
            </div>
          </div>

          {gameMode === 'TIME_ATTACK' && (
            <div className="hud-metric">
              <span className="hud-lbl">TIME LEFT:</span>
              <span className="hud-val timer" style={{ color: timeLeft < 10 ? '#ff0055' : '#ffd600' }}>
                {timeLeft}s
              </span>
            </div>
          )}

          <div className="hud-metric">
            <span className="hud-lbl">CREDITS:</span>
            <span className="hud-val" style={{ color: '#ffd600' }}>🪙 {coins}</span>
          </div>

          <div className="hud-metric">
            <span className="hud-lbl">SCORE:</span>
            <span className="hud-val" style={{ color: '#00ff66' }}>{score} PTS</span>
          </div>
        </div>
      )}

      {/* 2.5D Canvas Area */}
      <div className="racer-canvas-wrap">
        <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="racer-canvas" />

        {/* Garage / Car Selection Overlay */}
        {gameState === 'MENU' && (
          <div className="garage-overlay">
            <h2 className="neon-text">CYBER GARAGE &bull; SELECT VEHICLE</h2>
            
            <div className="garage-grid">
              {CAR_SELECTION.map((car, idx) => (
                <div
                  key={car.id}
                  className={`car-card ${selectedCarIdx === idx ? 'selected' : ''}`}
                  onClick={() => setSelectedCarIdx(idx)}
                >
                  <div className="car-color-preview" style={{ backgroundColor: car.color, boxShadow: `0 0 15px ${car.color}` }} />
                  <h4 style={{ color: '#fff', margin: '8px 0 4px 0' }}>{car.name}</h4>
                  <p className="car-spec">{car.special}</p>
                  <div className="car-stats">
                    <div>SPEED: <strong>{car.maxSpeed} KM/H</strong></div>
                    <div>ACCEL: <strong>{car.accel}x</strong></div>
                  </div>
                </div>
              ))}
            </div>

            {gameMode === 'TWO_PLAYER' && (
              <div style={{ marginTop: '12px', textAlign: 'center' }}>
                <span style={{ color: '#ff007f', fontWeight: 'bold' }}>PLAYER 2 CAR: </span>
                <select 
                  value={selectedCar2Idx} 
                  onChange={(e) => setSelectedCar2Idx(Number(e.target.value))}
                  className="p2-car-select"
                >
                  {CAR_SELECTION.map((c, i) => (
                    <option key={c.id} value={i}>{c.name} ({c.special})</option>
                  ))}
                </select>
              </div>
            )}

            <button className="btn-primary start-race-btn" onClick={startGame}>
              🚀 START RACE NOW
            </button>
          </div>
        )}

        {/* Game Over Screen */}
        {gameState === 'GAMEOVER' && (
          <div className="finish-overlay">
            <h2 className="neon-text" style={{ color: '#ff0055' }}>
              💥 RACE OVER
            </h2>
            <div className="gameover-stats">
              <div>FINAL SCORE: <strong style={{ color: '#00ff66' }}>{score} PTS</strong></div>
              <div>DISTANCE: <strong style={{ color: '#00f3ff' }}>{distance} M</strong></div>
              <div>COINS COLLECTED: <strong style={{ color: '#ffd600' }}>🪙 {coins}</strong></div>
              <div>ALL-TIME BEST: <strong style={{ color: '#ff007f' }}>{highScore} PTS</strong></div>
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <button className="btn-primary" onClick={startGame}>RACE AGAIN</button>
              <button className="btn-tertiary" onClick={() => setGameState('MENU')}>GARAGE</button>
              <button className="btn-secondary" onClick={onLeave}>BACK TO HUB</button>
            </div>
          </div>
        )}

        {/* Mobile On-Screen Touch Controls */}
        {gameState === 'PLAYING' && (
          <div className="racer-mobile-controls">
            <div className="racer-mobile-steer">
              <button
                className="racer-touch-btn steer-btn"
                onTouchStart={() => { stateRef.current.keys['ArrowLeft'] = true; }}
                onTouchEnd={() => { stateRef.current.keys['ArrowLeft'] = false; }}
                onMouseDown={() => { stateRef.current.keys['ArrowLeft'] = true; }}
                onMouseUp={() => { stateRef.current.keys['ArrowLeft'] = false; }}
              >
                ◀ LEFT
              </button>
              <button
                className="racer-touch-btn steer-btn"
                onTouchStart={() => { stateRef.current.keys['ArrowRight'] = true; }}
                onTouchEnd={() => { stateRef.current.keys['ArrowRight'] = false; }}
                onMouseDown={() => { stateRef.current.keys['ArrowRight'] = true; }}
                onMouseUp={() => { stateRef.current.keys['ArrowRight'] = false; }}
              >
                RIGHT ▶
              </button>
            </div>
            <div className="racer-mobile-actions">
              <button
                className="racer-touch-btn brake-btn"
                onTouchStart={() => { stateRef.current.keys['ArrowDown'] = true; }}
                onTouchEnd={() => { stateRef.current.keys['ArrowDown'] = false; }}
                onMouseDown={() => { stateRef.current.keys['ArrowDown'] = true; }}
                onMouseUp={() => { stateRef.current.keys['ArrowDown'] = false; }}
              >
                🛑 BRAKE
              </button>
              <button
                className="racer-touch-btn nitro-btn"
                onTouchStart={() => { stateRef.current.keys['Space'] = true; }}
                onTouchEnd={() => { stateRef.current.keys['Space'] = false; }}
                onMouseDown={() => { stateRef.current.keys['Space'] = true; }}
                onMouseUp={() => { stateRef.current.keys['Space'] = false; }}
              >
                ⚡ NITRO
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Controls Legend */}
      <div className="racer-controls-legend">
        {gameMode === 'TWO_PLAYER' ? (
          <>
            <div>🔵 <strong>P1:</strong> A/D to Steer &bull; W/S Speed &bull; <strong style={{ color: '#00f3ff' }}>SPACE</strong> Nitro</div>
            <div>🔴 <strong>P2:</strong> Left/Right Steer &bull; Up/Down Speed &bull; <strong style={{ color: '#ff007f' }}>ENTER</strong> Nitro</div>
          </>
        ) : (
          <>
            <div>🎮 <strong>STEER:</strong> A / D or Left / Right Arrows</div>
            <div>⚡ <strong>THROTTLE & BRAKE:</strong> W / S or Up / Down Arrows</div>
            <div>🔥 <strong>NITRO BOOST:</strong> SPACE or SHIFT</div>
          </>
        )}
      </div>
    </div>
  );
};

export default CyberRacerGame;
