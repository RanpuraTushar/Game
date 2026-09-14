import React, { useRef, useEffect, useState } from 'react';
import SoundEffects from '../../../utils/SoundEffects';
import { api } from '../../../services/api';
import './SoccerPhysicsGame.css';

const ARENA_WIDTH = 800;
const ARENA_HEIGHT = 460;
const PITCH_GROUND_Y = 400;
const GRAVITY = 0.45;
const BALL_RADIUS = 16;
const GOAL_WIDTH = 55;
const GOAL_HEIGHT = 140;

const SoccerPhysicsGame = ({ user, onLeave }) => {
  const canvasRef = useRef(null);
  const [gameMode, setGameMode] = useState('TWO_PLAYER'); // 'TWO_PLAYER' or 'VS_AI'
  const [score, setScore] = useState({ p1: 0, p2: 0 });
  const [goalScoredBanner, setGoalScoredBanner] = useState(null);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null);
  const [unlockedBanner, setUnlockedBanner] = useState(null);

  const stateRef = useRef({
    // Player 1 Team (Cyan - Goalie & Striker)
    p1Goalie: { x: 140, y: PITCH_GROUND_Y, vx: 0, vy: 0, angle: 0, legAngle: 0, grounded: true },
    p1Striker: { x: 260, y: PITCH_GROUND_Y, vx: 0, vy: 0, angle: 0, legAngle: 0, grounded: true },

    // Player 2 Team (Pink - Goalie & Striker)
    p2Goalie: { x: 660, y: PITCH_GROUND_Y, vx: 0, vy: 0, angle: 0, legAngle: 0, grounded: true },
    p2Striker: { x: 540, y: PITCH_GROUND_Y, vx: 0, vy: 0, angle: 0, legAngle: 0, grounded: true },

    // Soccer Ball
    ball: { x: ARENA_WIDTH / 2, y: 180, vx: 0, vy: 0, rot: 0 },

    particles: [],
    keys: {},
    roundPause: false,
    active: true
  });

  useEffect(() => {
    resetMatch();
  }, [gameMode]);

  const resetMatch = () => {
    setScore({ p1: 0, p2: 0 });
    setGameOver(false);
    setWinner(null);
    resetKickoff();
  };

  const resetKickoff = () => {
    const s = stateRef.current;
    s.p1Goalie = { x: 140, y: PITCH_GROUND_Y, vx: 0, vy: 0, angle: 0, legAngle: 0, grounded: true };
    s.p1Striker = { x: 260, y: PITCH_GROUND_Y, vx: 0, vy: 0, angle: 0, legAngle: 0, grounded: true };

    s.p2Goalie = { x: 660, y: PITCH_GROUND_Y, vx: 0, vy: 0, angle: 0, legAngle: 0, grounded: true };
    s.p2Striker = { x: 540, y: PITCH_GROUND_Y, vx: 0, vy: 0, angle: 0, legAngle: 0, grounded: true };

    s.ball = { x: ARENA_WIDTH / 2, y: 160, vx: (Math.random() - 0.5) * 4, vy: -2, rot: 0 };
    s.particles = [];
    s.roundPause = false;
    setGoalScoredBanner(null);
  };

  // 1-Button Controls (P1: W or Space | P2: Up Arrow or Enter)
  useEffect(() => {
    const handleKeyDown = (e) => {
      const s = stateRef.current;
      if (s.roundPause || gameOver) return;

      // P1 Jump & Kick (W / Space)
      if (e.code === 'KeyW' || e.code === 'Space') {
        jumpAndKickTeam(s.p1Goalie, s.p1Striker, 1);
        SoundEffects.playClick();
      }

      // P2 Jump & Kick (ArrowUp / Enter)
      if (e.code === 'ArrowUp' || e.code === 'Enter') {
        if (gameMode === 'TWO_PLAYER') {
          jumpAndKickTeam(s.p2Goalie, s.p2Striker, -1);
          SoundEffects.playClick();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameMode, gameOver]);

  const jumpAndKickTeam = (goalie, striker, dir) => {
    [goalie, striker].forEach((p, idx) => {
      p.vy = -10.5 - Math.random() * 2.5;
      p.vx = dir * (4 + Math.random() * 3);
      p.angle = dir * (0.4 + Math.random() * 0.3);
      p.legAngle = dir * (1.2 + Math.random() * 0.5);
      p.grounded = false;
    });
  };

  const handleP1Jump = (e) => {
    if (e && e.cancelable) e.preventDefault();
    const s = stateRef.current;
    if (s.roundPause || gameOver) return;
    jumpAndKickTeam(s.p1Goalie, s.p1Striker, 1);
    SoundEffects.playClick();
  };

  const handleP2Jump = (e) => {
    if (e && e.cancelable) e.preventDefault();
    const s = stateRef.current;
    if (s.roundPause || gameOver) return;
    if (gameMode === 'TWO_PLAYER') {
      jumpAndKickTeam(s.p2Goalie, s.p2Striker, -1);
      SoundEffects.playClick();
    }
  };

  const handleCanvasTouch = (e) => {
    if (gameOver || stateRef.current.roundPause) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches ? e.touches[0] : e;
    const touchX = touch.clientX - rect.left;
    if (gameMode === 'TWO_PLAYER') {
      if (touchX < rect.width / 2) {
        handleP1Jump();
      } else {
        handleP2Jump();
      }
    } else {
      handleP1Jump();
    }
  };

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
  }, [gameMode, score, gameOver]);

  const update = () => {
    const s = stateRef.current;
    if (!s.active || gameOver || s.roundPause) return;

    // --- 1. AI BOT LOGIC ---
    if (gameMode === 'VS_AI') {
      const ball = s.ball;
      // AI triggers jump when ball is nearby or in air
      if ((ball.x > 380 && Math.random() < 0.04) || (ball.x > 500 && ball.y < 300 && Math.random() < 0.08)) {
        jumpAndKickTeam(s.p2Goalie, s.p2Striker, -1);
      }
    }

    // --- 2. UPDATE SOCCER PLAYERS (Ragdoll Physics) ---
    const allPlayers = [s.p1Goalie, s.p1Striker, s.p2Goalie, s.p2Striker];
    allPlayers.forEach(p => {
      p.vy += GRAVITY;
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.95;
      p.angle *= 0.92;
      p.legAngle *= 0.88;

      // Ground Pitch Collision
      if (p.y >= PITCH_GROUND_Y) {
        p.y = PITCH_GROUND_Y;
        p.vy = 0;
        p.grounded = true;
      }

      // Arena Wall Bounds
      p.x = Math.max(30, Math.min(ARENA_WIDTH - 30, p.x));
    });

    // --- 3. UPDATE SOCCER BALL PHYSICS ---
    const ball = s.ball;
    ball.vy += GRAVITY * 0.8;
    ball.x += ball.vx;
    ball.y += ball.vy;
    ball.vx *= 0.985;
    ball.rot += ball.vx * 0.08;

    // Ball Floor Bounce
    if (ball.y >= PITCH_GROUND_Y - BALL_RADIUS) {
      ball.y = PITCH_GROUND_Y - BALL_RADIUS;
      ball.vy = -ball.vy * 0.82;
      if (Math.abs(ball.vy) < 1) ball.vy = 0;
    }

    // Ball Ceiling & Wall Bounces
    if (ball.y < BALL_RADIUS) {
      ball.y = BALL_RADIUS;
      ball.vy = -ball.vy * 0.8;
    }
    if (ball.x < BALL_RADIUS) {
      ball.x = BALL_RADIUS;
      ball.vx = -ball.vx * 0.85;
    }
    if (ball.x > ARENA_WIDTH - BALL_RADIUS) {
      ball.x = ARENA_WIDTH - BALL_RADIUS;
      ball.vx = -ball.vx * 0.85;
    }

    // --- 4. PLAYER & BALL COLLISIONS (Head & Kick Hits) ---
    allPlayers.forEach(p => {
      const headX = p.x;
      const headY = p.y - 45;
      const dist = Math.hypot(ball.x - headX, ball.y - headY);

      if (dist < BALL_RADIUS + 22) {
        const nx = (ball.x - headX) / dist;
        const ny = (ball.y - headY) / dist;

        ball.vx = nx * 13 + p.vx * 1.5;
        ball.vy = ny * 12 + p.vy * 1.2;

        SoundEffects.playTokenStep();

        // Hit sparks
        for (let i = 0; i < 6; i++) {
          s.particles.push({
            x: ball.x,
            y: ball.y,
            vx: (Math.random() - 0.5) * 6,
            vy: (Math.random() - 0.5) * 6,
            color: '#ffd600',
            life: 14
          });
        }
      }
    });

    // --- 5. GOAL DETECTION ---
    const goalTopY = PITCH_GROUND_Y - GOAL_HEIGHT;

    // P1 Scores in Right Goal (P2 Net)
    if (ball.x >= ARENA_WIDTH - GOAL_WIDTH && ball.y >= goalTopY && !s.roundPause) {
      handleGoalScored('PLAYER 1');
      return;
    }

    // P2 Scores in Left Goal (P1 Net)
    if (ball.x <= GOAL_WIDTH && ball.y >= goalTopY && !s.roundPause) {
      handleGoalScored(gameMode === 'VS_AI' ? 'AI BOT' : 'PLAYER 2');
      return;
    }

    // Particles
    for (let i = s.particles.length - 1; i >= 0; i--) {
      const pt = s.particles[i];
      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.life--;
      if (pt.life <= 0) s.particles.splice(i, 1);
    }
  };

  const handleGoalScored = async (scoringTeam) => {
    const s = stateRef.current;
    s.roundPause = true;
    SoundEffects.playWin();
    setGoalScoredBanner(`⚽ GOAL FOR ${scoringTeam}!`);

    // Confetti particles
    for (let i = 0; i < 40; i++) {
      s.particles.push({
        x: s.ball.x,
        y: s.ball.y,
        vx: (Math.random() - 0.5) * 12,
        vy: (Math.random() - 0.5) * 12,
        color: i % 2 === 0 ? '#00f3ff' : '#ff007f',
        life: 30
      });
    }

    const nextScore = {
      p1: scoringTeam === 'PLAYER 1' ? score.p1 + 1 : score.p1,
      p2: scoringTeam !== 'PLAYER 1' ? score.p2 + 1 : score.p2
    };
    setScore(nextScore);

    // First to 5 Goals Wins
    if (nextScore.p1 >= 5 || nextScore.p2 >= 5) {
      setGameOver(true);
      const matchWinner = nextScore.p1 >= 5 ? 'PLAYER 1' : (gameMode === 'VS_AI' ? 'AI BOT' : 'PLAYER 2');
      setWinner(matchWinner);
      const res = await api.submitScore('SOCCER_PHYSICS', 600, nextScore.p1 >= 5, user);
      if (res?.unlockedAchievements?.length > 0) setUnlockedBanner(res.unlockedAchievements[0]);
    } else {
      setTimeout(() => resetKickoff(), 1800);
    }
  };

  // --- RENDER 2D SOCCER STADIUM ---
  const render = (ctx) => {
    ctx.clearRect(0, 0, ARENA_WIDTH, ARENA_HEIGHT);
    const s = stateRef.current;

    // 1. Stadium Night Sky & Floodlights
    const skyGrad = ctx.createLinearGradient(0, 0, 0, PITCH_GROUND_Y);
    skyGrad.addColorStop(0, '#040212');
    skyGrad.addColorStop(0.7, '#0b162c');
    skyGrad.addColorStop(1, '#060d1a');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, ARENA_WIDTH, PITCH_GROUND_Y);

    // Stadium Crowd Silhouette
    ctx.fillStyle = '#101c34';
    ctx.fillRect(0, PITCH_GROUND_Y - 90, ARENA_WIDTH, 90);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    for (let i = 0; i < 30; i++) {
      ctx.beginPath();
      ctx.arc(15 + i * 27, PITCH_GROUND_Y - 80 + (i % 3) * 6, 6, 0, Math.PI * 2);
      ctx.fill();
    }

    // 2. Pitch Grass Turf
    const grassGrad = ctx.createLinearGradient(0, PITCH_GROUND_Y, 0, ARENA_HEIGHT);
    grassGrad.addColorStop(0, '#0a4d22');
    grassGrad.addColorStop(1, '#04240f');
    ctx.fillStyle = grassGrad;
    ctx.fillRect(0, PITCH_GROUND_Y, ARENA_WIDTH, ARENA_HEIGHT - PITCH_GROUND_Y);

    // Pitch White Lines & Center Circle
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, PITCH_GROUND_Y);
    ctx.lineTo(ARENA_WIDTH, PITCH_GROUND_Y); // Ground line
    ctx.moveTo(ARENA_WIDTH / 2, PITCH_GROUND_Y);
    ctx.lineTo(ARENA_WIDTH / 2, PITCH_GROUND_Y - 140); // Half-way line
    ctx.arc(ARENA_WIDTH / 2, PITCH_GROUND_Y, 60, Math.PI, Math.PI * 2); // Center arc
    ctx.stroke();

    // 3. Left & Right Soccer Goal Posts (Nets)
    const goalTopY = PITCH_GROUND_Y - GOAL_HEIGHT;

    // Left Goal (Player 1 Home Net)
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, goalTopY);
    ctx.lineTo(GOAL_WIDTH, goalTopY);
    ctx.lineTo(GOAL_WIDTH, PITCH_GROUND_Y);
    ctx.stroke();

    // Left Goal Net Grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 1;
    for (let y = goalTopY; y <= PITCH_GROUND_Y; y += 14) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(GOAL_WIDTH, y);
      ctx.stroke();
    }

    // Right Goal (Player 2 Home Net)
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(ARENA_WIDTH, goalTopY);
    ctx.lineTo(ARENA_WIDTH - GOAL_WIDTH, goalTopY);
    ctx.lineTo(ARENA_WIDTH - GOAL_WIDTH, PITCH_GROUND_Y);
    ctx.stroke();

    // Right Goal Net Grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 1;
    for (let y = goalTopY; y <= PITCH_GROUND_Y; y += 14) {
      ctx.beginPath();
      ctx.moveTo(ARENA_WIDTH, y);
      ctx.lineTo(ARENA_WIDTH - GOAL_WIDTH, y);
      ctx.stroke();
    }

    // 4. Draw Ragdoll Footballers
    drawFootballer(ctx, s.p1Goalie, '#00f3ff', 'P1 GK');
    drawFootballer(ctx, s.p1Striker, '#00f3ff', 'P1 FW');
    drawFootballer(ctx, s.p2Goalie, '#ff007f', 'P2 GK');
    drawFootballer(ctx, s.p2Striker, '#ff007f', 'P2 FW');

    // 5. Draw Bouncing Neon Soccer Ball
    ctx.save();
    ctx.translate(s.ball.x, s.ball.y);
    ctx.rotate(s.ball.rot);

    // Ball 3D Gradient
    const ballGrad = ctx.createRadialGradient(-3, -3, 2, 0, 0, BALL_RADIUS);
    ballGrad.addColorStop(0, '#ffffff');
    ballGrad.addColorStop(0.8, '#e2e8f0');
    ballGrad.addColorStop(1, '#0f172a');
    ctx.fillStyle = ballGrad;
    ctx.shadowColor = '#00f3ff';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(0, 0, BALL_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Classic Soccer Hexagonal Patches
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(0, 0, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.5;
    for (let a = 0; a < 5; a++) {
      const ang = (a * Math.PI * 2) / 5;
      ctx.beginPath();
      ctx.moveTo(Math.cos(ang) * 5, Math.sin(ang) * 5);
      ctx.lineTo(Math.cos(ang) * BALL_RADIUS, Math.sin(ang) * BALL_RADIUS);
      ctx.stroke();
    }
    ctx.restore();

    // 6. Confetti & Goal Particles
    s.particles.forEach(pt => {
      ctx.fillStyle = pt.color;
      ctx.fillRect(pt.x, pt.y, 4, 4);
    });
  };

  const drawFootballer = (ctx, p, teamColor, label) => {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.angle);

    // Legs & Kicking Boot
    ctx.save();
    ctx.rotate(p.legAngle);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-6, -18, 12, 18);
    // Boot
    ctx.fillStyle = '#ffd600';
    ctx.fillRect(-4, 0, 14, 6);
    ctx.restore();

    // Jersey Body (Torso)
    ctx.fillStyle = teamColor;
    ctx.shadowColor = teamColor;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.roundRect(-12, -42, 24, 26, 4);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Head
    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.arc(0, -52, 11, 0, Math.PI * 2);
    ctx.fill();

    // Hair
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(0, -56, 10, Math.PI, Math.PI * 2);
    ctx.fill();

    // Label
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 9px Orbitron, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(label, 0, -68);

    ctx.restore();
  };

  return (
    <div className="soccer-container glass-panel">
      {/* Top Header */}
      <div className="soccer-header">
        <button className="btn-secondary" onClick={onLeave}>&larr; HUB</button>
        
        {/* Mode Selector */}
        <div className="game-mode-toggle-group">
          <button 
            className={`mode-pill-btn ${gameMode === 'TWO_PLAYER' ? 'active' : ''}`}
            onClick={() => setGameMode('TWO_PLAYER')}
          >
            👥 2-PLAYER MATCH
          </button>
          <button 
            className={`mode-pill-btn ${gameMode === 'VS_AI' ? 'active' : ''}`}
            onClick={() => setGameMode('VS_AI')}
          >
            🤖 VS AI FOOTBALL BOT
          </button>
        </div>

        <button className="btn-tertiary" onClick={resetMatch}>↺ RESTART</button>
      </div>

      {/* Match Scoreboard */}
      <div className="soccer-scoreboard">
        <div className="team-score p1">
          <span>P1 (CYAN FC)</span>
          <strong className="score-digits">{score.p1}</strong>
        </div>

        <div className="match-clock-banner">
          <span className="first-to-goals">FIRST TO 5 GOALS WINS</span>
          <span className="stadium-name">🏟️ CYBER METROPOLIS ARENA</span>
        </div>

        <div className="team-score p2">
          <span>{gameMode === 'VS_AI' ? 'AI BOT FC' : 'P2 (PINK UTD)'}</span>
          <strong className="score-digits">{score.p2}</strong>
        </div>
      </div>

      {unlockedBanner && (
        <div className="achievement-toast">
          <span>🏆 UNLOCKED: <strong>{unlockedBanner.title}</strong> (+{unlockedBanner.points} pts)</span>
        </div>
      )}

      {/* 2D Stadium Canvas */}
      <div 
        className="soccer-canvas-wrap"
        onClick={handleCanvasTouch}
        onTouchStart={handleCanvasTouch}
      >
        <canvas ref={canvasRef} width={ARENA_WIDTH} height={ARENA_HEIGHT} className="soccer-canvas" />

        {goalScoredBanner && !gameOver && (
          <div className="goal-banner-overlay">
            <h2 className="neon-text" style={{ color: '#ffd600', fontSize: '2rem' }}>
              {goalScoredBanner}
            </h2>
          </div>
        )}
      </div>



      {/* 1-Button Controls Bar */}
      <div className="soccer-controls-bar">
        <div className="soccer-ctrl-item">
          <span style={{ color: '#00f3ff', fontWeight: 'bold' }}>🔵 P1 JUMP & KICK:</span>
          <span>Press <strong>W</strong> or <strong>SPACEBAR</strong></span>
        </div>
        <div className="soccer-ctrl-item">
          <span style={{ color: '#ff007f', fontWeight: 'bold' }}>🔴 {gameMode === 'VS_AI' ? 'AI BOT' : 'P2 JUMP & KICK'}:</span>
          <span>Press <strong>UP ARROW (↑)</strong> or <strong>ENTER</strong></span>
        </div>
      </div>

      {gameOver && (
        <div className="finish-overlay">
          <h2 className="neon-text" style={{ color: winner === 'PLAYER 1' ? '#00ff66' : '#ff0055' }}>
            🏆 {winner} WON THE FOOTBALL CUP!
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

export default SoccerPhysicsGame;
