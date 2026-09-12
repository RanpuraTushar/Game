import React, { useEffect, useRef, useState, useCallback } from 'react';
import { api } from '../../../services/api';
import './WatermelonGame.css';

// 11 Fruit Evolution Tiers (radius, score, colors, labels, emojis)
const FRUIT_TIERS = [
  { id: 0, name: 'Cherry', emoji: '🍒', radius: 16, score: 2, color: '#ff2a5f', innerColor: '#d61b4b', leafColor: '#00e676' },
  { id: 1, name: 'Strawberry', emoji: '🍓', radius: 22, score: 4, color: '#ff4d6d', innerColor: '#c9184a', leafColor: '#00e676' },
  { id: 2, name: 'Grape', emoji: '🍇', radius: 28, score: 8, color: '#a855f7', innerColor: '#7e22ce', leafColor: '#a7f3d0' },
  { id: 3, name: 'Tangerine', emoji: '🍊', radius: 36, score: 16, color: '#ff8800', innerColor: '#ea580c', leafColor: '#4ade80' },
  { id: 4, name: 'Persimmon', emoji: '🍎', radius: 44, score: 32, color: '#ef4444', innerColor: '#b91c1c', leafColor: '#86efac' },
  { id: 5, name: 'Apple', emoji: '🍐', radius: 54, score: 64, color: '#a3e635', innerColor: '#65a30d', leafColor: '#15803d' },
  { id: 6, name: 'Peach', emoji: '🍑', radius: 65, score: 128, color: '#fda4af', innerColor: '#f43f5e', leafColor: '#22c55e' },
  { id: 7, name: 'Pineapple', emoji: '🍍', radius: 78, score: 256, color: '#facc15', innerColor: '#ca8a04', leafColor: '#16a34a' },
  { id: 8, name: 'Melon', emoji: '🍈', radius: 93, score: 512, color: '#86efac', innerColor: '#22c55e', leafColor: '#15803d' },
  { id: 9, name: 'Watermelon', emoji: '🍉', radius: 110, score: 1024, color: '#10b981', innerColor: '#047857', leafColor: '#ef4444' },
  { id: 10, name: 'King Watermelon', emoji: '👑🍉', radius: 128, score: 2048, color: '#059669', innerColor: '#065f46', leafColor: '#ffd700' }
];

// Progressive Dynamic Difficulty Scaling System
// As the player scores higher, larger fruits can spawn, danger timer tightens,
// bounciness scales up, dropper experiences magnetic rift sway, and score multipliers increase!
const DIFFICULTY_LEVELS = [
  { level: 1, name: 'NOVICE', minScore: 0, color: '#00e676', maxTier: 2, dangerTime: 3.5, bounce: 0.20, sway: 0, multiplier: 1.0, cooldown: 500 },
  { level: 2, name: 'ADEPT', minScore: 400, color: '#00f3ff', maxTier: 3, dangerTime: 3.0, bounce: 0.23, sway: 0.9, multiplier: 1.25, cooldown: 470 },
  { level: 3, name: 'CHALLENGER', minScore: 1100, color: '#ffd600', maxTier: 4, dangerTime: 2.5, bounce: 0.27, sway: 1.6, multiplier: 1.5, cooldown: 440 },
  { level: 4, name: 'EXPERT', minScore: 2400, color: '#ff9100', maxTier: 5, dangerTime: 2.0, bounce: 0.31, sway: 2.4, multiplier: 2.0, cooldown: 410 },
  { level: 5, name: 'CHAOS MASTER', minScore: 4500, color: '#ff0055', maxTier: 5, dangerTime: 1.6, bounce: 0.35, sway: 3.2, multiplier: 2.5, cooldown: 380 }
];

const getDifficultyLevel = (score) => {
  for (let i = DIFFICULTY_LEVELS.length - 1; i >= 0; i--) {
    if (score >= DIFFICULTY_LEVELS[i].minScore) {
      return DIFFICULTY_LEVELS[i];
    }
  }
  return DIFFICULTY_LEVELS[0];
};

