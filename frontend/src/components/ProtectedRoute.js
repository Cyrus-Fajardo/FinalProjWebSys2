import React from 'react';
import { Navigate } from 'react-router-dom';

const getRoleHome = (role) => {
  switch (role) {
    case 'Group Manager':
      return '/manage-farmer-details';
    case 'DTI':
      return '/manage-users';
    case 'Farmer':
      return '/farmer-profile';
    case 'Kaluppa Foundation':
    case 'Buyer':
    default:
      return '/marketplace';
  }
};

function ProtectedRoute({ children, allowedRoles }) {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const token = localStorage.getItem('token');

  if (!token || !user) {
    return <Navigate to="/login" />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={getRoleHome(user.role)} />;
  }

  return children;
}

export default ProtectedRoute;
