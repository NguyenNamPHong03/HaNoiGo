import { useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useUser } from '../../contexts/UserContext';
import { authAPI } from '../../services/api';

const OAuthSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useUser();

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        const token = searchParams.get('token');
        const refreshToken = searchParams.get('refreshToken');
        const error = searchParams.get('error');

        // Check for errors
        if (error) {
          let errorMessage = 'Authentication failed. Please try again.';
          
          if (error === 'missing_code') {
            errorMessage = 'Authorization code is missing.';
          } else if (error === 'banned') {
            errorMessage = 'Your account has been banned.';
          } else if (error === 'google_auth_failed') {
            errorMessage = 'Google authentication failed.';
          } else if (error === 'missing_token') {
            errorMessage = 'Authentication token is missing.';
          }
          
          toast.error(errorMessage);
          navigate('/login');
          return;
        }

        // Check if token exists
        if (!token) {
          toast.error('Authentication token is missing.');
          navigate('/login');
          return;
        }

        // Store tokens
        localStorage.setItem('userToken', token);
        if (refreshToken) {
          localStorage.setItem('refreshToken', refreshToken);
        }

        // Fetch user profile
        console.log('📡 Fetching user profile...');
        const response = await authAPI.getProfile();
        console.log('📥 Profile response:', response);
        
        if (response.success) {
          const user = response.data?.user || response.data;
          console.log('👤 User data:', user);
          
          if (!user) {
            throw new Error('User data is missing from response');
          }
          
          login(user, token);
          
          toast.success('Login successful!');
          
          // Redirect to admin panel if user is admin
          if (user.role === 'admin') {
            window.location.href = 'http://localhost:3001';
          } else {
            navigate('/');
          }
        } else {
          throw new Error('Failed to fetch user profile');
        }
      } catch (error) {
        console.error('OAuth Success Error:', error);
        toast.error('Failed to complete authentication. Please try again.');
        navigate('/login');
      }
    };

    handleOAuthCallback();
  }, [searchParams, navigate, login]);

  return (
    <div style={{ 
      height: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      flexDirection: 'column',
      gap: '1rem'
    }}>
      <div className="spinner" style={{
        width: '50px',
        height: '50px',
        border: '4px solid #f3f3f3',
        borderTop: '4px solid #3498db',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }}></div>
      <p>Completing authentication...</p>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default OAuthSuccess;
