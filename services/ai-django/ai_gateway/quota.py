"""Quota management with Redis backing."""

from __future__ import annotations

import os
from collections import defaultdict
from datetime import datetime, timezone
from threading import Lock

try:
    import redis

    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False


class InMemoryQuotaStore:
    """Thread-safe in-memory quota store for testing and fallback use."""

    def __init__(self) -> None:
        self._counts: dict[str, int] = defaultdict(int)
        self._lock = Lock()

    def incr(self, key: str) -> int:
        with self._lock:
            self._counts[key] += 1
            return self._counts[key]

    def decr(self, key: str) -> int:
        with self._lock:
            self._counts[key] = max(0, self._counts[key] - 1)
            return self._counts[key]

    def get(self, key: str) -> int | None:
        with self._lock:
            value = self._counts.get(key, 0)
            return value if value else None

    def delete(self, key: str) -> None:
        with self._lock:
            self._counts.pop(key, None)

    def reset(self) -> None:
        with self._lock:
            self._counts.clear()


_default_memory_store = InMemoryQuotaStore()


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
    store: dict[str, int] | InMemoryQuotaStore | None = None,
) -> None:
    """Check if quota is available, increment if so.

    When ``store`` is provided it is used directly (in-memory, no Redis),
    which makes quota enforcement testable without an external dependency.
    """
    date = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    key = get_quota_key(user_id, workspace_id, quota_type, date)

    if store is not None:
        if isinstance(store, dict):
            current = store.get(key, 0) + 1
            store[key] = current
        else:
            current = store.incr(key)

        if current > limit:
            if isinstance(store, dict):
                store[key] = current - 1
            else:
                store.decr(key)
            raise PermissionError(
                f"Quota exceeded for {quota_type}. Limit: {limit}, Used: {current}"
            )
        return

    redis_client = get_redis_client()

    if redis_client is None:
        # Fallback to in-memory if Redis not available (not recommended for production)
        current = _default_memory_store.incr(key)
        if current > limit:
            _default_memory_store.decr(key)
            raise PermissionError(
                f"Quota exceeded for {quota_type}. Limit: {limit}, Used: {current}"
            )
        return

    # Use Redis INCR with expiry
    current = redis_client.incr(key)

    # Set expiry at end of day (24 hours from now, simplified)
    if current == 1:
        redis_client.expire(key, 86400)  # 24 hours

    if current > limit:
        # Rollback the increment
        redis_client.decr(key)
        raise PermissionError(
            f"Quota exceeded for {quota_type}. Limit: {limit}, Used: {current}"
        )


def get_quota_usage(user_id: str, workspace_id: str, quota_type: str = "requests") -> int:
    """Get current quota usage."""
    date = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    key = get_quota_key(user_id, workspace_id, quota_type, date)

    redis_client = get_redis_client()
    if redis_client is not None:
        value = redis_client.get(key)
        return int(value) if value else 0

    value = _default_memory_store.get(key)
    return int(value) if value else 0


def reset_quota(user_id: str, workspace_id: str, quota_type: str = "requests") -> None:
    """Reset quota for a user/workspace (admin function)."""
    date = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    key = get_quota_key(user_id, workspace_id, quota_type, date)

    redis_client = get_redis_client()
    if redis_client is not None:
        redis_client.delete(key)
        return

    _default_memory_store.delete(key)
