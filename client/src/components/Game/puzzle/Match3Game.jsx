import React, { useState, useEffect, useRef } from 'react';
import SoundEffects from '../../../utils/SoundEffects';
import { api } from '../../../services/api';
import './Match3Game.css';

const GRID_SIZE = 8;
const CANDY_TYPES = [
  { id: 'RED', icon: '🍓', color: '#ff1744' },
  { id: 'BLUE', icon: '🫐', color: '#00b0ff' },
  { id: 'GREEN', icon: '🍏', color: '#00e676' },
  { id: 'YELLOW', icon: '🍋', color: '#ffd600' },
  { id: 'PURPLE', icon: '🍇', color: '#d500f9' },
  { id: 'CYAN', icon: '💎', color: '#00f3ff' }
];

const TARGET_SCORE = 2500;
const INITIAL_MOVES = 25;

const Match3Game = ({ user, onLeave }) => {
  const [board, setBoard] = useState([]);
  const [selectedTile, setSelectedTile] = useState(null);
  const [score, setScore] = useState(0);
  const scoreRef = useRef(0);
  const [movesLeft, setMovesLeft] = useState(INITIAL_MOVES);
  const [combo, setCombo] = useState(1);
  const [gameWon, setGameWon] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [unlockedBanner, setUnlockedBanner] = useState(null);

  const getRandomCandy = () => {
    return CANDY_TYPES[Math.floor(Math.random() * CANDY_TYPES.length)].id;
  };

  // Generate initial stable board without pre-existing 3-in-a-row matches
  const generateBoard = () => {
    const grid = [];
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        let candy;
        do {
          candy = getRandomCandy();
        } while (
          (c >= 2 && grid[r * GRID_SIZE + c - 1]?.type === candy && grid[r * GRID_SIZE + c - 2]?.type === candy) ||
          (r >= 2 && grid[(r - 1) * GRID_SIZE + c]?.type === candy && grid[(r - 2) * GRID_SIZE + c]?.type === candy)
        );
        grid.push({ type: candy, special: null, key: `${r}-${c}-${Math.random()}` });
      }
    }
    setBoard(grid);
    setScore(0);
    scoreRef.current = 0;
    setMovesLeft(INITIAL_MOVES);
    setCombo(1);
    setSelectedTile(null);
    setGameWon(false);
    setGameOver(false);
  };

  useEffect(() => {
    generateBoard();
  }, []);

  // Find all matches on the board
  const findMatches = (grid) => {
    const matchedIndices = new Set();
    const specialsToCreate = [];

    // Horizontal check
    for (let r = 0; r < GRID_SIZE; r++) {
      let matchCount = 1;
      for (let c = 0; c < GRID_SIZE; c++) {
        const currIdx = r * GRID_SIZE + c;
        const nextIdx = r * GRID_SIZE + (c + 1);

        if (c < GRID_SIZE - 1 && grid[currIdx]?.type && grid[currIdx].type === grid[nextIdx]?.type) {
          matchCount++;
        } else {
          if (matchCount >= 3) {
            for (let k = 0; k < matchCount; k++) {
              matchedIndices.add(r * GRID_SIZE + (c - k));
            }
            if (matchCount === 4) {
              specialsToCreate.push({ idx: r * GRID_SIZE + (c - 1), special: 'BOMB' });
            } else if (matchCount >= 5) {
              specialsToCreate.push({ idx: r * GRID_SIZE + (c - 2), special: 'RAINBOW' });
            }
          }
          matchCount = 1;
        }
      }
    }

    // Vertical check
    for (let c = 0; c < GRID_SIZE; c++) {
      let matchCount = 1;
      for (let r = 0; r < GRID_SIZE; r++) {
        const currIdx = r * GRID_SIZE + c;
        const nextIdx = (r + 1) * GRID_SIZE + c;

        if (r < GRID_SIZE - 1 && grid[currIdx]?.type && grid[currIdx].type === grid[nextIdx]?.type) {
          matchCount++;
        } else {
          if (matchCount >= 3) {
            for (let k = 0; k < matchCount; k++) {
              matchedIndices.add((r - k) * GRID_SIZE + c);
            }
            if (matchCount === 4) {
              specialsToCreate.push({ idx: (r - 1) * GRID_SIZE + c, special: 'BOMB' });
            } else if (matchCount >= 5) {
              specialsToCreate.push({ idx: (r - 2) * GRID_SIZE + c, special: 'RAINBOW' });
            }
          }
          matchCount = 1;
        }
      }
    }

    return { matchedIndices: Array.from(matchedIndices), specialsToCreate };
  };

  // Process Matches, Cascades & Gravity
  const processMatchesAndCascade = async (initialGrid, currentCombo = 1) => {
    setIsProcessing(true);
    let grid = [...initialGrid];
    const { matchedIndices, specialsToCreate } = findMatches(grid);

    if (matchedIndices.length === 0) {
      setIsProcessing(false);
      return grid;
    }

    // Explode specials if triggered
    matchedIndices.forEach(idx => {
      if (grid[idx]?.special === 'BOMB') {
        const r = Math.floor(idx / GRID_SIZE);
        const c = idx % GRID_SIZE;
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE) {
              matchedIndices.push(nr * GRID_SIZE + nc);
            }
          }
        }
      }
    });

    const uniqueMatches = Array.from(new Set(matchedIndices));
    const earnedPoints = uniqueMatches.length * 30 * currentCombo;
    scoreRef.current += earnedPoints;
    setScore(scoreRef.current);
    setCombo(currentCombo);
    SoundEffects.playCapture();

    // Clear matched candies
    uniqueMatches.forEach(idx => {
      grid[idx] = null;
    });

    // Place special candies
    specialsToCreate.forEach(({ idx, special }) => {
      grid[idx] = { type: getRandomCandy(), special, key: `special-${Date.now()}-${idx}` };
    });

    setBoard([...grid]);

    // Delay for visual explosion
    await new Promise(res => setTimeout(res, 220));

    // Gravity: Pull down candies
    for (let c = 0; c < GRID_SIZE; c++) {
      let emptyRow = GRID_SIZE - 1;
      for (let r = GRID_SIZE - 1; r >= 0; r--) {
        const idx = r * GRID_SIZE + c;
        if (grid[idx] !== null) {
          if (r !== emptyRow) {
            grid[emptyRow * GRID_SIZE + c] = grid[idx];
            grid[idx] = null;
          }
          emptyRow--;
        }
      }
      // Fill empty top cells with new candies
      for (let r = emptyRow; r >= 0; r--) {
        grid[r * GRID_SIZE + c] = {
          type: getRandomCandy(),
          special: null,
          key: `new-${Date.now()}-${r}-${c}`
        };
      }
    }

    setBoard([...grid]);
    await new Promise(res => setTimeout(res, 220));

    // Recursively check for cascade matches
    return processMatchesAndCascade(grid, currentCombo + 1);
  };

  const handleTileClick = async (index) => {
    if (isProcessing || gameOver || gameWon) return;

    if (selectedTile === null) {
      setSelectedTile(index);
      SoundEffects.playClick();
      return;
    }

    if (selectedTile === index) {
      setSelectedTile(null);
      return;
    }

    // Check if adjacent
    const r1 = Math.floor(selectedTile / GRID_SIZE);
    const c1 = selectedTile % GRID_SIZE;
    const r2 = Math.floor(index / GRID_SIZE);
    const c2 = index % GRID_SIZE;
    const isAdjacent = (Math.abs(r1 - r2) + Math.abs(c1 - c2)) === 1;

    if (!isAdjacent) {
      setSelectedTile(index);
      SoundEffects.playClick();
      return;
    }

    // Swap tiles
    setSelectedTile(null);
    setIsProcessing(true);

    const newGrid = [...board];
    const temp = newGrid[selectedTile];
    newGrid[selectedTile] = newGrid[index];
    newGrid[index] = temp;
    setBoard(newGrid);

    // Rainbow special combo check
    if (temp?.special === 'RAINBOW' || newGrid[selectedTile]?.special === 'RAINBOW') {
      const targetColor = temp?.special === 'RAINBOW' ? newGrid[selectedTile]?.type : temp?.type;
      const wipedGrid = newGrid.map(t => t?.type === targetColor ? null : t);
      SoundEffects.playWin();
      await processMatchesAndCascade(wipedGrid, 2);
      checkGameEnd(movesLeft - 1, scoreRef.current);
      setIsProcessing(false);
      return;
    }

    const { matchedIndices } = findMatches(newGrid);

    if (matchedIndices.length > 0) {
      const newMoves = movesLeft - 1;
      setMovesLeft(newMoves);
      SoundEffects.playMove();
      await processMatchesAndCascade(newGrid, 1);
      checkGameEnd(newMoves, scoreRef.current);
    } else {
      // Revert invalid swap
      await new Promise(res => setTimeout(res, 250));
      const reverted = [...board];
      setBoard(reverted);
      SoundEffects.playLoss();
      setIsProcessing(false);
    }
  };

  const checkGameEnd = (moves, currentScore) => {
    if (currentScore >= TARGET_SCORE) {
      setGameWon(true);
      SoundEffects.playWin();
      api.submitScore('MATCH_3', currentScore, true, user);
    } else if (moves <= 0) {
      setGameOver(true);
      SoundEffects.playLoss();
      api.submitScore('MATCH_3', currentScore, false, user);
    }
  };

  return (
    <div className="match3-master-container glass-panel">
      <div className="match3-top-bar">
        <button className="btn-secondary" onClick={onLeave}>&larr; HUB</button>
        <div className="match3-stats-banner">
          <span>SCORE: <strong>{score}</strong></span> &bull;
          <span>TARGET: <strong>{TARGET_SCORE}</strong></span> &bull;
          <span>MOVES: <strong className={movesLeft <= 5 ? 'low-moves' : ''}>{movesLeft}</strong></span>
        </div>
        <button className="btn-tertiary" onClick={generateBoard}>↺ RESET</button>
      </div>

      {/* 8x8 Grid */}
      <div className="match3-grid-wrap">
        <div className="match3-grid">
          {board.map((tile, idx) => {
            const candyMeta = CANDY_TYPES.find(c => c.id === tile?.type) || CANDY_TYPES[0];
            const isSelected = selectedTile === idx;

            return (
              <div
                key={tile?.key || idx}
                className={`match3-tile ${isSelected ? 'selected' : ''} ${tile?.special ? `special-${tile.special.toLowerCase()}` : ''}`}
                style={{ '--candy-color': candyMeta.color }}
                onClick={() => handleTileClick(idx)}
              >
                {tile && (
                  <span className="candy-icon">
                    {tile.special === 'RAINBOW' ? '🌈' : tile.special === 'BOMB' ? '💣' : candyMeta.icon}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {gameWon && (
          <div className="match3-finish-modal win">
            <h2>⭐ TARGET CRUSHED! ⭐</h2>
            <p>Score: <strong>{score}</strong> in {INITIAL_MOVES - movesLeft} moves!</p>
            <button className="btn-primary" onClick={generateBoard}>PLAY AGAIN</button>
          </div>
        )}

        {gameOver && (
          <div className="match3-finish-modal loss">
            <h2>OUT OF MOVES!</h2>
            <p>You scored {score} / {TARGET_SCORE}</p>
            <button className="btn-primary" onClick={generateBoard}>TRY AGAIN</button>
          </div>
        )}
      </div>

      <p className="match3-hint">
        Click a candy, then click an adjacent candy to swap. Match 3 or more in a line!
      </p>
    </div>
  );
};

export default Match3Game;
