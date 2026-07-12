import { getStoredToken, logout } from './authApi';

const API_BASE = '/api';

export async function apiClient(endpoint, { method = 'GET', body, headers = {} } = {}) {
  const token = getStoredToken();
  
  const config = {
    method,
    headers: {
      ...headers,
    },
  };

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (body) {
    config.headers['Content-Type'] = 'application/json';
    config.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, config);

  if (!response.ok) {
    if (response.status === 401) {
      logout();
      window.location.reload();
    }
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.message || 'API Request Failed');
  }

  return response.json();
}
