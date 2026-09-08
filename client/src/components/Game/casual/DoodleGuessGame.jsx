import React, { useState, useEffect, useRef } from 'react';
import soundFX from '../../../utils/SoundEffects';
import { api } from '../../../services/api';
import './DoodleGuessGame.css';

const WORDS_POOL = [
  'ROCKET', 'PIZZA', 'GUITAR', 'SUNFLOWER', 'HELICOPTER',
  'CASTLE', 'BUTTERFLY', 'BICYCLE', 'DIAMOND', 'FOOTBALL',
  'COMPUTER', 'UMBRELLA', 'ICE CREAM', 'CLOCK', 'AIRPLANE'
];

const COLORS = [
  '#000000', '#ff0055', '#00f3ff', '#00ff66', '#ffd600',
  '#e040fb', '#ff9900', '#0066ff', '#ffffff'
];

// Presets for animated computer drawing in Guesser mode
const DRAWING_PRESETS = {
  ROCKET: [
    { type: 'poly', pts: [[300, 100], [260, 260], [340, 260]] }, // nose cone & body
    { type: 'poly', pts: [[240, 260], [260, 220], [260, 260]] }, // left fin
    { type: 'poly', pts: [[360, 260], [340, 220], [340, 260]] }, // right fin
    { type: 'circle', x: 300, y: 180, r: 16 }, // window
    { type: 'poly', pts: [[280, 260], [300, 310], [320, 260]] }  // fire exhaust
  ],
  PIZZA: [
    { type: 'poly', pts: [[300, 100], [200, 300], [400, 300]] }, // slice triangle
    { type: 'circle', x: 280, y: 200, r: 10 }, // pepperoni 1
    { type: 'circle', x: 320, y: 230, r: 12 }, // pepperoni 2
    { type: 'circle', x: 270, y: 260, r: 9 },  // pepperoni 3
    { type: 'circle', x: 340, y: 270, r: 11 }  // pepperoni 4
  ],
  SUNFLOWER: [
    { type: 'circle', x: 300, y: 200, r: 35 }, // center
    { type: 'line', x1: 300, y1: 235, x2: 300, y2: 360 }, // stem
    { type: 'circle', x: 300, y: 140, r: 15 }, // top petal
    { type: 'circle', x: 300, y: 260, r: 15 }, // bottom petal
    { type: 'circle', x: 240, y: 200, r: 15 }, // left petal
    { type: 'circle', x: 360, y: 200, r: 15 }  // right petal
  ],
  CLOCK: [
    { type: 'circle', x: 300, y: 200, r: 60 },
    { type: 'circle', x: 300, y: 200, r: 5 },
    { type: 'line', x1: 300, y1: 200, x2: 300, y2: 155 },
    { type: 'line', x1: 300, y1: 200, x2: 335, y2: 200 }
  ],
  DIAMOND: [
    { type: 'poly', pts: [[240, 150], [360, 150], [390, 190], [300, 290], [210, 190]] },
    { type: 'poly', pts: [[240, 150], [270, 190], [300, 150], [330, 190], [360, 150]] }
  ],
  GUITAR: [
    { type: 'circle', x: 300, y: 260, r: 45 },
    { type: 'circle', x: 300, y: 190, r: 35 },
    { type: 'line', x1: 300, y1: 155, x2: 300, y2: 90 },
    { type: 'circle', x: 300, y: 225, r: 12 }
  ],
  CASTLE: [
    { type: 'poly', pts: [[220, 300], [220, 180], [250, 180], [250, 220], [350, 220], [350, 180], [380, 180], [380, 300]] },
    { type: 'poly', pts: [[280, 300], [280, 250], [320, 250], [320, 300]] }
  ]
};

