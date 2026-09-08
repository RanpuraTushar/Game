import React, { useState, useEffect } from 'react';
import SoundEffects from '../../../utils/SoundEffects';
import { api } from '../../../services/api';
import './CodingPuzzleGame.css';

const CHALLENGES = [
  {
    id: 'FLEX_CENTER',
    title: '1. Perfect Flexbox Centering',
    language: 'CSS',
    description: 'Center the target cyber orb both horizontally and vertically inside the arena container.',
    starterCode: `.arena-box {\n  display: flex;\n  /* Add code below to center horizontally and vertically */\n  \n}`,
    testSolution: (code) => {
      const clean = code.toLowerCase().replace(/\s+/g, ' ');
      return clean.includes('justify-content: center') && clean.includes('align-items: center');
    },
    hint: 'Use `justify-content: center;` and `align-items: center;`'
  },
  {
    id: 'ARRAY_MAP',
    title: '2. Array Multiplier (JS)',
    language: 'JAVASCRIPT',
    description: 'Complete the function `doubleArray(arr)` so it returns a new array where every number is multiplied by 2.',
    starterCode: `function doubleArray(arr) {\n  // Complete function using arr.map()\n  \n}`,
    testSolution: (code) => {
      try {
        const fn = new Function(`${code}; return doubleArray([1, 2, 3, 4]);`);
        const res = fn();
        return Array.isArray(res) && res[0] === 2 && res[1] === 4 && res[2] === 6 && res[3] === 8;
      } catch (e) {
        return false;
      }
    },
    hint: 'Use `return arr.map(n => n * 2);`'
  },
  {
    id: 'PALINDROME',
    title: '3. Palindrome Checker (JS)',
    language: 'JAVASCRIPT',
    description: 'Write a function `isPalindrome(str)` that returns true if the string reads the same forwards and backwards.',
    starterCode: `function isPalindrome(str) {\n  // Return true if str is a palindrome, false otherwise\n  \n}`,
    testSolution: (code) => {
      try {
        const fn = new Function(`${code}; return [isPalindrome('racecar'), isPalindrome('cyber')];`);
        const res = fn();
        return res[0] === true && res[1] === false;
      } catch (e) {
        return false;
      }
    },
    hint: "Compare `str === str.split('').reverse().join('')`"
  },
  {
    id: 'NEON_BUTTON',
    title: '4. Glowing Cyber Neon (CSS)',
    language: 'CSS',
    description: 'Add a 15px glowing cyan box-shadow to the button.',
    starterCode: `.cyber-btn {\n  /* Add a 0 0 15px cyan (#00f3ff) glow */\n  \n}`,
    testSolution: (code) => {
      const clean = code.toLowerCase();
      return clean.includes('box-shadow:') && clean.includes('15px') && (clean.includes('#00f3ff') || clean.includes('cyan'));
    },
    hint: 'Use `box-shadow: 0 0 15px #00f3ff;`'
  }
];

const CodingPuzzleGame = ({ user, onLeave }) => {
  const [challengeIdx, setChallengeIdx] = useState(0);
  const [userCode, setUserCode] = useState('');
  const [testResult, setTestResult] = useState(null); // 'PASS' | 'FAIL'
  const [showHint, setShowHint] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);
  const [score, setScore] = useState(0);
  const [allFinished, setAllFinished] = useState(false);

  const currentChallenge = CHALLENGES[challengeIdx];

  useEffect(() => {
    setUserCode(currentChallenge.starterCode);
    setTestResult(null);
    setShowHint(false);
  }, [challengeIdx]);

  const runCodeTest = () => {
    SoundEffects.playClick();
    const passed = currentChallenge.testSolution(userCode);

    if (passed) {
      setTestResult('PASS');
      SoundEffects.playCapture();
      setScore(s => s + 150);
      setCompletedCount(c => Math.max(c, challengeIdx + 1));

      if (challengeIdx + 1 >= CHALLENGES.length) {
        setAllFinished(true);
        SoundEffects.playWin();
        api.submitScore('CODING_PUZZLE', 600, true, user);
      }
    } else {
      setTestResult('FAIL');
      SoundEffects.playLoss();
    }
  };

  const handleNext = () => {
    if (challengeIdx + 1 < CHALLENGES.length) {
      setChallengeIdx(i => i + 1);
    }
  };

  return (
    <div className="coder-master-container glass-panel">
      <div className="coder-top-bar">
        <button className="btn-secondary" onClick={onLeave}>&larr; HUB</button>
        <div className="coder-progress-badge">
          LEVEL {challengeIdx + 1} / {CHALLENGES.length} &bull; SCORE: <strong>{score}</strong>
        </div>
        <button
          className="btn-tertiary"
          onClick={() => setUserCode(currentChallenge.starterCode)}
        >
          ↺ RESET CODE
        </button>
      </div>

      {!allFinished ? (
        <div className="coder-workspace">
          {/* Challenge Description Card */}
          <div className="challenge-prompt-card">
            <div className="challenge-header">
              <span className="lang-tag">{currentChallenge.language}</span>
              <h3 className="challenge-title">{currentChallenge.title}</h3>
            </div>
            <p className="challenge-desc">{currentChallenge.description}</p>
          </div>

          {/* Interactive Code Editor */}
          <div className="code-editor-wrap">
            <div className="editor-top-decor">
              <span className="dot red" />
              <span className="dot yellow" />
              <span className="dot green" />
              <span className="editor-tab-name">challenge.{currentChallenge.language === 'CSS' ? 'css' : 'js'}</span>
            </div>
            <textarea
              className="code-textarea"
              value={userCode}
              onChange={(e) => setUserCode(e.target.value)}
              spellCheck="false"
              rows={8}
            />
          </div>

          {/* Action and Test Results */}
          <div className="coder-actions-bar">
            <button className="btn-tertiary hint-toggle-btn" onClick={() => setShowHint(!showHint)}>
              💡 {showHint ? 'HIDE HINT' : 'VIEW HINT'}
            </button>
            <button className="btn-primary run-test-btn" onClick={runCodeTest}>
              ▶ EXECUTE & TEST
            </button>
            {testResult === 'PASS' && challengeIdx + 1 < CHALLENGES.length && (
              <button className="btn-secondary next-task-btn" onClick={handleNext}>
                NEXT PUZZLE ➔
              </button>
            )}
          </div>

          {showHint && (
            <div className="coder-hint-banner">
              <strong>HINT:</strong> {currentChallenge.hint}
            </div>
          )}

          {testResult === 'PASS' && (
            <div className="test-alert-banner pass">
              <span>✅ <strong>ALL TESTS PASSED!</strong> Fantastic logic!</span>
            </div>
          )}

          {testResult === 'FAIL' && (
            <div className="test-alert-banner fail">
              <span>❌ <strong>TEST FAILED:</strong> Check your syntax or logic and try again.</span>
            </div>
          )}
        </div>
      ) : (
        <div className="coder-victory-modal">
          <h2>🏆 FULL-STACK GRANDMASTER! 🏆</h2>
          <p>You completed all {CHALLENGES.length} HTML, CSS, and JS challenges!</p>
          <p>Total Score: <strong>{score}</strong></p>
          <button
            className="btn-primary"
            onClick={() => { setChallengeIdx(0); setAllFinished(false); }}
          >
            START OVER ↺
          </button>
        </div>
      )}
    </div>
  );
};

export default CodingPuzzleGame;
