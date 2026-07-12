import { apiClient } from './apiClient';

export function getDepartments() {
  return apiClient('/departments');
}
