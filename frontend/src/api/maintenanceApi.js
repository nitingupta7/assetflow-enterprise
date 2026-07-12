import { apiClient } from './apiClient';

export function getMaintenance(params = {}) {
  const query = new URLSearchParams(params).toString();
  return apiClient(`/maintenance${query ? '?' + query : ''}`);
}

export function createMaintenance(data) {
  return apiClient('/maintenance', { method: 'POST', body: data });
}

export function updateMaintenance(id, data) {
  return apiClient(`/maintenance/${id}`, { method: 'PATCH', body: data });
}
