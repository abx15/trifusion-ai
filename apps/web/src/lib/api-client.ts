import type {
  ActivityEvent,
  AuthUserResponse,
  Client,
  ClientInput,
  LoginRequest,
  PaginatedResponse,
  Project,
  ProjectInput,
  RegisterRequest,
  Task,
  TaskInput,
  TaskStatusInput,
  WorkspaceRole,
  WorkspaceSettingsInput,
} from '@trifusion/contracts';

export class ApiClientError extends Error {
  constructor(
    message: string,
    readonly statusCode: number,
    readonly errors?: unknown[],
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

export interface WorkspaceSettings {
  id: string;
  workspaceId: string;
  companyName: string | null;
  companyEmail: string | null;
}

export interface WorkspaceMember {
  id: string;
  userId: string;
  email: string;
  name: string;
  role: WorkspaceRole;
  status: string;
  joinedAt: string;
}

export interface WorkspaceInvitation {
  id: string;
  email: string;
  role: WorkspaceRole;
  expiresAt: string;
  status: string;
}

export interface Page<T> extends PaginatedResponse<T> {}

type Query = Record<string, string | number | boolean | null | undefined>;

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set('Accept', 'application/json');
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  let response: Response;
  try {
    response = await fetch(`/api/backend/${endpoint.replace(/^\/+/, '')}`, {
      ...options,
      headers,
      credentials: 'same-origin',
      cache: 'no-store',
    });
  } catch (error) {
    throw new ApiClientError(
      error instanceof Error ? error.message : 'Network connection failed',
      0,
    );
  }

  if (!response.ok) {
    let errorMessage = `Request failed with status ${response.status}`;
    let errors: unknown[] | undefined;
    try {
      const errorData: unknown = await response.json();
      if (errorData && typeof errorData === 'object') {
        if ('message' in errorData) {
          const message = errorData.message;
          errorMessage = Array.isArray(message)
            ? message.join(', ')
            : typeof message === 'string'
              ? message
              : errorMessage;
        }
        if ('errors' in errorData && Array.isArray(errorData.errors)) {
          errors = errorData.errors;
        }
      }
    } catch {
      errorMessage = `Request failed with status ${response.status}`;
    }
    throw new ApiClientError(errorMessage, response.status, errors);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

function queryString(query: Query): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value));
    }
  }
  const encoded = params.toString();
  return encoded ? `?${encoded}` : '';
}

function workspacePath(workspaceId: string, resource: string): string {
  return `workspaces/${encodeURIComponent(workspaceId)}/${resource}`;
}

