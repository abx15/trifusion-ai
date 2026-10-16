# ADR-002: Identity & Authentication Strategy

## Status
Accepted

## Date
2026-10-15

## Context
TriFusion AI requires a secure identity system that handles personal user registration, password security, email verification, password resets, and session management while maintaining a single authoritative identity source of truth. We evaluated external managed auth (e.g. Supabase Auth) vs. an internal NestJS Auth module.

## Decision
Implement a first-party NestJS Authentication Module utilizing JWTs (Access Tokens) and rotating Refresh Tokens backed by PostgreSQL and Prisma:
1. Passwords hashed using `bcrypt` (work factor 12).
2. Short-lived Access Tokens (15 min expiry) containing `sub` (userId) and `email`.
3. Long-lived Refresh Tokens stored hashed in the database, with device information and single-use rotation.
4. Single-use email verification and password reset tokens with strict expiration.
5. All tenant-scoped operations must resolve the user identity from verified JWTs, never trusting client-provided headers or bodies.

## Consequences
- **Positive**: Total architectural control, zero vendor lock-in, seamless integration with custom tenancy models and audit logs, no external latency or billing dependencies for core auth.
- **Negative**: Full operational responsibility for token rotation, password hashing, and brute-force protection.

