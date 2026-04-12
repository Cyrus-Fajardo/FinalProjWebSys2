// Authentication utilities

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password) => {
  return password.length >= 6;
};

export const validateFullName = (fullname) => {
  return fullname.trim().length >= 2;
};

export const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

export const isUserAuthenticated = () => {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  return !!(token && user);
};

export const getCurrentUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null');
  } catch {
    return null;
  }
};

export const hasRole = (requiredRoles) => {
  const user = getCurrentUser();
  if (!user) return false;
  return requiredRoles.includes(user.role);
};

export const canSell = () => {
  const user = getCurrentUser();
  if (!user) return false;
  return ['Farmer', 'Kaluppa Foundation'].includes(user.role);
};

export const canManageUsers = () => {
  const user = getCurrentUser();
  if (!user) return false;
  return ['Kaluppa Foundation', 'DTI'].includes(user.role);
};

export const canManageFarmers = () => {
  const user = getCurrentUser();
  if (!user) return false;
  return ['Kaluppa Foundation', 'DTI', 'Group Manager', 'Farmer'].includes(user.role);
};

export const getSellingOptions = (role) => {
  switch (role) {
    case 'Farmer':
      return ['Coffee Cherries', 'Coffee Seedlings'];
    case 'Kaluppa Foundation':
      return ['Processed Coffee', 'Fertilizers', 'Coffee Seedlings'];
    default:
      return [];
  }
};
