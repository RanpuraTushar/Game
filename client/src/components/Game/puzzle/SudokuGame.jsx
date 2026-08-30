import React, { useState, useEffect } from 'react';
import SoundEffects from '../../../utils/SoundEffects';
import { api } from '../../../services/api';
import './SudokuGame.css';

// Sample curated valid boards
const BOARDS = {
  EASY: {
    puzzle: [
      5, 3, 0, 0, 7, 0, 0, 0, 0,
      6, 0, 0, 1, 9, 5, 0, 0, 0,
      0, 9, 8, 0, 0, 0, 0, 6, 0,
      8, 0, 0, 0, 6, 0, 0, 0, 3,
      4, 0, 0, 8, 0, 3, 0, 0, 1,
      7, 0, 0, 0, 2, 0, 0, 0, 6,
      0, 6, 0, 0, 0, 0, 2, 8, 0,
      0, 0, 0, 4, 1, 9, 0, 0, 5,
      0, 0, 0, 0, 8, 0, 0, 7, 9
    ],
    solution: [
      5, 3, 4, 6, 7, 8, 9, 1, 2,
      6, 7, 2, 1, 9, 5, 3, 4, 8,
      1, 9, 8, 3, 4, 2, 5, 6, 7,
      8, 5, 9, 7, 6, 1, 4, 2, 3,
      4, 2, 6, 8, 5, 3, 7, 9, 1,
      7, 1, 3, 9, 2, 4, 8, 5, 6,
      9, 6, 1, 5, 3, 7, 2, 8, 4,
      2, 8, 7, 4, 1, 9, 6, 3, 5,
      3, 4, 5, 2, 8, 6, 1, 7, 9
    ]
  },
  MEDIUM: {
    puzzle: [
      0, 0, 0, 2, 6, 0, 7, 0, 1,
      6, 8, 0, 0, 7, 0, 0, 9, 0,
      1, 9, 0, 0, 0, 4, 5, 0, 0,
      8, 2, 0, 1, 0, 0, 0, 4, 0,
      0, 0, 4, 6, 0, 2, 9, 0, 0,
      0, 5, 0, 0, 0, 3, 0, 2, 8,
      0, 0, 9, 3, 0, 0, 0, 7, 4,
      0, 4, 0, 0, 5, 0, 0, 3, 6,
      7, 0, 3, 0, 1, 8, 0, 0, 0
    ],
    solution: [
      4, 3, 5, 2, 6, 9, 7, 8, 1,
      6, 8, 2, 5, 7, 1, 4, 9, 3,
      1, 9, 7, 8, 3, 4, 5, 6, 2,
      8, 2, 6, 1, 9, 5, 3, 4, 7,
      3, 7, 4, 6, 8, 2, 9, 1, 5,
      9, 5, 1, 7, 4, 3, 6, 2, 8,
      5, 1, 9, 3, 2, 6, 8, 7, 4,
      2, 4, 8, 9, 5, 7, 1, 3, 6,
      7, 6, 3, 4, 1, 8, 2, 5, 9
    ]
  }
};

const SudokuGame = ({ user, onLeave }) => {
  const [difficulty, setDifficulty] = useState('EASY');
  const [board, setBoard] = useState(Array(81).fill(0));
  const [initialFixed, setInitialFixed] = useState(new Set());
  const [selectedCell, setSelectedCell] = useState(null);
  const [mistakes, setMistakes] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  const [unlockedBanner, setUnlockedBanner] = useState(null);

  useEffect(() => {
    loadBoard('EASY');
  }, []);

  const loadBoard = (diff) => {
    const data = BOARDS[diff] || BOARDS.EASY;
    const initial = new Set();
    data.puzzle.forEach((val, idx) => {
      if (val > 0) initial.add(idx);
    });

    setBoard([...data.puzzle]);
    setInitialFixed(initial);
    setDifficulty(diff);
    setSelectedCell(null);
    setMistakes(0);
    setGameWon(false);
  };

  const handleCellClick = (idx) => {
    if (gameWon) return;
    setSelectedCell(idx);
    SoundEffects.playClick();
  };

  const handleNumberInput = async (num) => {
    if (selectedCell === null || initialFixed.has(selectedCell) || gameWon) return;

    const data = BOARDS[difficulty];
    const newBoard = [...board];
    newBoard[selectedCell] = num;
    setBoard(newBoard);

    // Check correctness against solution
    if (num > 0 && num !== data.solution[selectedCell]) {
      SoundEffects.playLoss();
      setMistakes(m => m + 1);
    } else {
      SoundEffects.playSafe();
    }

    // Check Win
    if (newBoard.join(',') === data.solution.join(',')) {
      setGameWon(true);
      SoundEffects.playWin();
      const score = Math.max(50, 500 - mistakes * 30);
      const res = await api.submitScore('SUDOKU', score, true, user);
      if (res?.unlockedAchievements?.length > 0) setUnlockedBanner(res.unlockedAchievements[0]);
    }
  };

  return (
    <div className="sudoku-container glass-panel">
      <div className="sudoku-header">
        <button className="btn-secondary" onClick={onLeave}>&larr; LEAVE</button>
        <div className="sudoku-diff-pills">
          {['EASY', 'MEDIUM'].map(diff => (
            <button
              key={diff}
              className={`diff-pill ${difficulty === diff ? 'active' : ''}`}
              onClick={() => loadBoard(diff)}
            >
              {diff}
            </button>
          ))}
        </div>
        <div className="mistakes-counter">
          Mistakes: <strong style={{ color: mistakes > 2 ? '#ff3b30' : '#00f3ff' }}>{mistakes}/3</strong>
        </div>
      </div>

      {unlockedBanner && (
        <div className="achievement-toast">
          <span>🏆 UNLOCKED: <strong>{unlockedBanner.title}</strong> (+{unlockedBanner.points} pts)</span>
        </div>
      )}

      {/* 9x9 Sudoku Grid */}
      <div className="sudoku-grid">
        {board.map((val, idx) => {
          const isFixed = initialFixed.has(idx);
          const isSelected = selectedCell === idx;
          const r = Math.floor(idx / 9);
          const c = idx % 9;
          const isBlockBorderR = c % 3 === 2 && c !== 8;
          const isBlockBorderB = r % 3 === 2 && r !== 8;

          return (
            <div
              key={idx}
              className={`sudoku-cell ${isFixed ? 'fixed' : ''} ${isSelected ? 'selected' : ''} ${isBlockBorderR ? 'border-r' : ''} ${isBlockBorderB ? 'border-b' : ''}`}
              onClick={() => handleCellClick(idx)}
            >
              {val > 0 ? val : ''}
            </div>
          );
        })}
      </div>

      {/* Number Pad */}
      <div className="numpad-row">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
          <button key={n} className="numpad-btn" onClick={() => handleNumberInput(n)}>
            {n}
          </button>
        ))}
        <button className="numpad-btn erase-btn" onClick={() => handleNumberInput(0)}>
          ⌫
        </button>
      </div>

      {gameWon && (
        <div className="finish-overlay">
          <h2 className="neon-text" style={{ color: '#00ff66' }}>🏆 PUZZLE SOLVED!</h2>
          <p style={{ color: '#fff', fontSize: '1.2rem', marginBottom: '15px' }}>
            Difficulty: {difficulty} | Mistakes: {mistakes}
          </p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn-primary" onClick={() => loadBoard(difficulty)}>PLAY AGAIN</button>
            <button className="btn-secondary" onClick={onLeave}>BACK TO HUB</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SudokuGame;
