/**
 * User Management API Service
 * 
 * Handles all user management operations for admins
 */
import api from './api';
import type { UserProfile } from './authApi';

export interface UserListResponse {
  users: UserProfile[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface UserListParams {
  page?: number;
  per_page?: number;
  search?: string;
  role?: 'admin' | 'investigator' | 'viewer';
  is_active?: boolean;
  sort_by?: 'created_at' | 'full_name' | 'email' | 'last_login';
  sort_order?: 'asc' | 'desc';
}

export interface CreateUserData {
  full_name: string;
  email: string;
  username?: string;
  password: string;
  role: 'admin' | 'investigator' | 'viewer';
  department?: string;
  phone?: string;
}

export interface UpdateUserData {
  full_name?: string;
  email?: string;
  username?: string;
  role?: 'admin' | 'investigator' | 'viewer';
  department?: string;
  phone?: string;
  profile_photo?: string;
}

export interface UserStats {
  total_users: number;
  active_users: number;
  inactive_users: number;
  online_users: number;
  by_role: {
    admin: number;
    investigator: number;
    viewer: number;
  };
}

export const usersApi = {
  /**
   * Get paginated list of users
   */
  list: async (params: UserListParams = {}): Promise<UserListResponse> => {
    const response = await api.get('/users', { params });
    return response.data;
  },

  /**
   * Get list of active investigators for case assignment
   */
  getInvestigators: async (): Promise<UserProfile[]> => {
    const response = await api.get('/users/investigators');
    return response.data;
  },

  /**
   * Get user by ID
   */
  getById: async (userId: string): Promise<UserProfile> => {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  },

  /**
   * Create new user
   */
  create: async (data: CreateUserData): Promise<UserProfile> => {
    const response = await api.post('/users', data);
    return response.data;
  },

  /**
   * Update user
   */
  update: async (userId: string, data: UpdateUserData): Promise<UserProfile> => {
    const response = await api.put(`/users/${userId}`, data);
    return response.data;
  },

  /**
   * Activate user
   */
  activate: async (userId: string): Promise<UserProfile> => {
    const response = await api.post(`/users/${userId}/activate`);
    return response.data;
  },

  /**
   * Deactivate user
   */
  deactivate: async (userId: string): Promise<UserProfile> => {
    const response = await api.post(`/users/${userId}/deactivate`);
    return response.data;
  },

  /**
   * Reset user password
   */
  resetPassword: async (userId: string, newPassword: string): Promise<{ message: string }> => {
    const response = await api.post(`/users/${userId}/reset-password`, {
      new_password: newPassword
    });
    return response.data;
  },

  /**
   * Get user statistics
   */
  getStats: async (): Promise<UserStats> => {
    const response = await api.get('/users/stats/overview');
    return response.data;
  },

  /**
   * Approve pending user registration
   */
  approve: async (userId: string): Promise<UserProfile> => {
    const response = await api.post(`/users/${userId}/approve`);
    return response.data;
  },

  /**
   * Reject pending user registration
   */
  reject: async (userId: string): Promise<{ message: string }> => {
    const response = await api.post(`/users/${userId}/reject`);
    return response.data;
  },

  /**
   * Suspend user account
   */
  suspend: async (userId: string): Promise<UserProfile> => {
    const response = await api.post(`/users/${userId}/suspend`);
    return response.data;
  },

  /**
   * Unlock locked user account
   */
  unlock: async (userId: string): Promise<{ message: string }> => {
    const response = await api.post(`/users/${userId}/unlock`);
    return response.data;
  },

  /**
   * Delete user permanently
   */
  delete: async (userId: string): Promise<{ message: string }> => {
    const response = await api.delete(`/users/${userId}`);
    return response.data;
  },

  /**
   * Get user profile with stats and activity
   */
  getProfile: async (userId: string): Promise<any> => {
    const response = await api.get(`/users/${userId}/profile`);
    return response.data;
  },

  /**
   * Get user's assigned cases
   */
  getUserCases: async (userId: string): Promise<any> => {
    const response = await api.get(`/users/${userId}/cases`);
    return response.data;
  },

  /**
   * Get user's generated reports
   */
  getUserReports: async (userId: string): Promise<any> => {
    const response = await api.get(`/users/${userId}/reports`);
    return response.data;
  },
};

