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
