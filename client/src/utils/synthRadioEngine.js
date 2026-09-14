// client/src/utils/synthRadioEngine.js
// Procedural Web Audio API Synthwave & Chiptune Radio Engine
// 100% Offline, Zero external assets needed, Authentic retro analog sound!

class SynthRadioEngine {
  constructor() {
    this.ctx = null;
    this.isPlaying = false;
    this.volume = 0.4;
    this.station = 'SYNTHWAVE'; // 'SYNTHWAVE' | 'CHIPTUNE' | 'LOFI'
    this.masterGain = null;
    this.timerId = null;
    this.step = 0;
    this.subscribers = new Set();

    // Scale frequencies (in Hz)
    this.NOTES = {
      C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.00, A3: 220.00, B3: 246.94,
      C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00, B4: 493.88,
      C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.00
    };

    // Sequences for each station
    this.PATTERNS = {
      SYNTHWAVE: {
        tempo: 125,
        bass: ['A3', 'A3', 'F3', 'F3', 'C3', 'C3', 'G3', 'G3'],
        arp: [
          'A4', 'C5', 'E5', 'A5', 'F4', 'A4', 'C5', 'F5',
          'C4', 'E4', 'G4', 'C5', 'G4', 'B4', 'D5', 'G5'
        ],
        waveType: 'sawtooth',
        filterFreq: 1800
      },
      CHIPTUNE: {
        tempo: 145,
        bass: ['C3', 'G3', 'A3', 'F3', 'C3', 'G3', 'A3', 'E3'],
        arp: [
          'C5', 'E5', 'G5', 'C5', 'G4', 'B4', 'D5', 'G5',
          'A4', 'C5', 'E5', 'A5', 'F4', 'A4', 'C5', 'F5'
        ],
        waveType: 'square',
        filterFreq: 3200
      },
      LOFI: {
        tempo: 84,
        bass: ['D3', 'D3', 'G3', 'G3', 'C3', 'C3', 'A3', 'A3'],
        arp: [
          'F4', 'A4', 'C5', 'E5', 'B4', 'D5', 'F5', 'A5',
          'E4', 'G4', 'B4', 'D5', 'C4', 'E4', 'G4', 'B4'
        ],
        waveType: 'triangle',
        filterFreq: 850
      }
    };
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  notify() {
    this.subscribers.forEach(fn => fn(this.getState()));
  }

  getState() {
    return {
      isPlaying: this.isPlaying,
      volume: this.volume,
      station: this.station,
      stationInfo: this.getStationInfo()
    };
  }

  getStationInfo() {
    switch (this.station) {
      case 'CHIPTUNE':
        return { name: 'Retro 8-Bit Arcade', icon: '🕹️', genre: 'Chiptune' };
      case 'LOFI':
        return { name: 'Cyber Chill Lo-Fi', icon: '🌌', genre: 'Chillhop' };
      default:
        return { name: 'Neon Synthwave 84', icon: '🌆', genre: 'Retrowave' };
    }
  }

  togglePlay() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  play() {
    this.init();
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.step = 0;
    this.scheduleNotes();
    this.notify();
  }

  pause() {
    this.isPlaying = false;
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    this.notify();
  }

  setStation(station) {
    if (this.PATTERNS[station]) {
      this.station = station;
      this.step = 0;
      this.notify();
    }
  }

  nextStation() {
    const list = Object.keys(this.PATTERNS);
    const nextIdx = (list.indexOf(this.station) + 1) % list.length;
    this.setStation(list[nextIdx]);
  }

  setVolume(val) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
    this.notify();
  }

  scheduleNotes() {
    if (!this.isPlaying || !this.ctx) return;

    const pattern = this.PATTERNS[this.station];
    const stepDuration = (60 / pattern.tempo) / 4; // 16th note

    // 1. Play Bass Note on beats
    if (this.step % 4 === 0) {
      const bassIdx = (this.step / 4) % pattern.bass.length;
      const noteName = pattern.bass[bassIdx];
      const freq = this.NOTES[noteName] || 130;
      this.triggerBass(freq, stepDuration * 3.5, pattern.waveType);
    }

    // 2. Play Arpeggio Note on 16th steps
    const arpIdx = this.step % pattern.arp.length;
    const arpNote = pattern.arp[arpIdx];
    const arFreq = this.NOTES[arpNote] || 440;
    this.triggerLead(arFreq, stepDuration * 0.85, pattern.waveType, pattern.filterFreq);

    // 3. Play Subtle Drum/Noise Beat
    if (this.step % 4 === 2) {
      // Snare / Clap on beat 2 & 4
      this.triggerSnare(stepDuration * 1.5);
    } else if (this.step % 2 === 0) {
      // Hi-hat on 8ths
      this.triggerHiHat(stepDuration * 0.5);
    }

    this.step = (this.step + 1) % 64;

    this.timerId = setTimeout(() => {
      this.scheduleNotes();
    }, stepDuration * 1000);
  }

  triggerBass(freq, duration, waveType) {
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = waveType === 'square' ? 'square' : 'sawtooth';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.35, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) { }
  }

  triggerLead(freq, duration, waveType, filterFreq) {
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = waveType;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(filterFreq || 2000, this.ctx.currentTime);
      filter.Q.setValueAtTime(4, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) { }
  }

  triggerSnare(duration) {
    try {
      // Noise buffer for snare
      const bufferSize = this.ctx.sampleRate * 0.1;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(1000, this.ctx.currentTime);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      noise.start();
      noise.stop(this.ctx.currentTime + duration);
    } catch (e) { }
  }

  triggerHiHat(duration) {
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(8000, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) { }
  }
}

export const synthRadio = new SynthRadioEngine();
