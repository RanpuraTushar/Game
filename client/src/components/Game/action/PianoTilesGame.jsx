import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PIANO_KEYS_DATA, SONG_LIBRARY, PianoAudio } from './pianoAudio';
import SoundEffects from '../../../utils/SoundEffects';
import { api } from '../../../services/api';
import './PianoTilesGame.css';

const INSTRUMENTS = [
  { id: 'GRAND_PIANO', name: 'Acoustic Grand', icon: '🎹' },
  { id: 'ELECTRIC', name: 'Electric Rhodes', icon: '⚡' },
  { id: 'SYNTH', name: 'Cyber Synth', icon: '🎛️' }
];

const PianoTilesGame = ({ user, onLeave }) => {
  const [activeTab, setActiveTab] = useState('STUDIO'); // 'STUDIO' (Real Piano) or 'ARCADE' (Rhythm Rush)
  const [activeKeys, setActiveKeys] = useState(new Set());
  const [instrument, setInstrument] = useState('GRAND_PIANO');
  const [sustain, setSustain] = useState(true);
  
  // Studio & Song Guide State
  const [selectedSong, setSelectedSong] = useState(SONG_LIBRARY[0]);
  const [guideStep, setGuideStep] = useState(0);
  const [isSongPlaying, setIsSongPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedNotes, setRecordedNotes] = useState([]);
  
  // Arcade Rhythm Mode State
  const [arcadeScore, setArcadeScore] = useState(0);
  const [arcadeCombo, setArcadeCombo] = useState(0);
  const [arcadeRunning, setArcadeRunning] = useState(false);
  const [arcadeGameOver, setArcadeGameOver] = useState(false);
  const [fallingNotes, setFallingNotes] = useState([]);
  const [unlockedBanner, setUnlockedBanner] = useState(null);

  const autoPlayTimeoutRef = useRef(null);
  const arcadeAnimationRef = useRef(null);
  const arcadeStateRef = useRef({
    score: 0,
    combo: 0,
    notes: [],
    speed: 3.5,
    active: false,
    nextSpawnTime: 0
  });

  // Handle Note Trigger
  const triggerNote = useCallback((noteName, isUserAction = true) => {
    PianoAudio.playNote(noteName);

    // Visual Key Depress
    setActiveKeys(prev => {
      const next = new Set(prev);
      next.add(noteName);
      return next;
    });

    setTimeout(() => {
      setActiveKeys(prev => {
        const next = new Set(prev);
        next.delete(noteName);
        return next;
      });
    }, 220);

    // Recording handler
    if (isRecording && isUserAction) {
      setRecordedNotes(prev => [...prev, { note: noteName, time: Date.now() }]);
    }

    // Song Guide progression in Studio
    if (activeTab === 'STUDIO' && selectedSong && isUserAction) {
      const targetNote = selectedSong.notes[guideStep % selectedSong.notes.length];
      if (targetNote && targetNote.note === noteName) {
        setGuideStep(prev => prev + 1);
        if (guideStep + 1 >= selectedSong.notes.length) {
          SoundEffects.playWin();
          // Unlock achievement
          if (user && user.id) {
            api.unlockAchievement('PIANO_TILES_100').then(res => {
              if (res?.success) setUnlockedBanner('🏆 Master Pianist: Completed Song!');
            });
          }
        }
      }
    }

    // Arcade Mode Hit Detection
    if (activeTab === 'ARCADE' && arcadeStateRef.current.active && isUserAction) {
      handleArcadeKeyHit(noteName);
    }
  }, [activeTab, guideStep, isRecording, selectedSong, user]);

  // Handle Global PC Keyboard Events
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.repeat) return;
      
      if (e.code === 'Space') {
        e.preventDefault();
        setSustain(prev => {
          const next = !prev;
          PianoAudio.setSustain(next);
          return next;
        });
        return;
      }

      const keyMatch = PIANO_KEYS_DATA.find(k => k.key.toLowerCase() === e.key.toLowerCase());
      if (keyMatch) {
        triggerNote(keyMatch.note, true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (autoPlayTimeoutRef.current) clearTimeout(autoPlayTimeoutRef.current);
      if (arcadeAnimationRef.current) cancelAnimationFrame(arcadeAnimationRef.current);
    };
  }, [triggerNote]);

  // Update Instrument / Sustain settings
  useEffect(() => {
    PianoAudio.setInstrument(instrument);
  }, [instrument]);

  useEffect(() => {
    PianoAudio.setSustain(sustain);
  }, [sustain]);

  // Auto-Play Song Demo
  const handleToggleAutoPlay = () => {
    if (isSongPlaying) {
      if (autoPlayTimeoutRef.current) clearTimeout(autoPlayTimeoutRef.current);
      setIsSongPlaying(false);
      return;
    }

    setIsSongPlaying(true);
    let noteIndex = 0;

    const playNext = () => {
      if (noteIndex >= selectedSong.notes.length) {
        setIsSongPlaying(false);
        setGuideStep(0);
        return;
      }

      const current = selectedSong.notes[noteIndex];
      triggerNote(current.note, false);
      setGuideStep(noteIndex);
      noteIndex++;

      autoPlayTimeoutRef.current = setTimeout(playNext, current.duration);
    };

    playNext();
  };

  // Switch Selected Song
  const handleSelectSong = (song) => {
    if (autoPlayTimeoutRef.current) clearTimeout(autoPlayTimeoutRef.current);
    setIsSongPlaying(false);
    setSelectedSong(song);
    setGuideStep(0);
  };

  // ==========================================
  // ARCADE RHYTHM MODE LOGIC
  // ==========================================
  const startArcadeMode = () => {
    setArcadeScore(0);
    setArcadeCombo(0);
    setArcadeGameOver(false);
    setArcadeRunning(true);

    const s = arcadeStateRef.current;
    s.score = 0;
    s.combo = 0;
    s.notes = [];
    s.speed = 4;
    s.active = true;
    s.nextSpawnTime = 0;

    // Start Animation Loop
    let lastTime = performance.now();
    const loop = (currentTime) => {
      if (!s.active) return;
      const dt = currentTime - lastTime;
      lastTime = currentTime;

      // Spawn falling notes
      if (currentTime > s.nextSpawnTime) {
        // Pick random key from middle octave
        const middleKeys = PIANO_KEYS_DATA.filter(k => k.note.includes('4'));
        const randomKey = middleKeys[Math.floor(Math.random() * middleKeys.length)];

        s.notes.push({
          id: Date.now() + Math.random(),
          note: randomKey.note,
          y: -40,
          hit: false
        });

        s.nextSpawnTime = currentTime + Math.max(450, 950 - (s.score * 1.5));
      }

      // Move notes down
      s.notes.forEach(n => {
        n.y += (s.speed * (dt / 16.6));
      });

      // Check for missed note passing hit line
      const missed = s.notes.some(n => !n.hit && n.y > 420);
      if (missed) {
        handleArcadeGameOver();
        return;
      }

      // Filter off-screen notes
      s.notes = s.notes.filter(n => n.y < 460);
      setFallingNotes([...s.notes]);

      arcadeAnimationRef.current = requestAnimationFrame(loop);
    };

    arcadeAnimationRef.current = requestAnimationFrame(loop);
  };

  const handleArcadeKeyHit = (noteName) => {
    const s = arcadeStateRef.current;
    // Find closest unhit note with matching note
    const matchedNote = s.notes
      .filter(n => !n.hit && n.note === noteName && n.y >= 260 && n.y <= 410)
      .sort((a, b) => b.y - a.y)[0];

    if (matchedNote) {
      matchedNote.hit = true;
      s.combo++;
      const points = 10 * Math.min(5, Math.floor(s.combo / 5) + 1);
      s.score += points;
      s.speed = Math.min(9, 4 + Math.floor(s.score / 80) * 0.4);

      setArcadeScore(s.score);
      setArcadeCombo(s.combo);
      setFallingNotes([...s.notes]);
    }
  };

  const handleArcadeGameOver = async () => {
    const s = arcadeStateRef.current;
    s.active = false;
    if (arcadeAnimationRef.current) cancelAnimationFrame(arcadeAnimationRef.current);

    setArcadeRunning(false);
    setArcadeGameOver(true);
    SoundEffects.playLoss();

    const finalScore = s.score;
    const res = await api.submitScore('PIANO_TILES', finalScore, finalScore >= 100, user);
    if (res?.unlockedAchievements?.length > 0) setUnlockedBanner(res.unlockedAchievements[0]);
  };

  // Next Target Note in Guide
  const currentGuideNote = selectedSong?.notes[guideStep % selectedSong.notes.length]?.note;

  return (
    <div className="real-piano-nexus">
      {/* Achievement Banner */}
      {unlockedBanner && (
        <div className="piano-achievement-banner">
          <span>🏆 {typeof unlockedBanner === 'string' ? unlockedBanner : unlockedBanner.title}</span>
          <button onClick={() => setUnlockedBanner(null)}>✕</button>
        </div>
      )}

      {/* Top Header Controls */}
      <div className="piano-top-panel glass-panel">
        <div className="piano-title-group">
          <span className="piano-header-icon">🎹</span>
          <div>
            <h2 className="piano-main-title">ROYAL GRAND PIANO & STUDIO</h2>
            <div className="piano-subtitle">
              <span>{activeTab === 'STUDIO' ? 'Virtual Grand Acoustic Keyboard' : 'Arcade Rhythm Beat Rush'}</span>
              <span className="sustain-pill">{sustain ? 'PEDAL ON (Space)' : 'PEDAL OFF'}</span>
            </div>
          </div>
        </div>

        {/* Mode Switcher */}
        <div className="piano-tab-controls">
          <button 
            className={`piano-mode-tab ${activeTab === 'STUDIO' ? 'active' : ''}`}
            onClick={() => { setActiveTab('STUDIO'); }}
          >
            <span>🎼</span> Piano Studio
          </button>
          <button 
            className={`piano-mode-tab ${activeTab === 'ARCADE' ? 'active' : ''}`}
            onClick={() => { setActiveTab('ARCADE'); }}
          >
            <span>⚡</span> Arcade Rush
          </button>
          <button className="btn-secondary btn-exit-hub" onClick={onLeave}>
            ✕ Hub
          </button>
        </div>
      </div>

      {/* Main Mode View */}
      {activeTab === 'STUDIO' ? (
        /* ========================================================
           MODE 1: REAL GRAND PIANO STUDIO & SONG TUTORIAL
           ======================================================== */
        <div className="piano-studio-layout">
          {/* Studio Control Toolbar */}
          <div className="studio-toolbar glass-panel">
            {/* Instrument Selector */}
            <div className="toolbar-group">
              <span className="toolbar-label">INSTRUMENT</span>
              <div className="instrument-buttons">
                {INSTRUMENTS.map(inst => (
                  <button
                    key={inst.id}
                    className={`tool-pill ${instrument === inst.id ? 'active' : ''}`}
                    onClick={() => setInstrument(inst.id)}
                  >
                    <span>{inst.icon}</span> {inst.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Song Tutorial Selector */}
            <div className="toolbar-group">
              <span className="toolbar-label">SONG LESSON</span>
              <div className="song-selector-pills">
                {SONG_LIBRARY.map(song => (
                  <button
                    key={song.id}
                    className={`song-pill ${selectedSong?.id === song.id ? 'active' : ''}`}
                    onClick={() => handleSelectSong(song)}
                  >
                    <span>{song.icon}</span> {song.title.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* Song Player Controls */}
            <div className="toolbar-group song-actions">
              <button 
                className={`btn-auto-play ${isSongPlaying ? 'playing' : ''}`}
                onClick={handleToggleAutoPlay}
              >
                <span>{isSongPlaying ? '⏸️ Pause Demo' : '▶️ Listen Song'}</span>
              </button>
              <button 
                className={`btn-sustain-toggle ${sustain ? 'active' : ''}`}
                onClick={() => setSustain(!sustain)}
                title="Toggle Acoustic Sustain Pedal"
              >
                <span>🦶</span> Sustain: {sustain ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>

          {/* Song Guide Progress Bar */}
          {selectedSong && (
            <div className="song-guide-hud glass-panel">
              <div className="guide-song-info">
                <span className="guide-song-icon">{selectedSong.icon}</span>
                <div>
                  <strong>{selectedSong.title}</strong>
                  <div className="guide-note-hint">
                    Press the glowing key: <span className="target-key-badge">{currentGuideNote}</span>
                  </div>
                </div>
              </div>
              <div className="guide-progress-bar">
                <div 
                  className="guide-fill" 
                  style={{ width: `${Math.min(100, (guideStep / selectedSong.notes.length) * 100)}%` }} 
                />
              </div>
              <span className="guide-step-count">{guideStep}/{selectedSong.notes.length} Notes</span>
            </div>
          )}

          {/* ========================================================
             THE MASTER 3D REAL ACOUSTIC PIANO KEYBOARD (Ivory & Ebony)
             ======================================================== */}
          <div className="real-piano-casing">
            <div className="piano-wood-rim top-rim">
              <span className="brand-gold-emblem">CYBER ROYAL GRAND • MODEL 88</span>
            </div>

            <div className="piano-keys-bed">
              {PIANO_KEYS_DATA.map((keyInfo) => {
                const isWhite = keyInfo.type === 'white';
                const isPressed = activeKeys.has(keyInfo.note);
                const isGuideTarget = currentGuideNote === keyInfo.note;

                return (
                  <div
                    key={keyInfo.note}
                    className={`piano-key ${isWhite ? 'key-white' : 'key-black'} 
                      ${isPressed ? 'key-pressed' : ''} 
                      ${isGuideTarget ? 'key-guide-target' : ''}`}
                    onMouseDown={() => triggerNote(keyInfo.note, true)}
                    onTouchStart={(e) => { e.preventDefault(); triggerNote(keyInfo.note, true); }}
                  >
                    {/* Key Visual Label */}
                    <div className="key-labels-box">
                      <span className="key-note-name">{keyInfo.note}</span>
                      <span className="key-pc-shortcut">{keyInfo.label}</span>
                    </div>

                    {/* Guide Glow Indicator */}
                    {isGuideTarget && (
                      <div className="guide-pulse-dot" />
                    )}
                  </div>
                );
              })}
            </div>

            <div className="piano-wood-rim bottom-rim"></div>
          </div>

          <div className="piano-pc-guide-text">
            <span>💡 <strong>Keyboard Shortcuts:</strong> Press <strong>Q, W, E, R, T, Y, U, Z, X, C, V, B, N, M</strong> on your PC keyboard or click any key to play!</span>
          </div>
        </div>
      ) : (
        /* ========================================================
           MODE 2: ARCADE RHYTHM BEAT RUSH
           ======================================================== */
        <div className="piano-arcade-layout">
          {/* Arcade Score & Stats */}
          <div className="arcade-hud-stats glass-panel">
            <div className="hud-stat-box">
              <span className="stat-label">SCORE</span>
              <strong className="stat-value neon-cyan-text">{arcadeScore}</strong>
            </div>
            <div className="hud-stat-box">
              <span className="stat-label">COMBO STREAK</span>
              <strong className="stat-value neon-pink-text">{arcadeCombo}x</strong>
            </div>
            {!arcadeRunning && !arcadeGameOver && (
              <button className="btn-primary btn-start-arcade" onClick={startArcadeMode}>
                <span>▶️</span> START BEAT RUSH
              </button>
            )}
          </div>

          {/* Falling Beats Highway */}
          <div className="arcade-beats-stage">
            <div className="hit-timing-line">
              <span className="timing-label">HIT ZONE</span>
            </div>

            {/* Falling Note Blocks */}
            {fallingNotes.map(n => (
              <div
                key={n.id}
                className={`falling-note-block ${n.hit ? 'hit-pop' : ''}`}
                style={{
                  top: `${n.y}px`,
                  left: `${(PIANO_KEYS_DATA.findIndex(k => k.note === n.note) / PIANO_KEYS_DATA.length) * 100}%`
                }}
              >
                <span>{n.note}</span>
              </div>
            ))}
          </div>

          {/* Piano Keyboard at bottom of stage */}
          <div className="real-piano-casing arcade-piano-casing">
            <div className="piano-keys-bed">
              {PIANO_KEYS_DATA.map((keyInfo) => {
                const isWhite = keyInfo.type === 'white';
                const isPressed = activeKeys.has(keyInfo.note);

                return (
                  <div
                    key={keyInfo.note}
                    className={`piano-key ${isWhite ? 'key-white' : 'key-black'} ${isPressed ? 'key-pressed' : ''}`}
                    onMouseDown={() => triggerNote(keyInfo.note, true)}
                  >
                    <div className="key-labels-box">
                      <span className="key-note-name">{keyInfo.note}</span>
                      <span className="key-pc-shortcut">{keyInfo.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Game Over Modal */}
          {arcadeGameOver && (
            <div className="arcade-game-over-overlay">
              <div className="game-over-card glass-panel">
                <span className="game-over-icon">🎵</span>
                <h2 className="neon-text" style={{ color: '#ff3366' }}>OFF BEAT!</h2>
                <p className="game-over-msg">You missed a note on the piano!</p>
                <div className="game-over-score-badge">Final Score: {arcadeScore}</div>
                <div className="game-over-btns">
                  <button className="btn-primary" onClick={startArcadeMode}>
                    <span>🔄</span> TRY AGAIN
                  </button>
                  <button className="btn-secondary" onClick={() => setActiveTab('STUDIO')}>
                    <span>🎼</span> PIANO STUDIO
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PianoTilesGame;
