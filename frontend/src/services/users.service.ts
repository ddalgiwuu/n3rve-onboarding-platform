import api from '@/lib/api';

export interface User {
  id: string
  email: string
  name?: string
  company?: string
  phone?: string
  role: 'USER' | 'ADMIN'
  isActive: boolean
  isProfileComplete: boolean
  createdAt: string
  lastLoginAt?: string
}

export interface UserFilters {
  searchQuery?: string
  role?: 'all' | 'USER' | 'ADMIN'
  isActive?: boolean
  page?: number
  limit?: number
}

export const usersService = {
  // Get all users (admin only)
  async getAllUsers(filters?: UserFilters) {
    const params = new URLSearchParams();

    if (filters?.searchQuery) {
      params.append('search', filters.searchQuery);
    }
    if (filters?.role && filters.role !== 'all') {
      params.append('role', filters.role);
    }
    if (filters?.isActive !== undefined) {
      params.append('isActive', filters.isActive.toString());
    }
    if (filters?.page) {
      params.append('page', filters.page.toString());
    }
    if (filters?.limit) {
      params.append('limit', filters.limit.toString());
    }

    const response = await api.get(`/admin/users?${params.toString()}`);
    return response.data;
  },

  // Get single user details (admin only)
  async getUserById(id: string) {
    const response = await api.get(`/admin/users/${id}`);
    return response.data;
  },

  // Update user role (admin only)
  async updateUserRole(id: string, role: 'USER' | 'ADMIN') {
    const response = await api.patch(`/admin/users/${id}/role`, { role });
    return response.data;
  },

  // Update user status (admin only)
  async updateUserStatus(id: string, isActive: boolean) {
    const response = await api.patch(`/admin/users/${id}/status`, { isActive });
    return response.data;
  },

  // Get user statistics (admin only)
  async getUserStats() {
    const response = await api.get('/admin/users/stats');
    return response.data;
  }
};
