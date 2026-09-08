import React, { useState, useEffect, useRef } from 'react';
import SoundEffects from '../../../utils/SoundEffects';
import { api } from '../../../services/api';
import './WordScrambleGame.css';

const WORD_BANK = [
  { word: 'CYBER', clue: 'Relating to computers, information technology, and VR', category: 'TECH' },
  { word: 'ARCADE', clue: 'A venue with coin-operated video games', category: 'GAMING' },
  { word: 'PYTHON', clue: 'Popular programming language named after a comedy group', category: 'CODING' },
  { word: 'GALAXY', clue: 'A huge system of stars, stellar remnants, and gas', category: 'SPACE' },
  { word: 'ROBOT', clue: 'Autonomous electro-mechanical cyber machine', category: 'TECH' },
  { word: 'ALGORITHM', clue: 'Step-by-step procedure for solving a problem', category: 'CODING' },
  { word: 'NEBULA', clue: 'An interstellar cloud of dust, hydrogen, and helium', category: 'SPACE' },
  { word: 'DATABASE', clue: 'Organized collection of structured information', category: 'TECH' },
  { word: 'QUANTUM', clue: 'Minimum amount of any physical entity in an interaction', category: 'SCIENCE' },
  { word: 'MATRIX', clue: 'Rectangular array of numbers or simulated cyber reality', category: 'TECH' }
];

