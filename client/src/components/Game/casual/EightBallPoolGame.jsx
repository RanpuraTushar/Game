import React, { useState, useEffect, useRef, useCallback } from 'react';
import SoundEffects from '../../../utils/SoundEffects';
import { api } from '../../../services/api';
import './EightBallPoolGame.css';

// --- TABLE & POCKET GEOMETRY CONSTANTS (Authentic 2:1 Tournament Ratio) ---
const TABLE_WIDTH = 900;
const TABLE_HEIGHT = 480;
const RAIL_SIZE = 44;
const PLAY_X = RAIL_SIZE;
const PLAY_Y = RAIL_SIZE;
const PLAY_W = TABLE_WIDTH - RAIL_SIZE * 2; // 812
const PLAY_H = TABLE_HEIGHT - RAIL_SIZE * 2; // 392
const BALL_RADIUS = 12;
const POCKET_RADIUS = 26;
const SIDE_POCKET_RADIUS = 23;

// 6 Realistic Drop Pockets with leather drop cups
const POCKETS = [
  { x: PLAY_X + 6, y: PLAY_Y + 6, radius: POCKET_RADIUS, id: 'TL', name: 'Top-Left' },
  { x: TABLE_WIDTH / 2, y: PLAY_Y - 3, radius: SIDE_POCKET_RADIUS, id: 'TC', name: 'Top-Center' },
  { x: PLAY_X + PLAY_W - 6, y: PLAY_Y + 6, radius: POCKET_RADIUS, id: 'TR', name: 'Top-Right' },
  { x: PLAY_X + 6, y: PLAY_Y + PLAY_H - 6, radius: POCKET_RADIUS, id: 'BL', name: 'Bottom-Left' },
  { x: TABLE_WIDTH / 2, y: PLAY_Y + PLAY_H + 3, radius: SIDE_POCKET_RADIUS, id: 'BC', name: 'Bottom-Center' },
  { x: PLAY_X + PLAY_W - 6, y: PLAY_Y + PLAY_H - 6, radius: POCKET_RADIUS, id: 'BR', name: 'Bottom-Right' }
];

// 6 Segmented Rubber Cushions with Angled Pocket Jaws (45° / 51° Throat Openings)
const CUSHION_SEGMENTS = [
  // Top-Left Rail (Nose & 2 pocket jaws)
  { p1: { x: PLAY_X + 34, y: PLAY_Y + 3 }, p2: { x: TABLE_WIDTH / 2 - 24, y: PLAY_Y + 3 }, type: 'NOSE' },
  { p1: { x: PLAY_X + 12, y: PLAY_Y + 28 }, p2: { x: PLAY_X + 34, y: PLAY_Y + 3 }, type: 'JAW' },
  { p1: { x: TABLE_WIDTH / 2 - 24, y: PLAY_Y + 3 }, p2: { x: TABLE_WIDTH / 2 - 12, y: PLAY_Y }, type: 'JAW' },

  // Top-Right Rail (Nose & 2 pocket jaws)
  { p1: { x: TABLE_WIDTH / 2 + 24, y: PLAY_Y + 3 }, p2: { x: PLAY_X + PLAY_W - 34, y: PLAY_Y + 3 }, type: 'NOSE' },
  { p1: { x: TABLE_WIDTH / 2 + 12, y: PLAY_Y }, p2: { x: TABLE_WIDTH / 2 + 24, y: PLAY_Y + 3 }, type: 'JAW' },
  { p1: { x: PLAY_X + PLAY_W - 34, y: PLAY_Y + 3 }, p2: { x: PLAY_X + PLAY_W - 12, y: PLAY_Y + 28 }, type: 'JAW' },

  // Bottom-Left Rail (Nose & 2 pocket jaws)
  { p1: { x: PLAY_X + 34, y: PLAY_Y + PLAY_H - 3 }, p2: { x: TABLE_WIDTH / 2 - 24, y: PLAY_Y + PLAY_H - 3 }, type: 'NOSE' },
  { p1: { x: PLAY_X + 12, y: PLAY_Y + PLAY_H - 28 }, p2: { x: PLAY_X + 34, y: PLAY_Y + PLAY_H - 3 }, type: 'JAW' },
  { p1: { x: TABLE_WIDTH / 2 - 24, y: PLAY_Y + PLAY_H - 3 }, p2: { x: TABLE_WIDTH / 2 - 12, y: PLAY_Y + PLAY_H }, type: 'JAW' },

  // Bottom-Right Rail (Nose & 2 pocket jaws)
  { p1: { x: TABLE_WIDTH / 2 + 24, y: PLAY_Y + PLAY_H - 3 }, p2: { x: PLAY_X + PLAY_W - 34, y: PLAY_Y + PLAY_H - 3 }, type: 'NOSE' },
  { p1: { x: TABLE_WIDTH / 2 + 12, y: PLAY_Y + PLAY_H }, p2: { x: TABLE_WIDTH / 2 + 24, y: PLAY_Y + PLAY_H - 3 }, type: 'JAW' },
  { p1: { x: PLAY_X + PLAY_W - 34, y: PLAY_Y + PLAY_H - 3 }, p2: { x: PLAY_X + PLAY_W - 12, y: PLAY_Y + PLAY_H - 28 }, type: 'JAW' },

  // Left Rail (Nose & 2 pocket jaws)
  { p1: { x: PLAY_X + 3, y: PLAY_Y + 34 }, p2: { x: PLAY_X + 3, y: PLAY_Y + PLAY_H - 34 }, type: 'NOSE' },
  { p1: { x: PLAY_X + 28, y: PLAY_Y + 12 }, p2: { x: PLAY_X + 3, y: PLAY_Y + 34 }, type: 'JAW' },
  { p1: { x: PLAY_X + 3, y: PLAY_Y + PLAY_H - 34 }, p2: { x: PLAY_X + 28, y: PLAY_Y + PLAY_H - 12 }, type: 'JAW' },

  // Right Rail (Nose & 2 pocket jaws)
  { p1: { x: PLAY_X + PLAY_W - 3, y: PLAY_Y + 34 }, p2: { x: PLAY_X + PLAY_W - 3, y: PLAY_Y + PLAY_H - 34 }, type: 'NOSE' },
  { p1: { x: PLAY_X + PLAY_W - 28, y: PLAY_Y + 12 }, p2: { x: PLAY_X + PLAY_W - 3, y: PLAY_Y + 34 }, type: 'JAW' },
  { p1: { x: PLAY_X + PLAY_W - 3, y: PLAY_Y + PLAY_H - 34 }, p2: { x: PLAY_X + PLAY_W - 28, y: PLAY_Y + PLAY_H - 12 }, type: 'JAW' }
];

