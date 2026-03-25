from rest_framework import serializers
from .models import LLMProvider, AgentConfig, AgentDefinition, AgentMemory, AgentCallLog, AgentDefinitionVersion, ChatConversation, ChatMessage
from tools.models import Tool
from tools.serializers import ToolSerializer
from core.models import Organization

class GlobalRestrictedSerializerMixin:
    def validate_organization(self, value):
        user = self.context['request'].user
        if value is None and not user.is_superuser:
            raise serializers.ValidationError("Only superusers can create global components.")
        return value

class LLMProviderSerializer(GlobalRestrictedSerializerMixin, serializers.ModelSerializer):
    organization = serializers.PrimaryKeyRelatedField(
        queryset=Organization.objects.all(), allow_null=True, required=False
    )
    # Write-only: accept API key from the form
    api_key = serializers.CharField(write_only=True, required=False, allow_blank=True)
    # Read-only: masked version for display
    has_api_key = serializers.SerializerMethodField()
    masked_api_key = serializers.SerializerMethodField()
    
    class Meta:
        model = LLMProvider
        fields = '__all__'
    
    def get_has_api_key(self, obj):
        return bool(obj.config.get('api_key'))
    
    def get_masked_api_key(self, obj):
        key = obj.config.get('api_key', '')
        if not key:
            return ''
        # Show first 4 chars + dots
        if len(key) > 8:
            return key[:4] + '••••' + key[-4:]
        return '••••••••'
    
    def create(self, validated_data):
        api_key = validated_data.pop('api_key', None)
        config = validated_data.get('config', {}) or {}
        if api_key:
            config['api_key'] = api_key
        validated_data['config'] = config
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        api_key = validated_data.pop('api_key', None)
        config = validated_data.get('config', None)
        if config is None:
            config = instance.config or {}
        # Only update api_key if a new one was provided (non-blank)
        if api_key:
            config['api_key'] = api_key
        elif 'api_key' not in config and instance.config.get('api_key'):
            # Preserve existing key
            config['api_key'] = instance.config['api_key']
        validated_data['config'] = config
        return super().update(instance, validated_data)

class AgentConfigSerializer(GlobalRestrictedSerializerMixin, serializers.ModelSerializer):
    organization = serializers.PrimaryKeyRelatedField(
        queryset=Organization.objects.all(), allow_null=True, required=False
    )
    # Unified Tool Architecture
    tools = ToolSerializer(many=True, read_only=True)
    tool_ids = serializers.PrimaryKeyRelatedField(
        many=True, write_only=True, queryset=Tool.objects.all(), source='tools', required=False
    )

    class Meta:
        model = AgentConfig
        fields = '__all__'


class AgentDefinitionSerializer(GlobalRestrictedSerializerMixin, serializers.ModelSerializer):
    tools = ToolSerializer(many=True, read_only=True)
    tool_ids = serializers.PrimaryKeyRelatedField(
        many=True, write_only=True, queryset=Tool.objects.all(), source='tools'
    )
    organization = serializers.PrimaryKeyRelatedField(
        queryset=Organization.objects.all(), allow_null=True, required=False
    )

    class Meta:
        model = AgentDefinition
        fields = '__all__'

class AgentMemorySerializer(serializers.ModelSerializer):
    class Meta:
        model = AgentMemory
        fields = '__all__'

class AgentCallLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = AgentCallLog
        fields = '__all__'

class AgentDefinitionVersionSerializer(serializers.ModelSerializer):
    class Meta:
        model = AgentDefinitionVersion
        fields = '__all__'

class ChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatMessage
        fields = ['id', 'role', 'content', 'tokens_used', 'latency_ms', 'timestamp']

class ChatConversationSerializer(serializers.ModelSerializer):
    messages = ChatMessageSerializer(many=True, read_only=True)

    class Meta:
        model = ChatConversation
        fields = ['id', 'workflow_id', 'node_id', 'title', 'created_at', 'updated_at', 'messages']
