import { test, expect } from '@playwright/test';

const API_BASE = process.env.API_BASE_URL || 'http://localhost:3001/api/v1';

test.describe('Authentication E2E', () => {
  let accessToken: string;
  let refreshToken: string;
  let userId: string;
  let workspaceId: string;

  test('register a new user', async ({ request }) => {
    const email = `e2e-${Date.now()}@test.com`;
    const response = await request.post(`${API_BASE}/auth/register`, {
      data: {
        email,
        password: 'SecurePass123!',
        firstName: 'E2E',
        lastName: 'Test',
      },
    });
    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body.user.id).toBeDefined();
    expect(body.tokens.accessToken).toBeDefined();
    userId = body.user.id;
  });

  test('login with registered user', async ({ request }) => {
    // Use a fixed email for login - register first
    const email = `e2e-login-${Date.now()}@test.com`;
    await request.post(`${API_BASE}/auth/register`, {
      data: {
        email,
        password: 'SecurePass123!',
        firstName: 'E2E',
        lastName: 'Login',
      },
    });

    const response = await request.post(`${API_BASE}/auth/login`, {
      data: { email, password: 'SecurePass123!' },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.tokens.accessToken).toBeDefined();
    expect(body.tokens.refreshToken).toBeDefined();
    accessToken = body.tokens.accessToken;
    refreshToken = body.tokens.refreshToken;
    userId = body.user.id;
  });

  test('get current user profile', async ({ request }) => {
    if (!accessToken) {
      test.skip();
    }
    const response = await request.get(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(response.status()).toBe(200);
  });

  test('refresh access token', async ({ request }) => {
    if (!refreshToken) {
      test.skip();
    }
    const response = await request.post(`${API_BASE}/auth/refresh`, {
      data: { refreshToken },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.tokens.accessToken).toBeDefined();
    accessToken = body.tokens.accessToken;
  });
});

test.describe('Workspace E2E', () => {
  let accessToken: string;
  let workspaceId: string;

  test.beforeEach(async ({ request }) => {
    // Register and login to get a token
    const email = `e2e-ws-${Date.now()}@test.com`;
    await request.post(`${API_BASE}/auth/register`, {
      data: { email, password: 'SecurePass123!', firstName: 'E2E', lastName: 'WS' },
    });
    const loginRes = await request.post(`${API_BASE}/auth/login`, {
      data: { email, password: 'SecurePass123!' },
    });
    const body = await loginRes.json();
    accessToken = body.tokens.accessToken;
    workspaceId = body.user.workspaces[0].id;
  });

  test('get user workspaces', async ({ request }) => {
    const response = await request.get(`${API_BASE}/workspaces`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test('create a company workspace', async ({ request }) => {
    const response = await request.post(`${API_BASE}/workspaces`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: {
        name: 'E2E Test Workspace',
      },
    });
    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body.id).toBeDefined();
    workspaceId = body.id;
  });

  test('get workspace members', async ({ request }) => {
    if (!workspaceId) {
      test.skip();
    }
    const response = await request.get(
      `${API_BASE}/workspaces/${workspaceId}/members`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    expect(response.status()).toBe(200);
  });
});

test.describe('Client CRUD E2E', () => {
  let accessToken: string;
  let workspaceId: string;
  let clientId: string;

  test.beforeEach(async ({ request }) => {
    const email = `e2e-client-${Date.now()}@test.com`;
    await request.post(`${API_BASE}/auth/register`, {
      data: { email, password: 'SecurePass123!', firstName: 'E2E', lastName: 'Client' },
    });
    const loginRes = await request.post(`${API_BASE}/auth/login`, {
      data: { email, password: 'SecurePass123!' },
    });
    const body = await loginRes.json();
    accessToken = body.tokens.accessToken;
    workspaceId = body.user.workspaces[0].id;
  });

  test('create a client', async ({ request }) => {
    const response = await request.post(
      `${API_BASE}/workspaces/${workspaceId}/clients`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        data: {
          name: 'E2E Test Client',
          email: 'client@e2e.com',
          phone: '+1234567890',
          notes: 'E2E test client',
        },
      },
    );
    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body.id).toBeDefined();
    clientId = body.id;
  });

  test('list clients', async ({ request }) => {
    const response = await request.get(
      `${API_BASE}/workspaces/${workspaceId}/clients`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body.data)).toBe(true);
  });

  test('get a client by ID', async ({ request }) => {
    if (!clientId) {
      test.skip();
    }
    const response = await request.get(
      `${API_BASE}/workspaces/${workspaceId}/clients/${clientId}`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    expect(response.status()).toBe(200);
  });

  test('update a client', async ({ request }) => {
    if (!clientId) {
      test.skip();
    }
    const response = await request.patch(
      `${API_BASE}/workspaces/${workspaceId}/clients/${clientId}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        data: { name: 'Updated E2E Client' },
      },
    );
    expect(response.status()).toBe(200);
  });

  test('archive a client', async ({ request }) => {
    if (!clientId) {
      test.skip();
    }
    const response = await request.delete(
      `${API_BASE}/workspaces/${workspaceId}/clients/${clientId}`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    expect(response.status()).toBe(200);
  });
});

test.describe('Project CRUD E2E', () => {
  let accessToken: string;
  let workspaceId: string;
  let projectId: string;

  test.beforeEach(async ({ request }) => {
    const email = `e2e-proj-${Date.now()}@test.com`;
    await request.post(`${API_BASE}/auth/register`, {
      data: { email, password: 'SecurePass123!', firstName: 'E2E', lastName: 'Proj' },
    });
    const loginRes = await request.post(`${API_BASE}/auth/login`, {
      data: { email, password: 'SecurePass123!' },
    });
    const body = await loginRes.json();
    accessToken = body.tokens.accessToken;
    workspaceId = body.user.workspaces[0].id;
  });

  test('create a project', async ({ request }) => {
    const response = await request.post(
      `${API_BASE}/workspaces/${workspaceId}/projects`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        data: {
          name: 'E2E Test Project',
          status: 'PLANNING',
          description: 'E2E test project description',
        },
      },
    );
    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body.id).toBeDefined();
    projectId = body.id;
  });

  test('list projects', async ({ request }) => {
    const response = await request.get(
      `${API_BASE}/workspaces/${workspaceId}/projects`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body.data)).toBe(true);
  });

  test('get a project by ID', async ({ request }) => {
    if (!projectId) {
      test.skip();
    }
    const response = await request.get(
      `${API_BASE}/workspaces/${workspaceId}/projects/${projectId}`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    expect(response.status()).toBe(200);
  });

  test('update project status', async ({ request }) => {
    if (!projectId) {
      test.skip();
    }
    const response = await request.patch(
      `${API_BASE}/workspaces/${workspaceId}/projects/${projectId}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        data: { status: 'ACTIVE' },
      },
    );
    expect(response.status()).toBe(200);
  });
});

test.describe('Task CRUD E2E', () => {
  let accessToken: string;
  let workspaceId: string;
  let projectId: string;
  let taskId: string;

  test.beforeEach(async ({ request }) => {
    const email = `e2e-task-${Date.now()}@test.com`;
    await request.post(`${API_BASE}/auth/register`, {
      data: { email, password: 'SecurePass123!', firstName: 'E2E', lastName: 'Task' },
    });
    const loginRes = await request.post(`${API_BASE}/auth/login`, {
      data: { email, password: 'SecurePass123!' },
    });
    const body = await loginRes.json();
    accessToken = body.tokens.accessToken;
    workspaceId = body.user.workspaces[0].id;

    // Create a project first
    const projRes = await request.post(
      `${API_BASE}/workspaces/${workspaceId}/projects`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        data: { name: 'Task Test Project', status: 'ACTIVE' },
      },
    );
    projectId = (await projRes.json()).id;
  });

  test('create a task', async ({ request }) => {
    const response = await request.post(
      `${API_BASE}/workspaces/${workspaceId}/tasks`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        data: {
          projectId,
          title: 'E2E Test Task',
          status: 'TODO',
          priority: 'HIGH',
          description: 'E2E test task description',
        },
      },
    );
    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body.id).toBeDefined();
    taskId = body.id;
  });

  test('list tasks', async ({ request }) => {
    const response = await request.get(
      `${API_BASE}/workspaces/${workspaceId}/tasks`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body.data)).toBe(true);
  });

  test('update task status', async ({ request }) => {
    if (!taskId) {
      test.skip();
    }
    const response = await request.patch(
      `${API_BASE}/workspaces/${workspaceId}/tasks/${taskId}/status`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        data: { status: 'IN_PROGRESS' },
      },
    );
    expect(response.status()).toBe(200);
  });
});

