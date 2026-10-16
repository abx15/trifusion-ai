"""Correlation ID and structured logging middleware for TriFusion AI Django Service."""
import json
import logging
import time
import uuid
from datetime import datetime, timezone

logger = logging.getLogger("ai_service")

SENSITIVE_KEYS = ("password", "token", "secret", "authorization", "cookie", "key")


def sanitize_dict(data):
    if not isinstance(data, dict):
        return data
    sanitized = {}
    for k, v in data.items():
        if any(s in k.lower() for s in SENSITIVE_KEYS):
            sanitized[k] = "[REDACTED]"
        elif isinstance(v, dict):
            sanitized[k] = sanitize_dict(v)
        else:
            sanitized[k] = v
    return sanitized


class CorrelationIdMiddleware:
    """Middleware to propagate X-Request-Id and produce structured JSON logs."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Read or generate correlation ID
        correlation_id = (
            request.headers.get("x-request-id")
            or request.META.get("HTTP_X_REQUEST_ID")
            or str(uuid.uuid4())
        )
        request.correlation_id = correlation_id

        start_time = time.time()
        response = self.get_response(request)
        duration_ms = round((time.time() - start_time) * 1000, 2)

        # Attach to response header
        response["X-Request-Id"] = correlation_id

        # Structured JSON Log
        log_entry = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": "INFO" if response.status_code < 400 else "ERROR",
            "service": "ai-django",
            "correlationId": correlation_id,
            "method": request.method,
            "path": request.path,
            "statusCode": response.status_code,
            "durationMs": duration_ms,
        }
        print(json.dumps(log_entry))

        return response

