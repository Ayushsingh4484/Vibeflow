import { apiClient } from './apiClient';
import { AdminStats, User } from '../types';

export const adminService = {
  getStats: () => apiClient.get<{ stats: AdminStats; recentTracks: any[]; recentUsers: any[] }>('/admin/stats'),

  getUsers: () => apiClient.get<{ users: User[] }>('/admin/users'),

  updateUserRole: (id: string, role: 'USER' | 'ADMIN') =>
    apiClient.put<{ user: User }>(`/admin/users/${id}/role`, { role }),

  deleteUser: (id: string) =>
    apiClient.delete<{ success: boolean }>(`/admin/users/${id}`),
};
