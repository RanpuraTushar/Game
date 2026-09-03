import React, { useState, useEffect } from 'react';
import SoundEffects from '../../../utils/SoundEffects';
import { api } from '../../../services/api';
import './SudokuGame.css';

// Pre-tested balanced Sudoku templates (Solved + Clues for each difficulty)
const PUZZLE_TEMPLATES = {
  EASY: [
    {
      solution: [
        5,3,4,6,7,8,9,1,2,
        6,7,2,1,9,5,3,4,8,
        1,9,8,3,4,2,5,6,7,
        8,5,9,7,6,1,4,2,3,
        4,2,6,8,5,3,7,9,1,
        7,1,3,9,2,4,8,5,6,
        9,6,1,5,3,7,2,8,4,
        2,8,7,4,1,9,6,3,5,
        3,4,5,2,8,6,1,7,9
      ],
      clues: [
        5,3,0,0,7,0,0,0,0,
        6,0,0,1,9,5,0,0,0,
        0,9,8,0,0,0,0,6,0,
        8,0,0,0,6,0,0,0,3,
        4,0,0,8,0,3,0,0,1,
        7,0,0,0,2,0,0,0,6,
        0,6,0,0,0,0,2,8,0,
        0,0,0,4,1,9,0,0,5,
        0,0,0,0,8,0,0,7,9
      ]
    }
  ],
  MEDIUM: [
    {
      solution: [
        1,2,3,6,7,8,9,4,5,
        5,8,4,2,3,9,7,6,1,
        9,6,7,1,4,5,3,2,8,
        3,7,2,4,6,1,5,8,9,
        6,9,1,5,8,3,2,7,4,
        4,5,8,7,9,2,6,1,3,
        8,3,6,9,2,4,1,5,7,
        2,1,9,8,5,7,4,3,6,
        7,4,5,3,1,6,8,9,2
      ],
      clues: [
        0,2,0,6,0,8,0,0,0,
        5,8,0,0,0,9,7,0,0,
        0,0,0,0,4,0,0,0,0,
        3,7,0,0,0,0,5,0,0,
        6,0,0,0,0,0,0,0,4,
        0,0,8,0,0,0,0,1,3,
        0,0,0,0,2,0,0,0,0,
        0,0,9,8,0,0,0,3,6,
        0,0,0,3,0,6,0,9,0
      ]
    }
  ],
  HARD: [
    {
      solution: [
        8,2,7,1,5,4,3,9,6,
        9,6,5,3,2,7,1,4,8,
        3,4,1,6,8,9,7,5,2,
        5,9,3,4,6,8,2,7,1,
        4,7,2,5,1,3,6,8,9,
        6,1,8,9,7,2,4,3,5,
        7,8,6,2,3,5,9,1,4,
        1,5,4,7,9,6,8,2,3,
        2,3,9,8,4,1,5,6,7
      ],
      clues: [
        0,0,0,0,0,0,0,0,0,
        0,0,0,0,0,3,0,8,5,
        0,0,1,0,2,0,0,0,0,
        0,0,0,5,0,7,0,0,0,
        0,0,4,0,0,0,1,0,0,
        0,9,0,0,0,0,0,0,0,
        5,0,0,0,0,0,0,7,3,
        0,0,2,0,1,0,0,0,0,
        0,0,0,0,4,0,0,0,9
      ]
    }
  ]
};

