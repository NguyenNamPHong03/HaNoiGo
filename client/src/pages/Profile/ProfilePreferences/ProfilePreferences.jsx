import { useState } from 'react';
import { useUser } from '../../../contexts/UserContext';
import { authAPI } from '../../../services/api';
import styles from './ProfilePreferences.module.css';

const STYLE_OPTIONS = [
  { value: 'modern', label: 'Hiện đại', color: '#3b82f6' },
  { value: 'traditional', label: 'Truyền thống', color: '#ef4444' },
  { value: 'cozy', label: 'Ấm cúng', color: '#f59e0b' },
  { value: 'elegant', label: 'Thanh lịch', color: '#8b5cf6' },
  { value: 'casual', label: 'Giản dị', color: '#10b981' },
  { value: 'upscale', label: 'Cao cấp', color: '#ec4899' }
];

const DIETARY_OPTIONS = [
  { value: 'vegetarian', label: 'Chay', color: '#22c55e' },
  { value: 'vegan', label: 'Thuần chay', color: '#84cc16' },
  { value: 'non-vegetarian', label: 'Ăn mặn', color: '#ef4444' },
  { value: 'healthy', label: 'Ăn healthy', color: '#10b981' },
  { value: 'low-spicy', label: 'Ít cay', color: '#f59e0b' },
  { value: 'low-fat', label: 'Ít dầu mỡ', color: '#06b6d4' },
  { value: 'low-carb', label: 'Ít tinh bột', color: '#a855f7' }
];

const ProfilePreferences = ({ user, onUpdateSuccess }) => {
  const { updateUser } = useUser();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    favoriteFoods: user.preferences?.favoriteFoods || [],
    styles: user.preferences?.styles || [],
    dietary: user.preferences?.dietary || []
  });
  const [newFood, setNewFood] = useState('');

  const handleAddFood = () => {
    if (newFood.trim() && !formData.favoriteFoods.includes(newFood.trim())) {
      setFormData(prev => ({
        ...prev,
        favoriteFoods: [...prev.favoriteFoods, newFood.trim()]
      }));
      setNewFood('');
    }
  };

  const handleRemoveFood = (index) => {
    setFormData(prev => ({
      ...prev,
      favoriteFoods: prev.favoriteFoods.filter((_, i) => i !== index)
    }));
  };

  const handleToggleStyle = (value) => {
    setFormData(prev => ({
      ...prev,
      styles: prev.styles.includes(value)
        ? prev.styles.filter(s => s !== value)
        : [...prev.styles, value]
    }));
  };

  const handleToggleDietary = (value) => {
    setFormData(prev => ({
      ...prev,
      dietary: prev.dietary.includes(value)
        ? prev.dietary.filter(d => d !== value)
        : [...prev.dietary, value]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await authAPI.updateProfile({
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        preferences: formData
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
      favoriteFoods: user.preferences?.favoriteFoods || [],
      styles: user.preferences?.styles || [],
      dietary: user.preferences?.dietary || []
    });
    setIsEditing(false);
  };

  return (
    <div className={styles.profilePreferences}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Cá nhân hóa</h2>
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
        {/* Favorite Foods */}
        <div className={styles.preferenceGroup}>
          <h3 className={styles.groupTitle}>MÓN ĂN YÊU THÍCH</h3>
          {isEditing ? (
            <>
              <div className={styles.inputGroup}>
                <input
                  type="text"
                  value={newFood}
                  onChange={(e) => setNewFood(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddFood())}
                  className={styles.input}
                  placeholder="Thêm món ăn... (ví dụ: Phở, Bún chả)"
                />
                <button
                  type="button"
                  onClick={handleAddFood}
                  className={styles.addBtn}
                >
                  Thêm
                </button>
              </div>
              <div className={styles.tags}>
                {formData.favoriteFoods.map((food, index) => (
                  <span key={index} className={`${styles.tag} ${styles.optionActive}`}>
                    {food}
                    <button
                      type="button"
                      onClick={() => handleRemoveFood(index)}
                      className={styles.removeTag}
                    >
                      ×
                    </button>
                  </span>
                ))}
                {formData.favoriteFoods.length === 0 && (
                  <span className={styles.emptyText}>Chưa có món ăn nào</span>
                )}
              </div>
            </>
          ) : (
            <div className={styles.tags}>
              {user.preferences?.favoriteFoods?.length > 0 ? (
                user.preferences.favoriteFoods.map((food, index) => (
                  <span key={index} className={`${styles.tag} ${styles.optionActive}`}>{food}</span>
                ))
              ) : (
                <span className={styles.emptyText}>Chưa thiết lập</span>
              )}
            </div>
          )}
        </div>

        {/* Styles */}
        <div className={styles.preferenceGroup}>
          <h3 className={styles.groupTitle}>PHONG CÁCH YÊU THÍCH</h3>
          <div className={styles.optionsGrid}>
            {STYLE_OPTIONS.map(option => (
              <button
                key={option.value}
                type="button"
                onClick={() => isEditing && handleToggleStyle(option.value)}
                className={`${styles.option} ${
                  formData.styles.includes(option.value) ? styles.optionActive : ''
                } ${!isEditing ? styles.optionDisabled : ''}`}
                disabled={!isEditing}
                style={{
                  '--option-color': option.color
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Dietary */}
        <div className={styles.preferenceGroup}>
          <h3 className={styles.groupTitle}>CHẾ ĐỘ ĂN</h3>
          <div className={styles.optionsGrid}>
            {DIETARY_OPTIONS.map(option => (
              <button
                key={option.value}
                type="button"
                onClick={() => isEditing && handleToggleDietary(option.value)}
                className={`${styles.option} ${
                  formData.dietary.includes(option.value) ? styles.optionActive : ''
                } ${!isEditing ? styles.optionDisabled : ''}`}
                disabled={!isEditing}
                style={{
                  '--option-color': option.color
                }}
              >
                {option.label}
              </button>
            ))}
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

export default ProfilePreferences;
