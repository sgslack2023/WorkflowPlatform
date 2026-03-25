import uuid
from django.db import models
from core.models import Organization

class PerformanceMetric(models.Model):
    METRIC_TYPES = [
        ('workflow_duration', 'Workflow Duration'),
        ('node_duration', 'Node Duration'),
        ('agent_latency', 'Agent Latency'),
        ('transform_duration', 'Transform Duration'),
        ('api_response_time', 'API Response Time'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    metric_type = models.CharField(max_length=50, choices=METRIC_TYPES)
    resource_id = models.UUIDField()
    resource_type = models.CharField(max_length=50)
    
    value = models.FloatField()  # Duration in milliseconds
    unit = models.CharField(max_length=20, default='ms')
    
    # Context
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='performance_metrics')
    metadata = models.JSONField(default=dict, blank=True)
    
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['metric_type', 'timestamp']),
            models.Index(fields=['organization', 'timestamp']),
        ]

    def __str__(self):
        return f"{self.metric_type}: {self.value}{self.unit}"
