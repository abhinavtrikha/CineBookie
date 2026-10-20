import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Icon from '../components/Icon';
import './AuthPage.css';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Determine return URL if user was redirected to login
  const searchParams = new URLSearchParams(location.search);
  const redirectParam = searchParams.get('redirect');
  const returnUrl = location.state?.from?.pathname || redirectParam;

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const executeLogin = async (email, password) => {
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      if (returnUrl) {
        navigate(returnUrl, { replace: true });
      } else if (user.role === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/movies', { replace: true });
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    executeLogin(form.email, form.password);
  };

  const handleQuickLogin = (email, password) => {
    setForm({ email, password });
    executeLogin(email, password);
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <Link to="/" className="auth-logo"><Icon name="film" /> CineBookie</Link>
          <h1 className="auth-title">Welcome back</h1>
          <p className="auth-subtitle">Sign in to book tickets and manage reservations</p>
        </div>

        {error && <div className="alert alert-error"><Icon name="warning" /> <span>{error}</span></div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              name="email"
              className="form-input"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <div className="password-input-wrap">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                className="form-input"
                placeholder="Enter your password"
                value={form.password}
                onChange={handleChange}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? 'Hide password' : 'Show password'}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                <Icon name={showPassword ? 'eyeOff' : 'eye'} />
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In →'}
          </button>
        </form>

        <div className="auth-footer">
          <p className="text-muted">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary" style={{ fontWeight: 600 }}>Create account</Link>
          </p>
        </div>

        {/* Instant 1-Click Demo Logins */}
        <div className="demo-accounts">
          <div className="demo-title"><Icon name="bolt" /> Instant Demo Sign-In</div>
          <div className="demo-buttons">
            <button
              type="button"
              className="demo-btn"
              onClick={() => handleQuickLogin('customer@cinebookie.com', 'customer123')}
              disabled={loading}
            >
              <div>
                <span className="demo-btn-role">Customer Demo:</span>
                <span className="demo-btn-email"> customer@cinebookie.com</span>
              </div>
              <span className="text-primary" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Login as Customer →</span>
            </button>
            <button
              type="button"
              className="demo-btn"
              onClick={() => handleQuickLogin('admin@cinebookie.com', 'admin123')}
              disabled={loading}
            >
              <div>
                <span className="demo-btn-role" style={{ color: '#e84393' }}>Admin Demo:</span>
                <span className="demo-btn-email"> admin@cinebookie.com</span>
              </div>
              <span className="text-primary" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Login as Admin →</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
