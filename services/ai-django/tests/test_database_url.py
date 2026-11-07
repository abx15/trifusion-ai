import pytest

from ai_service.settings import normalize_database_url


def test_normalize_database_url_removes_prisma_schema_parameter():
    url = "postgresql://user:pass@localhost:5432/app?schema=public&sslmode=require"

    assert normalize_database_url(url) == (
        "postgresql://user:pass@localhost:5432/app?sslmode=require"
    )


def test_normalize_database_url_rejects_non_public_schema():
    url = "postgresql://user:pass@localhost:5432/app?schema=tenant_data"

    with pytest.raises(ValueError, match="only supports the public PostgreSQL schema"):
        normalize_database_url(url)


def test_django_env_production_requires_database_even_without_node_env(monkeypatch):
    import runpy

    monkeypatch.setenv("DJANGO_ENV", "production")
    monkeypatch.delenv("NODE_ENV", raising=False)
    monkeypatch.setenv("DJANGO_DEBUG", "False")
    monkeypatch.setenv("DJANGO_SECRET_KEY", "x" * 64)
    monkeypatch.setenv("AI_SERVICE_SHARED_SECRET", "y" * 40)
    monkeypatch.setenv("DJANGO_ALLOWED_HOSTS", "ai.example.com")
    monkeypatch.delenv("DATABASE_URL", raising=False)
    monkeypatch.delenv("DJANGO_DATABASE_URL", raising=False)

    with pytest.raises(ValueError, match="DATABASE_URL .* is required in production"):
        runpy.run_module("ai_service.settings")


def test_django_env_production_requires_explicit_allowed_hosts(monkeypatch):
    import runpy

    monkeypatch.setenv("DJANGO_ENV", "production")
    monkeypatch.delenv("NODE_ENV", raising=False)
    monkeypatch.setenv("DJANGO_DEBUG", "False")
    monkeypatch.setenv("DJANGO_SECRET_KEY", "x" * 64)
    monkeypatch.setenv("AI_SERVICE_SHARED_SECRET", "y" * 40)
    monkeypatch.delenv("DJANGO_ALLOWED_HOSTS", raising=False)
    monkeypatch.setenv(
        "DATABASE_URL",
        "postgresql://user:pass@localhost:5432/trifusion_test",
    )

    with pytest.raises(ValueError, match="DJANGO_ALLOWED_HOSTS is required in production"):
        runpy.run_module("ai_service.settings")
