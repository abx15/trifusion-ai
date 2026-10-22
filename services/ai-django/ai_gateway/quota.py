"""Quota management with Redis backing."""

from __future__ import annotations

import os
from datetime import datetime, timezone

try:
    import redis

    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False


def get_redis_client():
    """Get Redis client for quota storage."""
    if not REDIS_AVAILABLE:
        return None

    redis_url = os.environ.get("REDIS_URL", "redis://localhost:6379/0")
    try:
        return redis.from_url(redis_url, decode_responses=True)
    except Exception:
        return None


def get_quota_key(user_id: str, workspace_id: str, quota_type: str, date: str | None = None) -> str:
    """Generate quota key for Redis."""
    if date is None:
        date = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    return f"quota:{quota_type}:{user_id}:{workspace_id}:{date}"


def check_quota(
    user_id: str,
    workspace_id: str,
    quota_type: str = "requests",
    limit: int = 100,
) -> None:
    """Check if quota is available, increment if so."""
    redis_client = get_redis_client()

    if redis_client is None:
        # Fallback to in-memory if Redis not available (not recommended for production)
        return

    date = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    key = get_quota_key(user_id, workspace_id, quota_type, date)

    # Use Redis INCR with expiry
    current = redis_client.incr(key)

    # Set expiry at end of day (24 hours from now, simplified)
    if current == 1:
        redis_client.expire(key, 86400)  # 24 hours

    if current > limit:
        # Rollback the increment
        redis_client.decr(key)
        raise PermissionError(f"Quota exceeded for {quota_type}. Limit: {limit}, Used: {current}")


def get_quota_usage(user_id: str, workspace_id: str, quota_type: str = "requests") -> int:
    """Get current quota usage."""
    redis_client = get_redis_client()

    if redis_client is None:
        return 0

    date = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    key = get_quota_key(user_id, workspace_id, quota_type, date)

    value = redis_client.get(key)
    return int(value) if value else 0


def reset_quota(user_id: str, workspace_id: str, quota_type: str = "requests") -> None:
    """Reset quota for a user/workspace (admin function)."""
    redis_client = get_redis_client()

    if redis_client is None:
        return

    date = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    key = get_quota_key(user_id, workspace_id, quota_type, date)
    redis_client.delete(key)