// Synthesizer for rich audio without external mp3 files
class WatermelonAudio {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playLevelUp() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const notes = [440, 554.37, 659.25, 880];
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        try {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
          gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start();
          osc.stop(this.ctx.currentTime + 0.32);
        } catch (e) {}
      }, idx * 75);
    });
  }

  playDrop() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(180, this.ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.11);
    } catch (e) {}
  }

  playBounce(speed) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const vol = Math.min(0.2, Math.max(0.03, speed * 0.03));
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(60, this.ctx.currentTime + 0.06);
      gain.gain.setValueAtTime(vol, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.06);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.07);
    } catch (e) {}
  }

  playMerge(tier, combo = 1) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    // Musical pentatonic scale base frequencies
    const baseFreqs = [261.6, 293.7, 329.6, 392.0, 440.0, 523.3, 587.3, 659.3, 784.0, 880.0, 1046.5];
    const freq = (baseFreqs[tier] || 440) * (1 + (combo - 1) * 0.08);

    try {
      const now = this.ctx.currentTime;
      // Main tone
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(freq, now);
      osc1.frequency.exponentialRampToValueAtTime(freq * 1.5, now + 0.18);
      gain1.gain.setValueAtTime(0.28, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc1.connect(gain1);
      gain1.connect(this.ctx.destination);
      osc1.start();
      osc1.stop(now + 0.23);

      // Harmony shimmer
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(freq * 1.25, now);
      osc2.frequency.exponentialRampToValueAtTime(freq * 2, now + 0.2);
      gain2.gain.setValueAtTime(0.18, now);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);
      osc2.start();
      osc2.stop(now + 0.26);
    } catch (e) {}
  }

  playGameOver() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.exponentialRampToValueAtTime(65, now + 0.6);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(now + 0.7);
    } catch (e) {}
  }

  playKingWatermelonFanfare() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const chords = [523.25, 659.25, 783.99, 1046.5];
    chords.forEach((f, i) => {
      setTimeout(() => {
        try {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(f, this.ctx.currentTime);
          gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.4);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start();
          osc.stop(this.ctx.currentTime + 0.42);
        } catch (e) {}
      }, i * 90);
    });
  }
}

const audioFX = new WatermelonAudio();

// Internal World Dimensions
const GAME_WIDTH = 420;
const GAME_HEIGHT = 600;
const DANGER_LINE_Y = 100;
const DROPPER_Y = 48;
const GRAVITY = 0.28;
const RESTITUTION = 0.22; // Bounciness
const FRICTION = 0.985;   // Rolling air friction
const WALL_RESTITUTION = 0.2;