export default function DoodleGuessGame({ user, onLeave }) {
  const canvasRef = useRef(null);
  const [gameState, setGameState] = useState('MENU'); // MENU, DRAWING, GUESSING, GAMEOVER
  const [currentWord, setCurrentWord] = useState('ROCKET');
  const [revealedWord, setRevealedWord] = useState('');
  const [activeColor, setActiveColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(5);
  const [timeLeft, setTimeLeft] = useState(60);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);

  // Chat messages
  const [messages, setMessages] = useState([]);
  const [inputGuess, setInputGuess] = useState('');
  const [isGuessed, setIsGuessed] = useState(false);

  // Drawing state
  const isDrawingRef = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0 });
  const timerRef = useRef(null);
  const animDrawRef = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem('doodle_high_score');
    if (saved) setHighScore(parseInt(saved, 10));
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animDrawRef.current) clearInterval(animDrawRef.current);
    };
  }, []);

  const startGame = (mode = 'DRAWER') => {
    soundFX.playClick();
    const presetKeys = Object.keys(DRAWING_PRESETS);
    const word = mode === 'DRAWER'
      ? WORDS_POOL[Math.floor(Math.random() * WORDS_POOL.length)]
      : presetKeys[Math.floor(Math.random() * presetKeys.length)];
    setCurrentWord(word);
    setIsGuessed(false);
    setMessages([
      { id: 1, sender: 'SYSTEM', text: `Game started! Mode: ${mode === 'DRAWER' ? 'You Draw, AI Guesses!' : 'Guess the drawing!'}`, type: 'system' }
    ]);
    setTimeLeft(60);
    setGameState(mode === 'DRAWER' ? 'DRAWING' : 'GUESSING');

    // Clear canvas
    clearCanvas();

    // Start timer
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          handleTimeUp();
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    if (mode === 'DRAWER') {
      // AI Bot periodic guessing simulation
      scheduleBotGuesses(word);
    } else {
      // AI Drawing animated paths on canvas
      startAnimatedDoodle(word);
      updateWordHint(word, 0);
    }
  };

  const scheduleBotGuesses = (secretWord) => {
    const funnyGuesses = ['A spaceship?', 'A pyramid?', 'Is it a kite?', 'A triangle?', 'Maybe a tower?'];
    let guessIdx = 0;

    const interval = setInterval(() => {
      if (guessIdx < funnyGuesses.length && !isGuessed) {
        addMessage('CyberBot_99', funnyGuesses[guessIdx]);
        guessIdx++;
      } else if (!isGuessed) {
        // Final correct guess by bot
        addMessage('CyberBot_99', secretWord, true);
        soundFX.playWinFanfare();
        setIsGuessed(true);
        setScore(s => s + timeLeft * 10);
        clearInterval(interval);
      }
    }, 8000);
  };

  const startAnimatedDoodle = (word) => {
    const presetKey = DRAWING_PRESETS[word] ? word : 'ROCKET';
    const shapes = DRAWING_PRESETS[presetKey];
    let step = 0;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    animDrawRef.current = setInterval(() => {
      if (step < shapes.length) {
        const sh = shapes[step];
        ctx.strokeStyle = '#000000';
        ctx.fillStyle = '#ff0055';
        ctx.lineWidth = 4;

        if (sh.type === 'poly') {
          ctx.beginPath();
          sh.pts.forEach((pt, i) => {
            if (i === 0) ctx.moveTo(pt[0], pt[1]);
            else ctx.lineTo(pt[0], pt[1]);
          });
          ctx.closePath();
          ctx.stroke();
        } else if (sh.type === 'circle') {
          ctx.beginPath();
          ctx.arc(sh.x, sh.y, sh.r, 0, Math.PI * 2);
          ctx.stroke();
        } else if (sh.type === 'line') {
          ctx.beginPath();
          ctx.moveTo(sh.x1, sh.y1);
          ctx.lineTo(sh.x2, sh.y2);
          ctx.stroke();
        }

        soundFX.playTokenStep();
        step++;
      } else {
        clearInterval(animDrawRef.current);
      }
    }, 1500);
  };

  const updateWordHint = (word, revealCount) => {
    let hint = '';
    for (let i = 0; i < word.length; i++) {
      if (word[i] === ' ') hint += '  ';
      else if (i < revealCount) hint += `${word[i]} `;
      else hint += '_ ';
    }
    setRevealedWord(hint.trim());
  };

  const handleTimeUp = () => {
    soundFX.playLoss();
    setGameState('GAMEOVER');
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  // Canvas drawing listeners
  const startDrawing = (e) => {
    if (gameState !== 'DRAWING') return;
    isDrawingRef.current = true;
    const pos = getCanvasPos(e);
    lastPosRef.current = pos;
  };

  const draw = (e) => {
    if (!isDrawingRef.current || gameState !== 'DRAWING') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const pos = getCanvasPos(e);

    ctx.strokeStyle = activeColor;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();

    lastPosRef.current = pos;
  };

  const stopDrawing = () => {
    isDrawingRef.current = false;
  };

  const getCanvasPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: ((clientX - rect.left) / rect.width) * canvas.width,
      y: ((clientY - rect.top) / rect.height) * canvas.height
    };
  };

  // Submit guess
  const handleGuessSubmit = (e) => {
    e.preventDefault();
    const guess = inputGuess.trim().toUpperCase();
    if (!guess) return;

    setInputGuess('');
    const isRight = guess === currentWord;
    addMessage(user?.username || 'You', guess, isRight);

    if (isRight && !isGuessed) {
      soundFX.playWinFanfare();
      setIsGuessed(true);
      const points = 200 + timeLeft * 5;
      const newScore = score + points;
      setScore(newScore);
      if (newScore > highScore) {
        setHighScore(newScore);
        localStorage.setItem('doodle_high_score', newScore.toString());
      }
      if (user?.id) {
        api.submitScore('DOODLE_GUESS', newScore, true, user).catch(() => {});
      }
      setTimeout(() => {
        setGameState('GAMEOVER');
      }, 1800);
    } else {
      soundFX.playSafe();
    }
  };

  const addMessage = (sender, text, isCorrect = false) => {
    setMessages(prev => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        sender,
        text: isCorrect ? `🎉 GUESSED THE WORD: ${text}!` : text,
        type: isCorrect ? 'correct' : 'user'
      }
    ]);
  };

  return (
    <div className="doodle-game-container">
      {/* Header */}
      <div className="doodle-header">
        <div className="doodle-title-group">
          <h2>🎲 CYBER DOODLE & GUESS</h2>
          <p>Pictionary Real-Time Drawing & Guessing</p>
        </div>

        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          {gameState === 'DRAWING' && (
            <div className="word-hint-box">
              WORD: {currentWord}
            </div>
          )}
          {gameState === 'GUESSING' && (
            <div className="word-hint-box">
              HINT: {revealedWord}
            </div>
          )}
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffd600' }}>
            ⏱️ {timeLeft}s
          </div>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="doodle-workspace">
        {/* Canvas & Drawing Tools */}
        <div className="doodle-canvas-area">
          {gameState === 'DRAWING' && (
            <div className="doodle-toolbar">
              <div className="color-palette">
                {COLORS.map(c => (
                  <span
                    key={c}
                    className={`color-swatch ${activeColor === c ? 'active' : ''}`}
                    style={{ background: c }}
                    onClick={() => setActiveColor(c)}
                  />
                ))}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: '0.75rem', color: '#a0aec0' }}>SIZE:</span>
                <input
                  type="range"
                  min="2"
                  max="28"
                  value={brushSize}
                  onChange={e => setBrushSize(parseInt(e.target.value, 10))}
                  style={{ width: 80 }}
                />
                <button className="btn-secondary" style={{ padding: '4px 10px', fontSize: '0.75rem' }} onClick={clearCanvas}>
                  CLEAR 🗑️
                </button>
              </div>
            </div>
          )}

          <canvas
            ref={canvasRef}
            width={600}
            height={420}
            className="doodle-canvas"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
        </div>

        {/* Real-time Guess Chat */}
        <div className="chat-panel">
          <div className="chat-header">
            <span>LIVE CHAT & GUESSES</span>
            <span>SCORE: {score}</span>
          </div>

          <div className="chat-messages">
            {messages.map(m => (
              <div key={m.id} className={`chat-msg ${m.type}`}>
                <span style={{ fontWeight: 800, color: m.type === 'correct' ? '#00ff66' : '#00f3ff' }}>
                  {m.sender}:{' '}
                </span>
                <span>{m.text}</span>
              </div>
            ))}
          </div>

          <form className="chat-input-bar" onSubmit={handleGuessSubmit}>
            <input
              type="text"
              className="chat-input"
              placeholder="Type your guess here..."
              value={inputGuess}
              onChange={e => setInputGuess(e.target.value)}
              disabled={gameState === 'MENU' || isGuessed}
            />
            <button type="submit" className="btn-primary" style={{ padding: '6px 12px' }} disabled={isGuessed}>
              GUESS 💬
            </button>
          </form>
        </div>
      </div>

      {/* Menu / Game Over Overlays */}
      {gameState === 'MENU' && (
        <div className="platformer-overlay">
          <h1 className="overlay-title" style={{ color: '#00f3ff' }}>CYBER DOODLE & GUESS</h1>
          <p className="overlay-sub">Draw secret prompts or guess what AI is sketching in real-time!</p>

          <div className="mode-select-grid">
            <div className="mode-card" onClick={() => startGame('DRAWER')}>
              <h4>🎨 I WANT TO DRAW</h4>
              <p>Draw on canvas, AI bots guess</p>
            </div>
            <div className="mode-card" onClick={() => startGame('GUESSER')}>
              <h4>🤖 I WANT TO GUESS</h4>
              <p>AI sketches, you type guesses</p>
            </div>
          </div>

          <div className="overlay-btn-group">
            <button className="btn-secondary" onClick={onLeave}>EXIT TO HUB</button>
          </div>
        </div>
      )}

      {gameState === 'GAMEOVER' && (
        <div className="platformer-overlay">
          <h1 className="overlay-title" style={{ color: isGuessed ? '#00ff66' : '#ff007f' }}>
            {isGuessed ? 'ROUND SOLVED! 🎉' : 'ROUND OVER! ⏰'}
          </h1>
          <p className="overlay-sub">The secret word was: <strong style={{ color: '#ffd600' }}>{currentWord}</strong></p>

          <div className="overlay-stats">
            <div className="overlay-stat-box">
              <div className="val">{score}</div>
              <div className="lbl">ROUND SCORE</div>
            </div>
            <div className="overlay-stat-box">
              <div className="val">{highScore}</div>
              <div className="lbl">HIGH SCORE</div>
            </div>
          </div>

          <div className="overlay-btn-group">
            <button className="btn-primary" onClick={() => startGame('DRAWER')}>PLAY AGAIN 🔄</button>
            <button className="btn-secondary" onClick={onLeave}>EXIT TO HUB</button>
          </div>
        </div>
      )}
    </div>
  );
}
