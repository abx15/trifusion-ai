import type {
  RegisterRequest,
  LoginRequest,
  RefreshTokenRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  AuthResponse,
  AuthUserResponse,
  AuthTokens,
} from '@trifusion/contracts';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

const HEALTH_URL =
  process.env.NEXT_PUBLIC_HEALTH_URL || 'http://localhost:3001';

class ApiClientError extends Error {
  statusCode: number;
  errors?: unknown[];

  constructor(message: string, statusCode: number, errors?: unknown[]) {
    super(message);
    this.name = 'ApiClientError';
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

class ApiClient {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.accessToken = localStorage.getItem('trifusion_access_token');
      this.refreshToken = localStorage.getItem('trifusion_refresh_token');
    }
  }

  setTokens(tokens: AuthTokens | null) {
    if (typeof window !== 'undefined') {
      if (tokens) {
        this.accessToken = tokens.accessToken;
        this.refreshToken = tokens.refreshToken;
        localStorage.setItem('trifusion_access_token', tokens.accessToken);
        localStorage.setItem('trifusion_refresh_token', tokens.refreshToken);
      } else {
        this.accessToken = null;
        this.refreshToken = null;
        localStorage.removeItem('trifusion_access_token');
        localStorage.removeItem('trifusion_refresh_token');
      }
    }
  }

  getAccessToken(): string | null {
    if (!this.accessToken && typeof window !== 'undefined') {
      this.accessToken = localStorage.getItem('trifusion_access_token');
    }
    return this.accessToken;
  }

  getRefreshToken(): string | null {
    if (!this.refreshToken && typeof window !== 'undefined') {
      this.refreshToken = localStorage.getItem('trifusion_refresh_token');
    }
    return this.refreshToken;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retryOnAuth = true,
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = this.getAccessToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Handle 401 Unauthorized token refresh
      if (response.status === 401 && retryOnAuth && this.getRefreshToken()) {
        const refreshed = await this.refreshTokens();
        if (refreshed) {
          return this.request<T>(endpoint, options, false);
        }
      }

      if (!response.ok) {
        let errorMessage = `HTTP error! Status: ${response.status}`;
        let errors: unknown[] | undefined;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
          errors = errorData.errors;
        } catch {
          // ignore json parse error
        }
        throw new ApiClientError(errorMessage, response.status, errors);
      }

      return (await response.json()) as T;
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      throw new ApiClientError(
        (error as Error).message || 'Network connection failed',
        0,
      );
    }
  }

  private async refreshTokens(): Promise<boolean> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) return false;

    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken } as RefreshTokenRequest),
      });

      if (!response.ok) {
        this.setTokens(null);
        return false;
      }

      const data = (await response.json()) as AuthTokens;
      this.setTokens(data);
      return true;
    } catch {
      this.setTokens(null);
      return false;
    }
  }

  // Auth Endpoints
  auth = {
    register: (data: RegisterRequest) =>
      this.request<AuthResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    login: (data: LoginRequest) =>
      this.request<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    logout: async () => {
      try {
        await this.request<{ success: boolean; message: string }>('/auth/logout', {
          method: 'POST',
        });
      } finally {
        this.setTokens(null);
      }
    },

    getMe: () => this.request<AuthUserResponse>('/auth/me'),

    forgotPassword: (data: ForgotPasswordRequest) =>
      this.request<{ message: string }>('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    resetPassword: (data: ResetPasswordRequest) =>
      this.request<{ message: string }>('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  };

  // Health Endpoint
  health = {
    check: () =>
      fetch(`${HEALTH_URL}/health`, {
        headers: { Accept: 'application/json' },
      }).then((res) =>
        res.json() as Promise<{
          status: string;
          timestamp: string;
          uptimeSeconds: number;
          services: { database: string };
        }>,
      ),
  };
}

export const apiClient = new ApiClient();
export { ApiClientError };

