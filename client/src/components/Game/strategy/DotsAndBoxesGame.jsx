import React, { useState, useEffect } from 'react';
import SoundEffects from '../../../utils/SoundEffects';
import { api } from '../../../services/api';
import './DotsAndBoxesGame.css';

const GRID_DOTS = 4; // 4x4 dots = 3x3 boxes (9 boxes total)
const NUM_BOXES = (GRID_DOTS - 1) * (GRID_DOTS - 1); // 9

const DotsAndBoxesGame = ({ user, onLeave }) => {
  // Horizontal edges: 4 rows x 3 cols = 12
  const [hLines, setHLines] = useState(Array(GRID_DOTS * (GRID_DOTS - 1)).fill(null));
  // Vertical edges: 3 rows x 4 cols = 12
  const [vLines, setVLines] = useState(Array((GRID_DOTS - 1) * GRID_DOTS).fill(null));
  // Boxes: 3x3 = 9 ('PLAYER' or 'AI' or null)
  const [boxes, setBoxes] = useState(Array(NUM_BOXES).fill(null));
  const [turn, setTurn] = useState('PLAYER'); // 'PLAYER' or 'AI'
  const [playerScore, setPlayerScore] = useState(0);
  const [aiScore, setAiScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [unlockedBanner, setUnlockedBanner] = useState(null);

  useEffect(() => {
    startNewGame();
  }, []);

  const startNewGame = () => {
    setHLines(Array(GRID_DOTS * (GRID_DOTS - 1)).fill(null));
    setVLines(Array((GRID_DOTS - 1) * GRID_DOTS).fill(null));
    setBoxes(Array(NUM_BOXES).fill(null));
    setTurn('PLAYER');
    setPlayerScore(0);
    setAiScore(0);
    setGameOver(false);
  };

  const handleLineClick = (type, index) => {
    if (gameOver || turn !== 'PLAYER') return;
    if (type === 'H' && hLines[index] !== null) return;
    if (type === 'V' && vLines[index] !== null) return;

    makeMove(type, index, 'PLAYER');
  };

  const makeMove = (type, index, byWhom) => {
    let newH = [...hLines];
    let newV = [...vLines];

    if (type === 'H') newH[index] = byWhom;
    else newV[index] = byWhom;

    setHLines(newH);
    setVLines(newV);
    SoundEffects.playClick();

    // Check newly completed boxes
    const newBoxes = [...boxes];
    let boxesCompleted = 0;

    for (let r = 0; r < GRID_DOTS - 1; r++) {
      for (let c = 0; c < GRID_DOTS - 1; c++) {
        const boxIdx = r * (GRID_DOTS - 1) + c;
        if (newBoxes[boxIdx] === null) {
          const top = newH[r * (GRID_DOTS - 1) + c];
          const bottom = newH[(r + 1) * (GRID_DOTS - 1) + c];
          const left = newV[r * GRID_DOTS + c];
          const right = newV[r * GRID_DOTS + (c + 1)];

          if (top !== null && bottom !== null && left !== null && right !== null) {
            newBoxes[boxIdx] = byWhom;
            boxesCompleted++;
          }
        }
      }
    }

    if (boxesCompleted > 0) {
      setBoxes(newBoxes);
      SoundEffects.playSafe();

      if (byWhom === 'PLAYER') setPlayerScore(s => s + boxesCompleted);
      else setAiScore(s => s + boxesCompleted);

      // Check Game Over (all 9 boxes captured)
      const totalCaptured = newBoxes.filter(b => b !== null).length;
      if (totalCaptured === NUM_BOXES) {
        handleFinish(newBoxes, byWhom === 'PLAYER' ? playerScore + boxesCompleted : playerScore);
        return;
      }

      // Bonus Turn: keep turn
      if (byWhom === 'AI') {
        setTimeout(() => triggerAi(newH, newV, newBoxes), 500);
      }
    } else {
      // Switch Turn
      const nextTurn = byWhom === 'PLAYER' ? 'AI' : 'PLAYER';
      setTurn(nextTurn);

      if (nextTurn === 'AI') {
        setTimeout(() => triggerAi(newH, newV, newBoxes), 500);
      }
    }
  };

  const triggerAi = (currentH, currentV, currentBoxes) => {
    // 1. Look for any box with 3 sides filled to complete it!
    for (let r = 0; r < GRID_DOTS - 1; r++) {
      for (let c = 0; c < GRID_DOTS - 1; c++) {
        const boxIdx = r * (GRID_DOTS - 1) + c;
        if (currentBoxes[boxIdx] === null) {
          const topIdx = r * (GRID_DOTS - 1) + c;
          const bottomIdx = (r + 1) * (GRID_DOTS - 1) + c;
          const leftIdx = r * GRID_DOTS + c;
          const rightIdx = r * GRID_DOTS + (c + 1);

          const missing = [];
          if (currentH[topIdx] === null) missing.push({ type: 'H', idx: topIdx });
          if (currentH[bottomIdx] === null) missing.push({ type: 'H', idx: bottomIdx });
          if (currentV[leftIdx] === null) missing.push({ type: 'V', idx: leftIdx });
          if (currentV[rightIdx] === null) missing.push({ type: 'V', idx: rightIdx });

          if (missing.length === 1) {
            makeMove(missing[0].type, missing[0].idx, 'AI');
            return;
          }
        }
      }
    }

    // 2. Pick any available edge
    const available = [];
    currentH.forEach((v, i) => { if (v === null) available.push({ type: 'H', idx: i }); });
    currentV.forEach((v, i) => { if (v === null) available.push({ type: 'V', idx: i }); });

    if (available.length > 0) {
      const pick = available[Math.floor(Math.random() * available.length)];
      makeMove(pick.type, pick.idx, 'AI');
    }
  };

  const handleFinish = async (finalBoxes, finalPScore) => {
    setGameOver(true);
    const pScore = finalBoxes.filter(b => b === 'PLAYER').length;
    const aScore = finalBoxes.filter(b => b === 'AI').length;

    if (pScore > aScore) {
      SoundEffects.playWin();
      const res = await api.submitScore('DOTS_AND_BOXES', pScore * 30, true, user);
      if (res?.unlockedAchievements?.length > 0) setUnlockedBanner(res.unlockedAchievements[0]);
    } else {
      SoundEffects.playLoss();
      api.submitScore('DOTS_AND_BOXES', pScore * 10, false, user);
    }
  };

  return (
    <div className="dots-boxes-container glass-panel">
      <div className="db-header">
        <button className="btn-secondary" onClick={onLeave}>&larr; LEAVE</button>
        <div className="db-turn-indicator">
          TURN: <strong style={{ color: turn === 'PLAYER' ? '#00ff66' : '#ff0055' }}>{turn}</strong>
        </div>
        <div className="db-scores">
          <span style={{ color: '#00ff66' }}>YOU: <strong>{playerScore}</strong></span>
          <span style={{ color: '#ff0055' }}>AI: <strong>{aiScore}</strong></span>
        </div>
      </div>

      {unlockedBanner && (
        <div className="achievement-toast">
          <span>🏆 UNLOCKED: <strong>{unlockedBanner.title}</strong> (+{unlockedBanner.points} pts)</span>
        </div>
      )}

      {/* Interactive Dots & Boxes Matrix */}
      <div className="db-matrix-stage">
        {Array.from({ length: GRID_DOTS }).map((_, r) => (
          <React.Fragment key={`row-${r}`}>
            {/* Row of Dots and Horizontal Lines */}
            <div className="db-dots-row">
              {Array.from({ length: GRID_DOTS }).map((_, c) => (
                <React.Fragment key={`dot-${r}-${c}`}>
                  <div className="db-dot" />
                  {c < GRID_DOTS - 1 && (
                    <button
                      className={`db-hline ${hLines[r * (GRID_DOTS - 1) + c] ? `claimed-${hLines[r * (GRID_DOTS - 1) + c].toLowerCase()}` : ''}`}
                      onClick={() => handleLineClick('H', r * (GRID_DOTS - 1) + c)}
                      disabled={hLines[r * (GRID_DOTS - 1) + c] !== null || turn !== 'PLAYER'}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* Row of Vertical Lines and Boxes */}
            {r < GRID_DOTS - 1 && (
              <div className="db-vlines-row">
                {Array.from({ length: GRID_DOTS }).map((_, c) => (
                  <React.Fragment key={`vline-${r}-${c}`}>
                    <button
                      className={`db-vline ${vLines[r * GRID_DOTS + c] ? `claimed-${vLines[r * GRID_DOTS + c].toLowerCase()}` : ''}`}
                      onClick={() => handleLineClick('V', r * GRID_DOTS + c)}
                      disabled={vLines[r * GRID_DOTS + c] !== null || turn !== 'PLAYER'}
                    />
                    {c < GRID_DOTS - 1 && (
                      <div className={`db-box ${boxes[r * (GRID_DOTS - 1) + c] ? `box-${boxes[r * (GRID_DOTS - 1) + c].toLowerCase()}` : ''}`}>
                        {boxes[r * (GRID_DOTS - 1) + c] === 'PLAYER' ? '🟢' : boxes[r * (GRID_DOTS - 1) + c] === 'AI' ? '🔴' : ''}
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      {gameOver && (
        <div className="finish-overlay">
          <h2 className="neon-text" style={{ color: playerScore > aiScore ? '#00ff66' : '#ff3366' }}>
            {playerScore > aiScore ? '🏆 VICTORY!' : playerScore === aiScore ? 'DRAW MATCH!' : 'DEFEAT!'}
          </h2>
          <p style={{ color: '#fff', fontSize: '1.2rem', marginBottom: '15px' }}>
            You: {playerScore} Boxes | AI: {aiScore} Boxes
          </p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn-primary" onClick={startNewGame}>PLAY AGAIN</button>
            <button className="btn-secondary" onClick={onLeave}>BACK TO HUB</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DotsAndBoxesGame;
