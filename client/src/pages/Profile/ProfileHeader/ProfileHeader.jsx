import { useState } from 'react';
import { useUser } from '../../../contexts/UserContext';
import { authAPI } from '../../../services/api';
import styles from './ProfileHeader.module.css';

const ProfileHeader = ({ user }) => {
  const { updateUser } = useUser();
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const getAvatarUrl = () => {
    if (user.avatarUrl) return user.avatarUrl;
    const initial = user.displayName?.charAt(0).toUpperCase() || 'U';
    return `https://ui-avatars.com/api/?name=${initial}&background=004549&color=f9efa7&size=200`;
  };

  const handleFileSelect = async (file) => {
    if (!file || !file.type.startsWith('image/')) {
      alert('Vui lòng chọn file ảnh hợp lệ!');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('File ảnh không được vượt quá 5MB!');
      return;
    }

    setUploading(true);

    try {
      const response = await authAPI.uploadAvatar(file);
      if (response.success) {
        updateUser({ avatarUrl: response.data.avatarUrl });
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert(error.response?.data?.message || 'Upload ảnh thất bại. Vui lòng thử lại.');
    } finally {
      setUploading(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) handleFileSelect(file);
    };
    input.click();
  };

  return (
    <div className={styles.profileHeader}>
      <div className={styles.headerBackground}>
        <div className={styles.overlay}></div>
      </div>
      
      <div className={styles.headerContent}>
        <div
          className={`${styles.avatarWrapper} ${dragOver ? styles.dragOver : ''} ${uploading ? styles.uploading : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClick}
        >
          <img 
            src={getAvatarUrl()}
            alt={user.displayName}
            className={styles.avatar}
          />
          <div className={styles.avatarOverlay}>
            {uploading ? (
              <div className={styles.spinner}></div>
            ) : (
              <>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  <path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zm0 2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1z" opacity="0.3"/>
                </svg>
                <span>Đổi ảnh</span>
              </>
            )}
          </div>
        </div>
        
        <div className={styles.userInfo}>
          <h1 className={styles.userName}>{user.displayName}</h1>
          <p className={styles.userEmail}>{user.email}</p>
          <div className={styles.userStats}>
            <div className={styles.stat}>
              <span className={styles.statValue}>{user.totalReviews || 0}</span>
              <span className={styles.statLabel}>Đánh giá</span>
            </div>           
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;
