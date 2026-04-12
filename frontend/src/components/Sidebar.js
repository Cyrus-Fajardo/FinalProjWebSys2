import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../css/Sidebar.css';

function Sidebar() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const getMenuItems = () => {
    switch (user.role) {
      case 'Kaluppa Foundation':
        return [
          { path: '/login', label: 'Login' },
          { path: '/marketplace', label: 'Marketplace' },
          { path: '/manage-farmers', label: 'Farmer Profiles' },
          { path: '/manage-users', label: 'Manage Users' }
        ];
      case 'DTI':
        return [
          { path: '/login', label: 'Login' },
          { path: '/manage-farmers', label: 'Farmer Profiles' },
          { path: '/manage-users', label: 'Manage Users' }
        ];
      case 'Group Manager':
        return [
          { path: '/login', label: 'Login' },
          { path: '/manage-farmers', label: 'Farmer Profiles' }
        ];
      case 'Farmer':
        return [
          { path: '/login', label: 'Login' },
          { path: '/register', label: 'Register' },
          { path: '/manage-farmers', label: 'Farmer Profile' },
          { path: '/marketplace', label: 'Marketplace' }
        ];
      case 'Buyer':
        return [
          { path: '/login', label: 'Login' },
          { path: '/register', label: 'Register' },
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
        <h2>KapeKONEK</h2>
        <p className="user-info">{user.fullname}</p>
        <p className="user-role">{user.role}</p>
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
        <button className="logout-btn" onClick={handleLogout}>Logout</button>
      </div>
    </aside>
  );
}

export default Sidebar;