const BALL_DEFINITIONS = {
  1: { color: '#ffd600', type: 'SOLID', num: 1, name: '1 Yellow' },
  2: { color: '#0055ff', type: 'SOLID', num: 2, name: '2 Blue' },
  3: { color: '#ee1122', type: 'SOLID', num: 3, name: '3 Red' },
  4: { color: '#8800cc', type: 'SOLID', num: 4, name: '4 Purple' },
  5: { color: '#ff7700', type: 'SOLID', num: 5, name: '5 Orange' },
  6: { color: '#00aa33', type: 'SOLID', num: 6, name: '6 Green' },
  7: { color: '#770011', type: 'SOLID', num: 7, name: '7 Maroon' },
  8: { color: '#111111', type: 'EIGHT', num: 8, name: '8 Black' },
  9: { color: '#ffd600', type: 'STRIPE', num: 9, name: '9 Yellow Stripe' },
  10: { color: '#0055ff', type: 'STRIPE', num: 10, name: '10 Blue Stripe' },
  11: { color: '#ee1122', type: 'STRIPE', num: 11, name: '11 Red Stripe' },
  12: { color: '#8800cc', type: 'STRIPE', num: 12, name: '12 Purple Stripe' },
  13: { color: '#ff7700', type: 'STRIPE', num: 13, name: '13 Orange Stripe' },
  14: { color: '#00aa33', type: 'STRIPE', num: 14, name: '14 Green Stripe' },
  15: { color: '#770011', type: 'STRIPE', num: 15, name: '15 Maroon Stripe' }
};

// --- SYNTHESIZED WEB AUDIO BILLIARD ACOUSTICS ---
class BilliardAudioEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playBallHit(velocity = 10) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const intensity = Math.min(1, Math.max(0.1, velocity / 14));
      
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(2100 + Math.random() * 200, now);
      osc1.frequency.exponentialRampToValueAtTime(1400, now + 0.035);

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(3250 + Math.random() * 300, now);
      osc2.frequency.exponentialRampToValueAtTime(1900, now + 0.025);

      gain.gain.setValueAtTime(0.4 * intensity, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.05);
      osc2.stop(now + 0.05);
    } catch (e) {}
  }

  playCueStrike(power = 50) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const pRatio = Math.min(1, Math.max(0.15, power / 100));

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(380, now);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.06);

      gain.gain.setValueAtTime(0.45 * pRatio, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.08);
    } catch (e) {}
  }

  playCushionBounce(velocity = 8) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const intensity = Math.min(1, Math.max(0.1, velocity / 12));

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(50, now + 0.05);

      gain.gain.setValueAtTime(0.25 * intensity, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.055);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.06);
    } catch (e) {}
  }

  playPocketDrop() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(95, now + 0.16);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.17);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.18);
    } catch (e) {}
  }
}

const billiardAudio = new BilliardAudioEngine();

function closestPointOnSegment(px, py, ax, ay, bx, by) {
  const abx = bx - ax;
  const aby = by - ay;
  const apx = px - ax;
  const apy = py - ay;
  const abLen2 = abx * abx + aby * aby;
  if (abLen2 === 0) return { x: ax, y: ay };
  let t = (apx * abx + apy * aby) / abLen2;
  t = Math.max(0, Math.min(1, t));
  return { x: ax + t * abx, y: ay + t * aby };
}

function updateRotationMatrix(mat, axisX, axisY, angle) {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const c1 = 1 - cos;

  const r00 = cos + axisX * axisX * c1;
  const r01 = axisX * axisY * c1;
  const r02 = axisY * sin;

  const r10 = axisY * axisX * c1;
  const r11 = cos + axisY * axisY * c1;
  const r12 = -axisX * sin;

  const r20 = -axisY * sin;
  const r21 = axisX * sin;
  const r22 = cos;

  return [
    mat[0] * r00 + mat[1] * r10 + mat[2] * r20,
    mat[0] * r01 + mat[1] * r11 + mat[2] * r21,
    mat[0] * r02 + mat[1] * r12 + mat[2] * r22,

    mat[3] * r00 + mat[4] * r10 + mat[5] * r20,
    mat[3] * r01 + mat[4] * r11 + mat[5] * r21,
    mat[3] * r02 + mat[4] * r12 + mat[5] * r22,

    mat[6] * r00 + mat[7] * r10 + mat[8] * r20,
    mat[6] * r01 + mat[7] * r11 + mat[8] * r21,
    mat[6] * r02 + mat[7] * r12 + mat[8] * r22
  ];
}

