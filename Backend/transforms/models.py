import uuid
from django.db import models

class TransformDefinition(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey("core.Organization", on_delete=models.CASCADE, related_name="transforms", null=True, blank=True)
    name = models.CharField(max_length=255)
    key = models.SlugField(max_length=100, unique=True, null=True, blank=True)
    description = models.TextField(blank=True, null=True)
    
    # Discovery & Logic
    python_path = models.CharField(max_length=500, blank=True, null=True, help_text="Python path to the Transform Class")
    auto_discovered = models.BooleanField(default=False)
    
    # Schemas for Workflow UI
    input_schema = models.JSONField(default=dict, blank=True)
    output_schema = models.JSONField(default=dict, blank=True)
    
    dsl_definition = models.JSONField(default=dict)
    compiled_code = models.TextField(blank=True, null=True)
    
    input_tables = models.ManyToManyField(
        "datasources.DynamicTable",
        related_name="input_to_transforms",
        blank=True
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

class TransformRun(models.Model):
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("running", "Running"),
        ("success", "Success"),
        ("failed", "Failed"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    transform = models.ForeignKey(
        TransformDefinition,
        on_delete=models.CASCADE,
        related_name="runs"
    )

    output_table = models.OneToOneField(
        "datasources.DynamicTable",
        on_delete=models.CASCADE,
        related_name="generated_by_run",
        null=True,
        blank=True
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="pending"
    )

    error = models.TextField(blank=True, null=True)

    started_at = models.DateTimeField(null=True, blank=True)
    finished_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Run {self.id} for {self.transform.name}"
