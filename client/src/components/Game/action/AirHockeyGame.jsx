import React, { useEffect, useRef, useState } from 'react';
import SoundEffects from '../../../utils/SoundEffects';
import { api } from '../../../services/api';
import './AirHockeyGame.css';

const RINK_WIDTH = 700;
const RINK_HEIGHT = 480;
const PUCK_RADIUS = 16;
const MALLET_RADIUS = 28;
const GOAL_SIZE = 140;
const WINNING_SCORE = 7;

const AirHockeyGame = ({ user, onLeave }) => {
  const canvasRef = useRef(null);
  const [gameState, setGameState] = useState('MENU'); // MENU, PLAYING, GAMEOVER
  const [playerScore, setPlayerScore] = useState(0);
  const [aiScore, setAiScore] = useState(0);
  const [difficulty, setDifficulty] = useState('MEDIUM'); // EASY, MEDIUM, HARD, 2PLAYER
  const [winner, setWinner] = useState(null);

  const stateRef = useRef({
    puck: { x: RINK_WIDTH / 2, y: RINK_HEIGHT / 2, vx: 0, vy: 0 },
    player: { x: RINK_WIDTH * 0.25, y: RINK_HEIGHT / 2, vx: 0, vy: 0 },
    opponent: { x: RINK_WIDTH * 0.75, y: RINK_HEIGHT / 2, vx: 0, vy: 0 },
    playerScore: 0,
    aiScore: 0,
    particles: [],
    goalFlash: null,
    mousePos: { x: RINK_WIDTH * 0.25, y: RINK_HEIGHT / 2 },
    keys: {},
    lastTime: 0
  });

  const startMatch = () => {
    SoundEffects.init();
    SoundEffects.playMove();

    stateRef.current.playerScore = 0;
    stateRef.current.aiScore = 0;
    setPlayerScore(0);
    setAiScore(0);
    setWinner(null);

    resetPuck(true);
    setGameState('PLAYING');
  };

  const resetPuck = (towardsPlayer = true) => {
    const s = stateRef.current;
    s.puck.x = RINK_WIDTH / 2;
    s.puck.y = RINK_HEIGHT / 2;
    s.puck.vx = (towardsPlayer ? -3 : 3);
    s.puck.vy = (Math.random() - 0.5) * 4;
    s.player.x = RINK_WIDTH * 0.2;
    s.player.y = RINK_HEIGHT / 2;
    s.opponent.x = RINK_WIDTH * 0.8;
    s.opponent.y = RINK_HEIGHT / 2;
  };

  // Mouse & Touch Tracking
  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;

    stateRef.current.mousePos = { x: mx, y: my };
  };

  const handleTouchMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas || !e.touches[0]) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const mx = (e.touches[0].clientX - rect.left) * scaleX;
    const my = (e.touches[0].clientY - rect.top) * scaleY;

    stateRef.current.mousePos = { x: mx, y: my };
  };

  // Keyboard 2-Player controls (Arrow keys for Player 2)
  useEffect(() => {
    const handleKeyDown = (e) => {
      stateRef.current.keys[e.key] = true;
    };
    const handleKeyUp = (e) => {
      stateRef.current.keys[e.key] = false;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Main Game Loop (Physics & Rendering)
  useEffect(() => {
    let animId;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const loop = (time) => {
      const state = stateRef.current;
      const dt = Math.min((time - (state.lastTime || time)) / 1000, 0.05);
      state.lastTime = time;

      if (gameState === 'PLAYING') {
        // --- 1. Move Player Mallet ---
        const targetX = Math.max(MALLET_RADIUS, Math.min(RINK_WIDTH / 2 - MALLET_RADIUS - 5, state.mousePos.x));
        const targetY = Math.max(MALLET_RADIUS, Math.min(RINK_HEIGHT - MALLET_RADIUS, state.mousePos.y));

        state.player.vx = (targetX - state.player.x) * 15;
        state.player.vy = (targetY - state.player.y) * 15;
        state.player.x = targetX;
        state.player.y = targetY;

        // --- 2. Move Opponent (AI or Player 2) ---
        if (difficulty === '2PLAYER') {
          const speed = 400 * dt;
          if (state.keys['ArrowUp']) state.opponent.y = Math.max(MALLET_RADIUS, state.opponent.y - speed);
          if (state.keys['ArrowDown']) state.opponent.y = Math.min(RINK_HEIGHT - MALLET_RADIUS, state.opponent.y + speed);
          if (state.keys['ArrowLeft']) state.opponent.x = Math.max(RINK_WIDTH / 2 + MALLET_RADIUS + 5, state.opponent.x - speed);
          if (state.keys['ArrowRight']) state.opponent.x = Math.min(RINK_WIDTH - MALLET_RADIUS, state.opponent.x + speed);
        } else {
          // AI Logic
          let aiReaction = 0.07;
          let aiMaxSpeed = 5.0;
          if (difficulty === 'HARD') {
            aiReaction = 0.12;
            aiMaxSpeed = 7.5;
          } else if (difficulty === 'EASY') {
            aiReaction = 0.04;
            aiMaxSpeed = 3.5;
          }

          let aiTargetX = RINK_WIDTH * 0.78;
          let aiTargetY = state.puck.y;

          // Attack puck if it's in AI half
          if (state.puck.x > RINK_WIDTH / 2) {
            aiTargetX = Math.min(RINK_WIDTH - MALLET_RADIUS - 10, state.puck.x);
            aiTargetY = state.puck.y;
          } else {
            // Defend goal
            aiTargetX = RINK_WIDTH * 0.82;
            aiTargetY = RINK_HEIGHT / 2 + (state.puck.y - RINK_HEIGHT / 2) * 0.6;
          }

          const aiDx = aiTargetX - state.opponent.x;
          const aiDy = aiTargetY - state.opponent.y;
          const dist = Math.hypot(aiDx, aiDy);

          if (dist > 0) {
            const moveSpeed = Math.min(dist * aiReaction, aiMaxSpeed);
            state.opponent.x += (aiDx / dist) * moveSpeed;
            state.opponent.y += (aiDy / dist) * moveSpeed;
          }

          state.opponent.x = Math.max(RINK_WIDTH / 2 + MALLET_RADIUS + 5, Math.min(RINK_WIDTH - MALLET_RADIUS, state.opponent.x));
          state.opponent.y = Math.max(MALLET_RADIUS, Math.min(RINK_HEIGHT - MALLET_RADIUS, state.opponent.y));
        }

        // --- 3. Update Puck Physics ---
        state.puck.x += state.puck.vx;
        state.puck.y += state.puck.vy;

        // Friction
        state.puck.vx *= 0.992;
        state.puck.vy *= 0.992;

        // Wall collisions (Top & Bottom)
        if (state.puck.y - PUCK_RADIUS < 0) {
          state.puck.y = PUCK_RADIUS;
          state.puck.vy = -state.puck.vy * 0.95;
          SoundEffects.playClick();
        } else if (state.puck.y + PUCK_RADIUS > RINK_HEIGHT) {
          state.puck.y = RINK_HEIGHT - PUCK_RADIUS;
          state.puck.vy = -state.puck.vy * 0.95;
          SoundEffects.playClick();
        }

        // Left / Right Walls and Goals
        const goalTop = (RINK_HEIGHT - GOAL_SIZE) / 2;
        const goalBottom = goalTop + GOAL_SIZE;

        // Left Goal (Player Goal - Opponent Scores)
        if (state.puck.x - PUCK_RADIUS < 0) {
          if (state.puck.y > goalTop && state.puck.y < goalBottom) {
            // GOAL for Opponent!
            state.aiScore += 1;
            setAiScore(state.aiScore);
            triggerGoal('#ff007f');
            if (state.aiScore >= WINNING_SCORE) {
              setWinner(difficulty === '2PLAYER' ? 'PLAYER 2' : 'AI OPPONENT');
              setGameState('GAMEOVER');
            } else {
              resetPuck(true);
            }
          } else {
            state.puck.x = PUCK_RADIUS;
            state.puck.vx = -state.puck.vx * 0.95;
            SoundEffects.playClick();
          }
        }

        // Right Goal (Opponent Goal - Player Scores)
        if (state.puck.x + PUCK_RADIUS > RINK_WIDTH) {
          if (state.puck.y > goalTop && state.puck.y < goalBottom) {
            // GOAL for Player!
            state.playerScore += 1;
            setPlayerScore(state.playerScore);
            triggerGoal('#00f3ff');
            if (state.playerScore >= WINNING_SCORE) {
              setWinner('PLAYER 1');
              setGameState('GAMEOVER');
              if (user?.id) {
                api.post('/games/score', { gameKey: 'AIR_HOCKEY', score: 1000 }).catch(() => {});
              }
            } else {
              resetPuck(false);
            }
          } else {
            state.puck.x = RINK_WIDTH - PUCK_RADIUS;
            state.puck.vx = -state.puck.vx * 0.95;
            SoundEffects.playClick();
          }
        }

        // --- 4. Mallet-to-Puck Collisions ---
        checkMalletCollision(state.player, state.puck, '#00f3ff');
        checkMalletCollision(state.opponent, state.puck, '#ff007f');

        // Update particles
        for (let i = state.particles.length - 1; i >= 0; i--) {
          const p = state.particles[i];
          p.x += p.vx;
          p.y += p.vy;
          p.alpha -= 0.03;
          if (p.alpha <= 0) state.particles.splice(i, 1);
        }
      }

      // --- 5. RENDER NEON AIR HOCKEY RINK ---
      renderRink(ctx, state);

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [gameState, difficulty]);

  const checkMalletCollision = (mallet, puck, sparkColor) => {
    const dx = puck.x - mallet.x;
    const dy = puck.y - mallet.y;
    const dist = Math.hypot(dx, dy);
    const minDist = MALLET_RADIUS + PUCK_RADIUS;

    if (dist < minDist) {
      // Normal vector
      const nx = dx / (dist || 1);
      const ny = dy / (dist || 1);

      // Separate puck
      puck.x = mallet.x + nx * (minDist + 1);
      puck.y = mallet.y + ny * (minDist + 1);

      // Impulse transfer
      const speed = Math.hypot(puck.vx, puck.vy) + 4;
      puck.vx = nx * Math.min(speed, 18);
      puck.vy = ny * Math.min(speed, 18);

      SoundEffects.playCapture();

      // Spark particles
      for (let i = 0; i < 8; i++) {
        stateRef.current.particles.push({
          x: puck.x,
          y: puck.y,
          vx: (Math.random() - 0.5) * 8,
          vy: (Math.random() - 0.5) * 8,
          color: sparkColor,
          size: 3 + Math.random() * 3,
          alpha: 1.0
        });
      }
    }
  };

  const triggerGoal = (color) => {
    SoundEffects.playWin();
    stateRef.current.goalFlash = color;
    setTimeout(() => {
      stateRef.current.goalFlash = null;
    }, 400);

    for (let i = 0; i < 40; i++) {
      stateRef.current.particles.push({
        x: color === '#00f3ff' ? RINK_WIDTH - 20 : 20,
        y: RINK_HEIGHT / 2 + (Math.random() - 0.5) * GOAL_SIZE,
        vx: (Math.random() - 0.5) * 16,
        vy: (Math.random() - 0.5) * 16,
        color: color,
        size: 4 + Math.random() * 5,
        alpha: 1.0
      });
    }
  };

  const renderRink = (ctx, state) => {
    ctx.clearRect(0, 0, RINK_WIDTH, RINK_HEIGHT);

    // Goal flash background
    if (state.goalFlash) {
      ctx.fillStyle = state.goalFlash;
      ctx.globalAlpha = 0.25;
      ctx.fillRect(0, 0, RINK_WIDTH, RINK_HEIGHT);
      ctx.globalAlpha = 1.0;
    }

    // Rink Border & Background
    ctx.fillStyle = '#060a1e';
    ctx.fillRect(0, 0, RINK_WIDTH, RINK_HEIGHT);

    // Neon Center Line
    ctx.strokeStyle = 'rgba(0, 243, 255, 0.4)';
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.moveTo(RINK_WIDTH / 2, 0);
    ctx.lineTo(RINK_WIDTH / 2, RINK_HEIGHT);
    ctx.stroke();
    ctx.setLineDash([]);

    // Center Circle
    ctx.beginPath();
    ctx.arc(RINK_WIDTH / 2, RINK_HEIGHT / 2, 70, 0, Math.PI * 2);
    ctx.stroke();

    // Goals Crease Arcs
    const goalTop = (RINK_HEIGHT - GOAL_SIZE) / 2;
    ctx.fillStyle = 'rgba(0, 243, 255, 0.2)';
    ctx.fillRect(0, goalTop, 8, GOAL_SIZE);
    ctx.fillStyle = 'rgba(255, 0, 127, 0.2)';
    ctx.fillRect(RINK_WIDTH - 8, goalTop, 8, GOAL_SIZE);

    // Particles
    state.particles.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1.0;
    });

    // Draw Player Mallet (Cyan Glow)
    ctx.shadowColor = '#00f3ff';
    ctx.shadowBlur = 20;
    ctx.fillStyle = '#00f3ff';
    ctx.beginPath();
    ctx.arc(state.player.x, state.player.y, MALLET_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#051329';
    ctx.beginPath();
    ctx.arc(state.player.x, state.player.y, MALLET_RADIUS * 0.55, 0, Math.PI * 2);
    ctx.fill();

    // Draw Opponent Mallet (Pink Glow)
    ctx.shadowColor = '#ff007f';
    ctx.shadowBlur = 20;
    ctx.fillStyle = '#ff007f';
    ctx.beginPath();
    ctx.arc(state.opponent.x, state.opponent.y, MALLET_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#290518';
    ctx.beginPath();
    ctx.arc(state.opponent.x, state.opponent.y, MALLET_RADIUS * 0.55, 0, Math.PI * 2);
    ctx.fill();

    // Draw Glowing Puck (Yellow / White Glow)
    ctx.shadowColor = '#ffd600';
    ctx.shadowBlur = 25;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(state.puck.x, state.puck.y, PUCK_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffd600';
    ctx.beginPath();
    ctx.arc(state.puck.x, state.puck.y, PUCK_RADIUS * 0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  };

  return (
    <div className="air-hockey-container">
      <div className="hockey-wrapper">
        {/* Header & Scoreboard */}
        <div className="hockey-header">
          <button className="btn-tertiary" onClick={onLeave}>
            ← EXIT TO HUB
          </button>
          <div className="hockey-scoreboard">
            <div className="score-box">
              <span className="player-label" style={{ color: '#00f3ff' }}>YOU</span>
              <span className="player-score" style={{ color: '#00f3ff' }}>{playerScore}</span>
            </div>
            <span className="score-divider">:</span>
            <div className="score-box">
              <span className="player-label" style={{ color: '#ff007f' }}>
                {difficulty === '2PLAYER' ? 'P2' : 'AI'}
              </span>
              <span className="player-score" style={{ color: '#ff007f' }}>{aiScore}</span>
            </div>
          </div>
          <div style={{ width: '80px' }}></div>
        </div>

        {/* Canvas Hockey Rink */}
        <div
          className="hockey-canvas-box"
          onMouseMove={handleMouseMove}
          onTouchMove={handleTouchMove}
        >
          <canvas
            ref={canvasRef}
            width={RINK_WIDTH}
            height={RINK_HEIGHT}
            className="hockey-canvas"
          />

          {/* Menu / Game Over Overlays */}
          {gameState === 'MENU' && (
            <div className="hockey-overlay">
              <h1 className="hockey-title">GLOW AIR HOCKEY</h1>
              <p style={{ color: '#aaa', maxWidth: '400px' }}>
                High-speed neon air hockey! Defend your goal and smash the puck past your opponent. First to 7 wins.
              </p>

              <div className="mode-selector">
                <button
                  className={`mode-btn ${difficulty === 'EASY' ? 'active' : ''}`}
                  onClick={() => setDifficulty('EASY')}
                >
                  Rookie AI
                </button>
                <button
                  className={`mode-btn ${difficulty === 'MEDIUM' ? 'active' : ''}`}
                  onClick={() => setDifficulty('MEDIUM')}
                >
                  Pro AI
                </button>
                <button
                  className={`mode-btn ${difficulty === 'HARD' ? 'active' : ''}`}
                  onClick={() => setDifficulty('HARD')}
                >
                  Master AI
                </button>
                <button
                  className={`mode-btn ${difficulty === '2PLAYER' ? 'active' : ''}`}
                  onClick={() => setDifficulty('2PLAYER')}
                >
                  2-Player (Arrows)
                </button>
              </div>

              <button className="play-hockey-btn" onClick={startMatch}>
                FACE OFF 🏓
              </button>
            </div>
          )}

          {gameState === 'GAMEOVER' && (
            <div className="hockey-overlay">
              <h1 className="hockey-title">
                {winner === 'PLAYER 1' ? '🏆 VICTORY!' : '💥 DEFEAT!'}
              </h1>
              <p style={{ fontSize: '1.2rem', color: '#fff' }}>
                Winner: <strong style={{ color: winner === 'PLAYER 1' ? '#00f3ff' : '#ff007f' }}>{winner}</strong>
              </p>
              <button className="play-hockey-btn" onClick={startMatch}>
                PLAY AGAIN 🔄
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AirHockeyGame;
