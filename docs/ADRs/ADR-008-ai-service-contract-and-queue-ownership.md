# ADR-008: AI Service Contract and Queue Ownership

## Status
Accepted

## Date
2026-10-22

## Context
Phase 6 requires transforming the Phase 1 health-only Django service into a full AI orchestration service. We need to define:
1. Why Django is used for AI orchestration
2. Which service owns which data
3. Which queue system owns which job types
4. How NestJS and Django authenticate each other
5. The contract between the two services

## Decision

### 1. Why Django for AI Orchestration
Django + Django REST Framework is chosen for the AI service because:
- **Python AI Ecosystem**: Direct access to the rich Python AI/ML ecosystem (OpenAI, Anthropic, LangChain, etc.)
- **Specialized Libraries**: Document processing, embeddings, and advanced NLP libraries are primarily Python-first
- **Django Admin**: Provides a convenient interface for debugging AI jobs and usage records (restricted in production)
- **Proven Framework**: Django REST Framework offers excellent serializers, validation, and API structure
- **Separation of Concerns**: Keeps AI-specific logic separate from the core business logic in NestJS

### 2. Data Ownership

**NestJS (apps/api) remains the single source of truth for:**
- User accounts and profiles
- Workspace and membership data
- Clients, projects, and tasks
- Activity events and audit logs
- All business entities and authorization

**Django (services/ai-django) owns ONLY:**
- AI-specific job records (AIJob model)
- AI usage tracking (AIUsageRecord model)
- Conversation turns (if the PRD requires them)
- Each row carries `workspaceId` and a reference ID to NestJS entities

**Django MUST NOT:**
- Create User, Workspace, Client, Project, or Task tables
- Duplicate core business entities
- Become a second identity system
- Store sensitive business data outside AI context

### 3. Database Strategy

**Django Database:**
- Uses a separate Neon database or schema for Django-owned data
- Connection via `DJANGO_DATABASE_URL` environment variable
- Migrations managed by Django's migration system only
- No overlap with Prisma-managed tables

**Rationale:**
- Clear separation of concerns
- Independent migration schedules
- Each service owns its data lifecycle
- Django can be scaled independently if needed

### 4. Queue Ownership

**Decision: NestJS BullMQ owns all jobs**

**NestJS BullMQ + Redis handles:**
- AI job orchestration (weekly reports, long summaries)
- Notification fan-out
- Email sending
- File scanning
- Orphan cleanup
- Due-soon/overdue reminders
- Scheduled report triggers

**Django has NO queue system:**
- Django provides synchronous AI calls only
- No Celery, no Django background tasks
- Django responses are returned within the HTTP request timeout
- Long-running work is queued in NestJS, which then calls Django synchronously

**Rationale:**
- **Simplicity**: One queue system (BullMQ) is easier to operate than two
- **Clear Ownership**: NestJS orchestrates all background work
- **Avoid Duplication**: No risk of two systems processing the same job category
- **Consistency**: All jobs share the same retry, backoff, and monitoring infrastructure
- **Python Already Used**: Django provides AI capabilities without needing its own queue

**Job Flow Example (Weekly Report):**
1. User requests weekly report via NestJS
2. NestJS creates a BullMQ job (status: QUEUED)
3. BullMQ worker picks up the job
4. Worker calls Django synchronously with signed service token
5. Django processes the request and returns the report
6. Worker updates job status to SUCCEEDED
7. NestJS notifies user via notification system

### 5. Service-to-Service Authentication

**Method: Signed JWT-like Tokens with HMAC-SHA256**

**Token Creation (NestJS):**
- NestJS creates tokens using the same secret as Django
- Secret: `AI_SERVICE_SHARED_SECRET` (must match in both services)
- Issuer: `trifusion-ai` (configurable via `AI_SERVICE_ISSUER`)
- Audience: `ai-django` (configurable via `AI_SERVICE_AUDIENCE`)
- TTL: 180 seconds (3 minutes, configurable via `AI_SERVICE_TOKEN_TTL_SECONDS`)
- Payload includes:
  - `workspace_id`: UUID of the workspace
  - `user_id`: UUID of the user
  - `role`: Workspace role (OWNER, TEAM_ADMIN, MEMBER, VIEWER)
  - `allowed_scopes`: List of permitted AI capabilities
  - `request_id`: Correlation ID for tracing
  - `nonce`: Unique identifier (jti) for replay protection
  - Standard JWT claims: `iss`, `aud`, `iat`, `nbf`, `exp`

**Token Verification (Django):**
- On every request, Django verifies:
  - Signature integrity (HMAC-SHA256)
  - Issuer matches expected value
  - Audience matches expected value
  - Token is not expired
  - Token is not used before `nbf` time
  - Token type is `service-token`
  - Required scope is present in `allowed_scopes`
- Replay protection via `jti` (nonce) if needed

**Key Rotation:**
- Both services use the same secret from environment
- Rotate by updating `AI_SERVICE_SHARED_SECRET` in both services and restarting
- Old tokens will fail signature verification after rotation

### 6. Service Contract

**Request Direction:**
- Browser → NestJS (REST/GraphQL/SSE)
- NestJS → Django (internal HTTP with signed token)
- Django → Browser: NEVER exposed directly

