import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import styles from './UserMenu.module.css';

function UserMenu() {
  const { user, logout } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    logout();
    setIsOpen(false);
    navigate('/');
  };

  if (!user) {
    return (
      <Link to="/login" className="btn btn-primary">
        Đăng nhập
      </Link>
    );
  }

  const getAvatarUrl = () => {
    console.log('🎨 UserMenu - Getting avatar URL for user:', user);
    console.log('🎨 UserMenu - user.avatarUrl:', user?.avatarUrl);
    console.log('🎨 UserMenu - user.displayName:', user?.displayName);
    
    if (user?.avatarUrl) {
      console.log('✅ Using user avatarUrl:', user.avatarUrl);
      return user.avatarUrl;
    }
    
    // Default avatar with user initial
    const initial = user?.displayName?.charAt(0).toUpperCase() || 'U';
    const fallbackUrl = `https://ui-avatars.com/api/?name=${initial}&background=ef4444&color=ffffff&size=40`;
    console.log('⚠️ Using fallback avatar:', fallbackUrl);
    return fallbackUrl;
  };

  return (
    <div className={styles.userMenu} ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={styles.userButton}
      >
        <img 
          src={getAvatarUrl()}
          alt={user.displayName}
          className={styles.avatar}
        />
        <span className={styles.userName}>{user.displayName}</span>
        <svg 
          className={`${styles.chevron} ${isOpen ? styles.chevronUp : ''}`}
          width="16" 
          height="16" 
          viewBox="0 0 16 16" 
          fill="currentColor"
        >
          <path d="M4.646 6.354a.5.5 0 0 1 .708 0L8 8.793l2.646-2.439a.5.5 0 0 1 .708.708l-3 2.75a.5.5 0 0 1-.708 0l-3-2.75a.5.5 0 0 1 0-.708z"/>
        </svg>
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.userInfo}>
            <img 
              src={getAvatarUrl()}
              alt={user.displayName}
              className={styles.dropdownAvatar}
            />
            <div>
              <div className={styles.dropdownName}>{user.displayName}</div>
              <div className={styles.dropdownEmail}>{user.email}</div>
            </div>
          </div>
          
          <hr className={styles.divider} />
          
          <Link 
            to="/profile" 
            className={styles.menuItem}
            onClick={() => setIsOpen(false)}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm-5 6s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1H3z"/>
            </svg>
            Thông tin cá nhân
          </Link>
          
          <button 
            onClick={handleLogout}
            className={`${styles.menuItem} ${styles.logoutItem}`}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M6 12.5a.5.5 0 0 0 .5.5h8a.5.5 0 0 0 .5-.5v-9a.5.5 0 0 0-.5-.5h-8a.5.5 0 0 0-.5.5v2a.5.5 0 0 1-1 0V3a1.5 1.5 0 0 1 1.5-1.5h8A1.5 1.5 0 0 1 16 3v9a1.5 1.5 0 0 1-1.5 1.5h-8A1.5 1.5 0 0 1 5 12.5v-2a.5.5 0 0 1 1 0v2z"/>
              <path d="M.5 8a.5.5 0 0 1 .5-.5h5.793L4.146 5.854a.5.5 0 1 1 .708-.708l3 3a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708-.708L6.793 8.5H1a.5.5 0 0 1-.5-.5z"/>
            </svg>
            Đăng xuất
          </button>
        </div>
      )}
    </div>
  );
}

export default UserMenu;