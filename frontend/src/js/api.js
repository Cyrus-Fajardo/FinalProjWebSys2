// API configuration and utility functions

const normalizeApiBaseUrl = (rawUrl) => {
  const trimmed = String(rawUrl || '/api').trim();

  if (trimmed === '/api' || trimmed === '') {
    return '/api';
  }

  const withoutTrailingSlash = trimmed.replace(/\/$/, '');

  if (withoutTrailingSlash === '/api' || withoutTrailingSlash.endsWith('/api')) {
    return withoutTrailingSlash;
  }

  return `${withoutTrailingSlash}/api`;
};

const API_BASE_URL = normalizeApiBaseUrl(process.env.REACT_APP_API_URL);

const buildApiUrl = (endpoint) => {
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_BASE_URL}${normalizedEndpoint}`;
};

const parseResponseBody = async (response) => {
  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    try {
      return await response.json();
    } catch (_error) {
      return null;
    }
  }

  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch (_error) {
    return { rawText: text };
  }
};

const buildErrorMessage = (response, data, endpoint, requestUrl) => {
  if (response.status === 405 && (endpoint === '/register' || endpoint === '/login')) {
    return `Request failed with status 405 for ${requestUrl}. Check that REACT_APP_API_URL points to your backend API base (for example: https://your-backend-domain/api).`;
  }

  if (data?.error) {
    return data.error;
  }

  if (data?.message) {
    return data.message;
  }

  if (data?.rawText) {
    const trimmed = data.rawText.replace(/\s+/g, ' ').trim();

    if (trimmed.startsWith('<!DOCTYPE') || trimmed.startsWith('<html')) {
      return `Request failed (${response.status}). The API URL may be misconfigured for ${endpoint}.`;
    }

    return `Request failed (${response.status}): ${trimmed.slice(0, 140)}`;
  }

  return `Request failed with status ${response.status}`;
};

const debugApiFailure = (endpoint, options, response, data, requestUrl) => {
  if (process.env.NODE_ENV === 'production') {
    return;
  }

  const method = (options.method || 'GET').toUpperCase();

  // Development-only diagnostics to speed up API failure triage.
  console.error('API request failed', {
    endpoint,
    requestUrl,
    apiBaseUrl: API_BASE_URL,
    method,
    status: response.status,
    statusText: response.statusText,
    allowHeader: response.headers.get('allow'),
    responseData: data,
  });
};

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
  const response = await fetch(buildApiUrl('/refresh'), {
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
  const requestUrl = buildApiUrl(endpoint);
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(requestUrl, {
      ...options,
      credentials: 'include',
      headers,
    });
  } catch (error) {
    throw new Error(`Network error while calling ${endpoint}. Check REACT_APP_API_URL and CORS settings.`);
  }

  if (response.status === 204 || response.status === 205) {
    return null;
  }

  const data = await parseResponseBody(response);

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
    debugApiFailure(endpoint, options, response, data, requestUrl);
    throw new Error(buildErrorMessage(response, data, endpoint, requestUrl));
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

  getMe: () => apiCall('/users/me'),

  updateMe: (userData) =>
    apiCall('/users/me', {
      method: 'PATCH',
      body: JSON.stringify(userData),
    }),

  verifyMe: (certificateUrl) =>
    apiCall('/users/me/verify', {
      method: 'PATCH',
      body: JSON.stringify({ certificateUrl }),
    }),

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

export const orderAPI = {
  getMyOrders: () => apiCall('/orders'),

  checkout: (items) =>
    apiCall('/orders/checkout', {
      method: 'POST',
      body: JSON.stringify({ items }),
    }),

  cancel: (orderId, reason) =>
    apiCall(`/orders/${orderId}/cancel`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
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