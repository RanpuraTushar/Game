import React, { useEffect, useRef, useState } from 'react';
import SoundEffects from '../../../utils/SoundEffects';
import { api } from '../../../services/api';
import './KnifeHitGame.css';

const CANVAS_WIDTH = 540;
const CANVAS_HEIGHT = 520;
const WHEEL_CENTER_X = CANVAS_WIDTH / 2;
const WHEEL_CENTER_Y = 160;
const WHEEL_RADIUS = 75;
const KNIFE_SPEED = 24;
const MIN_KNIFE_DISTANCE_DEG = 14;

const STAGES = [
  { stage: 1, name: 'Woodland Log', totalKnives: 7, wheelColor: '#8d6e63', speed: 0.028, apples: 2, boss: false },
  { stage: 2, name: 'Oak Core', totalKnives: 8, wheelColor: '#6d4c41', speed: -0.035, apples: 3, boss: false },
  { stage: 3, name: 'Iron Trunk', totalKnives: 9, wheelColor: '#546e7a', speed: 0.042, apples: 2, boss: false },
  { stage: 4, name: 'BOSS: Neon Shield', totalKnives: 11, wheelColor: '#9d00ff', speed: 0.052, apples: 4, boss: true },
  { stage: 5, name: 'BOSS: Cyber Nexus', totalKnives: 14, wheelColor: '#00f3ff', speed: 0.062, apples: 5, boss: true }
];

