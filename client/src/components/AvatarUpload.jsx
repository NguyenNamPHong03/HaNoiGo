import { useRef, useState } from 'react';
import { authAPI } from '../services/api';
import styles from './AvatarUpload.module.css';

function AvatarUpload({ currentAvatar, onAvatarChange, onUploadStart, onUploadEnd }) {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

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
    onUploadStart && onUploadStart();

    try {
      const response = await authAPI.uploadAvatar(file);
      if (response.success) {
        onAvatarChange(response.data.avatarUrl);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert(error.response?.data?.message || 'Upload ảnh thất bại. Vui lòng thử lại.');
    } finally {
      setUploading(false);
      onUploadEnd && onUploadEnd();
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
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const getAvatarUrl = () => {
    if (currentAvatar) return currentAvatar;
    return 'https://ui-avatars.com/api/?name=U&background=ef4444&color=ffffff&size=120';
  };

  return (
    <div className={styles.container}>
      <div
        className={`${styles.uploadArea} ${dragOver ? styles.dragOver : ''} ${uploading ? styles.uploading : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <div className={styles.avatarContainer}>
          <img 
            src={getAvatarUrl()}
            alt="Avatar" 
            className={styles.avatar}
          />
          {uploading && (
            <div className={styles.uploadingOverlay}>
              <div className={styles.spinner}></div>
            </div>
          )}
        </div>
        
        <div className={styles.uploadText}>
          {uploading ? (
            <span>Đang tải lên...</span>
          ) : (
            <>
              <span className={styles.primaryText}>
                Kéo thả ảnh vào đây hoặc click để chọn
              </span>
              <span className={styles.secondaryText}>
                PNG, JPG, GIF tối đa 5MB
              </span>
            </>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileInputChange}
          className={styles.hiddenInput}
        />
      </div>
    </div>
  );
}

export default AvatarUpload;