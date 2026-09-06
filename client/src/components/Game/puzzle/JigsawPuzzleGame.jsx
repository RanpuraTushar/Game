import React, { useState, useEffect, useRef } from 'react';
import soundFX from '../../../utils/SoundEffects';
import { api } from '../../../services/api';
import './JigsawPuzzleGame.css';

const ARTWORKS = [
  { id: 'METROPOLIS', name: 'Cyber Metropolis', icon: '🏙️', color1: '#00f3ff', color2: '#ff007f' },
  { id: 'DRAGON', name: 'Neon Dragon Mech', icon: '🐉', color1: '#00ff66', color2: '#ffd600' },
  { id: 'SYNTHWAVE', name: 'Synthwave Astronaut', icon: '👨‍🚀', color1: '#e040fb', color2: '#00f3ff' }
];

export default function JigsawPuzzleGame({ user, onLeave }) {
  const [gameState, setGameState] = useState('MENU'); // MENU, PLAYING, WON
  const [gridDim, setGridDim] = useState(3); // 3x3 (9 pcs), 4x4 (16 pcs)
  const [selectedArtIdx, setSelectedArtIdx] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [timer, setTimer] = useState(0);
  const [moves, setMoves] = useState(0);
  const [highScore, setHighScore] = useState(0);

  const [placedSlots, setPlacedSlots] = useState({}); // { slotIndex: pieceId }
  const [trayPieces, setTrayPieces] = useState([]); // [pieceId, ...]
  const [selectedPiece, setSelectedPiece] = useState(null);

  const timerRef = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem('jigsaw_high_score');
    if (saved) setHighScore(parseInt(saved, 10));
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startPuzzle = (dim = gridDim, artIdx = selectedArtIdx) => {
    soundFX.playClick();
    setGridDim(dim);
    setSelectedArtIdx(artIdx);
    setPlacedSlots({});
    setSelectedPiece(null);
    setMoves(0);
    setTimer(0);
    setShowHint(false);

    const totalPieces = dim * dim;
    const pieces = Array.from({ length: totalPieces }, (_, i) => i);
    // Shuffle pieces for tray
    const shuffled = [...pieces].sort(() => Math.random() - 0.5);
    setTrayPieces(shuffled);
    setGameState('PLAYING');

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimer(t => t + 1);
    }, 1000);
  };

  const handleSlotClick = (slotIdx) => {
    if (placedSlots[slotIdx] !== undefined) return; // already placed
    if (selectedPiece === null) return;

    soundFX.playTokenStep();
    setMoves(m => m + 1);

    // Check if piece matches this slot
    if (selectedPiece === slotIdx) {
      // Correct snap!
      soundFX.playSafe();
      const updated = { ...placedSlots, [slotIdx]: selectedPiece };
      setPlacedSlots(updated);
      setTrayPieces(prev => prev.filter(p => p !== selectedPiece));
      setSelectedPiece(null);

      // Check victory
      if (Object.keys(updated).length === gridDim * gridDim) {
        handleVictory();
      }
    } else {
      soundFX.playLoss();
      setSelectedPiece(null);
    }
  };

  const handleVictory = () => {
    clearInterval(timerRef.current);
    soundFX.playWinFanfare();
    setGameState('WON');
    const score = Math.max(1000 - timer * 5 - moves * 10, 100) * gridDim;
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('jigsaw_high_score', score.toString());
      if (user?.id) {
        api.submitScore(user.id, 'JIGSAW_PUZZLE', score).catch(() => {});
      }
    }
  };

  const currentArt = ARTWORKS[selectedArtIdx];
  const pieceSize = 480 / gridDim;

  return (
    <div className="jigsaw-game-container">
      {/* Header */}
      <div className="jigsaw-header">
        <div className="jigsaw-title-group">
          <h2>🧩 CYBER JIGSAW PUZZLE</h2>
          <p>{currentArt.name} • {gridDim}x{gridDim} ({gridDim * gridDim} Pieces)</p>
        </div>

        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <div style={{ fontSize: '0.9rem', color: '#a0aec0' }}>
            MOVES: <strong style={{ color: '#00f3ff' }}>{moves}</strong>
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffd600' }}>
            ⏱️ {timer}s
          </div>
        </div>
      </div>

      {/* Workspace */}
      <div className="jigsaw-workspace">
        {/* Puzzle Board Frame */}
        <div className="puzzle-board-frame">
          {/* Ghost Hint Background */}
          {showHint && (
            <div
              style={{
                position: 'absolute', inset: 0,
                background: `linear-gradient(135deg, ${currentArt.color1}, ${currentArt.color2})`,
                opacity: 0.35, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '6rem'
              }}
            >
              {currentArt.icon}
            </div>
          )}

          {/* Grid Slots */}
          <div
            className="board-slot-grid"
            style={{
              gridTemplateColumns: `repeat(${gridDim}, 1fr)`,
              gridTemplateRows: `repeat(${gridDim}, 1fr)`
            }}
          >
            {Array.from({ length: gridDim * gridDim }).map((_, slotIdx) => {
              const pieceId = placedSlots[slotIdx];
              const isFilled = pieceId !== undefined;
              const row = Math.floor(slotIdx / gridDim);
              const col = slotIdx % gridDim;

              return (
                <div
                  key={slotIdx}
                  className={`board-slot ${isFilled ? 'filled' : ''}`}
                  onClick={() => handleSlotClick(slotIdx)}
                >
                  {isFilled && (
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        background: `linear-gradient(135deg, ${currentArt.color1}, ${currentArt.color2})`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontWeight: 800,
                        fontSize: '1rem',
                        boxShadow: 'inset 0 0 8px rgba(0,0,0,0.4)'
                      }}
                    >
                      {currentArt.icon} #{pieceId + 1}
                    </div>
                  )}
                  {!isFilled && (
                    <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.2)' }}>
                      {slotIdx + 1}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Pieces Tray */}
        <div className="pieces-tray">
          <div className="tray-title">
            <span>PIECES TRAY ({trayPieces.length} REMAINING)</span>
            <button
              className="btn-secondary"
              style={{ padding: '2px 8px', fontSize: '0.75rem' }}
              onClick={() => setShowHint(!showHint)}
            >
              {showHint ? 'HIDE HINT 🙈' : 'SHOW HINT 👁️'}
            </button>
          </div>

          <div className="tray-grid">
            {trayPieces.map(pieceId => {
              const isSelected = selectedPiece === pieceId;
              return (
                <div
                  key={pieceId}
                  className={`puzzle-piece ${isSelected ? 'active' : ''}`}
                  style={{
                    width: pieceSize * 0.7,
                    height: pieceSize * 0.7,
                    background: `linear-gradient(135deg, ${currentArt.color1}, ${currentArt.color2})`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 8,
                    border: isSelected ? '2px solid #00f3ff' : '1px solid rgba(255,255,255,0.3)',
                    transform: isSelected ? 'scale(1.1)' : 'none',
                    color: '#fff',
                    fontWeight: 800,
                    fontSize: '0.8rem'
                  }}
                  onClick={() => {
                    soundFX.playClick();
                    setSelectedPiece(pieceId);
                  }}
                >
                  {currentArt.icon} #{pieceId + 1}
                </div>
              );
            })}
          </div>

          <div className="jigsaw-controls-bar">
            <button className="btn-secondary" onClick={onLeave}>EXIT TO HUB</button>
          </div>
        </div>
      </div>

      {/* Menu Overlay */}
      {gameState === 'MENU' && (
        <div className="platformer-overlay">
          <h1 className="overlay-title" style={{ color: '#00f3ff' }}>CYBER JIGSAW PUZZLE</h1>
          <p className="overlay-sub">Select difficulty and artwork to begin solving!</p>

          <div className="track-picker-grid">
            {ARTWORKS.map((art, idx) => (
              <div
                key={art.id}
                className={`track-card ${selectedArtIdx === idx ? 'active' : ''}`}
                onClick={() => setSelectedArtIdx(idx)}
              >
                <span className="track-icon">{art.icon}</span>
                <h4>{art.name}</h4>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            <button className={`btn-${gridDim === 3 ? 'primary' : 'secondary'}`} onClick={() => setGridDim(3)}>
              3x3 (9 PCS)
            </button>
            <button className={`btn-${gridDim === 4 ? 'primary' : 'secondary'}`} onClick={() => setGridDim(4)}>
              4x4 (16 PCS)
            </button>
          </div>

          <div className="overlay-btn-group">
            <button className="btn-primary" onClick={() => startPuzzle(gridDim, selectedArtIdx)}>
              START PUZZLE 🧩
            </button>
            <button className="btn-secondary" onClick={onLeave}>EXIT TO HUB</button>
          </div>
        </div>
      )}

      {/* Won Overlay */}
      {gameState === 'WON' && (
        <div className="platformer-overlay">
          <h1 className="overlay-title" style={{ color: '#00ff66' }}>PUZZLE COMPLETED! 🎉</h1>
          <p className="overlay-sub">You snapped all {gridDim * gridDim} pieces into place!</p>

          <div className="overlay-stats">
            <div className="overlay-stat-box">
              <div className="val">{timer}s</div>
              <div className="lbl">TIME ELAPSED</div>
            </div>
            <div className="overlay-stat-box">
              <div className="val">{moves}</div>
              <div className="lbl">TOTAL MOVES</div>
            </div>
            <div className="overlay-stat-box">
              <div className="val">{highScore}</div>
              <div className="lbl">HIGH SCORE</div>
            </div>
          </div>

          <div className="overlay-btn-group">
            <button className="btn-primary" onClick={() => startPuzzle(gridDim, selectedArtIdx)}>PLAY AGAIN 🔄</button>
            <button className="btn-secondary" onClick={onLeave}>EXIT TO HUB</button>
          </div>
        </div>
      )}
    </div>
  );
}
