# ADR-009: AI Provider Adapter and Quota Model

## Status
Accepted

## Date
2026-10-22

## Context
Phase 6 requires implementing AI capabilities with support for multiple model providers (OpenAI, Anthropic, and potentially others). We need to define:
1. How to abstract provider implementations so they can be swapped
2. How to track usage and enforce quotas
3. How to handle provider failures and retries
4. How to ensure tests never call paid APIs

## Decision

### 1. Provider Adapter Interface

**Abstract Base Class:**
```python
class ProviderAdapter(ABC):
    """Interface implemented by all AI providers."""

    name: str
    model: str

    @abstractmethod
    def generate(self, *, prompt: str, max_tokens: int, temperature: float) -> dict[str, Any]:
        """Generate a complete response."""
        raise NotImplementedError

    @abstractmethod
    def generate_stream(self, *, prompt: str, max_tokens: int, temperature: float) -> Iterator[dict[str, Any]]:
        """Generate a streaming response."""
        raise NotImplementedError
```

**Rationale:**
- Clear contract for all providers
- Easy to add new providers without changing product logic
- Supports both synchronous and streaming modes
- Type-safe with Python type hints

### 2. Provider Implementations

**MockProvider (for tests and local development):**
- Deterministic, predictable responses
- Never calls external APIs
- Always returns the same output for the same input
- Used in all automated tests
- Used when no real API key is configured

**OpenAIProvider:**
- Uses OpenAI Python SDK
- Supports GPT-4, GPT-3.5-turbo, and other OpenAI models
- Configured via `AI_OPENAI_API_KEY` environment variable
- Implements both generate and generate_stream
- Tracks token usage and costs

**AnthropicProvider:**
- Uses Anthropic Python SDK
- Supports Claude 3 Opus, Sonnet, Haiku
- Configured via `AI_ANTHROPIC_API_KEY` environment variable
- Implements both generate and generate_stream
- Tracks token usage and costs

**Future Providers:**
- Google Gemini (if needed)
- Cohere (if needed)
- Local models (Ollama, etc.) (if needed)
- All follow the same ProviderAdapter interface

### 3. Provider Selection

**Environment Variable:**
```bash
AI_PROVIDER=openai|anthropic|mock
```

**Selection Logic:**
1. Check `AI_PROVIDER` environment variable
2. If `mock`, use MockProvider
3. If `openai`, check for `AI_OPENAI_API_KEY`, use OpenAIProvider
4. If `anthropic`, check for `AI_ANTHROPIC_API_KEY`, use AnthropicProvider
5. If provider is specified but key is missing, fall back to MockProvider with warning
6. If provider is not specified, default to MockProvider

**Fallback Behavior:**
- Tests always use MockProvider (enforced via environment)
- Development can use MockProvider or real provider
- Production requires real provider with valid API key
- Startup fails if production env lacks provider key

### 4. Request Limits

**Per-Request Limits (configurable via environment):**
- `AI_MAX_TOKENS_PER_REQUEST`: Default 4000
- `AI_MAX_INPUT_SIZE`: Default 100,000 characters
- `AI_TIMEOUT_SECONDS`: Default 30
- `AI_TEMPERATURE`: Default 0.2 (low for deterministic output)

**Validation:**
- Requests exceeding limits are rejected before provider call
- Limits apply to both synchronous and streaming requests
- Limits are enforced in Django before calling provider

### 5. Usage Tracking

**Tracked Metrics:**
- Input tokens
- Output tokens
- Total tokens
- Estimated cost (USD)
- Request timestamp
- Provider and model used
- Workspace ID
- User ID
- Capability used

**Cost Calculation:**
- OpenAI: Pricing from official API documentation
- Anthropic: Pricing from official API documentation
- Costs estimated before request (based on input size)
- Costs updated after request (based on actual token counts)
- Costs stored with AI usage records

**Usage Storage:**
- Django stores AI usage records in `AIUsageRecord` table
- NestJS also logs usage events for audit
- Quota state stored in Redis for fast access
- Historical usage available for billing and analytics

### 6. Quota Model

**Default Quotas (configurable via environment):**
```bash
AI_QUOTA_USER_DAILY_REQUESTS=100
AI_QUOTA_WORKSPACE_DAILY_REQUESTS=500
AI_QUOTA_USER_DAILY_TOKENS=50000
AI_QUOTA_WORKSPACE_DAILY_TOKENS=250000
```

**Quota Enforcement:**
1. NestJS checks quota before calling Django
2. Django also checks quota as defense-in-depth
3. Quota state stored in Redis with daily reset
4. Quota exceeded returns HTTP 429 with clear error
5. Quota reset at midnight UTC

**Quota Key Format:**
```
quota:user:{userId}:requests:daily:{date}
quota:workspace:{workspaceId}:requests:daily:{date}
quota:user:{userId}:tokens:daily:{date}
quota:workspace:{workspaceId}:tokens:daily:{date}
```

