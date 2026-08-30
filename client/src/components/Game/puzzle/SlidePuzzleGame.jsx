import React, { useState, useEffect } from 'react';
import SoundEffects from '../../../utils/SoundEffects';
import { api } from '../../../services/api';
import './SlidePuzzleGame.css';

const SlidePuzzleGame = ({ user, onLeave }) => {
  const [size, setSize] = useState(4); // 3 for 3x3 (8-puzzle), 4 for 4x4 (15-puzzle)
  const [tiles, setTiles] = useState([]);
  const [moves, setMoves] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  const [unlockedBanner, setUnlockedBanner] = useState(null);

  useEffect(() => {
    initPuzzle(size);
  }, [size]);

  const initPuzzle = (gridSize) => {
    const total = gridSize * gridSize;
    let arr = Array.from({ length: total - 1 }, (_, i) => i + 1);
    arr.push(0); // 0 is empty slot

    // Perform random valid sliding moves from solved state to guarantee solvability
    for (let i = 0; i < 150; i++) {
      const emptyIdx = arr.indexOf(0);
      const r = Math.floor(emptyIdx / gridSize);
      const c = emptyIdx % gridSize;
      const neighbors = [];

      if (r > 0) neighbors.push(emptyIdx - gridSize);
      if (r < gridSize - 1) neighbors.push(emptyIdx + gridSize);
      if (c > 0) neighbors.push(emptyIdx - 1);
      if (c < gridSize - 1) neighbors.push(emptyIdx + 1);

      const swapIdx = neighbors[Math.floor(Math.random() * neighbors.length)];
      [arr[emptyIdx], arr[swapIdx]] = [arr[swapIdx], arr[emptyIdx]];
    }

    setTiles(arr);
    setMoves(0);
    setGameWon(false);
  };

  const handleTileClick = async (idx) => {
    if (gameWon) return;
    const tileVal = tiles[idx];
    if (tileVal === 0) return;

    const emptyIdx = tiles.indexOf(0);
    const r1 = Math.floor(idx / size);
    const c1 = idx % size;
    const r2 = Math.floor(emptyIdx / size);
    const c2 = emptyIdx % size;

    const isAdjacent = (Math.abs(r1 - r2) === 1 && c1 === c2) || (Math.abs(c1 - c2) === 1 && r1 === r2);

    if (isAdjacent) {
      const newTiles = [...tiles];
      [newTiles[idx], newTiles[emptyIdx]] = [newTiles[emptyIdx], newTiles[idx]];
      setTiles(newTiles);
      setMoves(m => m + 1);
      SoundEffects.playTokenStep();

      // Check Solved
      const isSolved = newTiles.every((val, i) => {
        if (i === newTiles.length - 1) return val === 0;
        return val === i + 1;
      });

      if (isSolved) {
        setGameWon(true);
        SoundEffects.playWin();
        const scoreGained = Math.max(50, 400 - moves * 3);
        const res = await api.submitScore('SLIDE_PUZZLE', scoreGained, true, user);
        if (res?.unlockedAchievements?.length > 0) setUnlockedBanner(res.unlockedAchievements[0]);
      }
    }
  };

  return (
    <div className="slide-container glass-panel">
      <div className="slide-header">
        <button className="btn-secondary" onClick={onLeave}>&larr; LEAVE</button>
        <div className="slide-size-pills">
          <button 
            className={`size-pill ${size === 3 ? 'active' : ''}`}
            onClick={() => setSize(3)}
          >
            3x3
          </button>
          <button 
            className={`size-pill ${size === 4 ? 'active' : ''}`}
            onClick={() => setSize(4)}
          >
            4x4
          </button>
        </div>
        <div className="slide-moves">
          MOVES: <strong style={{ color: '#00f3ff' }}>{moves}</strong>
        </div>
      </div>

      {unlockedBanner && (
        <div className="achievement-toast">
          <span>🏆 UNLOCKED: <strong>{unlockedBanner.title}</strong> (+{unlockedBanner.points} pts)</span>
        </div>
      )}

      {/* Grid Matrix */}
      <div 
        className="slide-grid"
        style={{
          gridTemplateColumns: `repeat(${size}, 1fr)`,
          maxWidth: size === 3 ? '320px' : '380px'
        }}
      >
        {tiles.map((val, idx) => {
          const isEmpty = val === 0;
          return (
            <button
              key={idx}
              className={`slide-tile ${isEmpty ? 'empty' : ''}`}
              onClick={() => handleTileClick(idx)}
              disabled={isEmpty}
            >
              {!isEmpty ? val : ''}
            </button>
          );
        })}
      </div>

      <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
        <button className="btn-tertiary" onClick={() => initPuzzle(size)}>
          🔀 RESHUFFLE
        </button>
      </div>

      {gameWon && (
        <div className="finish-overlay">
          <h2 className="neon-text" style={{ color: '#00ff66' }}>🏆 PUZZLE SOLVED!</h2>
          <p style={{ color: '#fff', fontSize: '1.2rem', marginBottom: '15px' }}>
            Completed in {moves} moves
          </p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn-primary" onClick={() => initPuzzle(size)}>PLAY AGAIN</button>
            <button className="btn-secondary" onClick={onLeave}>BACK TO HUB</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SlidePuzzleGame;
