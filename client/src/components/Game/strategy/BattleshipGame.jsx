import React, { useState, useEffect } from 'react';
import SoundEffects from '../../../utils/SoundEffects';
import { api } from '../../../services/api';
import './BattleshipGame.css';

const GRID_SIZE = 10;
const SHIPS_CONFIG = [
  { name: 'Carrier', size: 5, icon: '🚢' },
  { name: 'Battleship', size: 4, icon: '🛳️' },
  { name: 'Cruiser', size: 3, icon: '🚤' },
  { name: 'Submarine', size: 3, icon: '⚓' },
  { name: 'Destroyer', size: 2, icon: '🛥️' }
];

const BattleshipGame = ({ user, onLeave }) => {
  const [phase, setPhase] = useState('DEPLOY'); // DEPLOY or BATTLE
  const [playerGrid, setPlayerGrid] = useState(Array(100).fill(null));
  const [enemyGrid, setEnemyGrid] = useState(Array(100).fill(null));
  const [enemyHits, setEnemyHits] = useState(Array(100).fill(null)); // 'HIT' or 'MISS'
  const [playerHits, setPlayerHits] = useState(Array(100).fill(null)); // 'HIT' or 'MISS'
  const [playerScore, setPlayerScore] = useState(0);
  const [turn, setTurn] = useState('PLAYER'); // PLAYER or AI
  const [gameResult, setGameResult] = useState(null);
  const [unlockedBanner, setUnlockedBanner] = useState(null);

  useEffect(() => {
    autoDeployPlayer();
    autoDeployEnemy();
  }, []);

  const placeShipsRandomly = () => {
    const grid = Array(100).fill(null);
    SHIPS_CONFIG.forEach(ship => {
      let placed = false;
      while (!placed) {
        const isHoriz = Math.random() < 0.5;
        const r = Math.floor(Math.random() * (isHoriz ? GRID_SIZE : GRID_SIZE - ship.size + 1));
        const c = Math.floor(Math.random() * (isHoriz ? GRID_SIZE - ship.size + 1 : GRID_SIZE));

        const indices = [];
        let canPlace = true;
        for (let i = 0; i < ship.size; i++) {
          const idx = isHoriz ? r * GRID_SIZE + (c + i) : (r + i) * GRID_SIZE + c;
          if (grid[idx] !== null) {
            canPlace = false;
            break;
          }
          indices.push(idx);
        }

        if (canPlace) {
          indices.forEach(idx => { grid[idx] = ship.name; });
          placed = true;
        }
      }
    });
    return grid;
  };

  const autoDeployPlayer = () => {
    setPlayerGrid(placeShipsRandomly());
    SoundEffects.playSafe();
  };

  const autoDeployEnemy = () => {
    setEnemyGrid(placeShipsRandomly());
  };

  const handleStartBattle = () => {
    setPhase('BATTLE');
    setPlayerHits(Array(100).fill(null));
    setEnemyHits(Array(100).fill(null));
    setTurn('PLAYER');
    setGameResult(null);
    SoundEffects.playClick();
  };

  const handleFireAtEnemy = async (idx) => {
    if (phase !== 'BATTLE' || turn !== 'PLAYER' || enemyHits[idx] !== null || gameResult) return;

    const isHit = enemyGrid[idx] !== null;
    const newEnemyHits = [...enemyHits];
    newEnemyHits[idx] = isHit ? 'HIT' : 'MISS';
    setEnemyHits(newEnemyHits);

    if (isHit) {
      SoundEffects.playSafe();
      setPlayerScore(s => s + 40);

      // Check if all enemy ships are sunk (Total segments = 17)
      const totalHits = newEnemyHits.filter(h => h === 'HIT').length;
      if (totalHits === 17) {
        setGameResult('VICTORY');
        SoundEffects.playWin();
        const res = await api.submitScore('BATTLESHIP', playerScore + 500, true, user);
        if (res?.unlockedAchievements?.length > 0) setUnlockedBanner(res.unlockedAchievements[0]);
        return;
      }
    } else {
      SoundEffects.playTokenStep();
    }

    // AI Turn
    setTurn('AI');
    setTimeout(() => {
      aiTurn();
    }, 600);
  };

  const aiTurn = () => {
    if (gameResult) return;

    // Pick unhit cell
    const unhit = [];
    playerHits.forEach((h, idx) => {
      if (h === null) unhit.push(idx);
    });

    if (unhit.length === 0) return;
    const targetIdx = unhit[Math.floor(Math.random() * unhit.length)];

    const isHit = playerGrid[targetIdx] !== null;
    const newPlayerHits = [...playerHits];
    newPlayerHits[targetIdx] = isHit ? 'HIT' : 'MISS';
    setPlayerHits(newPlayerHits);

    if (isHit) {
      SoundEffects.playLoss();
      const totalAiHits = newPlayerHits.filter(h => h === 'HIT').length;
      if (totalAiHits === 17) {
        setGameResult('DEFEAT');
        SoundEffects.playLoss();
        api.submitScore('BATTLESHIP', playerScore, false, user);
        return;
      }
    }

    setTurn('PLAYER');
  };

  return (
    <div className="battleship-container glass-panel">
      <div className="bs-header">
        <button className="btn-secondary" onClick={onLeave}>&larr; LEAVE</button>
        <div className="bs-status">
          {phase === 'DEPLOY' ? (
            <span style={{ color: '#00f3ff' }}>FLEET DEPLOYMENT</span>
          ) : (
            <span style={{ color: turn === 'PLAYER' ? '#00ff66' : '#ff3b30' }}>
              {turn === 'PLAYER' ? 'YOUR RADAR STRIKE' : 'ENEMY FIRING...'}
            </span>
          )}
        </div>
        {phase === 'DEPLOY' ? (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn-tertiary" onClick={autoDeployPlayer}>🔀 RESHUFFLE</button>
            <button className="btn-primary" onClick={handleStartBattle}>⚔️ ENGAGE</button>
          </div>
        ) : (
          <div className="bs-score-badge">SCORE: <strong>{playerScore}</strong></div>
        )}
      </div>

      {unlockedBanner && (
        <div className="achievement-toast">
          <span>🏆 UNLOCKED: <strong>{unlockedBanner.title}</strong> (+{unlockedBanner.points} pts)</span>
        </div>
      )}

      {/* Dual Radar Grids */}
      <div className="bs-dual-grids">
        {/* Enemy Radar (Primary Target Grid) */}
        <div className="radar-card">
          <div className="radar-label">ENEMY RADAR SECTOR</div>
          <div className="radar-grid">
            {enemyHits.map((hitState, idx) => {
              const isLocked = hitState !== null || phase !== 'BATTLE' || turn !== 'PLAYER';
              return (
                <button
                  key={idx}
                  className={`radar-cell target ${hitState ? hitState.toLowerCase() : ''}`}
                  disabled={isLocked}
                  onClick={() => handleFireAtEnemy(idx)}
                >
                  {hitState === 'HIT' ? '💥' : hitState === 'MISS' ? '💧' : ''}
                </button>
              );
            })}
          </div>
        </div>

        {/* Player Fleet Grid */}
        <div className="radar-card">
          <div className="radar-label">YOUR DEFENSE FLEET</div>
          <div className="radar-grid">
            {playerGrid.map((shipName, idx) => {
              const hitState = playerHits[idx];
              const hasShip = shipName !== null;
              return (
                <div
                  key={idx}
                  className={`radar-cell fleet ${hasShip ? 'has-ship' : ''} ${hitState ? hitState.toLowerCase() : ''}`}
                >
                  {hitState === 'HIT' ? '🔥' : hitState === 'MISS' ? '💧' : hasShip ? '🚢' : ''}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {gameResult && (
        <div className="finish-overlay">
          <h2 className="neon-text" style={{ color: gameResult === 'VICTORY' ? '#00ff66' : '#ff3366' }}>
            {gameResult === 'VICTORY' ? '🏆 ENEMY ARMADA DESTROYED!' : 'FLEET ANNIHILATED!'}
          </h2>
          <p style={{ color: '#fff', fontSize: '1.2rem', marginBottom: '15px' }}>
            Final Naval Score: {playerScore}
          </p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn-primary" onClick={() => { autoDeployPlayer(); autoDeployEnemy(); setPhase('DEPLOY'); setGameResult(null); }}>
              PLAY AGAIN
            </button>
            <button className="btn-secondary" onClick={onLeave}>BACK TO HUB</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BattleshipGame;