**Quota Reset:**
- Daily quotas reset automatically at midnight UTC
- Admin can manually reset via platform admin interface
- Quota usage visible to workspace owners
- Quota exceeded notification sent to workspace owner

**Quota Exceeded Behavior:**
- Request rejected before provider call
- No cost incurred
- Clear error message: "Quota exceeded. Your quota will reset at midnight UTC."
- User can request quota increase via support

### 7. Retry and Timeout

**Timeout:**
- Request timeout after `AI_TIMEOUT_SECONDS` (default 30s)
- Timeout enforced at HTTP level
- Streaming timeout per chunk
- Timeout on any retry attempt

**Retry Logic:**
- Only idempotent calls are retried:
  - Weekly report generation
  - Project summary generation
- Non-idempotent calls fail immediately:
  - Assistant chat (each question is unique)
  - Task suggestions (context may change)
- Exponential backoff: 1s, 2s, 4s
- Jitter added to avoid thundering herd
- Max 3 retries

**Circuit Breaker:**
- Opens after 5 consecutive failures
- Remains open for 60 seconds
- Reopens automatically after cooldown
- Fails fast when circuit is open
- Monitored via health checks

### 8. Error Handling

**Provider Error Mapping:**
- Rate limit errors → 429 with retry-after header
- Authentication errors → 500 with generic message
- Invalid request errors → 400 with validation details
- Timeout errors → 504 with timeout info
- Unknown errors → 500 with generic message

**Error Logging:**
- All errors logged with correlation ID
- Provider-specific errors logged with provider details
- Errors include workspace ID and user ID for debugging
- Sensitive data redacted from error logs

**User-Facing Errors:**
- Generic error messages for provider failures
- No provider internals leaked
- Clear retry instructions where applicable
- Support contact information for persistent errors

### 9. Test Strategy

**MockProvider in Tests:**
- All Django tests use MockProvider
- All NestJS tests use MockProvider
- Playwright tests use MockProvider
- Never call real paid APIs in automated tests

**Test Configuration:**
```bash
# Test environment
NODE_ENV=test
AI_PROVIDER=mock
# No real API keys in test env
```

**Provider-Specific Tests:**
- Manual smoke tests against real providers
- Only run with explicit developer consent
- Never committed to CI/CD
- API keys never printed or logged

**Contract Tests:**
- Verify all providers implement the same interface
- Verify output schema consistency
- Verify error handling consistency
- Verify token counting accuracy

### 10. Cost Monitoring

**Cost Aggregation:**
- Costs aggregated per workspace per day
- Costs aggregated per user per day
- Costs aggregated per capability
- Historical trends available

**Cost Alerts:**
- Alert when workspace exceeds cost threshold
- Alert when user exceeds cost threshold
- Alert when platform-wide costs spike
- Alerts sent to platform admins

**Cost Visibility:**
- Workspace owners can view their costs
- Users can view their own costs
- Platform admins can view all costs
- Costs included in billing statements

## Consequences

### Positive
- **Flexibility**: Providers can be swapped without code changes
- **Cost Control**: Quotas prevent unexpected costs
- **Reliability**: Circuit breaker and retries improve resilience
- **Testability**: Mock provider ensures tests never call paid APIs
- **Observability**: Usage tracking enables cost monitoring and optimization
- **Safety**: Limits prevent runaway token usage

### Negative
- **Complexity**: Additional layer of abstraction
- **Configuration**: More environment variables to manage
- **Monitoring**: Need to monitor provider health and costs
- **Quota Management**: Need to handle quota exceeded scenarios

### Risks and Mitigations

**Risk: Provider API Changes**
- Mitigation: Provider adapter isolates changes, can update adapter without changing product logic

**Risk: Cost Overrun**
- Mitigation: Quotas, per-request limits, cost monitoring, alerts

**Risk: Provider Outage**
- Mitigation: Circuit breaker, graceful degradation, error messages

**Risk: Token Counting Inaccuracy**
- Mitigation: Use provider's token count when available, estimate when not

**Risk: Mock Provider Doesn't Match Real Provider**
- Mitigation: Contract tests, periodic manual smoke tests

## Alternatives Considered

### Alternative 1: Direct Provider Calls in NestJS
- **Pros**: Single service, no Python dependency
- **Cons**: Loses Python AI ecosystem, harder to add advanced features
- **Rejected**: Python ecosystem is valuable for advanced AI workloads

### Alternative 2: No Provider Abstraction
- **Pros**: Simpler code
- **Cons**: Hard to swap providers, tight coupling
- **Rejected**: Flexibility to swap providers is important

### Alternative 3: No Quotas
- **Pros**: Simpler, no quota management
- **Cons**: Risk of cost overrun, abuse
- **Rejected**: Cost control is essential for multi-tenant SaaS

## References
- ADR-008: AI Service Contract and Queue Ownership
- docs/AI_SAFETY.md
- docs/API_CONTRACTS.md