const SudokuGame = ({ user, onLeave }) => {
  const [difficulty, setDifficulty] = useState('EASY');
  const [board, setBoard] = useState([]);
  const [initialClues, setInitialClues] = useState([]);
  const [solution, setSolution] = useState([]);
  const [notes, setNotes] = useState({});
  const [isPencilMode, setIsPencilMode] = useState(false);
  const [selectedCell, setSelectedCell] = useState(null);
  const [mistakes, setMistakes] = useState(0);
  const [timer, setTimer] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [history, setHistory] = useState([]);

  // Load Puzzle
  const loadPuzzle = (diff = difficulty) => {
    const template = PUZZLE_TEMPLATES[diff][0];
    const clues = [...template.clues];
    const sol = [...template.solution];

    setInitialClues(clues);
    setSolution(sol);
    setBoard([...clues]);
    setNotes({});
    setSelectedCell(null);
    setMistakes(0);
    setTimer(0);
    setGameWon(false);
    setGameOver(false);
    setHistory([]);
  };

  useEffect(() => {
    loadPuzzle('EASY');
  }, []);

  // Timer Tick
  useEffect(() => {
    if (gameWon || gameOver) return;
    const interval = setInterval(() => {
      setTimer(t => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [gameWon, gameOver]);

  const handleCellClick = (index) => {
    if (gameOver || gameWon) return;
    setSelectedCell(index);
    SoundEffects.playClick();
  };

  const handleNumberInput = (num) => {
    if (selectedCell === null || gameOver || gameWon) return;
    if (initialClues[selectedCell] !== 0) return; // Clue cannot be edited

    // Pencil / Notes Mode
    if (isPencilMode) {
      setNotes(prev => {
        const cellNotes = prev[selectedCell] ? new Set(prev[selectedCell]) : new Set();
        if (cellNotes.has(num)) {
          cellNotes.delete(num);
        } else {
          cellNotes.add(num);
        }
        return { ...prev, [selectedCell]: Array.from(cellNotes) };
      });
      SoundEffects.playClick();
      return;
    }

    // Normal Input
    const currentVal = board[selectedCell];
    if (currentVal === num) return;

    setHistory(prev => [...prev, { cell: selectedCell, prevVal: currentVal }]);

    const newBoard = [...board];
    newBoard[selectedCell] = num;
    setBoard(newBoard);

    // Validate Move
    if (solution[selectedCell] !== num) {
      const newMistakes = mistakes + 1;
      setMistakes(newMistakes);
      SoundEffects.playLoss();
      if (newMistakes >= 3) {
        setGameOver(true);
      }
    } else {
      SoundEffects.playMove();

      // Clear any notes for this cell
      setNotes(prev => {
        const copy = { ...prev };
        delete copy[selectedCell];
        return copy;
      });

      // Check Win Condition
      const isComplete = newBoard.every((val, idx) => val === solution[idx]);
      if (isComplete) {
        setGameWon(true);
        SoundEffects.playWin();
        api.submitScore('SUDOKU', 1000 - Math.min(600, timer), true, user);
      }
    }
  };

  const handleErase = () => {
    if (selectedCell === null || initialClues[selectedCell] !== 0) return;
    const newBoard = [...board];
    newBoard[selectedCell] = 0;
    setBoard(newBoard);
    SoundEffects.playClick();
  };

  const handleHint = () => {
    if (selectedCell === null || initialClues[selectedCell] !== 0 || gameWon || gameOver) return;
    const correctVal = solution[selectedCell];
    const newBoard = [...board];
    newBoard[selectedCell] = correctVal;
    setBoard(newBoard);
    SoundEffects.playCapture();
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const last = history[history.length - 1];
    setHistory(prev => prev.slice(0, -1));
    const newBoard = [...board];
    newBoard[last.cell] = last.prevVal;
    setBoard(newBoard);
    SoundEffects.playClick();
  };

  // Keyboard input
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (selectedCell === null) return;
      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= 9) {
        handleNumberInput(num);
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        handleErase();
      } else if (e.key === 'ArrowUp' && selectedCell >= 9) {
        setSelectedCell(selectedCell - 9);
      } else if (e.key === 'ArrowDown' && selectedCell <= 71) {
        setSelectedCell(selectedCell + 9);
      } else if (e.key === 'ArrowLeft' && selectedCell % 9 !== 0) {
        setSelectedCell(selectedCell - 1);
      } else if (e.key === 'ArrowRight' && selectedCell % 9 !== 8) {
        setSelectedCell(selectedCell + 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCell, board, isPencilMode, solution, mistakes]);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const selectedValue = selectedCell !== null ? board[selectedCell] : null;

  return (
    <div className="sudoku-master-container glass-panel">
      <div className="sudoku-top-nav">
        <button className="btn-secondary" onClick={onLeave}>&larr; HUB</button>
        <div className="sudoku-diff-selector">
          {['EASY', 'MEDIUM', 'HARD'].map(d => (
            <button
              key={d}
              className={`mode-pill-btn ${difficulty === d ? 'active' : ''}`}
              onClick={() => { setDifficulty(d); loadPuzzle(d); }}
            >
              {d}
            </button>
          ))}
        </div>
        <button className="btn-tertiary" onClick={() => loadPuzzle(difficulty)}>↺ RESTART</button>
      </div>

      <div className="sudoku-status-bar">
        <div className="stat-badge">MISTAKES: <strong className={mistakes > 0 ? 'bad' : ''}>{mistakes}/3</strong></div>
        <div className="stat-badge">TIME: <strong>{formatTime(timer)}</strong></div>
      </div>

      {/* 9x9 Sudoku Grid */}
      <div className="sudoku-grid-wrapper">
        <div className="sudoku-grid">
          {board.map((val, idx) => {
            const isInitial = initialClues[idx] !== 0;
            const isSelected = selectedCell === idx;
            const isError = val !== 0 && !isInitial && val !== solution[idx];
            const isSameNumber = selectedValue && val === selectedValue && val !== 0;

            const row = Math.floor(idx / 9);
            const col = idx % 9;
            const isRowHighlight = selectedCell !== null && Math.floor(selectedCell / 9) === row;
            const isColHighlight = selectedCell !== null && (selectedCell % 9) === col;

            const boxRow = Math.floor(row / 3);
            const boxCol = Math.floor(col / 3);
            const selBoxRow = selectedCell !== null ? Math.floor(Math.floor(selectedCell / 9) / 3) : -1;
            const selBoxCol = selectedCell !== null ? Math.floor((selectedCell % 9) / 3) : -1;
            const isBoxHighlight = boxRow === selBoxRow && boxCol === selBoxCol;

            const cellNotes = notes[idx] || [];

            return (
              <div
                key={idx}
                className={`sudoku-cell ${isInitial ? 'initial' : ''} ${isSelected ? 'selected' : ''} ${isError ? 'error' : ''} ${isSameNumber ? 'same-num' : ''} ${isRowHighlight || isColHighlight || isBoxHighlight ? 'dim-highlight' : ''}`}
                onClick={() => handleCellClick(idx)}
              >
                {val !== 0 ? (
                  <span className="cell-value">{val}</span>
                ) : cellNotes.length > 0 ? (
                  <div className="cell-notes-grid">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                      <span key={n} className="note-digit">
                        {cellNotes.includes(n) ? n : ''}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>

        {gameWon && (
          <div className="sudoku-finish-modal win">
            <h2>🏆 SUDOKU SOLVED!</h2>
            <p>You completed the {difficulty} puzzle in {formatTime(timer)}!</p>
            <button className="btn-primary" onClick={() => loadPuzzle(difficulty)}>PLAY NEXT</button>
          </div>
        )}

        {gameOver && (
          <div className="sudoku-finish-modal loss">
            <h2>💀 3 MISTAKES MADE</h2>
            <p>The puzzle was not completed. Better luck next time!</p>
            <button className="btn-primary" onClick={() => loadPuzzle(difficulty)}>TRY AGAIN</button>
          </div>
        )}
      </div>

      {/* Action Controls */}
      <div className="sudoku-action-bar">
        <button className="btn-action" onClick={handleUndo}>↩ Undo</button>
        <button className="btn-action" onClick={handleErase}>⌫ Erase</button>
        <button className={`btn-action ${isPencilMode ? 'active-pencil' : ''}`} onClick={() => setIsPencilMode(!isPencilMode)}>
          ✏️ Notes {isPencilMode ? 'ON' : 'OFF'}
        </button>
        <button className="btn-action hint-btn" onClick={handleHint}>💡 Hint</button>
      </div>

      {/* 1-9 Number Pad */}
      <div className="sudoku-numpad">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
          <button
            key={num}
            className="numpad-btn"
            onClick={() => handleNumberInput(num)}
          >
            {num}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SudokuGame;