const EightBallPoolGame = ({ user, onLeave }) => {
  const canvasRef = useRef(null);
  const powerGaugeRef = useRef(null);

  // React UI States
  const [gameMode, setGameMode] = useState('VS_AI'); // 'VS_AI', 'TWO_PLAYER', 'PRACTICE'
  const [aiDifficulty, setAiDifficulty] = useState('PRO'); // 'CASUAL', 'PRO', 'MASTER'
  const [feltTheme, setFeltTheme] = useState('TOURNAMENT_GREEN'); // 'TOURNAMENT_GREEN', 'ROYAL_BLUE', 'CYBER_DARK', 'CRIMSON_RED'
  const [turn, setTurn] = useState('P1');
  const [p1Type, setP1Type] = useState(null); // 'SOLID' or 'STRIPE'
  const [p2Type, setP2Type] = useState(null);
  const [p1Potted, setP1Potted] = useState([]);
  const [p2Potted, setP2Potted] = useState([]);
  const [power, setPower] = useState(50);
  const [aimAngle, setAimAngle] = useState(0);
  const [isShooting, setIsShooting] = useState(false);
  const [ballInHand, setBallInHand] = useState(false);
  const [ballInHandValid, setBallInHandValid] = useState(true);
  const [spinOffset, setSpinOffset] = useState({ x: 0, y: 0 });
  const [turnMessage, setTurnMessage] = useState('Player 1: Break the rack!');
  const [shotStreak, setShotStreak] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null);
  const [unlockedBanner, setUnlockedBanner] = useState(null);

  // Fast mutating physics & single source of truth in stateRef
  const stateRef = useRef({
    cueBall: {
      x: 230,
      y: TABLE_HEIGHT / 2,
      vx: 0,
      vy: 0,
      spinX: 0,
      spinY: 0,
      rotMat: [1, 0, 0, 0, 1, 0, 0, 0, 1],
      active: true,
      scale: 1,
      inPocket: false
    },
    balls: [],
    particles: [],
    pocketedThisTurn: [],
    firstBallHit: null,
    cushionHitThisTurn: false,
    mousePos: { x: 0, y: 0 },
    active: true,
    isShooting: false,
    ballInHand: false,
    gameOver: false,
    turn: 'P1',
    gameMode: 'VS_AI',
    aiDifficulty: 'PRO',
    p1Type: null,
    p2Type: null,
    cueStrikeAnim: null,
    isDraggingOnCanvas: false,
    aimAngle: 0,
    power: 50
  });

  // Keep stateRef mirrored with props/settings
  useEffect(() => { stateRef.current.gameMode = gameMode; }, [gameMode]);
  useEffect(() => { stateRef.current.aiDifficulty = aiDifficulty; }, [aiDifficulty]);
  useEffect(() => { stateRef.current.aimAngle = aimAngle; }, [aimAngle]);
  useEffect(() => { stateRef.current.power = power; }, [power]);

  // Re-rack balls
  const resetRack = useCallback(() => {
    const s = stateRef.current;
    s.cueBall = {
      x: 230,
      y: TABLE_HEIGHT / 2,
      vx: 0,
      vy: 0,
      spinX: 0,
      spinY: 0,
      rotMat: [1, 0, 0, 0, 1, 0, 0, 0, 1],
      active: true,
      scale: 1,
      inPocket: false
    };
    s.particles = [];
    s.pocketedThisTurn = [];
    s.firstBallHit = null;
    s.cushionHitThisTurn = false;
    s.cueStrikeAnim = null;
    s.isDraggingOnCanvas = false;
    s.isShooting = false;
    s.ballInHand = false;
    s.gameOver = false;
    s.turn = 'P1';
    s.p1Type = null;
    s.p2Type = null;

    const rackStartX = 600;
    const rackStartY = TABLE_HEIGHT / 2;
    const r = BALL_RADIUS;
    const balls = [];

    const rackPattern = [
      1,
      9, 2,
      3, 8, 10,
      11, 4, 12, 5,
      13, 6, 14, 7, 15
    ];

    let bIdx = 0;
    for (let col = 0; col < 5; col++) {
      const colX = rackStartX + col * (r * 1.732);
      const startY = rackStartY - col * r;
      for (let row = 0; row <= col; row++) {
        const num = rackPattern[bIdx];
        const def = BALL_DEFINITIONS[num];
        balls.push({
          id: num,
          num,
          x: colX + (Math.random() - 0.5) * 0.2,
          y: startY + row * (r * 2) + (Math.random() - 0.5) * 0.2,
          vx: 0,
          vy: 0,
          rotMat: [1, 0, 0, 0, 1, 0, 0, 0, 1],
          color: def.color,
          type: def.type,
          name: def.name,
          active: true,
          scale: 1,
          inPocket: false
        });
        bIdx++;
      }
    }

    s.balls = balls;
    setTurn('P1');
    setP1Type(null);
    setP2Type(null);
    setP1Potted([]);
    setP2Potted([]);
    setIsShooting(false);
    setBallInHand(false);
    setGameOver(false);
    setWinner(null);
    setShotStreak(0);
    setTurnMessage('Player 1: Break the rack!');
  }, []);

  useEffect(() => {
    resetRack();
  }, [gameMode, resetRack]);

  // Keyboard controls (Arrow keys Left & Right, Spacebar to shoot)
  useEffect(() => {
    const handleKeyDown = (e) => {
      const s = stateRef.current;
      if (s.isShooting || s.gameOver || (s.gameMode === 'VS_AI' && s.turn === 'P2')) return;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setAimAngle(a => a - 0.008);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setAimAngle(a => a + 0.008);
      } else if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        triggerCueStrikeAnimation(s.aimAngle, s.power);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // --- SUB-STEPPED REALISTIC PHYSICS LOOP ---
  const updatePhysics = useCallback(() => {
    const s = stateRef.current;
    let anyMoving = false;

    // Handle cue stick snapping forward animation
    if (s.cueStrikeAnim) {
      const anim = s.cueStrikeAnim;
      anim.progress += 0.22;
      if (anim.progress >= 1) {
        const finalAngle = anim.angle;
        const finalPower = anim.targetPower;
        s.cueStrikeAnim = null;
        executeImpulse(finalAngle, finalPower);
      }
    }

    const SUBSTEPS = 10;
    const dt = 1 / SUBSTEPS;
    const FRICTION = Math.pow(0.991, dt);

    const allBalls = [s.cueBall, ...s.balls.filter(b => b.active)];

    for (let step = 0; step < SUBSTEPS; step++) {
      // 1. Move balls, apply rolling friction, and update 3D rotation
      allBalls.forEach(b => {
        if (!b.active) return;
        const speed = Math.hypot(b.vx, b.vy);

        if (speed > 0.035) {
          anyMoving = true;
          b.x += b.vx * dt;
          b.y += b.vy * dt;

          b.vx *= FRICTION;
          b.vy *= FRICTION;

          const rotAngle = (speed * dt) / BALL_RADIUS;
          const axisX = -b.vy / speed;
          const axisY = b.vx / speed;
          b.rotMat = updateRotationMatrix(b.rotMat, axisX, axisY, rotAngle);

          if (b === s.cueBall && (b.spinX !== 0 || b.spinY !== 0)) {
            b.spinX *= 0.997;
            b.spinY *= 0.997;
            b.vx += b.spinX * 0.015 * dt;
            b.vy += b.spinY * 0.015 * dt;
          }
        } else {
          b.vx = 0;
          b.vy = 0;
        }

        // Pocket Suction & Drop
        POCKETS.forEach(p => {
          const dist = Math.hypot(b.x - p.x, b.y - p.y);
          if (dist < p.radius + 6) {
            b.vx += (p.x - b.x) * 0.25 * dt;
            b.vy += (p.y - b.y) * 0.25 * dt;
            b.scale = Math.max(0.25, b.scale - 0.04 * dt * 10);

            if (dist < p.radius * 0.65 && !b.inPocket) {
              b.inPocket = true;
              b.active = false;
              b.vx = 0;
              b.vy = 0;
              billiardAudio.playPocketDrop();
              s.pocketedThisTurn.push(b);

              for (let i = 0; i < 16; i++) {
                s.particles.push({
                  x: p.x,
                  y: p.y,
                  vx: (Math.random() - 0.5) * 4.5,
                  vy: (Math.random() - 0.5) * 4.5,
                  color: b.color || '#ffffff',
                  life: 25,
                  maxLife: 25
                });
              }
            }
          }
        });

        // 2. Segmented Cushion Collisions
        if (b.active) {
          CUSHION_SEGMENTS.forEach(seg => {
            const cp = closestPointOnSegment(b.x, b.y, seg.p1.x, seg.p1.y, seg.p2.x, seg.p2.y);
            const dx = b.x - cp.x;
            const dy = b.y - cp.y;
            const dist = Math.hypot(dx, dy);

            if (dist < BALL_RADIUS && dist > 0) {
              const nx = dx / dist;
              const ny = dy / dist;

              b.x = cp.x + nx * BALL_RADIUS;
              b.y = cp.y + ny * BALL_RADIUS;

              const vn = b.vx * nx + b.vy * ny;
              const tx = -ny;
              const ty = nx;
              const vt = b.vx * tx + b.vy * ty;

              if (vn < 0) {
                const RESTITUTION = seg.type === 'NOSE' ? 0.86 : 0.78;
                const CUSHION_FRICTION = 0.96;

                let newVt = vt * CUSHION_FRICTION;
                if (b === s.cueBall && b.spinX !== 0) {
                  newVt += b.spinX * 0.45;
                  b.spinX *= 0.5;
                }

                b.vx = -vn * RESTITUTION * nx + newVt * tx;
                b.vy = -vn * RESTITUTION * ny + newVt * ty;

                s.cushionHitThisTurn = true;
                billiardAudio.playCushionBounce(Math.abs(vn));
              }
            }
          });
        }
      });

      // 3. Elastic Ball-to-Ball Collisions
      for (let i = 0; i < allBalls.length; i++) {
        for (let j = i + 1; j < allBalls.length; j++) {
          const b1 = allBalls[i];
          const b2 = allBalls[j];
          if (!b1.active || !b2.active) continue;

          const dx = b2.x - b1.x;
          const dy = b2.y - b1.y;
          const dist = Math.hypot(dx, dy);
          const minDist = BALL_RADIUS * 2;

          if (dist < minDist && dist > 0) {
            const nx = dx / dist;
            const ny = dy / dist;

            const overlap = minDist - dist;
            b1.x -= nx * overlap * 0.5;
            b1.y -= ny * overlap * 0.5;
            b2.x += nx * overlap * 0.5;
            b2.y += ny * overlap * 0.5;

            const kx = b1.vx - b2.vx;
            const ky = b1.vy - b2.vy;
            const impulse = (nx * kx + ny * ky);

            if (impulse > 0) {
              const BALL_RESTITUTION = 0.97;
              b1.vx -= impulse * nx * BALL_RESTITUTION;
              b1.vy -= impulse * ny * BALL_RESTITUTION;
              b2.vx += impulse * nx * BALL_RESTITUTION;
              b2.vy += impulse * ny * BALL_RESTITUTION;

              if (b1 === s.cueBall) {
                if (!s.firstBallHit) s.firstBallHit = b2;
                if (b1.spinY !== 0) {
                  b1.vx += Math.cos(Math.atan2(b1.vy, b1.vx) + Math.PI) * b1.spinY * 3.5;
                  b1.vy += Math.sin(Math.atan2(b1.vy, b1.vx) + Math.PI) * b1.spinY * 3.5;
                  b1.spinY = 0;
                }
              } else if (b2 === s.cueBall) {
                if (!s.firstBallHit) s.firstBallHit = b1;
                if (b2.spinY !== 0) {
                  b2.vx += Math.cos(Math.atan2(b2.vy, b2.vx) + Math.PI) * b2.spinY * 3.5;
                  b2.vy += Math.sin(Math.atan2(b2.vy, b2.vx) + Math.PI) * b2.spinY * 3.5;
                  b2.spinY = 0;
                }
              }

              billiardAudio.playBallHit(impulse);
            }
          }
        }
      }
    }

    // 4. Update Particles
    s.particles.forEach(pt => {
      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.vx *= 0.96;
      pt.vy *= 0.96;
      pt.life--;
    });
    s.particles = s.particles.filter(pt => pt.life > 0);

    // 5. Shot Finished Resolution (Only runs ONCE because s.isShooting is reset immediately)
    if (s.isShooting && !anyMoving && !s.cueStrikeAnim) {
      s.isShooting = false;
      setIsShooting(false);
      handleTurnEnd();
    }
  }, []);

  // Main 60FPS Physics & Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;

    const loop = () => {
      updatePhysics();
      render(ctx);
      if (stateRef.current.active) {
        animId = requestAnimationFrame(loop);
      }
    };
    animId = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(animId);
  }, [aimAngle, power, turn, p1Type, p2Type, gameOver, feltTheme, ballInHand, spinOffset, updatePhysics]);

  // --- STRIKE LAUNCHER ---
  const triggerCueStrikeAnimation = (angle, shotPower) => {
    const s = stateRef.current;
    if (s.isShooting || !s.cueBall.active || s.gameOver) return;

    s.isShooting = true;
    setIsShooting(true);
    s.ballInHand = false;
    setBallInHand(false);

    s.cueStrikeAnim = {
      progress: 0,
      startDist: 28 + (shotPower / 100) * 55,
      targetPower: shotPower,
      angle
    };
  };

  const executeImpulse = (angle, shotPower) => {
    const s = stateRef.current;
    const speed = (shotPower / 100) * 22;

    s.cueBall.vx = Math.cos(angle) * speed;
    s.cueBall.vy = Math.sin(angle) * speed;

    s.cueBall.spinX = spinOffset.x * (shotPower / 100);
    s.cueBall.spinY = spinOffset.y * (shotPower / 100);
    s.firstBallHit = null;
    s.cushionHitThisTurn = false;

    billiardAudio.playCueStrike(shotPower);

    for (let i = 0; i < 12; i++) {
      s.particles.push({
        x: s.cueBall.x - Math.cos(angle) * BALL_RADIUS,
        y: s.cueBall.y - Math.sin(angle) * BALL_RADIUS,
        vx: -Math.cos(angle + (Math.random() - 0.5) * 0.8) * (2 + Math.random() * 3),
        vy: -Math.sin(angle + (Math.random() - 0.5) * 0.8) * (2 + Math.random() * 3),
        color: '#38bdf8',
        life: 18,
        maxLife: 18
      });
    }
  };

  // --- OFFICIAL TOURNAMENT 8-BALL RULES RESOLUTION ---
  const handleTurnEnd = async () => {
    const s = stateRef.current;
    const pocketed = [...s.pocketedThisTurn];
    s.pocketedThisTurn = [];

    const cueScratch = !s.cueBall.active || s.cueBall.inPocket;
    const eightBallPotted = pocketed.some(b => b.num === 8);
    const regularPotted = pocketed.filter(b => b.num !== 8 && b !== s.cueBall);

    // Scratch handling: Ball in Hand
    if (cueScratch) {
      s.cueBall.active = true;
      s.cueBall.inPocket = false;
      s.cueBall.x = 230;
      s.cueBall.y = TABLE_HEIGHT / 2;
      s.cueBall.vx = 0;
      s.cueBall.vy = 0;
      s.cueBall.scale = 1;
      s.cueBall.spinX = 0;
      s.cueBall.spinY = 0;
      s.ballInHand = true;
      setBallInHand(true);
      SoundEffects.playLoss();
    }

    // 8-Ball Win or Loss Check
    if (eightBallPotted) {
      const myType = s.turn === 'P1' ? s.p1Type : s.p2Type;
      const myRemaining = s.balls.filter(b => b.active && b.type === myType).length;

      if (myRemaining === 0 && !cueScratch) {
        triggerWin(s.turn === 'P1' ? 'PLAYER 1' : (s.gameMode === 'VS_AI' ? 'AI BOT' : 'PLAYER 2'));
      } else {
        triggerWin(s.turn === 'P1' ? (s.gameMode === 'VS_AI' ? 'AI BOT' : 'PLAYER 2') : 'PLAYER 1');
      }
      return;
    }

    // Foul check: Wrong ball hit first
    let isFoul = cueScratch;
    const myType = s.turn === 'P1' ? s.p1Type : s.p2Type;
    if (myType && s.firstBallHit && s.firstBallHit.type !== myType && s.firstBallHit.num !== 8) {
      isFoul = true;
    }

    // Solids / Stripes Assignment
    let keepTurn = false;
    if (regularPotted.length > 0 && !s.p1Type && !isFoul) {
      const firstType = regularPotted[0].type;
      const oppType = firstType === 'SOLID' ? 'STRIPE' : 'SOLID';
      if (s.turn === 'P1') {
        s.p1Type = firstType;
        s.p2Type = oppType;
        setP1Type(firstType);
        setP2Type(oppType);
      } else {
        s.p2Type = firstType;
        s.p1Type = oppType;
        setP2Type(firstType);
        setP1Type(oppType);
      }
      keepTurn = true;
    } else if (regularPotted.length > 0 && !isFoul) {
      const pottedMyBall = regularPotted.some(b => b.type === myType);
      if (pottedMyBall) keepTurn = true;
    }

    setP1Potted(s.balls.filter(b => !b.active && b.type === s.p1Type));
    setP2Potted(s.balls.filter(b => !b.active && b.type === s.p2Type));

    if (keepTurn && !isFoul) {
      setShotStreak(st => st + 1);
      const curName = s.turn === 'P1' ? 'Player 1' : (s.gameMode === 'VS_AI' ? 'AI Bot' : 'Player 2');
      setTurnMessage(`Ball potted! ${curName} shoots again.`);
    } else {
      setShotStreak(0);
      const nextTurn = s.turn === 'P1' ? 'P2' : 'P1';
      s.turn = nextTurn;
      setTurn(nextTurn);
      const nextName = nextTurn === 'P1' ? 'Player 1' : (s.gameMode === 'VS_AI' ? 'AI Bot' : 'Player 2');

      if (isFoul) {
        s.ballInHand = true;
        setBallInHand(true);
        setTurnMessage(`Foul! ${nextName} has Ball in Hand.`);
      } else {
        setTurnMessage(`${nextName}'s Turn`);
      }
    }
  };

  // --- PROVEN AI BOT (Watches turn state and automatically executes shot!) ---
  useEffect(() => {
    if (gameMode === 'VS_AI' && turn === 'P2' && !isShooting && !gameOver) {
      const timer = setTimeout(() => {
        executeAiTurn();
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [turn, isShooting, gameMode, gameOver]);

  const executeAiTurn = () => {
    const s = stateRef.current;
    if (!s.cueBall.active || s.gameOver || s.isShooting) return;

    // 1. If AI has Ball In Hand, place it behind headstring cleanly
    if (s.ballInHand || ballInHand) {
      let placed = false;
      for (let attempt = 0; attempt < 25; attempt++) {
        const testX = 180 + Math.random() * 100;
        const testY = PLAY_Y + 40 + Math.random() * (PLAY_H - 80);
        const collides = s.balls.some(b => b.active && Math.hypot(b.x - testX, b.y - testY) < BALL_RADIUS * 2 + 4);
        if (!collides) {
          s.cueBall.x = testX;
          s.cueBall.y = testY;
          placed = true;
          break;
        }
      }
      if (!placed) {
        s.cueBall.x = 230;
        s.cueBall.y = TABLE_HEIGHT / 2;
      }
      s.ballInHand = false;
      setBallInHand(false);
    }

    // 2. Determine target balls
    const myType = s.p2Type;
    let candidates = s.balls.filter(b => b.active && (myType ? b.type === myType : b.type !== 'EIGHT'));
    if (candidates.length === 0) {
      // 8-Ball is the target when all suit balls potted!
      candidates = s.balls.filter(b => b.active && b.num === 8);
    }
    if (candidates.length === 0) {
      candidates = s.balls.filter(b => b.active);
    }
    if (candidates.length === 0) return;

    // 3. Find best shot towards all 6 pockets
    let bestShot = null;
    let highestScore = -999999;

    candidates.forEach(ball => {
      POCKETS.forEach(p => {
        const bpx = p.x - ball.x;
        const bpy = p.y - ball.y;
        const bpDist = Math.hypot(bpx, bpy);
        if (bpDist === 0) return;
        const toPocketAngle = Math.atan2(bpy, bpx);

        const ghostX = ball.x - Math.cos(toPocketAngle) * BALL_RADIUS * 2;
        const ghostY = ball.y - Math.sin(toPocketAngle) * BALL_RADIUS * 2;

        const cgx = ghostX - s.cueBall.x;
        const cgy = ghostY - s.cueBall.y;
        const cgDist = Math.hypot(cgx, cgy);
        const aimAng = Math.atan2(cgy, cgx);

        let angleDiff = Math.abs(aimAng - toPocketAngle);
        if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;
        const cutDeg = (angleDiff * 180) / Math.PI;

        if (cutDeg < 80) {
          const score = 2000 - bpDist * 1.0 - cgDist * 0.4 - cutDeg * 12;
          if (score > highestScore) {
            highestScore = score;
            const calcPower = Math.min(85, Math.max(35, Math.round(cgDist * 0.12 + bpDist * 0.08)));
            bestShot = { aimAng, power: calcPower, ball };
          }
        }
      });
    });

    if (!bestShot) {
      const target = candidates[0];
      const dx = target.x - s.cueBall.x;
      const dy = target.y - s.cueBall.y;
      bestShot = { aimAng: Math.atan2(dy, dx), power: 55, ball: target };
    }

    let variance = 0;
    const diff = s.aiDifficulty || aiDifficulty;
    if (diff === 'CASUAL') variance = (Math.random() - 0.5) * 0.055;
    else if (diff === 'PRO') variance = (Math.random() - 0.5) * 0.016;
    else if (diff === 'MASTER') variance = (Math.random() - 0.5) * 0.003;

    const targetAimAngle = bestShot.aimAng + variance;

    // Update aim and power visually so user SEES the AI aim!
    setAimAngle(targetAimAngle);
    setPower(bestShot.power);

    // AI smoothly takes the shot
    setTimeout(() => {
      triggerCueStrikeAnimation(targetAimAngle, bestShot.power);
    }, 450);
  };

  const triggerWin = async (winnerName) => {
    stateRef.current.gameOver = true;
    setGameOver(true);
    setWinner(winnerName);
    SoundEffects.playWin();
    const res = await api.submitScore('EIGHT_BALL_POOL', 700 + shotStreak * 50, winnerName === 'PLAYER 1', user);
    if (res?.unlockedAchievements?.length > 0) setUnlockedBanner(res.unlockedAchievements[0]);
  };

  // --- CANVAS MOUSE & TOUCH CONTROLS ---
  const handleCanvasMouseMove = (e) => {
    const s = stateRef.current;
    if (s.isShooting || (s.gameMode === 'VS_AI' && s.turn === 'P2') || s.gameOver) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;
    s.mousePos = { x: mouseX, y: mouseY };

    if (ballInHand || s.ballInHand) {
      const boundedX = Math.max(PLAY_X + BALL_RADIUS + 4, Math.min(PLAY_X + PLAY_W - BALL_RADIUS - 4, mouseX));
      const boundedY = Math.max(PLAY_Y + BALL_RADIUS + 4, Math.min(PLAY_Y + PLAY_H - BALL_RADIUS - 4, mouseY));
      s.cueBall.x = boundedX;
      s.cueBall.y = boundedY;

      const collides = s.balls.some(b => b.active && Math.hypot(b.x - boundedX, b.y - boundedY) < BALL_RADIUS * 2 + 2);
      setBallInHandValid(!collides);
      return;
    }

    if (s.isDraggingOnCanvas) {
      const cue = s.cueBall;
      const dragDx = mouseX - cue.x;
      const dragDy = mouseY - cue.y;
      const pullDist = -dragDx * Math.cos(aimAngle) - dragDy * Math.sin(aimAngle);

      if (pullDist > 0) {
        const calculatedPower = Math.min(100, Math.max(10, Math.round((pullDist / 180) * 100)));
        setPower(calculatedPower);
      }
      return;
    }

    const cue = s.cueBall;
    const distToCue = Math.hypot(mouseX - cue.x, mouseY - cue.y);
    if (distToCue > 18) {
      const angle = Math.atan2(mouseY - cue.y, mouseX - cue.x);
      setAimAngle(angle);
    }
  };

  const handleCanvasMouseDown = (e) => {
    const s = stateRef.current;
    if (s.isShooting || (s.gameMode === 'VS_AI' && s.turn === 'P2') || s.gameOver) return;

    if (ballInHand || s.ballInHand) {
      if (ballInHandValid) {
        s.ballInHand = false;
        setBallInHand(false);
        billiardAudio.playBallHit(6);
      }
      return;
    }

    if (e.button === 0) {
      s.isDraggingOnCanvas = true;
    } else if (e.button === 2) {
      e.preventDefault();
      s.isDraggingOnCanvas = false;
    }
  };

  const handleCanvasMouseUp = () => {
    const s = stateRef.current;
    if (s.isDraggingOnCanvas) {
      s.isDraggingOnCanvas = false;
      if (s.turn === 'P1' || s.gameMode !== 'VS_AI') {
        triggerCueStrikeAnimation(aimAngle, power);
      }
    }
  };

  const handlePowerDrag = (e) => {
    const s = stateRef.current;
    if (s.isShooting || (s.gameMode === 'VS_AI' && s.turn === 'P2') || s.gameOver) return;
    const gauge = powerGaugeRef.current;
    if (!gauge) return;
    const rect = gauge.getBoundingClientRect();
    const relY = Math.max(0, Math.min(rect.height, e.clientY - rect.top));
    const p = Math.round((relY / rect.height) * 100);
    setPower(Math.max(10, p));
  };

  // --- RENDER HYPER-REALISTIC BILLIARD TABLE ---
  const render = (ctx) => {
    ctx.clearRect(0, 0, TABLE_WIDTH, TABLE_HEIGHT);
    const s = stateRef.current;

    // 1. Mahogany Hardwood Outer Rails
    const woodGrad = ctx.createLinearGradient(0, 0, TABLE_WIDTH, TABLE_HEIGHT);
    woodGrad.addColorStop(0, '#220e06');
    woodGrad.addColorStop(0.3, '#431e0f');
    woodGrad.addColorStop(0.7, '#301309');
    woodGrad.addColorStop(1, '#150602');
    ctx.fillStyle = woodGrad;
    ctx.beginPath();
    ctx.roundRect(0, 0, TABLE_WIDTH, TABLE_HEIGHT, 24);
    ctx.fill();

    // Polished Brass Table Edge Trim
    ctx.strokeStyle = '#c59b27';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(3, 3, TABLE_WIDTH - 6, TABLE_HEIGHT - 6, 22);
    ctx.stroke();

    // 18 Pearl Diamond Inlays
    ctx.fillStyle = '#f8fafc';
    for (let i = 1; i <= 6; i++) {
      const dx = PLAY_X + PLAY_W * (i / 7);
      drawDiamond(ctx, dx, RAIL_SIZE / 2);
      drawDiamond(ctx, dx, TABLE_HEIGHT - RAIL_SIZE / 2);
    }
    for (let i = 1; i <= 3; i++) {
      const dy = PLAY_Y + PLAY_H * (i / 4);
      drawDiamond(ctx, RAIL_SIZE / 2, dy);
      drawDiamond(ctx, TABLE_WIDTH - RAIL_SIZE / 2, dy);
    }

    // 2. Realistic Felt Cloth with Vignette
    const themes = {
      TOURNAMENT_GREEN: { c1: '#0d5c2e', c2: '#063b1c', cushion: '#094422' },
      ROYAL_BLUE: { c1: '#0d47a1', c2: '#082a66', cushion: '#0a3580' },
      CYBER_DARK: { c1: '#1e293b', c2: '#090d16', cushion: '#0f172a' },
      CRIMSON_RED: { c1: '#881337', c2: '#4c0519', cushion: '#50071c' }
    };
    const th = themes[feltTheme] || themes.TOURNAMENT_GREEN;

    const feltGrad = ctx.createRadialGradient(
      TABLE_WIDTH / 2, TABLE_HEIGHT / 2, 60,
      TABLE_WIDTH / 2, TABLE_HEIGHT / 2, TABLE_WIDTH * 0.58
    );
    feltGrad.addColorStop(0, th.c1);
    feltGrad.addColorStop(1, th.c2);
    ctx.fillStyle = feltGrad;
    ctx.fillRect(PLAY_X, PLAY_Y, PLAY_W, PLAY_H);

    // Beveled Rubber Cushions
    ctx.fillStyle = th.cushion;
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.lineWidth = 1.5;

    CUSHION_SEGMENTS.forEach(seg => {
      ctx.beginPath();
      ctx.moveTo(seg.p1.x, seg.p1.y);
      ctx.lineTo(seg.p2.x, seg.p2.y);
      ctx.stroke();
    });

    // Headstring Line & Spots
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(230, PLAY_Y);
    ctx.lineTo(230, PLAY_Y + PLAY_H);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(230, TABLE_HEIGHT / 2, 2.5, 0, Math.PI * 2);
    ctx.arc(600, TABLE_HEIGHT / 2, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // 6 Leather Drop Pockets with Brass Rims
    let targetPocketGlow = null;
    POCKETS.forEach(p => {
      ctx.fillStyle = '#b48a1c';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius + 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#030407';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius * 0.7, 0, Math.PI * 2);
      ctx.fill();
    });

    // 3. Trajectory Sight Line & Cue Stick (Rendered for BOTH Player & AI so AI aim is visible!)
    if (!s.isShooting && s.cueBall.active && !s.gameOver) {
      const cue = s.cueBall;
      let closestBall = null;
      let minRayDist = 720;

      s.balls.forEach(b => {
        if (!b.active) return;
        const dx = b.x - cue.x;
        const dy = b.y - cue.y;
        const proj = dx * Math.cos(aimAngle) + dy * Math.sin(aimAngle);

        if (proj > 0) {
          const perpDist = Math.abs(-dx * Math.sin(aimAngle) + dy * Math.cos(aimAngle));
          if (perpDist < BALL_RADIUS * 2 && proj < minRayDist) {
            minRayDist = proj;
            closestBall = b;
          }
        }
      });

      // Primary Aim Line
      ctx.strokeStyle = s.turn === 'P2' && s.gameMode === 'VS_AI' ? 'rgba(255, 0, 127, 0.85)' : 'rgba(255, 255, 255, 0.9)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(cue.x, cue.y);
      ctx.lineTo(cue.x + Math.cos(aimAngle) * minRayDist, cue.y + Math.sin(aimAngle) * minRayDist);
      ctx.stroke();
      ctx.setLineDash([]);

      // Ghost Ball & Target Path
      if (closestBall) {
        const hitX = cue.x + Math.cos(aimAngle) * minRayDist;
        const hitY = cue.y + Math.sin(aimAngle) * minRayDist;

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(hitX, hitY, BALL_RADIUS, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        const targetDeflect = Math.atan2(closestBall.y - hitY, closestBall.x - hitX);
        const targetLineLen = 110;

        ctx.strokeStyle = '#ffd600';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(closestBall.x, closestBall.y);
        ctx.lineTo(
          closestBall.x + Math.cos(targetDeflect) * targetLineLen,
          closestBall.y + Math.sin(targetDeflect) * targetLineLen
        );
        ctx.stroke();

        POCKETS.forEach(p => {
          const dx = p.x - closestBall.x;
          const dy = p.y - closestBall.y;
          const dist = Math.hypot(dx, dy);
          const pocketAngle = Math.atan2(dy, dx);
          const angleDiff = Math.abs(pocketAngle - targetDeflect);

          if (dist < 320 && angleDiff < 0.12) {
            targetPocketGlow = p;
          }
        });

        let cueDeflect = targetDeflect + (Math.sin(aimAngle - targetDeflect) > 0 ? -Math.PI / 2 : Math.PI / 2);
        if (spinOffset.y < 0) cueDeflect += Math.PI * 0.18 * Math.abs(spinOffset.y);
        else if (spinOffset.y > 0) cueDeflect -= Math.PI * 0.18 * spinOffset.y;

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(hitX, hitY);
        ctx.lineTo(hitX + Math.cos(cueDeflect) * 45, hitY + Math.sin(cueDeflect) * 45);
        ctx.stroke();
      }

      if (targetPocketGlow) {
        ctx.strokeStyle = '#00ffcc';
        ctx.lineWidth = 3.5;
        ctx.shadowColor = '#00ffcc';
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.arc(targetPocketGlow.x, targetPocketGlow.y, targetPocketGlow.radius + 6, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // Cue Stick Drawing
      let pullDistance = 24 + (power / 100) * 55;
      if (s.cueStrikeAnim) {
        pullDistance = s.cueStrikeAnim.startDist * (1 - s.cueStrikeAnim.progress);
      }

      const cueTipX = cue.x - Math.cos(aimAngle) * pullDistance;
      const cueTipY = cue.y - Math.sin(aimAngle) * pullDistance;
      const cueButtX = cueTipX - Math.cos(aimAngle) * 230;
      const cueButtY = cueTipY - Math.sin(aimAngle) * 230;

      const cueGrad = ctx.createLinearGradient(cueTipX, cueTipY, cueButtX, cueButtY);
      cueGrad.addColorStop(0, '#f5d0a9');
      cueGrad.addColorStop(0.4, '#c28551');
      cueGrad.addColorStop(0.8, '#451a03');
      cueGrad.addColorStop(1, '#1e0c03');

      ctx.strokeStyle = cueGrad;
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(cueTipX, cueTipY);
      ctx.lineTo(cueButtX, cueButtY);
      ctx.stroke();

      const gripX = cueTipX - Math.cos(aimAngle) * 130;
      const gripY = cueTipY - Math.sin(aimAngle) * 130;
      ctx.strokeStyle = s.turn === 'P2' && s.gameMode === 'VS_AI' ? '#ff007f' : '#0f172a';
      ctx.lineWidth = 7.5;
      ctx.beginPath();
      ctx.moveTo(gripX, gripY);
      ctx.lineTo(cueButtX, cueButtY);
      ctx.stroke();

      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.arc(cueTipX, cueTipY, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // 4. Ball-in-Hand Placement Ring
    if ((ballInHand || s.ballInHand) && s.cueBall.active) {
      ctx.strokeStyle = ballInHandValid ? '#00ff66' : '#ff0044';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = ballInHandValid ? '#00ff66' : '#ff0044';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(s.cueBall.x, s.cueBall.y, BALL_RADIUS + 6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // 5. 3D Spherical Object Balls
    s.balls.forEach(b => {
      if (!b.active) return;
      draw3DSphereBall(ctx, b.x, b.y, b.color, b.type, b.num, b.rotMat, b.scale);
    });

    // 6. 3D Glossy Cue Ball
    if (s.cueBall.active) {
      draw3DSphereBall(ctx, s.cueBall.x, s.cueBall.y, '#ffffff', 'CUE', null, s.cueBall.rotMat, s.cueBall.scale);
    }

    // 7. Particle Sparks
    s.particles.forEach(pt => {
      ctx.fillStyle = pt.color;
      ctx.globalAlpha = pt.life / pt.maxLife;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    });
  };

  const drawDiamond = (ctx, x, y) => {
    ctx.beginPath();
    ctx.moveTo(x, y - 3.5);
    ctx.lineTo(x + 3.5, y);
    ctx.lineTo(x, y + 3.5);
    ctx.lineTo(x - 3.5, y);
    ctx.closePath();
    ctx.fill();
  };

  const draw3DSphereBall = (ctx, x, y, color, type, num, rotMat, scale = 1) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    const r = BALL_RADIUS;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.42)';
    ctx.beginPath();
    ctx.ellipse(2, 3, r * 0.95, r * 0.68, 0, 0, Math.PI * 2);
    ctx.fill();

    const sphereGrad = ctx.createRadialGradient(-r * 0.35, -r * 0.35, 1.2, 0, 0, r);
    sphereGrad.addColorStop(0, '#ffffff');
    sphereGrad.addColorStop(0.25, type === 'STRIPE' ? '#f8fafc' : color);
    sphereGrad.addColorStop(0.85, type === 'STRIPE' ? '#cbd5e1' : color);
    sphereGrad.addColorStop(1, '#050505');

    ctx.fillStyle = sphereGrad;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    if (type === 'STRIPE') {
      ctx.save();
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.clip();

      const nx = rotMat[2];
      const ny = rotMat[5];
      const stripeAngle = Math.atan2(ny, nx);

      ctx.rotate(stripeAngle);
      ctx.fillStyle = color;
      ctx.fillRect(-r * 1.2, -r * 0.55, r * 2.4, r * 1.1);
      ctx.restore();
    }

    if (num) {
      const nx = rotMat[6];
      const ny = rotMat[7];
      const nz = rotMat[8];

      if (nz > -0.15) {
        const spotX = nx * r * 0.65;
        const spotY = ny * r * 0.65;
        const spotRadius = r * 0.44 * Math.max(0.2, (nz + 0.3));

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(spotX, spotY, spotRadius, 0, Math.PI * 2);
        ctx.fill();

        if (nz > 0.25) {
          ctx.fillStyle = '#0a0a0f';
          ctx.font = 'bold 8px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(num.toString(), spotX, spotY + 0.5);
        }
      }
    }

    if (type === 'CUE') {
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(0, 0, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  };

  return (
    <div className="pool-master-arena glass-panel">
      <div className="pool-top-nav">
        <button className="btn-secondary" onClick={onLeave}>&larr; HUB</button>

        <div className="game-mode-toggle-group">
          <button
            className={`mode-pill-btn ${gameMode === 'VS_AI' ? 'active' : ''}`}
            onClick={() => setGameMode('VS_AI')}
          >
            🤖 VS AI BOT
          </button>
          <button
            className={`mode-pill-btn ${gameMode === 'TWO_PLAYER' ? 'active' : ''}`}
            onClick={() => setGameMode('TWO_PLAYER')}
          >
            👥 2-PLAYER PASS & PLAY
          </button>
          <button
            className={`mode-pill-btn ${gameMode === 'PRACTICE' ? 'active' : ''}`}
            onClick={() => setGameMode('PRACTICE')}
          >
            🎯 SOLO PRACTICE
          </button>
        </div>

        {gameMode === 'VS_AI' && (
          <div className="ai-difficulty-selector">
            <span className="diff-lbl">AI:</span>
            {['CASUAL', 'PRO', 'MASTER'].map(diff => (
              <button
                key={diff}
                className={`diff-btn ${aiDifficulty === diff ? 'active' : ''}`}
                onClick={() => setAiDifficulty(diff)}
              >
                {diff}
              </button>
            ))}
          </div>
        )}

        <div className="felt-theme-selector">
          <button
            className={`felt-btn green ${feltTheme === 'TOURNAMENT_GREEN' ? 'active' : ''}`}
            onClick={() => setFeltTheme('TOURNAMENT_GREEN')}
            title="Tournament Emerald"
          />
          <button
            className={`felt-btn blue ${feltTheme === 'ROYAL_BLUE' ? 'active' : ''}`}
            onClick={() => setFeltTheme('ROYAL_BLUE')}
            title="Royal Blue"
          />
          <button
            className={`felt-btn dark ${feltTheme === 'CYBER_DARK' ? 'active' : ''}`}
            onClick={() => setFeltTheme('CYBER_DARK')}
            title="Cyber Slate"
          />
          <button
            className={`felt-btn red ${feltTheme === 'CRIMSON_RED' ? 'active' : ''}`}
            onClick={() => setFeltTheme('CRIMSON_RED')}
            title="Crimson Velvet"
          />
        </div>

        <button className="btn-tertiary" onClick={resetRack}>↺ RE-RACK</button>
      </div>

      <div className="pool-pro-scoreboard">
        <div className={`pro-player-card p1 ${turn === 'P1' ? 'active-turn' : ''}`}>
          <div className="p-avatar-wrap">
            <span className="p-avatar">👤</span>
            <div>
              <h4 className="p-name">PLAYER 1</h4>
              <span className="p-suit" style={{ color: '#00f3ff' }}>{p1Type || 'OPEN TABLE'}</span>
            </div>
          </div>
          <div className="p-potted-balls">
            {p1Potted.map(b => (
              <div key={b.id} className="mini-hud-ball" style={{ backgroundColor: b.color }}>
                {b.num}
              </div>
            ))}
          </div>
        </div>

        <div className="pro-match-announcer">
          <span className="match-turn-msg" style={{ color: turn === 'P1' ? '#00f3ff' : '#ff007f' }}>
            {turnMessage}
          </span>
          {ballInHand && (
            <span className="hand-callout">🎱 BALL IN HAND &bull; MOVE & CLICK TABLE TO PLACE</span>
          )}
          {shotStreak > 1 && (
            <span className="streak-badge">🔥 {shotStreak} SHOT STREAK</span>
          )}
        </div>

        <div className={`pro-player-card p2 ${turn === 'P2' ? 'active-turn' : ''}`}>
          <div className="p-avatar-wrap">
            <span className="p-avatar">{gameMode === 'VS_AI' ? '🤖' : '👤'}</span>
            <div>
              <h4 className="p-name">{gameMode === 'VS_AI' ? `AI BOT (${aiDifficulty})` : 'PLAYER 2'}</h4>
              <span className="p-suit" style={{ color: '#ff007f' }}>{p2Type || 'OPEN TABLE'}</span>
            </div>
          </div>
          <div className="p-potted-balls">
            {p2Potted.map(b => (
              <div key={b.id} className="mini-hud-ball" style={{ backgroundColor: b.color }}>
                {b.num}
              </div>
            ))}
          </div>
        </div>
      </div>

      {unlockedBanner && (
        <div className="achievement-toast">
          <span>🏆 UNLOCKED: <strong>{unlockedBanner.title}</strong> (+{unlockedBanner.points} pts)</span>
        </div>
      )}

      <div className="pool-stage-layout">
        <div className="miniclip-power-column">
          <span className="power-tag">POWER</span>
          <div
            ref={powerGaugeRef}
            className="vertical-power-track"
            onMouseMove={(e) => { if (e.buttons === 1) handlePowerDrag(e); }}
            onMouseDown={handlePowerDrag}
          >
            <div className="vertical-power-fill" style={{ height: `${power}%` }} />
            <div className="vertical-cue-slider" style={{ top: `${100 - power}%` }}>
              <div className="slider-grip-line" />
            </div>
          </div>
          <span className="power-num-lbl">{power}%</span>
        </div>

        <div className="pool-table-canvas-wrap">
          <canvas
            ref={canvasRef}
            width={TABLE_WIDTH}
            height={TABLE_HEIGHT}
            className="pool-pro-canvas"
            onMouseMove={handleCanvasMouseMove}
            onMouseDown={handleCanvasMouseDown}
            onMouseUp={handleCanvasMouseUp}
            onContextMenu={(e) => e.preventDefault()}
          />
        </div>

        <div className="fine-tuning-column">
          <span className="tune-tag">FINE AIM</span>
          <div className="tune-buttons-wrap">
            <button
              className="tune-arrow-btn"
              onClick={() => setAimAngle(a => a - 0.006)}
              title="Rotate Counter-Clockwise (Left Arrow)"
              disabled={isShooting || (gameMode === 'VS_AI' && turn === 'P2')}
            >
              ↺
            </button>
            <button
              className="tune-arrow-btn"
              onClick={() => setAimAngle(a => a + 0.006)}
              title="Rotate Clockwise (Right Arrow)"
              disabled={isShooting || (gameMode === 'VS_AI' && turn === 'P2')}
            >
              ↻
            </button>
          </div>
        </div>
      </div>

      <div className="pool-bottom-actions">
        <div className="cue-spin-selector">
          <div className="spin-meta">
            <span className="spin-lbl">CUE SPIN (ENGLISH)</span>
            <span className="spin-sub">Click on ball to set Top/Backspin & Sidespin</span>
          </div>
          <div
            className="spin-ball-widget"
            onClick={(e) => {
              if (isShooting || (gameMode === 'VS_AI' && turn === 'P2')) return;
              const rect = e.currentTarget.getBoundingClientRect();
              const sx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
              const sy = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
              setSpinOffset({
                x: Math.max(-1, Math.min(1, sx)),
                y: Math.max(-1, Math.min(1, sy))
              });
            }}
            title="Click to place chalk point"
          >
            <div
              className="spin-dot-indicator"
              style={{
                left: `${(spinOffset.x + 1) * 50}%`,
                top: `${(spinOffset.y + 1) * 50}%`
              }}
            />
          </div>
          {(spinOffset.x !== 0 || spinOffset.y !== 0) && (
            <button
              className="spin-reset-btn"
              onClick={() => setSpinOffset({ x: 0, y: 0 })}
            >
              RESET SPIN
            </button>
          )}
        </div>

        <div className="strike-actions-wrap">
          <button
            className="btn-primary strike-pro-btn"
            onClick={() => triggerCueStrikeAnimation(aimAngle, power)}
            disabled={isShooting || gameOver || (gameMode === 'VS_AI' && turn === 'P2')}
          >
            🎱 STRIKE CUE BALL ({power}%)
          </button>
        </div>
      </div>

      <p className="pool-pro-hint">
        💡 <strong>Aim:</strong> Move mouse on table or use <strong>← / →</strong> Arrow keys &bull; 
        <strong> Shoot:</strong> Click & drag cue stick back on canvas and release, or click <strong>STRIKE</strong> (Spacebar).
      </p>

      {gameOver && (
        <div className="finish-overlay">
          <h2 className="neon-text" style={{ color: winner === 'PLAYER 1' ? '#00ff66' : '#ff0055' }}>
            🏆 {winner} VICTORY!
          </h2>
          <p style={{ color: '#fff', fontSize: '1.2rem', margin: '10px 0 20px 0' }}>
            {winner === 'PLAYER 1' ? 'Pocketed the 8-Ball masterfully!' : '8-Ball pocketed.'}
          </p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn-primary" onClick={resetRack}>PLAY AGAIN</button>
            <button className="btn-secondary" onClick={onLeave}>BACK TO HUB</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EightBallPoolGame;
