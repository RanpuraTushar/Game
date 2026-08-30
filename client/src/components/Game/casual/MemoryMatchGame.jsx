import React, { useState, useEffect } from 'react';
import SoundEffects from '../../../utils/SoundEffects';
import { api } from '../../../services/api';
import './MemoryMatchGame.css';

const ICONS = ['⚡', '🚀', '💎', '👑', '🎯', '🔥', '🕹️', '👾'];

const MemoryMatchGame = ({ socket, room, user, onLeave }) => {
  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState([]);
  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(0);
  const [combo, setCombo] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [unlockedBanner, setUnlockedBanner] = useState(null);

  // Initialize deck
  useEffect(() => {
    startNewGame();
  }, []);

  const startNewGame = () => {
    const deck = [];
    ICONS.forEach((icon, idx) => {
      deck.push({ id: idx * 2, icon, pairId: idx });
      deck.push({ id: idx * 2 + 1, icon, pairId: idx });
    });
    // Shuffle
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    setCards(deck);
    setFlipped([]);
    setMatched([]);
    setScore(0);
    setMoves(0);
    setCombo(0);
    setGameOver(false);
  };

  const handleCardClick = async (index) => {
    if (flipped.length === 2 || flipped.includes(index) || matched.includes(cards[index].pairId)) {
      return;
    }

    SoundEffects.playClick();
    const newFlipped = [...flipped, index];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(prev => prev + 1);
      const [idx1, idx2] = newFlipped;
      const card1 = cards[idx1];
      const card2 = cards[idx2];

      if (card1.pairId === card2.pairId) {
        // Matched!
        setTimeout(async () => {
          SoundEffects.playSafe();
          const newMatched = [...matched, card1.pairId];
          const newCombo = combo + 1;
          const gainedPoints = 20 * newCombo;
          const newScore = score + gainedPoints;

          setMatched(newMatched);
          setCombo(newCombo);
          setScore(newScore);
          setFlipped([]);

          // Check Win (all 8 pairs matched)
          if (newMatched.length === ICONS.length) {
            setGameOver(true);
            SoundEffects.playWin();
            const res = await api.submitScore('MEMORY_MATCH', newScore, true, user);
            if (res?.unlockedAchievements?.length > 0) {
              setUnlockedBanner(res.unlockedAchievements[0]);
            }
          }
        }, 400);
      } else {
        // No match - flip back after delay
        setCombo(0);
        setTimeout(() => {
          setFlipped([]);
        }, 900);
      }
    }
  };

  return (
    <div className="memory-container glass-panel">
      {/* Header */}
      <div className="memory-header">
        <button className="btn-secondary" onClick={onLeave}>&larr; LEAVE</button>
        <div className="memory-stats-row">
          <div className="stat-pill">
            <span>SCORE: </span><strong style={{ color: '#00f3ff' }}>{score}</strong>
          </div>
          <div className="stat-pill">
            <span>MOVES: </span><strong>{moves}</strong>
          </div>
          {combo > 1 && (
            <div className="stat-pill combo-pill">
              <span>COMBO: </span><strong>{combo}x 🔥</strong>
            </div>
          )}
        </div>
        <button className="btn-tertiary" onClick={startNewGame}>RESET</button>
      </div>

      {unlockedBanner && (
        <div className="achievement-toast">
          <span>🏆 UNLOCKED: <strong>{unlockedBanner.title}</strong> (+{unlockedBanner.points} pts)</span>
        </div>
      )}

      {/* 4x4 Memory Cards Grid */}
      <div className="memory-grid">
        {cards.map((card, idx) => {
          const isFlipped = flipped.includes(idx) || matched.includes(card.pairId);
          const isPairMatched = matched.includes(card.pairId);

          return (
            <div
              key={idx}
              className={`memory-card-wrap ${isFlipped ? 'flipped' : ''} ${isPairMatched ? 'matched' : ''}`}
              onClick={() => handleCardClick(idx)}
            >
              <div className="card-inner">
                <div className="card-front">
                  <span className="hologram-pattern">❖</span>
                </div>
                <div className="card-back">
                  <span className="card-icon">{card.icon}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {gameOver && (
        <div className="finish-overlay">
          <h2 className="neon-text" style={{ color: '#00ff66' }}>🏆 MEMORY MASTER!</h2>
          <p style={{ color: '#fff', fontSize: '1.2rem', marginBottom: '10px' }}>Final Score: {score}</p>
          <p style={{ color: '#aaa', fontSize: '0.9rem', marginBottom: '20px' }}>Total Moves: {moves}</p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn-primary" onClick={startNewGame}>PLAY AGAIN</button>
            <button className="btn-secondary" onClick={onLeave}>BACK TO HUB</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemoryMatchGame;
