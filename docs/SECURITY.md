# TriFusion AI — Security Guidelines & Threat Model

> **Document Status:** Active Security Architecture  
> **Last Updated:** 2026-10-15  
> **Compliance Target:** OWASP Top 10, Multi-Tenant Data Isolation, SOC2 Type 1 Readiness

---

## 1. Security Principles

1. **Privacy by Default**: Multi-tenancy isolation is strictly enforced at every layer (Network, Gateway, API Guard, Service Query, Database). No user may ever access another workspace's records.
2. **Never Trust the Client**: Frontend assertions of `userId`, `workspaceId`, `role`, or permissions are treated as untrusted input. The API server always validates identity from signed JWTs and database memberships.
3. **Defense in Depth**: Security controls operate redundantly: schema constraints, foreign key indexes, NestJS Guards, DTO validation pipes, and database query filters.
4. **Least Privilege**: Tokens are short-lived (15 min), roles are strictly bounded (`OWNER`, `TEAM_ADMIN`, `MEMBER`, `VIEWER`), and platform admins have zero default customer-data visibility.

---

## 2. Threat Model & Mitigations

| Threat | Attack Vector | Mitigation Strategy |
|---|---|---|
| **Cross-Tenant Data Leakage** | Modifying `workspaceId` or resource ID in request payload/URL | Every query verifies authenticated user is an active member of target workspace with appropriate role. |
| **Credential Stuffing / Brute Force** | Automated dictionary attacks against `/api/v1/auth/login` | NestJS `@nestjs/throttler` rate limiting by IP and email; Bcrypt salted hashing (12 rounds). |
| **JWT Tampering / Forgery** | Altering JWT payload or signature | Signed with HMAC-SHA256 using 256-bit cryptographically secure secret (`AUTH_SECRET`). Explicit algorithm verification. |
| **Privilege Escalation** | Client sending elevated role in register or update payload | Strict DTO validation with `forbidNonWhitelisted: true`; roles can only be updated by authorized workspace owners. |
| **SQL / ORM Injection** | Malicious input in filters or query parameters | Prisma parameterization on all queries; no raw SQL execution without strict typing. |
| **Cross-Site Scripting (XSS)** | Malicious scripts injected into client/project names | React automatic escaping, strict Content Security Policy (CSP), sanitize input before persistence. |
| **Cross-Site Request Forgery (CSRF)**| Browser sending forged requests with credentials | Bearer token authorization header (not implicit cookie transmission for API mutations). |
| **Prompt Injection (AI)** | User embedding instructions into task titles/docs to trick LLM | System prompt framing, input truncation, delimiter sandboxing, and strict permission-checked context retrieval before LLM call. |

---

## 3. Authentication & Session Strategy

- **Passwords**:
  - Hashed using `bcrypt` with work factor 12.
  - Plaintext passwords are never logged, stored in cache, or returned in API responses.
  - Strict password policy: minimum 8 characters, at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 symbol.
- **Tokens**:
  - **Access Token**: JWT format, 15-minute expiration, containing `sub` (userId), `email`, and token issuance timestamp.
  - **Refresh Token**: Cryptographically random 64-character token stored hashed in PostgreSQL with 7-day expiration and rotation upon use.
  - **Password Reset**: Single-use token valid for 1 hour, invalidated immediately upon successful password change.

---

## 4. Incident Response & Vulnerability Reporting

- Security vulnerabilities should be reported directly to `security@trifusion.ai`.
- Security incident response procedures mandate immediate token revocation capability via Redis and DB revocation lists.
