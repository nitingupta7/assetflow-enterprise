import { apiClient } from './apiClient';

export function getBookings(params = {}) {
  const query = new URLSearchParams(params).toString();
  return apiClient(`/booking${query ? '?' + query : ''}`);
}

export function createBooking(data) {
  return apiClient('/booking', { method: 'POST', body: data });
}

export function updateBooking(id, data) {
  return apiClient(`/booking/${id}`, { method: 'PATCH', body: data });
}
