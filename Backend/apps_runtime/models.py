import uuid
from django.db import models

class AppDefinition(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey("core.Organization", on_delete=models.CASCADE, related_name="apps", null=True, blank=True)
    workflows = models.ManyToManyField("workflows.Workflow", related_name="apps", blank=True)
    
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    
    # URL and Visibility
    public_slug = models.SlugField(unique=True)
    is_published = models.BooleanField(default=False)
    
    # Customization/Branding
    icon = models.CharField(max_length=50, default="layout")
    color = models.CharField(max_length=7, default="#6366f1")
    
    # Mapping UI components to Workflow Nodes
    # e.g., layout_config stores {"widgets": [{"type": "chat", "workflow_id": "...", "node_id": "..."}]}
    layout_config = models.JSONField(default=dict, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.public_slug})"

class AppRun(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    app = models.ForeignKey(AppDefinition, on_delete=models.CASCADE, related_name="runs")
    scenario = models.ForeignKey("core.Scenario", on_delete=models.SET_NULL, null=True, blank=True, related_name="app_runs")
    
    input_payload = models.JSONField(default=dict) # Includes merged scenario overrides
    output_payload = models.JSONField(default=dict, null=True, blank=True)
    run_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.app.public_slug} - {self.run_at}"
