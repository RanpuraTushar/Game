import React, { useState, useEffect, useRef } from 'react';
import SoundEffects from '../../../utils/SoundEffects';
import { api } from '../../../services/api';
import './SpaceInvadersGame.css';

const CANVAS_WIDTH = 500;
const CANVAS_HEIGHT = 600;

const SpaceInvadersGame = ({ user, onLeave }) => {
  const canvasRef = useRef(null);
  const [gameState, setGameState] = useState('PLAYING'); // 'PLAYING', 'GAMEOVER', 'VICTORY'
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [wave, setWave] = useState(1);
  const [unlockedBanner, setUnlockedBanner] = useState(null);
  const [levelUpBanner, setLevelUpBanner] = useState(null);

  const stateRef = useRef({
    player: { x: CANVAS_WIDTH / 2 - 18, y: CANVAS_HEIGHT - 45, width: 36, height: 22, speed: 6 },
    bullets: [],
    alienBullets: [],
    aliens: [],
    bunkers: [],
    ufo: null,
    particles: [],
    score: 0,
    lives: 3,
    wave: 1,
    direction: 1,
    alienSpeed: 1.1,
    dropDistance: 16,
    alienStepTimer: 0,
    keys: {},
    lastShotTime: 0,
    gameState: 'PLAYING'
  });

  const initAliens = (waveNum = 1) => {
    const aliens = [];
    const rows = 5;
    const cols = 9;
    const startX = 50;
    const startY = 60;
    const spacingX = 42;
    const spacingY = 32;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        let type = 'OCTOPUS';
        let points = 10;
        let color = '#00f3ff';

        if (r === 0) {
          type = 'SQUID';
          points = 30;
          color = '#ff007f';
        } else if (r === 1 || r === 2) {
          type = 'CRAB';
          points = 20;
          color = '#ffd600';
        }

        aliens.push({
          x: startX + c * spacingX,
          y: startY + r * spacingY,
          width: 28,
          height: 22,
          type,
          points,
          color,
          alive: true
        });
      }
    }

    return aliens;
  };

  const initBunkers = () => {
    const bunkers = [];
    const bunkerCount = 4;
    const spacing = CANVAS_WIDTH / (bunkerCount + 1);

    for (let b = 0; b < bunkerCount; b++) {
      const cx = (b + 1) * spacing - 24;
      const cy = CANVAS_HEIGHT - 120;
      const blocks = [];

      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 6; c++) {
          if ((r === 3 && (c === 2 || c === 3)) || (r === 0 && (c === 0 || c === 5))) continue;
          blocks.push({
            x: cx + c * 8,
            y: cy + r * 8,
            width: 8,
            height: 8,
            hp: 3
          });
        }
      }

      bunkers.push(blocks);
    }
    return bunkers;
  };

  const startNewGame = () => {
    const s = stateRef.current;
    s.player.x = CANVAS_WIDTH / 2 - 18;
    s.bullets = [];
    s.alienBullets = [];
    s.aliens = initAliens(1);
    s.bunkers = initBunkers();
    s.ufo = null;
    s.particles = [];
    s.score = 0;
    s.lives = 3;
    s.wave = 1;
    s.direction = 1;
    s.alienSpeed = 1.1;
    s.gameState = 'PLAYING';

    setScore(0);
    setLives(3);
    setWave(1);
    setGameState('PLAYING');
  };

  const shootPlayerBullet = () => {
    const s = stateRef.current;
    if (s.gameState !== 'PLAYING') return;
    const now = Date.now();
    if (now - s.lastShotTime < 240) return;
    s.lastShotTime = now;

    if (s.bullets.length < 3) {
      s.bullets.push({
        x: s.player.x + s.player.width / 2 - 2,
        y: s.player.y - 6,
        width: 4,
        height: 12,
        speed: 8
      });
      SoundEffects.playClick();
    }
  };

  useEffect(() => {
    startNewGame();

    const handleKeyDown = (e) => {
      const s = stateRef.current;
      s.keys[e.code] = true;
      if (e.code === 'Space') {
        e.preventDefault();
        shootPlayerBullet();
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
  }, []);

  // Main 60FPS Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;

    const loop = () => {
      const s = stateRef.current;

      if (s.gameState === 'PLAYING') {
        // 1. Move Player
        if (s.keys['ArrowLeft'] || s.keys['KeyA']) {
          s.player.x = Math.max(10, s.player.x - s.player.speed);
        }
        if (s.keys['ArrowRight'] || s.keys['KeyD']) {
          s.player.x = Math.min(CANVAS_WIDTH - s.player.width - 10, s.player.x + s.player.speed);
        }

        // 2. Move Player Bullets
        s.bullets.forEach(b => { b.y -= b.speed; });
        s.bullets = s.bullets.filter(b => b.y > -20);

        // 3. Move Alien Bullets
        s.alienBullets.forEach(b => { b.y += b.speed; });
        s.alienBullets = s.alienBullets.filter(b => b.y < CANVAS_HEIGHT + 20);

        // 4. Move Aliens
        let hitEdge = false;
        const aliveAliens = s.aliens.filter(a => a.alive);

        aliveAliens.forEach(a => {
          if ((a.x + a.width >= CANVAS_WIDTH - 12 && s.direction === 1) ||
              (a.x <= 12 && s.direction === -1)) {
            hitEdge = true;
          }
        });

        if (hitEdge) {
          s.direction *= -1;
          aliveAliens.forEach(a => {
            a.y += s.dropDistance;
            // Invasion reached ground
            if (a.y + a.height >= s.player.y && s.gameState !== 'GAMEOVER') {
              s.gameState = 'GAMEOVER';
              setGameState('GAMEOVER');
              SoundEffects.playLoss();
              api.submitScore('SPACE_INVADERS', s.score, s.score >= 500, user);
            }
          });
        }

        const stepSpeed = s.alienSpeed + (45 - aliveAliens.length) * 0.045;
        aliveAliens.forEach(a => {
          a.x += s.direction * stepSpeed;
        });

        // Alien shooting frequency and projectile speed scales with wave
        const shootChance = Math.min(0.08, 0.032 + (s.wave - 1) * 0.012);
        if (Math.random() < shootChance && aliveAliens.length > 0) {
          const shooter = aliveAliens[Math.floor(Math.random() * aliveAliens.length)];
          const bulletSpeed = Math.min(7.2, 4.2 + (s.wave - 1) * 0.45);
          s.alienBullets.push({
            x: shooter.x + shooter.width / 2 - 2,
            y: shooter.y + shooter.height,
            width: 4,
            height: 10,
            speed: bulletSpeed
          });
        }

        // 5. UFO Mystery Ship
        if (!s.ufo && Math.random() < 0.002) {
          const fromLeft = Math.random() > 0.5;
          s.ufo = {
            x: fromLeft ? -40 : CANVAS_WIDTH + 10,
            y: 35,
            width: 40,
            height: 16,
            speed: fromLeft ? 2.5 : -2.5,
            points: [100, 150, 200, 300][Math.floor(Math.random() * 4)]
          };
        }

        if (s.ufo) {
          s.ufo.x += s.ufo.speed;
          if (s.ufo.x < -60 || s.ufo.x > CANVAS_WIDTH + 60) {
            s.ufo = null;
          }
        }

        const waveMultiplier = 1.0 + (s.wave - 1) * 0.25;

        // 6. Bullet Collisions with Aliens
        s.bullets.forEach((b, bIdx) => {
          aliveAliens.forEach(a => {
            if (b.x < a.x + a.width && b.x + b.width > a.x &&
                b.y < a.y + a.height && b.y + b.height > a.y) {
              a.alive = false;
              s.bullets.splice(bIdx, 1);
              s.score += Math.round(a.points * waveMultiplier);
              setScore(s.score);
              SoundEffects.playCapture();

              // Spawn Explosion Particles
              for (let i = 0; i < 10; i++) {
                s.particles.push({
                  x: a.x + a.width / 2,
                  y: a.y + a.height / 2,
                  vx: (Math.random() - 0.5) * 4,
                  vy: (Math.random() - 0.5) * 4,
                  color: a.color,
                  life: 18
                });
              }
            }
          });

          // Bullet vs UFO
          if (s.ufo && b.x < s.ufo.x + s.ufo.width && b.x + b.width > s.ufo.x &&
              b.y < s.ufo.y + s.ufo.height && b.y + b.height > s.ufo.y) {
            s.score += Math.round(s.ufo.points * waveMultiplier);
            setScore(s.score);
            s.bullets.splice(bIdx, 1);
            s.ufo = null;
            SoundEffects.playWin();
          }
        });

        // 7. Bullet Collisions with Bunkers
        s.bunkers.forEach(bunker => {
          bunker.forEach(block => {
            if (block.hp <= 0) return;
            // Player bullets
            s.bullets.forEach((b, bIdx) => {
              if (b.x < block.x + block.width && b.x + b.width > block.x &&
                  b.y < block.y + block.height && b.y + b.height > block.y) {
                block.hp--;
                s.bullets.splice(bIdx, 1);
              }
            });
            // Alien bullets
            s.alienBullets.forEach((ab, abIdx) => {
              if (ab.x < block.x + block.width && ab.x + ab.width > block.x &&
                  ab.y < block.y + block.height && ab.y + ab.height > block.y) {
                block.hp--;
                s.alienBullets.splice(abIdx, 1);
              }
            });
          });
        });

        // 8. Alien Bullet vs Player Cannon
        s.alienBullets.forEach((ab, abIdx) => {
          if (ab.x < s.player.x + s.player.width && ab.x + ab.width > s.player.x &&
              ab.y < s.player.y + s.player.height && ab.y + ab.height > s.player.y) {
            s.alienBullets.splice(abIdx, 1);
            s.lives--;
            setLives(s.lives);
            SoundEffects.playLoss();

            // Death particles
            for (let i = 0; i < 14; i++) {
              s.particles.push({
                x: s.player.x + s.player.width / 2,
                y: s.player.y + s.player.height / 2,
                vx: (Math.random() - 0.5) * 5,
                vy: (Math.random() - 0.5) * 5,
                color: '#00ff66',
                life: 25
              });
            }

            if (s.lives <= 0) {
              s.gameState = 'GAMEOVER';
              setGameState('GAMEOVER');
              api.submitScore('SPACE_INVADERS', s.score, false, user);
            } else {
              s.player.x = CANVAS_WIDTH / 2 - 18;
            }
          }
        });

        // Wave Cleared Victory Check
        if (aliveAliens.length === 0) {
          s.wave++;
          setWave(s.wave);
          s.aliens = initAliens(s.wave);
          s.alienSpeed += 0.35;
          SoundEffects.playTrophy();
          const waveMult = (1.0 + (s.wave - 1) * 0.25).toFixed(1);
          setLevelUpBanner({ wave: s.wave, multiplier: waveMult });
          setTimeout(() => setLevelUpBanner(null), 3000);
        }
      }

      // 9. Update Particles
      s.particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
      });
      s.particles = s.particles.filter(p => p.life > 0);

      // --- RENDER ---
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Deep Space background with cyber stars
      ctx.fillStyle = '#050610';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Stars
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      for (let i = 0; i < 35; i++) {
        const sx = (i * 97) % CANVAS_WIDTH;
        const sy = (i * 131) % CANVAS_HEIGHT;
        ctx.fillRect(sx, sy, 1.5, 1.5);
      }

      // Render Aliens
      s.aliens.forEach(a => {
        if (!a.alive) return;
        ctx.fillStyle = a.color;
        ctx.shadowColor = a.color;
        ctx.shadowBlur = 8;

        // Custom Pixel Alien Sprites
        if (a.type === 'SQUID') {
          ctx.beginPath();
          ctx.roundRect(a.x + 4, a.y + 2, a.width - 8, a.height - 6, 4);
          ctx.fill();
          // Tentacles
          ctx.fillRect(a.x + 6, a.y + a.height - 4, 3, 4);
          ctx.fillRect(a.x + a.width - 9, a.y + a.height - 4, 3, 4);
          // Eyes
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(a.x + 8, a.y + 6, 3, 3);
          ctx.fillRect(a.x + a.width - 11, a.y + 6, 3, 3);
        } else if (a.type === 'CRAB') {
          ctx.beginPath();
          ctx.roundRect(a.x + 2, a.y + 4, a.width - 4, a.height - 8, 3);
          ctx.fill();
          ctx.fillRect(a.x + 1, a.y + 1, 4, 4);
          ctx.fillRect(a.x + a.width - 5, a.y + 1, 4, 4);
          // Eyes
          ctx.fillStyle = '#050610';
          ctx.fillRect(a.x + 7, a.y + 7, 3, 3);
          ctx.fillRect(a.x + a.width - 10, a.y + 7, 3, 3);
        } else {
          ctx.beginPath();
          ctx.arc(a.x + a.width / 2, a.y + a.height / 2, a.width / 2 - 2, 0, Math.PI * 2);
          ctx.fill();
          // Eyes
          ctx.fillStyle = '#050610';
          ctx.fillRect(a.x + 8, a.y + 8, 3, 3);
          ctx.fillRect(a.x + a.width - 11, a.y + 8, 3, 3);
        }
      });
      ctx.shadowBlur = 0;

      // Render UFO
      if (s.ufo) {
        ctx.fillStyle = '#ff007f';
        ctx.shadowColor = '#ff007f';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.ellipse(s.ufo.x + s.ufo.width / 2, s.ufo.y + s.ufo.height / 2, s.ufo.width / 2, s.ufo.height / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffd600';
        ctx.fillRect(s.ufo.x + s.ufo.width / 2 - 4, s.ufo.y + 2, 8, 4);
        ctx.shadowBlur = 0;
      }

      // Render Bunkers
      s.bunkers.forEach(bunker => {
        bunker.forEach(block => {
          if (block.hp <= 0) return;
          ctx.fillStyle = block.hp === 3 ? '#00e676' : block.hp === 2 ? '#ffd600' : '#ff3366';
          ctx.fillRect(block.x, block.y, block.width, block.height);
        });
      });

      // Render Player Cannon
      ctx.fillStyle = '#00ff66';
      ctx.shadowColor = '#00ff66';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.roundRect(s.player.x, s.player.y + 8, s.player.width, s.player.height - 8, 4);
      ctx.fill();
      // Cannon Turret
      ctx.fillRect(s.player.x + s.player.width / 2 - 3, s.player.y, 6, 8);
      ctx.shadowBlur = 0;

      // Render Player Bullets
      ctx.fillStyle = '#00f3ff';
      ctx.shadowColor = '#00f3ff';
      ctx.shadowBlur = 8;
      s.bullets.forEach(b => {
        ctx.fillRect(b.x, b.y, b.width, b.height);
      });

      // Render Alien Bullets
      ctx.fillStyle = '#ff3366';
      ctx.shadowColor = '#ff3366';
      ctx.shadowBlur = 8;
      s.alienBullets.forEach(b => {
        ctx.fillRect(b.x, b.y, b.width, b.height);
      });
      ctx.shadowBlur = 0;

      // Render Particles
      s.particles.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, 3, 3);
      });

      // Defense Barrier Line
      ctx.strokeStyle = '#00f3ff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, CANVAS_HEIGHT - 16);
      ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT - 16);
      ctx.stroke();

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Touch glide handling
  const handleTouchMove = (e) => {
    if (e.touches && e.touches.length > 0) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = CANVAS_WIDTH / rect.width;
      const touchX = (e.touches[0].clientX - rect.left) * scaleX;
      stateRef.current.player.x = Math.max(10, Math.min(CANVAS_WIDTH - 46, touchX - 18));
    }
  };

  return (
    <div className="invaders-master-container glass-panel">
      <div className="invaders-top-bar">
        <button className="btn-secondary" onClick={onLeave}>&larr; HUB</button>
        <div className="invaders-dash-stats">
          <span>SCORE: <strong>{score}</strong></span> &bull;
          <span>WAVE: <strong>{wave}</strong> {wave > 1 && <span className="invaders-multiplier-tag">({(1.0 + (wave - 1) * 0.25).toFixed(1)}x)</span>}</span> &bull;
          <span className="lives-tag">LIVES: {'❤️'.repeat(Math.max(0, lives))}</span>
        </div>
        <button className="btn-tertiary" onClick={startNewGame}>↺ RESET</button>
      </div>

      {levelUpBanner && (
        <div className="invaders-levelup-toast">
          🚀 WAVE {levelUpBanner.wave} INCOMING! &bull; SPEED &amp; FIRE RATE UP (+{levelUpBanner.multiplier}x SCORE)
        </div>
      )}

      {unlockedBanner && (
        <div className="achievement-toast">
          🏆 UNLOCKED: <strong>{unlockedBanner.title}</strong> (+{unlockedBanner.points} pts)
        </div>
      )}

      <div
        className="invaders-canvas-wrap"
        onTouchMove={handleTouchMove}
        onClick={shootPlayerBullet}
      >
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="invaders-canvas"
        />

        {gameState === 'GAMEOVER' && (
          <div className="invaders-overlay-modal">
            <h2 className="invaders-over-title">EARTH INVADED</h2>
            <p className="invaders-final-score">FINAL SCORE: <strong>{score}</strong></p>
            <p className="invaders-waves-cleared">WAVES CLEARED: <strong>{wave - 1}</strong></p>
            <button className="btn-primary" onClick={startNewGame}>
              DEFEND AGAIN 🚀
            </button>
          </div>
        )}
      </div>

      {/* Mobile / On-screen Controls */}
      <div className="invaders-mobile-controls">
        <button
          className="btn-secondary move-btn"
          onPointerDown={() => { stateRef.current.keys['ArrowLeft'] = true; }}
          onPointerUp={() => { stateRef.current.keys['ArrowLeft'] = false; }}
        >
          ◀ LEFT
        </button>
        <button
          className="btn-primary fire-btn"
          onClick={shootPlayerBullet}
        >
          ⚡ FIRE LASER
        </button>
        <button
          className="btn-secondary move-btn"
          onPointerDown={() => { stateRef.current.keys['ArrowRight'] = true; }}
          onPointerUp={() => { stateRef.current.keys['ArrowRight'] = false; }}
        >
          RIGHT ▶
        </button>
      </div>

      <p className="invaders-footer-hint">
        Use <strong>A / D or Left / Right Arrows</strong> to steer cannon. Press <strong>SPACEBAR</strong> or Tap Screen to shoot!
      </p>
    </div>
  );
};

export default SpaceInvadersGame;
