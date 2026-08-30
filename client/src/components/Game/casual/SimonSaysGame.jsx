import React, { useState, useEffect } from 'react';
import SoundEffects from '../../../utils/SoundEffects';
import { api } from '../../../services/api';
import './SimonSaysGame.css';

const PADS = [
  { id: 'GREEN', color: '#00e676', freq: 261.63, label: 'G' },  // C4
  { id: 'RED', color: '#ff3b30', freq: 329.63, label: 'R' },    // E4
  { id: 'YELLOW', color: '#ffea00', freq: 392.00, label: 'Y' }, // G4
  { id: 'BLUE', color: '#2979ff', freq: 523.25, label: 'B' }    // C5
];

const SimonSaysGame = ({ user, onLeave }) => {
  const [sequence, setSequence] = useState([]);
  const [playerStep, setPlayerStep] = useState(0);
  const [activePad, setActivePad] = useState(null);
  const [isPlayingSeq, setIsPlayingSeq] = useState(false);
  const [level, setLevel] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [unlockedBanner, setUnlockedBanner] = useState(null);

  // Play WebAudio harmonic tone
  const playTone = (freq) => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.35);
    } catch (e) {
      // Audio fallback
    }
  };

  const startNewGame = () => {
    const firstPad = PADS[Math.floor(Math.random() * 4)].id;
    const initialSeq = [firstPad];
    setSequence(initialSeq);
    setPlayerStep(0);
    setLevel(1);
    setGameOver(false);
    playSequence(initialSeq);
  };

  const playSequence = (seq) => {
    setIsPlayingSeq(true);
    let i = 0;
    const interval = setInterval(() => {
      if (i < seq.length) {
        const padId = seq[i];
        flashPad(padId);
        i++;
      } else {
        clearInterval(interval);
        setIsPlayingSeq(false);
        setPlayerStep(0);
      }
    }, 600);
  };

  const flashPad = (padId) => {
    const pad = PADS.find(p => p.id === padId);
    if (pad) playTone(pad.freq);
    setActivePad(padId);
    setTimeout(() => {
      setActivePad(null);
    }, 380);
  };

  const handlePadClick = async (padId) => {
    if (isPlayingSeq || gameOver || sequence.length === 0) return;

    flashPad(padId);

    // Check if correct step in sequence
    if (padId === sequence[playerStep]) {
      const nextStep = playerStep + 1;

      if (nextStep === sequence.length) {
        // Level Complete! Add next color
        SoundEffects.playSafe();
        const nextLevel = level + 1;
        setLevel(nextLevel);

        const nextPad = PADS[Math.floor(Math.random() * 4)].id;
        const nextSeq = [...sequence, nextPad];
        setSequence(nextSeq);

        setTimeout(() => {
          playSequence(nextSeq);
        }, 800);
      } else {
        setPlayerStep(nextStep);
      }
    } else {
      // Incorrect! Game Over
      setGameOver(true);
      SoundEffects.playLoss();

      const finalScore = (level - 1) * 15;
      const res = await api.submitScore('SIMON_SAYS', finalScore, false, user);
      if (res?.unlockedAchievements?.length > 0) {
        setUnlockedBanner(res.unlockedAchievements[0]);
      }
    }
  };

  return (
    <div className="simon-container glass-panel">
      <div className="simon-header">
        <button className="btn-secondary" onClick={onLeave}>&larr; LEAVE</button>
        <div className="simon-level-badge">
          <span>SEQUENCE LEVEL: </span>
          <strong style={{ color: '#ffd600', fontSize: '1.4rem' }}>{level}</strong>
        </div>
        <button className="btn-tertiary" onClick={startNewGame}>
          {sequence.length === 0 ? 'START' : 'RESTART'}
        </button>
      </div>

      {unlockedBanner && (
        <div className="achievement-toast">
          <span>🏆 UNLOCKED: <strong>{unlockedBanner.title}</strong> (+{unlockedBanner.points} pts)</span>
        </div>
      )}

      {/* 4 Simon Pads Circle */}
      <div className="simon-wheel">
        {PADS.map(pad => (
          <button
            key={pad.id}
            className={`simon-pad ${pad.id.toLowerCase()} ${activePad === pad.id ? 'active' : ''}`}
            onClick={() => handlePadClick(pad.id)}
            disabled={isPlayingSeq}
            style={{ '--pad-color': pad.color }}
          />
        ))}

        {/* Center Console Display */}
        <div className="simon-center-console" onClick={sequence.length === 0 ? startNewGame : undefined}>
          <div className="console-title">SIMON</div>
          <div className="console-status">
            {sequence.length === 0 ? 'CLICK TO START' : isPlayingSeq ? 'WATCHING...' : 'YOUR TURN'}
          </div>
        </div>
      </div>

      <p className="simon-hint">💡 Memorize and replicate the electronic harmonic sequence.</p>

      {gameOver && (
        <div className="finish-overlay">
          <h2 className="neon-text" style={{ color: '#ff0055' }}>SEQUENCE BROKEN</h2>
          <p style={{ color: '#fff', fontSize: '1.3rem', marginBottom: '15px' }}>
            Level Reached: <strong style={{ color: '#ffd600' }}>{level}</strong>
          </p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn-primary" onClick={startNewGame}>TRY AGAIN</button>
            <button className="btn-secondary" onClick={onLeave}>BACK TO HUB</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimonSaysGame;
