import { apiClient } from './apiClient';
import { User } from '../types';

export const authService = {
  register: (data: { name: string; email: string; password: string }) =>
    apiClient.post<{ user: User; token: string }>('/auth/register', data),

  login: (data: { email: string; password: string }) =>
    apiClient.post<{ user: User; token: string }>('/auth/login', data),

  getMe: () => apiClient.get<{ user: User }>('/auth/me'),

  updateProfile: (formData: FormData) =>
    apiClient.put<{ user: User }>('/auth/profile', formData),
};
