import React, { useState, useEffect, useRef } from 'react';
import soundFX from '../../../utils/SoundEffects';
import { api } from '../../../services/api';
import './CrosswordGame.css';

const GRID_SIZE = 9;

// Layout definition: r, c, solution letter, cell number (if word start)
const CROSSWORD_SOLUTION = [
  // Row 0
  { r: 0, c: 2, char: 'A', num: 1 },
  // Row 1
  { r: 1, c: 1, char: 'R', num: 2 }, { r: 1, c: 2, char: 'P' }, { r: 1, c: 3, char: 'A' }, { r: 1, c: 4, char: 'C' }, { r: 1, c: 5, char: 'H', num: 3 }, { r: 1, c: 6, char: 'E' },
  // Row 2
  { r: 2, c: 2, char: 'P' }, { r: 2, c: 5, char: 'E' },
  // Row 3
  { r: 3, c: 0, char: 'P', num: 4 }, { r: 3, c: 1, char: 'Y' }, { r: 3, c: 2, char: 'L' }, { r: 3, c: 3, char: 'O' }, { r: 3, c: 4, char: 'N' }, { r: 3, c: 5, char: 'S' }, { r: 3, c: 7, char: 'N', num: 5 },
  // Row 4
  { r: 4, c: 2, char: 'E' }, { r: 4, c: 5, char: 'S' }, { r: 4, c: 7, char: 'O' },
  // Row 5
  { r: 5, c: 2, char: 'R', num: 6 }, { r: 5, c: 3, char: 'O' }, { r: 5, c: 4, char: 'B' }, { r: 5, c: 5, char: 'O' }, { r: 5, c: 6, char: 'T' }, { r: 5, c: 7, char: 'D' },
  // Row 6
  { r: 6, c: 7, char: 'E' },
  // Row 7
  { r: 7, c: 1, char: 'C', num: 7 }, { r: 7, c: 2, char: 'Y' }, { r: 7, c: 3, char: 'B' }, { r: 7, c: 4, char: 'E' }, { r: 7, c: 5, char: 'R' }
];

const CLUES_DATA = {
  across: [
    { num: 2, clue: 'APACHE - Popular open source web server', answer: 'APACHE', r: 1, c: 1 },
    { num: 4, clue: 'PYLONS - Tower structures supporting high voltage cables', answer: 'PYLONS', r: 3, c: 0 },
    { num: 6, clue: 'ROBOT - Automated mechanical electro machine', answer: 'ROBOT', r: 5, c: 2 },
    { num: 7, clue: 'CYBER - Futuristic computer and internet prefix', answer: 'CYBER', r: 7, c: 1 }
  ],
  down: [
    { num: 1, clue: 'APPLE - Tech giant known for iPhone and Mac', answer: 'APPLE', r: 0, c: 2 },
    { num: 3, clue: 'HESSO - Short for hesitation / chess defense', answer: 'HESSO', r: 1, c: 5 },
    { num: 5, clue: 'NODE - Fast JavaScript runtime on server', answer: 'NODE', r: 3, c: 7 }
  ]
};

