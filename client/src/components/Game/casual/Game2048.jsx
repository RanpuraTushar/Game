import React, { useState, useEffect, useRef } from 'react';
import SoundEffects from '../../../utils/SoundEffects';
import { api } from '../../../services/api';
import './Game2048.css';

const Game2048 = ({ user, onLeave }) => {
  const [grid, setGrid] = useState(Array(16).fill(0));
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [history, setHistory] = useState(null);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [unlockedBanner, setUnlockedBanner] = useState(null);

  // Initialize new game
  useEffect(() => {
    startNewGame();
  }, []);

  const startNewGame = () => {
    let newGrid = Array(16).fill(0);
    newGrid = addRandomTile(newGrid);
    newGrid = addRandomTile(newGrid);
    setGrid(newGrid);
    setScore(0);
    setGameOver(false);
    setWon(false);
    setHistory(null);
  };

  const addRandomTile = (currentGrid) => {
    const emptyIndices = currentGrid.map((val, idx) => val === 0 ? idx : null).filter(val => val !== null);
    if (emptyIndices.length === 0) return currentGrid;
    const randomIdx = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
    const nextGrid = [...currentGrid];
    nextGrid[randomIdx] = Math.random() < 0.9 ? 2 : 4;
    return nextGrid;
  };

  // Keyboard Event Listeners
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameOver) return;
      if (['ArrowUp', 'KeyW'].includes(e.code)) { e.preventDefault(); move('UP'); }
      else if (['ArrowDown', 'KeyS'].includes(e.code)) { e.preventDefault(); move('DOWN'); }
      else if (['ArrowLeft', 'KeyA'].includes(e.code)) { e.preventDefault(); move('LEFT'); }
      else if (['ArrowRight', 'KeyD'].includes(e.code)) { e.preventDefault(); move('RIGHT'); }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [grid, gameOver, score]);

  const move = async (direction) => {
    let newGrid = [...grid];
    let gainedScore = 0;
    let hasMoved = false;

    // Save previous state for Undo
    const prevHistory = { grid: [...grid], score };

    const getRow = (r) => [newGrid[r * 4], newGrid[r * 4 + 1], newGrid[r * 4 + 2], newGrid[r * 4 + 3]];
    const setRow = (r, row) => { for (let c = 0; c < 4; c++) newGrid[r * 4 + c] = row[c]; };
    const getCol = (c) => [newGrid[c], newGrid[4 + c], newGrid[8 + c], newGrid[12 + c]];
    const setCol = (c, col) => { for (let r = 0; r < 4; r++) newGrid[r * 4 + c] = col[r]; };

    const slideAndCombine = (line) => {
      let filtered = line.filter(x => x !== 0);
      for (let i = 0; i < filtered.length - 1; i++) {
        if (filtered[i] === filtered[i + 1]) {
          filtered[i] *= 2;
          gainedScore += filtered[i];
          filtered.splice(i + 1, 1);
        }
      }
      while (filtered.length < 4) filtered.push(0);
      return filtered;
    };

    if (direction === 'LEFT') {
      for (let r = 0; r < 4; r++) {
        const oldRow = getRow(r);
        const newRow = slideAndCombine(oldRow);
        if (oldRow.join(',') !== newRow.join(',')) hasMoved = true;
        setRow(r, newRow);
      }
    } else if (direction === 'RIGHT') {
      for (let r = 0; r < 4; r++) {
        const oldRow = getRow(r);
        const newRow = slideAndCombine(oldRow.reverse()).reverse();
        if (oldRow.reverse().join(',') !== newRow.join(',')) hasMoved = true;
        setRow(r, newRow);
      }
    } else if (direction === 'UP') {
      for (let c = 0; c < 4; c++) {
        const oldCol = getCol(c);
        const newCol = slideAndCombine(oldCol);
        if (oldCol.join(',') !== newCol.join(',')) hasMoved = true;
        setCol(c, newCol);
      }
    } else if (direction === 'DOWN') {
      for (let c = 0; c < 4; c++) {
        const oldCol = getCol(c);
        const newCol = slideAndCombine(oldCol.reverse()).reverse();
        if (oldCol.reverse().join(',') !== newCol.join(',')) hasMoved = true;
        setCol(c, newCol);
      }
    }

    if (hasMoved) {
      SoundEffects.playTokenMove();
      const updatedGrid = addRandomTile(newGrid);
      const updatedScore = score + gainedScore;

      setHistory(prevHistory);
      setGrid(updatedGrid);
      setScore(updatedScore);
      if (updatedScore > bestScore) setBestScore(updatedScore);

      // Check 2048 achievement
      if (updatedGrid.includes(2048) && !won) {
        setWon(true);
        SoundEffects.playWin();
        const res = await api.submitScore('GAME_2048', updatedScore, true, user);
        if (res?.unlockedAchievements?.length > 0) setUnlockedBanner(res.unlockedAchievements[0]);
      }

      // Check Game Over
      if (isGameOver(updatedGrid)) {
        setGameOver(true);
        SoundEffects.playLoss();
        api.submitScore('GAME_2048', updatedScore, false, user);
      }
    }
  };

  const isGameOver = (g) => {
    if (g.includes(0)) return false;
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        const val = g[r * 4 + c];
        if (c < 3 && val === g[r * 4 + c + 1]) return false;
        if (r < 3 && val === g[(r + 1) * 4 + c]) return false;
      }
    }
    return true;
  };

  const handleUndo = () => {
    if (history) {
      setGrid(history.grid);
      setScore(history.score);
      setHistory(null);
      SoundEffects.playClick();
    }
  };

  const getTileColor = (val) => {
    const colors = {
      2: '#00f3ff',
      4: '#00e5ff',
      8: '#00c853',
      16: '#76ff03',
      32: '#ffd600',
      64: '#ff9100',
      128: '#ff3d00',
      256: '#e040fb',
      512: '#d500f9',
      1024: '#ff007f',
      2048: '#ff00ff'
    };
    return colors[val] || '#ff00ff';
  };

  return (
    <div className="game-2048-container glass-panel">
      {/* Header */}
      <div className="game-2048-header">
        <button className="btn-secondary" onClick={onLeave}>&larr; LEAVE</button>
        <div className="scores-row">
          <div className="score-badge-2048">
            <span className="score-lbl">SCORE</span>
            <span className="score-val">{score}</span>
          </div>
          <div className="score-badge-2048 best">
            <span className="score-lbl">BEST</span>
            <span className="score-val">{bestScore}</span>
          </div>
        </div>
      </div>

      {unlockedBanner && (
        <div className="achievement-toast">
          <span>🏆 UNLOCKED: <strong>{unlockedBanner.title}</strong> (+{unlockedBanner.points} pts)</span>
        </div>
      )}

      {/* Action Bar */}
      <div className="controls-action-bar">
        <button className="btn-tertiary undo-btn" onClick={handleUndo} disabled={!history}>
          ↩ UNDO
        </button>
        <button className="btn-primary reset-btn" onClick={startNewGame}>
          NEW GAME
        </button>
      </div>

      {/* 4x4 Grid Matrix */}
      <div className="grid-2048">
        {grid.map((val, idx) => (
          <div
            key={idx}
            className={`cell-2048 ${val > 0 ? 'tile-active' : ''}`}
            style={{
              '--tile-color': getTileColor(val),
              color: val > 4 ? '#fff' : '#000'
            }}
          >
            {val > 0 ? val : ''}
          </div>
        ))}
      </div>

      <p className="hint-2048">💡 Use <strong>Arrow Keys</strong> or <strong>W, A, S, D</strong> to slide and merge tiles.</p>

      {/* Game Over / Victory Overlay */}
      {gameOver && (
        <div className="finish-overlay">
          <h2 className="neon-text" style={{ color: '#ff0055' }}>GAME OVER</h2>
          <p style={{ color: '#fff', fontSize: '1.2rem', marginBottom: '15px' }}>Final Score: {score}</p>
          <button className="btn-primary" onClick={startNewGame}>TRY AGAIN</button>
        </div>
      )}
    </div>
  );
};

export default Game2048;
