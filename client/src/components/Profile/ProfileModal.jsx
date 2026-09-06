import React, { useState } from 'react';
import { api } from '../../services/api';
import './ProfileModal.css';

const AVATAR_OPTIONS = ['👤', '🤖', '⚡', '👑', '🎯', '🚀', '🐉', '🐱', '🦊', '🥋', '🥷', '👾'];

const ProfileModal = ({ user, onClose, onUpdateUser }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState(user?.username || '');
  const [email, setEmail] = useState(user?.email || '');
  const [avatar, setAvatar] = useState(user?.avatar || '👤');
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });

  const handleSave = async (e) => {
    e?.preventDefault();
    if (!username.trim()) {
      setStatusMsg({ type: 'error', text: 'Username cannot be empty!' });
      return;
    }

    setLoading(true);
    setStatusMsg({ type: '', text: '' });

    try {
      const res = await api.updateProfile({
        id: user.id,
        username: username.trim(),
        email: email.trim(),
        avatar: avatar
      });

      if (res.success && res.user) {
        const updatedUser = {
          ...user,
          ...res.user
        };
        onUpdateUser(updatedUser);
        setStatusMsg({ type: 'success', text: '✓ Profile updated successfully!' });
        setTimeout(() => {
          setIsEditing(false);
          setStatusMsg({ type: '', text: '' });
        }, 1200);
      } else {
        // Fallback local update if network is local-only
        const updatedUser = {
          ...user,
          username: username.trim(),
          email: email.trim(),
          avatar: avatar
        };
        onUpdateUser(updatedUser);
        setStatusMsg({ type: 'success', text: '✓ Profile updated locally!' });
        setTimeout(() => {
          setIsEditing(false);
          setStatusMsg({ type: '', text: '' });
        }, 1200);
      }
    } catch (err) {
      console.error('Error updating user profile:', err);
      // Still apply local update for smooth offline experience
      const updatedUser = {
        ...user,
        username: username.trim(),
        email: email.trim(),
        avatar: avatar
      };
      onUpdateUser(updatedUser);
      setStatusMsg({ type: 'success', text: '✓ Profile updated locally!' });
      setTimeout(() => {
        setIsEditing(false);
        setStatusMsg({ type: '', text: '' });
      }, 1200);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setUsername(user?.username || '');
    setEmail(user?.email || '');
    setAvatar(user?.avatar || '👤');
    setStatusMsg({ type: '', text: '' });
    setIsEditing(false);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card profile-modal-card glass-panel" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div className="profile-header-title">
            <span className="profile-badge-icon">👤</span>
            <div>
              <h2 className="neon-text" style={{ color: '#00f3ff', margin: 0 }}>
                {isEditing ? 'EDIT YOUR INFO' : 'PLAYER PROFILE'}
              </h2>
              <span className="profile-member-tag">MEMBER ID: #00{user?.id || 1}</span>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        {/* Status Message Banner */}
        {statusMsg.text && (
          <div className={`profile-status-banner ${statusMsg.type}`}>
            {statusMsg.text}
          </div>
        )}

        <div className="profile-modal-body">
          {/* Avatar Showcase */}
          <div className="profile-avatar-showcase">
            <div className="profile-avatar-ring">
              <span className="profile-avatar-large">{avatar}</span>
            </div>
            {!isEditing && (
              <div className="profile-quick-meta">
                <h3 className="profile-display-name">{user?.username || 'Player'}</h3>
                <span className="profile-rank-badge">⚡ ACTIVE PILOT</span>
              </div>
            )}
          </div>

          {!isEditing ? (
            /* VIEW MODE */
            <div className="profile-view-mode">
              <div className="profile-info-grid">
                <div className="profile-info-item">
                  <span className="info-label">👤 USERNAME</span>
                  <span className="info-val">{user?.username || 'Pilot'}</span>
                </div>

                <div className="profile-info-item">
                  <span className="info-label">✉️ EMAIL ADDRESS</span>
                  <span className="info-val">{user?.email || 'Not provided'}</span>
                </div>

                <div className="profile-info-item">
                  <span className="info-label">🆔 PLAYER ID</span>
                  <span className="info-val">#{user?.id || 1}</span>
                </div>

                <div className="profile-info-item">
                  <span className="info-label">🛡️ ACCOUNT STATUS</span>
                  <span className="info-val text-green">Verified Gamer</span>
                </div>
              </div>

              <div className="profile-action-footer">
                <button 
                  type="button" 
                  className="btn-primary btn-edit-profile"
                  onClick={() => setIsEditing(true)}
                >
                  <span>✏️</span> EDIT INFO
                </button>
              </div>
            </div>
          ) : (
            /* EDIT MODE */
            <form onSubmit={handleSave} className="profile-edit-form">
              {/* Avatar Selector Grid */}
              <div className="form-field-group">
                <label className="field-label">CHOOSE AVATAR ICON:</label>
                <div className="avatar-selection-grid">
                  {AVATAR_OPTIONS.map((icon, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className={`avatar-pick-btn ${avatar === icon ? 'selected' : ''}`}
                      onClick={() => setAvatar(icon)}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              {/* Username Input */}
              <div className="form-field-group">
                <label className="field-label">USERNAME:</label>
                <input
                  type="text"
                  className="profile-text-input"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  maxLength={24}
                  required
                />
              </div>

              {/* Email Input */}
              <div className="form-field-group">
                <label className="field-label">EMAIL ADDRESS:</label>
                <input
                  type="email"
                  className="profile-text-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                />
              </div>

              {/* Save & Cancel Buttons */}
              <div className="edit-buttons-row">
                <button 
                  type="submit" 
                  className="btn-primary btn-save-profile"
                  disabled={loading}
                >
                  {loading ? 'SAVING...' : '💾 SAVE CHANGES'}
                </button>
                <button 
                  type="button" 
                  className="btn-secondary btn-cancel-profile"
                  onClick={handleCancel}
                  disabled={loading}
                >
                  CANCEL
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