export const apiClient = {
  auth: {
    login: (data: LoginRequest) =>
      request<{ user: AuthUserResponse }>('auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    register: (data: RegisterRequest) =>
      request<{ user: AuthUserResponse }>('auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    logout: () =>
      request<{ success: boolean; message: string }>('auth/logout', {
        method: 'POST',
      }),
    getMe: () => request<AuthUserResponse>('auth/me'),
    forgotPassword: (data: { email: string }) =>
      request<{ message: string }>('auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    resetPassword: (data: { token: string; newPassword: string }) =>
      request<{ message: string }>('auth/reset-password', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  workspaces: {
    list: () => request<AuthUserResponse['workspaces']>('workspaces'),
    validate: (workspaceId: string) =>
      request<{ valid: true; workspaceId: string; workspaceName: string; role: WorkspaceRole }>(
        workspacePath(workspaceId, 'validate'),
      ),
    members: (workspaceId: string) =>
      request<WorkspaceMember[]>(workspacePath(workspaceId, 'members')),
    invitations: (workspaceId: string) =>
      request<WorkspaceInvitation[]>(workspacePath(workspaceId, 'invitations')),
    invite: (workspaceId: string, email: string, role: WorkspaceRole) =>
      request<WorkspaceInvitation & { invitationToken: string }>(workspacePath(workspaceId, 'invitations'), {
        method: 'POST',
        body: JSON.stringify({ email, role }),
      }),
    updateMemberRole: (workspaceId: string, userId: string, role: WorkspaceRole) =>
      request<WorkspaceMember>(
        `${workspacePath(workspaceId, `members/${encodeURIComponent(userId)}/role`)}`,
        { method: 'PATCH', body: JSON.stringify({ role }) },
      ),
    removeMember: (workspaceId: string, userId: string) =>
      request<{ success: boolean }>(
        workspacePath(workspaceId, `members/${encodeURIComponent(userId)}`),
        { method: 'DELETE' },
      ),
    revokeInvitation: (workspaceId: string, invitationId: string) =>
      request<{ success: boolean }>(
        workspacePath(workspaceId, `invitations/${encodeURIComponent(invitationId)}`),
        { method: 'DELETE' },
      ),
    update: (workspaceId: string, name: string) =>
      request<{ id: string; name: string }>(`workspaces/${encodeURIComponent(workspaceId)}`, {
        method: 'PATCH',
        body: JSON.stringify({ name }),
      }),
  },

  clients: {
    list: (workspaceId: string, query: Query = {}) =>
      request<Page<Client>>(`${workspacePath(workspaceId, 'clients')}${queryString(query)}`),
    get: (workspaceId: string, id: string) =>
      request<Client>(workspacePath(workspaceId, `clients/${encodeURIComponent(id)}`)),
    create: (workspaceId: string, input: ClientInput) =>
      request<Client>(workspacePath(workspaceId, 'clients'), {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    update: (workspaceId: string, id: string, input: Partial<ClientInput>) =>
      request<Client>(workspacePath(workspaceId, `clients/${encodeURIComponent(id)}`), {
        method: 'PATCH',
        body: JSON.stringify(input),
      }),
    archive: (workspaceId: string, id: string) =>
      request<Client>(workspacePath(workspaceId, `clients/${encodeURIComponent(id)}/archive`), {
        method: 'DELETE',
      }),
  },

  projects: {
    list: (workspaceId: string, query: Query = {}) =>
      request<Page<Project>>(`${workspacePath(workspaceId, 'projects')}${queryString(query)}`),
    get: (workspaceId: string, id: string) =>
      request<Project>(workspacePath(workspaceId, `projects/${encodeURIComponent(id)}`)),
    create: (workspaceId: string, input: ProjectInput) =>
      request<Project>(workspacePath(workspaceId, 'projects'), {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    update: (workspaceId: string, id: string, input: Partial<ProjectInput>) =>
      request<Project>(workspacePath(workspaceId, `projects/${encodeURIComponent(id)}`), {
        method: 'PATCH',
        body: JSON.stringify(input),
      }),
    archive: (workspaceId: string, id: string) =>
      request<Project>(workspacePath(workspaceId, `projects/${encodeURIComponent(id)}/archive`), {
        method: 'DELETE',
      }),
  },

  tasks: {
    list: (workspaceId: string, query: Query = {}) =>
      request<Page<Task>>(`${workspacePath(workspaceId, 'tasks')}${queryString(query)}`),
    get: (workspaceId: string, id: string) =>
      request<Task>(workspacePath(workspaceId, `tasks/${encodeURIComponent(id)}`)),
    create: (workspaceId: string, input: TaskInput) =>
      request<Task>(workspacePath(workspaceId, 'tasks'), {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    update: (workspaceId: string, id: string, input: Partial<TaskInput>) =>
      request<Task>(workspacePath(workspaceId, `tasks/${encodeURIComponent(id)}`), {
        method: 'PATCH',
        body: JSON.stringify(input),
      }),
    updateStatus: (workspaceId: string, id: string, input: TaskStatusInput) =>
      request<Task>(workspacePath(workspaceId, `tasks/${encodeURIComponent(id)}/status`), {
        method: 'PATCH',
        body: JSON.stringify(input),
      }),
    archive: (workspaceId: string, id: string) =>
      request<Task>(workspacePath(workspaceId, `tasks/${encodeURIComponent(id)}/archive`), {
        method: 'DELETE',
      }),
  },

  activity: {
    list: (workspaceId: string, query: Query = {}) =>
      request<Page<ActivityEvent>>(`${workspacePath(workspaceId, 'activity')}${queryString(query)}`),
  },

  settings: {
    get: (workspaceId: string) =>
      request<WorkspaceSettings | null>(workspacePath(workspaceId, 'settings')),
    update: (workspaceId: string, input: WorkspaceSettingsInput) =>
      request<WorkspaceSettings>(workspacePath(workspaceId, 'settings'), {
        method: 'PATCH',
        body: JSON.stringify(input),
      }),
  },

  graphql: async <T>(query: string, variables: Record<string, unknown>) => {
    const result = await request<{
      data?: T;
      errors?: Array<{ message: string }>;
    }>('graphql', {
      method: 'POST',
      body: JSON.stringify({ query, variables }),
    });
    if (result.errors?.length) {
      throw new ApiClientError(result.errors.map((error) => error.message).join('; '), 400);
    }
    if (!result.data) {
      throw new ApiClientError('GraphQL response did not contain data', 502);
    }
    return result.data;
  },
};
