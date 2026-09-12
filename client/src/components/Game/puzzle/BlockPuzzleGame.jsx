import React, { useEffect, useState } from 'react';
import SoundEffects from '../../../utils/SoundEffects';
import { api } from '../../../services/api';
import './BlockPuzzleGame.css';

const GRID_SIZE = 10;

// Tiered Piece Shapes for Dynamic Progressive Difficulty
// Higher tiers introduce large polyominoes, 5-block lines, and tricky geometries
const PIECE_SHAPES_BY_TIER = {
  // Tier 1: Novice friendly (1x1, 2-lines, 3-lines, 2x2 square)
  1: [
    { shape: [[1]], color: '#ffd600' },
    { shape: [[1, 1]], color: '#00f3ff' },
    { shape: [[1], [1]], color: '#00f3ff' },
    { shape: [[1, 1, 1]], color: '#00e676' },
    { shape: [[1], [1], [1]], color: '#00e676' },
    { shape: [[1, 1], [1, 1]], color: '#ff1744' },
    { shape: [[1, 0], [1, 1]], color: '#38bdf8' },
    { shape: [[0, 1], [1, 1]], color: '#38bdf8' }
  ],
  // Tier 2: Intermediate (4-lines, standard L-shapes, T-shapes)
  2: [
    { shape: [[1, 1, 1, 1]], color: '#ff9100' },
    { shape: [[1], [1], [1], [1]], color: '#ff9100' },
    { shape: [[1, 0], [1, 0], [1, 1]], color: '#2979ff' },
    { shape: [[0, 1], [0, 1], [1, 1]], color: '#2979ff' },
    { shape: [[1, 1, 1], [1, 0, 0]], color: '#2979ff' },
    { shape: [[1, 1, 1], [0, 0, 1]], color: '#2979ff' },
    { shape: [[1, 1, 1], [0, 1, 0]], color: '#00e5ff' },
    { shape: [[0, 1, 0], [1, 1, 1]], color: '#00e5ff' }
  ],
  // Tier 3: Challenging (5-lines, 3x3 big square, reverse corners)
  3: [
    { shape: [[1, 1, 1, 1, 1]], color: '#e040fb' },
    { shape: [[1], [1], [1], [1], [1]], color: '#e040fb' },
    { shape: [[1, 1, 1], [1, 1, 1], [1, 1, 1]], color: '#d500f9' },
    { shape: [[1, 1], [1, 0], [1, 0]], color: '#f43f5e' },
    { shape: [[1, 1], [0, 1], [0, 1]], color: '#f43f5e' },
    { shape: [[1, 0, 0], [1, 1, 1]], color: '#f43f5e' }
  ],
  // Tier 4: Master / Chaos (Cross plus, U-channel, diagonal step blocks)
  4: [
    { shape: [[0, 1, 0], [1, 1, 1], [0, 1, 0]], color: '#ec4899' },
    { shape: [[1, 0, 1], [1, 1, 1]], color: '#8b5cf6' },
    { shape: [[1, 1, 0], [0, 1, 1]], color: '#06b6d4' },
    { shape: [[0, 1, 1], [1, 1, 0]], color: '#06b6d4' },
    { shape: [[1, 1, 1], [1, 0, 1]], color: '#f59e0b' }
  ]
};

const PUZZLE_DIFFICULTY_LEVELS = [
  { level: 1, name: 'NOVICE', minScore: 0, color: '#00e676', maxTier: 1, multiplier: 1.0 },
  { level: 2, name: 'ADEPT', minScore: 350, color: '#00f3ff', maxTier: 2, multiplier: 1.25 },
  { level: 3, name: 'CHALLENGER', minScore: 900, color: '#ffd600', maxTier: 3, multiplier: 1.5 },
  { level: 4, name: 'EXPERT', minScore: 1800, color: '#ff9100', maxTier: 4, multiplier: 2.0 },
  { level: 5, name: 'CHAOS MASTER', minScore: 3200, color: '#ff0055', maxTier: 4, multiplier: 2.5 }
];

const getPuzzleDifficulty = (score) => {
  for (let i = PUZZLE_DIFFICULTY_LEVELS.length - 1; i >= 0; i--) {
    if (score >= PUZZLE_DIFFICULTY_LEVELS[i].minScore) {
      return PUZZLE_DIFFICULTY_LEVELS[i];
    }
  }
  return PUZZLE_DIFFICULTY_LEVELS[0];
};

