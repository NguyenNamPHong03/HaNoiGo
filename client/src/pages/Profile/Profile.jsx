import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../contexts/UserContext';
import styles from './Profile.module.css';
import ProfileHeader from './ProfileHeader/ProfileHeader';
import ProfileInfo from './ProfileInfo/ProfileInfo';
import ProfilePreferences from './ProfilePreferences/ProfilePreferences';

const Profile = () => {
  const { user, loading } = useUser();
  const navigate = useNavigate();
  const [updateSuccess, setUpdateSuccess] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  const handleUpdateSuccess = () => {
    setUpdateSuccess(true);
    setTimeout(() => setUpdateSuccess(false), 3000);
  };

  if (loading || !user) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loading}>Đang tải...</div>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <ProfileHeader user={user} />

      <main className={styles.mainContent}>
        {updateSuccess && (
          <div className={styles.successMessage}>
            ✓ Cập nhật thông tin thành công!
          </div>
        )}

        <div className={styles.gridContainer}>
          <div className={styles.mainColumn}>
            <ProfileInfo user={user} onUpdateSuccess={handleUpdateSuccess} />
          </div>

          <div className={styles.sideColumn}>
            <ProfilePreferences user={user} onUpdateSuccess={handleUpdateSuccess} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;
