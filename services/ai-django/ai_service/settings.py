"""
Django settings for TriFusion AI Django Service.
"""

import os
from pathlib import Path
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

BASE_DIR = Path(__file__).resolve().parent.parent

DJANGO_ENV = os.environ.get(
    "DJANGO_ENV", os.environ.get("NODE_ENV", "development")
).lower()
IS_PRODUCTION = DJANGO_ENV == "production"
DEFAULT_DEV_KEY = "trifusion-ai-django-dev-insecure-secret-key-replace-in-production"
DEFAULT_SERVICE_SECRET = "trifusion-ai-dev-secret-change-me"
SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY", DEFAULT_DEV_KEY)
DEBUG = os.environ.get(
    "DJANGO_DEBUG",
    "False" if IS_PRODUCTION else "True",
).lower() in ("true", "1", "yes")
AI_SERVICE_SHARED_SECRET = os.environ.get("AI_SERVICE_SHARED_SECRET", DEFAULT_SERVICE_SECRET)

if IS_PRODUCTION and DEBUG:
    raise ValueError("DJANGO_DEBUG must be False in production.")

if not DEBUG:
    if SECRET_KEY == DEFAULT_DEV_KEY or len(SECRET_KEY) < 50:
        raise ValueError(
            "DJANGO_SECRET_KEY must be a unique secret of at least "
            "50 characters when DEBUG=False."
        )
    if AI_SERVICE_SHARED_SECRET == DEFAULT_SERVICE_SECRET or len(AI_SERVICE_SHARED_SECRET) < 32:
        raise ValueError(
            "AI_SERVICE_SHARED_SECRET must be a unique secret of at least "
            "32 characters when DEBUG=False."
        )

DEFAULT_ALLOWED_HOSTS = "localhost,127.0.0.1,0.0.0.0"
ALLOWED_HOSTS = [
    host.strip()
    for host in os.environ.get("DJANGO_ALLOWED_HOSTS", DEFAULT_ALLOWED_HOSTS).split(",")
    if host.strip()
]
if not DEBUG and (not ALLOWED_HOSTS or "*" in ALLOWED_HOSTS):
    raise ValueError("DJANGO_ALLOWED_HOSTS must list explicit hostnames when DEBUG=False.")
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

def normalize_database_url(url: str) -> str:
    """Remove Prisma's schema query parameter before passing the URL to psycopg2."""
    parsed = urlsplit(url)
    query = parse_qsl(parsed.query, keep_blank_values=True)
    schemas = [value for key, value in query if key == "schema"]
    if any(schema != "public" for schema in schemas):
        raise ValueError("Django DATABASE_URL only supports the public PostgreSQL schema.")
    normalized_query = [(key, value) for key, value in query if key != "schema"]
    return urlunsplit(
        (parsed.scheme, parsed.netloc, parsed.path, urlencode(normalized_query), parsed.fragment)
    )


database_url = os.environ.get("DJANGO_DATABASE_URL") or os.environ.get("DATABASE_URL")
if IS_PRODUCTION and not database_url:
    raise ValueError(
        "DATABASE_URL (or DJANGO_DATABASE_URL) is required in production; "
        "SQLite fallback is disabled."
    )
if database_url:
    if IS_PRODUCTION and not database_url.startswith(("postgres://", "postgresql://")):
        raise ValueError("Production DATABASE_URL must use PostgreSQL.")
    import dj_database_url
    DATABASES = {
        "default": dj_database_url.parse(
            normalize_database_url(database_url),
            conn_max_age=600,
        ),
    }
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
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
    "DEFAULT_RENDERER_CLASSES": ["rest_framework.renderers.JSONRenderer"],
    "UNAUTHENTICATED_USER": None,
    "DEFAULT_AUTHENTICATION_CLASSES": [],
    "DEFAULT_PERMISSION_CLASSES": [],
}

AI_SERVICE_TOKEN_TTL_SECONDS = int(os.environ.get("AI_SERVICE_TOKEN_TTL_SECONDS", "180"))
