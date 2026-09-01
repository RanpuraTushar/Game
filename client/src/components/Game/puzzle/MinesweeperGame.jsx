import React, { useState, useEffect, useRef } from 'react';
import SoundEffects from '../../../utils/SoundEffects';
import { api } from '../../../services/api';
import './MinesweeperGame.css';

const ROWS = 9;
const COLS = 9;
const MINES_COUNT = 10;

const MinesweeperGame = ({ user, onLeave }) => {
  const [gameMode, setGameMode] = useState('SOLO'); // 'SOLO' or 'TWO_PLAYER'
  const [turn, setTurn] = useState('P1'); // 'P1' (Cyan) or 'P2' (Pink)
  const [p1Points, setP1Points] = useState(0);
  const [p2Points, setP2Points] = useState(0);

  const [grid, setGrid] = useState([]);
  const [mineLocations, setMineLocations] = useState(new Set());
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [flagsLeft, setFlagsLeft] = useState(MINES_COUNT);
  const [flagMode, setFlagMode] = useState(false);
  const [timer, setTimer] = useState(0);
  const [statusFace, setStatusFace] = useState('🙂');
  const [unlockedBanner, setUnlockedBanner] = useState(null);

  const timerRef = useRef(null);

  useEffect(() => {
    startNewGame();
    return () => clearInterval(timerRef.current);
  }, [gameMode]);

  const startNewGame = () => {
    clearInterval(timerRef.current);
    setTimer(0);

    // Place mines randomly
    const mines = new Set();
    while (mines.size < MINES_COUNT) {
      const r = Math.floor(Math.random() * ROWS);
      const c = Math.floor(Math.random() * COLS);
      mines.add(`${r}-${c}`);
    }

    // Generate cell grid
    const newGrid = [];
    for (let r = 0; r < ROWS; r++) {
      const row = [];
      for (let c = 0; c < COLS; c++) {
        const isMine = mines.has(`${r}-${c}`);
        row.push({
          r,
          c,
          isMine,
          revealed: false,
          flagged: false,
          neighborMines: 0
        });
      }
      newGrid.push(row);
    }

    // Calculate neighbor mines
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (!newGrid[r][c].isMine) {
          let count = 0;
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              const nr = r + dr;
              const nc = c + dc;
              if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && newGrid[nr][nc].isMine) {
                count++;
              }
            }
          }
          newGrid[r][c].neighborMines = count;
        }
      }
    }

    setGrid(newGrid);
    setMineLocations(mines);
    setGameOver(false);
    setGameWon(false);
    setFlagsLeft(MINES_COUNT);
    setStatusFace('🙂');
    setTurn('P1');
    setP1Points(0);
    setP2Points(0);

    timerRef.current = setInterval(() => {
      setTimer(t => t + 1);
    }, 1000);
  };

  const handleCellClick = (r, c) => {
    if (gameOver || gameWon) return;

    if (flagMode) {
      toggleFlag(r, c);
      return;
    }

    const cell = grid[r][c];
    if (cell.revealed || cell.flagged) return;

    if (cell.isMine) {
      // Detonated!
      revealAllMines(grid);
      setGameOver(true);
      setStatusFace('😵');
      clearInterval(timerRef.current);
      SoundEffects.playLoss();
      api.submitScore('MINESWEEPER', 10, false, user);
      return;
    }

    SoundEffects.playClick();
    const newGrid = grid.map(row => row.map(cObj => ({ ...cObj })));
    const cellsRevealed = floodReveal(newGrid, r, c);
    setGrid(newGrid);

    if (turn === 'P1') setP1Points(p => p + cellsRevealed * 10);
    else setP2Points(p => p + cellsRevealed * 10);

    // Switch turn in 2-Player mode
    if (gameMode === 'TWO_PLAYER') {
      setTurn(t => t === 'P1' ? 'P2' : 'P1');
    }

    // Check Victory
    checkVictory(newGrid);
  };

  const floodReveal = (g, r, c) => {
    if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return 0;
    const cell = g[r][c];
    if (cell.revealed || cell.flagged || cell.isMine) return 0;

    cell.revealed = true;
    let count = 1;

    if (cell.neighborMines === 0) {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          count += floodReveal(g, r + dr, c + dc);
        }
      }
    }
    return count;
  };

  const toggleFlag = (r, c) => {
    if (gameOver || gameWon) return;
    const cell = grid[r][c];
    if (cell.revealed) return;

    SoundEffects.playSafe();
    const newGrid = grid.map(row => row.map(cObj => ({ ...cObj })));
    const target = newGrid[r][c];

    if (!target.flagged && flagsLeft > 0) {
      target.flagged = true;
      setFlagsLeft(flagsLeft - 1);
    } else if (target.flagged) {
      target.flagged = false;
      setFlagsLeft(flagsLeft + 1);
    }
    setGrid(newGrid);
  };

  const revealAllMines = (g) => {
    const revealed = g.map(row => row.map(c => {
      if (c.isMine) return { ...c, revealed: true };
      return c;
    }));
    setGrid(revealed);
  };

  const checkVictory = async (g) => {
    let unrevealedSafe = 0;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (!g[r][c].isMine && !g[r][c].revealed) {
          unrevealedSafe++;
        }
      }
    }

    if (unrevealedSafe === 0) {
      setGameWon(true);
      setStatusFace('😎');
      clearInterval(timerRef.current);
      SoundEffects.playWin();
      const scoreGained = Math.max(50, 350 - timer * 2);
      const res = await api.submitScore('MINESWEEPER', scoreGained, true, user);
      if (res?.unlockedAchievements?.length > 0) setUnlockedBanner(res.unlockedAchievements[0]);
    }
  };

  const getNumberColor = (num) => {
    const colors = {
      1: '#00f3ff',
      2: '#00e676',
      3: '#ff3b30',
      4: '#e040fb',
      5: '#ffea00',
      6: '#00e5ff',
      7: '#ff9100',
      8: '#ffffff'
    };
    return colors[num] || '#fff';
  };

  return (
    <div className="minesweeper-container glass-panel">
      {/* Top Header */}
      <div className="minesweeper-header">
        <button className="btn-secondary" onClick={onLeave}>&larr; HUB</button>
        
        {/* Mode Selector */}
        <div className="game-mode-toggle-group">
          <button 
            className={`mode-pill-btn ${gameMode === 'SOLO' ? 'active' : ''}`}
            onClick={() => setGameMode('SOLO')}
          >
            👤 SOLO
          </button>
          <button 
            className={`mode-pill-btn ${gameMode === 'TWO_PLAYER' ? 'active' : ''}`}
            onClick={() => setGameMode('TWO_PLAYER')}
          >
            👥 2-PLAYER DUEL
          </button>
        </div>

        <button 
          className={`btn-tertiary flag-toggle-btn ${flagMode ? 'active' : ''}`}
          onClick={() => setFlagMode(!flagMode)}
        >
          🚩 {flagMode ? 'FLAGGING' : 'DIGGING'}
        </button>
      </div>

      {/* Control Box & Score */}
      <div className="minesweeper-status-bar">
        {gameMode === 'SOLO' ? (
          <div className="mine-control-box">
            <div className="digital-counter">{String(flagsLeft).padStart(3, '0')}</div>
            <button className="face-btn" onClick={startNewGame}>{statusFace}</button>
            <div className="digital-counter">{String(timer).padStart(3, '0')}</div>
          </div>
        ) : (
          <div className="mines-duel-banner">
            <span style={{ color: '#00f3ff' }}>P1 PTS: <strong>{p1Points}</strong></span>
            <div className="mine-control-box mini">
              <button className="face-btn" onClick={startNewGame}>{statusFace}</button>
            </div>
            <span className="turn-indicator-pill" style={{ color: turn === 'P1' ? '#00f3ff' : '#ff007f' }}>
              {turn === 'P1' ? '🔵 P1 TURN' : '🔴 P2 TURN'}
            </span>
            <span style={{ color: '#ff007f' }}>P2 PTS: <strong>{p2Points}</strong></span>
          </div>
        )}
      </div>

      {unlockedBanner && (
        <div className="achievement-toast">
          <span>🏆 UNLOCKED: <strong>{unlockedBanner.title}</strong> (+{unlockedBanner.points} pts)</span>
        </div>
      )}

      {/* 9x9 Minefield Grid */}
      <div className="minefield-grid">
        {grid.map((row, r) => (
          <div key={r} className="minefield-row">
            {row.map((cell, c) => {
              return (
                <button
                  key={`${r}-${c}`}
                  className={`mine-cell ${cell.revealed ? 'revealed' : ''} ${cell.flagged ? 'flagged' : ''} ${cell.isMine && cell.revealed ? 'exploded' : ''}`}
                  onClick={() => handleCellClick(r, c)}
                  onContextMenu={(e) => { e.preventDefault(); toggleFlag(r, c); }}
                >
                  {cell.revealed ? (
                    cell.isMine ? '💣' : cell.neighborMines > 0 ? (
                      <span style={{ color: getNumberColor(cell.neighborMines), fontWeight: 'bold' }}>
                        {cell.neighborMines}
                      </span>
                    ) : ''
                  ) : cell.flagged ? '🚩' : ''}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <p className="mines-hint">💡 Left-Click reveals. Right-Click or toggle "Flagging" to plant flags.</p>

      {(gameOver || gameWon) && (
        <div className="finish-overlay">
          {gameMode === 'SOLO' ? (
            <>
              <h2 className="neon-text" style={{ color: gameWon ? '#00ff66' : '#ff3366' }}>
                {gameWon ? '🏆 SECTOR CLEARED!' : 'MINE DETONATED!'}
              </h2>
              <p style={{ color: '#fff', fontSize: '1.2rem', margin: '10px 0 20px 0' }}>
                {gameWon ? `Cleared in ${timer}s` : 'System Overload'}
              </p>
            </>
          ) : (
            <>
              <h2 className="neon-text" style={{ color: gameOver ? (turn === 'P1' ? '#ff007f' : '#00f3ff') : (p1Points > p2Points ? '#00f3ff' : '#ff007f') }}>
                {gameOver ? (turn === 'P1' ? '💥 P1 DETONATED MINE! P2 WINS!' : '💥 P2 DETONATED MINE! P1 WINS!') : (p1Points > p2Points ? '🏆 PLAYER 1 WINS!' : '🏆 PLAYER 2 WINS!')}
              </h2>
              <p style={{ color: '#fff', fontSize: '1.2rem', margin: '10px 0 20px 0' }}>
                P1: {p1Points} pts &bull; P2: {p2Points} pts
              </p>
            </>
          )}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn-primary" onClick={startNewGame}>PLAY AGAIN</button>
            <button className="btn-secondary" onClick={onLeave}>BACK TO HUB</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MinesweeperGame;
