import React, { useState, useEffect, useRef } from 'react';
import SoundEffects from '../../../utils/SoundEffects';
import { api } from '../../../services/api';
import './WhackAMoleGame.css';

const WhackAMoleGame = ({ user, onLeave }) => {
  const [moles, setMoles] = useState(Array(9).fill(null)); // null | 'NORMAL' | 'GOLDEN'
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [combo, setCombo] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [unlockedBanner, setUnlockedBanner] = useState(null);

  const timerRef = useRef(null);
  const moleTimerRef = useRef(null);

  const startGame = () => {
    setScore(0);
    setTimeLeft(30);
    setCombo(0);
    setGameOver(false);
    setIsPlaying(true);
    setMoles(Array(9).fill(null));
  };

  // Main 30s Countdown Timer
  useEffect(() => {
    if (isPlaying && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            endGame();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [isPlaying, timeLeft]);

  // Mole Pop Spawning Loop
  useEffect(() => {
    if (isPlaying && !gameOver) {
      moleTimerRef.current = setInterval(() => {
        const randomHole = Math.floor(Math.random() * 9);
        const isGolden = Math.random() < 0.2; // 20% golden bonus
        const moleType = isGolden ? 'GOLDEN' : 'NORMAL';

        setMoles(prev => {
          const next = [...prev];
          next[randomHole] = moleType;
          return next;
        });

        // Hide mole after 850ms
        setTimeout(() => {
          setMoles(prev => {
            const next = [...prev];
            if (next[randomHole] === moleType) next[randomHole] = null;
            return next;
          });
        }, 850);
      }, 650);
    }

    return () => clearInterval(moleTimerRef.current);
  }, [isPlaying, gameOver]);

  const handleWhack = (index) => {
    if (!isPlaying || gameOver || !moles[index]) return;

    SoundEffects.playSafe();
    const isGolden = moles[index] === 'GOLDEN';
    const basePts = isGolden ? 30 : 10;
    const nextCombo = combo + 1;
    const gained = basePts * (nextCombo > 3 ? 2 : 1);

    setCombo(nextCombo);
    setScore(prev => prev + gained);

    // Hide mole immediately
    setMoles(prev => {
      const next = [...prev];
      next[index] = null;
      return next;
    });
  };

  const endGame = async () => {
    setIsPlaying(false);
    setGameOver(true);
    clearInterval(moleTimerRef.current);
    SoundEffects.playWin();

    const res = await api.submitScore('WHACK_A_MOLE', score, true, user);
    if (res?.unlockedAchievements?.length > 0) {
      setUnlockedBanner(res.unlockedAchievements[0]);
    }
  };

  return (
    <div className="mole-container glass-panel">
      <div className="mole-header">
        <button className="btn-secondary" onClick={onLeave}>&larr; LEAVE</button>
        <div className="mole-stats-row">
          <div className="mole-stat">TIME: <strong style={{ color: timeLeft < 6 ? '#ff0055' : '#ffd600' }}>{timeLeft}s</strong></div>
          <div className="mole-stat">SCORE: <strong style={{ color: '#00f3ff' }}>{score}</strong></div>
          {combo > 2 && <div className="mole-combo">🔥 {combo}x COMBO</div>}
        </div>
        <button className="btn-tertiary" onClick={startGame}>START</button>
      </div>

      {unlockedBanner && (
        <div className="achievement-toast">
          <span>🏆 UNLOCKED: <strong>{unlockedBanner.title}</strong> (+{unlockedBanner.points} pts)</span>
        </div>
      )}

      {/* 3x3 Mole Burrows */}
      <div className="burrows-grid">
        {moles.map((mole, idx) => (
          <div
            key={idx}
            className="burrow-hole"
            onClick={() => handleWhack(idx)}
          >
            <div className="burrow-rim" />
            {mole && (
              <div className={`mole-avatar ${mole.toLowerCase()}`}>
                {mole === 'GOLDEN' ? '👑' : '👾'}
              </div>
            )}
          </div>
        ))}
      </div>

      <p className="mole-hint">💡 Whack popping cyber-moles rapidly! Golden crowns give <strong>3X points</strong>.</p>

      {gameOver && (
        <div className="finish-overlay">
          <h2 className="neon-text" style={{ color: '#76ff03' }}>BLITZ FINISHED!</h2>
          <p style={{ color: '#fff', fontSize: '1.4rem', marginBottom: '15px' }}>Total Score: {score}</p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn-primary" onClick={startGame}>PLAY AGAIN</button>
            <button className="btn-secondary" onClick={onLeave}>BACK TO HUB</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WhackAMoleGame;
