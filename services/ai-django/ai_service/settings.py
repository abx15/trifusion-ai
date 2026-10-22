"""
Django settings for TriFusion AI Django Service.
"""

import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

NODE_ENV = os.environ.get("NODE_ENV", "development")
DEFAULT_DEV_KEY = "trifusion-ai-django-dev-insecure-secret-key-replace-in-production"
DEFAULT_SERVICE_SECRET = "trifusion-ai-dev-secret-change-me"
SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY", DEFAULT_DEV_KEY)
DEBUG = os.environ.get(
    "DJANGO_DEBUG",
    "False" if NODE_ENV == "production" else "True",
).lower() in ("true", "1", "yes")
AI_SERVICE_SHARED_SECRET = os.environ.get("AI_SERVICE_SHARED_SECRET", DEFAULT_SERVICE_SECRET)

if NODE_ENV == "production" and DEBUG:
    raise ValueError("DJANGO_DEBUG must be False in production.")

if not DEBUG:
    if SECRET_KEY == DEFAULT_DEV_KEY:
        raise ValueError("DJANGO_SECRET_KEY must be set securely when DJANGO_DEBUG=False.")
    if AI_SERVICE_SHARED_SECRET == DEFAULT_SERVICE_SECRET:
        raise ValueError("AI_SERVICE_SHARED_SECRET must be set securely when DJANGO_DEBUG=False.")

DEFAULT_ALLOWED_HOSTS = "localhost,127.0.0.1,0.0.0.0"
ALLOWED_HOSTS = [
    host.strip()
    for host in os.environ.get("DJANGO_ALLOWED_HOSTS", DEFAULT_ALLOWED_HOSTS).split(",")
    if host.strip()
]
if not DEBUG and (not ALLOWED_HOSTS or "*" in ALLOWED_HOSTS):
    raise ValueError("DJANGO_ALLOWED_HOSTS must list explicit hostnames when DJANGO_DEBUG=False.")
CORS_ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.environ.get("DJANGO_CORS_ALLOWED_ORIGINS", "").split(",")
    if origin.strip()
]

INSTALLED_APPS = [
    "django.contrib.contenttypes",
    "django.contrib.auth",
    "corsheaders",
    "rest_framework",
    "ai_service",
    "ai_gateway.apps.AiGatewayConfig",
    "providers.apps.ProvidersConfig",
    "jobs.apps.JobsConfig",
    "usage.apps.UsageConfig",
]

# Django admin is disabled by default for security
# Enable only in development if needed via DJANGO_ADMIN_ENABLED
if os.environ.get("DJANGO_ADMIN_ENABLED", "false").lower() in ("true", "1"):
    INSTALLED_APPS.insert(0, "django.contrib.admin")
    INSTALLED_APPS.insert(1, "django.contrib.sessions")

MIDDLEWARE = [
    "ai_service.middleware.CorrelationIdMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.common.CommonMiddleware",
]

ROOT_URLCONF = "ai_service.urls"

TEMPLATES = []

WSGI_APPLICATION = "ai_service.wsgi.application"
ASGI_APPLICATION = "ai_service.asgi.application"

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.environ.get("DJANGO_DATABASE_NAME", "trifusion_ai"),
        "USER": os.environ.get("DJANGO_DATABASE_USER", "postgres"),
        "PASSWORD": os.environ.get("DJANGO_DATABASE_PASSWORD", ""),
        "HOST": os.environ.get("DJANGO_DATABASE_HOST", "localhost"),
        "PORT": os.environ.get("DJANGO_DATABASE_PORT", "5432"),
        "OPTIONS": {
            "sslmode": os.environ.get("DJANGO_DATABASE_SSLMODE", "require"),
        },
    }
}

AUTH_PASSWORD_VALIDATORS = []

LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

CORS_ALLOW_ALL_ORIGINS = False
CORS_EXPOSE_HEADERS = ["X-Request-Id"]

SECURE_REFERRER_POLICY = "strict-origin-when-cross-origin"
X_FRAME_OPTIONS = "DENY"

REST_FRAMEWORK = {
    "DEFAULT_RENDERER_CLASSES": [
        "rest_framework.renderers.JSONRenderer",
    ],
    "UNAUTHENTICATED_USER": None,
    "DEFAULT_AUTHENTICATION_CLASSES": [],
    "DEFAULT_PERMISSION_CLASSES": [],
}

AI_SERVICE_TOKEN_TTL_SECONDS = int(os.environ.get("AI_SERVICE_TOKEN_TTL_SECONDS", "180"))
