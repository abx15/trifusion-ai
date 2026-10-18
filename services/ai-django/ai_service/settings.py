"""
Django settings for TriFusion AI Django Service.
"""
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

DEFAULT_DEV_KEY = 'trifusion-ai-django-dev-insecure-secret-key-replace-in-production'
SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY', DEFAULT_DEV_KEY)
DEBUG = os.environ.get('DJANGO_DEBUG', 'True').lower() in ('true', '1', 'yes')

if not DEBUG and SECRET_KEY == DEFAULT_DEV_KEY:
    raise ValueError("DJANGO_SECRET_KEY must be set securely in production.")

DEFAULT_ALLOWED_HOSTS = 'localhost,127.0.0.1,0.0.0.0'
ALLOWED_HOSTS = [host.strip() for host in os.environ.get('DJANGO_ALLOWED_HOSTS', DEFAULT_ALLOWED_HOSTS).split(',') if host.strip()]

INSTALLED_APPS = [
    'django.contrib.contenttypes',
    'django.contrib.auth',
    'corsheaders',
    'rest_framework',
    'ai_service',
]

MIDDLEWARE = [
    'ai_service.middleware.CorrelationIdMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
]

ROOT_URLCONF = 'ai_service.urls'

TEMPLATES = []

WSGI_APPLICATION = 'ai_service.wsgi.application'
ASGI_APPLICATION = 'ai_service.asgi.application'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

AUTH_PASSWORD_VALIDATORS = []

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

CORS_ALLOW_ALL_ORIGINS = True
CORS_EXPOSE_HEADERS = ['X-Request-Id']

SECURE_REFERRER_POLICY = 'strict-origin-when-cross-origin'
X_FRAME_OPTIONS = 'DENY'

REST_FRAMEWORK = {
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ],
    'UNAUTHENTICATED_USER': None,
    'DEFAULT_AUTHENTICATION_CLASSES': [],
    'DEFAULT_PERMISSION_CLASSES': [],
}

AI_SERVICE_SHARED_SECRET = os.environ.get('AI_SERVICE_SHARED_SECRET', 'trifusion-ai-dev-secret-change-me')
AI_SERVICE_TOKEN_TTL_SECONDS = int(os.environ.get('AI_SERVICE_TOKEN_TTL_SECONDS', '180'))
