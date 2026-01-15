import { Role } from '@prisma/client';

// JWT payload
export interface JwtPayload {
  userId: string;
  email: string;
  role: Role;
}

// Request with user
export interface AuthRequest extends Express.Request {
  user?: JwtPayload;
}

// API responses
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Pagination
export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
