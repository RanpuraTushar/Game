import React, { useEffect, useRef, useState } from 'react';
import SoundEffects from '../../../utils/SoundEffects';
import { api } from '../../../services/api';
import './PongGame.css';

const PongGame = ({ socket, room, user, onLeave }) => {
  const canvasRef = useRef(null);
  const [score, setScore] = useState({ p1: 0, p2: 0 });
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null);
  const [unlockedBanner, setUnlockedBanner] = useState(null);

  // Local Game State
  const gameState = useRef({
    p1Y: 150,
    p2Y: 150,
    paddleHeight: 70,
    paddleWidth: 10,
    ballX: 300,
    ballY: 200,
    ballRadius: 7,
    ballVx: 4,
    ballVy: 3,
    ballSpeed: 4.5,
    rallyCount: 0
  });

  const isMultiplayer = room && !room.isSinglePlayer;
  const isPlayer1 = room ? room.players[0]?.socketId === socket.id : true;
  const opponentName = room?.players?.find(p => p.socketId !== socket.id)?.username || 'AI Cyber Bot';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const mouseY = e.clientY - rect.top;
      const clampedY = Math.max(35, Math.min(canvas.height - 35, mouseY));

      if (isPlayer1) {
        gameState.current.p1Y = clampedY;
        if (isMultiplayer) {
          socket.emit('updatePongPaddle', { roomId: room.id, paddleY: clampedY });
        }
      } else {
        gameState.current.p2Y = clampedY;
        if (isMultiplayer) {
          socket.emit('updatePongPaddle', { roomId: room.id, paddleY: clampedY });
        }
      }
    };

    const handleTouchMove = (e) => {
      if (e.touches.length > 0) {
        const rect = canvas.getBoundingClientRect();
        const touchY = e.touches[0].clientY - rect.top;
        const clampedY = Math.max(35, Math.min(canvas.height - 35, touchY));
        if (isPlayer1) gameState.current.p1Y = clampedY;
        else gameState.current.p2Y = clampedY;
      }
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('touchmove', handleTouchMove);

    // Main 60fps Game Loop
    const gameLoop = () => {
      const s = gameState.current;
      const w = canvas.width;
      const h = canvas.height;

      // Update AI paddle if single player
      if (!isMultiplayer) {
        const targetY = s.ballY;
        const aiSpeed = 3.2;
        if (s.p2Y < targetY - 10) s.p2Y += aiSpeed;
        else if (s.p2Y > targetY + 10) s.p2Y -= aiSpeed;
      }

      // Ball Physics
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
          // Angle deflection
          const deltaY = s.ballY - s.p1Y;
          s.ballVy = deltaY * 0.18;
          s.ballVx = Math.min(9, s.ballVx + 0.2);
          s.rallyCount += 1;
          SoundEffects.playTokenMove();
        }
      }

      // Right Paddle Collision (Player 2 / AI)
      if (s.ballX + s.ballRadius >= w - 25 && s.ballX - s.ballRadius <= w - 15) {
        if (s.ballY >= s.p2Y - s.paddleHeight / 2 && s.ballY <= s.p2Y + s.paddleHeight / 2) {
          s.ballVx = -Math.abs(s.ballVx);
          const deltaY = s.ballY - s.p2Y;
          s.ballVy = deltaY * 0.18;
          s.ballVx = Math.max(-9, s.ballVx - 0.2);
          s.rallyCount += 1;
          SoundEffects.playTokenMove();
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
      ctx.fillRect(w - 25, s.p2Y - s.paddleHeight / 2, s.paddleWidth, s.paddleHeight);

      // Ball (Glowing White/Yellow)
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
      s.ballVx = 4 * direction;
      s.ballVy = (Math.random() - 0.5) * 4;
      SoundEffects.playSafe();
    };

    const triggerEnd = async (p1Won) => {
      setGameOver(true);
      const isWin = isPlayer1 ? p1Won : !p1Won;
      setWinner(isWin ? user?.username || 'You' : opponentName);
      if (isWin) SoundEffects.playWin();
      else SoundEffects.playLoss();

      // Submit Score to Leaderboards
      const earnedScore = (p1Won ? score.p1 + 1 : score.p1) * 10;
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
  }, [gameOver, isMultiplayer, isPlayer1]);

  return (
    <div className="pong-container glass-panel">
      {/* Top Header */}
      <div className="pong-header">
        <button className="btn-secondary back-btn" onClick={onLeave}>&larr; LEAVE</button>
        <div className="pong-scoreboard">
          <div className="score-box p1">
            <span className="p-label">{user?.username || 'Player 1'}</span>
            <span className="p-score">{score.p1}</span>
          </div>
          <span className="vs-divider">:</span>
          <div className="score-box p2">
            <span className="p-score">{score.p2}</span>
            <span className="p-label">{opponentName}</span>
          </div>
        </div>
        <div className="target-badge">FIRST TO 7</div>
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
      <p className="pong-hint">💡 Move mouse or drag vertically on the court to slide your paddle.</p>

      {/* Game Over Modal */}
      {gameOver && (
        <div className="finish-overlay">
          <h2 className="neon-text" style={{ color: winner === user?.username ? '#00ff66' : '#ff0055' }}>
            {winner === user?.username ? '🏆 VICTORY!' : 'GAME OVER'}
          </h2>
          <p style={{ color: '#fff', fontSize: '1.2rem', marginBottom: '20px' }}>
            Winner: <strong style={{ color: '#00f3ff' }}>{winner}</strong>
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
