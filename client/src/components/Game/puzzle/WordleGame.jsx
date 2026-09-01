import React, { useState, useEffect } from 'react';
import SoundEffects from '../../../utils/SoundEffects';
import { api } from '../../../services/api';
import './WordleGame.css';

const WORD_LIST = [
  'CYBER', 'NEXUS', 'LASER', 'PIXEL', 'ROBOT', 'GAMES', 'SPACE', 'RADAR',
  'POWER', 'BLAST', 'TURBO', 'MATRIX', 'ORBIT', 'STORM', 'SHIELD', 'PILOT',
  'QUEST', 'BLOCK', 'CHAMP', 'FLAME', 'GHOST', 'HYPER', 'LIGHT', 'MAGIC',
  'BLAZE', 'SONIC', 'DRONE', 'FORCE', 'PULSE', 'TITAN', 'SPARK', 'BLADE'
].filter(w => w.length === 5);

const KEYBOARD_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', '⌫']
];

const WordleGame = ({ user, onLeave }) => {
  const [gameMode, setGameMode] = useState('SOLO'); // 'SOLO' or 'TWO_PLAYER'
  const [phase, setPhase] = useState('PLAYING'); // 'SET_WORD' or 'PLAYING'
  
  const [targetWord, setTargetWord] = useState('CYBER');
  const [customWordInput, setCustomWordInput] = useState('');

  const [guesses, setGuesses] = useState([]);
  const [currentGuess, setCurrentGuess] = useState('');
  const [keyColors, setKeyColors] = useState({});
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [unlockedBanner, setUnlockedBanner] = useState(null);

  useEffect(() => {
    startNewGame();
  }, [gameMode]);

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
  }, [currentGuess, guesses, gameOver, gameWon, targetWord, phase, customWordInput]);

  const startNewGame = () => {
    if (gameMode === 'TWO_PLAYER') {
      setPhase('SET_WORD');
      setCustomWordInput('');
      setTargetWord('');
    } else {
      setPhase('PLAYING');
      const word = WORD_LIST[Math.floor(Math.random() * WORD_LIST.length)];
      setTargetWord(word);
    }
    setGuesses([]);
    setCurrentGuess('');
    setKeyColors({});
    setGameOver(false);
    setGameWon(false);
  };

  const handleKeyClick = (key) => {
    if (gameOver || gameWon) return;

    if (phase === 'SET_WORD') {
      if (key === 'ENTER') {
        if (customWordInput.length === 5) {
          setTargetWord(customWordInput);
          setPhase('PLAYING');
          SoundEffects.playSafe();
        }
      } else if (key === '⌫') {
        setCustomWordInput(prev => prev.slice(0, -1));
        SoundEffects.playClick();
      } else if (customWordInput.length < 5 && key !== 'ENTER' && key !== '⌫') {
        setCustomWordInput(prev => prev + key);
        SoundEffects.playClick();
      }
      return;
    }

    if (key === 'ENTER') {
      if (currentGuess.length === 5) {
        submitGuess();
      }
    } else if (key === '⌫') {
      setCurrentGuess(prev => prev.slice(0, -1));
      SoundEffects.playClick();
    } else {
      if (currentGuess.length < 5 && key !== 'ENTER' && key !== '⌫') {
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
      setGameWon(true);
      SoundEffects.playWin();
      const score = Math.max(50, 500 - (newGuesses.length - 1) * 70);
      const res = await api.submitScore('WORDLE', score, true, user);
      if (res?.unlockedAchievements?.length > 0) setUnlockedBanner(res.unlockedAchievements[0]);
    } else if (newGuesses.length === 6) {
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
      {/* Top Header */}
      <div className="wordle-header">
        <button className="btn-secondary" onClick={onLeave}>&larr; HUB</button>
        
        {/* Mode Selector */}
        <div className="game-mode-toggle-group">
          <button 
            className={`mode-pill-btn ${gameMode === 'SOLO' ? 'active' : ''}`}
            onClick={() => setGameMode('SOLO')}
          >
            👤 SOLO DEDUCTION
          </button>
          <button 
            className={`mode-pill-btn ${gameMode === 'TWO_PLAYER' ? 'active' : ''}`}
            onClick={() => setGameMode('TWO_PLAYER')}
          >
            👥 2-PLAYER DUEL
          </button>
        </div>

        <button className="btn-tertiary" onClick={startNewGame}>↺ RESTART</button>
      </div>

      {/* Status Bar */}
      <div className="wordle-status-bar">
        {phase === 'SET_WORD' ? (
          <div className="wordle-phase-banner" style={{ color: '#00f3ff' }}>
            🔒 PLAYER 1: ENTER 5-LETTER SECRET WORD
          </div>
        ) : (
          <div className="wordle-phase-banner">
            <span>{gameMode === 'TWO_PLAYER' ? '🎯 PLAYER 2: GUESS THE WORD' : '🎯 ATTEMPT:'} </span>
            <strong style={{ color: '#00ff66' }}>{guesses.length + 1} / 6</strong>
          </div>
        )}
      </div>

      {unlockedBanner && (
        <div className="achievement-toast">
          <span>🏆 UNLOCKED: <strong>{unlockedBanner.title}</strong> (+{unlockedBanner.points} pts)</span>
        </div>
      )}

      {/* Set Word Phase (2-Player Mode) */}
      {phase === 'SET_WORD' ? (
        <div className="wordle-set-word-box">
          <div className="wordle-row" style={{ justifyContent: 'center' }}>
            {Array.from({ length: 5 }).map((_, idx) => (
              <div key={idx} className="wordle-cell has-letter" style={{ width: '56px', height: '56px', fontSize: '1.6rem' }}>
                {customWordInput[idx] || ''}
              </div>
            ))}
          </div>

          <p style={{ color: '#a4acc4', fontSize: '0.9rem', marginTop: '16px' }}>
            Type a 5-letter word for Player 2 to guess, then tap <strong>ENTER</strong>.
          </p>

          <button
            className="btn-primary"
            onClick={() => handleKeyClick('ENTER')}
            disabled={customWordInput.length !== 5}
            style={{ marginTop: '14px', padding: '10px 24px' }}
          >
            CONFIRM WORD & PASS TO PLAYER 2 →
          </button>
        </div>
      ) : (
        /* 6x5 Letter Grid */
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
      )}

      {/* Virtual Keyboard */}
      <div className="wordle-keyboard">
        {KEYBOARD_ROWS.map((row, rIdx) => (
          <div key={rIdx} className="keyboard-row">
            {row.map(key => {
              const status = phase === 'PLAYING' ? (keyColors[key] || '') : '';
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
            {gameWon ? (gameMode === 'TWO_PLAYER' ? '🏆 PLAYER 2 CRACKED THE WORD!' : '🏆 WORD DECRYPTED!') : (gameMode === 'TWO_PLAYER' ? '🏆 PLAYER 1 DEFENDED THE WORD!' : 'DECRYPTION FAILED!')}
          </h2>
          <p style={{ color: '#fff', fontSize: '1.2rem', margin: '10px 0 20px 0' }}>
            Secret word was: <strong style={{ color: '#00f3ff' }}>{targetWord}</strong>
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
