"""Models for AI job tracking."""

from django.db import models


class AIJob(models.Model):
    """AI job execution records for tracking and visibility."""

    class JobStatus(models.TextChoices):
        QUEUED = "QUEUED", "Queued"
        RUNNING = "RUNNING", "Running"
        SUCCEEDED = "SUCCEEDED", "Succeeded"
        FAILED = "FAILED", "Failed"
        CANCELLED = "CANCELLED", "Cancelled"

    class JobType(models.TextChoices):
        PROJECT_SUMMARY = "PROJECT_SUMMARY", "Project Summary"
        WEEKLY_REPORT = "WEEKLY_REPORT", "Weekly Report"
        TASK_SUGGESTIONS = "TASK_SUGGESTIONS", "Task Suggestions"
        ASSISTANT = "ASSISTANT", "Assistant"

    id = models.UUIDField(primary_key=True)
    workspace_id = models.UUIDField(db_index=True)
    user_id = models.UUIDField(db_index=True)
    job_type = models.CharField(max_length=50, choices=JobType.choices, db_index=True)
    status = models.CharField(
        max_length=20, choices=JobStatus.choices, default=JobStatus.QUEUED, db_index=True
    )
    input_data = models.JSONField(default=dict)
    output_data = models.JSONField(null=True, blank=True)
    error_message = models.TextField(null=True, blank=True)
    idempotency_key = models.CharField(max_length=255, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    request_id = models.CharField(max_length=255, null=True, blank=True, db_index=True)

    class Meta:
        indexes = [
            models.Index(fields=["workspace_id", "status"]),
            models.Index(fields=["workspace_id", "job_type"]),
            models.Index(fields=["user_id", "status"]),
            models.Index(
                fields=["workspace_id", "idempotency_key"], name="idx_workspace_idempotency"
            ),
        ]
        # Idempotency enforced at application level to allow null idempotency keys

    def __str__(self):
        return f"AIJob({self.id}, {self.job_type}, {self.status})"
