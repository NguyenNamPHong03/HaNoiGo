import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';

function Register() {
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp!');
      setLoading(false);
      return;
    }
    
    try {
      const response = await authAPI.register({
        displayName: formData.displayName,
        email: formData.email,
        password: formData.password
      });
      
      if (response.success) {
        alert('Đăng ký thành công! Vui lòng đăng nhập.');
        navigate('/login');
      }
    } catch (error) {
      console.error('Register error:', error);
      setError(error.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ padding: '2rem 0', minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="card" style={{ maxWidth: '400px', width: '100%' }}>
        <h1 style={{ textAlign: 'center', marginBottom: '2rem', color: 'var(--primary-color)' }}>
          Đăng ký HaNoiGo
        </h1>
        
        {error && (
          <div style={{ 
            backgroundColor: '#fee2e2', 
            color: '#dc2626', 
            padding: '0.75rem', 
            borderRadius: '0.375rem', 
            marginBottom: '1rem',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="displayName" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Họ và tên
            </label>
            <input
              type="text"
              id="displayName"
              name="displayName"
              value={formData.displayName}
              onChange={handleChange}
              className="input"
              placeholder="Nhập họ và tên"
              required
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="email" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="input"
              placeholder="Nhập email của bạn"
              required
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="password" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Mật khẩu
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="input"
              placeholder="Tối thiểu 6 ký tự"
              minLength="6"
              required
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="confirmPassword" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Xác nhận mật khẩu
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="input"
              placeholder="Nhập lại mật khẩu"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', marginBottom: '1rem' }}
          >
            {loading ? 'Đang đăng ký...' : 'Đăng ký'}
          </button>

          <div style={{ textAlign: 'center' }}>
            <p style={{ margin: '0', color: 'var(--text-secondary)' }}>
              Đã có tài khoản? {' '}
              <a href="/login" style={{ color: 'var(--primary-color)', textDecoration: 'none' }}>
                Đăng nhập ngay
              </a>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Register