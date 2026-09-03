import React, { useState, useEffect } from 'react';
import SoundEffects from '../../../utils/SoundEffects';
import { api } from '../../../services/api';
import './MemoryMatchGame.css';

const ICON_SET = ['🤖', '🛸', '🚀', '⚡', '💎', '🎮', '👾', '🪐', '🛡️', '⚔️', '🔮', '🛰️', '🔥', '👑', '🎯', '🧬', '🎧', '🔋'];

const MemoryMatchGame = ({ user, onLeave }) => {
  const [gridSize, setGridSize] = useState(16); // 16 (4x4) or 36 (6x6)
  const [cards, setCards] = useState([]);
  const [flippedIndices, setFlippedIndices] = useState([]);
  const [matchedPairs, setMatchedPairs] = useState(new Set());
  const [moves, setMoves] = useState(0);
  const [timer, setTimer] = useState(0);
  const [combo, setCombo] = useState(1);
  const [score, setScore] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [gameWon, setGameWon] = useState(false);

  const initGame = (size = gridSize) => {
    const pairCount = size / 2;
    const selectedIcons = ICON_SET.slice(0, pairCount);
    const deck = [...selectedIcons, ...selectedIcons]
      .sort(() => Math.random() - 0.5)
      .map((icon, id) => ({ id, icon }));

    setCards(deck);
    setFlippedIndices([]);
    setMatchedPairs(new Set());
    setMoves(0);
    setTimer(0);
    setCombo(1);
    setScore(0);
    setIsLocked(false);
    setGameWon(false);
  };

  useEffect(() => {
    initGame(16);
  }, []);

  // Timer Tick
  useEffect(() => {
    if (gameWon) return;
    const interval = setInterval(() => {
      setTimer(t => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [gameWon]);

  const handleCardClick = (index) => {
    if (isLocked || gameWon) return;
    if (flippedIndices.includes(index) || matchedPairs.has(cards[index].icon)) return;

    SoundEffects.playClick();
    const newFlipped = [...flippedIndices, index];
    setFlippedIndices(newFlipped);

    if (newFlipped.length === 2) {
      setIsLocked(true);
      setMoves(m => m + 1);

      const [firstIdx, secondIdx] = newFlipped;
      const card1 = cards[firstIdx];
      const card2 = cards[secondIdx];

      if (card1.icon === card2.icon) {
        // Matched!
        setTimeout(() => {
          SoundEffects.playCapture();
          const nextMatched = new Set(matchedPairs);
          nextMatched.add(card1.icon);
          setMatchedPairs(nextMatched);
          setFlippedIndices([]);
          setIsLocked(false);

          const addedScore = 100 * combo;
          setScore(s => s + addedScore);
          setCombo(c => c + 1);

          // Win check
          if (nextMatched.size === cards.length / 2) {
            setGameWon(true);
            SoundEffects.playWin();
            api.submitScore('MEMORY_MATCH', score + 500, true, user);
          }
        }, 500);
      } else {
        // No match
        setTimeout(() => {
          SoundEffects.playLoss();
          setFlippedIndices([]);
          setIsLocked(false);
          setCombo(1);
        }, 850);
      }
    }
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="memory-master-container glass-panel">
      <div className="memory-top-bar">
        <button className="btn-secondary" onClick={onLeave}>&larr; HUB</button>
        <div className="memory-grid-toggle">
          <button
            className={`mode-pill-btn ${gridSize === 16 ? 'active' : ''}`}
            onClick={() => { setGridSize(16); initGame(16); }}
          >
            4x4 (EASY)
          </button>
          <button
            className={`mode-pill-btn ${gridSize === 36 ? 'active' : ''}`}
            onClick={() => { setGridSize(36); initGame(36); }}
          >
            6x6 (PRO)
          </button>
        </div>
        <button className="btn-tertiary" onClick={() => initGame(gridSize)}>↺ RESTART</button>
      </div>

      <div className="memory-stats-bar">
        <span>MOVES: <strong>{moves}</strong></span> &bull;
        <span>TIME: <strong>{formatTime(timer)}</strong></span> &bull;
        <span>SCORE: <strong>{score}</strong></span> &bull;
        <span>COMBO: <strong className={combo > 1 ? 'active-combo' : ''}>{combo}x</strong></span>
      </div>

      {/* Cards Matrix */}
      <div className={`memory-grid-wrap size-${gridSize}`}>
        {cards.map((card, idx) => {
          const isFlipped = flippedIndices.includes(idx) || matchedPairs.has(card.icon);
          const isMatched = matchedPairs.has(card.icon);

          return (
            <div
              key={card.id}
              className={`memory-card-flipper ${isFlipped ? 'flipped' : ''} ${isMatched ? 'matched' : ''}`}
              onClick={() => handleCardClick(idx)}
            >
              <div className="card-inner">
                <div className="card-front">
                  <span className="card-hologram">⚡</span>
                </div>
                <div className="card-back">
                  <span className="card-symbol">{card.icon}</span>
                </div>
              </div>
            </div>
          );
        })}

        {gameWon && (
          <div className="memory-victory-modal">
            <h2>🏆 ALL PAIRS MATCHED!</h2>
            <p>Completed in <strong>{moves} moves</strong> ({formatTime(timer)})</p>
            <p>Final Score: <strong>{score}</strong></p>
            <button className="btn-primary" onClick={() => initGame(gridSize)}>PLAY AGAIN</button>
          </div>
        )}
      </div>

      <p className="memory-hint">
        Click to flip cards. Match all pairs with minimum moves and highest streak combo!
      </p>
    </div>
  );
};

export default MemoryMatchGame;