export default function CrosswordGame({ user, onLeave }) {
  const [gameState, setGameState] = useState('PLAYING'); // PLAYING, WON
  const [userGrid, setUserGrid] = useState({}); // { 'r-c': 'A' }
  const [selectedCell, setSelectedCell] = useState({ r: 1, c: 1 });
  const [validatedStatus, setValidatedStatus] = useState({}); // { 'r-c': 'correct' | 'wrong' }
  const [timer, setTimer] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [highScore, setHighScore] = useState(0);

  const timerRef = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem('crossword_high_score');
    if (saved) setHighScore(parseInt(saved, 10));

    timerRef.current = setInterval(() => {
      setTimer(t => t + 1);
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, []);

  const getCellMeta = (r, c) => {
    return CROSSWORD_SOLUTION.find(item => item.r === r && item.c === c);
  };

  // Keyboard navigation & typing
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameState !== 'PLAYING') return;

      const { r, c } = selectedCell;

      if (e.key >= 'a' && e.key <= 'z' || e.key >= 'A' && e.key <= 'Z') {
        const char = e.key.toUpperCase();
        soundFX.playTokenStep();
        setUserGrid(prev => ({ ...prev, [`${r}-${c}`]: char }));

        // Auto advance to next column if playable
        if (getCellMeta(r, c + 1)) {
          setSelectedCell({ r, c: c + 1 });
        } else if (getCellMeta(r + 1, c)) {
          setSelectedCell({ r: r + 1, c });
        }
      } else if (e.key === 'Backspace') {
        soundFX.playClick();
        setUserGrid(prev => {
          const updated = { ...prev };
          delete updated[`${r}-${c}`];
          return updated;
        });
      } else if (e.key === 'ArrowRight' && c < GRID_SIZE - 1) {
        if (getCellMeta(r, c + 1)) setSelectedCell({ r, c: c + 1 });
      } else if (e.key === 'ArrowLeft' && c > 0) {
        if (getCellMeta(r, c - 1)) setSelectedCell({ r, c: c - 1 });
      } else if (e.key === 'ArrowDown' && r < GRID_SIZE - 1) {
        if (getCellMeta(r + 1, c)) setSelectedCell({ r: r + 1, c });
      } else if (e.key === 'ArrowUp' && r > 0) {
        if (getCellMeta(r - 1, c)) setSelectedCell({ r: r - 1, c });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCell, gameState]);

  // Check answers
  const handleCheckAnswers = () => {
    soundFX.playClick();
    const statusMap = {};
    let allCorrect = true;

    CROSSWORD_SOLUTION.forEach(cell => {
      const key = `${cell.r}-${cell.c}`;
      const entered = userGrid[key];
      if (entered === cell.char) {
        statusMap[key] = 'correct';
      } else {
        statusMap[key] = 'wrong';
        allCorrect = false;
      }
    });

    setValidatedStatus(statusMap);

    if (allCorrect) {
      clearInterval(timerRef.current);
      soundFX.playWinFanfare();
      setGameState('WON');
      const score = Math.max(1200 - timer * 4 - hintsUsed * 100, 150);
      if (score > highScore) {
        setHighScore(score);
        localStorage.setItem('crossword_high_score', score.toString());
        if (user?.id) {
          api.submitScore(user.id, 'CROSSWORD_PUZZLE', score).catch(() => {});
        }
      }
    } else {
      soundFX.playLoss();
    }
  };

  // Reveal current cell hint
  const handleRevealCell = () => {
    const meta = getCellMeta(selectedCell.r, selectedCell.c);
    if (!meta) return;

    soundFX.playSafe();
    setHintsUsed(h => h + 1);
    const key = `${selectedCell.r}-${selectedCell.c}`;
    setUserGrid(prev => ({ ...prev, [key]: meta.char }));
  };

  return (
    <div className="crossword-game-container">
      {/* Header */}
      <div className="crossword-header">
        <div className="crossword-title-group">
          <h2>🧩 CYBER CROSSWORD CHALLENGE</h2>
          <p>Fill in the words across and down using keyboard</p>
        </div>

        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <div style={{ fontSize: '0.85rem', color: '#a0aec0' }}>
            HINTS USED: <strong style={{ color: '#ffd600' }}>{hintsUsed}</strong>
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#00f3ff' }}>
            ⏱️ {timer}s
          </div>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="crossword-workspace">
        {/* Grid Board */}
        <div className="crossword-grid-board">
          {Array.from({ length: GRID_SIZE }).map((_, r) => (
            Array.from({ length: GRID_SIZE }).map((_, c) => {
              const meta = getCellMeta(r, c);
              const isBlocked = !meta;
              const isSelected = selectedCell.r === r && selectedCell.c === c;
              const cellKey = `${r}-${c}`;
              const val = userGrid[cellKey] || '';
              const status = validatedStatus[cellKey] || '';

              return (
                <div
                  key={cellKey}
                  className={`cw-cell ${isBlocked ? 'blocked' : ''} ${isSelected ? 'selected' : ''} ${status}`}
                  onClick={() => {
                    if (!isBlocked) {
                      soundFX.playClick();
                      setSelectedCell({ r, c });
                    }
                  }}
                >
                  {meta?.num && <span className="cell-num">{meta.num}</span>}
                  {!isBlocked && <span>{val}</span>}
                </div>
              );
            })
          ))}
        </div>

        {/* Clues Panel */}
        <div className="clues-panel">
          <div className="clues-section">
            <h4>ACROSS ➡️</h4>
            {CLUES_DATA.across.map(clue => (
              <div
                key={clue.num}
                className="clue-item"
                onClick={() => {
                  setSelectedCell({ r: clue.r, c: clue.c });
                  soundFX.playClick();
                }}
              >
                <strong>{clue.num}.</strong> {clue.clue}
              </div>
            ))}
          </div>

          <div className="clues-section">
            <h4>DOWN ⬇️</h4>
            {CLUES_DATA.down.map(clue => (
              <div
                key={clue.num}
                className="clue-item"
                onClick={() => {
                  setSelectedCell({ r: clue.r, c: clue.c });
                  soundFX.playClick();
                }}
              >
                <strong>{clue.num}.</strong> {clue.clue}
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
            <button className="btn-secondary" style={{ flex: 1, padding: '8px' }} onClick={handleRevealCell}>
              💡 REVEAL CELL
            </button>
            <button className="btn-primary" style={{ flex: 1, padding: '8px' }} onClick={handleCheckAnswers}>
              🔍 CHECK PUZZLE
            </button>
          </div>
        </div>
      </div>

      {/* Won Overlay */}
      {gameState === 'WON' && (
        <div className="platformer-overlay">
          <h1 className="overlay-title" style={{ color: '#00ff66' }}>CROSSWORD SOLVED! 🎉</h1>
          <p className="overlay-sub">Every word correctly decoded!</p>

          <div className="overlay-stats">
            <div className="overlay-stat-box">
              <div className="val">{timer}s</div>
              <div className="lbl">COMPLETION TIME</div>
            </div>
            <div className="overlay-stat-box">
              <div className="val">{highScore}</div>
              <div className="lbl">PUZZLE SCORE</div>
            </div>
          </div>

          <div className="overlay-btn-group">
            <button className="btn-secondary" onClick={onLeave}>EXIT TO HUB</button>
          </div>
        </div>
      )}
    </div>
  );
}
