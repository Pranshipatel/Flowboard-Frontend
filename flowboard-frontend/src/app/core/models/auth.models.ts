export interface RegisterUserDto {
  firstName?: string;
  lastName?: string;
  email: string;
  password: string;
}

export interface LoginUserDto {
  email: string;
  password: string;
}

// backend returns a String token for login/refresh
export type JwtTokenResponse = string;

export interface UserProfileDto {
  id?: number;
  userId?: number; // depending on your DTO
  email?: string;
  firstName?: string;
  lastName?: string;
  // add fields as your backend returns them
}

export interface UpdateUserProfileDto {
  firstName?: string;
  lastName?: string;
  // add fields to match backend
}