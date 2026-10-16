# TriFusion AI — API Contracts

> **Document Status:** Active Specification  
> **API Version:** v1 (`/api/v1`)  
> **Interactive Docs:** Swagger UI available at `/api/docs`

---

## 1. API Conventions

- **Base URL Prefix**: `/api/v1`
- **Payload Format**: `application/json`
- **Authentication**: Bearer Token in `Authorization` header (`Bearer <access_token>`)
- **Tenant Context**: `X-Workspace-Id: <uuid>` header for workspace-scoped actions (verified server-side against authenticated user's memberships)
- **Standard Error Response**:
  ```json
  {
    "statusCode": 400,
    "timestamp": "2026-10-15T12:00:00.000Z",
    "path": "/api/v1/auth/login",
    "message": "Invalid email or password",
    "errors": []
  }
  ```

---

## 2. Authentication & Identity Endpoints (`/api/v1/auth`)

### `POST /api/v1/auth/register`
- **Summary**: Register a new user account with personal workspace creation.
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "Password123!",
    "firstName": "John",
    "lastName": "Doe"
  }
  ```
- **Response `201 Created`**:
  ```json
  {
    "user": {
      "id": "c8a4d45e-...",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "isEmailVerified": false
    },
    "tokens": {
      "accessToken": "eyJhbGciOi...",
      "refreshToken": "d820f18a-..."
    }
  }
  ```

### `POST /api/v1/auth/login`
- **Summary**: Authenticate with email and password.
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "Password123!"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "user": {
      "id": "c8a4d45e-...",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe"
    },
    "tokens": {
      "accessToken": "eyJhbGciOi...",
      "refreshToken": "d820f18a-..."
    }
  }
  ```

### `POST /api/v1/auth/refresh`
- **Summary**: Refresh an expired access token using a valid refresh token.
- **Request Body**:
  ```json
  {
    "refreshToken": "d820f18a-..."
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "accessToken": "eyJhbGciOi...",
    "refreshToken": "e931g29b-..."
  }
  ```

### `POST /api/v1/auth/logout`
- **Summary**: Invalidate the user's refresh token and terminate session.
- **Headers**: `Authorization: Bearer <access_token>`
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "message": "Logged out successfully"
  }
  ```

### `GET /api/v1/auth/me`
- **Summary**: Retrieve currently authenticated user profile and workspaces.
- **Headers**: `Authorization: Bearer <access_token>`
- **Response `200 OK`**:
  ```json
  {
    "id": "c8a4d45e-...",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "isEmailVerified": false,
    "avatarUrl": null,
    "workspaces": [
      {
        "id": "w1b4d45e-...",
        "name": "John's Workspace",
        "slug": "johns-workspace",
        "type": "PERSONAL",
        "role": "OWNER"
      }
    ]
  }
  ```

### `POST /api/v1/auth/forgot-password`
- **Summary**: Request a password reset email token.
- **Request Body**:
  ```json
  {
    "email": "user@example.com"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "message": "If the email is registered, a password reset link has been dispatched."
  }
  ```

### `POST /api/v1/auth/reset-password`
- **Summary**: Reset password using a valid reset token.
- **Request Body**:
  ```json
  {
    "token": "reset-token-uuid",
    "newPassword": "NewPassword123!"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "message": "Password reset successfully. You may now sign in."
  }
  ```

---

## 3. Health & Monitoring Endpoints (`/api/v1/health`)

### `GET /api/v1/health`
- **Summary**: Liveness and readiness health check for load balancers and orchestrators.
- **Response `200 OK`**:
  ```json
  {
    "status": "ok",
    "timestamp": "2026-10-15T12:00:00.000Z",
    "uptime": 124.5,
    "services": {
      "database": "up",
      "redis": "up"
    }
  }
  ```
