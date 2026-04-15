import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI, authHelpers } from '../js/api';
import '../css/Sidebar.css';

function Sidebar() {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const isAuthenticated = !!(localStorage.getItem('token') && user);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      // Local logout still proceeds when token is expired or request fails.
    }

    authHelpers.logout();
    navigate('/login');
  };

  const getMenuItems = () => {
    if (!isAuthenticated) {
      return [];
    }

    switch (user.role) {
      case 'Kaluppa Foundation':
        return [
          { path: '/marketplace', label: 'Marketplace' },
          { path: '/manage-farmer-details', label: 'Manage Farmer Details' },
          { path: '/manage-users', label: 'Manage Users' }
        ];
      case 'DTI':
        return [
          { path: '/manage-farmer-details', label: 'Manage Farmer Details' },
          { path: '/manage-users', label: 'Manage Users' }
        ];
      case 'Group Manager':
        return [
          { path: '/manage-farmer-details', label: 'Manage Farmer Details' }
        ];
      case 'Farmer':
        return [
          { path: '/farmer-profile', label: 'Farmer Profile' },
          { path: '/marketplace', label: 'Marketplace' }
        ];
      case 'Buyer':
        return [
          { path: '/marketplace', label: 'Marketplace' }
        ];
      default:
        return [];
    }
  };

  const menuItems = getMenuItems();

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <Link to={isAuthenticated ? '/account-info' : '/login'} className="account-shortcut">
          <div className="person-icon" aria-hidden="true">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8" />
              <path d="M4 20c1.8-3.3 4.6-5 8-5s6.2 1.7 8 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </div>
          <span>{isAuthenticated ? 'My Account' : 'Log in'}</span>
        </Link>

        {isAuthenticated && (
          <>
            <h2>KapeKONEK</h2>
            <p className="user-info">{user.fullname}</p>
            <p className="user-role">{user.role}</p>
            {user.isVerified && <p className="verified-badge">Verified</p>}
          </>
        )}
      </div>

      <nav className="sidebar-nav">
        <ul>
          {menuItems.map((item, index) => (
            <li key={index}>
              <Link to={item.path}>{item.label}</Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="sidebar-footer">
        {isAuthenticated ? (
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        ) : null}
      </div>
    </aside>
  );
}

export default Sidebar;
