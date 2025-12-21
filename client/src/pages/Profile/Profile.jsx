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
      <div className={styles.profileContainer}>
        <div className={styles.loading}>Đang tải...</div>
      </div>
    );
  }

  return (
    <div className={styles.profileContainer}>
      <ProfileHeader user={user} />
      
      <div className={styles.profileContent}>
        {updateSuccess && (
          <div className={styles.successMessage}>
            ✓ Cập nhật thông tin thành công!
          </div>
        )}
        
        <ProfileInfo user={user} onUpdateSuccess={handleUpdateSuccess} />
        <ProfilePreferences user={user} onUpdateSuccess={handleUpdateSuccess} />
      </div>
    </div>
  );
};

export default Profile;