const WordScrambleGame = ({ user, onLeave }) => {
  const [currentWordIdx, setCurrentWordIdx] = useState(0);
  const [scrambledLetters, setScrambledLetters] = useState([]);
  const [placedLetters, setPlacedLetters] = useState([]);
  const [score, setScore] = useState(0);
  const scoreRef = useRef(0);
  const [streak, setStreak] = useState(0);
  const [timer, setTimer] = useState(40);
  const [showClue, setShowClue] = useState(false);
  const [gameWon, setGameWon] = useState(false);

  const loadWord = (idx) => {
    const item = WORD_BANK[idx];
    const letters = item.word.split('');
    let shuffled;
    do {
      shuffled = [...letters].sort(() => Math.random() - 0.5);
    } while (shuffled.join('') === item.word);

    setScrambledLetters(shuffled.map((char, id) => ({ id, char, used: false })));
    setPlacedLetters([]);
    setShowClue(false);
    setTimer(40);
  };

  useEffect(() => {
    loadWord(0);
  }, []);

  // Timer Tick
  useEffect(() => {
    if (gameWon) return;
    const interval = setInterval(() => {
      setTimer(t => {
        if (t <= 1) {
          // Time out for word
          handleTimeOut();
          return 40;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [currentWordIdx, gameWon]);

  const handleTimeOut = () => {
    SoundEffects.playLoss();
    setStreak(0);
    advanceNextWord();
  };

  const advanceNextWord = () => {
    if (currentWordIdx + 1 < WORD_BANK.length) {
      setCurrentWordIdx(i => i + 1);
      loadWord(currentWordIdx + 1);
    } else {
      setGameWon(true);
      SoundEffects.playWin();
      api.submitScore('WORD_SCRAMBLE', scoreRef.current, true, user);
    }
  };

  // Click letter from scrambled tray
  const handleSelectScrambled = (item) => {
    if (item.used) return;
    SoundEffects.playClick();

    setScrambledLetters(prev =>
      prev.map(l => (l.id === item.id ? { ...l, used: true } : l))
    );
    const newPlaced = [...placedLetters, item];
    setPlacedLetters(newPlaced);

    // Auto validate if full length
    if (newPlaced.length === WORD_BANK[currentWordIdx].word.length) {
      validateWord(newPlaced);
    }
  };

  // Click placed letter to return to tray
  const handleRemovePlaced = (placedItem, pIdx) => {
    SoundEffects.playClick();
    setPlacedLetters(prev => prev.filter((_, idx) => idx !== pIdx));
    setScrambledLetters(prev =>
      prev.map(l => (l.id === placedItem.id ? { ...l, used: false } : l))
    );
  };

  const validateWord = (placed) => {
    const constructed = placed.map(p => p.char).join('');
    const target = WORD_BANK[currentWordIdx].word;

    if (constructed === target) {
      // Success!
      SoundEffects.playCapture();
      const points = 100 + streak * 25 + timer * 2;
      scoreRef.current += points;
      setScore(scoreRef.current);
      setStreak(st => st + 1);

      setTimeout(() => {
        advanceNextWord();
      }, 400);
    } else {
      // Wrong
      SoundEffects.playLoss();
      setTimeout(() => {
        // Return all letters
        setScrambledLetters(prev => prev.map(l => ({ ...l, used: false })));
        setPlacedLetters([]);
      }, 500);
    }
  };

  // Physical keyboard typing support
  useEffect(() => {
    const handleKeyDown = (e) => {
      const key = e.key.toUpperCase();
      if (key === 'BACKSPACE') {
        if (placedLetters.length > 0) {
          handleRemovePlaced(placedLetters[placedLetters.length - 1], placedLetters.length - 1);
        }
      } else if (/^[A-Z]$/.test(key)) {
        const available = scrambledLetters.find(l => l.char === key && !l.used);
        if (available) {
          handleSelectScrambled(available);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [scrambledLetters, placedLetters, currentWordIdx]);

  const currentItem = WORD_BANK[currentWordIdx];

  return (
    <div className="scramble-master-container glass-panel">
      <div className="scramble-top-bar">
        <button className="btn-secondary" onClick={onLeave}>&larr; HUB</button>
        <div className="scramble-meta-badge">
          WORD {currentWordIdx + 1} / {WORD_BANK.length} &bull; CATEGORY: <strong>{currentItem.category}</strong>
        </div>
      </div>

      <div className="scramble-stats-bar">
        <span>SCORE: <strong>{score}</strong></span> &bull;
        <span>TIME: <strong className={timer <= 10 ? 'red-time' : ''}>{timer}s</strong></span> &bull;
        <span>STREAK: <strong>{streak}🔥</strong></span>
      </div>

      {!gameWon ? (
        <div className="scramble-play-area">
          {/* Answer Target Slots */}
          <div className="answer-slots-row">
            {Array.from({ length: currentItem.word.length }).map((_, idx) => {
              const placed = placedLetters[idx];
              return (
                <div
                  key={idx}
                  className={`answer-slot ${placed ? 'filled' : ''}`}
                  onClick={() => placed && handleRemovePlaced(placed, idx)}
                >
                  {placed ? placed.char : ''}
                </div>
              );
            })}
          </div>

          {/* Clue Box */}
          <div className="clue-container">
            {showClue ? (
              <p className="clue-text">💡 {currentItem.clue}</p>
            ) : (
              <button className="btn-tertiary clue-reveal-btn" onClick={() => setShowClue(true)}>
                💡 NEED A CLUE? (-20 pts)
              </button>
            )}
          </div>

          {/* Scrambled Letter Tiles Tray */}
          <div className="scrambled-letters-tray">
            {scrambledLetters.map(item => (
              <button
                key={item.id}
                className={`letter-tile ${item.used ? 'used' : ''}`}
                disabled={item.used}
                onClick={() => handleSelectScrambled(item)}
              >
                {item.char}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="scramble-victory-screen">
          <h2>🎉 VOCABULARY CHAMPION!</h2>
          <p>You solved all {WORD_BANK.length} cyber words!</p>
          <p>Final Score: <strong>{score}</strong></p>
          <button className="btn-primary" onClick={() => { setCurrentWordIdx(0); loadWord(0); setGameWon(false); }}>
            PLAY AGAIN
          </button>
        </div>
      )}

      <p className="scramble-hint">
        Type on keyboard or tap letter tiles to spell the word. Tap placed letters or press Backspace to undo!
      </p>
    </div>
  );
};

export default WordScrambleGame;
