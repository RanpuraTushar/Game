import React, { useState, useEffect, useRef } from 'react';
import { synthRadio } from '../../utils/synthRadioEngine';
import { soundEffects } from '../../utils/SoundEffects';
import './CyberRadio.css';

const STATIONS = [
  { id: 'SYNTHWAVE', name: 'Neon Synthwave 84', icon: '🌆', genre: 'Retrowave' },
  { id: 'CHIPTUNE', name: 'Retro 8-Bit Arcade', icon: '🕹️', genre: 'Chiptune' },
  { id: 'LOFI', name: 'Cyber Chill Lo-Fi', icon: '🌌', genre: 'Chillhop' }
];

export default function CyberRadio() {
  const [radioState, setRadioState] = useState(() => synthRadio.getState());
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const unsub = synthRadio.subscribe((newState) => {
      setRadioState(newState);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
    soundEffects.playClick();
    synthRadio.togglePlay();
  };

  const handleStationSelect = (id) => {
    soundEffects.playClick();
    synthRadio.setStation(id);
    if (!radioState.isPlaying) {
      synthRadio.play();
    }
  };

  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    synthRadio.setVolume(val);
  };

  return (
    <div className="cyber-radio-widget" ref={menuRef}>
      {/* Main Pill Button */}
      <div className={`radio-main-pill ${radioState.isPlaying ? 'is-playing' : ''}`}>
        <button
          type="button"
          className="radio-play-btn"
          onClick={handleToggle}
          title={radioState.isPlaying ? 'Pause Cyber Radio' : 'Play Cyber Radio (BGM)'}
          aria-label="Toggle Radio"
        >
          <span className="radio-btn-icon">{radioState.isPlaying ? '⏸' : '▶'}</span>
        </button>

        <button
          type="button"
          className="radio-channel-btn"
          onClick={() => setShowMenu(!showMenu)}
          title="Change Music Station & Volume"
        >
          <span className="radio-station-icon">{radioState.stationInfo.icon}</span>
          <span className="radio-station-title">{radioState.stationInfo.name}</span>
          
          {/* Animated Equalizer Bars */}
          <div className={`radio-equalizer ${radioState.isPlaying ? 'animating' : ''}`}>
            <span className="eq-bar eq-1" />
            <span className="eq-bar eq-2" />
            <span className="eq-bar eq-3" />
            <span className="eq-bar eq-4" />
          </div>
        </button>
      </div>

      {/* Popover Settings Menu */}
      {showMenu && (
        <div className="radio-popover-menu glass-panel">
          <div className="radio-popover-header">
            <span className="popover-title">📻 CYBER RADIO CHANNELS</span>
            <span className="popover-badge">BGM SYNTH</span>
          </div>

          <div className="radio-stations-list">
            {STATIONS.map((s) => (
              <button
                key={s.id}
                type="button"
                className={`radio-station-item ${radioState.station === s.id ? 'active' : ''}`}
                onClick={() => handleStationSelect(s.id)}
              >
                <span className="station-item-icon">{s.icon}</span>
                <div className="station-item-info">
                  <span className="station-item-name">{s.name}</span>
                  <span className="station-item-genre">{s.genre}</span>
                </div>
                {radioState.station === s.id && radioState.isPlaying && (
                  <span className="station-live-dot" />
                )}
              </button>
            ))}
          </div>

          {/* Volume Slider */}
          <div className="radio-volume-control">
            <span className="vol-icon">{radioState.volume === 0 ? '🔈' : '🔊'}</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={radioState.volume}
              onChange={handleVolumeChange}
              className="radio-volume-slider"
              title="Radio Volume"
            />
            <span className="vol-percent">{Math.round(radioState.volume * 100)}%</span>
          </div>
        </div>
      )}
    </div>
  );
}
