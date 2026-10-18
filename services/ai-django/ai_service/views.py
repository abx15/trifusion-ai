"""Views for TriFusion AI Django Service."""
from __future__ import annotations

import datetime as dt
from datetime import datetime, timezone

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from ai_service.auth import require_service_context
from ai_service.providers import MockProvider
from ai_service.safety import build_safe_prompt, check_quota, redact_sensitive_content, sanitize_json, validate_tool_name
from ai_service.serializers import (
    ProjectSummaryRequestSerializer,
    TaskSuggestionsRequestSerializer,
    WeeklyReportRequestSerializer,
    WorkspaceAssistantRequestSerializer,
)

QUOTA_STORE: dict[str, dict[str, int]] = {}
PROVIDER = MockProvider()


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
            "dependencies": {"core": "up"},
        }
    )


@api_view(["POST"])
def project_summary(request):
    """Generate a project summary only from authorized context provided by NestJS."""
    service_context = require_service_context(request, required_scope="project_summary")
    serializer = ProjectSummaryRequestSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    payload = serializer.validated_data
    workspace_id = payload["workspace_id"]
    user_id = payload["user_id"]
    if service_context.get("workspace_id") and service_context["workspace_id"] != workspace_id:
        return Response({"error": "Workspace mismatch in signed context"}, status=status.HTTP_403_FORBIDDEN)
    try:
        check_quota(QUOTA_STORE, user_id, workspace_id)
    except PermissionError as exc:
        return Response({"error": str(exc)}, status=status.HTTP_429_TOO_MANY_REQUESTS)

    facts = [
        {"record_id": item.get("id", "unknown"), "statement": item.get("title", "No title")}
        for item in payload.get("tasks", [])
    ]
    if not facts:
        facts = [{"record_id": payload.get("project_id", "unknown"), "statement": "No task records were supplied."}]

    safe_prompt = build_safe_prompt(
        "Summarize the project using only supplied facts. Distinguish facts from suggestions.",
        str({"tasks": payload.get("tasks", []), "activity": payload.get("activity", [])}),
    )
    provider_output = PROVIDER.generate(prompt=safe_prompt)
    response = {
        "status": "ok",
        "workspace_id": workspace_id,
        "user_id": user_id,
        "request_id": payload.get("request_id") or service_context.get("request_id", ""),
        "generated_at": dt.datetime.now(timezone.utc).isoformat(),
        "source_scope": f"workspace:{workspace_id}",
        "provider": provider_output["provider"],
        "model": provider_output["model"],
        "output": {
            "facts": facts,
            "summary": "Project summary generated from authorized task and activity context only.",
            "generated_suggestions": [
                "Review overdue or blocked tasks before the next working session.",
                "Confirm whether current scope and assumptions remain valid.",
            ],
        },
    }
    return Response(sanitize_json(response))


@api_view(["POST"])
def weekly_report(request):
    """Generate a weekly report from real analytics data supplied by NestJS."""
    service_context = require_service_context(request, required_scope="weekly_report")
    serializer = WeeklyReportRequestSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    payload = serializer.validated_data
    workspace_id = payload["workspace_id"]
    user_id = payload["user_id"]
    if service_context.get("workspace_id") and service_context["workspace_id"] != workspace_id:
        return Response({"error": "Workspace mismatch in signed context"}, status=status.HTTP_403_FORBIDDEN)
    try:
        check_quota(QUOTA_STORE, user_id, workspace_id)
    except PermissionError as exc:
        return Response({"error": str(exc)}, status=status.HTTP_429_TOO_MANY_REQUESTS)

    analytics = payload.get("analytics", {})
    reporting_period = payload.get("reporting_period", {})
    safe_prompt = build_safe_prompt(
        "Write a weekly report using only supplied metrics. If metrics are absent, say so.",
        str({"analytics": analytics, "reporting_period": reporting_period}),
    )
    provider_output = PROVIDER.generate(prompt=safe_prompt)
    return Response(
        sanitize_json(
            {
                "status": "ok",
                "workspace_id": workspace_id,
                "user_id": user_id,
                "request_id": payload.get("request_id") or service_context.get("request_id", ""),
                "generated_at": dt.datetime.now(timezone.utc).isoformat(),
                "source_scope": f"workspace:{workspace_id}",
                "provider": provider_output["provider"],
                "model": provider_output["model"],
                "output": {
                    "reporting_period": reporting_period,
                    "facts": [{"metric": key, "value": value} for key, value in analytics.items()],
                    "summary": "Report built from the provided analytics snapshot and reporting period.",
                },
            }
        )
    )


