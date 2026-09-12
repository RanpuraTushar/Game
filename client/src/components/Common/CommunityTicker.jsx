import React, { useState, useEffect } from 'react';
import { COMMUNITY_EVENTS } from '../../utils/portalEconomy';
import './CommunityTicker.css';

const CommunityTicker = () => {
  const [events, setEvents] = useState(COMMUNITY_EVENTS);

  // Slowly shuffle or add fresh pulses
  useEffect(() => {
    const interval = setInterval(() => {
      setEvents(prev => {
        const copy = [...prev];
        const first = copy.shift();
        copy.push(first);
        return copy;
      });
    }, 7000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="community-ticker-wrapper">
      <div className="ticker-label">
        <span className="live-dot" />
        <span className="ticker-label-text">LIVE PULSE</span>
      </div>

      <div className="ticker-track">
        <div className="ticker-marquee-inner">
          {events.map((ev, i) => (
            <div key={`${ev.id}-${i}`} className="ticker-pill">
              <span className="ticker-pill-icon">{ev.icon}</span>
              <span className="ticker-pill-text">{ev.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CommunityTicker;
