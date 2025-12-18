import { useEffect, useState } from 'react';
import AvatarUpload from '../components/AvatarUpload';
import { useUser } from '../contexts/UserContext';
import { authAPI } from '../services/api';
import styles from './Profile.module.css';

function Profile() {
  const { user, updateUser } = useUser();
  const [formData, setFormData] = useState({
    displayName: '',
    avatarUrl: '',
    preferences: {
      favoriteFoods: [],
      styles: [],
      dietary: []
    }
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [newFood, setNewFood] = useState('');
  const [newStyle, setNewStyle] = useState('');
  const [newDietary, setNewDietary] = useState('');

  const styleOptions = ['hiện đại', 'truyền thống', 'ấm cúng', 'thanh lịch', 'giản dị', 'cao cấp'];
  const dietaryOptions = ['chay', 'thuần chay', 'halal', 'kosher', 'không gluten', 'không lactose'];

  useEffect(() => {
    if (user) {
      setFormData({
        displayName: user.displayName || '',
        avatarUrl: user.avatarUrl || '',
        preferences: {
          favoriteFoods: user.preferences?.favoriteFoods || [],
          styles: user.preferences?.styles || [],
          dietary: user.preferences?.dietary || []
        }
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const addItem = (type, item, setter) => {
    if (item.trim() && !formData.preferences[type].includes(item.trim())) {
      setFormData(prev => ({
        ...prev,
        preferences: {
          ...prev.preferences,
          [type]: [...prev.preferences[type], item.trim()]
        }
      }));
      setter('');
    }
  };

  const removeItem = (type, index) => {
    setFormData(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [type]: prev.preferences[type].filter((_, i) => i !== index)
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await authAPI.updateProfile(formData);
      if (response.success) {
        updateUser(response.data);
        setMessage('Cập nhật thông tin thành công!');
      }
    } catch (error) {
      console.error('Update profile error:', error);
      setMessage(error.response?.data?.message || 'Cập nhật thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <div className="container" style={{ padding: '2rem 0' }}>Vui lòng đăng nhập</div>;

  return (
    <div className={styles.profileContainer}>
      <div className={styles.profileCard}>
        <h2 className={styles.title}>Thông tin cá nhân</h2>
        
        {message && (
          <div className={`${styles.message} ${message.includes('thành công') ? styles.success : styles.error}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.section}>
            <h3>Thông tin cơ bản</h3>
            
            <div className={styles.formGroup}>
              <label htmlFor="displayName">Tên hiển thị</label>
              <input
                type="text"
                id="displayName"
                name="displayName"
                value={formData.displayName}
                onChange={handleChange}
                className={styles.input}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>Ảnh đại diện</label>
              <AvatarUpload
                currentAvatar={formData.avatarUrl}
                onAvatarChange={(newAvatarUrl) => {
                  setFormData(prev => ({
                    ...prev,
                    avatarUrl: newAvatarUrl
                  }));
                }}
                onUploadStart={() => setLoading(true)}
                onUploadEnd={() => setLoading(false)}
              />
              
              <div className={styles.orDivider}>
                <span>hoặc</span>
              </div>
              
              <input
                type="url"
                name="avatarUrl"
                value={formData.avatarUrl}
                onChange={handleChange}
                className={styles.input}
                placeholder="Hoặc nhập URL ảnh..."
              />
            </div>

            <div className={styles.formGroup}>
              <label>Email</label>
              <input
                type="email"
                value={user.email}
                disabled
                className={`${styles.input} ${styles.disabled}`}
              />
              <small>Email không thể thay đổi</small>
            </div>
          </div>

          <div className={styles.section}>
            <h3>Sở thích ẩm thực</h3>
            
            <div className={styles.formGroup}>
              <label>Món ăn yêu thích</label>
              <div className={styles.tagInput}>
                <input
                  type="text"
                  value={newFood}
                  onChange={(e) => setNewFood(e.target.value)}
                  placeholder="Thêm món ăn..."
                  className={styles.input}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addItem('favoriteFoods', newFood, setNewFood))}
                />
                <button
                  type="button"
                  onClick={() => addItem('favoriteFoods', newFood, setNewFood)}
                  className={styles.addBtn}
                >
                  Thêm
                </button>
              </div>
              <div className={styles.tags}>
                {formData.preferences.favoriteFoods.map((food, index) => (
                  <span key={index} className={styles.tag}>
                    {food}
                    <button
                      type="button"
                      onClick={() => removeItem('favoriteFoods', index)}
                      className={styles.removeTag}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>Phong cách</label>
              <div className={styles.tagInput}>
                <select
                  value={newStyle}
                  onChange={(e) => setNewStyle(e.target.value)}
                  className={styles.select}
                >
                  <option value="">Chọn phong cách...</option>
                  {styleOptions.map(style => (
                    <option key={style} value={style}>{style}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => addItem('styles', newStyle, setNewStyle)}
                  className={styles.addBtn}
                  disabled={!newStyle}
                >
                  Thêm
                </button>
              </div>
              <div className={styles.tags}>
                {formData.preferences.styles.map((style, index) => (
                  <span key={index} className={styles.tag}>
                    {style}
                    <button
                      type="button"
                      onClick={() => removeItem('styles', index)}
                      className={styles.removeTag}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>Chế độ ăn</label>
              <div className={styles.tagInput}>
                <select
                  value={newDietary}
                  onChange={(e) => setNewDietary(e.target.value)}
                  className={styles.select}
                >
                  <option value="">Chọn chế độ ăn...</option>
                  {dietaryOptions.map(diet => (
                    <option key={diet} value={diet}>{diet}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => addItem('dietary', newDietary, setNewDietary)}
                  className={styles.addBtn}
                  disabled={!newDietary}
                >
                  Thêm
                </button>
              </div>
              <div className={styles.tags}>
                {formData.preferences.dietary.map((diet, index) => (
                  <span key={index} className={styles.tag}>
                    {diet}
                    <button
                      type="button"
                      onClick={() => removeItem('dietary', index)}
                      className={styles.removeTag}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className={styles.actions}>
            <button
              type="submit"
              disabled={loading}
              className={`${styles.btn} ${styles.btnPrimary}`}
            >
              {loading ? 'Đang cập nhật...' : 'Cập nhật thông tin'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Profile