import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { authAPI } from '../services/api';

const UserContext = createContext();

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('userToken');
      if (token) {
        console.log('🔍 Checking auth status with token:', token.substring(0, 20) + '...');
        const response = await authAPI.getProfile();
        console.log('📥 Auth check response:', response);
        
        if (response.success) {
          // Backend trả về: { success: true, data: { user: {...} } }
          const userData = response.data.user;
          console.log('👤 Setting user from checkAuthStatus:', userData);
          console.log('👤 User avatarUrl:', userData?.avatarUrl);
          setUser(userData);
        }
      } else {
        console.log('⚠️ No token found in localStorage');
      }
    } catch (error) {
      console.error('❌ Auth check failed:', error);
      console.error('❌ Error response:', error.response?.data);
      localStorage.removeItem('userToken');
    } finally {
      setLoading(false);
    }
  };

  const login = (userData, token) => {
    localStorage.setItem('userToken', token);
    // Ensure role is saved with user data
    const userWithRole = {
      ...userData,
      role: userData.role || 'user'
    };
    setUser(userWithRole);
  };

  const logout = () => {
    localStorage.removeItem('userToken');
    setUser(null);
  };

  const updateUser = (updatedData) => {
    console.log('🔄 UserContext - Updating user with:', updatedData);
    console.log('🔄 UserContext - Previous user:', user);
    setUser(prev => {
      const newUser = { ...prev, ...updatedData };
      console.log('✅ UserContext - New user:', newUser);
      return newUser;
    });
  };

  // Optimization: Memoize context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    user,
    loading,
    login,
    logout,
    updateUser,
    checkAuthStatus
  }), [user, loading]);

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};