@api_view(["POST"])
def task_suggestions(request):
    """Return next-step suggestions based on a task and project context."""
    service_context = require_service_context(request, required_scope="task_suggestions")
    serializer = TaskSuggestionsRequestSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    payload = serializer.validated_data
    workspace_id = payload["workspace_id"]
    user_id = payload["user_id"]
    if service_context.get("workspace_id") and service_context["workspace_id"] != workspace_id:
        return Response({"error": "Workspace mismatch in signed context"}, status=status.HTTP_403_FORBIDDEN)
    try:
        check_quota(QUOTA_STORE, user_id, workspace_id)
    except PermissionError as exc:
        return Response({"error": str(exc)}, status=status.HTTP_429_TOO_MANY_REQUESTS)

    task = payload.get("task", {})
    project = payload.get("project", {})
    safe_prompt = build_safe_prompt(
        "Provide next-step suggestions for the task using only the task and project context.",
        str({"task": task, "project": project}),
    )
    provider_output = PROVIDER.generate(prompt=safe_prompt)
    return Response(
        sanitize_json(
            {
                "status": "ok",
                "workspace_id": workspace_id,
                "user_id": user_id,
                "request_id": payload.get("request_id") or service_context.get("request_id", ""),
                "generated_at": dt.datetime.now(timezone.utc).isoformat(),
                "source_scope": f"workspace:{workspace_id}",
                "provider": provider_output["provider"],
                "model": provider_output["model"],
                "output": {
                    "task_id": payload.get("task_id"),
                    "facts": [{"field": key, "value": value} for key, value in task.items()],
                    "suggestions": [
                        "Confirm current assignee and dependencies before widening scope.",
                        "Record the next blocker and expected completion date.",
                    ],
                },
            }
        )
    )


@api_view(["POST"])
def workspace_assistant(request):
    """Answer workspace questions only from data supplied by NestJS."""
    service_context = require_service_context(request, required_scope="workspace_assistant")
    serializer = WorkspaceAssistantRequestSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    payload = serializer.validated_data
    workspace_id = payload["workspace_id"]
    user_id = payload["user_id"]
    if service_context.get("workspace_id") and service_context["workspace_id"] != workspace_id:
        return Response({"error": "Workspace mismatch in signed context"}, status=status.HTTP_403_FORBIDDEN)
    try:
        check_quota(QUOTA_STORE, user_id, workspace_id)
    except PermissionError as exc:
        return Response({"error": str(exc)}, status=status.HTTP_429_TOO_MANY_REQUESTS)

    context_items = payload.get("retrieved_context", [])
    prompt_text = "\n".join(
        f"- {redact_sensitive_content(str(item))}" for item in context_items
    ) or "No authorized context was supplied."
    safe_prompt = build_safe_prompt(
        "Answer the question using only the supplied context. Do not invent facts. If missing, say so.",
        f"Question: {payload['question']}\nContext:\n{prompt_text}",
    )
    provider_output = PROVIDER.generate(prompt=safe_prompt)
    return Response(
        sanitize_json(
            {
                "status": "ok",
                "workspace_id": workspace_id,
                "user_id": user_id,
                "request_id": payload.get("request_id") or service_context.get("request_id", ""),
                "generated_at": dt.datetime.now(timezone.utc).isoformat(),
                "source_scope": f"workspace:{workspace_id}",
                "provider": provider_output["provider"],
                "model": provider_output["model"],
                "output": {
                    "answer": "Answer is based strictly on the authorized context supplied by NestJS.",
                    "references": context_items[:5],
                    "question": payload["question"],
                },
            }
        )
    )


@api_view(["POST"])
def ai_tool_dispatch(request):
    """Dispatch a tool call only if the tool name is allowlisted and authorized."""
    service_context = require_service_context(request, required_scope="workspace_assistant")
    tool_name = request.data.get("tool")
    try:
        normalized_tool = validate_tool_name(tool_name)
    except ValueError as exc:
        return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

    allowed_scopes = {str(scope).strip().lower() for scope in service_context.get("allowed_scopes", [])}
    if normalized_tool not in allowed_scopes:
        return Response({"error": f"Tool '{normalized_tool}' is not permitted for this service token."}, status=status.HTTP_403_FORBIDDEN)

    if service_context.get("workspace_id") and request.data.get("workspace_id") not in (None, service_context["workspace_id"]):
        return Response({"error": "Workspace mismatch in signed context"}, status=status.HTTP_403_FORBIDDEN)

    return Response({"status": "ok", "tool": normalized_tool, "message": "Tool call executed in allowlist mode."})
