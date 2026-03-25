from django.db.models import Max
from .models import WorkflowVersion, WorkflowNode, WorkflowEdge

class VersioningService:
    @staticmethod
    def create_workflow_version(workflow, user, notes=''):
        """Create a new version snapshot of workflow"""
        
        # Get current max version
        max_version = WorkflowVersion.objects.filter(
            workflow=workflow
        ).aggregate(Max('version_number'))['version_number__max'] or 0
        
        # Snapshot current state
        # We simplify the snapshot by getting all values
        nodes = list(workflow.nodes.all().values())
        edges = list(workflow.edges.all().values())
        
        # Convert UUIDs to strings in JSON
        for node in nodes:
            for k, v in node.items():
                if isinstance(v, (type(workflow.id))): node[k] = str(v)
        for edge in edges:
            for k, v in edge.items():
                if isinstance(v, (type(workflow.id))): edge[k] = str(v)

        version = WorkflowVersion.objects.create(
            workflow=workflow,
            version_number=max_version + 1,
            notes=notes,
            nodes_snapshot=nodes,
            edges_snapshot=edges,
            created_by=user
        )
        
        return version

    @staticmethod
    def restore_workflow_version(workflow, version_number):
        """Restore workflow to a specific version"""
        version = WorkflowVersion.objects.get(
            workflow=workflow,
            version_number=version_number
        )
        
        # Clear current
        workflow.nodes.all().delete()
        workflow.edges.all().delete()
        
        # Restore nodes
        # Note: In a real implementation, handle ID mapping carefully
        for node_data in version.nodes_snapshot:
            # Remove IDs to avoid conflicts or just update
            node_data.pop('id', None)
            node_data.pop('workflow_id', None)
            WorkflowNode.objects.create(workflow=workflow, **node_data)
        
        # Restore edges (assumes node langgraph_ids are stable)
        # Real implementation should map IDs if they changed
        for edge_data in version.edges_snapshot:
            edge_data.pop('id', None)
            edge_data.pop('workflow_id', None)
            # Find source/target nodes by langgraph_id or similar stable ID
            # This is a simplified restore
            WorkflowEdge.objects.create(workflow=workflow, **edge_data)
            
        return workflow
