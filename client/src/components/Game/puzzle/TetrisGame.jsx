import React, { useState, useEffect, useRef, useCallback } from 'react';
import SoundEffects from '../../../utils/SoundEffects';
import { api } from '../../../services/api';
import './TetrisGame.css';

const COLS = 10;
const ROWS = 20;

// Standard Tetromino definitions
const TETROMINOES = {
  I: { shape: [[0,0,0,0], [1,1,1,1], [0,0,0,0], [0,0,0,0]], color: '#00f3ff' },
  J: { shape: [[1,0,0], [1,1,1], [0,0,0]], color: '#0066ff' },
  L: { shape: [[0,0,1], [1,1,1], [0,0,0]], color: '#ff9100' },
  O: { shape: [[1,1], [1,1]], color: '#ffd600' },
  S: { shape: [[0,1,1], [1,1,0], [0,0,0]], color: '#00ff66' },
  T: { shape: [[0,1,0], [1,1,1], [0,0,0]], color: '#9d4edd' },
  Z: { shape: [[1,1,0], [0,1,1], [0,0,0]], color: '#ff0055' }
};

const SHAPES = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];

const createEmptyBoard = () => Array.from({ length: ROWS }, () => Array(COLS).fill(0));

const TetrisGame = ({ user, onLeave }) => {
  const [board, setBoard] = useState(createEmptyBoard);
  const [currentPiece, setCurrentPiece] = useState(null);
  const [nextPiece, setNextPiece] = useState(null);
  const [holdPiece, setHoldPiece] = useState(null);
  const [canHold, setCanHold] = useState(true);
  const [score, setScore] = useState(0);
  const [lines, setLines] = useState(0);
  const [level, setLevel] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [unlockedBanner, setUnlockedBanner] = useState(null);

  const stateRef = useRef({
    board: createEmptyBoard(),
    currentPiece: null,
    nextPiece: null,
    holdPiece: null,
    canHold: true,
    score: 0,
    lines: 0,
    level: 1,
    gameOver: false,
    isPaused: false
  });

  const getRandomPiece = () => {
    const type = SHAPES[Math.floor(Math.random() * SHAPES.length)];
    const proto = TETROMINOES[type];
    return {
      type,
      shape: proto.shape,
      color: proto.color,
      x: Math.floor(COLS / 2) - Math.ceil(proto.shape[0].length / 2),
      y: 0
    };
  };

  const checkCollision = (piece, grid, offsetX = 0, offsetY = 0) => {
    for (let r = 0; r < piece.shape.length; r++) {
      for (let c = 0; c < piece.shape[r].length; c++) {
        if (piece.shape[r][c] !== 0) {
          const newX = piece.x + c + offsetX;
          const newY = piece.y + r + offsetY;

          if (newX < 0 || newX >= COLS || newY >= ROWS) {
            return true;
          }
          if (newY >= 0 && grid[newY][newX] !== 0) {
            return true;
          }
        }
      }
    }
    return false;
  };

  const rotateMatrix = (matrix) => {
    const N = matrix.length;
    const result = matrix.map((row, i) =>
      row.map((val, j) => matrix[N - 1 - j][i])
    );
    return result;
  };

  const spawnPiece = () => {
    const s = stateRef.current;
    const next = s.nextPiece || getRandomPiece();
    const futureNext = getRandomPiece();

    s.nextPiece = futureNext;
    setNextPiece(futureNext);

    if (checkCollision(next, s.board)) {
      s.gameOver = true;
      setGameOver(true);
      SoundEffects.playLoss();
      api.submitScore('TETRIS', s.score, false, user);
      return;
    }

    s.currentPiece = next;
    s.canHold = true;
    setCurrentPiece({ ...next });
    setCanHold(true);
  };

  const startNewGame = () => {
    const s = stateRef.current;
    s.board = createEmptyBoard();
    s.score = 0;
    s.lines = 0;
    s.level = 1;
    s.gameOver = false;
    s.isPaused = false;
    s.holdPiece = null;
    s.canHold = true;

    setBoard(createEmptyBoard());
    setScore(0);
    setLines(0);
    setLevel(1);
    setGameOver(false);
    setIsPaused(false);
    setHoldPiece(null);
    setCanHold(true);

    const first = getRandomPiece();
    const second = getRandomPiece();
    s.currentPiece = first;
    s.nextPiece = second;
    setCurrentPiece(first);
    setNextPiece(second);
  };

  useEffect(() => {
    startNewGame();
  }, []);

  const lockPiece = () => {
    const s = stateRef.current;
    const p = s.currentPiece;
    if (!p) return;

    const newBoard = s.board.map(row => [...row]);

    for (let r = 0; r < p.shape.length; r++) {
      for (let c = 0; c < p.shape[r].length; c++) {
        if (p.shape[r][c] !== 0) {
          const bx = p.x + c;
          const by = p.y + r;
          if (by >= 0 && by < ROWS && bx >= 0 && bx < COLS) {
            newBoard[by][bx] = p.color;
          }
        }
      }
    }

    // Check full lines
    let cleared = 0;
    const filteredBoard = newBoard.filter(row => {
      const isFull = row.every(cell => cell !== 0);
      if (isFull) cleared++;
      return !isFull;
    });

    while (filteredBoard.length < ROWS) {
      filteredBoard.unshift(Array(COLS).fill(0));
    }

    if (cleared > 0) {
      const points = [0, 100, 300, 500, 800][cleared] * s.level;
      s.score += points;
      s.lines += cleared;
      s.level = Math.floor(s.lines / 10) + 1;

      setScore(s.score);
      setLines(s.lines);
      setLevel(s.level);

      SoundEffects.playCapture();
    } else {
      SoundEffects.playMove();
    }

    s.board = filteredBoard;
    setBoard(filteredBoard);
    spawnPiece();
  };

  // Move Actions
  const moveLeft = () => {
    const s = stateRef.current;
    if (s.gameOver || s.isPaused || !s.currentPiece) return;
    if (!checkCollision(s.currentPiece, s.board, -1, 0)) {
      s.currentPiece.x -= 1;
      setCurrentPiece({ ...s.currentPiece });
      SoundEffects.playClick();
    }
  };

  const moveRight = () => {
    const s = stateRef.current;
    if (s.gameOver || s.isPaused || !s.currentPiece) return;
    if (!checkCollision(s.currentPiece, s.board, 1, 0)) {
      s.currentPiece.x += 1;
      setCurrentPiece({ ...s.currentPiece });
      SoundEffects.playClick();
    }
  };

  const rotate = () => {
    const s = stateRef.current;
    if (s.gameOver || s.isPaused || !s.currentPiece) return;
    const rotatedShape = rotateMatrix(s.currentPiece.shape);
    const testPiece = { ...s.currentPiece, shape: rotatedShape };

    // Basic wall kick test
    let offset = 0;
    if (checkCollision(testPiece, s.board)) {
      if (!checkCollision(testPiece, s.board, 1, 0)) offset = 1;
      else if (!checkCollision(testPiece, s.board, -1, 0)) offset = -1;
      else return; // Cannot rotate
    }

    s.currentPiece.x += offset;
    s.currentPiece.shape = rotatedShape;
    setCurrentPiece({ ...s.currentPiece });
    SoundEffects.playClick();
  };

  const drop = () => {
    const s = stateRef.current;
    if (s.gameOver || s.isPaused || !s.currentPiece) return;

    if (!checkCollision(s.currentPiece, s.board, 0, 1)) {
      s.currentPiece.y += 1;
      setCurrentPiece({ ...s.currentPiece });
    } else {
      lockPiece();
    }
  };

  const hardDrop = () => {
    const s = stateRef.current;
    if (s.gameOver || s.isPaused || !s.currentPiece) return;

    let dropDistance = 0;
    while (!checkCollision(s.currentPiece, s.board, 0, dropDistance + 1)) {
      dropDistance++;
    }

    s.currentPiece.y += dropDistance;
    s.score += dropDistance * 2;
    setScore(s.score);
    setCurrentPiece({ ...s.currentPiece });
    lockPiece();
  };

  const hold = () => {
    const s = stateRef.current;
    if (s.gameOver || s.isPaused || !s.canHold || !s.currentPiece) return;

    const currentType = s.currentPiece.type;
    s.canHold = false;
    setCanHold(false);

    if (!s.holdPiece) {
      s.holdPiece = currentType;
      setHoldPiece(currentType);
      spawnPiece();
    } else {
      const prevHold = s.holdPiece;
      s.holdPiece = currentType;
      setHoldPiece(currentType);

      const proto = TETROMINOES[prevHold];
      const swappedPiece = {
        type: prevHold,
        shape: proto.shape,
        color: proto.color,
        x: Math.floor(COLS / 2) - Math.ceil(proto.shape[0].length / 2),
        y: 0
      };
      s.currentPiece = swappedPiece;
      setCurrentPiece(swappedPiece);
    }
    SoundEffects.playMove();
  };

  // Game Tick loop
  useEffect(() => {
    const speed = Math.max(120, 800 - (level - 1) * 65);
    const interval = setInterval(() => {
      drop();
    }, speed);
    return () => clearInterval(interval);
  }, [level, currentPiece, gameOver, isPaused]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameOver) return;
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        e.preventDefault();
        moveLeft();
      } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        e.preventDefault();
        moveRight();
      } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
        e.preventDefault();
        drop();
      } else if (e.code === 'ArrowUp' || e.code === 'KeyW') {
        e.preventDefault();
        rotate();
      } else if (e.code === 'Space') {
        e.preventDefault();
        hardDrop();
      } else if (e.code === 'KeyC') {
        e.preventDefault();
        hold();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPiece, gameOver, isPaused, canHold]);

  // Calculate Ghost Piece position
  let ghostY = currentPiece ? currentPiece.y : 0;
  if (currentPiece) {
    while (!checkCollision(currentPiece, board, 0, ghostY - currentPiece.y + 1)) {
      ghostY++;
    }
  }

  return (
    <div className="tetris-master-container glass-panel">
      <div className="tetris-top-bar">
        <button className="btn-secondary" onClick={onLeave}>&larr; HUB</button>
        <h2 className="tetris-title neon-text">CYBER TETRIS</h2>
        <button className="btn-tertiary" onClick={startNewGame}>↺ RESTART</button>
      </div>

      <div className="tetris-stage-layout">
        {/* Left: Hold Piece & Stats */}
        <div className="tetris-side-col">
          <div className="tetris-info-box">
            <span className="box-title">HOLD (C)</span>
            <div className="mini-piece-preview">
              {holdPiece && TETROMINOES[holdPiece].shape.map((row, r) => (
                <div key={r} className="mini-row">
                  {row.map((val, c) => (
                    <div
                      key={c}
                      className="mini-cell"
                      style={{ background: val ? TETROMINOES[holdPiece].color : 'transparent' }}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className="tetris-stats-card">
            <div className="stat-item"><span>SCORE</span><strong>{score}</strong></div>
            <div className="stat-item"><span>LINES</span><strong>{lines}</strong></div>
            <div className="stat-item"><span>LEVEL</span><strong>{level}</strong></div>
          </div>
        </div>

        {/* Center: 10x20 Matrix */}
        <div className="tetris-matrix-wrap">
          <div className="tetris-matrix">
            {board.map((row, r) =>
              row.map((cellColor, c) => {
                let isCurrent = false;
                let isGhost = false;
                let renderColor = cellColor;

                if (currentPiece) {
                  const pr = r - currentPiece.y;
                  const pc = c - currentPiece.x;
                  if (pr >= 0 && pr < currentPiece.shape.length && pc >= 0 && pc < currentPiece.shape[0].length) {
                    if (currentPiece.shape[pr][pc] !== 0) {
                      isCurrent = true;
                      renderColor = currentPiece.color;
                    }
                  }

                  const gr = r - ghostY;
                  if (!isCurrent && gr >= 0 && gr < currentPiece.shape.length && pc >= 0 && pc < currentPiece.shape[0].length) {
                    if (currentPiece.shape[gr][pc] !== 0) {
                      isGhost = true;
                    }
                  }
                }

                return (
                  <div
                    key={`${r}-${c}`}
                    className={`tetris-cell ${cellColor !== 0 ? 'filled' : ''} ${isCurrent ? 'current' : ''} ${isGhost ? 'ghost' : ''}`}
                    style={{
                      background: isGhost ? 'rgba(0, 243, 255, 0.15)' : renderColor !== 0 ? renderColor : 'transparent',
                      borderColor: isGhost ? 'rgba(0, 243, 255, 0.4)' : renderColor !== 0 ? renderColor : 'rgba(255, 255, 255, 0.05)'
                    }}
                  />
                );
              })
            )}
          </div>

          {gameOver && (
            <div className="tetris-gameover-overlay">
              <h2>MATRIX OVERFLOW</h2>
              <p>FINAL SCORE: <strong>{score}</strong></p>
              <p>LINES CLEARED: <strong>{lines}</strong></p>
              <button className="btn-primary" onClick={startNewGame}>TRY AGAIN</button>
            </div>
          )}
        </div>

        {/* Right: Next Piece Preview */}
        <div className="tetris-side-col">
          <div className="tetris-info-box">
            <span className="box-title">NEXT</span>
            <div className="mini-piece-preview">
              {nextPiece && nextPiece.shape.map((row, r) => (
                <div key={r} className="mini-row">
                  {row.map((val, c) => (
                    <div
                      key={c}
                      className="mini-cell"
                      style={{ background: val ? nextPiece.color : 'transparent' }}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Touch Controls */}
      <div className="tetris-mobile-controls">
        <div className="control-row">
          <button className="btn-secondary ctrl-btn" onClick={hold}>HOLD</button>
          <button className="btn-primary ctrl-btn rotate-btn" onClick={rotate}>↻ ROTATE</button>
          <button className="btn-secondary ctrl-btn" onClick={hardDrop}>⚡ SLAM</button>
        </div>
        <div className="control-row d-pad">
          <button className="btn-secondary dir-btn" onClick={moveLeft}>◀</button>
          <button className="btn-secondary dir-btn" onClick={drop}>▼</button>
          <button className="btn-secondary dir-btn" onClick={moveRight}>▶</button>
        </div>
      </div>
    </div>
  );
};

export default TetrisGame;
