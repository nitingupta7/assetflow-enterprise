import { apiClient } from './apiClient';

export function getCategories() {
  return apiClient('/categories');
}
