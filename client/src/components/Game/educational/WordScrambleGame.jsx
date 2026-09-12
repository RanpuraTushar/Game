import React, { useState, useEffect, useRef } from 'react';
import SoundEffects from '../../../utils/SoundEffects';
import { api } from '../../../services/api';
import './WordScrambleGame.css';

const SCRAMBLE_TIERS = [
  {
    level: 1,
    name: 'NOVICE',
    time: 40,
    mult: 1.0,
    color: '#00ff66',
    words: [
      { word: 'BYTE', clue: '8 bits of digital computer storage', category: 'TECH' },
      { word: 'CODE', clue: 'Instructions written for computer software', category: 'CODING' },
      { word: 'ROBOT', clue: 'Autonomous electro-mechanical cyber machine', category: 'TECH' },
      { word: 'PIXEL', clue: 'Smallest illuminated dot on a digital screen', category: 'GAMING' }
    ]
  },
  {
    level: 2,
    name: 'SCHOLAR',
    time: 32,
    mult: 1.25,
    color: '#00f3ff',
    words: [
      { word: 'CYBER', clue: 'Relating to computers, information technology, and VR', category: 'TECH' },
      { word: 'ARCADE', clue: 'A venue with coin-operated video games', category: 'GAMING' },
      { word: 'PYTHON', clue: 'Popular programming language named after a comedy group', category: 'CODING' },
      { word: 'GALAXY', clue: 'A huge system of stars, stellar remnants, and gas', category: 'SPACE' }
    ]
  },
  {
    level: 3,
    name: 'CIPHER',
    time: 25,
    mult: 1.5,
    color: '#ffd600',
    words: [
      { word: 'QUANTUM', clue: 'Minimum amount of any physical entity in an interaction', category: 'SCIENCE' },
      { word: 'NETWORK', clue: 'Interconnected group of computers sharing data', category: 'TECH' },
      { word: 'SILICON', clue: 'Chemical element used to forge microchips', category: 'SCIENCE' },
      { word: 'GRAVITY', clue: 'Universal force attracting masses together', category: 'PHYSICS' }
    ]
  },
  {
    level: 4,
    name: 'MASTER',
    time: 20,
    mult: 2.0,
    color: '#ff9100',
    words: [
      { word: 'DATABASE', clue: 'Organized collection of structured information', category: 'TECH' },
      { word: 'FIREWALL', clue: 'Security system monitoring network traffic', category: 'SECURITY' },
      { word: 'TERMINAL', clue: 'Text-based interface to control a computer', category: 'CODING' },
      { word: 'HARDWARE', clue: 'Physical electronic components of a machine', category: 'TECH' }
    ]
  },
  {
    level: 5,
    name: 'GENIUS',
    time: 16,
    mult: 2.5,
    color: '#ff0055',
    words: [
      { word: 'ALGORITHM', clue: 'Step-by-step procedure for solving a computational problem', category: 'CODING' },
      { word: 'ENCRYPTION', clue: 'Encoding information to prevent cyber interception', category: 'SECURITY' },
      { word: 'BLOCKCHAIN', clue: 'Decentralized distributed digital ledger', category: 'CRYPTO' },
      { word: 'SUPERNOVA', clue: 'Cataclysmic nuclear explosion of a dying massive star', category: 'SPACE' }
    ]
  }
];

