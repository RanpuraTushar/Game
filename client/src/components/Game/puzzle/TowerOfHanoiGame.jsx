import React, { useState, useEffect } from 'react';
import SoundEffects from '../../../utils/SoundEffects';
import { api } from '../../../services/api';
import './TowerOfHanoiGame.css';

const DISK_COLORS = [
  '#00f3ff', // Cyan (Disk 1 - Smallest)
  '#00e676', // Green (Disk 2)
  '#ffd600', // Yellow (Disk 3)
  '#ff9100', // Orange (Disk 4)
  '#e040fb', // Magenta (Disk 5)
  '#ff0055'  // Red (Disk 6 - Largest)
];

const TowerOfHanoiGame = ({ user, onLeave }) => {
  const [diskCount, setDiskCount] = useState(3);
  const [rods, setRods] = useState([[], [], []]);
  const [selectedRod, setSelectedRod] = useState(null);
  const [moves, setMoves] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  const [unlockedBanner, setUnlockedBanner] = useState(null);

  const minMoves = Math.pow(2, diskCount) - 1;

  useEffect(() => {
    initGame(diskCount);
  }, [diskCount]);

  const initGame = (count) => {
    const initialRodA = [];
    for (let i = count; i >= 1; i--) {
      initialRodA.push(i);
    }
    setRods([initialRodA, [], []]);
    setSelectedRod(null);
    setMoves(0);
    setGameWon(false);
  };

  const handleRodClick = async (rodIndex) => {
    if (gameWon) return;

    if (selectedRod === null) {
      // Pick up top disk from rod
      if (rods[rodIndex].length === 0) return;
      setSelectedRod(rodIndex);
      SoundEffects.playClick();
    } else {
      if (selectedRod === rodIndex) {
        // Deselect
        setSelectedRod(null);
        return;
      }

      // Attempt to move disk from selectedRod to target rodIndex
      const sourceRod = [...rods[selectedRod]];
      const targetRod = [...rods[rodIndex]];
      const diskToMove = sourceRod[sourceRod.length - 1];
      const topTargetDisk = targetRod[targetRod.length - 1];

      if (topTargetDisk && topTargetDisk < diskToMove) {
        // Invalid Move! (Cannot place larger disk on smaller disk)
        SoundEffects.playLoss();
        setSelectedRod(null);
        return;
      }

      // Valid Move
      sourceRod.pop();
      targetRod.push(diskToMove);

      const newRods = [...rods];
      newRods[selectedRod] = sourceRod;
      newRods[rodIndex] = targetRod;

      setRods(newRods);
      setSelectedRod(null);
      setMoves(m => m + 1);
      SoundEffects.playTokenStep();

      // Check Win (All disks transferred to Rod C / index 2)
      if (targetRod.length === diskCount && rodIndex === 2) {
        setGameWon(true);
        SoundEffects.playWin();
        const scoreGained = Math.max(50, 400 - (moves - minMoves) * 15);
        const res = await api.submitScore('TOWER_OF_HANOI', scoreGained, true, user);
        if (res?.unlockedAchievements?.length > 0) setUnlockedBanner(res.unlockedAchievements[0]);
      }
    }
  };

  return (
    <div className="hanoi-container glass-panel">
      <div className="hanoi-header">
        <button className="btn-secondary" onClick={onLeave}>&larr; LEAVE</button>
        <div className="hanoi-disks-selector">
          <span style={{ fontSize: '0.85rem', color: '#aaa' }}>DISKS:</span>
          {[3, 4, 5].map(cnt => (
            <button
              key={cnt}
              className={`hanoi-pill ${diskCount === cnt ? 'active' : ''}`}
              onClick={() => setDiskCount(cnt)}
            >
              {cnt}
            </button>
          ))}
        </div>
        <div className="hanoi-stats">
          <span>MOVES: <strong style={{ color: moves <= minMoves ? '#00ff66' : '#ffea00' }}>{moves}</strong></span>
          <span style={{ color: '#888' }}>(MIN: {minMoves})</span>
        </div>
      </div>

      {unlockedBanner && (
        <div className="achievement-toast">
          <span>🏆 UNLOCKED: <strong>{unlockedBanner.title}</strong> (+{unlockedBanner.points} pts)</span>
        </div>
      )}

      {/* 3 Rods Platform */}
      <div className="hanoi-stage">
        {rods.map((rod, rIdx) => {
          const isSelected = selectedRod === rIdx;
          return (
            <div
              key={rIdx}
              className={`hanoi-rod-column ${isSelected ? 'selected' : ''}`}
              onClick={() => handleRodClick(rIdx)}
            >
              <div className="hanoi-pole" />
              <div className="hanoi-disks-stack">
                {rod.map((diskVal, dIdx) => {
                  const isTopSelected = isSelected && dIdx === rod.length - 1;
                  const widthPct = 25 + (diskVal / diskCount) * 70;
                  const color = DISK_COLORS[diskVal - 1] || '#00f3ff';

                  return (
                    <div
                      key={dIdx}
                      className={`hanoi-disk ${isTopSelected ? 'lifted' : ''}`}
                      style={{
                        width: `${widthPct}%`,
                        backgroundColor: color,
                        boxShadow: `0 0 12px ${color}`
                      }}
                    >
                      {diskVal}
                    </div>
                  );
                })}
              </div>
              <div className="hanoi-base-plate">
                {['TOWER A', 'TOWER B', 'TARGET C'][rIdx]}
              </div>
            </div>
          );
        })}
      </div>

      <p className="hanoi-hint">💡 Click a tower to pick up the top disk, then click another tower to place it.</p>

      {gameWon && (
        <div className="finish-overlay">
          <h2 className="neon-text" style={{ color: '#00ff66' }}>🏆 TOWER COMPLETED!</h2>
          <p style={{ color: '#fff', fontSize: '1.2rem', marginBottom: '15px' }}>
            Solved in {moves} moves (Optimal: {minMoves})
          </p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn-primary" onClick={() => initGame(diskCount)}>PLAY AGAIN</button>
            <button className="btn-secondary" onClick={onLeave}>BACK TO HUB</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TowerOfHanoiGame;
