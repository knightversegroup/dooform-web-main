// Auth Types
export interface User {
  id: number;
  email?: string;
  first_name?: string;
  last_name?: string;
  display_name?: string;
  picture_url?: string;
  phone?: string;
  organization?: string;
  google_id?: string;
  auth_provider: string;
  is_active: boolean;
  profile_completed: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    access_token: string;
    refresh_token: string;
    user: User;
  };
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshAccessToken: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
  setAuthState: (user: User, accessToken: string, refreshToken: string) => void;
}
