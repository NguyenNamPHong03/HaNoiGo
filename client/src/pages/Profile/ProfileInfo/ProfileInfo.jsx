import { useState } from 'react';
import { useUser } from '../../../contexts/UserContext';
import { authAPI } from '../../../services/api';
import styles from './ProfileInfo.module.css';

const ProfileInfo = ({ user, onUpdateSuccess }) => {
  const { updateUser } = useUser();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    displayName: user.displayName || '',
    avatarUrl: user.avatarUrl || ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.displayName.trim()) {
      alert('Tên hiển thị không được để trống!');
      return;
    }

    setLoading(true);

    try {
      const response = await authAPI.updateProfile({
        displayName: formData.displayName,
        avatarUrl: formData.avatarUrl,
        preferences: user.preferences
      });

      if (response.success) {
        updateUser(response.data);
        setIsEditing(false);
        onUpdateSuccess();
      }
    } catch (error) {
      console.error('Update error:', error);
      alert(error.response?.data?.message || 'Cập nhật thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      displayName: user.displayName || '',
      avatarUrl: user.avatarUrl || ''
    });
    setIsEditing(false);
  };

  return (
    <div className={styles.profileInfo}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Thông tin cơ bản</h2>
        {!isEditing && (
          <button 
            onClick={() => setIsEditing(true)}
            className={styles.editBtn}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
            </svg>
            Chỉnh sửa
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label className={styles.label}>Tên hiển thị</label>
          {isEditing ? (
            <input
              type="text"
              name="displayName"
              value={formData.displayName}
              onChange={handleChange}
              className={styles.input}
              placeholder="Nhập tên hiển thị..."
              required
            />
          ) : (
            <div className={styles.value}>{user.displayName}</div>
          )}
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Email</label>
          <div className={`${styles.value} ${styles.disabled}`}>
            {user.email}
            <span className={styles.badge}>Không thể thay đổi</span>
          </div>
        </div>

        {isEditing && (
          <div className={styles.actions}>
            <button
              type="button"
              onClick={handleCancel}
              className={`${styles.btn} ${styles.btnSecondary}`}
              disabled={loading}
            >
              Hủy
            </button>
            <button
              type="submit"
              className={`${styles.btn} ${styles.btnPrimary}`}
              disabled={loading}
            >
              {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default ProfileInfo;
