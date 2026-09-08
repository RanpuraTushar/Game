import React, { useState, useEffect } from 'react';
import SoundEffects from '../../../utils/SoundEffects';
import { api } from '../../../services/api';
import './Connect4Game.css';

const ROWS = 6;
const COLS = 7;

const Connect4Game = ({ socket, room, user, onLeave }) => {
  const [grid, setGrid] = useState(Array(42).fill(null));
  const [currentTurn, setCurrentTurn] = useState('RED'); // RED or YELLOW
  const [winner, setWinner] = useState(null);
  const [winningCells, setWinningCells] = useState([]);
  const [isBotThinking, setIsBotThinking] = useState(false);
  const [unlockedBanner, setUnlockedBanner] = useState(null);

  const isMultiplayer = room && !room.isSinglePlayer;
  const isPlayerRed = true; // Local human is RED in single player

  useEffect(() => {
    if (!room || !socket) return;

    const handleRoomUpdated = (updatedRoom) => {
      if (updatedRoom.grid) setGrid(updatedRoom.grid);
      if (updatedRoom.winner) {
        setWinner(updatedRoom.winner);
        if (updatedRoom.winner === socket?.id) SoundEffects.playWin();
        else if (updatedRoom.winner !== 'DRAW') SoundEffects.playLoss();
      }
    };

    socket.on('roomUpdated', handleRoomUpdated);
    return () => { socket.off('roomUpdated', handleRoomUpdated); };
  }, [room, socket]);

  // Single Player Column Drop
  const handleColumnClick = async (col) => {
    if (winner || isBotThinking) return;

    if (isMultiplayer) {
      socket?.emit('makeConnect4Move', { roomId: room.id, col });
      SoundEffects.playTokenMove();
      return;
    }

    // Local Drop
    const newGrid = [...grid];
    let dropRow = -1;
    for (let r = ROWS - 1; r >= 0; r--) {
      const idx = r * COLS + col;
      if (newGrid[idx] === null) {
        newGrid[idx] = currentTurn;
        dropRow = r;
        break;
      }
    }

    if (dropRow === -1) return; // Column full

    SoundEffects.playTokenMove();
    setGrid(newGrid);

    // Check Win
    const winResult = checkWin(newGrid, currentTurn);
    if (winResult) {
      setWinner(currentTurn);
      setWinningCells(winResult.cells);
      SoundEffects.playWin();
      const res = await api.submitScore('CONNECT_4', 100, true, user);
      if (res?.unlockedAchievements?.length > 0) {
        setUnlockedBanner(res.unlockedAchievements[0]);
      }
      return;
    }

    if (newGrid.every(c => c !== null)) {
      setWinner('DRAW');
      return;
    }

    // AI Turn in Single Player
    setCurrentTurn('YELLOW');
    setIsBotThinking(true);

    setTimeout(() => {
      executeAiTurn(newGrid);
    }, 600);
  };

  const executeAiTurn = async (currentGrid) => {
    const validCols = [];
    for (let c = 0; c < COLS; c++) {
      if (currentGrid[c] === null) validCols.push(c);
    }
    if (validCols.length === 0) return;

    // Smart Column Choice (Pick 3 or random)
    let chosenCol = validCols.includes(3) ? 3 : validCols[Math.floor(Math.random() * validCols.length)];

    // Check if AI can win immediately or block
    for (const c of validCols) {
      const temp = [...currentGrid];
      for (let r = ROWS - 1; r >= 0; r--) {
        if (temp[r * COLS + c] === null) {
          temp[r * COLS + c] = 'YELLOW';
          if (checkWin(temp, 'YELLOW')) { chosenCol = c; break; }
          break;
        }
      }
    }

    const nextGrid = [...currentGrid];
    for (let r = ROWS - 1; r >= 0; r--) {
      const idx = r * COLS + chosenCol;
      if (nextGrid[idx] === null) {
        nextGrid[idx] = 'YELLOW';
        break;
      }
    }

    SoundEffects.playTokenMove();
    setGrid(nextGrid);
    setIsBotThinking(false);

    const winResult = checkWin(nextGrid, 'YELLOW');
    if (winResult) {
      setWinner('YELLOW');
      setWinningCells(winResult.cells);
      SoundEffects.playLoss();
    } else if (nextGrid.every(c => c !== null)) {
      setWinner('DRAW');
    } else {
      setCurrentTurn('RED');
    }
  };

  const checkWin = (g, disc) => {
    // Horizontal
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c <= COLS - 4; c++) {
        const idx = r * COLS + c;
        if (g[idx] === disc && g[idx + 1] === disc && g[idx + 2] === disc && g[idx + 3] === disc) {
          return { cells: [idx, idx + 1, idx + 2, idx + 3] };
        }
      }
    }
    // Vertical
    for (let r = 0; r <= ROWS - 4; r++) {
      for (let c = 0; c < COLS; c++) {
        const idx = r * COLS + c;
        if (g[idx] === disc && g[idx + COLS] === disc && g[idx + COLS * 2] === disc && g[idx + COLS * 3] === disc) {
          return { cells: [idx, idx + COLS, idx + COLS * 2, idx + COLS * 3] };
        }
      }
    }
    // Diagonal Up-Right
    for (let r = 3; r < ROWS; r++) {
      for (let c = 0; c <= COLS - 4; c++) {
        const idx = r * COLS + c;
        if (g[idx] === disc && g[idx - COLS + 1] === disc && g[idx - COLS * 2 + 2] === disc && g[idx - COLS * 3 + 3] === disc) {
          return { cells: [idx, idx - COLS + 1, idx - COLS * 2 + 2, idx - COLS * 3 + 3] };
        }
      }
    }
    // Diagonal Down-Right
    for (let r = 0; r <= ROWS - 4; r++) {
      for (let c = 0; c <= COLS - 4; c++) {
        const idx = r * COLS + c;
        if (g[idx] === disc && g[idx + COLS + 1] === disc && g[idx + COLS * 2 + 2] === disc && g[idx + COLS * 3 + 3] === disc) {
          return { cells: [idx, idx + COLS + 1, idx + COLS * 2 + 2, idx + COLS * 3 + 3] };
        }
      }
    }
    return null;
  };

  const handleReset = () => {
    setGrid(Array(42).fill(null));
    setCurrentTurn('RED');
    setWinner(null);
    setWinningCells([]);
    setIsBotThinking(false);
  };

  return (
    <div className="connect4-container glass-panel">
      <div className="connect4-header">
        <button className="btn-secondary" onClick={onLeave}>&larr; LEAVE</button>
        <div className="turn-indicator">
          <span>TURN: </span>
          <span className={`turn-badge ${currentTurn.toLowerCase()}`}>
            {currentTurn === 'RED' ? (user?.username || 'Red Player') : (isBotThinking ? 'AI Thinking...' : 'Yellow Player')}
          </span>
        </div>
        <button className="btn-tertiary" onClick={handleReset}>RESET</button>
      </div>

      {unlockedBanner && (
        <div className="achievement-toast">
          <span>🏆 UNLOCKED: <strong>{unlockedBanner.title}</strong> (+{unlockedBanner.points} pts)</span>
        </div>
      )}

      {/* 6x7 Matrix Board */}
      <div className="c4-board">
        {/* Column Drop Arrows */}
        <div className="c4-drop-row">
          {Array(7).fill(null).map((_, col) => (
            <button
              key={col}
              className="drop-arrow-btn"
              onClick={() => handleColumnClick(col)}
              disabled={winner !== null || isBotThinking}
            >
              ▼
            </button>
          ))}
        </div>

        {/* Board Slots Grid */}
        <div className="c4-grid">
          {grid.map((cell, idx) => {
            const isWinning = winningCells.includes(idx);
            return (
              <div
                key={idx}
                className="c4-slot"
                onClick={() => handleColumnClick(idx % COLS)}
              >
                <div className={`c4-disc ${cell ? cell.toLowerCase() : 'empty'} ${isWinning ? 'win-pulse' : ''}`} />
              </div>
            );
          })}
        </div>
      </div>

      {winner && (
        <div className="finish-overlay">
          <h2 className="neon-text" style={{ color: winner === 'RED' ? '#ff3b30' : winner === 'YELLOW' ? '#ffea00' : '#00f3ff' }}>
            {winner === 'DRAW' ? 'STALEMATE DRAW!' : winner === 'RED' ? '🏆 RED VICTORY!' : 'YELLOW WINS!'}
          </h2>
          <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
            <button className="btn-primary" onClick={handleReset}>PLAY AGAIN</button>
            <button className="btn-secondary" onClick={onLeave}>BACK TO HUB</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Connect4Game;
