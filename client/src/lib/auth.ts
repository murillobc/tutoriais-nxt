import { apiRequest } from "./queryClient";

export interface User {
  id: string;
  name: string;
  email: string;
  department: string;
  isActive: boolean;
  createdAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  department: string;
  password: string;
  confirmPassword: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  code: string;
  newPassword: string;
  confirmPassword: string;
}

export const auth = {
  async login(data: LoginRequest) {
    const response = await apiRequest("POST", "/api/auth/login", data);
    return response.json();
  },



  async register(data: RegisterRequest) {
    const response = await apiRequest("POST", "/api/auth/register", data);
    return response.json();
  },

  async logout() {
    const response = await apiRequest("POST", "/api/auth/logout");
    return response.json();
  },

  async getCurrentUser() {
    const response = await apiRequest("GET", "/api/auth/me");
    return response.json();
  },

  async forgotPassword(data: ForgotPasswordRequest) {
    const response = await apiRequest("POST", "/api/auth/forgot-password", data);
    return response.json();
  },

  async resetPassword(data: ResetPasswordRequest) {
    const response = await apiRequest("POST", "/api/auth/reset-password", data);
    return response.json();
  }
};