test.describe('AI Assistant E2E', () => {
  let accessToken: string;
  let workspaceId: string;
  let userId: string;

  test.beforeEach(async ({ request }) => {
    const email = `e2e-ai-${Date.now()}@test.com`;
    await request.post(`${API_BASE}/auth/register`, {
      data: { email, password: 'SecurePass123!', firstName: 'E2E', lastName: 'AI' },
    });
    const loginRes = await request.post(`${API_BASE}/auth/login`, {
      data: { email, password: 'SecurePass123!' },
    });
    const body = await loginRes.json();
    accessToken = body.tokens.accessToken;
    workspaceId = body.user.workspaces[0].id;
    userId = body.user.id;
  });

  test('generate project summary via AI', async ({ request }) => {
    // Create a project first
    const projRes = await request.post(
      `${API_BASE}/workspaces/${workspaceId}/projects`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        data: { name: 'AI Test Project', status: 'ACTIVE' },
      },
    );
    const project = await projRes.json();

    const meRes = await request.post(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const meBody = await meRes.json();

    const response = await request.post(
      `${API_BASE}/workspaces/${workspaceId}/ai/project-summary`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        data: {
          workspace_id: workspaceId,
          user_id: meBody.id,
          role: 'OWNER',
          project_id: project.id,
          tasks: [],
          activity: [],
        },
      },
    );
    expect([200, 429]).toContain(response.status()); // 429 if quota exceeded
  });

  test('ask workspace assistant', async ({ request }) => {
    const response = await request.post(
      `${API_BASE}/workspaces/${workspaceId}/ai/assistant`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        data: {
          workspace_id: workspaceId,
          user_id: userId,
          role: 'OWNER',
          question: 'What is the status of my project?',
          retrieved_context: [],
        },
      },
    );
    expect([200, 429]).toContain(response.status()); // 429 if quota exceeded
  });
});
