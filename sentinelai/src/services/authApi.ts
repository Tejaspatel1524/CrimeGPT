import api from './api';

export interface RegisterData {
  full_name: string;
  email: string;
  password: string;
  role?: 'admin' | 'investigator' | 'viewer';
  department?: string;
}

export interface LoginData {
  email: string;
  password: string;
  remember_me?: boolean;
}

export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  username?: string | null;
  role: 'admin' | 'investigator' | 'viewer';
  department?: string | null;
  phone?: string | null;
  profile_photo?: string | null;
  is_active: boolean;
  account_status?: string;
  failed_login_attempts?: number;
  last_login?: string | null;
  created_at: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  role: string;
  user: UserProfile;
}

export interface PasswordChangeData {
  current_password: string;
  new_password: string;
}

export interface ForgotPasswordData {
  email: string;
}


export interface ProfileUpdateData {
  full_name?: string;
  username?: string;
  department?: string;
  phone?: string;
  profile_photo?: string;
}

// Token management
export const TOKEN_KEY = 'sentinelai_token';
export const USER_KEY = 'sentinelai_user';

export const setAuthToken = (token: string) => {
  localStorage.setItem(TOKEN_KEY, token);
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
};

export const getAuthToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export const removeAuthToken = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  delete api.defaults.headers.common['Authorization'];
};

export const setUserData = (user: UserProfile) => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const getUserData = (): UserProfile | null => {
  const data = localStorage.getItem(USER_KEY);
  return data ? JSON.parse(data) : null;
};

// Initialize auth on app load
export const initializeAuth = () => {
  const token = getAuthToken();
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }
};

// Auth API calls
export const authApi = {
  register: async (data: RegisterData): Promise<UserProfile> => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  login: async (data: LoginData): Promise<LoginResponse> => {
    const response = await api.post('/auth/login', data);
    const { access_token, user } = response.data;
    setAuthToken(access_token);
    setUserData(user);
    return response.data;
  },

  logout: () => {
    removeAuthToken();
  },

  getCurrentUser: async (): Promise<UserProfile> => {
    const response = await api.get('/auth/me');
    setUserData(response.data);
    return response.data;
  },

  updateProfile: async (data: ProfileUpdateData): Promise<UserProfile> => {
    const response = await api.put('/auth/profile', data);
    setUserData(response.data);
    return response.data;
  },

  changePassword: async (data: PasswordChangeData): Promise<{ message: string }> => {
    const response = await api.post('/auth/change-password', data);
    return response.data;
  },

  forgotPassword: async (data: ForgotPasswordData): Promise<{ message: string; note?: string }> => {
    const response = await api.post('/auth/forgot-password', data);
    return response.data;
  },
};
