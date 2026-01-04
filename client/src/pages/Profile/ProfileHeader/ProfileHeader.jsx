import { Check } from 'lucide-react';
import { useState } from 'react';
import { useUser } from '../../../contexts/UserContext';
import { authAPI } from '../../../services/api';
import styles from './ProfileHeader.module.css';

const ProfileHeader = ({ user }) => {
  const { updateUser } = useUser();
  const [uploading, setUploading] = useState(false);

  const getAvatarUrl = () => {
    if (user.avatarUrl) return user.avatarUrl;
    const initial = user.displayName?.charAt(0).toUpperCase() || 'U';
    return `https://ui-avatars.com/api/?name=${initial}&background=004549&color=f9efa7&size=200`;
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
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
        if (response.data.user) {
          updateUser(response.data.user);
        } else {
          updateUser({ avatarUrl: response.data.avatarUrl });
        }
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload ảnh thất bại.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* Banner */}
      <div className={styles.banner}>
        <div className={styles.bannerOverlay} />
      </div>

      {/* Profile Bar */}
      <div className={styles.profileBar}>
        <div className={styles.mainInfo}>
          {/* Avatar */}
          <div className={styles.avatarWrapper}>
            <img
              src={getAvatarUrl()}
              alt={user.displayName}
              className={styles.avatar}
            />
            {uploading && <div className={styles.spinner} />}
            <div className={styles.verifiedBadge}>
              <Check size={12} color="white" strokeWidth={4} />
            </div>

            <label className={styles.uploadTrigger}>
              <input type="file" onChange={handleFileSelect} accept="image/*" hidden />
            </label>
          </div>

          {/* Texts */}
          <div className={styles.textInfo}>
            <div className={styles.nameRow}>
              <h1 className={styles.name}>{user.displayName}</h1>
              <span className={styles.statusDot}></span>
            </div>
            <p className={styles.headline}>Tôi Yêu Hà Nội.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;
