// API configuration and utility functions

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

const setAuthState = (payload) => {
  if (payload?.token) {
    localStorage.setItem('token', payload.token);
  }

  if (payload?.user) {
    localStorage.setItem('user', JSON.stringify(payload.user));
  }
};

const clearAuthState = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

const shouldAttemptRefresh = (endpoint, options, responseStatus) => {
  if (responseStatus !== 401) {
    return false;
  }

  if (options._retriedAfterRefresh) {
    return false;
  }

  const bypassEndpoints = ['/login', '/register', '/refresh'];
  return !bypassEndpoints.includes(endpoint);
};

const tryRefreshSession = async () => {
  const response = await fetch(`${API_BASE_URL}/refresh`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  });

  if (!response.ok) {
    return null;
  }

  return response.json();
};

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
    credentials: 'include',
    headers,
  });

  const data = await response.json();

  if (shouldAttemptRefresh(endpoint, options, response.status)) {
    const refreshed = await tryRefreshSession();

    if (refreshed?.token) {
      setAuthState(refreshed);

      return apiCall(endpoint, {
        ...options,
        _retriedAfterRefresh: true,
      });
    }

    clearAuthState();
    throw new Error('Session expired. Please log in again.');
  }

  if (!response.ok) {
    throw new Error(data.error || 'API request failed');
  }

  return data;
};

export const authAPI = {
  login: (email, password) =>
    apiCall('/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (fullname, email, password, role) =>
    apiCall('/register', {
      method: 'POST',
      body: JSON.stringify({ fullname, email, password, role }),
    }),

  refresh: () =>
    apiCall('/refresh', {
      method: 'POST',
      body: JSON.stringify({}),
    }),

  logout: () =>
    apiCall('/logout', {
      method: 'POST',
      body: JSON.stringify({}),
    }),

  logoutAll: () =>
    apiCall('/logout-all', {
      method: 'POST',
      body: JSON.stringify({}),
    }),

  changePassword: (currentPassword, newPassword) =>
    apiCall('/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
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
  logout: clearAuthState,
};
