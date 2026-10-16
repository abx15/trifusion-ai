"""Views for TriFusion AI Django Service."""
from datetime import datetime, timezone

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response


@api_view(["GET"])
@permission_classes([AllowAny])
def health_check(request):
    """Liveness probe for ai-django service."""
    return Response(
        {
            "status": "ok",
            "service": "ai-django",
            "version": "1.0.0",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
    )


@api_view(["GET"])
@permission_classes([AllowAny])
def ready_check(request):
    """Readiness probe for ai-django service."""
    return Response(
        {
            "status": "ok",
            "service": "ai-django",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "dependencies": {
                "core": "up",
            },
        }
    )
