import React, { useState, useEffect } from 'react';
import SoundEffects from '../../../utils/SoundEffects';
import { api } from '../../../services/api';
import './CheckersGame.css';

const CheckersGame = ({ user, onLeave }) => {
  const [board, setBoard] = useState(Array(64).fill(null));
  const [selectedPiece, setSelectedPiece] = useState(null);
  const [validMoves, setValidMoves] = useState([]);
  const [turn, setTurn] = useState('PLAYER'); // PLAYER (Red) or AI (Blue)
  const [playerScore, setPlayerScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameResult, setGameResult] = useState(null);
  const [unlockedBanner, setUnlockedBanner] = useState(null);

  useEffect(() => {
    startNewGame();
  }, []);

  const startNewGame = () => {
    const b = Array(64).fill(null);
    // AI pieces at top 3 rows (Blue)
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 8; c++) {
        if ((r + c) % 2 === 1) {
          b[r * 8 + c] = { color: 'AI', isKing: false };
        }
      }
    }
    // Player pieces at bottom 3 rows (Red)
    for (let r = 5; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if ((r + c) % 2 === 1) {
          b[r * 8 + c] = { color: 'PLAYER', isKing: false };
        }
      }
    }

    setBoard(b);
    setSelectedPiece(null);
    setValidMoves([]);
    setTurn('PLAYER');
    setPlayerScore(0);
    setGameOver(false);
    setGameResult(null);
  };

  const getMovesForPiece = (b, idx) => {
    const piece = b[idx];
    if (!piece) return [];
    const r = Math.floor(idx / 8);
    const c = idx % 8;
    const moves = [];

    // Directions: Player moves up (-1), AI moves down (+1), Kings move both
    const dirY = piece.isKing ? [-1, 1] : piece.color === 'PLAYER' ? [-1] : [1];
    const dirX = [-1, 1];

    dirY.forEach(dy => {
      dirX.forEach(dx => {
        const nr = r + dy;
        const nc = c + dx;
        if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
          const targetIdx = nr * 8 + nc;
          if (b[targetIdx] === null) {
            moves.push({ to: targetIdx, isJump: false });
          } else if (b[targetIdx].color !== piece.color) {
            // Check Jump Capture
            const jumpR = nr + dy;
            const jumpC = nc + dx;
            if (jumpR >= 0 && jumpR < 8 && jumpC >= 0 && jumpC < 8) {
              const jumpIdx = jumpR * 8 + jumpC;
              if (b[jumpIdx] === null) {
                moves.push({ to: jumpIdx, isJump: true, capturedIdx: targetIdx });
              }
            }
          }
        }
      });
    });

    return moves;
  };

  const handleCellClick = (idx) => {
    if (gameOver || turn !== 'PLAYER') return;

    const piece = board[idx];

    if (piece && piece.color === 'PLAYER') {
      // Select piece
      setSelectedPiece(idx);
      const moves = getMovesForPiece(board, idx);
      setValidMoves(moves);
      SoundEffects.playClick();
      return;
    }

    if (selectedPiece !== null) {
      const move = validMoves.find(m => m.to === idx);
      if (move) {
        executeMove(selectedPiece, move, 'PLAYER');
      }
    }
  };

  const executeMove = (fromIdx, move, byWhom) => {
    const newBoard = [...board];
    const piece = { ...newBoard[fromIdx] };
    newBoard[fromIdx] = null;

    // Check King Promotion (Player reaches row 0, AI reaches row 7)
    const targetRow = Math.floor(move.to / 8);
    if ((byWhom === 'PLAYER' && targetRow === 0) || (byWhom === 'AI' && targetRow === 7)) {
      piece.isKing = true;
    }

    newBoard[move.to] = piece;

    if (move.isJump && move.capturedIdx !== undefined) {
      newBoard[move.capturedIdx] = null;
      SoundEffects.playSafe();
      if (byWhom === 'PLAYER') setPlayerScore(s => s + 50);
    } else {
      SoundEffects.playTokenStep();
    }

    setBoard(newBoard);
    setSelectedPiece(null);
    setValidMoves([]);

    // Check Win/Loss
    const remainingPlayer = newBoard.filter(p => p && p.color === 'PLAYER').length;
    const remainingAi = newBoard.filter(p => p && p.color === 'AI').length;

    if (remainingAi === 0) {
      handleGameOver('VICTORY', newBoard);
      return;
    }
    if (remainingPlayer === 0) {
      handleGameOver('DEFEAT', newBoard);
      return;
    }

    // Switch Turn
    const nextTurn = byWhom === 'PLAYER' ? 'AI' : 'PLAYER';
    setTurn(nextTurn);

    if (nextTurn === 'AI') {
      setTimeout(() => aiTurn(newBoard), 600);
    }
  };

  const aiTurn = (currBoard) => {
    // Collect all AI moves
    const allAiMoves = [];
    currBoard.forEach((p, idx) => {
      if (p && p.color === 'AI') {
        const moves = getMovesForPiece(currBoard, idx);
        moves.forEach(m => { allAiMoves.push({ from: idx, move: m }); });
      }
    });

    if (allAiMoves.length === 0) {
      handleGameOver('VICTORY', currBoard);
      return;
    }

    // Prioritize Jump captures
    const jumpMoves = allAiMoves.filter(item => item.move.isJump);
    const chosen = jumpMoves.length > 0
      ? jumpMoves[Math.floor(Math.random() * jumpMoves.length)]
      : allAiMoves[Math.floor(Math.random() * allAiMoves.length)];

    executeMove(chosen.from, chosen.move, 'AI');
  };

  const handleGameOver = async (res, finalBoard) => {
    setGameOver(true);
    setGameResult(res);

    if (res === 'VICTORY') {
      SoundEffects.playWin();
      const kingsCount = finalBoard.filter(p => p && p.color === 'PLAYER' && p.isKing).length;
      const resApi = await api.submitScore('CHECKERS', playerScore + 500, true, user);
      if (resApi?.unlockedAchievements?.length > 0) setUnlockedBanner(resApi.unlockedAchievements[0]);
    } else {
      SoundEffects.playLoss();
      api.submitScore('CHECKERS', playerScore, false, user);
    }
  };

  return (
    <div className="checkers-container glass-panel">
      <div className="checkers-header">
        <button className="btn-secondary" onClick={onLeave}>&larr; LEAVE</button>
        <div className="checkers-turn">
          TURN: <strong style={{ color: turn === 'PLAYER' ? '#ff0055' : '#00f3ff' }}>{turn === 'PLAYER' ? 'RED (YOU)' : 'BLUE (AI)'}</strong>
        </div>
        <div className="checkers-score">
          SCORE: <strong style={{ color: '#00ff66' }}>{playerScore}</strong>
        </div>
      </div>

      {unlockedBanner && (
        <div className="achievement-toast">
          <span>🏆 UNLOCKED: <strong>{unlockedBanner.title}</strong> (+{unlockedBanner.points} pts)</span>
        </div>
      )}

      {/* 8x8 Board */}
      <div className="checkers-board">
        {board.map((piece, idx) => {
          const r = Math.floor(idx / 8);
          const c = idx % 8;
          const isDark = (r + c) % 2 === 1;
          const isSelected = selectedPiece === idx;
          const isValidTarget = validMoves.some(m => m.to === idx);

          return (
            <div
              key={idx}
              className={`checkers-cell ${isDark ? 'dark' : 'light'} ${isValidTarget ? 'valid-target' : ''}`}
              onClick={() => handleCellClick(idx)}
            >
              {piece && (
                <div className={`checkers-piece ${piece.color.toLowerCase()} ${isSelected ? 'selected' : ''}`}>
                  {piece.isKing && <span className="king-crown">👑</span>}
                </div>
              )}
              {isValidTarget && <div className="target-dot" />}
            </div>
          );
        })}
      </div>

      {gameOver && (
        <div className="finish-overlay">
          <h2 className="neon-text" style={{ color: gameResult === 'VICTORY' ? '#00ff66' : '#ff3366' }}>
            {gameResult === 'VICTORY' ? '🏆 CHECKERS GRANDMASTER!' : 'MATCH LOST!'}
          </h2>
          <p style={{ color: '#fff', fontSize: '1.2rem', marginBottom: '15px' }}>
            Score: {playerScore}
          </p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn-primary" onClick={startNewGame}>PLAY AGAIN</button>
            <button className="btn-secondary" onClick={onLeave}>BACK TO HUB</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckersGame;
