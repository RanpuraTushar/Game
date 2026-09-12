import React, { useState, useEffect } from 'react';
import SoundEffects from '../../../utils/SoundEffects';
import { api } from '../../../services/api';
import './MemoryMatchGame.css';

const ICON_SET = ['🤖', '🛸', '🚀', '⚡', '💎', '🎮', '👾', '🪐', '🛡️', '⚔️', '🔮', '🛰️', '🔥', '👑', '🎯', '🧬', '🎧', '🔋'];

const MEMORY_STAGES = [
  { stage: 1, name: 'NOVICE', size: 8, cols: 4, rows: 2, mult: 1.0, color: '#00ff66' },
  { stage: 2, name: 'SCHOLAR', size: 12, cols: 4, rows: 3, mult: 1.25, color: '#00f3ff' },
  { stage: 3, name: 'EXPERT', size: 16, cols: 4, rows: 4, mult: 1.5, color: '#ffd600' },
  { stage: 4, name: 'MASTER', size: 24, cols: 6, rows: 4, mult: 2.0, color: '#ff9100' },
  { stage: 5, name: 'MEMORY GOD', size: 36, cols: 6, rows: 6, mult: 2.5, color: '#ff0055' }
];

const MemoryMatchGame = ({ user, onLeave }) => {
  const [stage, setStage] = useState(1);
  const [cards, setCards] = useState([]);
  const [flippedIndices, setFlippedIndices] = useState([]);
  const [matchedPairs, setMatchedPairs] = useState(new Set());
  const [moves, setMoves] = useState(0);
  const [timer, setTimer] = useState(0);
  const [combo, setCombo] = useState(1);
  const [score, setScore] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [levelUpBanner, setLevelUpBanner] = useState(null);

  const curStage = MEMORY_STAGES[stage - 1] || MEMORY_STAGES[0];

  const initGame = (size = curStage.size, resetScore = true) => {
    const pairCount = size / 2;
    const selectedIcons = ICON_SET.slice(0, pairCount);
    const deck = [...selectedIcons, ...selectedIcons]
      .sort(() => Math.random() - 0.5)
      .map((icon, id) => ({ id, icon }));

    setCards(deck);
    setFlippedIndices([]);
    setMatchedPairs(new Set());
    setMoves(0);
    setCombo(1);
    if (resetScore) {
      setScore(0);
      setTimer(0);
      setStage(1);
      setLevelUpBanner(null);
    }
    setIsLocked(false);
    setGameWon(false);
  };

  useEffect(() => {
    initGame(MEMORY_STAGES[0].size, true);
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

          const addedScore = Math.round(100 * combo * curStage.mult);
          setScore(s => s + addedScore);
          setCombo(c => c + 1);

          // Win check
          if (nextMatched.size === cards.length / 2) {
            if (stage < MEMORY_STAGES.length) {
              const nextStage = stage + 1;
              const nextStageMeta = MEMORY_STAGES[nextStage - 1];
              setStage(nextStage);
              SoundEffects.playTrophy();
              setLevelUpBanner({
                stage: nextStage,
                name: nextStageMeta.name,
                pairs: nextStageMeta.size / 2,
                mult: nextStageMeta.mult
              });
              setTimeout(() => setLevelUpBanner(null), 3000);
              initGame(nextStageMeta.size, false);
            } else {
              setGameWon(true);
              SoundEffects.playWin();
              api.submitScore('MEMORY_MATCH', score + 1500, true, user);
            }
          }
        }, 450);
      } else {
        // No match
        setTimeout(() => {
          SoundEffects.playLoss();
          setFlippedIndices([]);
          setIsLocked(false);
          setCombo(1);
        }, 800);
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
        <span className="memory-stage-pill" style={{ color: curStage.color, borderColor: curStage.color }}>
          STAGE {stage}/5 &bull; {curStage.name} ({curStage.mult}x)
        </span>
        <button className="btn-tertiary" onClick={() => initGame(MEMORY_STAGES[0].size, true)}>↺ RESET</button>
      </div>

      {levelUpBanner && (
        <div className="memory-levelup-toast">
          🧠 STAGE {levelUpBanner.stage}: {levelUpBanner.name}! {levelUpBanner.pairs} PAIRS UNLOCKED (+{levelUpBanner.mult}x SCORE)
        </div>
      )}

      <div className="memory-stats-bar">
        <span>PAIRS: <strong>{matchedPairs.size} / {cards.length / 2}</strong></span> &bull;
        <span>MOVES: <strong>{moves}</strong></span> &bull;
        <span>TIME: <strong>{formatTime(timer)}</strong></span> &bull;
        <span>SCORE: <strong>{score}</strong></span> &bull;
        <span>COMBO: <strong className={combo > 1 ? 'active-combo' : ''}>{combo}x</strong></span>
      </div>

      {/* Cards Matrix */}
      <div className={`memory-grid-wrap size-${cards.length}`}>
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
            <h2>🏆 ALL 5 STAGES CONQUERED!</h2>
            <p>Completed all tiers in <strong>{moves} moves</strong> ({formatTime(timer)})</p>
            <p>Final Score: <strong>{score}</strong></p>
            <button className="btn-primary" onClick={() => initGame(MEMORY_STAGES[0].size, true)}>PLAY AGAIN</button>
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
