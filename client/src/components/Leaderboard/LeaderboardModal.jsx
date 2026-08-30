import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import './LeaderboardModal.css';

const LeaderboardModal = ({ onClose, defaultGame = 'GLOBAL' }) => {
  const [tab, setTab] = useState(defaultGame);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  const gameTabs = [
    { key: 'GLOBAL', label: '🏆 Global Top' },
    { key: 'TIC_TAC_TOE', label: '❌ Tic-Tac-Toe' },
    { key: 'SNAKE_GAME', label: '🐍 Snake' },
    { key: 'PONG', label: '🏓 Pong' },
    { key: 'CONNECT_4', label: '🔴 Connect-4' },
    { key: 'GAME_2048', label: '🔢 2048' },
    { key: 'FLAPPY_BIRD', label: '🐤 Flappy Bird' },
    { key: 'BRICK_BREAKER', label: '🧱 Brick Breaker' },
    { key: 'WHACK_A_MOLE', label: '🔨 Whack Mole' },
    { key: 'SIMON_SAYS', label: '💡 Simon Says' },
    { key: 'MEMORY_MATCH', label: '🃏 Memory' }
  ];

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const fetchData = async () => {
      let data = [];
      if (tab === 'GLOBAL') {
        const res = await api.getGlobalLeaderboard();
        data = res.leaderboard || [];
      } else {
        const res = await api.getGameLeaderboard(tab);
        data = res.leaderboard || [];
      }
      if (isMounted) {
        setLeaderboard(data);
        setLoading(false);
      }
    };

    fetchData();
    return () => { isMounted = false; };
  }, [tab]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card glass-panel" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="neon-text" style={{ color: '#00f3ff' }}>ARCADE LEADERBOARDS</h2>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        {/* Tab Filters */}
        <div className="leaderboard-tabs-bar">
          {gameTabs.map(t => (
            <button
              key={t.key}
              className={`leaderboard-tab ${tab === t.key ? 'active' : ''}`}
              onClick={() => setTab(t.key)}
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
                  return (
                    <tr key={idx} className={idx < 3 ? 'top-tier' : ''}>
                      <td className="rank-cell">{rankMedal}</td>
                      <td className="player-cell">
                        <span className="player-name">{entry.username}</span>
                      </td>
                      <td className="score-cell">
                        <span className="score-badge">{tab === 'GLOBAL' ? (entry.total_points || 0).toLocaleString() : (entry.score || 0).toLocaleString()}</span>
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