const WordScrambleGame = ({ user, onLeave }) => {
  const [tierIdx, setTierIdx] = useState(0);
  const [wordIdxInTier, setWordIdxInTier] = useState(0);
  const [scrambledLetters, setScrambledLetters] = useState([]);
  const [placedLetters, setPlacedLetters] = useState([]);
  const [score, setScore] = useState(0);
  const scoreRef = useRef(0);
  const [streak, setStreak] = useState(0);
  const [timer, setTimer] = useState(SCRAMBLE_TIERS[0].time);
  const [showClue, setShowClue] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [levelUpBanner, setLevelUpBanner] = useState(null);

  const curTier = SCRAMBLE_TIERS[tierIdx] || SCRAMBLE_TIERS[0];
  const curItem = curTier.words[wordIdxInTier] || curTier.words[0];

  const loadWord = (tIdx, wIdx) => {
    const tier = SCRAMBLE_TIERS[tIdx];
    const item = tier.words[wIdx];
    const letters = item.word.split('');
    let shuffled;
    do {
      shuffled = [...letters].sort(() => Math.random() - 0.5);
    } while (shuffled.join('') === item.word);

    setScrambledLetters(shuffled.map((char, id) => ({ id, char, used: false })));
    setPlacedLetters([]);
    setShowClue(false);
    setTimer(tier.time);
  };

  useEffect(() => {
    loadWord(0, 0);
  }, []);

  // Timer Tick
  useEffect(() => {
    if (gameWon) return;
    const interval = setInterval(() => {
      setTimer(t => {
        if (t <= 1) {
          handleTimeOut();
          return curTier.time;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [tierIdx, wordIdxInTier, gameWon]);

  const handleTimeOut = () => {
    SoundEffects.playLoss();
    setStreak(0);
    advanceNextWord();
  };

  const advanceNextWord = () => {
    const tier = SCRAMBLE_TIERS[tierIdx];
    if (wordIdxInTier + 1 < tier.words.length) {
      setWordIdxInTier(w => w + 1);
      loadWord(tierIdx, wordIdxInTier + 1);
    } else {
      // Completed current tier!
      if (tierIdx + 1 < SCRAMBLE_TIERS.length) {
        const nextTierIdx = tierIdx + 1;
        const nextTier = SCRAMBLE_TIERS[nextTierIdx];
        setTierIdx(nextTierIdx);
        setWordIdxInTier(0);
        SoundEffects.playTrophy();
        setLevelUpBanner({
          level: nextTier.level,
          name: nextTier.name,
          time: nextTier.time,
          mult: nextTier.mult
        });
        setTimeout(() => setLevelUpBanner(null), 3000);
        loadWord(nextTierIdx, 0);
      } else {
        setGameWon(true);
        SoundEffects.playWin();
        api.submitScore('WORD_SCRAMBLE', scoreRef.current, true, user);
      }
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
    if (newPlaced.length === curItem.word.length) {
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
    const target = curItem.word;

    if (constructed === target) {
      // Success!
      SoundEffects.playCapture();
      const points = Math.round((100 + streak * 25 + timer * 2) * curTier.mult);
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
  }, [scrambledLetters, placedLetters, tierIdx, wordIdxInTier]);

  return (
    <div className="scramble-master-container glass-panel">
      <div className="scramble-top-bar">
        <button className="btn-secondary" onClick={onLeave}>&larr; HUB</button>
        <div className="scramble-meta-badge">
          WORD {wordIdxInTier + 1} / {curTier.words.length} &bull; CATEGORY: <strong>{curItem.category}</strong>
        </div>
        <button className="btn-tertiary" onClick={() => { setTierIdx(0); setWordIdxInTier(0); setScore(0); scoreRef.current = 0; loadWord(0, 0); }}>
          ↺ RESET
        </button>
      </div>

      {levelUpBanner && (
        <div className="scramble-levelup-toast">
          🔤 LEVEL {levelUpBanner.level}: {levelUpBanner.name}! WORDS LONGER &amp; TIMER FASTER (+{levelUpBanner.mult}x SCORE)
        </div>
      )}

      <div className="scramble-stats-bar">
        <span>SCORE: <strong>{score}</strong></span> &bull;
        <span>TIME: <strong className={timer <= 10 ? 'red-time' : ''}>{timer}s</strong></span> &bull;
        <span>STREAK: <strong>{streak}🔥</strong></span> &bull;
        <span className="scramble-tier-pill" style={{ color: curTier.color, borderColor: curTier.color }}>
          LVL {curTier.level} &bull; {curTier.name} ({curTier.mult}x)
        </span>
      </div>

      {!gameWon ? (
        <div className="scramble-play-area">
          {/* Answer Target Slots */}
          <div className="answer-slots-row">
            {Array.from({ length: curItem.word.length }).map((_, idx) => {
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
              <p className="clue-text">💡 {curItem.clue}</p>
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
          <h2>🎉 VOCABULARY GENIUS!</h2>
          <p>All 5 Cyber Difficulty Tiers Mastered!</p>
          <p>Final Score: <strong>{score}</strong></p>
          <button className="btn-primary" onClick={() => { setTierIdx(0); setWordIdxInTier(0); setScore(0); scoreRef.current = 0; loadWord(0, 0); setGameWon(false); }}>
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
