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

const MATCH3_LEVELS = [
  { level: 1, name: 'NOVICE', target: 1200, moves: 22, candyCount: 4, mult: 1.0, color: '#00ff66', bonusMoves: 12 },
  { level: 2, name: 'APPRENTICE', target: 2800, moves: 20, candyCount: 5, mult: 1.25, color: '#00f3ff', bonusMoves: 12 },
  { level: 3, name: 'EXPERT', target: 4800, moves: 18, candyCount: 6, mult: 1.5, color: '#ffd600', bonusMoves: 10 },
  { level: 4, name: 'MASTER', target: 7200, moves: 16, candyCount: 6, mult: 2.0, color: '#ff9100', bonusMoves: 8 },
  { level: 5, name: 'CANDY GOD', target: 10500, moves: 15, candyCount: 6, mult: 2.5, color: '#ff0055', bonusMoves: 0 }
];

const Match3Game = ({ user, onLeave }) => {
  const [board, setBoard] = useState([]);
  const [selectedTile, setSelectedTile] = useState(null);
  const [score, setScore] = useState(0);
  const scoreRef = useRef(0);
  const [currentLevel, setCurrentLevel] = useState(1);
  const currentLevelRef = useRef(1);
  const [movesLeft, setMovesLeft] = useState(MATCH3_LEVELS[0].moves);
  const [combo, setCombo] = useState(1);
  const [gameWon, setGameWon] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [unlockedBanner, setUnlockedBanner] = useState(null);
  const [levelUpBanner, setLevelUpBanner] = useState(null);

  const getRandomCandy = (lvl = currentLevelRef.current) => {
    const maxCandies = MATCH3_LEVELS[lvl - 1]?.candyCount || 6;
    const pool = CANDY_TYPES.slice(0, maxCandies);
    return pool[Math.floor(Math.random() * pool.length)].id;
  };

  // Generate initial stable board without pre-existing 3-in-a-row matches
  const generateBoard = (resetToLevel = 1) => {
    currentLevelRef.current = resetToLevel;
    setCurrentLevel(resetToLevel);
    setLevelUpBanner(null);

    const grid = [];
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        let candy;
        do {
          candy = getRandomCandy(resetToLevel);
        } while (
          (c >= 2 && grid[r * GRID_SIZE + c - 1]?.type === candy && grid[r * GRID_SIZE + c - 2]?.type === candy) ||
          (r >= 2 && grid[(r - 1) * GRID_SIZE + c]?.type === candy && grid[(r - 2) * GRID_SIZE + c]?.type === candy)
        );
        grid.push({ type: candy, special: null, key: `${r}-${c}-${Math.random()}` });
      }
    }
    setBoard(grid);
    if (resetToLevel === 1) {
      setScore(0);
      scoreRef.current = 0;
      setMovesLeft(MATCH3_LEVELS[0].moves);
    }
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
    const currentMultiplier = MATCH3_LEVELS[currentLevelRef.current - 1]?.mult || 1.0;
    const earnedPoints = Math.round(uniqueMatches.length * 30 * currentCombo * currentMultiplier);
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
      grid[idx] = { type: getRandomCandy(currentLevelRef.current), special, key: `special-${Date.now()}-${idx}` };
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
          type: getRandomCandy(currentLevelRef.current),
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
    const config = MATCH3_LEVELS[currentLevelRef.current - 1];
    if (currentScore >= config.target) {
      if (currentLevelRef.current < MATCH3_LEVELS.length) {
        const nextLvl = currentLevelRef.current + 1;
        currentLevelRef.current = nextLvl;
        setCurrentLevel(nextLvl);
        const nextConfig = MATCH3_LEVELS[nextLvl - 1];
        setMovesLeft(m => m + config.bonusMoves);
        SoundEffects.playTrophy();
        setLevelUpBanner({
          level: nextLvl,
          name: nextConfig.name,
          bonusMoves: config.bonusMoves,
          mult: nextConfig.mult
        });
        setTimeout(() => setLevelUpBanner(null), 3200);
      } else {
        setGameWon(true);
        SoundEffects.playWin();
        api.submitScore('MATCH_3', currentScore, true, user);
      }
    } else if (moves <= 0) {
      setGameOver(true);
      SoundEffects.playLoss();
      api.submitScore('MATCH_3', currentScore, false, user);
    }
  };

  const curConfig = MATCH3_LEVELS[currentLevel - 1] || MATCH3_LEVELS[0];

  return (
    <div className="match3-master-container glass-panel">
      <div className="match3-top-bar">
        <button className="btn-secondary" onClick={onLeave}>&larr; HUB</button>
        <div className="match3-stats-banner">
          <span>SCORE: <strong>{score}</strong></span> &bull;
          <span>TARGET: <strong>{curConfig.target}</strong></span> &bull;
          <span>MOVES: <strong className={movesLeft <= 5 ? 'low-moves' : ''}>{movesLeft}</strong></span> &bull;
          <span className="match3-tier-pill" style={{ color: curConfig.color, borderColor: curConfig.color }}>
            LVL {currentLevel} &bull; {curConfig.name} ({curConfig.mult}x)
          </span>
        </div>
        <button className="btn-tertiary" onClick={() => generateBoard(1)}>↺ RESET</button>
      </div>

      {levelUpBanner && (
        <div className="match3-levelup-toast">
          🍬 LEVEL {levelUpBanner.level}: {levelUpBanner.name}! +{levelUpBanner.bonusMoves} BONUS MOVES &amp; CANDIES (+{levelUpBanner.mult}x SCORE)
        </div>
      )}

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
            <h2>⭐ CANDY GOD CONQUERED! ⭐</h2>
            <p>Score: <strong>{score}</strong> &bull; All 5 Tiers Cleared!</p>
            <button className="btn-primary" onClick={() => generateBoard(1)}>PLAY AGAIN</button>
          </div>
        )}

        {gameOver && (
          <div className="match3-finish-modal loss">
            <h2>OUT OF MOVES!</h2>
            <p>Score: <strong>{score}</strong> &bull; Reached Level {currentLevel} ({curConfig.name})</p>
            <button className="btn-primary" onClick={() => generateBoard(1)}>TRY AGAIN</button>
          </div>
        )}
      </div>

      <p className="match3-hint">
        Click a candy, then click an adjacent candy to swap. Reach the Target Score before moves run out to Level Up!
      </p>
    </div>
  );
};

export default Match3Game;
