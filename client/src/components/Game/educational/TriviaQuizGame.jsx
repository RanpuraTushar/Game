import React, { useState, useEffect, useRef } from 'react';
import soundFX from '../../../utils/SoundEffects';
import { api } from '../../../services/api';
import './TriviaQuizGame.css';

// Rich Question Bank across All Categories
const QUESTION_BANK = [
  // Bollywood & Cinema
  {
    category: 'BOLLYWOOD',
    question: 'In the iconic film "Sholay", what was the name of Gabbar Singh\'s famous dialogue partner?',
    options: ['Sambha', 'Kaalia', 'Soorma Bhopali', 'Thakur'],
    answer: 0
  },
  {
    category: 'BOLLYWOOD',
    question: 'Which Bollywood actor is known as the "King of Romance" and "Badshah of Bollywood"?',
    options: ['Salman Khan', 'Shah Rukh Khan', 'Aamir Khan', 'Akshay Kumar'],
    answer: 1
  },
  {
    category: 'BOLLYWOOD',
    question: 'In 3 Idiots, what was the real name of Phunsukh Wangdu portrayed by Aamir Khan?',
    options: ['Ranchhoddas Chhanchhad', 'Farhan Qureshi', 'Raju Rastogi', 'Chatur Ramalingam'],
    answer: 0
  },
  {
    category: 'BOLLYWOOD',
    question: 'Which movie featured the Oscar-winning song "Naatu Naatu"?',
    options: ['Baahubali 2', 'RRR', 'KGF Chapter 2', 'Pushpa'],
    answer: 1
  },

  // Sports & Cricket
  {
    category: 'SPORTS',
    question: 'Who is the only cricketer in history to score 100 international centuries?',
    options: ['Virat Kohli', 'Sachin Tendulkar', 'Ricky Ponting', 'Brian Lara'],
    answer: 1
  },
  {
    category: 'SPORTS',
    question: 'Which country won the FIFA World Cup in 2022 led by Lionel Messi?',
    options: ['France', 'Argentina', 'Brazil', 'Croatia'],
    answer: 1
  },
  {
    category: 'SPORTS',
    question: 'Who hit 6 sixes in an over against England in the 2007 T20 World Cup?',
    options: ['MS Dhoni', 'Yuvraj Singh', 'Rohit Sharma', 'Chris Gayle'],
    answer: 1
  },
  {
    category: 'SPORTS',
    question: 'How many players are on the field in a standard cricket team per side?',
    options: ['9', '10', '11', '12'],
    answer: 2
  },

  // General Knowledge & Science
  {
    category: 'GENERAL KNOWLEDGE',
    question: 'What is the capital city of France?',
    options: ['Rome', 'Berlin', 'Paris', 'Madrid'],
    answer: 2
  },
  {
    category: 'GENERAL KNOWLEDGE',
    question: 'Which planet in our solar system is known as the "Red Planet"?',
    options: ['Venus', 'Mars', 'Jupiter', 'Saturn'],
    answer: 1
  },
  {
    category: 'GENERAL KNOWLEDGE',
    question: 'What is the chemical symbol for Gold in the periodic table?',
    options: ['Ag', 'Au', 'Fe', 'Gd'],
    answer: 1
  },
  {
    category: 'GENERAL KNOWLEDGE',
    question: 'Which is the largest ocean on Earth?',
    options: ['Atlantic Ocean', 'Indian Ocean', 'Pacific Ocean', 'Arctic Ocean'],
    answer: 2
  },

  // Cyber & Tech
  {
    category: 'TECH & CYBER',
    question: 'Who co-founded Apple Inc. alongside Steve Wozniak and Ronald Wayne?',
    options: ['Steve Jobs', 'Bill Gates', 'Elon Musk', 'Mark Zuckerberg'],
    answer: 0
  },
  {
    category: 'TECH & CYBER',
    question: 'What does "HTTP" stand for in web addresses?',
    options: ['Hypertext Transfer Protocol', 'High Technology Transfer Power', 'Hyperlink Text Testing Process', 'Hardware Test Traffic Protocol'],
    answer: 0
  },
  {
    category: 'TECH & CYBER',
    question: 'Which programming language is predominantly used for building interactive web frontends alongside HTML and CSS?',
    options: ['Python', 'JavaScript', 'C++', 'Rust'],
    answer: 1
  }
];

