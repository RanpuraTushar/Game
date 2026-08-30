import React, { useState, useEffect } from 'react';
import SoundEffects from '../../../utils/SoundEffects';
import { api } from '../../../services/api';
import './WordleGame.css';

const WORD_LIST = [
  'CYBER', 'NEXUS', 'LASER', 'PIXEL', 'ROBOT', 'GAMES', 'SPACE', 'RADAR',
  'POWER', 'BLAST', 'TURBO', 'MATRIX', 'ORBIT', 'STORM', 'SHIELD', 'PILOT',
  'QUEST', 'BLOCK', 'CHAMP', 'FLAME', 'GHOST', 'HYPER', 'LIGHT', 'MAGIC'
].filter(w => w.length === 5);

const KEYBOARD_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', '⌫']
];

const WordleGame = ({ user, onLeave }) => {
  const [targetWord, setTargetWord] = useState('CYBER');
  const [guesses, setGuesses] = useState([]); // array of 5-letter strings
  const [currentGuess, setCurrentGuess] = useState('');
  const [keyColors, setKeyColors] = useState({}); // letter -> 'correct', 'present', 'absent'
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [unlockedBanner, setUnlockedBanner] = useState(null);

  useEffect(() => {
    startNewGame();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameOver || gameWon) return;

      if (e.key === 'Enter') {
        handleKeyClick('ENTER');
      } else if (e.key === 'Backspace') {
        handleKeyClick('⌫');
      } else if (/^[a-zA-Z]$/.test(e.key)) {
        handleKeyClick(e.key.toUpperCase());
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentGuess, guesses, gameOver, gameWon, targetWord]);

  const startNewGame = () => {
    const word = WORD_LIST[Math.floor(Math.random() * WORD_LIST.length)];
    setTargetWord(word);
    setGuesses([]);
    setCurrentGuess('');
    setKeyColors({});
    setGameOver(false);
    setGameWon(false);
  };

  const handleKeyClick = (key) => {
    if (gameOver || gameWon) return;

    if (key === 'ENTER') {
      if (currentGuess.length === 5) {
        submitGuess();
      }
    } else if (key === '⌫') {
      setCurrentGuess(prev => prev.slice(0, -1));
      SoundEffects.playClick();
    } else {
      if (currentGuess.length < 5) {
        setCurrentGuess(prev => prev + key);
        SoundEffects.playClick();
      }
    }
  };

  const submitGuess = async () => {
    const newGuesses = [...guesses, currentGuess];
    setGuesses(newGuesses);

    // Evaluate Key Colors
    const updatedKeyColors = { ...keyColors };
    for (let i = 0; i < 5; i++) {
      const letter = currentGuess[i];
      if (targetWord[i] === letter) {
        updatedKeyColors[letter] = 'correct';
      } else if (targetWord.includes(letter) && updatedKeyColors[letter] !== 'correct') {
        updatedKeyColors[letter] = 'present';
      } else if (!targetWord.includes(letter)) {
        updatedKeyColors[letter] = 'absent';
      }
    }
    setKeyColors(updatedKeyColors);

    if (currentGuess === targetWord) {
      // Victory!
      setGameWon(true);
      SoundEffects.playWin();
      const score = Math.max(50, 500 - (newGuesses.length - 1) * 70);
      const res = await api.submitScore('WORDLE', score, true, user);
      if (res?.unlockedAchievements?.length > 0) setUnlockedBanner(res.unlockedAchievements[0]);
    } else if (newGuesses.length === 6) {
      // Defeat
      setGameOver(true);
      SoundEffects.playLoss();
      api.submitScore('WORDLE', 20, false, user);
    } else {
      SoundEffects.playTokenStep();
    }

    setCurrentGuess('');
  };

  const getLetterStatus = (guess, index) => {
    const letter = guess[index];
    if (targetWord[index] === letter) return 'correct';
    if (targetWord.includes(letter)) return 'present';
    return 'absent';
  };

  return (
    <div className="wordle-container glass-panel">
      <div className="wordle-header">
        <button className="btn-secondary" onClick={onLeave}>&larr; LEAVE</button>
        <div className="wordle-title">WORDLE NEXUS</div>
        <div className="wordle-attempts">
          TRY: <strong>{guesses.length + 1}/6</strong>
        </div>
      </div>

      {unlockedBanner && (
        <div className="achievement-toast">
          <span>🏆 UNLOCKED: <strong>{unlockedBanner.title}</strong> (+{unlockedBanner.points} pts)</span>
        </div>
      )}

      {/* 6x5 Letter Grid */}
      <div className="wordle-grid">
        {Array.from({ length: 6 }).map((_, rIdx) => {
          const guess = guesses[rIdx];
          const isCurrent = rIdx === guesses.length;

          return (
            <div key={rIdx} className="wordle-row">
              {Array.from({ length: 5 }).map((_, cIdx) => {
                const char = guess ? guess[cIdx] : isCurrent ? currentGuess[cIdx] || '' : '';
                const status = guess ? getLetterStatus(guess, cIdx) : '';

                return (
                  <div key={cIdx} className={`wordle-cell ${status} ${char ? 'has-letter' : ''}`}>
                    {char}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* On-Screen Virtual Keyboard */}
      <div className="wordle-keyboard">
        {KEYBOARD_ROWS.map((row, rIdx) => (
          <div key={rIdx} className="keyboard-row">
            {row.map(key => {
              const status = keyColors[key] || '';
              return (
                <button
                  key={key}
                  className={`key-btn ${key === 'ENTER' || key === '⌫' ? 'wide-key' : ''} ${status}`}
                  onClick={() => handleKeyClick(key)}
                >
                  {key}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {(gameOver || gameWon) && (
        <div className="finish-overlay">
          <h2 className="neon-text" style={{ color: gameWon ? '#00ff66' : '#ff3366' }}>
            {gameWon ? '🏆 WORD DECRYPTED!' : 'DECRYPTION FAILED!'}
          </h2>
          <p style={{ color: '#fff', fontSize: '1.2rem', marginBottom: '15px' }}>
            The secret word was: <strong style={{ color: '#00f3ff' }}>{targetWord}</strong>
          </p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn-primary" onClick={startNewGame}>PLAY AGAIN</button>
            <button className="btn-secondary" onClick={onLeave}>BACK TO HUB</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WordleGame;
