import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../../services/api';
import { GAMES_LIST } from '../../../../shared/gameMetadata.js';
import { soundEffects } from '../../utils/SoundEffects';
import './LeaderboardModal.css';

const LeaderboardModal = ({ onClose, defaultGame = 'GLOBAL' }) => {
  const [tab, setTab] = useState(defaultGame);
  const [tabSearch, setTabSearch] = useState('');
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  // Dynamic tabs: Global Champions + All Arcade Games from Metadata
  const allGameTabs = useMemo(() => {
    const list = [
      { key: 'GLOBAL', label: '🏆 Global Top', icon: '🏆' }
    ];
    GAMES_LIST.forEach(g => {
      list.push({
        key: g.id,
        label: `${g.icon} ${g.title}`,
        icon: g.icon,
        title: g.title
      });
    });
    return list;
  }, []);

  const visibleTabs = useMemo(() => {
    if (!tabSearch) return allGameTabs;
    const q = tabSearch.toLowerCase();
    return allGameTabs.filter(t => t.label.toLowerCase().includes(q) || t.key.toLowerCase().includes(q));
  }, [allGameTabs, tabSearch]);

  const activeGameInfo = useMemo(() => {
    if (tab === 'GLOBAL') return { title: 'Global Hall of Fame', icon: '🏆' };
    const found = GAMES_LIST.find(g => g.id === tab);
    return found || { title: tab, icon: '🎮' };
  }, [tab]);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const fetchData = async () => {
      let data = [];
      try {
        if (tab === 'GLOBAL') {
          const res = await api.getGlobalLeaderboard();
          data = res.leaderboard || [];
        } else {
          const res = await api.getGameLeaderboard(tab);
          data = res.leaderboard || [];
        }
      } catch (err) {
        data = [];
      }
      if (isMounted) {
        setLeaderboard(data);
        setLoading(false);
      }
    };

    fetchData();
    return () => { isMounted = false; };
  }, [tab]);

  const handleSelectTab = (key) => {
    soundEffects.playClick();
    setTab(key);
  };

  const handleClose = () => {
    soundEffects.playClick();
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={handleClose}>
      <div className="modal-card glass-panel" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-wrap">
            <span className="modal-title-icon">{activeGameInfo.icon}</span>
            <div>
              <h2 className="neon-text" style={{ color: '#00f3ff' }}>ARCADE LEADERBOARDS</h2>
              <span className="modal-subtitle">{activeGameInfo.title}</span>
            </div>
          </div>
          <button className="modal-close-btn" onClick={handleClose}>✕</button>
        </div>

        {/* Tab Search & Quick Filter */}
        <div className="leaderboard-tab-search-bar">
          <span className="tab-search-icon">🔎</span>
          <input
            type="text"
            placeholder="Search game leaderboard..."
            value={tabSearch}
            onChange={(e) => setTabSearch(e.target.value)}
            className="tab-search-input"
          />
          {tabSearch && (
            <button className="tab-search-clear" onClick={() => setTabSearch('')}>✕</button>
          )}
        </div>

        {/* Dynamic Tab Filters */}
        <div className="leaderboard-tabs-bar">
          {visibleTabs.map(t => (
            <button
              key={t.key}
              className={`leaderboard-tab ${tab === t.key ? 'active' : ''}`}
              onClick={() => handleSelectTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Table Content */}
        <div className="leaderboard-table-container">
          {loading ? (
            <div className="leaderboard-loading">CONNECTING TO HIGH SCORE MAINFRAME...</div>
          ) : leaderboard.length === 0 ? (
            <div className="leaderboard-empty">No high scores registered yet. Be the first! 👑</div>
          ) : (
            <table className="leaderboard-table">
              <thead>
                <tr>
                  <th>RANK</th>
                  <th>PLAYER</th>
                  <th>{tab === 'GLOBAL' ? 'POINTS' : 'SCORE'}</th>
                  <th>{tab === 'GLOBAL' ? 'TITLE' : 'STATUS'}</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((entry, idx) => {
                  const rankMedal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`;
                  const tierClass = idx === 0 ? 'top-tier gold-rank' : idx === 1 ? 'top-tier silver-rank' : idx === 2 ? 'top-tier bronze-rank' : '';
                  return (
                    <tr key={idx} className={tierClass}>
                      <td className="rank-cell">
                        <span className="rank-badge">{rankMedal}</span>
                      </td>
                      <td className="player-cell">
                        <span className="player-name">{entry.username}</span>
                      </td>
                      <td className="score-cell">
                        <span className="score-badge">
                          {tab === 'GLOBAL' ? (entry.total_points || 0).toLocaleString() : (entry.score || 0).toLocaleString()}
                        </span>
                      </td>
                      <td className="title-cell">
                        <span className="rank-title">{entry.rank_title || 'Record Holder'}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeaderboardModal;
