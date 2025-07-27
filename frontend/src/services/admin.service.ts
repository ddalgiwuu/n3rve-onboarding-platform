import api from '@/lib/api';
import { User } from '@/types/user';
import { Submission } from '@/types/submission';

export interface DashboardStats {
  totalSubmissions: number;
  pendingReview: number;
  activeArtists: number;
  totalRevenue: number;
}

export interface AdminUser extends User {
  submissions?: number;
  lastLogin?: string;
  status?: 'active' | 'inactive' | 'suspended';
}

export const adminService = {
  // Dashboard stats
  async getDashboardStats(): Promise<DashboardStats> {
    const { data } = await api.get('/admin/dashboard/stats');
    return data;
  },

  // User management
  async getUsers(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }): Promise<{ users: AdminUser[]; total: number }> {
    const { data } = await api.get('/admin/users', { params });
    return data;
  },

  async getUser(userId: string): Promise<AdminUser> {
    const { data } = await api.get(`/admin/users/${userId}`);
    return data;
  },

  async updateUser(userId: string, updates: Partial<AdminUser>): Promise<AdminUser> {
    const { data } = await api.put(`/admin/users/${userId}`, updates);
    return data;
  },

  async deleteUser(userId: string): Promise<void> {
    await api.delete(`/admin/users/${userId}`);
  },

  async updateUserRole(userId: string, role: string): Promise<AdminUser> {
    const { data } = await api.patch(`/admin/users/${userId}/role`, { role });
    return data;
  },

  async createUser(userData: {
    name: string;
    email: string;
    password: string;
    role: string;
    company?: string;
    isCompanyAccount?: boolean;
    parentAccountId?: string;
  }): Promise<AdminUser> {
    const { data } = await api.post('/admin/users', userData);
    return data;
  },

  // Submission management
  async getSubmissions(params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }): Promise<{ submissions: Submission[]; total: number }> {
    const { data } = await api.get('/admin/submissions', { params });
    return data;
  },

  async getSubmission(submissionId: string): Promise<Submission> {
    const { data } = await api.get(`/admin/submissions/${submissionId}`);
    return data;
  },

  async updateSubmissionStatus(
    submissionId: string,
    status: string,
    comments?: string
  ): Promise<Submission> {
    const { data } = await api.put(`/admin/submissions/${submissionId}/status`, {
      status,
      comments
    });
    return data;
  },

  // Analytics
  async getAnalytics(timeRange: 'week' | 'month' | 'year' = 'month') {
    const { data } = await api.get('/admin/analytics', {
      params: { timeRange }
    });
    return data;
  },

  // Activity logs
  async getActivityLogs(params?: {
    page?: number;
    limit?: number;
    userId?: string;
    action?: string;
  }) {
    const { data } = await api.get('/admin/logs', { params });
    return data;
  }
};
