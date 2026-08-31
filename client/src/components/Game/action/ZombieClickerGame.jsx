import React, { useState, useEffect, useRef } from 'react';
import SoundEffects from '../../../utils/SoundEffects';
import { api } from '../../../services/api';
import './ZombieClickerGame.css';

const ZOMBIE_TYPES = [
  { name: 'Cyborg Stalker', color: '#00f3ff', glow: '#00f3ff', eyeColor: '#ff0055', icon: '🤖', bgGrad: 'linear-gradient(135deg, #0d1b2a, #1b263b)', baseDmgReduction: 0 },
  { name: 'Toxic Bio-Mutant', color: '#39ff14', glow: '#39ff14', eyeColor: '#ffff00', icon: '☣️', bgGrad: 'linear-gradient(135deg, #081c15, #1b4332)', baseDmgReduction: 0 },
  { name: 'Neon Flesh Ripper', color: '#ff007f', glow: '#ff007f', eyeColor: '#00f3ff', icon: '🧟', bgGrad: 'linear-gradient(135deg, #240046, #3c096c)', baseDmgReduction: 0 },
  { name: 'Plasma Ghoul', color: '#ffd600', glow: '#ffd600', eyeColor: '#ff0000', icon: '⚡', bgGrad: 'linear-gradient(135deg, #3d0066, #120024)', baseDmgReduction: 0 },
  { name: 'CYBER MECHA TITAN (BOSS)', color: '#ff0033', glow: '#ff0055', eyeColor: '#00f3ff', icon: '👹', isBoss: true, bgGrad: 'linear-gradient(135deg, #3a0007, #1a0003)' }
];

const WEAPONS_TIERS = [
  { minLevel: 1, name: 'Laser Scalpel', icon: '🗡️' },
  { minLevel: 5, name: 'Pulse Pistol', icon: '🔫' },
  { minLevel: 12, name: 'Plasma Rifle', icon: '⚡' },
  { minLevel: 25, name: 'Particle Cannon', icon: '💥' },
  { minLevel: 50, name: 'Anti-Matter Scythe', icon: '⚔️' }
];

const UPGRADES_CONFIG = [
  { id: 'drone', name: 'Nano Drone', baseCost: 15, dps: 1, icon: '🛸', desc: 'Auto-fires micro plasma bolts' },
  { id: 'sentry', name: 'Laser Sentry Turret', baseCost: 90, dps: 6, icon: '🤖', desc: 'Heavy dual-barrel rapid turret' },
  { id: 'emp', name: 'EMP Tesla Pylon', baseCost: 450, dps: 32, icon: '⚡', desc: 'Shocks target with continuous lightning' },
  { id: 'mech', name: 'Cyber Mech Pilot', baseCost: 2200, dps: 160, icon: '🦾', desc: 'Heavy armored combat android' },
  { id: 'orbital', name: 'Orbital Ion Cannon', baseCost: 10000, dps: 800, icon: '🛰️', desc: 'Deep space satellite superweapon' }
];

