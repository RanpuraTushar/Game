import React, { useEffect, useState } from 'react';
import SoundEffects from '../../../utils/SoundEffects';
import { api } from '../../../services/api';
import './BlockPuzzleGame.css';

const GRID_SIZE = 10;

const PIECE_SHAPES = [
  // 1-Block
  { shape: [[1]], color: '#ffd600' },

  // 2-Blocks
  { shape: [[1, 1]], color: '#00f3ff' },
  { shape: [[1], [1]], color: '#00f3ff' },

  // 3-Blocks Lines
  { shape: [[1, 1, 1]], color: '#00e676' },
  { shape: [[1], [1], [1]], color: '#00e676' },

  // 4-Blocks Lines
  { shape: [[1, 1, 1, 1]], color: '#ff9100' },
  { shape: [[1], [1], [1], [1]], color: '#ff9100' },

  // 5-Blocks Lines
  { shape: [[1, 1, 1, 1, 1]], color: '#e040fb' },
  { shape: [[1], [1], [1], [1], [1]], color: '#e040fb' },

  // 2x2 Square
  { shape: [[1, 1], [1, 1]], color: '#ff1744' },

  // 3x3 Square
  { shape: [[1, 1, 1], [1, 1, 1], [1, 1, 1]], color: '#d500f9' },

  // L-Shapes
  { shape: [[1, 0], [1, 0], [1, 1]], color: '#2979ff' },
  { shape: [[0, 1], [0, 1], [1, 1]], color: '#2979ff' },
  { shape: [[1, 1, 1], [1, 0, 0]], color: '#2979ff' },
  { shape: [[1, 1, 1], [0, 0, 1]], color: '#2979ff' },

  // T-Shapes
  { shape: [[1, 1, 1], [0, 1, 0]], color: '#00e5ff' },
  { shape: [[0, 1, 0], [1, 1, 1]], color: '#00e5ff' }
];

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

  useEffect(() => {
    const saved = localStorage.getItem('block_puzzle_highscore');
    if (saved) setHighScore(parseInt(saved, 10));
  }, []);

  const startGame = () => {
    SoundEffects.init();
    SoundEffects.playMove();

    const emptyGrid = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null));
    setGrid(emptyGrid);
    setScore(0);
    setComboCount(0);
    setSelectedPieceIdx(null);
    setHoverCell(null);

    const newPieces = generateTrayPieces();
    setTrayPieces(newPieces);
    setGameState('PLAYING');
  };

  const generateTrayPieces = () => {
    const pieces = [];
    for (let i = 0; i < 3; i++) {
      const template = PIECE_SHAPES[Math.floor(Math.random() * PIECE_SHAPES.length)];
      pieces.push({
        id: Math.random().toString(),
        shape: template.shape,
        color: template.color
      });
    }
    return pieces;
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

    let earnedScore = blockCount * 10;

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
      earnedScore += totalLines * 100 * (totalLines > 1 ? totalLines * 2 : 1);
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

    // Remove used piece from tray
    const nextTray = [...trayPieces];
    nextTray[selectedPieceIdx] = null;
    setSelectedPieceIdx(null);
    setHoverCell(null);

    // If tray is empty, generate 3 new pieces
    let activePieces = nextTray.filter(Boolean);
    if (activePieces.length === 0) {
      activePieces = generateTrayPieces();
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
        await api.post('/games/score', {
          gameKey: 'BLOCK_PUZZLE',
          score: finalScore
        });
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

  return (
    <div className="block-puzzle-container">
      <div className="puzzle-wrapper">
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
            <div className="puzzle-stat">
              <span style={{ color: '#aaa', fontSize: '0.8rem' }}>HIGH SCORE</span>
              <strong style={{ color: '#ffd600', fontSize: '1.3rem' }}>{highScore}</strong>
            </div>
          </div>
          <div style={{ width: '80px' }}></div>
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
          <div className="puzzle-overlay">
            <h1 className="puzzle-title">NEON BLOCK JEWEL 10x10</h1>
            <p style={{ color: '#ccc', maxWidth: '420px', lineHeight: 1.5 }}>
              Drag or tap jewel shapes onto the 10x10 matrix. Fill entire horizontal rows or vertical columns to blast laser lines!
            </p>
            <button className="puzzle-btn-play" onClick={startGame}>
              PLAY PUZZLE 🧱
            </button>
          </div>
        )}

        {gameState === 'GAMEOVER' && (
          <div className="puzzle-overlay">
            <h1 className="puzzle-title" style={{ color: '#ff1744' }}>NO MORE MOVES!</h1>
            <p style={{ fontSize: '1.2rem', color: '#fff' }}>
              Final Score: <strong style={{ color: '#00f3ff' }}>{score}</strong>
            </p>
            {score >= highScore && score > 0 && (
              <div style={{ color: '#ffd600', fontWeight: 'bold' }}>
                🏆 NEW RECORD!
              </div>
            )}
            <button className="puzzle-btn-play" onClick={startGame}>
              PLAY AGAIN 🔄
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BlockPuzzleGame;
