// API configuration and utility functions

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

export const apiCall = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'API request failed');
  }

  return data;
};

export const authAPI = {
  login: (email, password, role) =>
    apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, role }),
    }),

  register: (fullname, email, password, role) =>
    apiCall('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ fullname, email, password, role }),
    }),
};

export const productAPI = {
  getAll: () => apiCall('/products'),

  create: (productData) =>
    apiCall('/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    }),

  buy: (productId, quantity) =>
    apiCall('/products/buy', {
      method: 'POST',
      body: JSON.stringify({ productId, quantity }),
    }),

  delete: (productId) =>
    apiCall(`/products/${productId}`, {
      method: 'DELETE',
    }),
};

export const userAPI = {
  getAll: () => apiCall('/users'),

  create: (userData) =>
    apiCall('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),

  update: (userId, userData) =>
    apiCall(`/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(userData),
    }),

  delete: (userId) =>
    apiCall(`/users/${userId}`, {
      method: 'DELETE',
    }),
};

export const farmerAPI = {
  getAll: () => apiCall('/farmers'),

  getOne: (farmerId) => apiCall(`/farmers/${farmerId}`),

  create: (farmerData) =>
    apiCall('/farmers', {
      method: 'POST',
      body: JSON.stringify(farmerData),
    }),

  update: (farmerId, farmerData) =>
    apiCall(`/farmers/${farmerId}`, {
      method: 'PATCH',
      body: JSON.stringify(farmerData),
    }),

  batchUpdate: (updates) =>
    apiCall('/farmers/batch/update', {
      method: 'PATCH',
      body: JSON.stringify({ updates }),
    }),
};

export const authHelpers = {
  setToken: (token) => localStorage.setItem('token', token),
  getToken: () => localStorage.getItem('token'),
  clearToken: () => localStorage.removeItem('token'),

  setUser: (user) => localStorage.setItem('user', JSON.stringify(user)),
  getUser: () => JSON.parse(localStorage.getItem('user') || 'null'),
  clearUser: () => localStorage.removeItem('user'),

  isAuthenticated: () => !!localStorage.getItem('token'),
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
};
