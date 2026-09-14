import React, { useState, useEffect, useRef } from 'react';
import { addCoins, addXP, getUserEconomy } from '../../utils/portalEconomy';
import { soundEffects } from '../../utils/SoundEffects';
import './LuckySpinModal.css';

const SPIN_SLICES = [
  { id: 1, text: '50 🪙', label: '50 COINS', type: 'COINS', value: 50, color: '#00f3ff', bg: '#082536' },
  { id: 2, text: '50 ⭐', label: '50 XP', type: 'XP', value: 50, color: '#00ff66', bg: '#092d1c' },
  { id: 3, text: '100 🪙', label: '100 COINS', type: 'COINS', value: 100, color: '#ffd600', bg: '#332d06' },
  { id: 4, text: '100 ⭐', label: '100 XP', type: 'XP', value: 100, color: '#ff007f', bg: '#360a22' },
  { id: 5, text: '250 🪙', label: '250 COINS', type: 'COINS', value: 250, color: '#9d4edd', bg: '#250f38' },
  { id: 6, text: '200 ⭐', label: '200 XP', type: 'XP', value: 200, color: '#ff9100', bg: '#361c07' },
  { id: 7, text: '500 💎', label: 'JACKPOT 500 🪙', type: 'COINS', value: 500, color: '#00f3ff', bg: '#073347' },
  { id: 8, text: '150 🪙', label: '150 BONUS COINS', type: 'COINS', value: 150, color: '#00ffcc', bg: '#082f2c' }
];

export function getSpinCooldownSeconds(userId = 'guest') {
  try {
    const last = localStorage.getItem(`arcade_last_spin_${userId}`);
    if (!last) return 0;
    const diff = (Date.now() - parseInt(last, 10)) / 1000;
    const cooldown = 24 * 60 * 60; // 24 hours
    return diff >= cooldown ? 0 : Math.ceil(cooldown - diff);
  } catch (e) {
    return 0;
  }
}

export function isLuckySpinReady(userId = 'guest') {
  return getSpinCooldownSeconds(userId) === 0;
}

