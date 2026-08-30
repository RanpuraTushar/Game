import React, { useState, useEffect } from 'react';
import SoundEffects from '../../../utils/SoundEffects';
import { api } from '../../../services/api';
import './ReversiGame.css';

const DIRECTIONS = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1],           [0, 1],
  [1, -1],  [1, 0],  [1, 1]
];

const ReversiGame = ({ user, onLeave }) => {
  const [board, setBoard] = useState(Array(64).fill(null));
  const [turn, setTurn] = useState('BLACK'); // BLACK (Player) or WHITE (AI)
  const [validMoves, setValidMoves] = useState([]);
  const [blackCount, setBlackCount] = useState(2);
  const [whiteCount, setWhiteCount] = useState(2);
  const [gameOver, setGameOver] = useState(false);
  const [unlockedBanner, setUnlockedBanner] = useState(null);

  useEffect(() => {
    startNewGame();
  }, []);

  const startNewGame = () => {
    const b = Array(64).fill(null);
    // Initial 4 disks in center
    b[27] = 'WHITE';
    b[28] = 'BLACK';
    b[35] = 'BLACK';
    b[36] = 'WHITE';

    setBoard(b);
    setTurn('BLACK');
    setGameOver(false);
    updateCountsAndMoves(b, 'BLACK');
  };

  const getFlipsForMove = (b, idx, color) => {
    if (b[idx] !== null) return [];
    const r = Math.floor(idx / 8);
    const c = idx % 8;
    const opp = color === 'BLACK' ? 'WHITE' : 'BLACK';
    const totalFlips = [];

    DIRECTIONS.forEach(([dr, dc]) => {
      const flipsInDir = [];
      let nr = r + dr;
      let nc = c + dc;

      while (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
        const currIdx = nr * 8 + nc;
        if (b[currIdx] === opp) {
          flipsInDir.push(currIdx);
        } else if (b[currIdx] === color) {
          if (flipsInDir.length > 0) {
            totalFlips.push(...flipsInDir);
          }
          break;
        } else {
          break;
        }
        nr += dr;
        nc += dc;
      }
    });

    return totalFlips;
  };

  const updateCountsAndMoves = (b, currentTurn) => {
    let bCnt = 0;
    let wCnt = 0;
    const moves = [];

    b.forEach((cell, idx) => {
      if (cell === 'BLACK') bCnt++;
      if (cell === 'WHITE') wCnt++;

      if (cell === null) {
        const flips = getFlipsForMove(b, idx, currentTurn);
        if (flips.length > 0) {
          moves.push({ idx, flips });
        }
      }
    });

    setBlackCount(bCnt);
    setWhiteCount(wCnt);
    setValidMoves(moves);

    return { bCnt, wCnt, moves };
  };

  const handleCellClick = (idx) => {
    if (gameOver || turn !== 'BLACK') return;

    const move = validMoves.find(m => m.idx === idx);
    if (!move) return;

    executeMove(idx, move.flips, 'BLACK');
  };

  const executeMove = (idx, flips, byColor) => {
    const newBoard = [...board];
    newBoard[idx] = byColor;
    flips.forEach(flipIdx => { newBoard[flipIdx] = byColor; });

    setBoard(newBoard);
    SoundEffects.playSafe();

    const nextColor = byColor === 'BLACK' ? 'WHITE' : 'BLACK';
    const { moves: nextMoves, bCnt, wCnt } = updateCountsAndMoves(newBoard, nextColor);

    if (nextMoves.length === 0) {
      // Check if both sides have no moves -> Game Over
      const { moves: oppMoves } = updateCountsAndMoves(newBoard, byColor);
      if (oppMoves.length === 0) {
        handleGameOver(bCnt, wCnt);
        return;
      } else {
        // Pass turn
        setTurn(byColor);
        if (byColor === 'WHITE') setTimeout(() => aiTurn(newBoard), 600);
      }
    } else {
      setTurn(nextColor);
      if (nextColor === 'WHITE') setTimeout(() => aiTurn(newBoard), 600);
    }
  };

  const aiTurn = (currBoard) => {
    const { moves } = updateCountsAndMoves(currBoard, 'WHITE');
    if (moves.length === 0) return;

    // AI Heuristic: prioritize corners (0, 7, 56, 63) or highest flip count
    const corners = [0, 7, 56, 63];
    const cornerMove = moves.find(m => corners.includes(m.idx));
    const chosen = cornerMove || moves.reduce((best, curr) => curr.flips.length > best.flips.length ? curr : best, moves[0]);

    executeMove(chosen.idx, chosen.flips, 'WHITE');
  };

  const handleGameOver = async (bCnt, wCnt) => {
    setGameOver(true);
    if (bCnt > wCnt) {
      SoundEffects.playWin();
      const res = await api.submitScore('REVERSI', bCnt * 20, true, user);
      if (res?.unlockedAchievements?.length > 0) setUnlockedBanner(res.unlockedAchievements[0]);
    } else {
      SoundEffects.playLoss();
      api.submitScore('REVERSI', bCnt * 5, false, user);
    }
  };

  return (
    <div className="reversi-container glass-panel">
      <div className="reversi-header">
        <button className="btn-secondary" onClick={onLeave}>&larr; LEAVE</button>
        <div className="reversi-turn">
          TURN: <strong style={{ color: turn === 'BLACK' ? '#00f3ff' : '#ffd600' }}>{turn === 'BLACK' ? 'CYAN (YOU)' : 'GOLD (AI)'}</strong>
        </div>
        <div className="reversi-scores">
          <span style={{ color: '#00f3ff' }}>YOU: <strong>{blackCount}</strong></span>
          <span style={{ color: '#ffd600' }}>AI: <strong>{whiteCount}</strong></span>
        </div>
      </div>

      {unlockedBanner && (
        <div className="achievement-toast">
          <span>🏆 UNLOCKED: <strong>{unlockedBanner.title}</strong> (+{unlockedBanner.points} pts)</span>
        </div>
      )}

      {/* 8x8 Board */}
      <div className="reversi-board">
        {board.map((disk, idx) => {
          const isValid = validMoves.some(m => m.idx === idx) && turn === 'BLACK';

          return (
            <div
              key={idx}
              className={`reversi-cell ${isValid ? 'valid-spot' : ''}`}
              onClick={() => handleCellClick(idx)}
            >
              {disk && <div className={`reversi-disk ${disk.toLowerCase()}`} />}
              {isValid && <div className="reversi-dot" />}
            </div>
          );
        })}
      </div>

      {gameOver && (
        <div className="finish-overlay">
          <h2 className="neon-text" style={{ color: blackCount > whiteCount ? '#00ff66' : '#ff3366' }}>
            {blackCount > whiteCount ? '🏆 REVERSI DOMINATED!' : blackCount === whiteCount ? 'DRAW MATCH!' : 'MATCH LOST!'}
          </h2>
          <p style={{ color: '#fff', fontSize: '1.2rem', marginBottom: '15px' }}>
            Cyan: {blackCount} | Gold: {whiteCount}
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

export default ReversiGame;
