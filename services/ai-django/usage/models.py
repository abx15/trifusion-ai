"""Models for AI usage tracking and quota management."""

from django.core.validators import MinValueValidator
from django.db import models


class AIUsageRecord(models.Model):
    """AI usage records for tracking token consumption and costs."""

    id = models.UUIDField(primary_key=True)
    workspace_id = models.UUIDField(db_index=True)
    user_id = models.UUIDField(db_index=True)
    capability = models.CharField(max_length=50, db_index=True)
    provider = models.CharField(max_length=50)
    model = models.CharField(max_length=100)
    input_tokens = models.IntegerField(validators=[MinValueValidator(0)])
    output_tokens = models.IntegerField(validators=[MinValueValidator(0)])
    total_tokens = models.IntegerField(validators=[MinValueValidator(0)])
    estimated_cost = models.DecimalField(
        max_digits=10, decimal_places=6, validators=[MinValueValidator(0)]
    )
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    request_id = models.CharField(max_length=255, null=True, blank=True, db_index=True)

    class Meta:
        indexes = [
            models.Index(fields=["workspace_id", "created_at"]),
            models.Index(fields=["user_id", "created_at"]),
            models.Index(fields=["capability", "created_at"]),
        ]

    def __str__(self):
        return f"AIUsageRecord({self.id}, {self.capability}, {self.total_tokens} tokens)"
