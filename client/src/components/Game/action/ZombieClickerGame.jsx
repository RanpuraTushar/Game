import React, { useState, useEffect, useRef } from 'react';
import SoundEffects from '../../../utils/SoundEffects';
import { api } from '../../../services/api';
import './ZombieClickerGame.css';

const UPGRADES_CONFIG = [
  { id: 'drone', name: 'Plasma Drone', baseCost: 15, dps: 1, icon: '🛸' },
  { id: 'sentry', name: 'Laser Sentry', baseCost: 100, dps: 5, icon: '🔫' },
  { id: 'emp', name: 'EMP Blaster', baseCost: 500, dps: 25, icon: '⚡' },
  { id: 'orbital', name: 'Orbital Strike', baseCost: 2500, dps: 120, icon: '🛰️' }
];

const ZombieClickerGame = ({ user, onLeave }) => {
  const [coins, setCoins] = useState(0);
  const [zombieLevel, setZombieLevel] = useState(1);
  const [zombieHp, setZombieHp] = useState(10);
  const [zombieMaxHp, setZombieMaxHp] = useState(10);
  const [kills, setKills] = useState(0);
  const [clickPower, setClickPower] = useState(1);
  const [upgrades, setUpgrades] = useState({ drone: 0, sentry: 0, emp: 0, orbital: 0 });
  const [floatingTexts, setFloatingTexts] = useState([]);
  const [isHit, setIsHit] = useState(false);
  const [unlockedBanner, setUnlockedBanner] = useState(null);

  const totalDps = UPGRADES_CONFIG.reduce((acc, u) => acc + (upgrades[u.id] || 0) * u.dps, 0);

  // Auto-DPS Interval
  useEffect(() => {
    const timer = setInterval(() => {
      if (totalDps > 0) {
        dealDamage(totalDps / 10, false);
      }
    }, 100);
    return () => clearInterval(timer);
  }, [totalDps, zombieHp, zombieLevel]);

  const dealDamage = (dmg, isManual = true) => {
    if (isManual) {
      setIsHit(true);
      setTimeout(() => setIsHit(false), 80);
      SoundEffects.playClick();

      // Spawn floating damage text
      const id = Date.now() + Math.random();
      setFloatingTexts(prev => [...prev, { id, text: `+${dmg}`, x: (Math.random() - 0.5) * 60 }]);
      setTimeout(() => {
        setFloatingTexts(prev => prev.filter(f => f.id !== id));
      }, 700);
    }

    setCoins(c => c + Math.max(1, Math.floor(dmg)));

    setZombieHp(prevHp => {
      const nextHp = prevHp - dmg;
      if (nextHp <= 0) {
        // Zombie Defeated!
        handleZombieKilled();
        const nextLvl = zombieLevel + 1;
        const newMaxHp = Math.floor(10 * Math.pow(1.35, nextLvl - 1));
        setZombieMaxHp(newMaxHp);
        return newMaxHp;
      }
      return nextHp;
    });
  };

  const handleZombieKilled = async () => {
    SoundEffects.playSafe();
    setKills(k => {
      const newKills = k + 1;
      if (newKills % 10 === 0) {
        api.submitScore('ZOMBIE_CLICKER', newKills * 100 + coins, true, user).then(res => {
          if (res?.unlockedAchievements?.length > 0) setUnlockedBanner(res.unlockedAchievements[0]);
        });
      }
      return newKills;
    });
  };

  const handleBuyUpgrade = (u) => {
    const count = upgrades[u.id] || 0;
    const cost = Math.floor(u.baseCost * Math.pow(1.18, count));
    if (coins >= cost) {
      setCoins(c => c - cost);
      setUpgrades(prev => ({ ...prev, [u.id]: count + 1 }));
      SoundEffects.playTokenStep();
    }
  };

  const handleUpgradeClickPower = () => {
    const cost = Math.floor(20 * Math.pow(1.5, clickPower - 1));
    if (coins >= cost) {
      setCoins(c => c - cost);
      setClickPower(cp => cp + 1);
      SoundEffects.playSafe();
    }
  };

  const clickPowerCost = Math.floor(20 * Math.pow(1.5, clickPower - 1));
  const hpPct = Math.max(0, Math.min(100, (zombieHp / zombieMaxHp) * 100));

  return (
    <div className="zombie-container glass-panel">
      <div className="zombie-header">
        <button className="btn-secondary" onClick={onLeave}>&larr; LEAVE</button>
        <div className="zombie-coins-box">
          <span>💰 COINS: <strong style={{ color: '#ffd600' }}>{coins}</strong></span>
          <span>DPS: <strong style={{ color: '#00f3ff' }}>{totalDps}</strong></span>
        </div>
        <div className="zombie-kills">
          KILLS: <strong style={{ color: '#ff3d00' }}>{kills}</strong>
        </div>
      </div>

      {unlockedBanner && (
        <div className="achievement-toast">
          <span>🏆 UNLOCKED: <strong>{unlockedBanner.title}</strong> (+{unlockedBanner.points} pts)</span>
        </div>
      )}

      {/* Main Battle Stage */}
      <div className="zombie-battle-arena">
        <div className="zombie-info-tag">
          <span>WAVE {zombieLevel} {zombieLevel % 5 === 0 ? '👑 BOSS' : 'CYBER ZOMBIE'}</span>
        </div>

        {/* Health Bar */}
        <div className="zombie-hp-bar">
          <div className="zombie-hp-fill" style={{ width: `${hpPct}%` }} />
          <span className="hp-text">{Math.ceil(zombieHp)} / {zombieMaxHp} HP</span>
        </div>

        {/* Zombie Click Target */}
        <div 
          className={`zombie-avatar ${isHit ? 'hit' : ''}`}
          onClick={() => dealDamage(clickPower, true)}
        >
          <span className="zombie-emoji">{zombieLevel % 5 === 0 ? '👹' : '🧟'}</span>

          {/* Floating Damage Text */}
          {floatingTexts.map(f => (
            <span key={f.id} className="floating-dmg" style={{ left: `calc(50% + ${f.x}px)` }}>
              {f.text}
            </span>
          ))}
        </div>
      </div>

      {/* Upgrades Store */}
      <div className="zombie-store-panel">
        <div className="store-header">ARSENAL UPGRADES</div>

        {/* Manual Click Upgrade */}
        <div className="store-card">
          <div className="store-card-info">
            <span className="store-icon">⚡</span>
            <div>
              <strong>Laser Strike Power</strong>
              <small>Click Power: +1 (Currently {clickPower})</small>
            </div>
          </div>
          <button
            className="buy-btn"
            disabled={coins < clickPowerCost}
            onClick={handleUpgradeClickPower}
          >
            {clickPowerCost} 💰
          </button>
        </div>

        {/* Auto DPS Upgrades */}
        {UPGRADES_CONFIG.map(u => {
          const count = upgrades[u.id] || 0;
          const cost = Math.floor(u.baseCost * Math.pow(1.18, count));

          return (
            <div key={u.id} className="store-card">
              <div className="store-card-info">
                <span className="store-icon">{u.icon}</span>
                <div>
                  <strong>{u.name} (x{count})</strong>
                  <small>+{u.dps} DPS each</small>
                </div>
              </div>
              <button
                className="buy-btn"
                disabled={coins < cost}
                onClick={() => handleBuyUpgrade(u)}
              >
                {cost} 💰
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ZombieClickerGame;
