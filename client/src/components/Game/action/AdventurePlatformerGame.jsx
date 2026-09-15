import React, { useState, useEffect, useRef } from 'react';
import soundFX from '../../../utils/SoundEffects';
import { api } from '../../../services/api';
import './AdventurePlatformerGame.css';

const VIEW_WIDTH = 900;
const VIEW_HEIGHT = 560;
const WORLD_WIDTH = 3200;

export default function AdventurePlatformerGame({ user, onLeave }) {
  const canvasRef = useRef(null);
  const [gameState, setGameState] = useState('MENU'); // MENU, PLAYING, VICTORY, GAMEOVER
  const [hp, setHp] = useState(3);
  const [coins, setCoins] = useState(0);
  const [score, setScore] = useState(0);
  const [stageName, setStageName] = useState('STAGE 1: NEON ROOFTOPS');
  const [bossHp, setBossHp] = useState(100);
  const [bossActive, setBossActive] = useState(false);
  const [highScore, setHighScore] = useState(0);
  const [bgmMuted, setBgmMuted] = useState(false);

  const keysRef = useRef({ left: false, right: false, jump: false, slash: false, shoot: false });
  const bgmRef = useRef({ osc: null, intervalId: null });

  // Engine state in ref for 60fps physics
  const engineRef = useRef({
    cameraX: 0,
    respawnX: 100,
    respawnY: 420,
    player: {
      x: 100, y: 420, vx: 0, vy: 0, w: 26, h: 38,
      facing: 1, onGround: false, jumpsLeft: 2,
      isSlashing: false, slashTimer: 0, invulnTimer: 0,
      hp: 3
    },
    platforms: [
      // Stage 1
      { x: 0, y: 480, w: 700, h: 80, type: 'ground' },
      { x: 220, y: 380, w: 140, h: 20, type: 'neon' },
      { x: 420, y: 300, w: 160, h: 20, type: 'neon' },
      { x: 650, y: 240, w: 130, h: 20, type: 'neon' },
      { x: 850, y: 480, w: 600, h: 80, type: 'ground' },
      // Stage 2
      { x: 1550, y: 480, w: 450, h: 80, type: 'ground' },
      { x: 1680, y: 370, w: 120, h: 20, type: 'moving', dx: 120, origX: 1680, dir: 1 },
      { x: 1900, y: 300, w: 150, h: 20, type: 'neon' },
      { x: 2100, y: 480, w: 1100, h: 80, type: 'boss_arena' }
    ],
    checkpoints: [
      { x: 950, y: 430, activated: false, label: 'CP 1' },
      { x: 1950, y: 250, activated: false, label: 'CP 2' }
    ],
    collectibles: [
      { x: 260, y: 340, collected: false, type: 'coin' },
      { x: 300, y: 340, collected: false, type: 'coin' },
      { x: 460, y: 260, collected: false, type: 'coin' },
      { x: 500, y: 260, collected: false, type: 'crystal' },
      { x: 1000, y: 440, collected: false, type: 'coin' },
      { x: 1100, y: 440, collected: false, type: 'heart' },
      { x: 1720, y: 330, collected: false, type: 'crystal' }
    ],
    enemies: [
      { x: 480, y: 445, vx: 1.5, minX: 400, maxX: 620, type: 'crawler', alive: true, w: 28, h: 24 },
      { x: 1150, y: 445, vx: 1.8, minX: 1000, maxX: 1350, type: 'crawler', alive: true, w: 28, h: 24 },
      { x: 700, y: 160, vx: 2.0, minX: 600, maxX: 850, type: 'drone', alive: true, w: 24, h: 20 }
    ],
    boss: {
      x: 2750, y: 380, w: 90, h: 100, hp: 100, maxHp: 100,
      state: 'IDLE', attackTimer: 0, shockwaves: [], alive: true
    },
    projectiles: [],
    particles: []
  });

  useEffect(() => {
    const saved = localStorage.getItem('platformer_high_score');
    if (saved) setHighScore(parseInt(saved, 10));
    return () => stopBgm();
  }, []);

  // Simple Synthesized 8-Bit Chiptune BGM
  const startBgm = () => {
    if (bgmMuted) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const notes = [130.81, 164.81, 196.0, 246.94, 261.63, 196.0]; // C3, E3, G3, B3, C4
      let noteIdx = 0;

      bgmRef.current.intervalId = setInterval(() => {
        try {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(notes[noteIdx % notes.length], ctx.currentTime);
          noteIdx++;

          gain.gain.setValueAtTime(0.06, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + 0.15);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.16);
        } catch (e) {}
      }, 180);
    } catch (e) {}
  };

  const stopBgm = () => {
    if (bgmRef.current.intervalId) {
      clearInterval(bgmRef.current.intervalId);
      bgmRef.current.intervalId = null;
    }
  };

  const startGame = () => {
    soundFX.playClick();
    const eng = engineRef.current;
    eng.player = {
      x: 100, y: 420, vx: 0, vy: 0, w: 26, h: 38,
      facing: 1, onGround: false, jumpsLeft: 2,
      isSlashing: false, slashTimer: 0, invulnTimer: 0,
      hp: 3
    };
    eng.boss = {
      x: 2750, y: 380, w: 90, h: 100, hp: 100, maxHp: 100,
      state: 'IDLE', attackTimer: 0, shockwaves: [], alive: true
    };
    eng.projectiles = [];
    eng.particles = [];
    eng.respawnX = 100;
    eng.respawnY = 420;

    setHp(3);
    setCoins(0);
    setScore(0);
    setBossHp(100);
    setBossActive(false);
    setGameState('PLAYING');
    startBgm();
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      const k = keysRef.current;
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') k.left = true;
      if (e.code === 'KeyD' || e.code === 'ArrowRight') k.right = true;
      if (e.code === 'KeyW' || e.code === 'ArrowUp') handleJump();
      if (e.code === 'Space' || e.code === 'KeyJ') handleSlash();
      if (e.code === 'KeyK') handleShoot();
    };

    const handleKeyUp = (e) => {
      const k = keysRef.current;
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') k.left = false;
      if (e.code === 'KeyD' || e.code === 'ArrowRight') k.right = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const handleJump = () => {
    const p = engineRef.current.player;
    if (p.jumpsLeft > 0) {
      p.vy = -12.5;
      p.jumpsLeft--;
      p.onGround = false;
      soundFX.playSafe();
      createParticles(p.x, p.y + p.h, '#00f3ff', 8);
    }
  };

  const handleSlash = () => {
    const p = engineRef.current.player;
    if (p.isSlashing) return;
    p.isSlashing = true;
    p.slashTimer = 18;
    soundFX.playSlash();
    createParticles(p.x + p.facing * 25, p.y + 10, '#ff007f', 10);

    // Hit enemies
    const eng = engineRef.current;
    const slashBox = {
      x: p.facing === 1 ? p.x : p.x - 45,
      y: p.y - 10,
      w: 45,
      h: p.h + 20
    };

    eng.enemies.forEach(en => {
      if (en.alive && checkCollision(slashBox, en)) {
        en.alive = false;
        soundFX.playCapture();
        createParticles(en.x, en.y, '#00ff66', 20);
        setScore(s => s + 100);
      }
    });

    // Hit Boss
    if (eng.boss.alive && checkCollision(slashBox, eng.boss)) {
      eng.boss.hp = Math.max(eng.boss.hp - 12, 0);
      setBossHp(eng.boss.hp);
      soundFX.playCapture();
      createParticles(eng.boss.x, eng.boss.y, '#ff0055', 25);

      if (eng.boss.hp <= 0) {
        eng.boss.alive = false;
        handleVictory();
      }
    }
  };

  const handleShoot = () => {
    const p = engineRef.current.player;
    soundFX.playClick();
    engineRef.current.projectiles.push({
      x: p.x + p.facing * 20,
      y: p.y + 12,
      vx: p.facing * 12,
      r: 6,
      color: '#00ff66'
    });
  };

  const checkCollision = (r1, r2) => {
    return (
      r1.x < r2.x + r2.w &&
      r1.x + r1.w > r2.x &&
      r1.y < r2.y + r2.h &&
      r1.y + r1.h > r2.y
    );
  };

  const handlePlayerHit = () => {
    const p = engineRef.current.player;
    if (p.invulnTimer > 0) return;

    soundFX.playSnakeBite();
    p.hp--;
    p.invulnTimer = 60; // 1s invulnerability
    setHp(p.hp);
    createParticles(p.x, p.y, '#e63946', 15);

    if (p.hp <= 0) {
      // Respawn at checkpoint
      p.x = engineRef.current.respawnX;
      p.y = engineRef.current.respawnY;
      p.vx = 0;
      p.vy = 0;
      p.hp = 3;
      setHp(3);
    }
  };

  const handleVictory = () => {
    stopBgm();
    soundFX.playWinFanfare();
    setGameState('VICTORY');
    const finalScore = score + 1500;
    setScore(finalScore);
    if (finalScore > highScore) {
      setHighScore(finalScore);
      localStorage.setItem('platformer_high_score', finalScore.toString());
    }
    if (user?.id) {
      api.submitScore('ADVENTURE_PLATFORMER', finalScore, true, user).catch(() => {});
    }
  };

  const createParticles = (x, y, color, count) => {
    const eng = engineRef.current;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 5 + 1;
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

  // 60FPS Physics & Canvas Loop
  useEffect(() => {
    let animId;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const loop = () => {
      ctx.clearRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
      const eng = engineRef.current;
      const p = eng.player;
      const k = keysRef.current;

      // 1. Update Physics
      if (gameState === 'PLAYING') {
        if (k.left) {
          p.vx = -4.5;
          p.facing = -1;
        } else if (k.right) {
          p.vx = 4.5;
          p.facing = 1;
        } else {
          p.vx *= 0.8;
        }

        // Gravity
        p.vy += 0.65;
        p.x += p.vx;
        p.y += p.vy;

        if (p.invulnTimer > 0) p.invulnTimer--;
        if (p.slashTimer > 0) p.slashTimer--;
        else p.isSlashing = false;

        // Platform collision
        p.onGround = false;
        eng.platforms.forEach(plat => {
          if (plat.type === 'moving') {
            plat.x += plat.dir * 1.5;
            if (Math.abs(plat.x - plat.origX) > plat.dx) plat.dir *= -1;
          }

          if (
            p.x + p.w > plat.x &&
            p.x < plat.x + plat.w &&
            p.y + p.h >= plat.y &&
            p.y + p.h <= plat.y + 16 &&
            p.vy >= 0
          ) {
            p.y = plat.y - p.h;
            p.vy = 0;
            p.onGround = true;
            p.jumpsLeft = 2;
          }
        });

        // Pit death check
        if (p.y > 600) {
          handlePlayerHit();
        }

        // Checkpoints
        eng.checkpoints.forEach(cp => {
          if (!cp.activated && Math.hypot(p.x - cp.x, p.y - cp.y) < 50) {
            cp.activated = true;
            eng.respawnX = cp.x;
            eng.respawnY = cp.y - 20;
            soundFX.playSafe();
            createParticles(cp.x, cp.y, '#00ff66', 20);
          }
        });

        // Collectibles
        eng.collectibles.forEach(col => {
          if (!col.collected && Math.hypot(p.x - col.x, p.y - col.y) < 30) {
            col.collected = true;
            if (col.type === 'coin') {
              setCoins(c => c + 1);
              setScore(s => s + 50);
              soundFX.playClick();
            } else if (col.type === 'crystal') {
              setScore(s => s + 200);
              soundFX.playSafe();
            } else if (col.type === 'heart') {
              setHp(h => Math.min(h + 1, 3));
              soundFX.playWinFanfare();
            }
          }
        });

        // Enemies update
        eng.enemies.forEach(en => {
          if (en.alive) {
            en.x += en.vx;
            if (en.x > en.maxX || en.x < en.minX) en.vx *= -1;

            if (checkCollision(p, en)) {
              handlePlayerHit();
            }
          }
        });

        // Projectiles update
        for (let i = eng.projectiles.length - 1; i >= 0; i--) {
          const pr = eng.projectiles[i];
          pr.x += pr.vx;

          eng.enemies.forEach(en => {
            if (en.alive && checkCollision({ x: pr.x - 6, y: pr.y - 6, w: 12, h: 12 }, en)) {
              en.alive = false;
              soundFX.playCapture();
              createParticles(en.x, en.y, '#00ff66', 15);
              setScore(s => s + 100);
              eng.projectiles.splice(i, 1);
            }
          });

          if (eng.boss.alive && checkCollision({ x: pr.x - 6, y: pr.y - 6, w: 12, h: 12 }, eng.boss)) {
            eng.boss.hp = Math.max(eng.boss.hp - 8, 0);
            setBossHp(eng.boss.hp);
            soundFX.playCapture();
            createParticles(eng.boss.x, eng.boss.y, '#ff0055', 18);
            eng.projectiles.splice(i, 1);

            if (eng.boss.hp <= 0) {
              eng.boss.alive = false;
              handleVictory();
            }
          }
        }

        // Boss trigger & AI
        if (p.x > 2200) {
          if (!bossActive) setBossActive(true);
          setStageName('STAGE 3: TITAN MECH GOLIATH ARENA');

          const boss = eng.boss;
          if (boss.alive) {
            boss.attackTimer++;
            if (boss.attackTimer % 120 === 0) {
              // Stomp shockwave
              soundFX.playCapture();
              boss.shockwaves.push({ x: boss.x - 20, y: 460, vx: -5, w: 16, h: 24 });
            }

            // Update shockwaves
            for (let i = boss.shockwaves.length - 1; i >= 0; i--) {
              const sw = boss.shockwaves[i];
              sw.x += sw.vx;
              if (checkCollision(p, sw)) {
                handlePlayerHit();
                boss.shockwaves.splice(i, 1);
              } else if (sw.x < 2100) {
                boss.shockwaves.splice(i, 1);
              }
            }
          }
        }

        // Camera Smooth Tracking
        eng.cameraX += (p.x - VIEW_WIDTH * 0.4 - eng.cameraX) * 0.08;
        eng.cameraX = Math.max(0, Math.min(eng.cameraX, WORLD_WIDTH - VIEW_WIDTH));
      }

      // 2. Render World with Camera Offset
      ctx.save();
      ctx.translate(-eng.cameraX, 0);

      // Parallax Neon Sky & Towers
      ctx.fillStyle = '#050a14';
      ctx.fillRect(eng.cameraX, 0, VIEW_WIDTH, VIEW_HEIGHT);

      // Skyline buildings
      for (let i = 0; i < WORLD_WIDTH; i += 180) {
        ctx.fillStyle = '#0b1626';
        ctx.fillRect(i, 180 + (i % 70), 90, 380);
        // Window lights
        ctx.fillStyle = '#00f3ff';
        ctx.globalAlpha = 0.2;
        ctx.fillRect(i + 20, 220, 10, 80);
      }
      ctx.globalAlpha = 1.0;

      // Draw Platforms
      eng.platforms.forEach(plat => {
        if (plat.type === 'ground' || plat.type === 'boss_arena') {
          ctx.fillStyle = '#101c30';
          ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
          ctx.strokeStyle = '#00f3ff';
          ctx.lineWidth = 3;
          ctx.strokeRect(plat.x, plat.y, plat.w, plat.h);
        } else {
          ctx.fillStyle = '#1b2d4b';
          ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
          ctx.strokeStyle = '#ff007f';
          ctx.lineWidth = 2;
          ctx.strokeRect(plat.x, plat.y, plat.w, plat.h);
        }
      });

      // Draw Checkpoints
      eng.checkpoints.forEach(cp => {
        ctx.fillStyle = cp.activated ? '#00ff66' : '#718096';
        ctx.shadowColor = cp.activated ? '#00ff66' : '#718096';
        ctx.shadowBlur = cp.activated ? 15 : 0;
        ctx.fillRect(cp.x, cp.y, 14, 50);
        ctx.shadowBlur = 0;
      });

      // Draw Collectibles
      eng.collectibles.forEach(col => {
        if (!col.collected) {
          if (col.type === 'coin') {
            ctx.fillStyle = '#ffd600';
            ctx.beginPath();
            ctx.arc(col.x, col.y + Math.sin(Date.now() * 0.005) * 4, 8, 0, Math.PI * 2);
            ctx.fill();
          } else if (col.type === 'crystal') {
            ctx.fillStyle = '#00f3ff';
            ctx.fillRect(col.x - 7, col.y - 7, 14, 14);
          } else if (col.type === 'heart') {
            ctx.fillStyle = '#ff007f';
            ctx.beginPath();
            ctx.arc(col.x, col.y, 9, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      });

      // Draw Detailed Cyber Enemies
      eng.enemies.forEach(en => {
        if (en.alive) {
          ctx.save();
          ctx.translate(en.x + en.w / 2, en.y + en.h / 2);

          if (en.type === 'drone') {
            // Floating Attack Drone with rotating blades
            const bob = Math.sin(Date.now() * 0.008 + en.x) * 4;
            ctx.translate(0, bob);

            // Drone spherical body
            ctx.fillStyle = '#1e293b';
            ctx.beginPath();
            ctx.arc(0, 0, 12, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#00ff66';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // Blinking optical scanner eye
            ctx.fillStyle = '#ff0055';
            ctx.shadowColor = '#ff0055';
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.arc(0, 0, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;

            // Dual rotor blades spinning
            const bladeW = Math.cos(Date.now() * 0.04) * 16;
            ctx.strokeStyle = '#94a3b8';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-bladeW, -14); ctx.lineTo(bladeW, -14);
            ctx.stroke();
          } else {
            // Ground Crawler Security Bot
            ctx.fillStyle = '#334155';
            ctx.beginPath();
            ctx.roundRect(-en.w / 2, -en.h / 2, en.w, en.h, 4);
            ctx.fill();
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Tread wheels
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(-en.w / 2, en.h / 2 - 4, en.w, 4);

            // Red scanning optic visor
            ctx.fillStyle = '#ef4444';
            ctx.shadowColor = '#ef4444';
            ctx.shadowBlur = 6;
            ctx.fillRect(-6, -en.h / 2 + 3, 12, 5);
            ctx.shadowBlur = 0;
          }

          ctx.restore();
        }
      });

      // Draw Projectiles
      eng.projectiles.forEach(pr => {
        ctx.fillStyle = pr.color;
        ctx.shadowColor = pr.color;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(pr.x, pr.y, pr.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // Draw Titan Mech Goliath Boss
      if (eng.boss.alive && p.x > 2100) {
        const b = eng.boss;
        ctx.save();
        ctx.translate(b.x + b.w / 2, b.y + b.h / 2);

        // Heavy Mech Walker Armor
        // Main torso chassis
        const mechGrad = ctx.createLinearGradient(-b.w / 2, -b.h / 2, b.w / 2, b.h / 2);
        mechGrad.addColorStop(0, '#1e293b');
        mechGrad.addColorStop(0.5, '#0f172a');
        mechGrad.addColorStop(1, '#334155');
        ctx.fillStyle = mechGrad;
        ctx.beginPath();
        ctx.roundRect(-b.w / 2, -b.h / 2, b.w, b.h, 8);
        ctx.fill();
        ctx.strokeStyle = '#ff0055';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Shoulder Armor Plates & Hazard Striping
        ctx.fillStyle = '#ffd600';
        ctx.fillRect(-b.w / 2 - 8, -b.h / 2, 12, 24);
        ctx.fillRect(b.w / 2 - 4, -b.h / 2, 12, 24);
        ctx.fillStyle = '#000000';
        ctx.fillRect(-b.w / 2 - 6, -b.h / 2 + 6, 8, 4);
        ctx.fillRect(b.w / 2 - 2, -b.h / 2 + 6, 8, 4);

        // Core Glowing Plasma Reactor (Pulsing Chest)
        const pulse = Math.sin(Date.now() * 0.008) * 4;
        ctx.fillStyle = '#ff0055';
        ctx.shadowColor = '#ff0055';
        ctx.shadowBlur = 18 + pulse;
        ctx.beginPath();
        ctx.arc(0, 0, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Menacing Optical Red Visor
        ctx.fillStyle = '#ffd600';
        ctx.shadowColor = '#ffd600';
        ctx.shadowBlur = 10;
        ctx.fillRect(-18, -b.h / 2 + 12, 36, 8);
        ctx.shadowBlur = 0;

        // Articulated Hydraulic Legs
        ctx.fillStyle = '#475569';
        ctx.fillRect(-b.w / 2 + 8, b.h / 2, 14, 18);
        ctx.fillRect(b.w / 2 - 22, b.h / 2, 14, 18);

        ctx.restore();

        // Draw Boss Shockwaves
        b.shockwaves.forEach(sw => {
          ctx.fillStyle = '#ff0055';
          ctx.shadowColor = '#ff0055';
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.roundRect(sw.x, sw.y, sw.w, sw.h, 4);
          ctx.fill();
          ctx.shadowBlur = 0;
        });
      }

      // Draw Detailed Player Hero (Cyber Shinobi / Cyber Ninja)
      if (p.invulnTimer % 4 < 2) {
        ctx.save();
        ctx.translate(p.x + p.w / 2, p.y + p.h / 2);
        ctx.scale(p.facing, 1);

        // Flowing Cyber Scarf / Cape fluttering in wind
        const scarfOffset = Math.sin(Date.now() * 0.015) * 6 - p.vx * 3;
        ctx.fillStyle = '#ff007f';
        ctx.beginPath();
        ctx.moveTo(-6, -10);
        ctx.lineTo(-24 + scarfOffset, -4);
        ctx.lineTo(-28 + scarfOffset, 6);
        ctx.lineTo(-6, 2);
        ctx.closePath();
        ctx.fill();

        // Cyber Suit Legs (Running frame)
        const runCycle = Math.sin(p.x * 0.25);
        ctx.fillStyle = '#0f172a';
        // Back leg
        ctx.fillRect(-7 + (p.onGround ? -runCycle * 5 : 0), 6, 5, 12);
        // Front leg
        ctx.fillRect(2 + (p.onGround ? runCycle * 5 : 0), 6, 5, 12);
        // Boots with cyan trim
        ctx.fillStyle = '#00f3ff';
        ctx.fillRect(-8 + (p.onGround ? -runCycle * 5 : 0), 15, 6, 3);
        ctx.fillRect(1 + (p.onGround ? runCycle * 5 : 0), 15, 6, 3);

        // Cyber Armored Torso (Stealth Titanium Suit)
        const bodyGrad = ctx.createLinearGradient(-8, -14, 8, 8);
        bodyGrad.addColorStop(0, '#1e293b');
        bodyGrad.addColorStop(0.5, '#0f172a');
        bodyGrad.addColorStop(1, '#0284c7');
        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.roundRect(-8, -14, 16, 20, 3);
        ctx.fill();
        ctx.strokeStyle = '#00f3ff';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Helmet & Neon Cyan Glowing Visor
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(0, -18, 9, 0, Math.PI * 2);
        ctx.fill();
        // Visor slit
        ctx.fillStyle = '#00f3ff';
        ctx.shadowColor = '#00f3ff';
        ctx.shadowBlur = 8;
        ctx.fillRect(0, -19, 8, 4);
        ctx.shadowBlur = 0;

        // Katana Sword & Slash Arc
        if (p.isSlashing) {
          // Blazing Energy Slash Arc
          ctx.strokeStyle = '#00f3ff';
          ctx.shadowColor = '#00f3ff';
          ctx.shadowBlur = 15;
          ctx.lineWidth = 5;
          ctx.beginPath();
          ctx.arc(14, 0, 32, -Math.PI * 0.4, Math.PI * 0.4);
          ctx.stroke();

          // Katana Blade
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(6, 0);
          ctx.lineTo(34, -14);
          ctx.stroke();
          ctx.shadowBlur = 0;
        } else {
          // Sheathed Katana on back
          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(-10, 8);
          ctx.lineTo(8, -22);
          ctx.stroke();
        }

        ctx.restore();
      }

      // Draw Particles
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

      ctx.restore(); // Restore camera translation

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [gameState, score]);

  return (
    <div className="platformer-game-container">
      {/* Header */}
      <div className="platformer-header">
        <div className="platformer-title-group">
          <h2>🗡️ CYBER ADVENTURE PLATFORMER</h2>
          <p>{stageName}</p>
        </div>

        <div className="platformer-hud-stats">
          <div className="hp-hearts-display">
            {Array.from({ length: 3 }).map((_, i) => (
              <span key={i}>{i < hp ? '❤️' : '🖤'}</span>
            ))}
          </div>

          <div style={{ color: '#ffd600', fontWeight: 800 }}>
            🪙 {coins}
          </div>

          <div style={{ color: '#00f3ff', fontWeight: 800 }}>
            SCORE: {score}
          </div>

          <button
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}
            onClick={() => {
              setBgmMuted(!bgmMuted);
              if (!bgmMuted) stopBgm();
              else startBgm();
            }}
          >
            {bgmMuted ? '🔇' : '🎵'}
          </button>
        </div>
      </div>

      {/* Main Game View Canvas */}
      <div className="platformer-canvas-wrapper">
        <canvas
          ref={canvasRef}
          width={VIEW_WIDTH}
          height={VIEW_HEIGHT}
          className="platformer-canvas"
        />

        {/* Boss Health Bar Overlay */}
        {bossActive && (
          <div style={{
            position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)',
            width: '60%', background: 'rgba(0,0,0,0.7)', padding: '6px 12px',
            borderRadius: 8, border: '1px solid #ff0055', textAlign: 'center'
          }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#ff0055', marginBottom: 4 }}>
              👑 TITAN MECH GOLIATH
            </div>
            <div style={{ width: '100%', height: 10, background: '#333', borderRadius: 5, overflow: 'hidden' }}>
              <div style={{ width: `${bossHp}%`, height: '100%', background: 'linear-gradient(90deg, #ff0055, #ffd600)' }} />
            </div>
          </div>
        )}

        {/* Menu Overlay */}
        {gameState === 'MENU' && (
          <div className="platformer-overlay">
            <h1 className="overlay-title" style={{ color: '#ff007f' }}>CYBER NINJA ADVENTURE</h1>
            <p className="overlay-sub">Run, Double-Jump, Slash, and defeat the Stage Boss Goliath!</p>
            <p style={{ color: '#a0aec0', fontSize: '0.85rem', marginBottom: 20 }}>
              Controls: A/D or Arrows to Move • W to Double-Jump • Space/J to Slash • K to Shoot
            </p>

            <div className="overlay-btn-group">
              <button className="btn-primary" onClick={startGame}>START ADVENTURE 🗡️</button>
              <button className="btn-secondary" onClick={onLeave}>EXIT TO HUB</button>
            </div>
          </div>
        )}

        {/* Victory Overlay */}
        {gameState === 'VICTORY' && (
          <div className="platformer-overlay">
            <h1 className="overlay-title" style={{ color: '#00ff66' }}>STAGE CLEARED! 🏆</h1>
            <p className="overlay-sub">Titan Mech Goliath defeated! You saved the Cyber Core!</p>

            <div className="overlay-stats">
              <div className="overlay-stat-box">
                <div className="val">{score}</div>
                <div className="lbl">TOTAL SCORE</div>
              </div>
              <div className="overlay-stat-box">
                <div className="val">{highScore}</div>
                <div className="lbl">BEST RECORD</div>
              </div>
            </div>

            <div className="overlay-btn-group">
              <button className="btn-primary" onClick={startGame}>PLAY AGAIN 🔄</button>
              <button className="btn-secondary" onClick={onLeave}>EXIT TO HUB</button>
            </div>
          </div>
        )}
      </div>

      {/* Desktop Keyboard Controls HUD */}
      <div className="platformer-desktop-controls-hud">
        <div className="hud-key-pill"><kbd>A</kbd><kbd>D</kbd> or <kbd>◀</kbd><kbd>▶</kbd> <span>Run</span></div>
        <div className="hud-key-pill"><kbd>W</kbd> or <kbd>▲</kbd> <span>Jump</span></div>
        <div className="hud-key-pill"><kbd>SPACE</kbd> <span>Sword Slash</span></div>
        <div className="hud-key-pill"><kbd>K</kbd> <span>Energy Blast</span></div>
      </div>

      {/* Mobile Touch Controls Bar */}
      <div className="platformer-touch-controls">
        <div className="touch-dpad-horiz">
          <button
            type="button"
            className="plat-btn plat-btn-move"
            onTouchStart={(e) => { if (e.cancelable) e.preventDefault(); keysRef.current.left = true; }}
            onTouchEnd={(e) => { if (e.cancelable) e.preventDefault(); keysRef.current.left = false; }}
            onMouseDown={() => { keysRef.current.left = true; }}
            onMouseUp={() => { keysRef.current.left = false; }}
          >
            ◀ LEFT
          </button>
          <button
            type="button"
            className="plat-btn plat-btn-move"
            onTouchStart={(e) => { if (e.cancelable) e.preventDefault(); keysRef.current.right = true; }}
            onTouchEnd={(e) => { if (e.cancelable) e.preventDefault(); keysRef.current.right = false; }}
            onMouseDown={() => { keysRef.current.right = true; }}
            onMouseUp={() => { keysRef.current.right = false; }}
          >
            RIGHT ▶
          </button>
        </div>

        <div className="touch-action-btns">
          <button
            type="button"
            className="plat-btn plat-btn-jump"
            onClick={handleJump}
          >
            🦘 JUMP
          </button>
          <button
            type="button"
            className="plat-btn plat-btn-slash"
            onClick={handleSlash}
          >
            🗡️ SLASH
          </button>
          <button
            type="button"
            className="plat-btn plat-btn-blast"
            onClick={handleShoot}
          >
            ⚡ BLAST
          </button>
        </div>
      </div>
    </div>
  );
}
