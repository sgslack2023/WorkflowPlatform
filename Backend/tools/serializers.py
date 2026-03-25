from rest_framework import serializers
from .models import Tool, ToolExecution, ToolVersion

class ToolSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tool
        fields = '__all__'
        read_only_fields = ['organization', 'id', 'created_at', 'updated_at']

class ToolExecutionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ToolExecution
        fields = '__all__'

class ToolVersionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ToolVersion
        fields = '__all__'