const WatermelonGame = ({ user, onLeave }) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  // Game state
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [nextTier, setNextTier] = useState(() => Math.floor(Math.random() * (SPAWN_MAX_TIER + 1)));
  const [gameState, setGameState] = useState('PLAYING'); // 'PLAYING', 'GAMEOVER'
  const [muted, setMuted] = useState(false);
  const [watermelonCreated, setWatermelonCreated] = useState(false);
  const [dangerWarning, setDangerWarning] = useState(false);
  const [showEvolutionModal, setShowEvolutionModal] = useState(false);

  // Internal game engine references
  const engineRef = useRef({
    fruits: [],
    particles: [],
    popups: [],
    dropperX: GAME_WIDTH / 2,
    currentTier: 0,
    canDrop: true,
    lastDropTime: 0,
    dangerTimer: 0,
    comboCount: 0,
    lastMergeTime: 0,
    isGameOver: false,
    score: 0,
    highScore: 0,
    touchAiming: false,
    level: 1,
    levelBannerTimer: 0,
    levelBannerTitle: '',
    levelBannerDesc: '',
    levelBannerColor: '#00e676'
  });

  // Load High Score on mount
  useEffect(() => {
    const saved = localStorage.getItem('watermelon_merge_highscore');
    if (saved) {
      const val = parseInt(saved, 10);
      setHighScore(val);
      engineRef.current.highScore = val;
    }
  }, []);

  const getRandomSpawnTier = (currentScore = 0) => {
    const diff = getDifficultyLevel(currentScore);
    // At higher difficulty, higher tier fruits enter the spawn pool
    if (diff.maxTier > 2 && Math.random() < 0.4) {
      return 2 + Math.floor(Math.random() * (diff.maxTier - 1));
    }
    return Math.floor(Math.random() * Math.min(3, diff.maxTier + 1));
  };

  // Trigger drop with difficulty dynamics (sway, bounce, cooldown)
  const dropFruit = useCallback(() => {
    const eng = engineRef.current;
    if (!eng.canDrop || eng.isGameOver) return;

    const diff = getDifficultyLevel(eng.score);
    const tierInfo = FRUIT_TIERS[eng.currentTier];

    // Dropper magnetic sway turbulence at higher difficulty
    const sway = diff.sway > 0 ? Math.sin(Date.now() * 0.0035) * diff.sway * 8 : 0;
    const targetX = eng.dropperX + sway;
    const clampedX = Math.max(tierInfo.radius + 6, Math.min(GAME_WIDTH - tierInfo.radius - 6, targetX));

    // Create new falling fruit
    eng.fruits.push({
      id: Math.random() + '_' + Date.now(),
      tier: eng.currentTier,
      x: clampedX,
      y: DROPPER_Y,
      vx: (Math.random() - 0.5) * (diff.sway * 0.3),
      vy: 1.2,
      radius: tierInfo.radius,
      mass: Math.pow(tierInfo.radius, 2),
      isSettled: false,
      rotation: 0,
      vRot: (Math.random() - 0.5) * 0.05,
      pulse: 1.25 // spawn pop scale
    });

    audioFX.playDrop();

    eng.canDrop = false;
    eng.lastDropTime = Date.now();

    // Prepare next fruit based on current score & difficulty level
    eng.currentTier = nextTier;
    const nextRandom = getRandomSpawnTier(eng.score);
    setNextTier(nextRandom);

    // Dynamic cooldown based on difficulty
    setTimeout(() => {
      eng.canDrop = true;
    }, diff.cooldown);
  }, [nextTier]);

  // Restart Game
  const restartGame = useCallback(() => {
    const eng = engineRef.current;
    eng.fruits = [];
    eng.particles = [];
    eng.popups = [];
    eng.dropperX = GAME_WIDTH / 2;
    eng.currentTier = getRandomSpawnTier(0);
    eng.canDrop = true;
    eng.dangerTimer = 0;
    eng.comboCount = 0;
    eng.isGameOver = false;
    eng.score = 0;
    eng.level = 1;
    eng.levelBannerTimer = 0;
    eng.levelBannerTitle = '';
    eng.levelBannerDesc = '';
    eng.levelBannerColor = '#00e676';

    setScore(0);
    setGameState('PLAYING');
    setDangerWarning(false);
    setWatermelonCreated(false);
    setNextTier(getRandomSpawnTier(0));
  }, []);

  // Submit high score
  const handleGameOver = useCallback(async (finalScore) => {
    const eng = engineRef.current;
    eng.isGameOver = true;
    setGameState('GAMEOVER');
    audioFX.playGameOver();

    if (finalScore > eng.highScore) {
      eng.highScore = finalScore;
      setHighScore(finalScore);
      localStorage.setItem('watermelon_merge_highscore', finalScore.toString());
    }

    if (user?.id) {
      try {
        await api.submitScore('WATERMELON_MERGE', finalScore, finalScore >= 1000, user);
      } catch (e) {}
    }
  }, [user]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      const eng = engineRef.current;
      if (eng.isGameOver) return;

      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        eng.dropperX = Math.max(30, eng.dropperX - 24);
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        eng.dropperX = Math.min(GAME_WIDTH - 30, eng.dropperX + 24);
      } else if (e.key === ' ' || e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        dropFruit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dropFruit]);

  // Mouse & Touch aiming handlers
  const handlePointerMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas || engineRef.current.isGameOver) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const scaleX = GAME_WIDTH / rect.width;
    const rawX = (clientX - rect.left) * scaleX;

    const currentRadius = FRUIT_TIERS[engineRef.current.currentTier].radius;
    engineRef.current.dropperX = Math.max(currentRadius + 6, Math.min(GAME_WIDTH - currentRadius - 6, rawX));
  };

  const handlePointerDown = (e) => {
    engineRef.current.touchAiming = true;
    handlePointerMove(e);
  };

  const handlePointerUp = (e) => {
    if (engineRef.current.isGameOver) return;
    if (e.cancelable) e.preventDefault();
    dropFruit();
    engineRef.current.touchAiming = false;
  };

  // Main 60FPS Physics & Canvas Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;

    const render = () => {
      const eng = engineRef.current;

      // 1. UPDATE FRUITS PHYSICS
      const fruits = eng.fruits;

      // Gravity & Velocity update
      for (let i = 0; i < fruits.length; i++) {
        const f = fruits[i];
        f.vy += GRAVITY;
        f.x += f.vx;
        f.y += f.vy;
        f.rotation += f.vRot;
        f.vx *= FRICTION;
        f.vRot *= 0.98;

        if (f.pulse > 1) {
          f.pulse -= 0.03;
          if (f.pulse < 1) f.pulse = 1;
        }

        // Wall collisions (Left, Right, Bottom)
        const leftLimit = f.radius + 6;
        const rightLimit = GAME_WIDTH - f.radius - 6;
        const bottomLimit = GAME_HEIGHT - f.radius - 6;

        if (f.x < leftLimit) {
          f.x = leftLimit;
          f.vx = -f.vx * WALL_RESTITUTION;
          f.vRot = -f.vRot * 0.5;
        } else if (f.x > rightLimit) {
          f.x = rightLimit;
          f.vx = -f.vx * WALL_RESTITUTION;
          f.vRot = -f.vRot * 0.5;
        }

        if (f.y > bottomLimit) {
          f.y = bottomLimit;
          f.vy = -f.vy * RESTITUTION;
          f.vx *= 0.92;
          if (Math.abs(f.vy) < 0.3) f.vy = 0;
        }
      }

      // Circle to Circle Collisions (Multiple iterations for stability)
      const merges = [];
      const numIterations = 6;

      for (let iter = 0; iter < numIterations; iter++) {
        for (let i = 0; i < fruits.length; i++) {
          for (let j = i + 1; j < fruits.length; j++) {
            const a = fruits[i];
            const b = fruits[j];

            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 0.001;
            const minDist = a.radius + b.radius;

            if (dist < minDist) {
              // Check if fruits are of identical tier and can merge
              if (iter === 0 && a.tier === b.tier && a.tier < FRUIT_TIERS.length - 1 && !a.merged && !b.merged) {
                a.merged = true;
                b.merged = true;
                merges.push({ a, b, x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, tier: a.tier });
                continue;
              }

              // Normal vector
              const nx = dx / dist;
              const ny = dy / dist;

              // Overlap resolution
              const overlap = minDist - dist;
              const totalMass = a.mass + b.mass;
              const ratioA = b.mass / totalMass;
              const ratioB = a.mass / totalMass;

              a.x -= nx * overlap * ratioA;
              a.y -= ny * overlap * ratioA;
              b.x += nx * overlap * ratioB;
              b.y += ny * overlap * ratioB;

              // Relative velocity
              const rvx = b.vx - a.vx;
              const rvy = b.vy - a.vy;
              const velAlongNormal = rvx * nx + rvy * ny;

              if (velAlongNormal < 0) {
                const curDiff = getDifficultyLevel(eng.score);
                const impulse = -(1 + curDiff.bounce) * velAlongNormal / (1 / a.mass + 1 / b.mass);
                a.vx -= (impulse / a.mass) * nx;
                a.vy -= (impulse / a.mass) * ny;
                b.vx += (impulse / b.mass) * nx;
                b.vy += (impulse / b.mass) * ny;

                // Friction & spin transfer
                const tx = -ny;
                const ty = nx;
                const velAlongTangent = rvx * tx + rvy * ty;
                const frictionImpulse = velAlongTangent * 0.05;
                a.vRot += (frictionImpulse / a.radius) * 0.1;
                b.vRot -= (frictionImpulse / b.radius) * 0.1;

                if (Math.abs(velAlongNormal) > 2) {
                  audioFX.playBounce(Math.abs(velAlongNormal));
                }
              }
            }
          }
        }
      }

      // 2. PROCESS MERGES
      if (merges.length > 0) {
        const now = Date.now();
        if (now - eng.lastMergeTime < 1400) {
          eng.comboCount++;
        } else {
          eng.comboCount = 1;
        }
        eng.lastMergeTime = now;

        const curDiff = getDifficultyLevel(eng.score);

        for (const m of merges) {
          // Remove merged fruits
          eng.fruits = eng.fruits.filter(f => f !== m.a && f !== m.b);

          const newTier = m.tier + 1;
          const tierInfo = FRUIT_TIERS[newTier];
          const gainedPoints = Math.round(tierInfo.score * eng.comboCount * curDiff.multiplier);

          eng.score += gainedPoints;
          setScore(eng.score);

          // Check if difficulty leveled up
          const newDiff = getDifficultyLevel(eng.score);
          if (newDiff.level > eng.level) {
            eng.level = newDiff.level;
            eng.levelBannerTimer = 180; // ~3s display
            eng.levelBannerTitle = `⚡ LEVEL ${newDiff.level} • ${newDiff.name} ⚡`;
            eng.levelBannerDesc = `Difficulty Increased! ${newDiff.multiplier}x Multiplier Active!`;
            eng.levelBannerColor = newDiff.color;
            audioFX.playLevelUp();

            // Fireworks burst for leveling up
            for (let lp = 0; lp < 32; lp++) {
              const lAngle = Math.random() * Math.PI * 2;
              const lSpeed = 3 + Math.random() * 6.5;
              eng.particles.push({
                x: GAME_WIDTH / 2,
                y: 280,
                vx: Math.cos(lAngle) * lSpeed,
                vy: Math.sin(lAngle) * lSpeed,
                radius: 3 + Math.random() * 4,
                color: Math.random() > 0.4 ? newDiff.color : '#ffffff',
                life: 1.4,
                decay: 0.016
              });
            }
          }

          // Spawn new higher tier fruit
          const newFruit = {
            id: Math.random() + '_' + Date.now(),
            tier: newTier,
            x: Math.max(tierInfo.radius + 6, Math.min(GAME_WIDTH - tierInfo.radius - 6, m.x)),
            y: m.y,
            vx: (Math.random() - 0.5) * 1.5,
            vy: -1.6, // playful bounce pop
            radius: tierInfo.radius,
            mass: Math.pow(tierInfo.radius, 2),
            rotation: 0,
            vRot: (Math.random() - 0.5) * 0.08,
            pulse: 1.4
          };
          eng.fruits.push(newFruit);

          // Audio & Special Effects
          audioFX.playMerge(newTier, eng.comboCount);

          if (newTier >= 9 && !watermelonCreated) {
            setWatermelonCreated(true);
            audioFX.playKingWatermelonFanfare();
          }

          // Spawn Pop-up Score Text
          eng.popups.push({
            text: `+${gainedPoints}${eng.comboCount > 1 ? ` x${eng.comboCount} COMBO!` : ''}`,
            x: m.x,
            y: m.y - 12,
            alpha: 1,
            color: tierInfo.color,
            fontSize: eng.comboCount > 1 ? 20 : 16
          });

          // Juicy Burst Particles
          for (let p = 0; p < 16; p++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1.5 + Math.random() * 4.5;
            eng.particles.push({
              x: m.x,
              y: m.y,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed,
              radius: 2 + Math.random() * 4,
              color: Math.random() > 0.3 ? tierInfo.color : '#ffffff',
              life: 1,
              decay: 0.02 + Math.random() * 0.025
            });
          }
        }
      }

      // 3. CHECK DANGER LINE & GAME OVER
      let hasOverflow = false;
      for (const f of eng.fruits) {
        // Consider fruits that have settled or are near top
        if (f.y - f.radius < DANGER_LINE_Y && f.y > DROPPER_Y + 20 && Math.abs(f.vy) < 1.2) {
          hasOverflow = true;
          break;
        }
      }

      const activeDiff = getDifficultyLevel(eng.score);

      if (hasOverflow && !eng.isGameOver) {
        eng.dangerTimer += 1 / 60; // elapsed seconds
        setDangerWarning(true);
        if (eng.dangerTimer >= activeDiff.dangerTime) {
          handleGameOver(eng.score);
        }
      } else {
        eng.dangerTimer = Math.max(0, eng.dangerTimer - 2 / 60);
        if (eng.dangerTimer === 0) setDangerWarning(false);
      }

      // 4. DRAW CANVAS SCENE
      ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

      // Cyber Container Background & Glass Grid
      const bgGrad = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
      bgGrad.addColorStop(0, '#0a0e1a');
      bgGrad.addColorStop(1, '#05070e');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

      // Subtle background grid
      ctx.strokeStyle = 'rgba(0, 243, 255, 0.03)';
      ctx.lineWidth = 1;
      for (let x = 20; x < GAME_WIDTH; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, GAME_HEIGHT);
        ctx.stroke();
      }
      for (let y = 20; y < GAME_HEIGHT; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(GAME_WIDTH, y);
        ctx.stroke();
      }

      // Danger / Overflow Line
      ctx.save();
      ctx.setLineDash([8, 6]);
      ctx.strokeStyle = eng.dangerTimer > 0 ? '#ff0055' : 'rgba(255, 0, 85, 0.35)';
      ctx.lineWidth = eng.dangerTimer > 0 ? 2.5 : 1.5;
      ctx.beginPath();
      ctx.moveTo(8, DANGER_LINE_Y);
      ctx.lineTo(GAME_WIDTH - 8, DANGER_LINE_Y);
      ctx.stroke();
      ctx.restore();

      // Danger Warning Timer Label (Uses dynamic danger deadline)
      if (eng.dangerTimer > 0.3 && !eng.isGameOver) {
        ctx.fillStyle = '#ff0055';
        ctx.font = 'bold 13px Outfit, sans-serif';
        ctx.textAlign = 'center';
        const remaining = Math.max(0, (activeDiff.dangerTime - eng.dangerTimer).toFixed(1));
        ctx.fillText(`⚠️ DANGER: OVERFLOW IN ${remaining}s!`, GAME_WIDTH / 2, DANGER_LINE_Y - 8);
      }

      // Dropper Laser Guide & Next Drop Fruit Preview with Dynamic Aim Sway
      if (eng.canDrop && !eng.isGameOver) {
        const dropTier = FRUIT_TIERS[eng.currentTier];
        const currentR = dropTier.radius;

        // Apply magnetic sway at higher difficulty
        const sway = activeDiff.sway > 0 ? Math.sin(Date.now() * 0.0035) * activeDiff.sway * 8 : 0;
        const actualDropperX = Math.max(currentR + 6, Math.min(GAME_WIDTH - currentR - 6, eng.dropperX + sway));

        // Dotted laser guide line down to jar bottom
        ctx.save();
        ctx.setLineDash([4, 6]);
        ctx.strokeStyle = activeDiff.level >= 3 ? activeDiff.color : 'rgba(0, 243, 255, 0.35)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(actualDropperX, DROPPER_Y + currentR);
        ctx.lineTo(actualDropperX, GAME_HEIGHT - 10);
        ctx.stroke();
        ctx.restore();

        // Draw active fruit waiting in dropper
        drawFruit(ctx, actualDropperX, DROPPER_Y, dropTier, 0, 1.0, true);
      }

      // Draw Settled Fruits
      for (const f of eng.fruits) {
        const tierInfo = FRUIT_TIERS[f.tier];
        drawFruit(ctx, f.x, f.y, tierInfo, f.rotation, f.pulse || 1);
      }

      // Draw Juicy Particles
      for (let i = eng.particles.length - 1; i >= 0; i--) {
        const p = eng.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.12; // particle gravity
        p.life -= p.decay;

        if (p.life <= 0) {
          eng.particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Draw Floating Score Popups
      for (let i = eng.popups.length - 1; i >= 0; i--) {
        const pop = eng.popups[i];
        pop.y -= 1.1;
        pop.alpha -= 0.02;

        if (pop.alpha <= 0) {
          eng.popups.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = pop.alpha;
        ctx.font = `bold ${pop.fontSize}px Outfit, sans-serif`;
        ctx.fillStyle = pop.color;
        ctx.textAlign = 'center';
        ctx.shadowColor = pop.color;
        ctx.shadowBlur = 10;
        ctx.fillText(pop.text, pop.x, pop.y);
        ctx.restore();
      }

      // Draw Level Up Celebratory Holographic Banner
      if (eng.levelBannerTimer > 0) {
        ctx.save();
        const bannerAlpha = Math.min(1, eng.levelBannerTimer / 25);
        ctx.globalAlpha = bannerAlpha;
        ctx.fillStyle = 'rgba(10, 14, 28, 0.92)';
        ctx.strokeStyle = eng.levelBannerColor;
        ctx.lineWidth = 2.5;
        ctx.shadowColor = eng.levelBannerColor;
        ctx.shadowBlur = 24;
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(24, 230, GAME_WIDTH - 48, 86, 14);
        } else {
          ctx.rect(24, 230, GAME_WIDTH - 48, 86);
        }
        ctx.fill();
        ctx.stroke();

        ctx.shadowBlur = 8;
        ctx.fillStyle = eng.levelBannerColor;
        ctx.font = 'bold 17px Orbitron, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(eng.levelBannerTitle, GAME_WIDTH / 2, 264);

        ctx.fillStyle = '#ffffff';
        ctx.font = '600 12px Outfit, sans-serif';
        ctx.fillText(eng.levelBannerDesc, GAME_WIDTH / 2, 294);
        ctx.restore();

        eng.levelBannerTimer--;
      }

      // Jar Container Borders with Neon Glow
      ctx.save();
      ctx.strokeStyle = eng.dangerTimer > 0 ? 'rgba(255, 0, 85, 0.8)' : 'rgba(0, 243, 255, 0.5)';
      ctx.shadowColor = eng.dangerTimer > 0 ? '#ff0055' : '#00f3ff';
      ctx.shadowBlur = eng.dangerTimer > 0 ? 15 : 8;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(4, 0);
      ctx.lineTo(4, GAME_HEIGHT - 4);
      ctx.lineTo(GAME_WIDTH - 4, GAME_HEIGHT - 4);
      ctx.lineTo(GAME_WIDTH - 4, 0);
      ctx.stroke();
      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [watermelonCreated, handleGameOver]);

  // High Quality Stylized Fruit Renderer
  const drawFruit = (ctx, x, y, tier, rotation, pulse = 1, isDropper = false) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.scale(pulse, pulse);

    const r = tier.radius;

    // Outer Glow / Shadow
    ctx.shadowColor = tier.color;
    ctx.shadowBlur = isDropper ? 10 : 8;

    // Body Gradient
    const grad = ctx.createRadialGradient(-r * 0.3, -r * 0.35, r * 0.1, 0, 0, r);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.25, tier.color);
    grad.addColorStop(0.85, tier.innerColor);
    grad.addColorStop(1, '#050505');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0; // reset shadow for crisp details

    // Distinct Details per Fruit Tier
    if (tier.id === 0) {
      // 🍒 Cherry Stem & Shine
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, -r);
      ctx.quadraticCurveTo(r * 0.6, -r * 1.6, r * 0.8, -r * 1.2);
      ctx.stroke();
    } else if (tier.id === 1) {
      // 🍓 Strawberry Seeds
      ctx.fillStyle = '#fef08a';
      for (let s = 0; s < 7; s++) {
        const angle = (s / 7) * Math.PI * 2;
        const seedR = r * 0.55;
        ctx.beginPath();
        ctx.arc(Math.cos(angle) * seedR, Math.sin(angle) * seedR, 1.4, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (tier.id === 7) {
      // 🍍 Pineapple Cross Hatching
      ctx.strokeStyle = 'rgba(113, 63, 18, 0.4)';
      ctx.lineWidth = 1.5;
      for (let k = -r * 0.6; k <= r * 0.6; k += 14) {
        ctx.beginPath();
        ctx.moveTo(k, -r * 0.7);
        ctx.lineTo(k + 12, r * 0.7);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(k + 12, -r * 0.7);
        ctx.lineTo(k, r * 0.7);
        ctx.stroke();
      }
    } else if (tier.id === 8) {
      // 🍈 Melon Cantaloupe Netting
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1.5;
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.75, a, a + Math.PI / 6);
        ctx.stroke();
      }
    } else if (tier.id >= 9) {
      // 🍉 Watermelon Stripes
      ctx.strokeStyle = 'rgba(6, 78, 59, 0.65)';
      ctx.lineWidth = r * 0.14;
      for (let st = -r * 0.8; st <= r * 0.8; st += r * 0.42) {
        ctx.beginPath();
        ctx.arc(st, 0, r * 0.95, -Math.PI / 2, Math.PI / 2);
        ctx.stroke();
      }
    }

    // Cute Expressive Kawaii Faces for All Fruits
    const eyeOffsetX = r * 0.28;
    const eyeOffsetY = -r * 0.05;
    const eyeSize = Math.max(1.8, r * 0.09);

    // Eyes
    ctx.fillStyle = '#111827';
    ctx.beginPath();
    ctx.arc(-eyeOffsetX, eyeOffsetY, eyeSize, 0, Math.PI * 2);
    ctx.arc(eyeOffsetX, eyeOffsetY, eyeSize, 0, Math.PI * 2);
    ctx.fill();

    // Eye sparkle
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-eyeOffsetX - eyeSize * 0.3, eyeOffsetY - eyeSize * 0.3, eyeSize * 0.4, 0, Math.PI * 2);
    ctx.arc(eyeOffsetX - eyeSize * 0.3, eyeOffsetY - eyeSize * 0.3, eyeSize * 0.4, 0, Math.PI * 2);
    ctx.fill();

    // Blush cheeks
    ctx.fillStyle = 'rgba(255, 99, 132, 0.45)';
    ctx.beginPath();
    ctx.arc(-eyeOffsetX - eyeSize * 0.8, eyeOffsetY + eyeSize * 1.2, eyeSize * 0.9, 0, Math.PI * 2);
    ctx.arc(eyeOffsetX + eyeSize * 0.8, eyeOffsetY + eyeSize * 1.2, eyeSize * 0.9, 0, Math.PI * 2);
    ctx.fill();

    // Smile Mouth
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = Math.max(1.2, r * 0.04);
    ctx.beginPath();
    ctx.arc(0, eyeOffsetY + eyeSize * 0.8, eyeSize * 0.9, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();

    // Crown for King Watermelon
    if (tier.id === 10) {
      ctx.fillStyle = '#facc15';
      ctx.strokeStyle = '#ca8a04';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-r * 0.5, -r * 0.9);
      ctx.lineTo(-r * 0.3, -r * 1.3);
      ctx.lineTo(0, -r * 1.05);
      ctx.lineTo(r * 0.3, -r * 1.3);
      ctx.lineTo(r * 0.5, -r * 0.9);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    ctx.restore();
  };

  const toggleSound = () => {
    const nextMuted = !muted;
    setMuted(nextMuted);
    audioFX.muted = nextMuted;
  };

  const currentDiff = getDifficultyLevel(score);
  const nextTierInfo = FRUIT_TIERS[nextTier];

  return (
    <div className="watermelon-viewport">
      {/* Top Header Controls & Stats */}
      <header className="wm-header glass-panel">
        <div className="wm-header-left">
          <button className="wm-back-btn" onClick={onLeave} title="Back to Game Hub">
            ← Hub
          </button>
          <div className="wm-title-block">
            <span className="wm-title-icon">🍉</span>
            <span className="wm-title-text">SUIKA <span className="neon-accent">MERGE</span></span>
          </div>
        </div>

        <div className="wm-header-center">
          <div className="wm-stat-pill">
            <span className="stat-label">SCORE</span>
            <span className="stat-value">{score}</span>
          </div>
          <div className="wm-stat-pill wm-diff-pill" style={{ borderColor: currentDiff.color }}>
            <span className="stat-label">DIFFICULTY</span>
            <span className="stat-value diff-text" style={{ color: currentDiff.color }}>
              L{currentDiff.level} • {currentDiff.name}
            </span>
          </div>
          <div className="wm-stat-pill wm-best-pill">
            <span className="stat-label">BEST</span>
            <span className="stat-value">{highScore}</span>
          </div>
        </div>

        <div className="wm-header-right">
          <button
            className={`wm-icon-btn ${muted ? 'muted' : ''}`}
            onClick={toggleSound}
            title={muted ? 'Unmute Sound' : 'Mute Sound'}
          >
            {muted ? '🔇' : '🔊'}
          </button>
          <button
            className="wm-icon-btn wm-info-btn"
            onClick={() => setShowEvolutionModal(true)}
            title="Fruit Evolution Chart"
          >
            ℹ️
          </button>
        </div>
      </header>

      {/* Main Play Area */}
      <div className="wm-main-layout">
        {/* Next Fruit Floating Panel */}
        <aside className="wm-side-panel glass-panel">
          <div className="next-box-wrapper">
            <span className="next-label">NEXT</span>
            <div className="next-fruit-preview" style={{ borderColor: nextTierInfo.color }}>
              <span className="next-emoji">{nextTierInfo.emoji}</span>
              <span className="next-fruit-name">{nextTierInfo.name}</span>
            </div>
          </div>

          {/* Dynamic Difficulty Level Progression Box */}
          <div className="wm-diff-status-box" style={{ borderColor: currentDiff.color }}>
            <span className="diff-status-label">DYNAMIC DIFFICULTY</span>
            <div className="diff-status-pill" style={{ borderColor: currentDiff.color, color: currentDiff.color }}>
              LVL {currentDiff.level} • {currentDiff.name}
            </div>
            <div className="diff-status-meta">
              <span className="meta-line">⚡ <b>{currentDiff.multiplier}x</b> Score Bonus</span>
              <span className="meta-line">⏱️ <b>{currentDiff.dangerTime}s</b> Danger Limit</span>
              <span className="meta-line">📦 Spawns: T0-{currentDiff.maxTier} ({FRUIT_TIERS[currentDiff.maxTier]?.name})</span>
            </div>
          </div>

          <div className="wm-evolution-mini">
            <span className="mini-chart-title">EVOLUTION</span>
            <div className="mini-chart-list">
              {FRUIT_TIERS.map((f, idx) => (
                <div
                  key={f.id}
                  className={`mini-chart-item ${score > f.score * 5 ? 'unlocked' : ''}`}
                  title={`${f.name} (+${f.score} pts)`}
                >
                  <span className="chart-emoji">{f.emoji}</span>
                  {idx < FRUIT_TIERS.length - 1 && <span className="chart-arrow">→</span>}
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Jar Canvas Stage */}
        <div
          className={`wm-canvas-container ${dangerWarning ? 'danger-pulse' : ''}`}
          ref={containerRef}
          onMouseMove={handlePointerMove}
          onMouseDown={handlePointerDown}
          onMouseUp={handlePointerUp}
          onTouchStart={handlePointerDown}
          onTouchMove={handlePointerMove}
          onTouchEnd={handlePointerUp}
        >
          <canvas
            ref={canvasRef}
            width={GAME_WIDTH}
            height={GAME_HEIGHT}
            className="wm-canvas"
          />

          {/* Touch Aiming Hint */}
          <div className="wm-controls-hint">
            <span>👆 Drag to Aim • Release to Drop (or Left/Right & Space)</span>
          </div>

          {/* Game Over Modal */}
          {gameState === 'GAMEOVER' && (
            <div className="wm-game-over-overlay glass-panel">
              <div className="game-over-content">
                <span className="game-over-icon">💥</span>
                <h2 className="game-over-title">JAR OVERFLOWED!</h2>
                <p className="game-over-subtitle">Fruits reached the top danger deadline</p>

                <div className="go-score-grid">
                  <div className="go-score-box">
                    <span className="go-label">FINAL SCORE</span>
                    <span className="go-val highlight">{score}</span>
                  </div>
                  <div className="go-score-box">
                    <span className="go-label">ALL-TIME BEST</span>
                    <span className="go-val">{highScore}</span>
                  </div>
                </div>

                {watermelonCreated && (
                  <div className="watermelon-badge-achieved">
                    <span>🍉🏆 WATERMELON MASTER ACHIEVED!</span>
                  </div>
                )}

                <div className="game-over-actions">
                  <button className="btn-primary wm-btn-restart" onClick={restartGame}>
                    🔄 PLAY AGAIN
                  </button>
                  <button className="btn-secondary wm-btn-hub" onClick={onLeave}>
                    ← RETURN TO HUB
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Evolution Info Modal */}
      {showEvolutionModal && (
        <div className="wm-modal-backdrop" onClick={() => setShowEvolutionModal(false)}>
          <div className="wm-modal-card glass-panel" onClick={(e) => e.stopPropagation()}>
            <div className="wm-modal-header">
              <h3>🍉 FRUIT EVOLUTION CYCLE</h3>
              <button className="wm-close-btn" onClick={() => setShowEvolutionModal(false)}>✕</button>
            </div>
            <p className="wm-modal-sub">
              Merge two identical fruits to evolve into the next size. Aim to create the ultimate <b>King Watermelon</b>!
            </p>
            <div className="wm-tier-grid">
              {FRUIT_TIERS.map((f, i) => (
                <div key={f.id} className="wm-tier-item">
                  <span className="tier-num">Tier {i + 1}</span>
                  <span className="tier-icon">{f.emoji}</span>
                  <span className="tier-name">{f.name}</span>
                  <span className="tier-pts">+{f.score} pts</span>
                </div>
              ))}
            </div>
            <button className="btn-primary wm-modal-ok-btn" onClick={() => setShowEvolutionModal(false)}>
              GOT IT, LET'S PLAY!
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WatermelonGame;
