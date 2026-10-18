# AI Safety and Service Security

## Scope

This document defines the safety posture for the Django AI service used by TriFusion AI. The Django service is private and internal; it never owns the authoritative workspace data model. NestJS remains the single source of truth for identity, workspaces, memberships, clients, projects, tasks, and authorization.

## Service boundaries

- Browser requests never go directly to Django.
- NestJS authenticates the user and authorizes the requested workspace before calling Django.
- Django accepts only signed service tokens supplied by NestJS. The token includes `workspace_id`, `user_id`, `role`, `allowed_scopes`, and `request_id` and is validated on every request.
- Django treats the signed context as valid evidence only when the token signature, issuer, audience, and expiry checks pass.
- No bare `userId` and `workspaceId` values are accepted as proof of access.

## Safety rules

- All prompt inputs are treated as untrusted and sanitized before use.
- Retrieval results must be explicit and read-only. No free-form database access is allowed.
- Every function call is allowlisted, and the tool list is intentionally narrow: `project_summary`, `weekly_report`, `task_suggestions`, and `workspace_assistant`.
- Output is validated before it reaches the UI. If data is missing or ambiguous, the model must say so clearly.
- Generated content is labeled as AI-generated and clearly distinguished from source facts.
- Secret values such as API keys, tokens, and passwords are redacted from logs and responses.

## Quotas and rate limits

- Per-user/per-workspace quotas are enforced before any provider call.
- Requests over quota return a clear `429` response without attempting the provider call.
- Quotas are small and intentionally conservative; they are tuned by usage data rather than guessed.

## Audit and retention

- NestJS records AI usage events with workspace, user, capability, request ID, and token counts.
- Django logs request metadata but never stores raw secrets or full customer prompts in plain text.
- AI jobs and conversation records must be retained only as long as needed for support and billing, with deletion paths tied to workspace or user deletion events.

## Prompt injection protections

- The system uses an instruction hierarchy where system instructions stay authoritative and retrieved content is treated as untrusted data.
- The provider receives a clear boundary between instructions and data.
- No provider action is triggered solely from retrieved content.
- Generated output is checked for secrets, cross-workspace leakage, and unsupported values before returning.

## Provider and model rules

- Model providers are abstracted behind a provider interface so they can be swapped without changing product logic.
- The implementation uses a deterministic mock provider for tests; it never calls a paid API.
- Provider secrets remain in the Django service environment only and are never sent to the browser or NestJS.
