"""Service-to-service authentication for the internal AI Django service."""

from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import time
import uuid
from typing import Any

from django.conf import settings
from rest_framework.exceptions import AuthenticationFailed

SERVICE_TOKEN_ISSUER = os.environ.get("AI_SERVICE_ISSUER", "trifusion-ai")
SERVICE_TOKEN_AUDIENCE = os.environ.get("AI_SERVICE_AUDIENCE", "ai-django")
SERVICE_TOKEN_TTL_SECONDS = int(os.environ.get("AI_SERVICE_TOKEN_TTL_SECONDS", "180"))
SERVICE_TOKEN_SECRET = os.environ.get(
    "AI_SERVICE_SHARED_SECRET",
    getattr(settings, "AI_SERVICE_SHARED_SECRET", "trifusion-ai-dev-secret-change-me"),
)


def _b64url_encode(value: bytes) -> str:
    return base64.urlsafe_b64encode(value).rstrip(b"=").decode("ascii")


def _b64url_decode(value: str) -> bytes:
    padded = value + ("=" * (-len(value) % 4))
    return base64.urlsafe_b64decode(padded.encode("ascii"))


def create_service_token(payload: dict[str, Any]) -> str:
    now = int(time.time())
    token_payload = {
        "iss": SERVICE_TOKEN_ISSUER,
        "aud": SERVICE_TOKEN_AUDIENCE,
        "iat": now,
        "nbf": now,
        "exp": now + SERVICE_TOKEN_TTL_SECONDS,
        "jti": uuid.uuid4().hex,
        "type": "service-token",
        **payload,
    }
    encoded_header = _b64url_encode(b'{"alg":"HS256","typ":"JWT"}')
    encoded_payload = _b64url_encode(json.dumps(token_payload, separators=(",", ":")).encode())
    signing_input = f"{encoded_header}.{encoded_payload}".encode("ascii")
    signature = hmac.new(SERVICE_TOKEN_SECRET.encode("utf-8"), signing_input, hashlib.sha256).digest()
    return f"{encoded_header}.{encoded_payload}.{_b64url_encode(signature)}"


def verify_service_token(token: str) -> dict[str, Any]:
    if not token:
        raise AuthenticationFailed("Missing service token")

    try:
        header_part, payload_part, signature_part = token.split(".")
    except ValueError as exc:  # pragma: no cover - defensive branch
        raise AuthenticationFailed("Malformed service token") from exc

    signing_input = f"{header_part}.{payload_part}".encode("ascii")
    expected_signature = _b64url_encode(
        hmac.new(SERVICE_TOKEN_SECRET.encode("utf-8"), signing_input, hashlib.sha256).digest()
    )
    if not hmac.compare_digest(signature_part, expected_signature):
        raise AuthenticationFailed("Invalid service token signature")

    payload = json.loads(_b64url_decode(payload_part).decode("utf-8"))
    now = int(time.time())
    if payload.get("iss") != SERVICE_TOKEN_ISSUER:
        raise AuthenticationFailed("Unexpected token issuer")
    if payload.get("aud") != SERVICE_TOKEN_AUDIENCE:
        raise AuthenticationFailed("Unexpected token audience")
    if payload.get("exp", 0) < now:
        raise AuthenticationFailed("Service token expired")
    if payload.get("nbf", 0) > now:
        raise AuthenticationFailed("Service token not yet valid")
    if payload.get("type") != "service-token":
        raise AuthenticationFailed("Unexpected token type")

    return payload


def require_service_context(request, required_scope: str | None = None) -> dict[str, Any]:
    header = request.headers.get("Authorization", "")
    if not header.startswith("Bearer "):
        raise AuthenticationFailed("Missing bearer token")

    token = header.split(" ", 1)[1].strip()
    payload = verify_service_token(token)
    scopes = {str(scope).strip().lower() for scope in payload.get("allowed_scopes", [])}
    if required_scope:
        required = str(required_scope).strip().lower()
        if required not in scopes:
            raise AuthenticationFailed(f"Missing required scope: {required_scope}")

    request.service_context = payload
    return payload