const ZombieClickerGame = ({ user, onLeave }) => {
  const [coins, setCoins] = useState(0);
  const [zombieLevel, setZombieLevel] = useState(1);
  const [zombieHp, setZombieHp] = useState(25);
  const [zombieMaxHp, setZombieMaxHp] = useState(25);
  const [kills, setKills] = useState(0);
  const [clickPower, setClickPower] = useState(1);
  const [upgrades, setUpgrades] = useState({ drone: 0, sentry: 0, emp: 0, mech: 0, orbital: 0 });
  const [floatingTexts, setFloatingTexts] = useState([]);
  const [isHit, setIsHit] = useState(false);
  const [screenShake, setScreenShake] = useState(false);
  const [unlockedBanner, setUnlockedBanner] = useState(null);
  const [combo, setCombo] = useState(0);
  const [laserBeams, setLaserBeams] = useState([]);

  // Active Tactical Skills
  const [overchargeActive, setOverchargeActive] = useState(false);
  const [overchargeCooldown, setOverchargeCooldown] = useState(0);
  const [nukeCooldown, setNukeCooldown] = useState(0);
  const [nukeFired, setNukeFired] = useState(false);

  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const comboTimerRef = useRef(null);
  const stateRef = useRef({
    zombieLevel: 1,
    zombieHp: 25,
    zombieMaxHp: 25,
    coins: 0,
    kills: 0,
    clickPower: 1,
    upgrades: { drone: 0, sentry: 0, emp: 0, mech: 0, orbital: 0 },
    overchargeActive: false
  });

  // Keep stateRef synced
  useEffect(() => {
    stateRef.current.zombieLevel = zombieLevel;
    stateRef.current.zombieHp = zombieHp;
    stateRef.current.zombieMaxHp = zombieMaxHp;
    stateRef.current.coins = coins;
    stateRef.current.kills = kills;
    stateRef.current.clickPower = clickPower;
    stateRef.current.upgrades = upgrades;
    stateRef.current.overchargeActive = overchargeActive;
  }, [zombieLevel, zombieHp, zombieMaxHp, coins, kills, clickPower, upgrades, overchargeActive]);

  const totalDps = UPGRADES_CONFIG.reduce((acc, u) => acc + (upgrades[u.id] || 0) * u.dps, 0);

  // Auto-DPS Interval Loop
  useEffect(() => {
    const timer = setInterval(() => {
      if (totalDps > 0) {
        dealDamage(totalDps / 10, false, false);
      }
    }, 100);
    return () => clearInterval(timer);
  }, [totalDps]);

  // Cooldown countdowns
  useEffect(() => {
    const cdTimer = setInterval(() => {
      setOverchargeCooldown(cd => Math.max(0, cd - 1));
      setNukeCooldown(cd => Math.max(0, cd - 1));
    }, 1000);
    return () => clearInterval(cdTimer);
  }, []);

  // Canvas FX loop (Sparks, blood, laser bolts)
  useEffect(() => {
    let animId;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const renderFX = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Render sparks & particles
      const particles = particlesRef.current;
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.035;
        p.size *= 0.96;

        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 10;
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(1, p.size), 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1.0;

        if (p.alpha <= 0 || p.size <= 0.5) {
          particles.splice(i, 1);
        }
      }

      animId = requestAnimationFrame(renderFX);
    };

    animId = requestAnimationFrame(renderFX);
    return () => cancelAnimationFrame(animId);
  }, []);

  const triggerSparks = (x, y, color = '#00f3ff', count = 12) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 6;
      particlesRef.current.push({
        x: x || 150,
        y: y || 130,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: Math.random() > 0.5 ? color : '#ffd600',
        size: 3 + Math.random() * 4,
        alpha: 1.0
      });
    }
  };

  const dealDamage = (dmg, isManual = true, isCrit = false) => {
    const isBoss = zombieLevel % 5 === 0;
    const actualDmg = isManual && overchargeActive ? dmg * 2.5 : dmg;

    if (isManual) {
      setIsHit(true);
      setTimeout(() => setIsHit(false), 90);
      try {
        SoundEffects.playClick();
      } catch (e) {}

      // Combo System
      setCombo(c => {
        const nextCombo = c + 1;
        if (comboTimerRef.current) clearTimeout(comboTimerRef.current);
        comboTimerRef.current = setTimeout(() => setCombo(0), 1200);
        return nextCombo;
      });

      // Random Sparks
      triggerSparks(150 + (Math.random() - 0.5) * 80, 140 + (Math.random() - 0.5) * 60, isBoss ? '#ff0033' : '#00f3ff');

      // Floating text
      const id = Date.now() + Math.random();
      const text = isCrit ? `CRIT! +${Math.round(actualDmg)}` : `+${Math.round(actualDmg)}`;
      setFloatingTexts(prev => [...prev.slice(-15), { id, text, isCrit, x: (Math.random() - 0.5) * 110, y: (Math.random() - 0.5) * 40 }]);
      setTimeout(() => {
        setFloatingTexts(prev => prev.filter(f => f.id !== id));
      }, 700);
    }

    const earnedCoins = Math.max(1, Math.floor(actualDmg * (isBoss ? 1.5 : 1)));
    setCoins(c => c + earnedCoins);

    setZombieHp(prevHp => {
      const nextHp = prevHp - actualDmg;
      if (nextHp <= 0) {
        handleZombieKilled();
        const nextLvl = zombieLevel + 1;
        const isNextBoss = nextLvl % 5 === 0;
        const newMaxHp = isNextBoss 
          ? Math.floor(25 * Math.pow(1.42, nextLvl - 1) * 2.2)
          : Math.floor(25 * Math.pow(1.38, nextLvl - 1));
        setZombieMaxHp(newMaxHp);
        return newMaxHp;
      }
      return nextHp;
    });
  };

  const handleZombieKilled = () => {
    try {
      SoundEffects.playWin();
    } catch (e) {}

    setScreenShake(true);
    setTimeout(() => setScreenShake(false), 200);

    triggerSparks(150, 130, '#ffd600', 30);

    setKills(k => {
      const newKills = k + 1;
      setZombieLevel(lvl => lvl + 1);

      if (newKills % 5 === 0) {
        api.submitScore('ZOMBIE_CLICKER', newKills * 120 + coins, true, user).then(res => {
          if (res?.unlockedAchievements?.length > 0) setUnlockedBanner(res.unlockedAchievements[0]);
        });
      }
      return newKills;
    });
  };

  const handleManualClick = (e) => {
    const isCrit = Math.random() < 0.15; // 15% Crit chance
    const multiplier = isCrit ? 2.5 : 1.0;
    const comboBonus = 1 + Math.min(2.0, combo * 0.05);
    const finalDmg = Math.max(1, Math.round(clickPower * multiplier * comboBonus));
    dealDamage(finalDmg, true, isCrit);
  };

  const handleBuyUpgrade = (u) => {
    const count = upgrades[u.id] || 0;
    const cost = Math.floor(u.baseCost * Math.pow(1.18, count));
    if (coins >= cost) {
      setCoins(c => c - cost);
      setUpgrades(prev => ({ ...prev, [u.id]: count + 1 }));
      try {
        SoundEffects.playSafe();
      } catch (e) {}
    }
  };

  const handleUpgradeClickPower = () => {
    const cost = Math.floor(20 * Math.pow(1.45, clickPower - 1));
    if (coins >= cost) {
      setCoins(c => c - cost);
      setClickPower(cp => cp + 1);
      try {
        SoundEffects.playSafe();
      } catch (e) {}
    }
  };

  // Skill 1: Overcharge
  const triggerOvercharge = () => {
    if (overchargeCooldown > 0) return;
    setOverchargeActive(true);
    setOverchargeCooldown(30);
    try {
      SoundEffects.playDiceRoll();
    } catch (e) {}
    setTimeout(() => setOverchargeActive(false), 10000);
  };

  // Skill 2: Orbital Nuke
  const triggerOrbitalNuke = () => {
    if (nukeCooldown > 0) return;
    setNukeFired(true);
    setNukeCooldown(45);
    setScreenShake(true);
    try {
      SoundEffects.playCapture();
    } catch (e) {}

    const nukeDamage = Math.max(50, Math.floor(zombieMaxHp * 0.45));
    dealDamage(nukeDamage, true, true);
    triggerSparks(150, 130, '#ff007f', 40);

    setTimeout(() => {
      setNukeFired(false);
      setScreenShake(false);
    }, 600);
  };

  const currentWeapon = [...WEAPONS_TIERS].reverse().find(w => clickPower >= w.minLevel) || WEAPONS_TIERS[0];
  const currentZombieType = ZOMBIE_TYPES[(zombieLevel - 1) % ZOMBIE_TYPES.length];
  const isCurrentBoss = zombieLevel % 5 === 0;
  const clickPowerCost = Math.floor(20 * Math.pow(1.45, clickPower - 1));
  const hpPct = Math.max(0, Math.min(100, (zombieHp / zombieMaxHp) * 100));

  return (
    <div className="zombie-clicker-wrapper">
      {/* Top Cyber HUD Bar */}
      <div className="zombie-nav-bar glass-panel">
        <button className="btn-tertiary" onClick={onLeave}>
          ← EXIT TO HUB
        </button>

        <div className="hud-stats-grid">
          <div className="hud-stat-box">
            <span className="hud-stat-label">CREDITS</span>
            <span className="hud-stat-val gold-neon">🪙 {coins.toLocaleString()}</span>
          </div>
          <div className="hud-stat-box">
            <span className="hud-stat-label">TOTAL DPS</span>
            <span className="hud-stat-val cyan-neon">⚡ {totalDps.toLocaleString()} /s</span>
          </div>
          <div className="hud-stat-box">
            <span className="hud-stat-label">DESTROYED</span>
            <span className="hud-stat-val red-neon">💀 {kills}</span>
          </div>
          <div className="hud-stat-box">
            <span className="hud-stat-label">COMBO</span>
            <span className="hud-stat-val purple-neon">🔥 x{(1 + Math.min(2.0, combo * 0.05)).toFixed(1)}</span>
          </div>
        </div>
      </div>

      {unlockedBanner && (
        <div className="achievement-popup glass-panel">
          <span>🏆 ACHIEVEMENT UNLOCKED: <strong>{unlockedBanner.title}</strong> (+{unlockedBanner.points} pts)</span>
        </div>
      )}

      {/* Main Two-Column War Station */}
      <div className="zombie-battle-station">
        {/* Left Column: Battle Arena & Combat Zone */}
        <div className={`battle-arena-panel glass-panel ${screenShake ? 'screen-shake' : ''}`}>
          {/* Wave & Target Status */}
          <div className="target-header-box">
            <div className="wave-badge" style={{ borderColor: isCurrentBoss ? '#ff0033' : '#00f3ff' }}>
              {isCurrentBoss ? '⚠️ LEVEL ' + zombieLevel + ' MEGA BOSS ⚠️' : 'WAVE ' + zombieLevel + ' INVASION'}
            </div>
            <h2 className="target-name" style={{ color: isCurrentBoss ? '#ff0055' : '#00f3ff' }}>
              {isCurrentBoss ? '🔥 DREAD MECHA OVERLORD 🔥' : currentZombieType.name}
            </h2>
          </div>

          {/* Health Bar with Laser Shield Glow */}
          <div className="target-hp-container">
            <div className="hp-bar-outer">
              <div 
                className={`hp-bar-inner ${isCurrentBoss ? 'boss-hp' : ''}`}
                style={{ width: `${hpPct}%` }}
              />
              <span className="hp-bar-text">
                {Math.ceil(zombieHp).toLocaleString()} / {zombieMaxHp.toLocaleString()} HP ({hpPct.toFixed(0)}%)
              </span>
            </div>
          </div>

          {/* Monster Avatar Target with Canvas Particle FX */}
          <div className="interactive-avatar-stage" onClick={handleManualClick}>
            <canvas ref={canvasRef} width={300} height={260} className="sparks-canvas" />

            {nukeFired && <div className="orbital-nuke-beam" />}

            {/* Glowing Monster Visual */}
            <div 
              className={`cyber-monster-core ${isHit ? 'monster-hit' : ''} ${isCurrentBoss ? 'is-boss-pulse' : ''}`}
              style={{ background: currentZombieType.bgGrad }}
            >
              <div className="monster-scanner-ring" />
              <div className="monster-emoji-layer">
                {isCurrentBoss ? '👹' : (zombieLevel % 4 === 1 ? '🧟' : zombieLevel % 4 === 2 ? '🤖' : zombieLevel % 4 === 3 ? '☣️' : '👽')}
              </div>
              <div className="cyber-eye left-eye" style={{ background: currentZombieType.eyeColor, boxShadow: `0 0 10px ${currentZombieType.eyeColor}` }} />
              <div className="cyber-eye right-eye" style={{ background: currentZombieType.eyeColor, boxShadow: `0 0 10px ${currentZombieType.eyeColor}` }} />
            </div>

            {/* Floating Damage Splashes */}
            {floatingTexts.map(f => (
              <span 
                key={f.id} 
                className={`floating-dmg-tag ${f.isCrit ? 'is-crit-text' : ''}`}
                style={{ transform: `translate(${f.x}px, ${f.y}px)` }}
              >
                {f.text}
              </span>
            ))}
          </div>

          {/* Tactical Strike Abilities Bar */}
          <div className="tactical-skills-bar">
            <button 
              className={`skill-btn overcharge-btn ${overchargeActive ? 'skill-active' : ''}`}
              disabled={overchargeCooldown > 0}
              onClick={triggerOvercharge}
            >
              <span className="skill-icon">⚡</span>
              <div className="skill-meta">
                <strong>OVERCHARGE (2.5x TAP)</strong>
                <small>{overchargeActive ? 'ACTIVE! 🔥' : overchargeCooldown > 0 ? `CD: ${overchargeCooldown}s` : 'READY TO FIRE'}</small>
              </div>
            </button>

            <button 
              className="skill-btn nuke-btn"
              disabled={nukeCooldown > 0}
              onClick={triggerOrbitalNuke}
            >
              <span className="skill-icon">🛰️</span>
              <div className="skill-meta">
                <strong>ORBITAL LASER NUKE</strong>
                <small>{nukeCooldown > 0 ? `CD: ${nukeCooldown}s` : 'INSTANT 45% DMG'}</small>
              </div>
            </button>
          </div>
        </div>

        {/* Right Column: High-Tech Cyber Arsenal Shop */}
        <div className="arsenal-shop-panel glass-panel">
          <div className="shop-title-bar">
            <h3>⚡ CYBER ARSENAL & AUTOMATION</h3>
            <span className="shop-weapon-badge">{currentWeapon.icon} {currentWeapon.name}</span>
          </div>

          <div className="shop-scroll-area">
            {/* Primary Weapon Upgrade */}
            <div className="arsenal-item-card primary-card">
              <div className="item-icon-box">
                <span className="item-emoji">{currentWeapon.icon}</span>
              </div>
              <div className="item-details">
                <div className="item-name-row">
                  <strong>{currentWeapon.name}</strong>
                  <span className="item-level-tag">LVL {clickPower}</span>
                </div>
                <p className="item-desc">Damage per Tap: <span className="val-highlight">+{clickPower} DMG</span></p>
              </div>
              <button 
                className="btn-buy-upgrade"
                disabled={coins < clickPowerCost}
                onClick={handleUpgradeClickPower}
              >
                <span>UPGRADE</span>
                <strong>🪙 {clickPowerCost.toLocaleString()}</strong>
              </button>
            </div>

            {/* Automated Weapons */}
            {UPGRADES_CONFIG.map(u => {
              const count = upgrades[u.id] || 0;
              const cost = Math.floor(u.baseCost * Math.pow(1.18, count));
              const currentTotalDps = count * u.dps;

              return (
                <div key={u.id} className="arsenal-item-card">
                  <div className="item-icon-box">
                    <span className="item-emoji">{u.icon}</span>
                  </div>
                  <div className="item-details">
                    <div className="item-name-row">
                      <strong>{u.name}</strong>
                      <span className="item-count-badge">x{count}</span>
                    </div>
                    <p className="item-desc">{u.desc}</p>
                    <span className="item-dps-sub">+{u.dps} DPS each • Total: {currentTotalDps} DPS</span>
                  </div>
                  <button 
                    className="btn-buy-upgrade"
                    disabled={coins < cost}
                    onClick={() => handleBuyUpgrade(u)}
                  >
                    <span>BUY +1</span>
                    <strong>🪙 {cost.toLocaleString()}</strong>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ZombieClickerGame;
