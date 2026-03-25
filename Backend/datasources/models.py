import uuid
from django.db import models

class DataSource(models.Model):
    SOURCE_TYPES = (
        ('database', 'Database'),
        ('csv', 'CSV'),
        ('api', 'API'),
    )
    FETCH_MODES = (
        ('live', 'Live'),
        ('batch', 'Batch'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey("core.Organization", on_delete=models.CASCADE, related_name="datasources", null=True, blank=True)
    name = models.CharField(max_length=255)
    source_type = models.CharField(max_length=50, choices=SOURCE_TYPES)
    config = models.JSONField(default=dict, blank=True)
    fetch_mode = models.CharField(max_length=20, choices=FETCH_MODES)
    created_at = models.DateTimeField(auto_now_add=True)
    
    # Editable per scenario
    scenario_overrides = models.JSONField(default=dict, blank=True)

    def __str__(self):
        return self.name

class DynamicTable(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey("core.Organization", on_delete=models.CASCADE, related_name="dynamic_tables", null=True, blank=True)
    # Link to a DataSource if this table is fetched from one
    data_source = models.ForeignKey(DataSource, on_delete=models.SET_NULL, null=True, blank=True, related_name="tables")
    
    name = models.CharField(max_length=255)
    schema_definition = models.JSONField(default=dict, help_text="JSON schema definition")
    physical_table_name = models.CharField(max_length=255, blank=True, null=True, unique=True)
    
    last_fetched_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

class DynamicTableHistory(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    dynamic_table = models.ForeignKey(DynamicTable, on_delete=models.CASCADE, related_name="history")
    schema_snapshot = models.JSONField(default=dict)
    change_reason = models.CharField(max_length=255, blank=True, null=True) # e.g., "Initial Creation", "Added Column X"
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.dynamic_table.name} - {self.created_at}"
