import { apiClient } from './apiClient';

export function getUsers(params = {}) {
  const query = new URLSearchParams(params).toString();
  return apiClient(`/users${query ? '?' + query : ''}`);
}

export function getUser(id) {
  return apiClient(`/users/${id}`);
}
