import React, { useState, useEffect, useRef } from 'react';
import SoundEffects from '../../../utils/SoundEffects';
import { api } from '../../../services/api';
import './MathQuizGame.css';

const MODES = [
  { id: 'MIXED', label: '🔀 ALL MIXED' },
  { id: 'ADD', label: '➕ ADDITION' },
  { id: 'SUB', label: '➖ SUBTRACTION' },
  { id: 'MUL', label: '✖️ MULTIPLY' }
];

const MATH_TIERS = [
  { level: 1, name: 'NOVICE', minCorrect: 0, mult: 1.0, color: '#00ff66', desc: 'Single & Easy 2-Digit Math' },
  { level: 2, name: 'SCHOLAR', minCorrect: 4, mult: 1.25, color: '#00f3ff', desc: '2-Digit Sums & Basic Multiples' },
  { level: 3, name: 'EXPERT', minCorrect: 9, mult: 1.5, color: '#ffd600', desc: 'Rapid 2-Digit Arithmetic' },
  { level: 4, name: 'MASTER', minCorrect: 15, mult: 2.0, color: '#ff9100', desc: '3-Digit Sums & Tables' },
  { level: 5, name: 'GENIUS', minCorrect: 22, mult: 2.5, color: '#ff0055', desc: 'Overdrive Mental Math & Rapid Tables' }
];

const getTierForCorrect = (correct) => {
  for (let i = MATH_TIERS.length - 1; i >= 0; i--) {
    if (correct >= MATH_TIERS[i].minCorrect) return MATH_TIERS[i];
  }
  return MATH_TIERS[0];
};