const BlockPuzzleGame = ({ user, onLeave }) => {
  const [grid, setGrid] = useState(() => Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null)));
  const [trayPieces, setTrayPieces] = useState([]);
  const [selectedPieceIdx, setSelectedPieceIdx] = useState(null);
  const [hoverCell, setHoverCell] = useState(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameState, setGameState] = useState('MENU'); // MENU, PLAYING, GAMEOVER
  const [comboCount, setComboCount] = useState(0);
  const [clearingLines, setClearingLines] = useState({ rows: [], cols: [] });
  const [levelUpBanner, setLevelUpBanner] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem('block_puzzle_highscore');
    if (saved) setHighScore(parseInt(saved, 10));
  }, []);

  const generateTrayPieces = (currentScore = 0) => {
    const diff = getPuzzleDifficulty(currentScore);
    const availableShapes = [];

    // Collect pieces from Tier 1 up to current maxTier
    for (let t = 1; t <= diff.maxTier; t++) {
      const tierShapes = PIECE_SHAPES_BY_TIER[t] || [];
      // Higher tiers receive heavier presence at higher levels to steadily increase tension
      const weight = (t === diff.maxTier && diff.level > 1) ? 2 : 1;
      for (let w = 0; w < weight; w++) {
        availableShapes.push(...tierShapes);
      }
    }

    const pieces = [];
    for (let i = 0; i < 3; i++) {
      const template = availableShapes[Math.floor(Math.random() * availableShapes.length)];
      pieces.push({
        id: Math.random().toString(),
        shape: template.shape,
        color: template.color
      });
    }
    return pieces;
  };

  const startGame = () => {
    try {
      SoundEffects.init();
      SoundEffects.playMove();
    } catch (e) {}

    const emptyGrid = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null));

    setGrid(emptyGrid);
    setScore(0);
    setComboCount(0);
    setSelectedPieceIdx(null);
    setHoverCell(null);
    setLevelUpBanner(null);

    const newPieces = generateTrayPieces(0);
    setTrayPieces(newPieces);
    setGameState('PLAYING');
  };

  const canPlacePiece = (board, shape, r, c) => {
    const rows = shape.length;
    const cols = shape[0].length;

    if (r + rows > GRID_SIZE || c + cols > GRID_SIZE) return false;

    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        if (shape[i][j] === 1) {
          if (board[r + i][c + j] !== null) return false;
        }
      }
    }
    return true;
  };

  const checkAnyPieceCanFit = (board, pieces) => {
    for (let p of pieces) {
      if (!p) continue;
      for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
          if (canPlacePiece(board, p.shape, r, c)) {
            return true;
          }
        }
      }
    }
    return false;
  };

  const handleCellClick = (r, c) => {
    if (gameState !== 'PLAYING' || selectedPieceIdx === null || !trayPieces[selectedPieceIdx]) return;

    const currentPiece = trayPieces[selectedPieceIdx];
    if (!canPlacePiece(grid, currentPiece.shape, r, c)) {
      SoundEffects.playClick();
      return;
    }

    // Place piece on board
    SoundEffects.playMove();
    const newGrid = grid.map(row => [...row]);
    let blockCount = 0;

    for (let i = 0; i < currentPiece.shape.length; i++) {
      for (let j = 0; j < currentPiece.shape[0].length; j++) {
        if (currentPiece.shape[i][j] === 1) {
          newGrid[r + i][c + j] = currentPiece.color;
          blockCount++;
        }
      }
    }

    const currentDiff = getPuzzleDifficulty(score);
    let earnedScore = Math.round(blockCount * 10 * currentDiff.multiplier);

    // Check full rows & columns
    const fullRows = [];
    for (let i = 0; i < GRID_SIZE; i++) {
      if (newGrid[i].every(cell => cell !== null)) {
        fullRows.push(i);
      }
    }

    const fullCols = [];
    for (let j = 0; j < GRID_SIZE; j++) {
      let colFull = true;
      for (let i = 0; i < GRID_SIZE; i++) {
        if (newGrid[i][j] === null) {
          colFull = false;
          break;
        }
      }
      if (colFull) fullCols.push(j);
    }

    const totalLines = fullRows.length + fullCols.length;
    if (totalLines > 0) {
      SoundEffects.playWin();
      const lineBase = totalLines * 100 * (totalLines > 1 ? totalLines * 2 : 1);
      earnedScore += Math.round(lineBase * currentDiff.multiplier);
      setComboCount(prev => prev + 1);

      // Flash animation
      setClearingLines({ rows: fullRows, cols: fullCols });
      setTimeout(() => {
        setClearingLines({ rows: [], cols: [] });
      }, 350);

      // Clear the rows
      fullRows.forEach(rowIdx => {
        for (let j = 0; j < GRID_SIZE; j++) newGrid[rowIdx][j] = null;
      });

      // Clear the cols
      fullCols.forEach(colIdx => {
        for (let i = 0; i < GRID_SIZE; i++) newGrid[i][colIdx] = null;
      });
    }

    const nextScore = score + earnedScore;
    setScore(nextScore);
    setGrid(newGrid);

    // Check Level Up!
    const nextDiff = getPuzzleDifficulty(nextScore);
    if (nextDiff.level > currentDiff.level) {
      SoundEffects.playTrophy();
      setLevelUpBanner(nextDiff);
      setTimeout(() => setLevelUpBanner(null), 3200);
    }

    // Remove used piece from tray
    const nextTray = [...trayPieces];
    nextTray[selectedPieceIdx] = null;
    setSelectedPieceIdx(null);
    setHoverCell(null);

    // If tray is empty, generate 3 new pieces with updated difficulty pool
    let activePieces = nextTray.filter(Boolean);
    if (activePieces.length === 0) {
      activePieces = generateTrayPieces(nextScore);
      setTrayPieces(activePieces);
    } else {
      setTrayPieces(nextTray);
    }

    // Check Game Over
    if (!checkAnyPieceCanFit(newGrid, activePieces)) {
      SoundEffects.playLoss();
      handleGameOver(nextScore);
    }
  };

  const handleGameOver = async (finalScore) => {
    setGameState('GAMEOVER');
    if (finalScore > highScore) {
      setHighScore(finalScore);
      localStorage.setItem('block_puzzle_highscore', finalScore.toString());
    }

    if (user?.id) {
      try {
        await api.submitScore('BLOCK_PUZZLE', finalScore, finalScore >= 300, user);
      } catch (err) {}
    }
  };

  // Preview overlay checks
  const getCellPreviewClass = (r, c) => {
    if (selectedPieceIdx === null || !hoverCell || !trayPieces[selectedPieceIdx]) return '';

    const piece = trayPieces[selectedPieceIdx];
    const hr = hoverCell.r;
    const hc = hoverCell.c;

    const pr = r - hr;
    const pc = c - hc;

    if (pr >= 0 && pr < piece.shape.length && pc >= 0 && pc < piece.shape[0].length) {
      if (piece.shape[pr][pc] === 1) {
        const valid = canPlacePiece(grid, piece.shape, hr, hc);
        return valid ? 'preview-valid' : 'preview-invalid';
      }
    }
    return '';
  };

  const currentDiff = getPuzzleDifficulty(score);

  return (
    <div className="block-puzzle-container">
      <div className="puzzle-wrapper">
        {/* Floating Level Up Banner */}
        {levelUpBanner && (
          <div className="puzzle-levelup-banner" style={{ borderColor: levelUpBanner.color }}>
            <span className="lvlup-icon">⚡</span>
            <div className="lvlup-text">
              <strong>LEVEL UP: {levelUpBanner.name} (L{levelUpBanner.level})!</strong>
              <small>Harder shapes arriving • {levelUpBanner.multiplier}x Score Bonus!</small>
            </div>
          </div>
        )}

        {/* Header HUD */}
        <div className="puzzle-header">
          <button className="btn-tertiary" onClick={onLeave}>
            ← EXIT TO HUB
          </button>
          <div className="puzzle-hud">
            <div className="puzzle-stat">
              <span style={{ color: '#aaa', fontSize: '0.8rem' }}>SCORE</span>
              <strong style={{ color: '#00f3ff', fontSize: '1.3rem' }}>{score}</strong>
            </div>
            <div className="puzzle-stat puzzle-diff-stat" style={{ borderColor: currentDiff.color }}>
              <span style={{ color: '#aaa', fontSize: '0.75rem' }}>DIFFICULTY</span>
              <strong style={{ color: currentDiff.color, fontSize: '0.95rem' }}>
                L{currentDiff.level} • {currentDiff.name} <span className="diff-mult">({currentDiff.multiplier}x)</span>
              </strong>
            </div>
            <div className="puzzle-stat">
              <span style={{ color: '#aaa', fontSize: '0.8rem' }}>HIGH SCORE</span>
              <strong style={{ color: '#ffd600', fontSize: '1.3rem' }}>{highScore}</strong>
            </div>
          </div>
          <div style={{ width: '60px' }}></div>
        </div>

        {/* 10x10 Matrix Grid */}
        <div className="board-10x10">
          {grid.map((row, r) =>
            row.map((cellColor, c) => {
              const isRowClearing = clearingLines.rows.includes(r);
              const isColClearing = clearingLines.cols.includes(c);
              const previewCls = getCellPreviewClass(r, c);

              return (
                <div
                  key={`${r}-${c}`}
                  className={`cell-10x10 ${cellColor ? 'filled' : ''} ${previewCls} ${
                    isRowClearing || isColClearing ? 'clearing' : ''
                  }`}
                  style={{
                    backgroundColor: cellColor || undefined,
                    color: cellColor || undefined
                  }}
                  onMouseEnter={() => setHoverCell({ r, c })}
                  onClick={() => handleCellClick(r, c)}
                />
              );
            })
          )}
        </div>

        {/* Piece Selection Tray */}
        <div className="pieces-tray">
          {trayPieces.map((piece, idx) => {
            if (!piece) return <div key={idx} style={{ width: '80px' }} />;
            return (
              <div
                key={piece.id}
                className={`tray-piece ${selectedPieceIdx === idx ? 'selected' : ''}`}
                style={{
                  gridTemplateColumns: `repeat(${piece.shape[0].length}, 1fr)`,
                  gridTemplateRows: `repeat(${piece.shape.length}, 1fr)`
                }}
                onClick={() => {
                  setSelectedPieceIdx(idx);
                  SoundEffects.playClick();
                }}
              >
                {piece.shape.map((row, pr) =>
                  row.map((cell, pc) => (
                    <div
                      key={`${pr}-${pc}`}
                      className="tray-cell"
                      style={{
                        backgroundColor: cell === 1 ? piece.color : 'transparent',
                        borderColor: cell === 1 ? 'rgba(255,255,255,0.4)' : 'transparent'
                      }}
                    />
                  ))
                )}
              </div>
            );
          })}
        </div>

        {/* Overlays */}
        {gameState === 'MENU' && (
          <div className="puzzle-overlay" onClick={(e) => e.stopPropagation()}>
            <h1 className="puzzle-title">NEON BLOCK JEWEL 10x10</h1>
            <p style={{ color: '#ccc', maxWidth: '420px', lineHeight: 1.5 }}>
              Drag or tap jewel shapes onto the 10x10 matrix. Fill entire horizontal rows or vertical columns to blast laser lines!
            </p>
            <div className="puzzle-diff-rules-hint">
              <span>🔥 <b>Progressive Difficulty</b>: Score higher to unlock greater multipliers, but beware of tricky multi-block polyominoes!</span>
            </div>
            <button
              className="puzzle-btn-play"
              onClick={(e) => {
                e.stopPropagation();
                startGame();
              }}
            >
              PLAY PUZZLE 🧱
            </button>
          </div>
        )}

        {gameState === 'GAMEOVER' && (
          <div className="puzzle-overlay" onClick={(e) => e.stopPropagation()}>
            <h1 className="puzzle-title" style={{ color: '#ff1744' }}>NO MORE MOVES!</h1>
            <div className="gameover-stats-grid">
              <div className="go-stat-cell">
                <span className="go-stat-lbl">LEVEL REACHED</span>
                <strong style={{ color: currentDiff.color }}>L{currentDiff.level} • {currentDiff.name}</strong>
              </div>
              <div className="go-stat-cell">
                <span className="go-stat-lbl">FINAL SCORE</span>
                <strong style={{ color: '#00f3ff' }}>{score}</strong>
              </div>
              <div className="go-stat-cell">
                <span className="go-stat-lbl">BONUS MULTIPLIER</span>
                <strong style={{ color: '#ffd600' }}>{currentDiff.multiplier}x</strong>
              </div>
            </div>
            {score >= highScore && score > 0 && (
              <div style={{ color: '#ffd600', fontWeight: 'bold' }}>
                🏆 NEW ALL-TIME RECORD!
              </div>
            )}
            <button
              className="puzzle-btn-play"
              onClick={(e) => {
                e.stopPropagation();
                startGame();
              }}
            >
              PLAY AGAIN 🔄
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BlockPuzzleGame;