export default function LuckySpinModal({ user, onClose, onEconomyUpdate }) {
  const userId = user?.id || 'guest';
  const canvasRef = useRef(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [cooldown, setCooldown] = useState(() => getSpinCooldownSeconds(userId));
  const [prize, setPrize] = useState(null);
  const rotationRef = useRef(0);
  const animFrameRef = useRef(null);

  // Countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  // Draw wheel on canvas
  const drawWheel = (rotationAngle) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const radius = width / 2 - 12;
    const numSlices = SPIN_SLICES.length;
    const sliceAngle = (2 * Math.PI) / numSlices;

    ctx.clearRect(0, 0, width, height);

    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.rotate(rotationAngle);

    // Draw Slices
    SPIN_SLICES.forEach((slice, i) => {
      const startAngle = i * sliceAngle;
      const endAngle = startAngle + sliceAngle;

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, startAngle, endAngle);
      ctx.closePath();

      ctx.fillStyle = slice.bg;
      ctx.fill();

      // Outer slice border
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = slice.color;
      ctx.stroke();

      // Text inside slice
      ctx.save();
      ctx.rotate(startAngle + sliceAngle / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = slice.color;
      ctx.font = 'bold 15px Orbitron, sans-serif';
      ctx.shadowColor = slice.color;
      ctx.shadowBlur = 8;
      ctx.fillText(slice.text, radius - 24, 5);
      ctx.restore();
    });

    // Outer Glow Ring
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, 2 * Math.PI);
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#00f3ff';
    ctx.shadowColor = '#00f3ff';
    ctx.shadowBlur = 14;
    ctx.stroke();

    // Center Hub Ring
    ctx.beginPath();
    ctx.arc(0, 0, 32, 0, 2 * Math.PI);
    ctx.fillStyle = '#060a17';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#ffd600';
    ctx.shadowColor = '#ffd600';
    ctx.shadowBlur = 10;
    ctx.stroke();

    // Center icon
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('⚡', 0, 1);

    ctx.restore();
  };

  useEffect(() => {
    drawWheel(rotationRef.current);
  }, []);

  const handleSpin = () => {
    if (isSpinning || cooldown > 0) return;

    soundEffects.playLaunch();
    setIsSpinning(true);
    setPrize(null);

    // Pick random slice
    const selectedIndex = Math.floor(Math.random() * SPIN_SLICES.length);
    const selectedSlice = SPIN_SLICES[selectedIndex];

    const sliceAngle = (2 * Math.PI) / SPIN_SLICES.length;
    // Pointer is at the TOP (angle = 3*PI/2)
    // Destination angle calculation so top pointer lands on selected slice:
    const baseSpins = 6 * (2 * Math.PI); // 6 full rotations
    const sliceCenter = selectedIndex * sliceAngle + sliceAngle / 2;
    const targetAngle = baseSpins + (1.5 * Math.PI - sliceCenter);

    const startAngle = rotationRef.current % (2 * Math.PI);
    const totalRotation = targetAngle - startAngle;
    const duration = 4500; // ms
    const startTime = performance.now();

    let lastTickAngle = startAngle;

    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out cubic deceleration
      const ease = 1 - Math.pow(1 - progress, 3);
      const currentAngle = startAngle + totalRotation * ease;
      rotationRef.current = currentAngle;

      drawWheel(currentAngle);

      // Sound tick on passing slice
      if (Math.abs(currentAngle - lastTickAngle) > sliceAngle) {
        soundEffects.playClick();
        lastTickAngle = currentAngle;
      }

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        // Spin Complete
        setIsSpinning(false);
        setPrize(selectedSlice);
        soundEffects.playTrophy();

        // Award Prize
        if (selectedSlice.type === 'COINS') {
          addCoins(selectedSlice.value, userId);
        } else if (selectedSlice.type === 'XP') {
          addXP(selectedSlice.value, userId);
        }

        const nextEcon = getUserEconomy(userId);
        if (onEconomyUpdate) onEconomyUpdate(nextEcon);

        // Set 24-hour cooldown
        localStorage.setItem(`arcade_last_spin_${userId}`, Date.now().toString());
        setCooldown(24 * 60 * 60);
      }
    };

    animFrameRef.current = requestAnimationFrame(animate);
  };

  const formatCooldown = (sec) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${h}h ${m}m ${s}s`;
  };

  return (
    <div className="lucky-spin-backdrop" onClick={onClose}>
      <div className="lucky-spin-modal glass-panel" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="spin-modal-header">
          <div className="spin-title-box">
            <span className="spin-header-icon">🎁</span>
            <div>
              <h2 className="spin-title">DAILY CYBER SPIN</h2>
              <p className="spin-subtitle">Free daily prize • Spin to win Coins, XP & Rewards!</p>
            </div>
          </div>
          <button className="spin-close-btn" onClick={onClose}>✕</button>
        </div>

        {/* Wheel Container */}
        <div className="spin-stage-wrapper">
          <div className="wheel-pointer-arrow">▼</div>
          <div className="wheel-glow-casing">
            <canvas ref={canvasRef} width={380} height={380} className="wheel-canvas" />
          </div>
        </div>

        {/* Prize Notification Toast */}
        {prize && (
          <div className="spin-win-banner" style={{ borderColor: prize.color }}>
            <span className="win-emoji">🎉</span>
            <div>
              <strong>CONGRATULATIONS!</strong>
              <p>You won <span style={{ color: prize.color, fontWeight: 900 }}>{prize.label}</span>!</p>
            </div>
          </div>
        )}

        {/* Action Controls */}
        <div className="spin-actions-row">
          {cooldown > 0 && !prize ? (
            <div className="spin-cooldown-box">
              <span className="cd-icon">⏳</span>
              <span>Next Free Spin in: <strong>{formatCooldown(cooldown)}</strong></span>
            </div>
          ) : (
            <button
              className={`btn-spin-now ${isSpinning ? 'spinning' : ''}`}
              onClick={handleSpin}
              disabled={isSpinning || cooldown > 0}
            >
              {isSpinning ? 'SPINNING MATRIX...' : 'SPIN WHEEL (FREE)'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
