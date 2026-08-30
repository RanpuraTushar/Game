import React, { useRef, useEffect, useState } from 'react';
import SoundEffects from '../../../utils/SoundEffects';
import { api } from '../../../services/api';
import './SpaceInvadersGame.css';

const CANVAS_WIDTH = 480;
const CANVAS_HEIGHT = 540;

const SpaceInvadersGame = ({ user, onLeave }) => {
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [wave, setWave] = useState(1);
  const [lives, setLives] = useState(3);
  const [gameOver, setGameOver] = useState(false);
  const [unlockedBanner, setUnlockedBanner] = useState(null);

  const gameState = useRef({
    player: { x: CANVAS_WIDTH / 2 - 15, y: CANVAS_HEIGHT - 40, width: 30, height: 16, speed: 5 },
    bullets: [],
    alienBullets: [],
    aliens: [],
    alienDir: 1,
    alienSpeed: 1,
    alienStepDown: false,
    particles: [],
    keys: { left: false, right: false, space: false },
    lastShotTime: 0,
    active: true
  });

  useEffect(() => {
    initWave(1);

    const handleKeyDown = (e) => {
      if (['ArrowLeft', 'KeyA'].includes(e.code)) gameState.current.keys.left = true;
      if (['ArrowRight', 'KeyD'].includes(e.code)) gameState.current.keys.right = true;
      if (e.code === 'Space') {
        gameState.current.keys.space = true;
        e.preventDefault();
      }
    };

    const handleKeyUp = (e) => {
      if (['ArrowLeft', 'KeyA'].includes(e.code)) gameState.current.keys.left = false;
      if (['ArrowRight', 'KeyD'].includes(e.code)) gameState.current.keys.right = false;
      if (e.code === 'Space') gameState.current.keys.space = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    let animationId;
    const render = () => {
      updateGame();
      drawGame();
      if (gameState.current.active) {
        animationId = requestAnimationFrame(render);
      }
    };
    animationId = requestAnimationFrame(render);

    return () => {
      gameState.current.active = false;
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      cancelAnimationFrame(animationId);
    };
  }, []);

  const initWave = (w) => {
    const aliens = [];
    const rows = 4;
    const cols = 8;
    const startX = 50;
    const startY = 60;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        aliens.push({
          x: startX + c * 45,
          y: startY + r * 35,
          width: 26,
          height: 18,
          alive: true,
          type: r === 0 ? 'top' : r < 2 ? 'mid' : 'bot',
          color: r === 0 ? '#ff0055' : r < 2 ? '#ffea00' : '#00f3ff'
        });
      }
    }

    gameState.current.aliens = aliens;
    gameState.current.alienSpeed = 0.8 + w * 0.25;
    gameState.current.alienDir = 1;
    gameState.current.bullets = [];
    gameState.current.alienBullets = [];
  };

  const updateGame = () => {
    const s = gameState.current;
    if (!s.active) return;

    // 1. Move Player
    if (s.keys.left && s.player.x > 10) s.player.x -= s.player.speed;
    if (s.keys.right && s.player.x < CANVAS_WIDTH - s.player.width - 10) s.player.x += s.player.speed;

    // 2. Fire Player Laser
    const now = Date.now();
    if (s.keys.space && now - s.lastShotTime > 300) {
      s.bullets.push({ x: s.player.x + s.player.width / 2 - 2, y: s.player.y, width: 4, height: 12, speed: 8 });
      s.lastShotTime = now;
      SoundEffects.playClick();
    }

    // 3. Move Bullets
    s.bullets.forEach(b => { b.y -= b.speed; });
    s.bullets = s.bullets.filter(b => b.y > 0);

    // 4. Move Aliens
    let hitEdge = false;
    s.aliens.forEach(a => {
      if (!a.alive) return;
      a.x += s.alienDir * s.alienSpeed;
      if (a.x + a.width >= CANVAS_WIDTH - 15 || a.x <= 15) hitEdge = true;
    });

    if (hitEdge) {
      s.alienDir *= -1;
      s.aliens.forEach(a => { a.y += 14; });
    }

    // 5. Alien Shooting
    if (Math.random() < 0.03) {
      const livingAliens = s.aliens.filter(a => a.alive);
      if (livingAliens.length > 0) {
        const shooter = livingAliens[Math.floor(Math.random() * livingAliens.length)];
        s.alienBullets.push({ x: shooter.x + shooter.width / 2, y: shooter.y + shooter.height, width: 3, height: 10, speed: 4 });
      }
    }

    // Move alien bullets
    s.alienBullets.forEach(b => { b.y += b.speed; });
    s.alienBullets = s.alienBullets.filter(b => b.y < CANVAS_HEIGHT);

    // 6. Collision: Player Bullets -> Aliens
    s.bullets.forEach(b => {
      s.aliens.forEach(a => {
        if (a.alive && b.x < a.x + a.width && b.x + b.width > a.x && b.y < a.y + a.height && b.y + b.height > a.y) {
          a.alive = false;
          b.y = -100;
          SoundEffects.playTokenStep();
          setScore(sc => sc + 50);

          // Spawn particle sparks
          for (let i = 0; i < 8; i++) {
            s.particles.push({
              x: a.x + a.width / 2,
              y: a.y + a.height / 2,
              vx: (Math.random() - 0.5) * 4,
              vy: (Math.random() - 0.5) * 4,
              color: a.color,
              life: 20
            });
          }
        }
      });
    });

    // 7. Collision: Alien Bullets -> Player
    s.alienBullets.forEach(b => {
      if (b.x < s.player.x + s.player.width && b.x + b.width > s.player.x && b.y < s.player.y + s.player.height && b.y + b.height > s.player.y) {
        b.y = CANVAS_HEIGHT + 100;
        SoundEffects.playLoss();
        setLives(l => {
          const newLives = l - 1;
          if (newLives <= 0) handleGameOver();
          return newLives;
        });
      }
    });

    // 8. Alien Invasion Reached Bottom
    const reachedBottom = s.aliens.some(a => a.alive && a.y + a.height >= s.player.y);
    if (reachedBottom) {
      handleGameOver();
    }

    // 9. Wave Cleared
    if (s.aliens.every(a => !a.alive)) {
      SoundEffects.playWin();
      setWave(w => {
        const nextWave = w + 1;
        initWave(nextWave);
        return nextWave;
      });
    }

    // 10. Update Particles
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
    const res = await api.submitScore('SPACE_INVADERS', score, false, user);
    if (res?.unlockedAchievements?.length > 0) setUnlockedBanner(res.unlockedAchievements[0]);
  };

  const drawGame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const s = gameState.current;

    // Clear Canvas
    ctx.fillStyle = '#060913';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw Starfield
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    for (let i = 0; i < 25; i++) {
      ctx.fillRect((i * 47) % CANVAS_WIDTH, (i * 83) % CANVAS_HEIGHT, 1.5, 1.5);
    }

    // Draw Player Ship (Neon Cannon)
    ctx.fillStyle = '#00f3ff';
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#00f3ff';
    ctx.fillRect(s.player.x, s.player.y + 6, s.player.width, 10);
    ctx.fillRect(s.player.x + 10, s.player.y, 10, 6);
    ctx.shadowBlur = 0;

    // Draw Player Bullets
    ctx.fillStyle = '#ffea00';
    s.bullets.forEach(b => { ctx.fillRect(b.x, b.y, b.width, b.height); });

    // Draw Alien Bullets
    ctx.fillStyle = '#ff0055';
    s.alienBullets.forEach(b => { ctx.fillRect(b.x, b.y, b.width, b.height); });

    // Draw Aliens
    s.aliens.forEach(a => {
      if (!a.alive) return;
      ctx.fillStyle = a.color;
      ctx.shadowBlur = 6;
      ctx.shadowColor = a.color;
      // Draw Pixel Invader shape
      ctx.fillRect(a.x + 4, a.y, a.width - 8, 4);
      ctx.fillRect(a.x, a.y + 4, a.width, 8);
      ctx.fillRect(a.x + 2, a.y + 12, 4, 6);
      ctx.fillRect(a.x + a.width - 6, a.y + 12, 4, 6);
    });
    ctx.shadowBlur = 0;

    // Draw Particles
    s.particles.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, 3, 3);
    });
  };

  const restartGame = () => {
    setScore(0);
    setWave(1);
    setLives(3);
    setGameOver(false);
    gameState.current.active = true;
    initWave(1);
  };

  return (
    <div className="space-invaders-container glass-panel">
      <div className="si-header">
        <button className="btn-secondary" onClick={onLeave}>&larr; LEAVE</button>
        <div className="si-stats">
          <span>SCORE: <strong style={{ color: '#00f3ff' }}>{score}</strong></span>
          <span>WAVE: <strong style={{ color: '#ffea00' }}>{wave}</strong></span>
          <span>LIVES: <strong style={{ color: '#ff0055' }}>{'❤️'.repeat(lives)}</strong></span>
        </div>
      </div>

      {unlockedBanner && (
        <div className="achievement-toast">
          <span>🏆 UNLOCKED: <strong>{unlockedBanner.title}</strong> (+{unlockedBanner.points} pts)</span>
        </div>
      )}

      <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="si-canvas" />

      {/* Mobile Touch Controls */}
      <div className="si-mobile-controls">
        <button 
          className="ctrl-btn"
          onMouseDown={() => { gameState.current.keys.left = true; }}
          onMouseUp={() => { gameState.current.keys.left = false; }}
          onTouchStart={() => { gameState.current.keys.left = true; }}
          onTouchEnd={() => { gameState.current.keys.left = false; }}
        >
          ◀
        </button>
        <button 
          className="ctrl-btn fire-btn"
          onClick={() => {
            const s = gameState.current;
            s.bullets.push({ x: s.player.x + s.player.width / 2 - 2, y: s.player.y, width: 4, height: 12, speed: 8 });
            SoundEffects.playClick();
          }}
        >
          🔥 FIRE
        </button>
        <button 
          className="ctrl-btn"
          onMouseDown={() => { gameState.current.keys.right = true; }}
          onMouseUp={() => { gameState.current.keys.right = false; }}
          onTouchStart={() => { gameState.current.keys.right = true; }}
          onTouchEnd={() => { gameState.current.keys.right = false; }}
        >
          ▶
        </button>
      </div>

      {gameOver && (
        <div className="finish-overlay">
          <h2 className="neon-text" style={{ color: '#ff3366' }}>GAME OVER</h2>
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

export default SpaceInvadersGame;
