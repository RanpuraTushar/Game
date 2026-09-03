import React, { useState, useEffect, useRef } from 'react';
import SoundEffects from '../../../utils/SoundEffects';
import { api } from '../../../services/api';
import './TypingTestGame.css';

const TEXT_PASSAGES = [
  "In the neon-drenched streets of the Cyber Arcade, hackers and coders duel in real-time. Speed and accuracy define the ultimate grandmaster.",
  "const matrix = new QuantumCore(); while (matrix.isOnline()) { optimizeThroughput(); dispatchCyberPackets(); }",
  "Artificial intelligence and neural algorithms process trillions of synaptic connections every single second to outsmart opponents.",
  "Clean code always looks like it was written by someone who cares. Simple functions, meaningful names, and zero technical debt lead to victory."
];

const TypingTestGame = ({ user, onLeave }) => {
  const [passageIndex, setPassageIndex] = useState(0);
  const [duration, setDuration] = useState(60); // 30 or 60 seconds
  const [timeLeft, setTimeLeft] = useState(60);
  const [userInput, setUserInput] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [errors, setErrors] = useState(0);
  const inputRef = useRef(null);

  const targetText = TEXT_PASSAGES[passageIndex];

  const resetTest = (newDuration = duration, newPassage = passageIndex) => {
    setUserInput('');
    setIsActive(false);
    setIsFinished(false);
    setTimeLeft(newDuration);
    setWpm(0);
    setAccuracy(100);
    setErrors(0);
    if (inputRef.current) inputRef.current.focus();
  };

  useEffect(() => {
    resetTest(duration, 0);
  }, []);

  // Timer Tick
  useEffect(() => {
    let interval;
    if (isActive && !isFinished && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            finishTest();
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, isFinished, timeLeft]);

  const finishTest = () => {
    setIsActive(false);
    setIsFinished(true);
    SoundEffects.playWin();

    // Final WPM calc
    const timeSpent = Math.max(1, duration - timeLeft);
    const words = userInput.trim().length / 5;
    const finalWpm = Math.round((words / timeSpent) * 60);
    api.submitScore('TYPING_TEST', finalWpm * 10, finalWpm >= 50, user);
  };

  const handleInputChange = (e) => {
    if (isFinished) return;
    const value = e.target.value;

    if (!isActive) {
      setIsActive(true);
    }

    setUserInput(value);
    SoundEffects.playClick();

    // Calculate accuracy and errors
    let errCount = 0;
    for (let i = 0; i < value.length; i++) {
      if (value[i] !== targetText[i]) {
        errCount++;
      }
    }
    setErrors(errCount);

    const acc = value.length > 0 ? Math.max(0, Math.round(((value.length - errCount) / value.length) * 100)) : 100;
    setAccuracy(acc);

    // Live WPM
    const timeElapsed = Math.max(1, duration - timeLeft);
    const wordCount = value.length / 5;
    const currentWpm = Math.round((wordCount / timeElapsed) * 60);
    setWpm(currentWpm);

    // Check complete passage
    if (value.length >= targetText.length) {
      finishTest();
    }
  };

  return (
    <div className="typing-master-container glass-panel" onClick={() => inputRef.current?.focus()}>
      <div className="typing-top-bar">
        <button className="btn-secondary" onClick={onLeave}>&larr; HUB</button>
        <div className="typing-duration-toggle">
          {[30, 60].map(d => (
            <button
              key={d}
              className={`mode-pill-btn ${duration === d ? 'active' : ''}`}
              onClick={(e) => { e.stopPropagation(); setDuration(d); resetTest(d); }}
            >
              {d}s TEST
            </button>
          ))}
          <button
            className="mode-pill-btn"
            onClick={(e) => {
              e.stopPropagation();
              const next = (passageIndex + 1) % TEXT_PASSAGES.length;
              setPassageIndex(next);
              resetTest(duration, next);
            }}
          >
            NEXT TEXT ⏭️
          </button>
        </div>
        <button className="btn-tertiary" onClick={(e) => { e.stopPropagation(); resetTest(); }}>↺ RESTART</button>
      </div>

      <div className="typing-stats-banner">
        <span>TIME: <strong className={timeLeft <= 10 ? 'red-time' : ''}>{timeLeft}s</strong></span> &bull;
        <span>WPM: <strong className="wpm-glow">{wpm}</strong></span> &bull;
        <span>ACCURACY: <strong>{accuracy}%</strong></span> &bull;
        <span>ERRORS: <strong className={errors > 0 ? 'bad-err' : ''}>{errors}</strong></span>
      </div>

      {/* Target Passage with Character Highlighting */}
      <div className="typing-passage-box">
        {targetText.split('').map((char, index) => {
          let charClass = 'char-pending';
          if (index < userInput.length) {
            charClass = userInput[index] === char ? 'char-correct' : 'char-wrong';
          } else if (index === userInput.length) {
            charClass = 'char-active-cursor';
          }

          return (
            <span key={index} className={`passage-char ${charClass}`}>
              {char}
            </span>
          );
        })}
      </div>

      {/* Hidden real input that captures focus */}
      <input
        ref={inputRef}
        type="text"
        className="hidden-typing-input"
        value={userInput}
        onChange={handleInputChange}
        autoFocus
      />

      {isFinished && (
        <div className="typing-results-modal">
          <h2>⚡ TEST COMPLETED! ⚡</h2>
          <div className="typing-score-grid">
            <div className="score-stat">
              <span className="stat-num">{wpm}</span>
              <span className="stat-label">WORDS / MIN</span>
            </div>
            <div className="score-stat">
              <span className="stat-num">{accuracy}%</span>
              <span className="stat-label">ACCURACY</span>
            </div>
            <div className="score-stat">
              <span className="stat-num">{userInput.length}</span>
              <span className="stat-label">CHARACTERS</span>
            </div>
          </div>
          <button className="btn-primary" onClick={() => resetTest()}>
            TRY AGAIN 🚀
          </button>
        </div>
      )}

      <p className="typing-hint">
        Click anywhere and start typing on your keyboard. Speed (WPM) and accuracy are evaluated live!
      </p>
    </div>
  );
};

export default TypingTestGame;