const MathQuizGame = ({ user, onLeave }) => {
  const [mode, setMode] = useState('MIXED');
  const [question, setQuestion] = useState(null);
  const [options, setOptions] = useState([]);
  const [score, setScore] = useState(0);
  const scoreRef = useRef(0);
  const [streak, setStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [gameState, setGameState] = useState('START'); // 'START', 'PLAYING', 'GAMEOVER'
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [currentTier, setCurrentTier] = useState(MATH_TIERS[0]);
  const [levelUpBanner, setLevelUpBanner] = useState(null);

  const generateQuestion = (currentMode = mode, correct = correctCount) => {
    const tier = getTierForCorrect(correct);
    let op = currentMode;
    if (op === 'MIXED') {
      const ops = ['ADD', 'SUB', 'MUL'];
      op = ops[Math.floor(Math.random() * ops.length)];
    }

    let a, b, answer, symbol;
    if (tier.level === 1) {
      if (op === 'ADD') {
        a = Math.floor(Math.random() * 20) + 3;
        b = Math.floor(Math.random() * 20) + 2;
        answer = a + b;
        symbol = '+';
      } else if (op === 'SUB') {
        a = Math.floor(Math.random() * 25) + 8;
        b = Math.floor(Math.random() * (a - 2)) + 2;
        answer = a - b;
        symbol = '-';
      } else {
        a = Math.floor(Math.random() * 8) + 2;
        b = Math.floor(Math.random() * 8) + 2;
        answer = a * b;
        symbol = '×';
      }
    } else if (tier.level === 2) {
      if (op === 'ADD') {
        a = Math.floor(Math.random() * 50) + 15;
        b = Math.floor(Math.random() * 50) + 10;
        answer = a + b;
        symbol = '+';
      } else if (op === 'SUB') {
        a = Math.floor(Math.random() * 60) + 25;
        b = Math.floor(Math.random() * (a - 10)) + 8;
        answer = a - b;
        symbol = '-';
      } else {
        a = Math.floor(Math.random() * 10) + 3;
        b = Math.floor(Math.random() * 10) + 2;
        answer = a * b;
        symbol = '×';
      }
    } else if (tier.level === 3) {
      if (op === 'ADD') {
        a = Math.floor(Math.random() * 90) + 35;
        b = Math.floor(Math.random() * 80) + 25;
        answer = a + b;
        symbol = '+';
      } else if (op === 'SUB') {
        a = Math.floor(Math.random() * 120) + 40;
        b = Math.floor(Math.random() * (a - 15)) + 15;
        answer = a - b;
        symbol = '-';
      } else {
        a = Math.floor(Math.random() * 12) + 4;
        b = Math.floor(Math.random() * 12) + 3;
        answer = a * b;
        symbol = '×';
      }
    } else if (tier.level === 4) {
      if (op === 'ADD') {
        a = Math.floor(Math.random() * 250) + 75;
        b = Math.floor(Math.random() * 200) + 50;
        answer = a + b;
        symbol = '+';
      } else if (op === 'SUB') {
        a = Math.floor(Math.random() * 300) + 80;
        b = Math.floor(Math.random() * (a - 30)) + 25;
        answer = a - b;
        symbol = '-';
      } else {
        a = Math.floor(Math.random() * 15) + 5;
        b = Math.floor(Math.random() * 14) + 4;
        answer = a * b;
        symbol = '×';
      }
    } else {
      // Level 5 Genius
      if (op === 'ADD') {
        a = Math.floor(Math.random() * 600) + 150;
        b = Math.floor(Math.random() * 500) + 120;
        answer = a + b;
        symbol = '+';
      } else if (op === 'SUB') {
        a = Math.floor(Math.random() * 700) + 150;
        b = Math.floor(Math.random() * (a - 50)) + 40;
        answer = a - b;
        symbol = '-';
      } else {
        a = Math.floor(Math.random() * 20) + 7;
        b = Math.floor(Math.random() * 18) + 6;
        answer = a * b;
        symbol = '×';
      }
    }

    // Generate 3 distractors
    const choices = new Set([answer]);
    while (choices.size < 4) {
      const offset = (Math.random() > 0.5 ? 1 : -1) * (Math.floor(Math.random() * (tier.level * 4 + 4)) + 1);
      const wrong = answer + offset;
      if (wrong >= 0) choices.add(wrong);
    }

    const shuffled = Array.from(choices).sort(() => Math.random() - 0.5);

    setQuestion({ a, b, symbol, answer });
    setOptions(shuffled);
    setSelectedOption(null);
    setIsAnswered(false);
  };

  const startGame = () => {
    setScore(0);
    scoreRef.current = 0;
    setStreak(0);
    setTimeLeft(60);
    setTotalAnswered(0);
    setCorrectCount(0);
    setCurrentTier(MATH_TIERS[0]);
    setLevelUpBanner(null);
    setGameState('PLAYING');
    generateQuestion(mode, 0);
    SoundEffects.playMove();
  };

  // 60-Second Timer
  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timer);
          endGame();
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState]);

  const endGame = () => {
    setGameState('GAMEOVER');
    SoundEffects.playWin();
    api.submitScore('MATH_QUIZ', scoreRef.current, scoreRef.current >= 500, user);
  };

  const handleSelectOption = (choice) => {
    if (isAnswered || gameState !== 'PLAYING') return;
    setIsAnswered(true);
    setSelectedOption(choice);
    setTotalAnswered(t => t + 1);

    if (choice === question.answer) {
      // Correct
      const newCorrect = correctCount + 1;
      setCorrectCount(newCorrect);

      const oldTier = currentTier;
      const nextTier = getTierForCorrect(newCorrect);
      if (nextTier.level > oldTier.level) {
        setCurrentTier(nextTier);
        SoundEffects.playTrophy();
        setLevelUpBanner({ level: nextTier.level, name: nextTier.name, mult: nextTier.mult });
        setTimeout(() => setLevelUpBanner(null), 2500);
      }

      const added = Math.round((50 + streak * 15) * nextTier.mult);
      scoreRef.current += added;
      setScore(scoreRef.current);
      setStreak(st => st + 1);
      SoundEffects.playCapture();

      setTimeout(() => {
        generateQuestion(mode, newCorrect);
      }, 400);
    } else {
      // Wrong
      setStreak(0);
      SoundEffects.playLoss();
      setTimeout(() => {
        generateQuestion(mode, correctCount);
      }, 450);
    }
  };

  // Keyboard 1-4
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameState !== 'PLAYING' || isAnswered) return;
      const keyIdx = ['1', '2', '3', '4'].indexOf(e.key);
      if (keyIdx !== -1 && options[keyIdx] !== undefined) {
        handleSelectOption(options[keyIdx]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [options, isAnswered, gameState]);

  return (
    <div className="math-master-container glass-panel">
      <div className="math-top-bar">
        <button className="btn-secondary" onClick={onLeave}>&larr; HUB</button>
        <div className="math-mode-pill-group">
          {MODES.map(m => (
            <button
              key={m.id}
              className={`mode-pill-btn ${mode === m.id ? 'active' : ''}`}
              onClick={() => { setMode(m.id); if (gameState === 'PLAYING') generateQuestion(m.id); }}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="math-stats-bar">
        <span>SCORE: <strong>{score}</strong></span> &bull;
        <span>TIME: <strong className={timeLeft <= 10 ? 'red-time' : ''}>{timeLeft}s</strong></span> &bull;
        <span>STREAK: <strong className="streak-glow">{streak}🔥</strong></span> &bull;
        <span className="math-tier-badge" style={{ borderColor: currentTier.color, color: currentTier.color }}>
          LVL {currentTier.level} &bull; {currentTier.name} ({currentTier.mult}x)
        </span>
      </div>

      {levelUpBanner && (
        <div className="math-levelup-toast">
          ⚡ DIFFICULTY UP! LEVEL {levelUpBanner.level}: {levelUpBanner.name} &bull; {levelUpBanner.mult}x SCORE!
        </div>
      )}

      {gameState === 'START' && (
        <div className="math-start-screen">
          <h1 className="math-hero-title">SPEED MATH BLITZ</h1>
          <p className="math-subtitle">Solve rapid mental math equations in 60 seconds! Difficulty &amp; multipliers scale dynamically with every correct answer!</p>
          <button className="btn-primary math-big-start-btn" onClick={startGame}>
            START CHALLENGE 🚀
          </button>
        </div>
      )}

      {gameState === 'PLAYING' && question && (
        <div className="math-arena">
          <div className="math-equation-display">
            <span className="math-term">{question.a}</span>
            <span className="math-op">{question.symbol}</span>
            <span className="math-term">{question.b}</span>
            <span className="math-eq">=</span>
            <span className="math-unknown">?</span>
          </div>

          <div className="math-options-grid">
            {options.map((opt, idx) => {
              let optClass = '';
              if (isAnswered) {
                if (opt === question.answer) optClass = 'correct';
                else if (opt === selectedOption) optClass = 'wrong';
              }

              return (
                <button
                  key={idx}
                  className={`math-option-btn ${optClass}`}
                  onClick={() => handleSelectOption(opt)}
                >
                  <span className="opt-key-tag">[{idx + 1}]</span>
                  <span className="opt-num">{opt}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {gameState === 'GAMEOVER' && (
        <div className="math-gameover-screen">
          <h2>TIME'S UP! ⏰</h2>
          <div className="math-summary-card">
            <div className="summary-row"><span>FINAL SCORE:</span><strong>{score}</strong></div>
            <div className="summary-row"><span>QUESTIONS ANSWERED:</span><strong>{totalAnswered}</strong></div>
            <div className="summary-row">
              <span>TIER REACHED:</span>
              <strong style={{ color: currentTier.color }}>LVL {currentTier.level} ({currentTier.name})</strong>
            </div>
            <div className="summary-row">
              <span>ACCURACY:</span>
              <strong>{totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0}%</strong>
            </div>
          </div>
          <button className="btn-primary math-big-start-btn" onClick={startGame}>
            PLAY AGAIN ↺
          </button>
        </div>
      )}

      <p className="math-hint">
        Click an answer or press keys <strong>1, 2, 3, or 4</strong> on keyboard. Keep streak for bonus multipliers!
      </p>
    </div>
  );
};

export default MathQuizGame;
