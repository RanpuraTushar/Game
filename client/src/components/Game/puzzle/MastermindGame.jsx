import React, { useState, useEffect } from 'react';
import SoundEffects from '../../../utils/SoundEffects';
import { api } from '../../../services/api';
import './MastermindGame.css';

const PEGS = [
  { id: 'RED', color: '#ff3b30' },
  { id: 'GREEN', color: '#00e676' },
  { id: 'BLUE', color: '#2979ff' },
  { id: 'YELLOW', color: '#ffd600' },
  { id: 'PURPLE', color: '#e040fb' },
  { id: 'CYAN', color: '#00f3ff' }
];

const MAX_GUESSES = 8;

const MastermindGame = ({ user, onLeave }) => {
  const [secretCode, setSecretCode] = useState([]);
  const [currentRow, setCurrentRow] = useState(0);
  const [currentGuess, setCurrentGuess] = useState([null, null, null, null]);
  const [history, setHistory] = useState([]); // array of { guess, black, white }
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [unlockedBanner, setUnlockedBanner] = useState(null);

  useEffect(() => {
    startNewGame();
  }, []);

  const startNewGame = () => {
    const code = [];
    for (let i = 0; i < 4; i++) {
      const randPeg = PEGS[Math.floor(Math.random() * PEGS.length)];
      code.push(randPeg.id);
    }
    setSecretCode(code);
    setCurrentRow(0);
    setCurrentGuess([null, null, null, null]);
    setHistory([]);
    setGameOver(false);
    setGameWon(false);
  };

  const handleSelectColor = (pegId) => {
    if (gameOver || gameWon) return;
    const firstEmptySlot = currentGuess.indexOf(null);
    if (firstEmptySlot !== -1) {
      const newGuess = [...currentGuess];
      newGuess[firstEmptySlot] = pegId;
      setCurrentGuess(newGuess);
      SoundEffects.playClick();
    }
  };

  const handleClearSlot = (slotIdx) => {
    if (gameOver || gameWon) return;
    const newGuess = [...currentGuess];
    newGuess[slotIdx] = null;
    setCurrentGuess(newGuess);
    SoundEffects.playClick();
  };

  const handleSubmitGuess = async () => {
    if (currentGuess.includes(null) || gameOver || gameWon) return;

    // Evaluate Black (exact) and White (color match) pegs
    let black = 0;
    let white = 0;
    const codeCopy = [...secretCode];
    const guessCopy = [...currentGuess];

    // First pass for Exact Matches (Black)
    for (let i = 0; i < 4; i++) {
      if (guessCopy[i] === codeCopy[i]) {
        black++;
        codeCopy[i] = null;
        guessCopy[i] = 'MATCHED';
      }
    }

    // Second pass for Color Matches (White)
    for (let i = 0; i < 4; i++) {
      if (guessCopy[i] !== 'MATCHED' && guessCopy[i] !== null) {
        const foundIdx = codeCopy.indexOf(guessCopy[i]);
        if (foundIdx !== -1) {
          white++;
          codeCopy[foundIdx] = null;
        }
      }
    }

    const newHistory = [...history, { guess: [...currentGuess], black, white }];
    setHistory(newHistory);
    setCurrentGuess([null, null, null, null]);
    setCurrentRow(r => r + 1);

    // Check Victory
    if (black === 4) {
      setGameWon(true);
      SoundEffects.playWin();
      const score = Math.max(50, 450 - newHistory.length * 40);
      const res = await api.submitScore('MASTERMIND', score, true, user);
      if (res?.unlockedAchievements?.length > 0) setUnlockedBanner(res.unlockedAchievements[0]);
    } else if (newHistory.length >= MAX_GUESSES) {
      // Defeat
      setGameOver(true);
      SoundEffects.playLoss();
      api.submitScore('MASTERMIND', 20, false, user);
    } else {
      SoundEffects.playSafe();
    }
  };

  return (
    <div className="mastermind-container glass-panel">
      <div className="mm-header">
        <button className="btn-secondary" onClick={onLeave}>&larr; LEAVE</button>
        <div className="mm-title">CODEBREAKER</div>
        <div className="mm-attempts">
          ATTEMPT: <strong style={{ color: '#00f3ff' }}>{history.length + 1}/{MAX_GUESSES}</strong>
        </div>
      </div>

      {unlockedBanner && (
        <div className="achievement-toast">
          <span>🏆 UNLOCKED: <strong>{unlockedBanner.title}</strong> (+{unlockedBanner.points} pts)</span>
        </div>
      )}

      {/* Code Board History */}
      <div className="mm-board">
        {Array.from({ length: MAX_GUESSES }).map((_, rIdx) => {
          const rowData = history[rIdx];
          const isCurrent = rIdx === history.length;

          return (
            <div key={rIdx} className={`mm-row ${isCurrent ? 'current' : ''}`}>
              {/* 4 Peg Slots */}
              <div className="mm-peg-slots">
                {Array.from({ length: 4 }).map((_, sIdx) => {
                  const pegId = rowData ? rowData.guess[sIdx] : isCurrent ? currentGuess[sIdx] : null;
                  const pegObj = PEGS.find(p => p.id === pegId);

                  return (
                    <button
                      key={sIdx}
                      className={`mm-peg ${pegObj ? 'filled' : ''}`}
                      style={{
                        backgroundColor: pegObj ? pegObj.color : '#1e293b',
                        boxShadow: pegObj ? `0 0 10px ${pegObj.color}` : 'none'
                      }}
                      onClick={() => isCurrent && handleClearSlot(sIdx)}
                    />
                  );
                })}
              </div>

              {/* Clue Pegs (Black / White) */}
              <div className="mm-clues">
                {rowData ? (
                  <>
                    {Array.from({ length: rowData.black }).map((_, i) => (
                      <span key={`b-${i}`} className="clue-dot black" title="Exact Match" />
                    ))}
                    {Array.from({ length: rowData.white }).map((_, i) => (
                      <span key={`w-${i}`} className="clue-dot white" title="Color Match" />
                    ))}
                  </>
                ) : (
                  <span className="clue-empty">· · · ·</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Color Selector Palette */}
      <div className="mm-controls-panel">
        <div className="mm-palette">
          {PEGS.map(p => (
            <button
              key={p.id}
              className="palette-color-btn"
              style={{ backgroundColor: p.color, boxShadow: `0 0 10px ${p.color}` }}
              onClick={() => handleSelectColor(p.id)}
            />
          ))}
        </div>

        <button
          className="btn-primary submit-guess-btn"
          onClick={handleSubmitGuess}
          disabled={currentGuess.includes(null) || gameOver || gameWon}
        >
          CONFIRM GUESS
        </button>
      </div>

      {(gameOver || gameWon) && (
        <div className="finish-overlay">
          <h2 className="neon-text" style={{ color: gameWon ? '#00ff66' : '#ff3366' }}>
            {gameWon ? '🏆 CODE CRACKED!' : 'SECURITY BREACH FAILED!'}
          </h2>
          <div style={{ margin: '15px 0' }}>
            <span style={{ color: '#aaa', fontSize: '0.9rem', display: 'block', marginBottom: '8px' }}>SECRET CODE WAS:</span>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
              {secretCode.map((pId, idx) => {
                const p = PEGS.find(item => item.id === pId);
                return (
                  <div
                    key={idx}
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      backgroundColor: p.color,
                      boxShadow: `0 0 10px ${p.color}`
                    }}
                  />
                );
              })}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn-primary" onClick={startNewGame}>PLAY AGAIN</button>
            <button className="btn-secondary" onClick={onLeave}>BACK TO HUB</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MastermindGame;
