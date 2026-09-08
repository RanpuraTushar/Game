import React, { useEffect, useState } from 'react';
import './TicTacToe.css';
import { api } from '../../services/api';
import SoundEffects from '../../utils/SoundEffects';

const TicTacToe = ({ socket, room, user, onLeave }) => {
  const [gameState, setGameState] = useState(room);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    socket.on('roomUpdated', (updatedRoom) => {
      setGameState(updatedRoom);
      if (updatedRoom.status === 'FINISHED') {
        if (updatedRoom.winner === socket?.id) {
          try { SoundEffects.playWin(); } catch(e) {}
          if (user?.id) {
            api.submitScore('TIC_TAC_TOE', 100, true, user).catch(() => {});
          }
        } else if (updatedRoom.winner === 'DRAW') {
          try { SoundEffects.playClick(); } catch(e) {}
        } else {
          try { SoundEffects.playLoss(); } catch(e) {}
        }
      }
    });

    return () => {
      socket.off('roomUpdated');
    };
  }, [socket, user]);

  const handleCopyRoomCode = () => {
    const code = gameState.id;
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(code).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }).catch(() => fallbackCopy(code));
    } else {
      fallbackCopy(code);
    }
  };

  const fallbackCopy = (text) => {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy room code', err);
    }
  };

  const handleCellClick = (index) => {
    if (gameState.status !== 'PLAYING') return;
    if (gameState.currentTurn !== socket?.id) return;
    if (!gameState.grid || gameState.grid[index] !== null) return;
    
    socket?.emit('makeMove', { roomId: gameState.id, index });
  };

  const handleReset = () => {
    socket?.emit('resetGame', { roomId: gameState.id });
  };

  const handleLeave = () => {
    socket?.emit('leaveRoom');
    onLeave();
  };

  if (!gameState || !gameState.players || !gameState.grid) {
    return (
      <div className="glass-panel" style={{ maxWidth: '440px', margin: '40px auto', padding: '40px', textAlign: 'center' }}>
        <h2 className="neon-text" style={{ fontSize: '1.8rem', marginBottom: '15px' }}>CONNECTING TO ARENA...</h2>
        <p style={{ color: '#aaa', marginBottom: '20px' }}>Synchronizing match state...</p>
        <button className="btn-secondary" onClick={onLeave}>&larr; BACK TO HUB</button>
      </div>
    );
  }

  // Find local player symbol
  const me = gameState.players.find(p => p.socketId === socket?.id);
  const opponent = gameState.players.find(p => p.socketId !== socket?.id);

  const isMyTurn = gameState.currentTurn === socket?.id;

  return (
    <div className="tictactoe-container">
      <div className={`tictactoe-panel glass-panel ${gameState.status === 'FINISHED' && gameState.winner !== 'DRAW' && gameState.winner !== 'OPPONENT_LEFT' ? 'win-celebration' : ''}`}>
        
        {/* Header with Clickable Copy Badge */}
        <div className="tictactoe-header">
          <h2 className="neon-text tictactoe-title">TIC-TAC-TOE</h2>
          <div 
            className={`tictactoe-room-badge ${copied ? 'copied' : ''}`}
            onClick={handleCopyRoomCode}
            title="Click to copy room code"
          >
            <span>ROOM: {gameState.id}</span>
            <span style={{ fontSize: '0.85rem' }}>{copied ? '✓ Copied!' : '📋'}</span>
          </div>
        </div>

        {/* Waiting For Opponent with Prominent Copy Code Box */}
        {gameState.status === 'WAITING' && (
          <div className="tictactoe-waiting-card">
            <div className="waiting-title">
              WAITING FOR OPPONENT...
            </div>
            <div className="waiting-subtitle">
              Share this room code with a friend to play:
            </div>
            <div 
              className={`room-copy-action-box ${copied ? 'is-copied' : ''}`}
              onClick={handleCopyRoomCode}
              title="Click to copy room code"
            >
              <span className="room-code-text">{gameState.id}</span>
              <button className="copy-code-btn copy-button-badge" type="button">
                {copied ? '✓ COPIED!' : '📋 COPY CODE'}
              </button>
            </div>
          </div>
        )}

        {/* Turn Status During Game */}
        {gameState.status === 'PLAYING' && (
          <div className="turn-status-text" style={{ color: isMyTurn ? 'var(--neon-green)' : '#aaa' }}>
            {isMyTurn ? '👉 YOUR TURN' : "OPPONENT'S TURN"}
          </div>
        )}

        {gameState.status === 'FINISHED' && (
          <div className="turn-status-text" style={{ color: 'var(--neon-blue)' }}>
            GAME OVER
          </div>
        )}

        {/* Player Score Board */}
        {gameState.status !== 'WAITING' && (
          <div className="tictactoe-scoreboard">
            <div className="player-score-col">
              <div style={{
                color: me?.symbol === 'X' ? 'var(--neon-blue)' : 'var(--neon-pink)',
                fontWeight: 'bold',
                fontSize: '1.1rem',
                textShadow: `0 0 5px ${me?.symbol === 'X' ? 'var(--neon-blue)' : 'var(--neon-pink)'}`
              }}>
                {me?.username} ({me?.symbol})
              </div>
              <div style={{ color: '#fff', fontSize: '1.6rem', fontWeight: 'bold', marginTop: '4px' }}>
                {me?.score || 0}
              </div>
            </div>
            <div className="vs-divider">VS</div>
            <div className="player-score-col">
              <div style={{
                color: opponent?.symbol === 'X' ? 'var(--neon-blue)' : 'var(--neon-pink)',
                fontWeight: 'bold',
                fontSize: '1.1rem',
                textShadow: `0 0 5px ${opponent?.symbol === 'X' ? 'var(--neon-blue)' : 'var(--neon-pink)'}`
              }}>
                {opponent?.username || 'Opponent'} ({opponent?.symbol || 'O'})
              </div>
              <div style={{ color: '#fff', fontSize: '1.6rem', fontWeight: 'bold', marginTop: '4px' }}>
                {opponent?.score || 0}
              </div>
            </div>
          </div>
        )}

        {/* Grid */}
        <div className="tictactoe-grid">
          {(gameState.grid || Array(9).fill(null)).map((cell, index) => {
            const isClickable = isMyTurn && !cell && gameState.status === 'PLAYING';
            return (
              <div 
                key={index}
                onClick={() => handleCellClick(index)}
                className={`tictactoe-cell ${isClickable ? 'my-turn-empty' : ''}`}
                style={{
                  border: `2px solid ${cell ? (cell === 'X' ? 'var(--neon-blue)' : 'var(--neon-pink)') : 'rgba(255, 255, 255, 0.15)'}`,
                  cursor: isClickable ? 'pointer' : 'default',
                  color: cell === 'X' ? 'var(--neon-blue)' : 'var(--neon-pink)',
                  boxShadow: cell ? `0 0 12px ${cell === 'X' ? 'var(--neon-blue)' : 'var(--neon-pink)'}` : 'none'
                }}
              >
                {cell}
              </div>
            );
          })}

          {/* Game Over Overlay */}
          {gameState.status === 'FINISHED' && (
            <div className="tictactoe-gameover-overlay">
              <h1 className={gameState.winner !== 'DRAW' && gameState.winner !== 'OPPONENT_LEFT' ? 'win-text' : ''} style={{
                fontSize: '2.5rem',
                color: 'var(--neon-blue)',
                marginBottom: '20px',
                textAlign: 'center'
              }}>
                {gameState.winner === 'OPPONENT_LEFT' ? 'OPPONENT LEFT!' : 
                 gameState.winner === 'DRAW' ? 'DRAW!' : 
                 gameState.winner === socket.id ? '🏆 VICTORY!' : 'DEFEAT!'}
              </h1>
              
              <div style={{ display: 'flex', gap: '15px', flexDirection: 'column' }}>
                {gameState.hostId === me?.userId ? (
                  <button className="btn-primary" onClick={handleReset} style={{ padding: '12px 25px', fontSize: '1.2rem', minWidth: '220px' }}>
                    PLAY AGAIN
                  </button>
                ) : (
                  <p style={{ color: 'var(--neon-pink)', marginBottom: '10px' }}>Waiting for host to restart...</p>
                )}
                <button className="btn-secondary" onClick={handleLeave} style={{ padding: '12px 25px', fontSize: '1.2rem', minWidth: '220px' }}>
                  BACK TO HUB
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginTop: '10px' }}>
          {gameState.status !== 'FINISHED' && (
            <button 
              className="btn-secondary" 
              onClick={handleLeave}
              style={{ padding: '10px 24px', fontSize: '1rem' }}
            >
              LEAVE GAME
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

export default TicTacToe;
