"""URL configuration for TriFusion AI Django Service."""

from django.urls import path

from ai_gateway.views import (
    ai_tool_dispatch,
    health_check,
    project_summary,
    ready_check,
    task_suggestions,
    weekly_report,
    workspace_assistant,
    workspace_assistant_stream,
)

urlpatterns = [
    path("health", health_check, name="health_check"),
    path("health/", health_check, name="health_check_slash"),
    path("ready", ready_check, name="ready_check"),
    path("ready/", ready_check, name="ready_check_slash"),
    path("v1/ai/project-summary", project_summary, name="project_summary"),
    path("v1/ai/project-summary/", project_summary, name="project_summary_slash"),
    path("v1/ai/weekly-report", weekly_report, name="weekly_report"),
    path("v1/ai/weekly-report/", weekly_report, name="weekly_report_slash"),
    path("v1/ai/task-suggestions", task_suggestions, name="task_suggestions"),
    path("v1/ai/task-suggestions/", task_suggestions, name="task_suggestions_slash"),
    path("v1/ai/assistant", workspace_assistant, name="workspace_assistant"),
    path("v1/ai/assistant/", workspace_assistant, name="workspace_assistant_slash"),
    path("v1/ai/assistant/stream", workspace_assistant_stream, name="workspace_assistant_stream"),
    path(
        "v1/ai/assistant/stream/",
        workspace_assistant_stream,
        name="workspace_assistant_stream_slash",
    ),
    path("v1/ai/tool", ai_tool_dispatch, name="ai_tool_dispatch"),
    path("v1/ai/tool/", ai_tool_dispatch, name="ai_tool_dispatch_slash"),
]
