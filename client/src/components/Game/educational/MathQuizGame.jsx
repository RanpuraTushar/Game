import React, { useState, useEffect } from 'react';
import SoundEffects from '../../../utils/SoundEffects';
import { api } from '../../../services/api';
import './MathQuizGame.css';

const MODES = [
  { id: 'MIXED', label: '🔀 ALL MIXED' },
  { id: 'ADD', label: '➕ ADDITION' },
  { id: 'SUB', label: '➖ SUBTRACTION' },
  { id: 'MUL', label: '✖️ MULTIPLY' }
];

const MathQuizGame = ({ user, onLeave }) => {
  const [mode, setMode] = useState('MIXED');
  const [question, setQuestion] = useState(null);
  const [options, setOptions] = useState([]);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [gameState, setGameState] = useState('START'); // 'START', 'PLAYING', 'GAMEOVER'
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);

  const generateQuestion = (currentMode = mode) => {
    let op = currentMode;
    if (op === 'MIXED') {
      const ops = ['ADD', 'SUB', 'MUL'];
      op = ops[Math.floor(Math.random() * ops.length)];
    }

    let a, b, answer, symbol;
    if (op === 'ADD') {
      a = Math.floor(Math.random() * 85) + 12;
      b = Math.floor(Math.random() * 85) + 8;
      answer = a + b;
      symbol = '+';
    } else if (op === 'SUB') {
      a = Math.floor(Math.random() * 90) + 20;
      b = Math.floor(Math.random() * a) + 5;
      answer = a - b;
      symbol = '-';
    } else {
      a = Math.floor(Math.random() * 12) + 3;
      b = Math.floor(Math.random() * 12) + 2;
      answer = a * b;
      symbol = '×';
    }

    // Generate 3 distractors
    const choices = new Set([answer]);
    while (choices.size < 4) {
      const offset = (Math.random() > 0.5 ? 1 : -1) * (Math.floor(Math.random() * 8) + 1);
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
    setStreak(0);
    setTimeLeft(60);
    setTotalAnswered(0);
    setCorrectCount(0);
    setGameState('PLAYING');
    generateQuestion(mode);
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
  }, [gameState, score]);

  const endGame = () => {
    setGameState('GAMEOVER');
    SoundEffects.playWin();
    api.submitScore('MATH_QUIZ', score, score >= 500, user);
  };

  const handleSelectOption = (choice) => {
    if (isAnswered || gameState !== 'PLAYING') return;
    setIsAnswered(true);
    setSelectedOption(choice);
    setTotalAnswered(t => t + 1);

    if (choice === question.answer) {
      // Correct
      const added = 50 + streak * 15;
      setScore(s => s + added);
      setStreak(st => st + 1);
      setCorrectCount(c => c + 1);
      SoundEffects.playCapture();
    } else {
      // Wrong
      setStreak(0);
      SoundEffects.playLoss();
    }

    setTimeout(() => {
      generateQuestion(mode);
    }, 450);
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
        <span>STREAK: <strong className="streak-glow">{streak}🔥</strong></span>
      </div>

      {gameState === 'START' && (
        <div className="math-start-screen">
          <h1 className="math-hero-title">SPEED MATH BLITZ</h1>
          <p className="math-subtitle">Solve as many mental math equations as possible in 60 seconds!</p>
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
