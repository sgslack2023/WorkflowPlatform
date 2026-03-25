from rest_framework import serializers
from .models import Workflow, WorkflowNode, WorkflowEdge, WorkflowVersion, CompiledWorkflow, WorkflowRun, NodeExecution, WorkflowRunLog

class WorkflowNodeSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkflowNode
        fields = '__all__'

class WorkflowEdgeSerializer(serializers.ModelSerializer):
    source_langgraph_id = serializers.UUIDField(source='source_node.langgraph_id', read_only=True)
    target_langgraph_id = serializers.UUIDField(source='target_node.langgraph_id', read_only=True)
    
    class Meta:
        model = WorkflowEdge
        fields = '__all__'

class WorkflowSerializer(serializers.ModelSerializer):
    nodes = WorkflowNodeSerializer(many=True, read_only=True)
    edges = WorkflowEdgeSerializer(many=True, read_only=True)

    class Meta:
        model = Workflow
        fields = ['id', 'name', 'description', 'organization', 'created_at', 'nodes', 'edges', 'is_published']
        read_only_fields = ['organization']

class WorkflowVersionSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkflowVersion
        fields = '__all__'

class CompiledWorkflowSerializer(serializers.ModelSerializer):
    class Meta:
        model = CompiledWorkflow
        fields = '__all__'

class NodeExecutionSerializer(serializers.ModelSerializer):
    class Meta:
        model = NodeExecution
        fields = '__all__'

class WorkflowRunSerializer(serializers.ModelSerializer):
    node_executions = NodeExecutionSerializer(many=True, read_only=True)
    
    class Meta:
        model = WorkflowRun
        fields = '__all__'

class WorkflowRunLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkflowRunLog
        fields = '__all__'
