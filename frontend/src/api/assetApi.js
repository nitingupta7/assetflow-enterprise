import { apiClient } from './apiClient';

export function getAssets(params = {}) {
  const query = new URLSearchParams(params).toString();
  return apiClient(`/assets${query ? '?' + query : ''}`);
}

export function getAsset(id) {
  return apiClient(`/assets/${id}`);
}

export function createAsset(data) {
  return apiClient('/assets', { method: 'POST', body: data });
}

export function updateAsset(id, data) {
  return apiClient(`/assets/${id}`, { method: 'PATCH', body: data });
}

export function deleteAsset(id) {
  return apiClient(`/assets/${id}`, { method: 'DELETE' });
}
