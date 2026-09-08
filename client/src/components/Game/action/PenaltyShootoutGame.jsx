import React, { useState, useEffect, useRef } from 'react';
import soundFX from '../../../utils/SoundEffects';
import { api } from '../../../services/api';
import './PenaltyShootoutGame.css';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 500;

export default function PenaltyShootoutGame({ user, onLeave }) {
  const canvasRef = useRef(null);
  const [gameState, setGameState] = useState('MENU'); // MENU, PLAYING, GAMEOVER
  const [gameMode, setGameMode] = useState('VS_AI'); // VS_AI, TWO_PLAYER
  const [difficulty, setDifficulty] = useState('PRO'); // AMATEUR, PRO, WORLD_CLASS

  // Shootout scores
  const [playerGoals, setPlayerGoals] = useState(0);
  const [cpuGoals, setCpuGoals] = useState(0);
  const [playerPegs, setPlayerPegs] = useState([]); // ['goal', 'miss']
  const [cpuPegs, setCpuPegs] = useState([]);
  const [currentRound, setCurrentRound] = useState(1);
  const [activeKicker, setActiveKicker] = useState('PLAYER'); // PLAYER, CPU, P2
  const [feedbackText, setFeedbackText] = useState('Choose shot aim & power to kick!');
  const [feedbackColor, setFeedbackColor] = useState('#00f3ff');
  const [highScore, setHighScore] = useState(0);

  // Meter states for UI
  const [aimPercent, setAimPercent] = useState(50);
  const [powerPercent, setPowerPercent] = useState(50);
  const [curveDir, setCurveDir] = useState('STRAIGHT'); // LEFT, STRAIGHT, RIGHT

  // Engine state in ref
  const engineRef = useRef({
    step: 'IDLE', // AIM_X, CHARGE_POWER, FLYING, RESOLVED
    aimX: 400,
    aimDir: 1,
    power: 50,
    powerDir: 1,
    ball: { x: 400, y: 430, z: 1, vx: 0, vy: 0, r: 16, targetX: 400, targetY: 170, curve: 0 },
    keeper: { x: 400, y: 190, targetX: 400, targetY: 190, diving: false, diveProgress: 0, width: 50, height: 75 },
    particles: [],
    netRipples: []
  });

  useEffect(() => {
    const saved = localStorage.getItem('penalty_high_score');
    if (saved) setHighScore(parseInt(saved, 10));
  }, []);

  const startGame = (mode, diff = 'PRO') => {
    soundFX.playClick();
    soundFX.playWhistle();
    setGameMode(mode);
    setDifficulty(diff);
    setPlayerGoals(0);
    setCpuGoals(0);
    setPlayerPegs([]);
    setCpuPegs([]);
    setCurrentRound(1);
    setActiveKicker('PLAYER');
    setGameState('PLAYING');
    prepareKick('PLAYER');
  };

  const prepareKick = (kicker) => {
    const eng = engineRef.current;
    eng.ball = { x: 400, y: 430, z: 1, vx: 0, vy: 0, r: 16, targetX: 400, targetY: 170, curve: 0 };
    eng.keeper = { x: 400, y: 190, targetX: 400, targetY: 190, diving: false, diveProgress: 0, width: 50, height: 75 };
    eng.step = 'AIM_X';

    if (kicker === 'CPU') {
      setFeedbackText('CPU Striker preparing penalty shot...');
      setFeedbackColor('#ffd600');
      setTimeout(() => {
        cpuExecuteKick();
      }, 1200);
    } else {
      const pName = kicker === 'P2' ? 'Player 2' : 'Your Turn';
      setFeedbackText(`${pName}: Press KICK or Spacebar to lock AIM!`);
      setFeedbackColor('#00f3ff');
    }
  };

  // Button / Space click action
  const handleKickAction = () => {
    const eng = engineRef.current;
    if (eng.step === 'AIM_X') {
      soundFX.playClick();
      eng.step = 'CHARGE_POWER';
      setFeedbackText('Now lock POWER & ELEVATION!');
      setFeedbackColor('#00ff66');
    } else if (eng.step === 'CHARGE_POWER') {
      executePlayerShot();
    }
  };

  const executePlayerShot = () => {
    const eng = engineRef.current;
    eng.step = 'FLYING';
    soundFX.playBatHit(); // Solid kick thud

    // Determine target location from aimX & power
    const curveOffset = curveDir === 'LEFT' ? -45 : curveDir === 'RIGHT' ? 45 : 0;
    const targetX = eng.aimX + curveOffset;
    // Power determines elevation: 0 power = low grass roller (Y=230), 100 power = top bar/over (Y=100)
    const targetY = 240 - (eng.power / 100) * 135;

    eng.ball.targetX = targetX;
    eng.ball.targetY = targetY;
    eng.ball.startX = eng.ball.x;
    eng.ball.startY = eng.ball.y;
    eng.ball.flightProgress = 0;

    // Trigger Goalkeeper AI dive
    triggerGoalkeeperAI(targetX, targetY);
  };

  const triggerGoalkeeperAI = (ballTargetX, ballTargetY) => {
    const eng = engineRef.current;
    const keeper = eng.keeper;
    keeper.diving = true;
    keeper.diveProgress = 0;

    // AI dive accuracy based on difficulty
    let accuracy = 0.5; // default PRO
    if (difficulty === 'AMATEUR') accuracy = 0.35;
    if (difficulty === 'WORLD_CLASS') accuracy = 0.75;

    const willGuessCorrectly = Math.random() < accuracy;
    if (willGuessCorrectly) {
      keeper.targetX = ballTargetX + (Math.random() * 20 - 10);
      keeper.targetY = ballTargetY + (Math.random() * 20 - 10);
    } else {
      // Dives wrong way
      const wrongDirs = [260, 540, 400];
      keeper.targetX = wrongDirs[Math.floor(Math.random() * wrongDirs.length)];
      keeper.targetY = 150 + Math.random() * 70;
    }
  };

  const cpuExecuteKick = () => {
    const eng = engineRef.current;
    eng.step = 'FLYING';
    soundFX.playBatHit();

    // CPU picks corner target
    const corners = [
      { x: 260, y: 150 }, // Top left
      { x: 540, y: 150 }, // Top right
      { x: 270, y: 220 }, // Bottom left
      { x: 530, y: 220 }, // Bottom right
      { x: 400, y: 160 }  // Down center
    ];
    const target = corners[Math.floor(Math.random() * corners.length)];
    eng.ball.targetX = target.x + (Math.random() * 30 - 15);
    eng.ball.targetY = target.y + (Math.random() * 20 - 10);
    eng.ball.startX = eng.ball.x;
    eng.ball.startY = eng.ball.y;
    eng.ball.flightProgress = 0;

    // Player keeper dive simulation
    triggerGoalkeeperAI(eng.ball.targetX, eng.ball.targetY);
  };

  // Resolve Goal or Save
  const resolveShotOutcome = () => {
    const eng = engineRef.current;
    const { targetX, targetY } = eng.ball;
    const keeper = eng.keeper;

    const distToKeeper = Math.hypot(targetX - keeper.x, targetY - keeper.y);
    let outcome = 'GOAL';

    // Goal bounds: Left post 220, Right post 580, Crossbar 120, Ground 240
    if (targetX < 215 || targetX > 585 || targetY < 115) {
      outcome = 'MISS';
      setFeedbackText('MISSED OFF TARGET! ❌');
      setFeedbackColor('#e63946');
      soundFX.playSnakeBite();
    } else if (distToKeeper < 48) {
      outcome = 'SAVED';
      setFeedbackText('WHAT A SAVE BY GOALKEEPER! 🧤');
      setFeedbackColor('#ffd600');
      soundFX.playSafe();
    } else {
      outcome = 'GOAL';
      setFeedbackText('GOALLLL!! CLINICAL FINISH! ⚽🔥');
      setFeedbackColor('#00ff66');
      soundFX.playCrowdCheer();
      soundFX.playWhistle();
      createGoalParticles(targetX, targetY);
    }

    // Update scoreboard
    const isGoal = outcome === 'GOAL';
    if (activeKicker === 'PLAYER') {
      if (isGoal) setPlayerGoals(g => g + 1);
      setPlayerPegs(p => [...p, isGoal ? 'goal' : 'miss']);
    } else {
      if (isGoal) setCpuGoals(g => g + 1);
      setCpuPegs(p => [...p, isGoal ? 'goal' : 'miss']);
    }

    // Advance round or switch kicker
    setTimeout(() => {
      advanceTurn();
    }, 2000);
  };

  const advanceTurn = () => {
    if (activeKicker === 'PLAYER') {
      const nextKicker = gameMode === 'TWO_PLAYER' ? 'P2' : 'CPU';
      setActiveKicker(nextKicker);
      prepareKick(nextKicker);
    } else {
      // Both took kick in this round
      if (currentRound >= 5 && playerGoals !== cpuGoals) {
        handleMatchEnd();
      } else {
        setCurrentRound(r => r + 1);
        setActiveKicker('PLAYER');
        prepareKick('PLAYER');
      }
    }
  };

  const handleMatchEnd = () => {
    setGameState('GAMEOVER');
    const isWin = playerGoals > cpuGoals;
    if (playerGoals > highScore) {
      setHighScore(playerGoals);
      localStorage.setItem('penalty_high_score', playerGoals.toString());
    }
    if (user?.id) {
      api.submitScore('PENALTY_SHOOTOUT', playerGoals * 100, isWin, user).catch(() => {});
    }
    if (isWin) {
      soundFX.playWinFanfare();
    } else {
      soundFX.playLoss();
    }
  };

  const createGoalParticles = (x, y) => {
    const eng = engineRef.current;
    for (let i = 0; i < 30; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 7 + 2;
      eng.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        alpha: 1,
        color: i % 2 === 0 ? '#00ff66' : '#ffd600',
        size: Math.random() * 4 + 2
      });
    }
  };

  // Keyboard Space listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        handleKickAction();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState]);

  // Main Canvas Render Loop
  useEffect(() => {
    let animId;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const render = () => {
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      const eng = engineRef.current;

      // 1. Draw Realistic Football Stadium Backdrop at Night
      // Night sky with stadium glow
      const skyGrad = ctx.createLinearGradient(0, 0, 0, 160);
      skyGrad.addColorStop(0, '#040914');
      skyGrad.addColorStop(0.7, '#0b1b36');
      skyGrad.addColorStop(1, '#11294d');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, CANVAS_WIDTH, 140);

      // Stadium Upper Roof Cantilever Truss
      ctx.fillStyle = '#172338';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(CANVAS_WIDTH, 0);
      ctx.lineTo(CANVAS_WIDTH, 45);
      ctx.lineTo(0, 45);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#2d4369';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Stadium Grandstand Upper & Lower Deck Spectators
      ctx.fillStyle = '#0d192b';
      ctx.fillRect(0, 45, CANVAS_WIDTH, 90);

      // Thousands of cheering fans with team scarves & camera flashes
      for (let y = 48; y < 132; y += 6) {
        for (let x = 8; x < CANVAS_WIDTH; x += 8) {
          const rand = Math.sin(x * 14.1 + y * 7.7);
          ctx.fillStyle = rand > 0.6 ? '#00f3ff' : rand > 0.2 ? '#ffd600' : rand > -0.2 ? '#ff007f' : '#ffffff';
          ctx.globalAlpha = 0.45 + Math.sin(Date.now() * 0.007 + x + y) * 0.4;
          ctx.fillRect(x, y, 3, 3);
        }
      }
      ctx.globalAlpha = 1.0;

      // 4 Powerful Floodlight Towers with Lens Flare Beams
      const drawFloodlight = (x, y) => {
        // Pylon structure
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x - 12, y + 40);
        ctx.lineTo(x, y);
        ctx.lineTo(x + 12, y + 40);
        ctx.stroke();

        // Floodlight bank head (5x2 high-lux LED matrix)
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(x - 20, y - 8, 40, 16);
        ctx.strokeStyle = '#38bdf8';
        ctx.strokeRect(x - 20, y - 8, 40, 16);

        ctx.fillStyle = '#ffffff';
        for (let bx = x - 15; bx <= x + 15; bx += 7) {
          ctx.fillRect(bx, y - 5, 4, 4);
          ctx.fillRect(bx, y + 2, 4, 4);
        }

        // Volumetric light beam cone illuminating goalmouth
        const coneGrad = ctx.createRadialGradient(x, y, 4, 400, 240, 380);
        coneGrad.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
        coneGrad.addColorStop(0.5, 'rgba(56, 189, 248, 0.08)');
        coneGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = coneGrad;
        ctx.beginPath();
        ctx.moveTo(x - 18, y);
        ctx.lineTo(x < 400 ? 580 : 220, 260);
        ctx.lineTo(x < 400 ? 180 : 620, 260);
        ctx.closePath();
        ctx.fill();
      };

      drawFloodlight(80, 10);
      drawFloodlight(720, 10);

      // Electronic LED Perimeter Advertising Boards along byline
      ctx.fillStyle = '#060d17';
      ctx.fillRect(0, 134, CANVAS_WIDTH, 16);
      ctx.fillStyle = '#ffd600';
      ctx.font = 'bold 9px Inter, sans-serif';
      ctx.textAlign = 'center';
      const boardOffset = (Date.now() * 0.035) % 260;
      ctx.fillText('⚽ WORLD PENALTY CHAMPIONSHIP 2026 • GOLDEN GLOVE PRO • NEONRIFT ARENA • SHOOT TO GLORY ⚽', 400 - boardOffset + 130, 146);

      // 2. Realistic Football Pitch Turf (Perspective alternating cut grass stripes)
      const grassGrad = ctx.createLinearGradient(0, 150, 0, CANVAS_HEIGHT);
      grassGrad.addColorStop(0, '#0f3d1e');
      grassGrad.addColorStop(0.5, '#155229');
      grassGrad.addColorStop(1, '#0c3017');
      ctx.fillStyle = grassGrad;
      ctx.fillRect(0, 150, CANVAS_WIDTH, CANVAS_HEIGHT - 150);

      // Mowed grass bands across pitch
      const bands = [
        { y1: 150, y2: 175, color: 'rgba(28, 97, 49, 0.4)' },
        { y1: 175, y2: 210, color: 'rgba(16, 61, 31, 0.4)' },
        { y1: 210, y2: 255, color: 'rgba(28, 97, 49, 0.4)' },
        { y1: 255, y2: 315, color: 'rgba(16, 61, 31, 0.4)' },
        { y1: 315, y2: 390, color: 'rgba(28, 97, 49, 0.4)' },
        { y1: 390, y2: 500, color: 'rgba(16, 61, 31, 0.4)' }
      ];
      bands.forEach(b => {
        ctx.fillStyle = b.color;
        ctx.fillRect(0, b.y1, CANVAS_WIDTH, b.y2 - b.y1);
      });

      // Perspective Goal Line & Penalty Box Lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.lineWidth = 3;
      // Goal line
      ctx.beginPath();
      ctx.moveTo(120, 240);
      ctx.lineTo(680, 240);
      ctx.stroke();

      // 6-yard box
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(180, 240);
      ctx.lineTo(165, 290);
      ctx.lineTo(635, 290);
      ctx.lineTo(620, 240);
      ctx.stroke();

      // Penalty Spot (X=400, Y=420)
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.beginPath();
      ctx.ellipse(400, 422, 10, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(400, 420, 6, 3, 0, 0, Math.PI * 2);
      ctx.fill();

      // Penalty Arc D-Curve
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(400, 420, 45, -Math.PI * 0.75, -Math.PI * 0.25);
      ctx.stroke();

      // 3. Realistic 3D Goal Structure & Hexagonal Net
      // Goal dimensions: Post Left X=210, Post Right X=590, Crossbar Y=115, Ground Y=240
      // Rear net stanchions project 45px backwards
      const netDepthX1 = 250;
      const netDepthX2 = 550;
      const netDepthY = 90;

      // Net rear backing shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.beginPath();
      ctx.moveTo(210, 115);
      ctx.lineTo(netDepthX1, netDepthY);
      ctx.lineTo(netDepthX2, netDepthY);
      ctx.lineTo(590, 115);
      ctx.lineTo(590, 240);
      ctx.lineTo(560, 230);
      ctx.lineTo(240, 230);
      ctx.lineTo(210, 240);
      ctx.closePath();
      ctx.fill();

      // Hexagonal / Honeycomb Net Weave Grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
      ctx.lineWidth = 1;
      // Net ripple vibration if goal just scored
      const ripple = eng.netRipples && eng.netRipples.length > 0 ? Math.sin(Date.now() * 0.05) * 4 : 0;
      for (let x = 215; x <= 585; x += 18) {
        ctx.beginPath();
        ctx.moveTo(x, 115);
        ctx.lineTo(x + ripple, 240);
        ctx.stroke();
      }
      for (let y = 125; y <= 235; y += 12) {
        ctx.beginPath();
        ctx.moveTo(210, y);
        ctx.lineTo(590, y + (ripple * 0.5));
        ctx.stroke();
      }

      // Net depth top canopy
      for (let x = 210; x <= 590; x += 22) {
        const backX = netDepthX1 + ((x - 210) / 380) * (netDepthX2 - netDepthX1);
        ctx.beginPath();
        ctx.moveTo(x, 115);
        ctx.lineTo(backX, netDepthY);
        ctx.stroke();
      }

      // 3D Tubular Goal Posts (White metallic cylinders with highlights)
      const drawGoalPost = (x1, y1, x2, y2, isCrossbar = false) => {
        ctx.save();
        if (isCrossbar) {
          const pGrad = ctx.createLinearGradient(0, y1 - 4, 0, y1 + 5);
          pGrad.addColorStop(0, '#d1d5db');
          pGrad.addColorStop(0.3, '#ffffff');
          pGrad.addColorStop(0.7, '#f3f4f6');
          pGrad.addColorStop(1, '#9ca3af');
          ctx.fillStyle = pGrad;
          ctx.fillRect(x1, y1 - 4, x2 - x1, 8);
          ctx.strokeStyle = '#4b5563';
          ctx.lineWidth = 1;
          ctx.strokeRect(x1, y1 - 4, x2 - x1, 8);
        } else {
          const pGrad = ctx.createLinearGradient(x1 - 4, 0, x1 + 5, 0);
          pGrad.addColorStop(0, '#9ca3af');
          pGrad.addColorStop(0.4, '#ffffff');
          pGrad.addColorStop(1, '#6b7280');
          ctx.fillStyle = pGrad;
          ctx.fillRect(x1 - 4, y1, 9, y2 - y1);
          ctx.strokeStyle = '#374151';
          ctx.lineWidth = 1;
          ctx.strokeRect(x1 - 4, y1, 9, y2 - y1);
        }
        ctx.restore();
      };

      // Draw posts & crossbar
      drawGoalPost(210, 115, 210, 240); // Left post
      drawGoalPost(590, 115, 590, 240); // Right post
      drawGoalPost(206, 115, 594, 115, true); // Crossbar

      // 4. Update Meters during AIM / POWER step
      if (eng.step === 'AIM_X') {
        eng.aimX += eng.aimDir * 5;
        if (eng.aimX > 570) eng.aimDir = -1;
        if (eng.aimX < 230) eng.aimDir = 1;
        setAimPercent(((eng.aimX - 230) / 340) * 100);

        // Laser Aiming Guide on Goalmouth
        ctx.strokeStyle = '#ff007f';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(eng.aimX, 115);
        ctx.lineTo(eng.aimX, 240);
        ctx.stroke();
        ctx.setLineDash([]);
      } else if (eng.step === 'CHARGE_POWER') {
        eng.power += eng.powerDir * 2.8;
        if (eng.power > 100) eng.powerDir = -1;
        if (eng.power < 0) eng.powerDir = 1;
        setPowerPercent(eng.power);

        // Holographic Reticle target marker
        const curY = 240 - (eng.power / 100) * 125;
        ctx.strokeStyle = '#00ff66';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#00ff66';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(eng.aimX, curY, 15, 0, Math.PI * 2);
        ctx.moveTo(eng.aimX - 20, curY); ctx.lineTo(eng.aimX + 20, curY);
        ctx.moveTo(eng.aimX, curY - 20); ctx.lineTo(eng.aimX, curY + 20);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // 5. Update and Draw Athletic Goalkeeper
      const kp = eng.keeper;
      if (kp.diving) {
        kp.diveProgress = Math.min(kp.diveProgress + 0.065, 1.0);
        kp.x = 400 + (kp.targetX - 400) * kp.diveProgress;
        kp.y = 190 + (kp.targetY - 190) * kp.diveProgress;
      }

      // Draw Pro Goalkeeper Model
      ctx.save();
      const diveAngle = kp.diving ? ((kp.targetX - 400) / 200) * 0.45 * kp.diveProgress : 0;
      ctx.translate(kp.x, kp.y);
      ctx.rotate(diveAngle);

      // Goalkeeper turf shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.beginPath();
      ctx.ellipse(0, 32, 22, 7, 0, 0, Math.PI * 2);
      ctx.fill();

      // Goalie legs & cleats
      // Shorts (Black athletic goalie shorts)
      ctx.fillStyle = '#111827';
      ctx.fillRect(-12, -2, 24, 16);
      ctx.strokeStyle = '#374151';
      ctx.lineWidth = 1;
      ctx.strokeRect(-12, -2, 24, 16);

      // Legs in athletic stance / dive stretch
      const legSpread = kp.diving ? 12 : Math.sin(Date.now() * 0.01) * 3;
      // Left leg
      ctx.fillStyle = '#10b981'; // Green goalie socks
      ctx.fillRect(-10 - legSpread, 14, 7, 16);
      ctx.fillStyle = '#000000'; // Cleats
      ctx.fillRect(-12 - legSpread, 28, 10, 5);
      ctx.fillStyle = '#ffd600'; // Cleat studs
      ctx.fillRect(-10 - legSpread, 33, 7, 2);

      // Right leg
      ctx.fillStyle = '#10b981';
      ctx.fillRect(3 + legSpread, 14, 7, 16);
      ctx.fillStyle = '#000000';
      ctx.fillRect(1 + legSpread, 28, 10, 5);
      ctx.fillStyle = '#ffd600';
      ctx.fillRect(3 + legSpread, 33, 7, 2);

      // Goalkeeper Jersey (Electric High-Vis Neon Lime / Cyber Gold)
      const jerseyGrad = ctx.createLinearGradient(-15, -36, 15, -2);
      jerseyGrad.addColorStop(0, '#10b981');
      jerseyGrad.addColorStop(0.5, '#059669');
      jerseyGrad.addColorStop(1, '#047857');
      ctx.fillStyle = jerseyGrad;
      ctx.beginPath();
      ctx.roundRect(-14, -34, 28, 34, 4);
      ctx.fill();

      // Goalie chest chevron & Squad Number '1'
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(-10, -28, 20, 4);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('1', 0, -12);

      // Goalkeeper Head & Hair
      ctx.fillStyle = '#d97706'; // Hair
      ctx.beginPath();
      ctx.arc(0, -42, 9, Math.PI, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f6d8ae'; // Face skin
      ctx.beginPath();
      ctx.arc(0, -40, 8, 0, Math.PI * 2);
      ctx.fill();
      // Goalie Headband
      ctx.fillStyle = '#111827';
      ctx.fillRect(-8, -43, 16, 3);

      // Goalkeeper Arms & Padded Latex Gloves
      const armExtension = kp.diving ? 18 : 6;
      const armAngleL = kp.diving ? -Math.PI * 0.75 : -Math.PI * 0.35;
      const armAngleR = kp.diving ? -Math.PI * 0.25 : -Math.PI * 0.65;

      // Left Arm & Glove
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(-12, -26);
      ctx.lineTo(-12 + Math.cos(armAngleL) * (20 + armExtension), -26 + Math.sin(armAngleL) * (20 + armExtension));
      ctx.stroke();
      // Glove Left
      const glX = -12 + Math.cos(armAngleL) * (20 + armExtension);
      const glY = -26 + Math.sin(armAngleL) * (20 + armExtension);
      ctx.fillStyle = '#ffffff'; // White latex palm
      ctx.beginPath();
      ctx.arc(glX, glY, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f59e0b'; // Orange finger protectors
      ctx.fillRect(glX - 4, glY - 4, 8, 4);

      // Right Arm & Glove
      ctx.strokeStyle = '#10b981';
      ctx.beginPath();
      ctx.moveTo(12, -26);
      ctx.lineTo(12 + Math.cos(armAngleR) * (20 + armExtension), -26 + Math.sin(armAngleR) * (20 + armExtension));
      ctx.stroke();
      // Glove Right
      const grX = 12 + Math.cos(armAngleR) * (20 + armExtension);
      const grY = -26 + Math.sin(armAngleR) * (20 + armExtension);
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(grX, grY, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(grX - 4, grY - 4, 8, 4);

      ctx.restore();

      // 6. Update and Draw 3D FIFA Match Football & Dynamic Grass Shadow
      const b = eng.ball;
      if (eng.step === 'FLYING') {
        b.flightProgress = Math.min(b.flightProgress + 0.042, 1.0);
        b.x = b.startX + (b.targetX - b.startX) * b.flightProgress;
        b.y = b.startY + (b.targetY - b.startY) * b.flightProgress;
        // Curve spin
        if (eng.curveDir === 'LEFT') b.x -= Math.sin(b.flightProgress * Math.PI) * 28;
        if (eng.curveDir === 'RIGHT') b.x += Math.sin(b.flightProgress * Math.PI) * 28;

        // Ball shrinks realistically with 3D perspective
        b.r = Math.max(16 - b.flightProgress * 8.5, 7.5);

        if (b.flightProgress >= 1.0) {
          eng.step = 'RESOLVED';
          resolveShotOutcome();
        }
      }

      // Ball shadow cast on turf
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.beginPath();
      const shadowY = 420 - (420 - 240) * (b.flightProgress || 0);
      ctx.ellipse(b.x, shadowY, b.r * 1.1, b.r * 0.45, 0, 0, Math.PI * 2);
      ctx.fill();

      // Draw 3D Match Football with rotating pentagons
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate((b.flightProgress || 0) * Math.PI * 4);

      // Ball sphere gradient
      const ballGrad = ctx.createRadialGradient(-b.r * 0.35, -b.r * 0.35, 1, 0, 0, b.r);
      ballGrad.addColorStop(0, '#ffffff');
      ballGrad.addColorStop(0.6, '#e5e7eb');
      ballGrad.addColorStop(1, '#9ca3af');
      ctx.fillStyle = ballGrad;
      ctx.beginPath();
      ctx.arc(0, 0, b.r, 0, Math.PI * 2);
      ctx.fill();

      // Ball seam & pentagonal match patches
      ctx.fillStyle = '#111827';
      ctx.beginPath();
      ctx.arc(0, 0, b.r * 0.4, 0, Math.PI * 2);
      ctx.fill();

      // Accent cyber cyan/gold aerodynamic panel trims
      ctx.strokeStyle = '#00f3ff';
      ctx.lineWidth = Math.max(b.r * 0.15, 1);
      ctx.stroke();

      ctx.restore();

      // 7. Update and Draw Particles & Goal Fireworks
      for (let i = eng.particles.length - 1; i >= 0; i--) {
        const p = eng.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.03;
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
      ctx.globalAlpha = 1.0;

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div className="penalty-game-container">
      {/* Header */}
      <div className="penalty-header">
        <div className="penalty-title-group">
          <h2>⚽ FOOTBALL PENALTY SHOOTOUT</h2>
          <p>Round {currentRound} of 5 • {difficulty} AI Goalkeeper</p>
        </div>

        {/* Scoreboard with score pegs */}
        <div className="shootout-scoreboard">
          <div className="team-score-block">
            <span className="team-name">PLAYER</span>
            <span className="team-goals">{playerGoals}</span>
            <div className="team-pegs">
              {Array.from({ length: 5 }).map((_, idx) => (
                <span key={idx} className={`score-peg ${playerPegs[idx] || ''}`} />
              ))}
            </div>
          </div>

          <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#718096' }}>VS</span>

          <div className="team-score-block">
            <span className="team-name">{gameMode === 'TWO_PLAYER' ? 'PLAYER 2' : 'CPU'}</span>
            <span className="team-goals">{cpuGoals}</span>
            <div className="team-pegs">
              {Array.from({ length: 5 }).map((_, idx) => (
                <span key={idx} className={`score-peg ${cpuPegs[idx] || ''}`} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Stadium Canvas */}
      <div className="penalty-canvas-wrapper">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="penalty-canvas"
          onClick={handleKickAction}
        />

        {/* Menu Overlay */}
        {gameState === 'MENU' && (
          <div className="penalty-overlay">
            <h1 className="overlay-title" style={{ color: '#00ff66' }}>PENALTY SHOOTOUT PRO</h1>
            <p className="overlay-sub">Pick your shot direction, charge power, and beat the goalkeeper!</p>

            <div className="mode-select-grid">
              <div className="mode-card" onClick={() => startGame('VS_AI', 'AMATEUR')}>
                <h4>⭐ AMATEUR</h4>
                <p>Beginner goalkeeper</p>
              </div>
              <div className="mode-card" onClick={() => startGame('VS_AI', 'PRO')}>
                <h4>⚡ PRO LEAGUE</h4>
                <p>Fast reactive goalkeeper</p>
              </div>
              <div className="mode-card" onClick={() => startGame('VS_AI', 'WORLD_CLASS')}>
                <h4>👑 WORLD CLASS</h4>
                <p>Master diving saves</p>
              </div>
            </div>

            <div className="overlay-btn-group">
              <button className="btn-secondary" onClick={onLeave}>EXIT TO HUB</button>
            </div>
          </div>
        )}

        {/* Game Over Overlay */}
        {gameState === 'GAMEOVER' && (
          <div className="penalty-overlay">
            <h1 className="overlay-title" style={{ color: playerGoals > cpuGoals ? '#00ff66' : '#ff007f' }}>
              {playerGoals > cpuGoals ? 'CHAMPION! SHOOTOUT WON! 🏆' : 'SHOOTOUT DEFEAT! 💔'}
            </h1>
            <div className="overlay-stats">
              <div className="overlay-stat-box">
                <div className="val">{playerGoals} - {cpuGoals}</div>
                <div className="lbl">FINAL SCORE</div>
              </div>
              <div className="overlay-stat-box">
                <div className="val">{highScore}</div>
                <div className="lbl">CAREER RECORD</div>
              </div>
            </div>

            <div className="overlay-btn-group">
              <button className="btn-primary" onClick={() => startGame(gameMode, difficulty)}>REMATCH 🔄</button>
              <button className="btn-secondary" onClick={onLeave}>EXIT TO HUB</button>
            </div>
          </div>
        )}
      </div>

      {/* Aim & Power Bar Controls */}
      <div className="penalty-controls-container">
        <div className="aim-power-meters">
          <div className="meter-box">
            <span className="meter-lbl">AIM POSITION:</span>
            <div className="meter-track">
              <div className="meter-fill-aim" style={{ width: `${aimPercent}%` }} />
            </div>
          </div>

          <div className="meter-box">
            <span className="meter-lbl">POWER & ELEVATION:</span>
            <div className="meter-track">
              <div className="meter-fill-power" style={{ width: `${powerPercent}%` }} />
            </div>
          </div>

          <div className="meter-box">
            <span className="meter-lbl">BALL SPIN / CURVE:</span>
            <div className="curve-select-group">
              <button
                className={`curve-btn ${curveDir === 'LEFT' ? 'active' : ''}`}
                onClick={() => setCurveDir('LEFT')}
              >
                ↶ LEFT
              </button>
              <button
                className={`curve-btn ${curveDir === 'STRAIGHT' ? 'active' : ''}`}
                onClick={() => setCurveDir('STRAIGHT')}
              >
                | DIRECT
              </button>
              <button
                className={`curve-btn ${curveDir === 'RIGHT' ? 'active' : ''}`}
                onClick={() => setCurveDir('RIGHT')}
              >
                ↷ RIGHT
              </button>
            </div>
          </div>
        </div>

        <button
          className="penalty-kick-btn"
          onClick={handleKickAction}
          disabled={gameState !== 'PLAYING' || activeKicker !== 'PLAYER'}
        >
          <span>⚽</span> {engineRef.current.step === 'AIM_X' ? 'LOCK AIM' : 'KICK (SPACE)'}
        </button>
      </div>
    </div>
  );
}