export default function TriviaQuizGame({ user, onLeave }) {
  const [gameState, setGameState] = useState('MENU'); // MENU, PLAYING, ROUND_OVER, GAMEOVER
  const [gameMode, setGameMode] = useState('VS_BOTS'); // VS_BOTS (1P vs 3 Bots), PASS_N_PLAY (2-4 Players)
  const [numPlayers, setNumPlayers] = useState(4);

  // Players State
  const [players, setPlayers] = useState([
    { id: 0, name: 'Player 1', avatar: '😎', score: 0, buzzerKey: 'Q', isBot: false },
    { id: 1, name: 'Cyber Bot 1', avatar: '🤖', score: 0, buzzerKey: 'P', isBot: true },
    { id: 2, name: 'Neon Bot 2', avatar: '👾', score: 0, buzzerKey: 'Z', isBot: true },
    { id: 3, name: 'Pixel Bot 3', avatar: '🦾', score: 0, buzzerKey: 'M', isBot: true }
  ]);

  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [activeBuzzedPlayer, setActiveBuzzedPlayer] = useState(null);
  const [timeLeft, setTimeLeft] = useState(15);
  const [answerTimeLeft, setAnswerTimeLeft] = useState(5);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [shuffledQuestions, setShuffledQuestions] = useState([]);

  const timerRef = useRef(null);
  const answerTimerRef = useRef(null);

  const startQuiz = (mode, playerCount = 4) => {
    soundFX.playClick();
    setGameMode(mode);
    setNumPlayers(playerCount);

    const initialPlayers = [];
    if (mode === 'VS_BOTS') {
      initialPlayers.push({ id: 0, name: user?.username || 'You', avatar: '😎', score: 0, buzzerKey: 'SPACE / Q', isBot: false });
      initialPlayers.push({ id: 1, name: 'Cyber Bot', avatar: '🤖', score: 0, buzzerKey: 'P', isBot: true });
      initialPlayers.push({ id: 2, name: 'Quantum AI', avatar: '👾', score: 0, buzzerKey: 'Z', isBot: true });
      initialPlayers.push({ id: 3, name: 'Matrix AI', avatar: '🦾', score: 0, buzzerKey: 'M', isBot: true });
    } else {
      const keys = ['Q', 'P', 'Z', 'M'];
      const avatars = ['🦁', '🐯', '🦅', '🐺'];
      for (let i = 0; i < playerCount; i++) {
        initialPlayers.push({
          id: i,
          name: `Player ${i + 1}`,
          avatar: avatars[i],
          score: 0,
          buzzerKey: keys[i],
          isBot: false
        });
      }
    }
    setPlayers(initialPlayers.slice(0, playerCount));

    // Shuffle 10 questions
    const shuffled = [...QUESTION_BANK].sort(() => Math.random() - 0.5).slice(0, 10);
    setShuffledQuestions(shuffled);
    setCurrentQIndex(0);
    setGameState('PLAYING');
    loadQuestion(0, shuffled);
  };

  const loadQuestion = (idx, qList = shuffledQuestions) => {
    setActiveBuzzedPlayer(null);
    setSelectedOption(null);
    setIsAnswered(false);
    setTimeLeft(15);
    setAnswerTimeLeft(5);

    if (timerRef.current) clearInterval(timerRef.current);
    if (answerTimerRef.current) clearInterval(answerTimerRef.current);

    // 15s Countdown Timer
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          handleTimeExpired();
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    // AI Bots random buzz chance in VS_BOTS mode
    if (gameMode === 'VS_BOTS') {
      const botDelay = Math.floor(Math.random() * 6000) + 3500; // 3.5s - 9.5s
      setTimeout(() => {
        setPlayers(currentPlayers => {
          // If nobody buzzed yet
          if (!activeBuzzedPlayer && tRefActive.current) {
            const bots = currentPlayers.filter(p => p.isBot);
            const chosenBot = bots[Math.floor(Math.random() * bots.length)];
            if (chosenBot) handleBuzzer(chosenBot.id);
          }
          return currentPlayers;
        });
      }, botDelay);
    }
  };

  const tRefActive = useRef(true);

  // Buzzer trigger
  const handleBuzzer = (playerId) => {
    if (activeBuzzedPlayer !== null || isAnswered) return;

    soundFX.playBuzzer();
    setActiveBuzzedPlayer(playerId);
    clearInterval(timerRef.current);

    // 5s to submit answer
    setAnswerTimeLeft(5);
    answerTimerRef.current = setInterval(() => {
      setAnswerTimeLeft(t => {
        if (t <= 1) {
          clearInterval(answerTimerRef.current);
          handleAnswerOption(-1, playerId); // Wrong/Timeout
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    // If bot buzzed, auto pick answer after 1.5s
    const p = players.find(x => x.id === playerId);
    if (p && p.isBot) {
      setTimeout(() => {
        const curQ = shuffledQuestions[currentQIndex];
        const isBotCorrect = Math.random() < 0.7;
        const botPick = isBotCorrect ? curQ.answer : (curQ.answer + 1) % 4;
        handleAnswerOption(botPick, playerId);
      }, 1500);
    }
  };

  const handleAnswerOption = (optIdx, buzzedId = activeBuzzedPlayer) => {
    if (isAnswered) return;
    setIsAnswered(true);
    setSelectedOption(optIdx);
    if (answerTimerRef.current) clearInterval(answerTimerRef.current);

    const curQ = shuffledQuestions[currentQIndex];
    const isCorrect = optIdx === curQ.answer;

    if (isCorrect) {
      soundFX.playWinFanfare();
      const points = 100 + timeLeft * 10;
      setPlayers(prev => prev.map(p => p.id === buzzedId ? { ...p, score: p.score + points } : p));
    } else {
      soundFX.playLoss();
      setPlayers(prev => prev.map(p => p.id === buzzedId ? { ...p, score: Math.max(p.score - 50, 0) } : p));
    }

    // Next question after 2.5 seconds
    setTimeout(() => {
      if (currentQIndex + 1 < shuffledQuestions.length) {
        setCurrentQIndex(i => i + 1);
        loadQuestion(currentQIndex + 1);
      } else {
        finishQuiz();
      }
    }, 2500);
  };

  const handleTimeExpired = () => {
    soundFX.playLoss();
    setIsAnswered(true);
    setTimeout(() => {
      if (currentQIndex + 1 < shuffledQuestions.length) {
        setCurrentQIndex(i => i + 1);
        loadQuestion(currentQIndex + 1);
      } else {
        finishQuiz();
      }
    }, 2000);
  };

  const finishQuiz = () => {
    setGameState('GAMEOVER');
    soundFX.playWinFanfare();
    const sorted = [...players].sort((a, b) => b.score - a.score);
    const isWinner = sorted[0]?.id === 0;
    const humanScore = players.find(p => p.id === 0)?.score || sorted[0].score;
    if (user?.id) {
      api.submitScore('TRIVIA_QUIZ', humanScore, isWinner, user).catch(() => {});
    }
  };

  // Keyboard Buzzer listeners
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameState !== 'PLAYING') return;

      if (activeBuzzedPlayer === null) {
        // Anyone can buzz
        if (e.code === 'Space' || e.key.toUpperCase() === 'Q') handleBuzzer(0);
        if (e.key.toUpperCase() === 'P' && players[1]) handleBuzzer(1);
        if (e.key.toUpperCase() === 'Z' && players[2]) handleBuzzer(2);
        if (e.key.toUpperCase() === 'M' && players[3]) handleBuzzer(3);
      } else if (!isAnswered) {
        // Player who buzzed can select 1, 2, 3, 4
        if (['1', '2', '3', '4'].includes(e.key)) {
          const opt = parseInt(e.key, 10) - 1;
          handleAnswerOption(opt, activeBuzzedPlayer);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, activeBuzzedPlayer, isAnswered, players]);

  const curQ = shuffledQuestions[currentQIndex] || QUESTION_BANK[0];
  const buzzedPlayer = players.find(p => p.id === activeBuzzedPlayer);

  return (
    <div className="trivia-game-container">
      {/* Header */}
      <div className="trivia-header">
        <div className="trivia-title-group">
          <h2>🎤 CYBER TRIVIA QUIZ SHOW</h2>
          <p>Bollywood • Sports • General Knowledge • Tech</p>
        </div>

        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffd600' }}>
          QUESTION {currentQIndex + 1} / 10
        </div>
      </div>

      {/* Players Strip Podium */}
      <div className="trivia-players-strip">
        {players.map(p => (
          <div
            key={p.id}
            className={`player-podium-card ${activeBuzzedPlayer === p.id ? 'buzzed' : ''}`}
          >
            <span className="p-avatar">{p.avatar}</span>
            <span className="p-name">{p.name}</span>
            <span className="p-score">{p.score} PTS</span>
            <span className="p-buzzer-key">KEY: {p.buzzerKey}</span>
          </div>
        ))}
      </div>

      {/* Main Question Card */}
      <div className="trivia-main-card">
        {gameState === 'PLAYING' && (
          <>
            <div className="trivia-top-bar">
              <span className="category-tag">⭐ {curQ.category}</span>
              <div className="round-timer">
                ⏱️ {activeBuzzedPlayer !== null ? `${answerTimeLeft}s (ANSWER)` : `${timeLeft}s`}
              </div>
            </div>

            <div className="question-text-box">
              <span className="question-text">{curQ.question}</span>
            </div>

            {/* Answer Options Grid */}
            <div className="options-grid">
              {curQ.options.map((opt, idx) => {
                let btnClass = 'option-btn';
                if (isAnswered) {
                  if (idx === curQ.answer) btnClass += ' correct';
                  else if (idx === selectedOption) btnClass += ' wrong';
                }
                return (
                  <button
                    key={idx}
                    className={btnClass}
                    onClick={() => handleAnswerOption(idx, activeBuzzedPlayer)}
                    disabled={activeBuzzedPlayer === null || isAnswered || (buzzedPlayer && buzzedPlayer.isBot)}
                  >
                    <span style={{ color: '#00f3ff', fontWeight: 800 }}>[{idx + 1}]</span>
                    <span>{opt}</span>
                  </button>
                );
              })}
            </div>

            {/* Giant Buzzer Section */}
            <div className="buzzer-giant-section">
              <button
                className="giant-buzzer-btn"
                onClick={() => handleBuzzer(0)}
                disabled={activeBuzzedPlayer !== null || isAnswered}
              >
                {activeBuzzedPlayer === null ? 'BUZZ IN!' : `${buzzedPlayer?.name} BUZZED!`}
              </button>
              <span style={{ fontSize: '0.75rem', color: '#a0aec0', marginTop: 8 }}>
                Hit SPACE or your player key to buzz in!
              </span>
            </div>
          </>
        )}

        {/* Menu Overlay */}
        {gameState === 'MENU' && (
          <div className="platformer-overlay">
            <h1 className="overlay-title" style={{ color: '#ffd600' }}>CYBER TRIVIA SHOWDOWN</h1>
            <p className="overlay-sub">Buzz in fastest and answer Bollywood, Sports, GK, and Tech trivia!</p>

            <div className="mode-select-grid">
              <div className="mode-card" onClick={() => startQuiz('VS_BOTS', 4)}>
                <h4>🤖 SOLO VS 3 AI BOTS</h4>
                <p>Test your speed against smart bots</p>
              </div>
              <div className="mode-card" onClick={() => startQuiz('PASS_N_PLAY', 2)}>
                <h4>👥 2-PLAYER DUEL</h4>
                <p>P1 (Q) vs P2 (P) buzzer duel</p>
              </div>
              <div className="mode-card" onClick={() => startQuiz('PASS_N_PLAY', 4)}>
                <h4>🎉 4-PLAYER PARTY</h4>
                <p>Pass & Play 4-way keyboard clash</p>
              </div>
            </div>

            <div className="overlay-btn-group">
              <button className="btn-secondary" onClick={onLeave}>EXIT TO HUB</button>
            </div>
          </div>
        )}

        {/* Game Over Leaderboard */}
        {gameState === 'GAMEOVER' && (
          <div className="platformer-overlay">
            <h1 className="overlay-title" style={{ color: '#00ff66' }}>QUIZ COMPLETED! 🏆</h1>
            <p className="overlay-sub">Final Podium Standings:</p>

            <div style={{ width: '100%', maxWidth: 400, margin: '16px 0 24px' }}>
              {[...players].sort((a, b) => b.score - a.score).map((p, rank) => (
                <div key={p.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  background: rank === 0 ? 'rgba(0, 255, 102, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                  border: rank === 0 ? '1px solid #00ff66' : '1px solid rgba(255, 255, 255, 0.1)',
                  padding: '10px 16px', borderRadius: 8, marginBottom: 8
                }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <span style={{ fontWeight: 900, color: rank === 0 ? '#ffd600' : '#a0aec0' }}>
                      #{rank + 1}
                    </span>
                    <span>{p.avatar} {p.name}</span>
                  </div>
                  <span style={{ fontWeight: 800, color: '#00f3ff' }}>{p.score} PTS</span>
                </div>
              ))}
            </div>

            <div className="overlay-btn-group">
              <button className="btn-primary" onClick={() => startQuiz(gameMode, numPlayers)}>PLAY AGAIN 🔄</button>
              <button className="btn-secondary" onClick={onLeave}>EXIT TO HUB</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