const KnifeHitGame = ({ user, onLeave }) => {
  const canvasRef = useRef(null);
  const [gameState, setGameState] = useState('MENU'); // MENU, PLAYING, GAMEOVER, VICTORY
  const [currentStageIdx, setCurrentStageIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [apples, setApples] = useState(0);
  const [knivesLeft, setKnivesLeft] = useState(7);
  const [highScore, setHighScore] = useState(0);

  const stateRef = useRef({
    wheelAngle: 0,
    wheelSpeed: 0.03,
    stuckKnives: [], // array of angles in radians
    applesOnWheel: [], // array of angles in radians
    flyingKnife: null, // { y, vy }
    failedKnife: null, // { x, y, vx, vy, rot }
    particles: [],
    screenShake: 0,
    score: 0,
    apples: 0,
    knivesLeft: 7,
    stageIdx: 0,
    gameOver: false,
    lastTime: 0
  });

  useEffect(() => {
    const saved = localStorage.getItem('knife_hit_highscore');
    if (saved) setHighScore(parseInt(saved, 10));
  }, []);

  const startStage = (stageIdx, preserveScore = false) => {
    SoundEffects.init();
    SoundEffects.playMove();

    const stageConfig = STAGES[Math.min(stageIdx, STAGES.length - 1)];
    const s = stateRef.current;

    s.stageIdx = stageIdx;
    s.wheelAngle = 0;
    s.wheelSpeed = stageConfig.speed;
    s.stuckKnives = [];
    s.flyingKnife = null;
    s.failedKnife = null;
    s.particles = [];
    s.screenShake = 0;
    s.knivesLeft = stageConfig.totalKnives;
    s.gameOver = false;

    // Spawn existing obstacles / apples on wheel
    s.applesOnWheel = [];
    for (let i = 0; i < stageConfig.apples; i++) {
      s.applesOnWheel.push((i * (2 * Math.PI)) / stageConfig.apples + 0.3);
    }

    // Pre-stuck knives on later stages
    if (stageIdx > 0) {
      const initialStuck = Math.min(stageIdx + 1, 4);
      for (let i = 0; i < initialStuck; i++) {
        s.stuckKnives.push((i * (2 * Math.PI)) / initialStuck + 0.15);
      }
    }

    if (!preserveScore) {
      s.score = 0;
      s.apples = 0;
      setScore(0);
      setApples(0);
    }

    setCurrentStageIdx(stageIdx);
    setKnivesLeft(s.knivesLeft);
    setGameState('PLAYING');
  };

  const throwKnife = (e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    const s = stateRef.current;
    if (gameState !== 'PLAYING' || s.flyingKnife || s.failedKnife || s.knivesLeft <= 0 || s.gameOver) return;

    SoundEffects.playClick();
    s.flyingKnife = { y: CANVAS_HEIGHT - 70, vy: -KNIFE_SPEED };
    s.knivesLeft -= 1;
    setKnivesLeft(s.knivesLeft);
  };


  // Keyboard Space / Click Throw
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        throwKnife();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState]);

  // Main Loop
  useEffect(() => {
    let animId;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const loop = (time) => {
      const state = stateRef.current;
      const dt = Math.min((time - (state.lastTime || time)) / 1000, 0.05);
      state.lastTime = time;

      if (gameState === 'PLAYING' && !state.gameOver) {
        // Dynamic Wheel Speed variation
        state.wheelAngle += state.wheelSpeed;

        // Flying Knife Update
        if (state.flyingKnife) {
          state.flyingKnife.y += state.flyingKnife.vy;

          // Check Wheel Collision
          if (state.flyingKnife.y <= WHEEL_CENTER_Y + WHEEL_RADIUS) {
            // Hit Wheel! Calculate hit angle relative to current wheel rotation
            // The bottom of wheel is at angle PI / 2 (90 deg)
            const hitAngle = normalizeAngle(Math.PI / 2 - state.wheelAngle);

            // Check collision with already stuck knives
            let collidedWithKnife = false;
            for (let stuckAngle of state.stuckKnives) {
              const diff = Math.abs(angleDifference(hitAngle, stuckAngle));
              const diffDeg = (diff * 180) / Math.PI;

              if (diffDeg < MIN_KNIFE_DISTANCE_DEG) {
                collidedWithKnife = true;
                break;
              }
            }

            if (collidedWithKnife) {
              // CLANG! Rebound & Game Over
              SoundEffects.playLoss();
              state.screenShake = 15;
              state.failedKnife = {
                x: WHEEL_CENTER_X,
                y: state.flyingKnife.y,
                vx: (Math.random() - 0.5) * 8,
                vy: 12,
                rot: 0.2
              };
              state.flyingKnife = null;
              state.gameOver = true;
              handleGameOver(state.score);
            } else {
              // SUCCESS STICK!
              SoundEffects.playCapture();
              state.screenShake = 6;
              state.stuckKnives.push(hitAngle);
              state.flyingKnife = null;
              state.score += 10;
              setScore(state.score);

              // Check if sliced apple
              for (let i = state.applesOnWheel.length - 1; i >= 0; i--) {
                const aAngle = state.applesOnWheel[i];
                const diff = Math.abs(angleDifference(hitAngle, aAngle));
                if ((diff * 180) / Math.PI < 18) {
                  // Sliced Apple!
                  state.applesOnWheel.splice(i, 1);
                  state.apples += 1;
                  state.score += 50;
                  setApples(state.apples);
                  setScore(state.score);
                  SoundEffects.playWin();
                }
              }

              // Spark particles
              for (let i = 0; i < 10; i++) {
                state.particles.push({
                  x: WHEEL_CENTER_X,
                  y: WHEEL_CENTER_Y + WHEEL_RADIUS,
                  vx: (Math.random() - 0.5) * 8,
                  vy: Math.random() * 6,
                  color: '#00f3ff',
                  size: 3 + Math.random() * 3,
                  alpha: 1.0
                });
              }

              // Check Stage Cleared
              if (state.knivesLeft === 0) {
                // Next Stage!
                SoundEffects.playWin();
                if (state.stageIdx + 1 < STAGES.length) {
                  setTimeout(() => {
                    startStage(state.stageIdx + 1, true);
                  }, 600);
                } else {
                  setGameState('VICTORY');
                }
              }
            }
          }
        }

        // Failed knife falling
        if (state.failedKnife) {
          state.failedKnife.x += state.failedKnife.vx;
          state.failedKnife.y += state.failedKnife.vy;
          state.failedKnife.rot += 0.2;
        }

        // Particles
        for (let i = state.particles.length - 1; i >= 0; i--) {
          const p = state.particles[i];
          p.x += p.vx;
          p.y += p.vy;
          p.alpha -= 0.03;
          if (p.alpha <= 0) state.particles.splice(i, 1);
        }

        if (state.screenShake > 0) state.screenShake *= 0.85;
      }

      // Render
      renderCanvas(ctx, state);

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [gameState]);

  const normalizeAngle = (angle) => {
    let a = angle % (2 * Math.PI);
    if (a < 0) a += 2 * Math.PI;
    return a;
  };

  const angleDifference = (a, b) => {
    let diff = a - b;
    while (diff < -Math.PI) diff += 2 * Math.PI;
    while (diff > Math.PI) diff -= 2 * Math.PI;
    return diff;
  };

  const handleGameOver = async (finalScore) => {
    setGameState('GAMEOVER');
    if (finalScore > highScore) {
      setHighScore(finalScore);
      localStorage.setItem('knife_hit_highscore', finalScore.toString());
    }

    if (user?.id) {
      try {
        await api.post('/games/score', {
          gameKey: 'KNIFE_HIT',
          score: finalScore
        });
      } catch (err) {}
    }
  };

  const renderCanvas = (ctx, state) => {
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    const stageConfig = STAGES[state.stageIdx] || STAGES[0];

    // Screen Shake offset
    const shakeX = (Math.random() - 0.5) * state.screenShake;
    const shakeY = (Math.random() - 0.5) * state.screenShake;

    ctx.save();
    ctx.translate(shakeX, shakeY);

    // --- 1. Draw Rotating Target Wheel ---
    ctx.save();
    ctx.translate(WHEEL_CENTER_X, WHEEL_CENTER_Y);
    ctx.rotate(state.wheelAngle);

    // Wheel Body
    ctx.shadowColor = stageConfig.boss ? '#9d00ff' : '#00f3ff';
    ctx.shadowBlur = 20;
    ctx.fillStyle = stageConfig.wheelColor;
    ctx.beginPath();
    ctx.arc(0, 0, WHEEL_RADIUS, 0, Math.PI * 2);
    ctx.fill();

    // Wheel rings & detail
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, WHEEL_RADIUS * 0.7, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, WHEEL_RADIUS * 0.35, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Draw Stuck Apples on Wheel
    state.applesOnWheel.forEach(angle => {
      ctx.save();
      ctx.rotate(angle);
      ctx.fillStyle = '#ff1744';
      ctx.beginPath();
      ctx.arc(0, WHEEL_RADIUS + 8, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#00e676';
      ctx.fillRect(-2, WHEEL_RADIUS + 18, 4, 6);
      ctx.restore();
    });

    // Draw Stuck Knives on Wheel
    state.stuckKnives.forEach(angle => {
      ctx.save();
      ctx.rotate(angle);
      // Knife sticking outwards
      drawKnifeSprite(ctx, 0, WHEEL_RADIUS + 32, true);
      ctx.restore();
    });

    ctx.restore(); // Restore wheel rotation

    // --- 2. Draw Particles ---
    state.particles.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1.0;
    });

    // --- 3. Draw Flying Knife ---
    if (state.flyingKnife) {
      drawKnifeSprite(ctx, WHEEL_CENTER_X, state.flyingKnife.y, false);
    } else if (state.knivesLeft > 0 && !state.gameOver) {
      // Ready knife at bottom
      drawKnifeSprite(ctx, WHEEL_CENTER_X, CANVAS_HEIGHT - 70, false);
    }

    // --- 4. Draw Failed Deflected Knife ---
    if (state.failedKnife) {
      ctx.save();
      ctx.translate(state.failedKnife.x, state.failedKnife.y);
      ctx.rotate(state.failedKnife.rot);
      drawKnifeSprite(ctx, 0, 0, false);
      ctx.restore();
    }

    ctx.restore(); // Restore shake
  };

  const drawKnifeSprite = (ctx, x, y, pointingInward = false) => {
    ctx.save();
    ctx.translate(x, y);
    if (pointingInward) ctx.rotate(Math.PI);

    // Blade
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#00f3ff';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(0, -32);
    ctx.lineTo(6, -8);
    ctx.lineTo(6, 8);
    ctx.lineTo(-6, 8);
    ctx.lineTo(-6, -8);
    ctx.closePath();
    ctx.fill();

    // Guard
    ctx.fillStyle = '#00f3ff';
    ctx.fillRect(-10, 8, 20, 4);

    // Handle
    ctx.fillStyle = '#333';
    ctx.fillRect(-4, 12, 8, 16);
    ctx.fillStyle = '#ffd600';
    ctx.fillRect(-4, 28, 8, 3);
    ctx.restore();
  };

  return (
    <div className="knife-hit-container">
      <div className="knife-wrapper">
        {/* Header HUD */}
        <div className="knife-header">
          <button className="btn-tertiary" onClick={onLeave}>
            ← EXIT TO HUB
          </button>
          <div className="knife-hud">
            <div className="knife-hud-badge">
              <span style={{ color: '#aaa', fontSize: '0.8rem' }}>STAGE</span>
              <strong style={{ color: '#00f3ff' }}>
                {STAGES[currentStageIdx]?.name || `Stage ${currentStageIdx + 1}`}
              </strong>
            </div>
            <div className="knife-hud-badge">
              <span style={{ color: '#aaa', fontSize: '0.8rem' }}>SCORE</span>
              <strong style={{ color: '#ffd600' }}>{score}</strong>
            </div>
            <div className="knife-hud-badge">
              <span style={{ color: '#aaa', fontSize: '0.8rem' }}>APPLES</span>
              <strong style={{ color: '#ff1744' }}>🍎 {apples}</strong>
            </div>
          </div>
          <div style={{ width: '80px' }}></div>
        </div>

        {/* Canvas Area */}
        <div
          className="knife-canvas-box"
          onClick={(e) => {
            if (gameState === 'PLAYING') throwKnife(e);
          }}
        >
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="knife-canvas"
          />

          {/* Quiver Indicator */}
          <div className="quiver-bar">
            {[...Array(STAGES[currentStageIdx]?.totalKnives || 7)].map((_, i) => (
              <span
                key={i}
                className="quiver-icon"
                style={{ opacity: i < knivesLeft ? 1 : 0.2, color: '#00f3ff' }}
              >
                🗡️
              </span>
            ))}
          </div>

          {/* Overlays */}
          {gameState === 'MENU' && (
            <div className="knife-overlay" onClick={(e) => e.stopPropagation()}>
              <h1 className="knife-title">KNIFE HIT MASTER</h1>
              <p style={{ color: '#ccc', maxWidth: '400px' }}>
                Tap screen or press SPACE to launch knives into the rotating wheel. Do NOT hit existing knives!
              </p>
              <button
                className="knife-btn-play"
                onClick={(e) => {
                  e.stopPropagation();
                  startStage(0);
                }}
              >
                START THROWING 🎯
              </button>
            </div>
          )}

          {gameState === 'GAMEOVER' && (
            <div className="knife-overlay" onClick={(e) => e.stopPropagation()}>
              <h1 className="knife-title" style={{ color: '#ff0055' }}>KNIFE DEFLECTED! 💥</h1>
              <p style={{ fontSize: '1.2rem', color: '#fff' }}>
                Final Score: <strong style={{ color: '#ffd600' }}>{score}</strong>
              </p>
              <button
                className="knife-btn-play"
                onClick={(e) => {
                  e.stopPropagation();
                  startStage(0);
                }}
              >
                TRY AGAIN 🔄
              </button>
            </div>
          )}

          {gameState === 'VICTORY' && (
            <div className="knife-overlay" onClick={(e) => e.stopPropagation()}>
              <h1 className="knife-title" style={{ color: '#00f3ff' }}>👑 ALL STAGES CLEARED!</h1>
              <p style={{ fontSize: '1.2rem', color: '#fff' }}>
                You are the Ultimate Knife Hit Grandmaster! Score: {score}
              </p>
              <button
                className="knife-btn-play"
                onClick={(e) => {
                  e.stopPropagation();
                  startStage(0);
                }}
              >
                PLAY AGAIN 🔄
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default KnifeHitGame;
