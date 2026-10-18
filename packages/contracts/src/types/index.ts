// Shared TypeScript types for TriFusion AI

export type WorkspaceType = 'PERSONAL' | 'COMPANY';
export type WorkspaceRole = 'OWNER' | 'TEAM_ADMIN' | 'MEMBER' | 'VIEWER';

export interface User {
  id: string;
  email: string;
  isEmailVerified: boolean;
  isActive: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface UserProfile {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
  timezone: string;
  locale: string;
}

export interface WorkspaceSummary {
  id: string;
  name: string;
  slug: string;
  type: WorkspaceType;
  role: WorkspaceRole;
}

export interface AuthUserResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isEmailVerified: boolean;
  avatarUrl?: string | null;
  workspaces: WorkspaceSummary[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn?: number;
}

export interface AuthResponse {
  user: AuthUserResponse;
  tokens: AuthTokens;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export type ClientStatus = 'ACTIVE' | 'ARCHIVED';
export type ProjectStatus = 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'ARCHIVED';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface Client {
  id: string;
  workspaceId: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  address?: string | null;
  notes?: string | null;
  status: ClientStatus;
  createdBy: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  deletedAt?: string | Date | null;
}

export interface Project {
  id: string;
  workspaceId: string;
  clientId?: string | null;
  name: string;
  description?: string | null;
  status: ProjectStatus;
  startDate?: string | Date | null;
  endDate?: string | Date | null;
  createdBy: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  deletedAt?: string | Date | null;
}

export interface Task {
  id: string;
  workspaceId: string;
  projectId: string;
  assigneeId?: string | null;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string | Date | null;
  createdBy: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  deletedAt?: string | Date | null;
}

export interface ActivityEvent {
  id: string;
  workspaceId: string;
  actorId?: string | null;
  entityType: string;
  entityId: string;
  action: string;
  metadata?: unknown;
  createdAt: string | Date;
}

export interface PaginatedResponse<T> {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
  total: number;
  limit: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  statusCode?: number;
  timestamp?: string;
}
