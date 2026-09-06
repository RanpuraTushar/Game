import React, { useState, useEffect, useRef } from 'react';
import soundFX from '../../../utils/SoundEffects';
import { api } from '../../../services/api';
import './CricketBattingGame.css';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 500;

export default function CricketBattingGame({ user, onLeave }) {
  const canvasRef = useRef(null);
  const [gameState, setGameState] = useState('MENU'); // MENU, PLAYING, GAMEOVER
  const [gameMode, setGameMode] = useState('SUPER_OVER'); // SUPER_OVER, BLITZ_3OVERS, SURVIVAL

  const [score, setScore] = useState(0);
  const [wickets, setWickets] = useState(0);
  const [ballsBowled, setBallsBowled] = useState(0);
  const [maxBalls, setMaxBalls] = useState(6);
  const [maxWickets, setMaxWickets] = useState(2);
  const [targetScore, setTargetScore] = useState(0);
  const [ballHistory, setBallHistory] = useState([]);
  const [highScore, setHighScore] = useState(0);
  const [timingFeedback, setTimingFeedback] = useState({ text: 'Time your shot as the ball reaches the crease!', color: '#00f3ff' });
  const [bowlerType, setBowlerType] = useState('Jasprit Bumrah - Express Yorker (148 KM/H)');
  const [shotDistance, setShotDistance] = useState(null);

  // Engine state in ref for 60fps loop
  const engineRef = useRef({
    state: 'IDLE', // RUNUP, DELIVERING, HIT_FLYING, WICKET_CELEBRATE, IDLE
    ball: {
      x: 400, y: 135, z: 20, vx: 0, vy: 0, vz: 0,
      r: 6, rotAngle: 0, bounced: false, curve: 0,
      dustPuff: false, flightProgress: 0, hitElevation: 0
    },
    batsman: {
      x: 400, y: 440,
      stanceTap: 0,
      swingProgress: -1,
      isSwinging: false,
      swingType: 'DRIVE' // DRIVE, PULL, LOFT
    },
    bowler: {
      x: 400, y: 110,
      strideFrame: 0,
      armAngle: 0,
      runupDist: 40
    },
    timingRing: { active: false, radius: 55, maxRadius: 55 },
    particles: [],
    fireworks: [],
    deliveryTime: 0,
    ballDeliveryDuration: 1150, // ms
    deliveryStartTime: 0,
    deliverySpeed: 146.5,
    hitResult: null,
    stumpsHit: false,
    stumpsFly: [
      { x: 392, y: 420, angle: 0, vx: -3, vy: -6 },
      { x: 400, y: 420, angle: 0, vx: 0.5, vy: -8 },
      { x: 408, y: 420, angle: 0, vx: 3.5, vy: -5 }
    ],
    bailsFly: [
      { x: 396, y: 405, angle: 0, vx: -4, vy: -9 },
      { x: 404, y: 405, angle: 0, vx: 4, vy: -9 }
    ]
  });

  // Load high score
  useEffect(() => {
    const saved = localStorage.getItem('cricket_high_score');
    if (saved) setHighScore(parseInt(saved, 10));
  }, []);

  const startGame = (mode) => {
    soundFX.playClick();
    setGameMode(mode);
    setScore(0);
    setWickets(0);
    setBallsBowled(0);
    setBallHistory([]);
    setShotDistance(null);

    if (mode === 'SUPER_OVER') {
      setMaxBalls(6);
      setMaxWickets(2);
      setTargetScore(Math.floor(Math.random() * 10) + 18); // 18-27 target
    } else if (mode === 'BLITZ_3OVERS') {
      setMaxBalls(18);
      setMaxWickets(5);
      setTargetScore(Math.floor(Math.random() * 20) + 48); // 48-67 target
    } else {
      setMaxBalls(999);
      setMaxWickets(3);
      setTargetScore(0);
    }

    setGameState('PLAYING');
    triggerNextBall();
  };

  const triggerNextBall = () => {
    const eng = engineRef.current;
    eng.state = 'RUNUP';
    eng.stumpsHit = false;
    eng.hitResult = null;
    eng.batsman.swingProgress = -1;
    eng.batsman.isSwinging = false;
    eng.bowler.runupDist = 35;
    setShotDistance(null);

    // Realistic delivery variations
    const types = [
      { name: 'Express Inswinging Yorker', speed: 148.8, duration: 1000, curve: -1.8, bounceZ: 8 },
      { name: 'Seaming Outswinger', speed: 142.4, duration: 1120, curve: 2.2, bounceZ: 14 },
      { name: 'Heavy Deck Bouncer', speed: 145.2, duration: 980, curve: 0.2, bounceZ: 26 },
      { name: 'Deceptive Off-Cutter Slower Ball', speed: 118.5, duration: 1350, curve: 2.6, bounceZ: 16 },
      { name: 'Reverse-Swinging Toe-Crusher', speed: 151.2, duration: 950, curve: -2.4, bounceZ: 6 }
    ];
    const picked = types[Math.floor(Math.random() * types.length)];
    setBowlerType(`${picked.name} • ${picked.speed} KM/H`);
    eng.ballDeliveryDuration = picked.duration;
    eng.ballCurve = picked.curve;
    eng.bounceHeight = picked.bounceZ;
    eng.deliverySpeed = picked.speed;

    setTimingFeedback({ text: 'Bowler running in from pavilion end...', color: '#a0aec0' });

    // Stride and bowl run-up
    setTimeout(() => {
      eng.state = 'DELIVERING';
      eng.deliveryStartTime = Date.now();
      eng.ball = {
        x: 400 + (Math.random() * 16 - 8),
        y: 138,
        z: 28,
        vx: 0,
        vy: 0,
        vz: 0,
        r: 6,
        rotAngle: 0,
        bounced: false,
        curve: picked.curve,
        dustPuff: false,
        flightProgress: 0,
        hitElevation: 0
      };
      eng.timingRing = { active: true, radius: 60, maxRadius: 60 };
    }, 750);
  };

  // Bat swing action
  const handleBatSwing = () => {
    const eng = engineRef.current;
    if (eng.state !== 'DELIVERING' || eng.batsman.isSwinging) return;

    soundFX.playSlash();
    eng.batsman.isSwinging = true;
    eng.batsman.swingProgress = 0;

    const now = Date.now();
    const targetArrival = eng.deliveryStartTime + eng.ballDeliveryDuration;
    const diff = now - targetArrival; // negative = early, positive = late
    const absDiff = Math.abs(diff);

    let outcomeRuns = 0;
    let outcomeText = '';
    let outcomeColor = '#fff';
    let isWicket = false;
    let distance = null;

    if (absDiff <= 55) {
      // Sweet Spot - SIXER
      outcomeRuns = 6;
      distance = Math.floor(Math.random() * 25) + 95; // 95 - 120 meters
      outcomeText = `MAXIMUM SIXER!! 🚀 (${distance} METERS)`;
      outcomeColor = '#ff007f';
      soundFX.playBatHit();
      soundFX.playCrowdCheer();
      createHitParticles(eng.ball.x, eng.ball.y, '#ffd600', 40);
      createFireworks();
      eng.batsman.swingType = 'LOFT';
    } else if (absDiff <= 130) {
      // Boundary FOUR
      outcomeRuns = 4;
      distance = Math.floor(Math.random() * 15) + 72;
      outcomeText = `CRACKING SHOT! BOUNDARY FOUR! ⚡ (${distance}M)`;
      outcomeColor = '#00f3ff';
      soundFX.playBatHit();
      soundFX.playCrowdCheer();
      createHitParticles(eng.ball.x, eng.ball.y, '#00f3ff', 30);
      eng.batsman.swingType = 'DRIVE';
    } else if (absDiff <= 210) {
      // Good timing - 2 Runs
      outcomeRuns = 2;
      outcomeText = 'PUSHED INTO THE GAP! 2 RUNS 🏃';
      outcomeColor = '#00ff66';
      soundFX.playBatHit();
      createHitParticles(eng.ball.x, eng.ball.y, '#00ff66', 18);
      eng.batsman.swingType = 'PULL';
    } else if (absDiff <= 300) {
      // Single
      outcomeRuns = 1;
      outcomeText = 'QUICK SINGLE TAKEN! 👟';
      outcomeColor = '#ffd600';
      soundFX.playBatHit();
      eng.batsman.swingType = 'DRIVE';
    } else {
      // Missed or edge
      if (Math.abs(eng.ball.x - 400) < 22) {
        // BOWLED!
        isWicket = true;
        outcomeText = 'BOWLED HIM! STUMPS SHATTERED! 💥';
        outcomeColor = '#e63946';
        eng.stumpsHit = true;
        soundFX.playSnakeBite();
        createHitParticles(400, 425, '#ff3300', 35);
      } else if (Math.random() < 0.5) {
        // CAUGHT BEHIND
        isWicket = true;
        outcomeText = 'EDGED AND TAKEN BY KEEPER! OUT! 🧤';
        outcomeColor = '#e63946';
        soundFX.playBatHit();
        soundFX.playLoss();
      } else {
        outcomeRuns = 0;
        outcomeText = diff < 0 ? 'TOO EARLY ON THE SHOT! DOT BALL ⭕' : 'BEATEN FOR RAW PACE! DOT BALL ⭕';
        outcomeColor = '#a0aec0';
        soundFX.playSafe();
      }
    }

    setShotDistance(distance);
    setTimingFeedback({ text: outcomeText, color: outcomeColor });
    eng.hitResult = { runs: outcomeRuns, isWicket, distance };
    eng.state = 'HIT_FLYING';

    // Update scoreboard
    const newRuns = score + outcomeRuns;
    const newWickets = isWicket ? wickets + 1 : wickets;
    const newBalls = ballsBowled + 1;

    setScore(newRuns);
    setWickets(newWickets);
    setBallsBowled(newBalls);

    const ballBadge = isWicket ? 'W' : outcomeRuns;
    setBallHistory(prev => [...prev, ballBadge]);

    // Advance
    setTimeout(() => {
      if (newWickets >= maxWickets || (gameMode !== 'SURVIVAL' && newBalls >= maxBalls)) {
        handleGameOver(newRuns, targetScore);
      } else if (targetScore > 0 && newRuns > targetScore) {
        handleGameOver(newRuns, targetScore, true);
      } else {
        triggerNextBall();
      }
    }, 2200);
  };

  const handleGameOver = (finalRuns, target, wonEarly = false) => {
    setGameState('GAMEOVER');
    if (finalRuns > highScore) {
      setHighScore(finalRuns);
      localStorage.setItem('cricket_high_score', finalRuns.toString());
      if (user?.id) {
        api.submitScore(user.id, 'CRICKET_CHALLENGE', finalRuns).catch(() => {});
      }
    }
    if (wonEarly || (target > 0 && finalRuns > target)) {
      soundFX.playWinFanfare();
    } else {
      soundFX.playLoss();
    }
  };

  const createHitParticles = (x, y, color, count) => {
    const eng = engineRef.current;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 9 + 3;
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

  const createFireworks = () => {
    const eng = engineRef.current;
    const colors = ['#00f3ff', '#ff007f', '#ffd600', '#00ff66'];
    for (let f = 0; f < 3; f++) {
      const fx = 200 + f * 200;
      const fy = 60 + Math.random() * 40;
      for (let i = 0; i < 25; i++) {
        const angle = Math.random() * Math.PI * 2;
        const spd = Math.random() * 7 + 2;
        eng.fireworks.push({
          x: fx, y: fy,
          vx: Math.cos(angle) * spd,
          vy: Math.sin(angle) * spd,
          alpha: 1,
          color: colors[i % colors.length]
        });
      }
    }
  };

  // Spacebar listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        handleBatSwing();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [score, wickets, ballsBowled, gameState]);

  // ==========================================================
  // REALISTIC CANVAS GRAPHICS & ANIMATION ENGINE
  // ==========================================================
  useEffect(() => {
    let animId;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const render = () => {
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      const eng = engineRef.current;

      // 1. DRAW STADIUM NIGHT SKY & CROWD STANDS
      // Dark atmospheric sky
      const skyGrad = ctx.createLinearGradient(0, 0, 0, 160);
      skyGrad.addColorStop(0, '#040814');
      skyGrad.addColorStop(1, '#0b162b');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, CANVAS_WIDTH, 140);

      // Stadium Upper Roof Cantilever Canopy
      ctx.fillStyle = '#152438';
      ctx.beginPath();
      ctx.moveTo(0, 30);
      ctx.lineTo(CANVAS_WIDTH, 30);
      ctx.lineTo(CANVAS_WIDTH, 65);
      ctx.lineTo(0, 65);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#2b4468';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Stadium Grandstand Spectator Tiers
      ctx.fillStyle = '#0f1d30';
      ctx.fillRect(0, 65, CANVAS_WIDTH, 75);

      // Thousands of cheering spectators (colored dots with camera phone flashes)
      for (let y = 70; y < 135; y += 7) {
        for (let x = 12; x < CANVAS_WIDTH; x += 9) {
          const rand = Math.sin(x * 12.5 + y * 9.3);
          ctx.fillStyle = rand > 0.6 ? '#00f3ff' : rand > 0.2 ? '#ffd600' : rand > -0.2 ? '#ff007f' : '#ffffff';
          ctx.globalAlpha = 0.5 + Math.sin(Date.now() * 0.008 + x + y) * 0.4;
          ctx.fillRect(x, y, 4, 4);
        }
      }
      ctx.globalAlpha = 1.0;

      // 4 Realistic Floodlight Towers with Lens Flare Cones
      const drawFloodlight = (x, y, angle) => {
        // Steel lattice pylon
        ctx.strokeStyle = '#4a6280';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x - 10, y + 45);
        ctx.lineTo(x, y);
        ctx.lineTo(x + 10, y + 45);
        ctx.stroke();

        // Floodlight bank head (6x3 bulbs)
        ctx.fillStyle = '#111e30';
        ctx.fillRect(x - 22, y - 10, 44, 18);
        ctx.strokeStyle = '#60a5fa';
        ctx.strokeRect(x - 22, y - 10, 44, 18);

        // Bright halogen bulbs
        ctx.fillStyle = '#ffffff';
        for (let bx = x - 18; bx <= x + 18; bx += 7) {
          ctx.fillRect(bx, y - 7, 4, 4);
          ctx.fillRect(bx, y, 4, 4);
        }

        // Volumetric Light Cone projecting onto pitch
        const coneGrad = ctx.createRadialGradient(x, y, 5, 400, 300, 420);
        coneGrad.addColorStop(0, 'rgba(255, 255, 255, 0.35)');
        coneGrad.addColorStop(0.5, 'rgba(0, 243, 255, 0.1)');
        coneGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = coneGrad;
        ctx.beginPath();
        ctx.moveTo(x - 20, y);
        ctx.lineTo(x < 400 ? 550 : 250, 480);
        ctx.lineTo(x < 400 ? 150 : 650, 480);
        ctx.closePath();
        ctx.fill();
      };

      drawFloodlight(90, 15, 0.4);
      drawFloodlight(710, 15, -0.4);

      // Electronic LED Boundary Advertising Boards
      ctx.fillStyle = '#060d17';
      ctx.fillRect(0, 135, CANVAS_WIDTH, 14);
      ctx.fillStyle = '#ffd600';
      ctx.font = 'bold 9px Inter, sans-serif';
      ctx.textAlign = 'center';
      const offset = (Date.now() * 0.04) % 300;
      ctx.fillText('⚡ NEONRIFT PREMIER LEAGUE • HIT SIXES • CRICKET PRO 2026 • MAXIMUM DISTANCE ⚡', 400 - offset + 150, 145);

      // 2. DRAW OUTFIELD (Lush green grass with concentric lawnmower stripes)
      const grassGrad = ctx.createLinearGradient(0, 145, 0, CANVAS_HEIGHT);
      grassGrad.addColorStop(0, '#103918');
      grassGrad.addColorStop(0.5, '#164e22');
      grassGrad.addColorStop(1, '#0e3115');
      ctx.fillStyle = grassGrad;
      ctx.fillRect(0, 145, CANVAS_WIDTH, CANVAS_HEIGHT - 145);

      // Concentric mowing arcs
      ctx.strokeStyle = 'rgba(32, 107, 48, 0.35)';
      ctx.lineWidth = 22;
      for (let r = 80; r < 500; r += 45) {
        ctx.beginPath();
        ctx.arc(400, 135, r, 0, Math.PI);
        ctx.stroke();
      }

      // 3. DRAW AUTHENTIC 3D CRICKET PITCH
      // Earthy clay pitch surface with perspective widening
      ctx.beginPath();
      ctx.moveTo(355, 145); // Bowler end top left
      ctx.lineTo(445, 145); // Bowler end top right
      ctx.lineTo(540, 480); // Batting end bottom right
      ctx.lineTo(260, 480); // Batting end bottom left
      ctx.closePath();

      const pitchGrad = ctx.createLinearGradient(0, 145, 0, 480);
      pitchGrad.addColorStop(0, '#a5885c'); // dry clay
      pitchGrad.addColorStop(0.6, '#bca276');
      pitchGrad.addColorStop(1, '#9e8154');
      ctx.fillStyle = pitchGrad;
      ctx.fill();

      // Pitch side borders
      ctx.strokeStyle = '#5a4627';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Pitch wear & footmarks (realistic wear patches)
      ctx.fillStyle = 'rgba(92, 72, 44, 0.4)';
      ctx.beginPath();
      ctx.ellipse(400, 435, 30, 8, 0, 0, Math.PI * 2); // batsman scraping guard mark
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(390, 175, 12, 4, 0, 0, Math.PI * 2); // bowler foothole
      ctx.fill();

      // Official White Crease Markings (Chalk with realistic texture)
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      // Popping crease (batsman end)
      ctx.beginPath();
      ctx.moveTo(275, 428);
      ctx.lineTo(525, 428);
      ctx.stroke();

      // Bowling crease & Return Creases (batsman end)
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(370, 445);
      ctx.lineTo(430, 445);
      ctx.stroke();
      // Return creases
      ctx.beginPath();
      ctx.moveTo(370, 428);
      ctx.lineTo(370, 460);
      ctx.moveTo(430, 428);
      ctx.lineTo(430, 460);
      ctx.stroke();

      // Bowling crease (bowler end)
      ctx.beginPath();
      ctx.moveTo(365, 160);
      ctx.lineTo(435, 160);
      ctx.stroke();

      // 4. DRAW 3D STUMPS & ZING BAILS
      // Bowler End Stumps
      ctx.fillStyle = '#eed9a4';
      ctx.strokeStyle = '#8b5a2b';
      ctx.lineWidth = 1;
      for (let sx = 394; sx <= 406; sx += 6) {
        ctx.fillRect(sx, 142, 3, 16);
      }
      ctx.fillStyle = '#ff6600';
      ctx.fillRect(392, 140, 17, 2); // bail

      // Batsman End Stumps (3D Detailed cylindrical wooden stumps)
      if (!eng.stumpsHit) {
        // Shadow beneath stumps
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.ellipse(400, 435, 18, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        for (let sx = 391; sx <= 409; sx += 9) {
          // Wooden cylinder stump
          const sGrad = ctx.createLinearGradient(sx, 0, sx + 5, 0);
          sGrad.addColorStop(0, '#c79c5e');
          sGrad.addColorStop(0.5, '#f5deb3');
          sGrad.addColorStop(1, '#8b5a2b');
          ctx.fillStyle = sGrad;
          ctx.fillRect(sx, 400, 5, 34);
          ctx.strokeStyle = '#4a2f13';
          ctx.lineWidth = 1;
          ctx.strokeRect(sx, 400, 5, 34);
        }
        // Glowing Zing LED Bails
        ctx.fillStyle = '#ff3300';
        ctx.shadowColor = '#ff6600';
        ctx.shadowBlur = 8;
        ctx.fillRect(389, 397, 24, 3);
        ctx.shadowBlur = 0;
      } else {
        // Exploding Stumps & Flying Bails Animation
        ctx.fillStyle = '#c79c5e';
        eng.stumpsFly.forEach(st => {
          st.x += st.vx;
          st.y += st.vy;
          st.vy += 0.4;
          st.angle += 0.15;
          ctx.save();
          ctx.translate(st.x, st.y);
          ctx.rotate(st.angle);
          ctx.fillRect(-2, -15, 5, 30);
          ctx.restore();
        });
        ctx.fillStyle = '#ff0000';
        ctx.shadowColor = '#ff0000';
        ctx.shadowBlur = 12;
        eng.bailsFly.forEach(b => {
          b.x += b.vx;
          b.y += b.vy;
          b.vy += 0.4;
          ctx.fillRect(b.x, b.y, 8, 3);
        });
        ctx.shadowBlur = 0;
      }

      // 5. DRAW PRO BOWLER (Jasprit Bumrah Style Athletic Bowler)
      if (eng.state === 'RUNUP' || eng.state === 'DELIVERING') {
        const bw = eng.bowler;
        const bY = 128 - (eng.state === 'RUNUP' ? Math.sin(Date.now() * 0.02) * 5 : 0);
        const stride = Math.sin(Date.now() * 0.025);

        ctx.save();
        ctx.translate(bw.x, bY);

        // Bowler shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.ellipse(0, 16, 10, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Bowler legs & shoes
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-4, 0);
        ctx.lineTo(-4 + stride * 5, 14);
        ctx.moveTo(4, 0);
        ctx.lineTo(4 - stride * 5, 14);
        ctx.stroke();

        // Bowler athletic torso & jersey (Team Blue)
        ctx.fillStyle = '#0055ff';
        ctx.fillRect(-6, -14, 12, 16);

        // Bowler head
        ctx.fillStyle = '#8d5524';
        ctx.beginPath();
        ctx.arc(0, -18, 5, 0, Math.PI * 2);
        ctx.fill();

        // Bowling windmill arm
        const armAngle = eng.state === 'RUNUP' ? Date.now() * 0.03 : Math.PI * 0.8;
        ctx.strokeStyle = '#8d5524';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(5, -12);
        ctx.lineTo(5 + Math.cos(armAngle) * 12, -12 + Math.sin(armAngle) * 12);
        ctx.stroke();

        ctx.restore();
      }

      // 6. UPDATE & DRAW 3D CRICKET BALL & SHADOW
      const ball = eng.ball;
      if (eng.state === 'DELIVERING') {
        const elapsed = Date.now() - eng.deliveryStartTime;
        const progress = Math.min(elapsed / eng.ballDeliveryDuration, 1.0);
        ball.flightProgress = progress;

        // Position down the pitch
        ball.y = 145 + progress * 280; // 145 -> 425
        ball.x = 400 + Math.sin(progress * Math.PI) * (eng.ballCurve || 0) * 16;

        // Ball 3D trajectory height Z & bounce
        if (progress < 0.65) {
          // Descending toward bounce point
          ball.z = 24 * (1 - progress / 0.65);
        } else {
          // Rising off pitch bounce
          if (!ball.bounced) {
            ball.bounced = true;
            soundFX.playTokenStep();
            // Dust puff at pitch impact
            createHitParticles(ball.x, ball.y, '#c79c5e', 8);
          }
          const bounceProgress = (progress - 0.65) / 0.35;
          ball.z = Math.sin(bounceProgress * Math.PI * 0.8) * (eng.bounceHeight || 14);
        }

        ball.rotAngle += 0.25;
        ball.r = 4 + progress * 7;

        // Draw dynamic ball shadow on the pitch
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.beginPath();
        ctx.ellipse(ball.x, ball.y, ball.r * 1.1, ball.r * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Timing Ring locking on batsman crease
        if (eng.timingRing.active) {
          eng.timingRing.radius = Math.max(55 * (1 - progress), 6);
          ctx.strokeStyle = progress > 0.85 ? '#ff007f' : '#00f3ff';
          ctx.lineWidth = 3;
          ctx.shadowColor = ctx.strokeStyle;
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.ellipse(400, 428, eng.timingRing.radius * 1.3, eng.timingRing.radius * 0.6, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.shadowBlur = 0;
        }

        // Draw 3D Leather Cricket Ball
        const ballScreenY = ball.y - ball.z;
        ctx.save();
        ctx.translate(ball.x, ballScreenY);
        ctx.rotate(ball.rotAngle);

        // Ball sphere 3D radial shading (Red Kookaburra Ball)
        const bGrad = ctx.createRadialGradient(-ball.r * 0.3, -ball.r * 0.3, 1, 0, 0, ball.r);
        bGrad.addColorStop(0, '#ff4d6d');
        bGrad.addColorStop(0.5, '#c9184a');
        bGrad.addColorStop(1, '#590d22');
        ctx.fillStyle = bGrad;
        ctx.beginPath();
        ctx.arc(0, 0, ball.r, 0, Math.PI * 2);
        ctx.fill();

        // White stitched cricket seam
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.lineWidth = Math.max(ball.r * 0.2, 1.5);
        ctx.setLineDash([2, 2]);
        ctx.beginPath();
        ctx.ellipse(0, 0, ball.r * 0.9, ball.r * 0.25, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();

        // Past crease miss check
        if (progress >= 1.0) {
          handleBatSwing();
        }
      }

      // 7. DRAW PRO 3D BATSMAN MODEL & ANIMATION
      const bm = eng.batsman;
      ctx.save();
      // Batsman stands at crease (X=415, Y=435) in classic right-hand batsman profile
      ctx.translate(bm.x + 28, bm.y);

      // Batsman shadow on turf
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.beginPath();
      ctx.ellipse(-4, 6, 26, 8, 0, 0, Math.PI * 2);
      ctx.fill();

      // Stance Bat Tapping
      if (!bm.isSwinging) {
        bm.stanceTap += 0.08;
      }

      // Swing Progress calculation
      let batAngle = -0.3 + Math.sin(bm.stanceTap) * 0.08;
      let bodyLean = 0;
      let frontFootStep = 0;

      if (bm.isSwinging) {
        bm.swingProgress += 0.09;
        if (bm.swingType === 'LOFT') {
          // Massive lofted follow-through
          batAngle = -0.6 + Math.sin(bm.swingProgress * Math.PI) * 2.8;
          bodyLean = Math.sin(bm.swingProgress * Math.PI) * 6;
          frontFootStep = Math.sin(bm.swingProgress * Math.PI) * 10;
        } else {
          // Crisp cover drive
          batAngle = -0.4 + Math.sin(bm.swingProgress * Math.PI) * 2.2;
          bodyLean = Math.sin(bm.swingProgress * Math.PI) * 4;
        }

        if (bm.swingProgress >= 1.0) {
          bm.isSwinging = false;
        }
      }

      // A. Batting Pads & Legs (White contoured pads with knee rolls)
      const drawPad = (x, y, angle) => {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        // White pad outer
        ctx.fillStyle = '#f8f9fa';
        ctx.strokeStyle = '#ced4da';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(-7, -25, 14, 30, 4);
        ctx.fill();
        ctx.stroke();

        // Horizontal knee rolls
        ctx.fillStyle = '#dee2e6';
        ctx.fillRect(-6, -16, 12, 4);

        // Vertical shin ridges
        ctx.strokeStyle = '#adb5bd';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-2, -10); ctx.lineTo(-2, 4);
        ctx.moveTo(2, -10); ctx.lineTo(2, 4);
        ctx.stroke();

        // Cricket spikes shoe
        ctx.fillStyle = '#212529';
        ctx.fillRect(-6, 4, 14, 5);
        ctx.fillStyle = '#00f3ff'; // neon accent spikes
        ctx.fillRect(-4, 8, 10, 2);
        ctx.restore();
      };

      // Back leg & Front leg
      drawPad(-14, -2, -0.05);
      drawPad(6 + frontFootStep, -2, 0.15);

      // B. Batsman Torso & Team India Royal Blue Jersey
      ctx.save();
      ctx.translate(bodyLean, 0);

      // Jersey body
      const jerseyGrad = ctx.createLinearGradient(-15, -45, 15, -15);
      jerseyGrad.addColorStop(0, '#0052cc');
      jerseyGrad.addColorStop(0.5, '#0066ff');
      jerseyGrad.addColorStop(1, '#003399');
      ctx.fillStyle = jerseyGrad;
      ctx.beginPath();
      ctx.roundRect(-14, -48, 22, 28, 5);
      ctx.fill();

      // Jersey cyber collar & tricolor stripes
      ctx.fillStyle = '#ff9900';
      ctx.fillRect(-12, -48, 4, 3);
      ctx.fillStyle = '#00ff66';
      ctx.fillRect(-8, -48, 4, 3);

      // Player squad number '18' / '07' on back
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('18', -3, -30);

      // C. Cricket Helmet (Detailed Navy helmet with titanium grille)
      // Helmet shell
      ctx.fillStyle = '#0a1931';
      ctx.beginPath();
      ctx.arc(-2, -56, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#00f3ff';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Helmet visor brim
      ctx.fillStyle = '#002244';
      ctx.beginPath();
      ctx.moveTo(-14, -54);
      ctx.lineTo(8, -54);
      ctx.lineTo(6, -51);
      ctx.lineTo(-12, -51);
      ctx.closePath();
      ctx.fill();

      // Metallic Faceguard Grille (titanium wireframe)
      ctx.strokeStyle = '#c0c0c0';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(2, -54, 8, -Math.PI * 0.2, Math.PI * 0.5);
      ctx.moveTo(2, -58); ctx.lineTo(2, -47);
      ctx.moveTo(6, -56); ctx.lineTo(6, -49);
      ctx.stroke();

      // D. Arms, Batting Gloves & English Willow Bat
      // Right & Left Arms in athletic batting grip
      ctx.strokeStyle = '#0066ff';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(-8, -42);
      ctx.lineTo(-2, -26);
      ctx.stroke();

      // Batting Gloves (Padded white sausage fingers with neon thumb)
      ctx.fillStyle = '#f8f9fa';
      ctx.beginPath();
      ctx.arc(-2, -26, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#00ff66';
      ctx.fillRect(-5, -28, 4, 4);

      // ENGLISH WILLOW CRICKET BAT
      ctx.save();
      ctx.translate(-2, -26);
      ctx.rotate(batAngle);

      // Bat Cane Handle (textured rubber grip)
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-3, -16, 6, 16);
      ctx.fillStyle = '#ff007f'; // neon rubber grip spiral
      for (let gy = -14; gy <= -2; gy += 4) {
        ctx.fillRect(-3, gy, 6, 2);
      }

      // Bat Blade (Handcrafted English Willow with wood grain)
      const woodGrad = ctx.createLinearGradient(-6, 0, 6, 42);
      woodGrad.addColorStop(0, '#e8cfad');
      woodGrad.addColorStop(0.5, '#d4b28c');
      woodGrad.addColorStop(1, '#b89369');
      ctx.fillStyle = woodGrad;
      ctx.fillRect(-6, 0, 12, 44);

      // Bat Maker Sticker ("TITAN PRO")
      ctx.fillStyle = '#ff0055';
      ctx.fillRect(-5, 6, 10, 16);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 6px sans-serif';
      ctx.fillText('PRO', 0, 16);

      // Rounded Bat Toe & Edges
      ctx.strokeStyle = '#7c5a35';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-6, 0, 12, 44);

      // Motion blur trail during swing
      if (bm.isSwinging) {
        ctx.fillStyle = 'rgba(0, 243, 255, 0.25)';
        ctx.fillRect(-10, 0, 18, 44);
      }
      ctx.restore(); // restore bat

      ctx.restore(); // restore torso
      ctx.restore(); // restore batsman

      // 8. DRAW FLYING HIT BALL (REAL 3D BALL TRAJECTORY ON CONTACT)
      if (eng.state === 'HIT_FLYING' && eng.hitResult && eng.hitResult.runs > 0) {
        const hr = eng.hitResult;
        const progress = Math.min((Date.now() - (eng.deliveryStartTime + eng.ballDeliveryDuration)) / 1200, 1.0);

        let flyX, flyY, flyScale;
        if (hr.runs === 6) {
          // Massive moon shot high into stadium sky
          flyX = 400 + (Math.sin(Date.now() * 0.005) > 0 ? 1 : -1) * progress * 240;
          flyY = 420 - Math.sin(progress * Math.PI) * 320;
          flyScale = 1 + Math.sin(progress * Math.PI) * 1.5;
        } else {
          // Ground boundary 4
          flyX = 400 + (progress * 300) * (eng.ball.x > 400 ? 1 : -1);
          flyY = 420 - progress * 260;
          flyScale = 1 - progress * 0.5;
        }

        // Laser tracer trail
        ctx.strokeStyle = hr.runs === 6 ? '#ff007f' : '#00f3ff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(400, 420);
        ctx.lineTo(flyX, flyY);
        ctx.stroke();

        // 3D Flying Ball
        ctx.fillStyle = '#ff0055';
        ctx.shadowColor = '#ff0055';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(flyX, flyY, 7 * flyScale, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // 9. DRAW PARTICLES & CELEBRATION FIREWORKS
      for (let i = eng.particles.length - 1; i >= 0; i--) {
        const p = eng.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.025;
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

      for (let i = eng.fireworks.length - 1; i >= 0; i--) {
        const fw = eng.fireworks[i];
        fw.x += fw.vx;
        fw.y += fw.vy;
        fw.alpha -= 0.02;
        if (fw.alpha <= 0) {
          eng.fireworks.splice(i, 1);
          continue;
        }
        ctx.fillStyle = fw.color;
        ctx.globalAlpha = fw.alpha;
        ctx.beginPath();
        ctx.arc(fw.x, fw.y, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1.0;

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div className="cricket-game-container">
      {/* Top Cyber Header */}
      <div className="cricket-header">
        <div className="cricket-title-group">
          <h2>🏏 CYBER CRICKET PRO 2026</h2>
          <p>{bowlerType}</p>
        </div>

        <div className="cricket-scoreboard">
          <div className="score-stat">
            <span className="label">SCORE</span>
            <span className="val">{score}/{wickets}</span>
          </div>
          <div className="score-stat">
            <span className="label">BALLS</span>
            <span className="val">{ballsBowled}{gameMode !== 'SURVIVAL' ? `/${maxBalls}` : ''}</span>
          </div>
          {targetScore > 0 && (
            <div className="score-stat">
              <span className="label">TARGET</span>
              <span className="val target">{targetScore}</span>
            </div>
          )}
          <div className="score-stat">
            <span className="label">BEST</span>
            <span className="val">{highScore}</span>
          </div>
        </div>
      </div>

      {/* Main Pitch View Canvas */}
      <div className="cricket-canvas-wrapper">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="cricket-canvas"
          onClick={handleBatSwing}
        />

        {/* Speed Radar Broadcast HUD */}
        <div style={{
          position: 'absolute', top: 16, right: 16,
          background: 'rgba(5, 12, 28, 0.85)', backdropFilter: 'blur(8px)',
          border: '1px solid rgba(0, 243, 255, 0.3)', borderRadius: 8,
          padding: '6px 12px', fontSize: '0.75rem', fontWeight: 800, color: '#00f3ff'
        }}>
          RADAR: {engineRef.current.deliverySpeed} KM/H
        </div>

        {/* Menu Overlay */}
        {gameState === 'MENU' && (
          <div className="cricket-overlay">
            <h1 className="overlay-title" style={{ color: '#00ff66' }}>CRICKET BATTING PRO</h1>
            <p className="overlay-sub">
              Realistic 3D stadium batting simulator with live Zing LED stumps, dynamic swing physics, and crowd roar!
            </p>

            <div className="mode-select-grid">
              <div className="mode-card" onClick={() => startGame('SUPER_OVER')}>
                <h4>⚡ SUPER OVER</h4>
                <p>Chase target in 6 explosive balls!</p>
              </div>
              <div className="mode-card" onClick={() => startGame('BLITZ_3OVERS')}>
                <h4>🏆 3-OVER BLITZ</h4>
                <p>18-ball tournament sprint</p>
              </div>
              <div className="mode-card" onClick={() => startGame('SURVIVAL')}>
                <h4>🛡️ ENDLESS SURVIVAL</h4>
                <p>Survive with 3 wickets as long as you can</p>
              </div>
            </div>

            <div className="overlay-btn-group">
              <button className="btn-secondary" onClick={onLeave}>EXIT TO HUB</button>
            </div>
          </div>
        )}

        {/* Game Over Overlay */}
        {gameState === 'GAMEOVER' && (
          <div className="cricket-overlay">
            <h1 className="overlay-title" style={{ color: targetScore > 0 && score > targetScore ? '#00ff66' : '#ff007f' }}>
              {targetScore > 0 && score > targetScore ? 'VICTORY! TARGET CHASED! 🏆' : 'INNINGS COMPLETED! 🏏'}
            </h1>
            <div className="overlay-stats">
              <div className="overlay-stat-box">
                <div className="val">{score}</div>
                <div className="lbl">TOTAL RUNS</div>
              </div>
              <div className="overlay-stat-box">
                <div className="val">{ballsBowled > 0 ? ((score / ballsBowled) * 100).toFixed(0) : 0}</div>
                <div className="lbl">STRIKE RATE</div>
              </div>
              <div className="overlay-stat-box">
                <div className="val">{highScore}</div>
                <div className="lbl">BEST SCORE</div>
              </div>
            </div>

            <div className="overlay-btn-group">
              <button className="btn-primary" onClick={() => startGame(gameMode)}>PLAY AGAIN 🔄</button>
              <button className="btn-secondary" onClick={onLeave}>EXIT TO HUB</button>
            </div>
          </div>
        )}
      </div>

      {/* Ball by Ball Timeline Tracker */}
      <div className="cricket-ball-tracker">
        <span className="tracker-title">THIS OVER:</span>
        <div className="tracker-balls">
          {ballHistory.length === 0 && <span style={{ color: '#718096', fontSize: '0.8rem' }}>Waiting for 1st ball...</span>}
          {ballHistory.map((res, idx) => (
            <span key={idx} className={`tracker-ball b-${res.toString().toLowerCase()}`}>
              {res}
            </span>
          ))}
        </div>
      </div>

      {/* Controls and Feedback Bar */}
      <div className="cricket-controls-panel">
        <div className="timing-feedback-card">
          <span className="bowler-info">STATUS / TIMING FEEDBACK:</span>
          <span className="timing-result" style={{ color: timingFeedback.color }}>
            {timingFeedback.text}
          </span>
        </div>

        <button
          className="cricket-swing-btn"
          onClick={handleBatSwing}
          disabled={gameState !== 'PLAYING'}
        >
          <span>🏏</span> SWING BAT (SPACE)
        </button>
      </div>
    </div>
  );
}
