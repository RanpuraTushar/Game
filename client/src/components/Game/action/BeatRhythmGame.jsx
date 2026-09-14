import React, { useState, useEffect, useRef } from 'react';
import soundFX from '../../../utils/SoundEffects';
import { api } from '../../../services/api';
import './BeatRhythmGame.css';

const CANVAS_WIDTH = 500;
const CANVAS_HEIGHT = 620;
const STRIKE_Y = 530;

const TRACKS = [
  { id: 'DESI_EDM', name: 'Desi Cyber Bhangra (Bollywood EDM)', bpm: 130, icon: '🪘', color: '#ff007f' },
  { id: 'CYBER_RAVE', name: 'Neon Electro Rave (Heavy Bass)', bpm: 140, icon: '⚡', color: '#00f3ff' },
  { id: 'SYNTH_80S', name: 'Tokyo Synthwave Drive (80s Retro)', bpm: 120, icon: '🌴', color: '#ffd600' }
];

const LANE_KEYS = ['D', 'F', 'J', 'K'];
const LANE_COLORS = ['#00f3ff', '#e040fb', '#ffd600', '#00ff66'];

export default function BeatRhythmGame({ user, onLeave }) {
  const canvasRef = useRef(null);
  const [gameState, setGameState] = useState('MENU'); // MENU, PLAYING, FINISHED
  const [selectedTrackIdx, setSelectedTrackIdx] = useState(0);
  const [difficulty, setDifficulty] = useState('NORMAL'); // NORMAL, HARD, INSANE

  // Stats
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [multiplier, setMultiplier] = useState(1);
  const [highScore, setHighScore] = useState(0);
  const [lastJudgment, setLastJudgment] = useState('');
  const [activeLaneKeys, setActiveLaneKeys] = useState([false, false, false, false]);

  const audioSynthRef = useRef({ ctx: null, timerId: null });

  // Engine state
  const engineRef = useRef({
    notes: [],
    particles: [],
    speed: 5.5,
    songDuration: 45000, // 45s
    startTime: 0,
    active: true
  });

  useEffect(() => {
    const saved = localStorage.getItem('rhythm_high_score');
    if (saved) setHighScore(parseInt(saved, 10));
    return () => stopAudioSynth();
  }, []);

  const startSong = (trackIdx = selectedTrackIdx, diff = difficulty) => {
    soundFX.playClick();
    setSelectedTrackIdx(trackIdx);
    setDifficulty(diff);
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setMultiplier(1);
    setLastJudgment('');

    let speedMult = 5.0;
    if (diff === 'HARD') speedMult = 7.0;
    if (diff === 'INSANE') speedMult = 9.0;

    engineRef.current = {
      notes: [],
      particles: [],
      speed: speedMult,
      songDuration: 45000,
      startTime: Date.now(),
      active: true
    };

    setGameState('PLAYING');
    startAudioSynth(TRACKS[trackIdx].bpm);
    generateSongNotes(TRACKS[trackIdx].bpm, diff);
  };

  const generateSongNotes = (bpm, diff) => {
    const intervalMs = (60000 / bpm) * (diff === 'INSANE' ? 0.5 : 1.0);
    let time = 800; // start 0.8s in
    const notes = [];

    while (time < 42000) {
      const lane = Math.floor(Math.random() * 4);
      notes.push({
        id: Math.random(),
        lane,
        spawnTime: time,
        hit: false,
        missed: false,
        y: -30
      });

      // Occasional double note on hard/insane
      if (diff !== 'NORMAL' && Math.random() < 0.35) {
        const lane2 = (lane + 2) % 4;
        notes.push({
          id: Math.random(),
          lane: lane2,
          spawnTime: time,
          hit: false,
          missed: false,
          y: -30
        });
      }

      time += intervalMs;
    }
    engineRef.current.notes = notes;
  };

  // Synthesized Web Audio Multi-Track Beat
  const startAudioSynth = (bpm) => {
    stopAudioSynth();
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
      audioSynthRef.current.ctx = ctx;

      const beatDuration = 60000 / bpm;
      let beatCount = 0;

      audioSynthRef.current.timerId = setInterval(() => {
        if (!engineRef.current.active) return;
        try {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          if (beatCount % 2 === 0) {
            // Kick bass
            osc.type = 'sine';
            osc.frequency.setValueAtTime(130, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(35, ctx.currentTime + 0.12);
            gain.gain.setValueAtTime(0.3, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
          } else {
            // Snare / clap
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(380, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.08);
            gain.gain.setValueAtTime(0.2, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
          }

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.14);

          beatCount++;
        } catch (e) {}
      }, beatDuration / 2);
    } catch (e) {}
  };

  const stopAudioSynth = () => {
    if (audioSynthRef.current.timerId) {
      clearInterval(audioSynthRef.current.timerId);
      audioSynthRef.current.timerId = null;
    }
  };

  // Hit Note Logic
  const handleLaneHit = (laneIdx) => {
    if (gameState !== 'PLAYING') return;

    // Visual press feedback
    setActiveLaneKeys(prev => {
      const copy = [...prev];
      copy[laneIdx] = true;
      return copy;
    });
    setTimeout(() => {
      setActiveLaneKeys(prev => {
        const copy = [...prev];
        copy[laneIdx] = false;
        return copy;
      });
    }, 120);

    const eng = engineRef.current;
    // Find closest unhit note in this lane
    const candidate = eng.notes.find(n => !n.hit && !n.missed && n.lane === laneIdx && Math.abs(n.y - STRIKE_Y) < 110);

    if (candidate) {
      const diff = Math.abs(candidate.y - STRIKE_Y);
      candidate.hit = true;

      let grade = 'GOOD';
      let pts = 100;
      if (diff < 32) {
        grade = 'PERFECT!!';
        pts = 300;
      } else if (diff < 65) {
        grade = 'GREAT!';
        pts = 200;
      }

      soundFX.playRhythmHit(grade.includes('PERFECT') ? 'PERFECT' : grade.includes('GREAT') ? 'GREAT' : 'GOOD');
      setLastJudgment(grade);

      // Particles
      createHitParticles((laneIdx + 0.5) * (CANVAS_WIDTH / 4), STRIKE_Y, LANE_COLORS[laneIdx], 18);

      // Update score and combo
      setCombo(c => {
        const next = c + 1;
        if (next > maxCombo) setMaxCombo(next);
        const mult = next >= 50 ? 8 : next >= 30 ? 4 : next >= 10 ? 2 : 1;
        setMultiplier(mult);
        setScore(s => s + pts * mult);
        return next;
      });
    }
  };

  const createHitParticles = (x, y, color, count) => {
    const eng = engineRef.current;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 7 + 2;
      eng.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        alpha: 1,
        color,
        size: Math.random() * 4 + 2
      });
    }
  };

  // Keyboard handlers (D, F, J, K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      const k = e.key.toUpperCase();
      if (k === 'D') handleLaneHit(0);
      if (k === 'F') handleLaneHit(1);
      if (k === 'J') handleLaneHit(2);
      if (k === 'K') handleLaneHit(3);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, score, combo]);

  // Main 60FPS Canvas Loop
  useEffect(() => {
    let animId;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const loop = () => {
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      const eng = engineRef.current;
      const laneW = CANVAS_WIDTH / 4;

      // 1. Draw 4 Lanes Background & Dividers
      ctx.fillStyle = '#060a14';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      for (let i = 0; i < 4; i++) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(i * laneW, 0);
        ctx.lineTo(i * laneW, CANVAS_HEIGHT);
        ctx.stroke();

        // Key labels at bottom
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.font = 'bold 18px Inter';
        ctx.textAlign = 'center';
        ctx.fillText(LANE_KEYS[i], (i + 0.5) * laneW, CANVAS_HEIGHT - 35);
      }

      // 2. Draw Audio Visualizer EQ Bars in Background
      const time = Date.now() * 0.005;
      for (let i = 0; i < 20; i++) {
        const barH = 40 + Math.sin(time + i * 0.4) * 35;
        ctx.fillStyle = 'rgba(0, 243, 255, 0.08)';
        ctx.fillRect(i * 25, 450 - barH, 20, barH);
      }

      // 3. Draw Strike Line at Y = STRIKE_Y
      ctx.strokeStyle = '#e040fb';
      ctx.lineWidth = 4;
      ctx.shadowColor = '#e040fb';
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.moveTo(0, STRIKE_Y);
      ctx.lineTo(CANVAS_WIDTH, STRIKE_Y);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Strike Target Circles
      for (let i = 0; i < 4; i++) {
        ctx.strokeStyle = LANE_COLORS[i];
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc((i + 0.5) * laneW, STRIKE_Y, 26, 0, Math.PI * 2);
        ctx.stroke();
      }

      // 4. Update and Draw Notes
      if (gameState === 'PLAYING') {
        const elapsed = Date.now() - eng.startTime;

        eng.notes.forEach(note => {
          if (!note.hit && !note.missed) {
            note.y = ((elapsed - note.spawnTime) / 1000) * (eng.speed * 60);

            // If note falls past strike line without hit
            if (note.y > STRIKE_Y + 70) {
              note.missed = true;
              setCombo(0);
              setMultiplier(1);
              setLastJudgment('MISS');
              soundFX.playRhythmHit('MISS');
            }

            // Draw Note Bar
            if (note.y > -20 && note.y < CANVAS_HEIGHT) {
              ctx.save();
              ctx.fillStyle = LANE_COLORS[note.lane];
              ctx.shadowColor = LANE_COLORS[note.lane];
              ctx.shadowBlur = 12;
              ctx.beginPath();
              ctx.roundRect((note.lane + 0.1) * laneW, note.y - 12, laneW * 0.8, 24, 8);
              ctx.fill();
              ctx.shadowBlur = 0;
              ctx.restore();
            }
          }
        });

        // Song end check
        if (elapsed > eng.songDuration) {
          eng.active = false;
          stopAudioSynth();
          soundFX.playWinFanfare();
          setGameState('FINISHED');
          if (score > highScore) {
            setHighScore(score);
            localStorage.setItem('rhythm_high_score', score.toString());
          }
          if (user?.id) {
            api.submitScore('BEAT_RHYTHM', score, true, user).catch(() => {});
          }
        }
      }

      // 5. Draw Hit Particles
      for (let i = eng.particles.length - 1; i >= 0; i--) {
        const p = eng.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.04;
        if (p.alpha <= 0) {
          eng.particles.splice(i, 1);
          continue;
        }
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1.0;

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [gameState, score]);

  const activeTrack = TRACKS[selectedTrackIdx];

  return (
    <div className="rhythm-game-container">
      {/* Header */}
      <div className="rhythm-header">
        <div className="rhythm-title-group">
          <h2>🎶 CYBER BEAT MANIA</h2>
          <p>{activeTrack.name} • {difficulty}</p>
        </div>

        <div className="rhythm-hud-stats">
          <div>
            <span style={{ fontSize: '0.7rem', color: '#a0aec0' }}>SCORE: </span>
            <strong style={{ fontSize: '1.2rem', color: '#00f3ff' }}>{score}</strong>
          </div>
          <div>
            <span style={{ fontSize: '0.7rem', color: '#a0aec0' }}>COMBO: </span>
            <strong style={{ fontSize: '1.2rem', color: '#ffd600' }}>{combo}x</strong>
          </div>
          <div>
            <span style={{ fontSize: '0.7rem', color: '#a0aec0' }}>MULTIPLIER: </span>
            <strong style={{ fontSize: '1.2rem', color: '#ff007f' }}>{multiplier}X</strong>
          </div>
        </div>
      </div>

      {/* Main Canvas View */}
      <div className="rhythm-canvas-wrapper">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="rhythm-canvas"
        />

        {/* Fever Mode Border */}
        {multiplier >= 4 && <div className="fever-border" />}

        {/* Floating Judgment Text */}
        {lastJudgment && (
          <div style={{
            position: 'absolute', top: 220, left: '50%', transform: 'translateX(-50%)',
            fontSize: '2rem', fontWeight: 900,
            color: lastJudgment.includes('PERFECT') ? '#ffd600' : lastJudgment.includes('GREAT') ? '#00f3ff' : lastJudgment === 'GOOD' ? '#00ff66' : '#e63946',
            textShadow: '0 0 15px currentColor'
          }}>
            {lastJudgment}
          </div>
        )}

        {/* Menu Overlay */}
        {gameState === 'MENU' && (
          <div className="platformer-overlay">
            <h1 className="overlay-title" style={{ color: '#e040fb' }}>CYBER BEAT RUSH</h1>
            <p className="overlay-sub">Press keys D, F, J, K in rhythm with the beat!</p>

            <div className="track-picker-grid" style={{ maxWidth: 450 }}>
              {TRACKS.map((t, idx) => (
                <div
                  key={t.id}
                  className={`track-card ${selectedTrackIdx === idx ? 'active' : ''}`}
                  onClick={() => setSelectedTrackIdx(idx)}
                >
                  <span className="track-icon">{t.icon}</span>
                  <h4>{t.name}</h4>
                  <span style={{ fontSize: '0.75rem', color: '#ffd600' }}>{t.bpm} BPM</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
              {['NORMAL', 'HARD', 'INSANE'].map(d => (
                <button
                  key={d}
                  className={`btn-${difficulty === d ? 'primary' : 'secondary'}`}
                  onClick={() => setDifficulty(d)}
                >
                  {d}
                </button>
              ))}
            </div>

            <div className="overlay-btn-group">
              <button className="btn-primary" onClick={() => startSong(selectedTrackIdx, difficulty)}>
                START TRACK 🎵
              </button>
              <button className="btn-secondary" onClick={onLeave}>EXIT TO HUB</button>
            </div>
          </div>
        )}

        {/* Finished Overlay */}
        {gameState === 'FINISHED' && (
          <div className="platformer-overlay">
            <h1 className="overlay-title" style={{ color: '#00ff66' }}>TRACK CLEARED! 🎶</h1>
            <p className="overlay-sub">You danced to the cyber synthwave rhythm!</p>

            <div className="overlay-stats">
              <div className="overlay-stat-box">
                <div className="val">{score}</div>
                <div className="lbl">FINAL SCORE</div>
              </div>
              <div className="overlay-stat-box">
                <div className="val">{maxCombo}</div>
                <div className="lbl">MAX COMBO</div>
              </div>
              <div className="overlay-stat-box">
                <div className="val">{highScore}</div>
                <div className="lbl">HIGH SCORE</div>
              </div>
            </div>

            <div className="overlay-btn-group">
              <button className="btn-primary" onClick={() => startSong(selectedTrackIdx, difficulty)}>PLAY AGAIN 🔄</button>
              <button className="btn-secondary" onClick={onLeave}>EXIT TO HUB</button>
            </div>
          </div>
        )}
      </div>

      {/* Desktop Keyboard Lane Monitor */}
      <div className="rhythm-desktop-key-monitor">
        <span className="rhythm-monitor-label">⌨️ KEYBOARD INPUT:</span>
        <div className="rhythm-key-caps">
          {LANE_KEYS.map((key, idx) => (
            <div
              key={key}
              className={`rhythm-key-cap ${activeLaneKeys[idx] ? 'pressed' : ''}`}
              style={{ '--lane-color': LANE_COLORS[idx] }}
            >
              <kbd>{key}</kbd>
              <span className="lane-lbl">LANE {idx + 1}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