**Django Endpoints (Private, Versioned):**
```
GET  /health                    - Liveness probe
GET  /ready                     - Readiness probe
POST /v1/ai/project-summary     - Generate project summary
POST /v1/ai/weekly-report       - Generate weekly report
POST /v1/ai/task-suggestions   - Get task suggestions
POST /v1/ai/assistant           - Workspace assistant Q&A
```

**Authentication Header:**
```
Authorization: Bearer <signed-service-token>
```

**Request Headers:**
```
X-Request-Id: <correlation-id>  - Optional, propagated from NestJS
Content-Type: application/json
```

**Request Body Example (Project Summary):**
```json
{
  "workspace_id": "uuid",
  "user_id": "uuid",
  "request_id": "uuid",
  "project_id": "uuid",
  "tasks": [
    { "id": "uuid", "title": "Task 1", "status": "DONE" }
  ],
  "activity": [
    { "id": "uuid", "action": "TASK_CREATE", "timestamp": "ISO-8601" }
  ]
}
```

**Response Format:**
```json
{
  "status": "ok",
  "workspace_id": "uuid",
  "user_id": "uuid",
  "request_id": "uuid",
  "generated_at": "ISO-8601",
  "source_scope": "workspace:{id}",
  "provider": "openai",
  "model": "gpt-4",
  "output": {
    "facts": [...],
    "summary": "...",
    "suggestions": [...]
  }
}
```

**Error Format:**
```json
{
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

**Timeouts and Retries:**
- Request timeout: 30 seconds per call
- Retry: Only idempotent calls (weekly report, project summary)
- Backoff: Exponential with jitter
- Max retries: 3
- Circuit breaker in NestJS when Django is down

### 7. Data Flow Security

**Authorization Flow:**
1. Browser sends request to NestJS with user session/token
2. NestJS validates user authentication
3. NestJS checks workspace membership and role
4. NestJS checks resource-level permissions (project, task access)
5. NestJS gathers authorized, minimal context
6. NestJS creates signed service token with allowed scopes
7. NestJS calls Django with token and minimal data
8. Django verifies token signature and scopes
9. Django treats signed context as valid (due to signature)
10. Django processes AI request
11. Django returns structured, validated output
12. NestJS logs usage event and returns to browser

**Django Never Trusts:**
- Bare `userId` or `workspaceId` from request body
- Client-supplied role or permissions
- Data without signed token verification

**NestJS Never Sends:**
- Secrets, tokens, or passwords
- Unrelated personal data
- Data the user cannot access directly

### 8. Streaming

**Streaming Support:**
- Django provides streaming responses for long AI outputs
- NestJS proxies the stream to the browser via SSE
- Django is never exposed to the browser
- Client disconnects are handled by NestJS
- Cancellation is propagated from NestJS to Django

**Streaming Endpoint:**
```
POST /v1/ai/assistant/stream
```

**Response:** Server-Sent Events (SSE) stream

## Consequences

### Positive
- **Clear Separation**: NestJS owns business logic, Django owns AI capabilities
- **Single Queue**: BullMQ handles all background work simplifying operations
- **Security**: Signed tokens ensure Django only accepts authorized requests
- **Scalability**: Each service can be scaled independently
- **Flexibility**: AI providers can be swapped without changing NestJS
- **Auditability**: All AI usage is logged in NestJS with proper context

### Negative
- **Additional Complexity**: Two services to deploy and monitor instead of one
- **Network Latency**: Internal HTTP calls between services add latency
- **Shared Secret Management**: Both services must use the same secret and rotate together
- **Error Propagation**: Errors in Django must be mapped to user-friendly errors in NestJS

### Risks and Mitigations

**Risk: Secret Compromise**
- Mitigation: Rotate secrets regularly, use environment variables, never commit secrets

**Risk: Django Down**
- Mitigation: Circuit breaker in NestJS, graceful degradation, clear error messages

**Risk: Cross-Tenant Data Leakage**
- Mitigation: Signed tokens with workspace ID, Django never trusts raw IDs, comprehensive tests

**Risk: Replay Attacks**
- Mitigation: Short TTL (3 minutes), nonce (jti) in tokens, optional replay protection cache

**Risk: Queue Job Loss**
- Mitigation: BullMQ persistence in Redis, dead-letter queue, failed job inspection tools

## Alternatives Considered

### Alternative 1: Direct AI Integration in NestJS
- **Pros**: Single service, no network calls, simpler deployment
- **Cons**: Loses Python AI ecosystem advantages, harder to add advanced AI features later
- **Rejected**: Python ecosystem is valuable for advanced AI workloads

### Alternative 2: Celery in Django for AI Jobs
- **Pros**: Django handles its own jobs
- **Cons**: Two queue systems (BullMQ + Celery) to operate, risk of duplication
- **Rejected**: One queue system is simpler and clearer in ownership

### Alternative 3: mTLS for Service Authentication
- **Pros**: Stronger security than shared secret
- **Cons**: More complex to set up and manage certificates
- **Rejected**: Signed tokens with short TTL are sufficient for internal service-to-service communication

## References
- ADR-004: Django REST Framework for AI Service
- docs/AI_SAFETY.md
- docs/API_CONTRACTS.md
- docs/SECURITY.md
