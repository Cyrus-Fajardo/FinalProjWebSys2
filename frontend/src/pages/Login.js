import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI, authHelpers } from '../js/api';
import '../css/Login.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await authAPI.login(email, password);

      authHelpers.setToken(data.token);
      authHelpers.setUser(data.user);

      const userRole = data?.user?.role;

      // Route based on role
      switch (userRole) {
        case 'Farmer':
          navigate('/farmer-profile');
          break;
        case 'Buyer':
        case 'Kaluppa Foundation':
          navigate('/marketplace');
          break;
        case 'DTI':
          navigate('/manage-users');
          break;
        case 'Group Manager':
          navigate('/manage-farmer-details');
          break;
        default:
          navigate('/marketplace');
      }
    } catch (err) {
      setError(err.message || 'An error occurred. Please try again.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>KapeKONEK</h1>
        <p className="tagline">Coffee Marketplace</p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>

          <button type="submit" disabled={loading} className="login-btn">
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="register-link">
          Don't have an account? <Link to="/register">Sign up here</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
