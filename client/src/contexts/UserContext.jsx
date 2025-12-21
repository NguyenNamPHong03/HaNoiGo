import { createContext, useContext, useEffect, useState, useMemo } from 'react';
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
        const response = await authAPI.getProfile();
        if (response.success) {
          setUser(response.data);
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('userToken');
    } finally {
      setLoading(false);
    }
  };

  const login = (userData, token) => {
    localStorage.setItem('userToken', token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('userToken');
    setUser(null);
  };

  const updateUser = (updatedData) => {
    setUser(prev => ({ ...prev, ...updatedData }));
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