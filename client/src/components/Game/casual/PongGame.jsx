import React, { useEffect, useRef, useState } from 'react';
import SoundEffects from '../../../utils/SoundEffects';
import { api } from '../../../services/api';
import './PongGame.css';

const PongGame = ({ socket, room, user, onLeave }) => {
  const canvasRef = useRef(null);
  const [gameMode, setGameMode] = useState('AI'); // 'AI' or 'TWO_PLAYER'
  const [score, setScore] = useState({ p1: 0, p2: 0 });
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null);
  const [unlockedBanner, setUnlockedBanner] = useState(null);

  // Local Game State
  const gameState = useRef({
    p1Y: 190,
    p2Y: 190,
    paddleHeight: 70,
    paddleWidth: 12,
    ballX: 320,
    ballY: 190,
    ballRadius: 7,
    ballVx: 4.5,
    ballVy: 2.5,
    ballSpeed: 4.5,
    rallyCount: 0,
    keys: {}
  });

  const isMultiplayer = room && !room.isSinglePlayer;
  const isPlayer1 = room ? room.players[0]?.socketId === socket.id : true;
  const opponentName = gameMode === 'TWO_PLAYER' ? 'Player 2 (Pink)' : (room?.players?.find(p => p.socketId !== socket.id)?.username || 'AI Cyber Bot');

  useEffect(() => {
    const handleKeyDown = (e) => {
      gameState.current.keys[e.code] = true;
    };
    const handleKeyUp = (e) => {
      gameState.current.keys[e.code] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const mouseY = e.clientY - rect.top;
      const clampedY = Math.max(35, Math.min(canvas.height - 35, mouseY));

      if (gameMode === 'TWO_PLAYER') {
        const mouseX = e.clientX - rect.left;
        if (mouseX < canvas.width / 2) {
          gameState.current.p1Y = clampedY;
        } else {
          gameState.current.p2Y = clampedY;
        }
      } else {
        if (isPlayer1) gameState.current.p1Y = clampedY;
        else gameState.current.p2Y = clampedY;
      }
    };

    const handleTouchMove = (e) => {
      if (e.touches.length > 0) {
        const rect = canvas.getBoundingClientRect();
        for (let i = 0; i < e.touches.length; i++) {
          const touch = e.touches[i];
          const touchX = touch.clientX - rect.left;
          const touchY = touch.clientY - rect.top;
          const clampedY = Math.max(35, Math.min(canvas.height - 35, touchY));

          if (touchX < canvas.width / 2) {
            gameState.current.p1Y = clampedY;
          } else {
            gameState.current.p2Y = clampedY;
          }
        }
      }
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('touchmove', handleTouchMove);

    // Main 60fps Game Loop
    const gameLoop = () => {
      const s = gameState.current;
      const w = canvas.width;
      const h = canvas.height;

      // Handle Keyboard Controls
      if (s.keys['KeyW']) s.p1Y = Math.max(35, s.p1Y - 6);
      if (s.keys['KeyS']) s.p1Y = Math.min(h - 35, s.p1Y + 6);

      if (gameMode === 'TWO_PLAYER') {
        if (s.keys['ArrowUp']) s.p2Y = Math.max(35, s.p2Y - 6);
        if (s.keys['ArrowDown']) s.p2Y = Math.min(h - 35, s.p2Y + 6);
      } else if (!isMultiplayer) {
        // AI Paddle Logic
        const targetY = s.ballY;
        const aiSpeed = 3.6;
        if (s.p2Y < targetY - 12) s.p2Y += aiSpeed;
        else if (s.p2Y > targetY + 12) s.p2Y -= aiSpeed;
      }

      // Ball Movement
      s.ballX += s.ballVx;
      s.ballY += s.ballVy;

      // Wall Bounce (Top / Bottom)
      if (s.ballY - s.ballRadius <= 0) {
        s.ballY = s.ballRadius;
        s.ballVy = -s.ballVy;
        SoundEffects.playClick();
      } else if (s.ballY + s.ballRadius >= h) {
        s.ballY = h - s.ballRadius;
        s.ballVy = -s.ballVy;
        SoundEffects.playClick();
      }

      // Left Paddle Collision (Player 1)
      if (s.ballX - s.ballRadius <= 25 && s.ballX + s.ballRadius >= 15) {
        if (s.ballY >= s.p1Y - s.paddleHeight / 2 && s.ballY <= s.p1Y + s.paddleHeight / 2) {
          s.ballVx = Math.abs(s.ballVx);
          const deltaY = s.ballY - s.p1Y;
          s.ballVy = deltaY * 0.18;
          s.ballVx = Math.min(9.5, s.ballVx + 0.25);
          s.rallyCount += 1;
          SoundEffects.playTokenStep();
        }
      }

      // Right Paddle Collision (Player 2 / AI)
      if (s.ballX + s.ballRadius >= w - 25 && s.ballX - s.ballRadius <= w - 15) {
        if (s.ballY >= s.p2Y - s.paddleHeight / 2 && s.ballY <= s.p2Y + s.paddleHeight / 2) {
          s.ballVx = -Math.abs(s.ballVx);
          const deltaY = s.ballY - s.p2Y;
          s.ballVy = deltaY * 0.18;
          s.ballVx = Math.max(-9.5, s.ballVx - 0.25);
          s.rallyCount += 1;
          SoundEffects.playTokenStep();
        }
      }

      // Scoring Condition
      if (s.ballX < 0) {
        // Player 2 Scores
        setScore(prev => {
          const next = { ...prev, p2: prev.p2 + 1 };
          if (next.p2 >= 7) triggerEnd(false);
          return next;
        });
        resetBall(1);
      } else if (s.ballX > w) {
        // Player 1 Scores
        setScore(prev => {
          const next = { ...prev, p1: prev.p1 + 1 };
          if (next.p1 >= 7) triggerEnd(true);
          return next;
        });
        resetBall(-1);
      }

      // Rendering
      ctx.fillStyle = '#0a0a14';
      ctx.fillRect(0, 0, w, h);

      // Center Divider Line
      ctx.setLineDash([6, 6]);
      ctx.strokeStyle = 'rgba(0, 243, 255, 0.25)';
      ctx.beginPath();
      ctx.moveTo(w / 2, 0);
      ctx.lineTo(w / 2, h);
      ctx.stroke();
      ctx.setLineDash([]);

      // Left Paddle (Neon Blue)
      ctx.fillStyle = '#00f3ff';
      ctx.shadowColor = '#00f3ff';
      ctx.shadowBlur = 10;
      ctx.fillRect(15, s.p1Y - s.paddleHeight / 2, s.paddleWidth, s.paddleHeight);

      // Right Paddle (Neon Pink)
      ctx.fillStyle = '#ff00ff';
      ctx.shadowColor = '#ff00ff';
      ctx.shadowBlur = 10;
      ctx.fillRect(w - 27, s.p2Y - s.paddleHeight / 2, s.paddleWidth, s.paddleHeight);

      // Ball (Glowing White)
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#ffea00';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(s.ballX, s.ballY, s.ballRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      if (!gameOver) {
        animationFrameId = requestAnimationFrame(gameLoop);
      }
    };

    const resetBall = (direction) => {
      const s = gameState.current;
      s.ballX = canvas.width / 2;
      s.ballY = canvas.height / 2;
      s.ballVx = 4.5 * direction;
      s.ballVy = (Math.random() - 0.5) * 4;
      SoundEffects.playSafe();
    };

    const triggerEnd = async (p1Won) => {
      setGameOver(true);
      const isWin = isPlayer1 ? p1Won : !p1Won;
      setWinner(p1Won ? (user?.username || 'Player 1') : opponentName);
      if (isWin) SoundEffects.playWin();
      else SoundEffects.playLoss();

      const earnedScore = (p1Won ? score.p1 + 1 : score.p1) * 15;
      const res = await api.submitScore('PONG', earnedScore, isWin, user);
      if (res?.unlockedAchievements?.length > 0) {
        setUnlockedBanner(res.unlockedAchievements[0]);
      }
    };

    animationFrameId = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animationFrameId);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('touchmove', handleTouchMove);
    };
  }, [gameOver, isMultiplayer, isPlayer1, gameMode]);

  return (
    <div className="pong-container glass-panel">
      {/* Top Header */}
      <div className="pong-header">
        <button className="btn-secondary back-btn" onClick={onLeave}>&larr; HUB</button>
        
        {/* Mode Selector */}
        {!isMultiplayer && (
          <div className="game-mode-toggle-group">
            <button 
              className={`mode-pill-btn ${gameMode === 'AI' ? 'active' : ''}`}
              onClick={() => { setGameMode('AI'); setScore({ p1: 0, p2: 0 }); setGameOver(false); }}
            >
              🤖 VS AI
            </button>
            <button 
              className={`mode-pill-btn ${gameMode === 'TWO_PLAYER' ? 'active' : ''}`}
              onClick={() => { setGameMode('TWO_PLAYER'); setScore({ p1: 0, p2: 0 }); setGameOver(false); }}
            >
              👥 2-PLAYER LOCAL
            </button>
          </div>
        )}

        <div className="target-badge">FIRST TO 7</div>
      </div>

      {/* Scoreboard */}
      <div className="pong-scoreboard-bar">
        <div className="score-box p1">
          <span className="p-label">{user?.username || 'Player 1 (W/S)'}</span>
          <span className="p-score">{score.p1}</span>
        </div>
        <span className="vs-divider">:</span>
        <div className="score-box p2">
          <span className="p-score">{score.p2}</span>
          <span className="p-label">{gameMode === 'TWO_PLAYER' ? 'Player 2 (▲/▼)' : opponentName}</span>
        </div>
      </div>

      {/* Unlocked Achievement Toast */}
      {unlockedBanner && (
        <div className="achievement-toast">
          <span>🏆 UNLOCKED: <strong>{unlockedBanner.title}</strong> (+{unlockedBanner.points} pts)</span>
        </div>
      )}

      {/* 60fps Canvas Court */}
      <div className="canvas-wrapper">
        <canvas ref={canvasRef} width={640} height={380} className="pong-canvas" />
      </div>
      <p className="pong-hint">
        {gameMode === 'TWO_PLAYER' 
          ? '💡 P1: Move mouse on left side or W/S. P2: Move mouse on right side or Up/Down Arrows.' 
          : '💡 Move mouse vertically or tap court to slide paddle.'}
      </p>

      {/* Game Over Modal */}
      {gameOver && (
        <div className="finish-overlay">
          <h2 className="neon-text" style={{ color: winner === user?.username || winner === 'Player 1' ? '#00ff66' : '#ff0055' }}>
            🏆 {winner} VICTORY!
          </h2>
          <p style={{ color: '#fff', fontSize: '1.2rem', margin: '10px 0 20px 0' }}>
            Final Score: {score.p1} - {score.p2}
          </p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn-primary" onClick={() => { setScore({ p1: 0, p2: 0 }); setGameOver(false); }}>
              PLAY AGAIN
            </button>
            <button className="btn-secondary" onClick={onLeave}>BACK TO HUB</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PongGame;
