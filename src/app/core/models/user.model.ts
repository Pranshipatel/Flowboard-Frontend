export interface AuthResponse {
  message: string;
  token: string | null;
}

export interface UserProfile {
  id: number;
  fullName: string;
  username: string;
  email: string;
  avatarUrl: string | null;
  bio: string | null;
  role: 'MEMBER' | 'BOARD_OWNER' | 'PLATFORM_ADMIN';
  active: boolean;
  emailVerified: boolean;
  createdAt: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  username: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface UpdateProfileRequest {
  fullname: string;
  username: string;
  avatarUrl?: string;
  bio?: string;
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}