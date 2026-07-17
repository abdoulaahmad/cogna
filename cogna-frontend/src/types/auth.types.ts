export interface User {
  id: string;
  fullName: string;
  email: string;
  role: 'CUSTOMER' | 'DEVELOPER' | 'ADMIN';
  adminRole?: 'SUPER_ADMIN' | 'ADMIN' | 'OPERATIONS' | 'SUPPORT' | 'FINANCE' | null;
  status: 'ACTIVE' | 'SUSPENDED' | 'PENDING';
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  isDeveloper?: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthData {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: Array<{ field: string; message: string }>;
}
