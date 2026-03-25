from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import models, transaction
from django.db.models import Q
from .models import Workflow, WorkflowNode, WorkflowEdge, WorkflowVersion, WorkflowRun, NodeExecution
from .serializers import (
    WorkflowSerializer, WorkflowNodeSerializer, WorkflowEdgeSerializer,
    WorkflowVersionSerializer, WorkflowRunSerializer
)
from .services import WorkflowCompilationService
from .versioning import VersioningService
from .tasks import queue_workflow_run
from .output_storage import OutputStorageService
from django.utils import timezone
import uuid as _uuid
import re

def _is_valid_uuid(val):
    try:
        if isinstance(val, _uuid.UUID): return True
        _uuid.UUID(str(val))
        return True
    except (ValueError, TypeError, AttributeError):
        return False


def clean_latex_from_response(text: str) -> str:
    """Post-process LLM response to convert LaTeX math into readable plain text."""
    if not text or '\\' not in text:
        return text
    
    # Remove display math delimiters: \[...\] and $$...$$
    text = re.sub(r'\\\[', '', text)
    text = re.sub(r'\\\]', '', text)
    
    # Remove inline math delimiters: \(...\)
    text = re.sub(r'\\\(', '', text)
    text = re.sub(r'\\\)', '', text)
    
    # \text{...} -> contents
    text = re.sub(r'\\text\{([^}]*)\}', r'\1', text)
    
    # \textbf{...} -> **contents**
    text = re.sub(r'\\textbf\{([^}]*)\}', r'**\1**', text)
    
    # \frac{a}{b} -> (a / b)
    # Handle nested fracs by running multiple passes
    for _ in range(5):
        text = re.sub(r'\\frac\{([^{}]*)\}\{([^{}]*)\}', r'(\1 / \2)', text)
    
    # \sqrt{x} -> √(x)
    text = re.sub(r'\\sqrt\{([^}]*)\}', r'√(\1)', text)
    
    # \times -> ×
    text = text.replace('\\times', '×')
    
    # \cdot -> ·
    text = text.replace('\\cdot', '·')
    
    # \pm -> ±
    text = text.replace('\\pm', '±')
    
    # \div -> ÷
    text = text.replace('\\div', '÷')
    
    # \leq, \geq, \neq, \approx
    text = text.replace('\\leq', '≤')
    text = text.replace('\\geq', '≥')
    text = text.replace('\\neq', '≠')
    text = text.replace('\\approx', '≈')
    text = text.replace('\\infty', '∞')
    
    # \left and \right with parens/brackets — just remove the command
    text = re.sub(r'\\left\s*([(\[{|])', r'\1', text)
    text = re.sub(r'\\right\s*([)\]}|])', r'\1', text)
    text = re.sub(r'\\left\s*\\.', '', text)
    text = re.sub(r'\\right\s*\\.', '', text)
    
    # \% -> %
    text = text.replace('\\%', '%')
    
    # Superscript: x^{2} -> x²  (common cases)
    superscripts = {'0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', 'n': 'ⁿ'}
    def replace_superscript(m):
        exp = m.group(1)
        if len(exp) == 1 and exp in superscripts:
            return superscripts[exp]
        return f'^({exp})'
    text = re.sub(r'\^\{([^}]*)\}', replace_superscript, text)
    
    # Subscript: x_{i} -> x_i (just remove braces)
    text = re.sub(r'_\{([^}]*)\}', r'_\1', text)
    
    # Greek letters
    greek = {
        '\\alpha': 'α', '\\beta': 'β', '\\gamma': 'γ', '\\delta': 'δ',
        '\\epsilon': 'ε', '\\theta': 'θ', '\\lambda': 'λ', '\\mu': 'μ',
        '\\pi': 'π', '\\sigma': 'σ', '\\phi': 'φ', '\\omega': 'ω',
        '\\sum': 'Σ', '\\int': '∫', '\\partial': '∂', '\\nabla': '∇',
    }
    for cmd, char in greek.items():
        text = text.replace(cmd, char)
    
    # Clean up any remaining \command{...} -> contents
    text = re.sub(r'\\[a-zA-Z]+\{([^}]*)\}', r'\1', text)
    
    # Clean up any remaining bare \commands (that aren't newlines)
    text = re.sub(r'\\([a-zA-Z]{2,})', r'\1', text)
    
    # Clean excessive whitespace
    text = re.sub(r'  +', ' ', text)
    
    return text.strip()



class WorkflowViewSet(viewsets.ModelViewSet):
    queryset = Workflow.objects.all()
    serializer_class = WorkflowSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = self.queryset.filter(
            Q(organization__isnull=True) |
            Q(organization__memberships__user=self.request.user)
        ).distinct()
        
        is_published = self.request.query_params.get('is_published')
        if is_published is not None:
            queryset = queryset.filter(is_published=is_published.lower() == 'true')
            
        return queryset

    def perform_create(self, serializer):
        # Auto-assign organization
        membership = self.request.user.memberships.first()
        if membership:
            workflow = serializer.save(organization=membership.organization)
        else:
            workflow = serializer.save()



        # Create nested nodes if provided
        nodes_data = self.request.data.get('nodes_data', [])
        node_map = {}  # frontend_id -> db node
        for node_info in nodes_data:
            config = node_info.get('config', {})
            frontend_id = node_info.get('frontend_id')
            
            # Use frontend_id as langgraph_id if it's a valid UUID to preserve stability
            node_kwargs = {
                'workflow': workflow,
                'node_type': node_info.get('node_type', 'datasource'),
                'config': config,
                'is_exposed_to_apps': node_info.get('is_exposed_to_apps', True),
            }
            
            if _is_valid_uuid(frontend_id):
                node_kwargs['langgraph_id'] = frontend_id
            
            if frontend_id:
                config['frontend_id'] = frontend_id
                
            node = WorkflowNode.objects.create(**node_kwargs)
            if frontend_id:
                node_map[frontend_id] = node

        # Create edges if provided
        edges_data = self.request.data.get('edges_data', [])
        for edge_info in edges_data:
            source = node_map.get(edge_info.get('source'))
            target = node_map.get(edge_info.get('target'))
            if source and target:
                WorkflowEdge.objects.create(
                    workflow=workflow,
                    source_node=source,
                    target_node=target,
                )

    @transaction.atomic
    def perform_update(self, serializer):
        workflow = serializer.save()

        # Replace nodes and edges if provided
        nodes_data = self.request.data.get('nodes_data')
        if nodes_data is not None:
            # Detach references before deleting old nodes to avoid FK constraint errors
            old_node_ids = list(workflow.nodes.values_list('id', flat=True))
            if old_node_ids:
                # Clear current_node FK in any WorkflowRun pointing to old nodes
                WorkflowRun.objects.filter(
                    workflow=workflow, current_node_id__in=old_node_ids
                ).update(current_node=None)
                
                # Delete NodeExecution records for old nodes
                NodeExecution.objects.filter(node_id__in=old_node_ids).delete()
            
            # Now safe to delete old nodes (cascades to edges)
            workflow.nodes.all().delete()

            node_map = {}
            for node_info in nodes_data:
                config = node_info.get('config', {})
                frontend_id = node_info.get('frontend_id')
                
                node_kwargs = {
                    'workflow': workflow,
                    'node_type': node_info.get('node_type', 'datasource'),
                    'config': config,
                    'is_exposed_to_apps': node_info.get('is_exposed_to_apps', True),
                }
                
                if _is_valid_uuid(frontend_id):
                    node_kwargs['langgraph_id'] = frontend_id

                if frontend_id:
                    config['frontend_id'] = frontend_id

                node = WorkflowNode.objects.create(**node_kwargs)
                if frontend_id:
                    node_map[frontend_id] = node

            edges_data = self.request.data.get('edges_data', [])
            for edge_info in edges_data:
                source = node_map.get(edge_info.get('source'))
                target = node_map.get(edge_info.get('target'))
                if source and target:
                    WorkflowEdge.objects.create(
                        workflow=workflow,
                        source_node=source,
                        target_node=target,
                    )

    @action(detail=True, methods=['post'])
    def create_version(self, request, pk=None):
        workflow = self.get_object()
        notes = request.data.get('notes', '')
        version = VersioningService.create_workflow_version(workflow, request.user, notes)
        return Response(WorkflowVersionSerializer(version).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def restore_version(self, request, pk=None):
        workflow = self.get_object()
        version_number = request.data.get('version_number')
        VersioningService.restore_workflow_version(workflow, version_number)
        return Response({'status': 'restored'})

    @action(detail=True, methods=['post'])
    def publish(self, request, pk=None):
        workflow = self.get_object()
        workflow.is_published = request.data.get('is_published', True)
        workflow.save()
        return Response({'status': 'published', 'is_published': workflow.is_published})

    @action(detail=True, methods=['post'])
    def run(self, request, pk=None):
        """Quick run: Create a snapshot version, compile it, and queue execution."""
        from .services import WorkflowCompilationService
        from .versioning import VersioningService
        from .tasks import queue_workflow_run

        workflow = self.get_object()
        
        # 1. Snapshot current state as a new version
        notes = f"Auto-snapshot for quick run at {timezone.now()}"
        version = VersioningService.create_workflow_version(workflow, request.user, notes)
        
        # 2. Compile this version
        compilation_service = WorkflowCompilationService()
        compiled = compilation_service.compile_workflow(version, user=request.user)
        
        if not compiled.is_valid:
            return Response({
                'error': 'Workflow failed validation', 
                'details': compiled.validation_errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # 3. Create and queue the run
        run = WorkflowRun.objects.create(
            workflow=workflow,
            compiled_workflow=compiled,
            input_payload=request.data.get('input_payload', {}),
            triggered_by=request.user,
            status='pending'
        )
        
        queue_workflow_run(run.id)
        
        return Response({
            'status': 'queued',
            'run_id': run.id,
            'version_number': version.version_number
        }, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], url_path='node-data')
    def node_data(self, request, pk=None):
        workflow = self.get_object()
        node_id = request.data.get('node_id')
        
        if not node_id:
            return Response({"error": "node_id is required"}, status=status.HTTP_400_BAD_REQUEST)

        # Debug: List all runs for this workflow
        all_runs = workflow.runs.all().order_by('-created_at')[:5]
        print(f"  [node-data] Workflow {workflow.id} has {workflow.runs.count()} runs. Latest 5:")
        for r in all_runs:
            print(f"    - Run {r.id}: status={r.status}, created={r.created_at}")

        # 1. Get the most recent successful run of this workflow
        latest_run = workflow.runs.filter(status='success').order_by('-created_at').first()
        if not latest_run:
            # Fallback to any run that might have partial results
            latest_run = workflow.runs.order_by('-created_at').first()
            print(f"  [node-data] No successful run found, using fallback run: {latest_run.id if latest_run else 'NONE'}")
        else:
            print(f"  [node-data] Using successful run: {latest_run.id}, created={latest_run.created_at}")

        if not latest_run:
            return Response({
                "error": "No workflow runs found. Execute the workflow first.",
                "details": "To see data in the app, you need to run the workflow at least once from the designer. Use the 'Run' button in the toolbar to generate an execution history."
            }, status=status.HTTP_404_NOT_FOUND)

        # 1.5 Try to resolve the stable node ID (langgraph_id)
        # The frontend might send a DB ID, a frontend ID, or a Name.
        resolved_node = workflow.nodes.filter(
            Q(id=node_id) | 
            Q(langgraph_id=node_id) |
            Q(config__frontend_id=node_id) |
            Q(config__id=node_id)
        ).first()
        
        stable_id = str(resolved_node.langgraph_id) if resolved_node else node_id

        # 2. Find the NodeExecution for the given node
        # Match by database ID, langgraph_id, frontend_id, or name/label
        execution = latest_run.node_executions.filter(
            Q(node_id=node_id) | 
            Q(node__langgraph_id=node_id) |
            Q(node__langgraph_id=stable_id) |
            Q(node__config__frontend_id=node_id) |
            Q(node__config__id=node_id)
        ).filter(status='success').order_by('-ended_at').first()

        if not execution:
            # Final fallback: find ANY execution in this run that looks like it belongs to a node with this name/label
            execution = latest_run.node_executions.filter(
                Q(node__config__name__icontains=node_id) |
                Q(node__config__label__icontains=node_id)
            ).first()

        if not execution:
            # Fallback 3: check output_payload of the run itself using stable_id
            if latest_run.output_payload and stable_id in latest_run.output_payload:
                print(f"  [node-data] Found data in output_payload for stable_id: {stable_id}")
                return Response({
                    "node_id": node_id,
                    "status": "success",
                    "data": latest_run.output_payload[stable_id]
                })

            return Response({
                "error": f"No execution data found for node '{node_id}'.",
                "details": f"Checked {latest_run.node_executions.count()} executions in the latest run. Stable ID: {stable_id}. Make sure the node ID matches what's in the app widget binding."
            }, status=status.HTTP_404_NOT_FOUND)

        # 3. Return output data
        storage = OutputStorageService()
        data = storage.get_output(execution)
        
        print(f"  [node-data] Found execution for node '{node_id}':")
        print(f"    - Execution ID: {execution.id}")
        print(f"    - Execution status: {execution.status}")
        print(f"    - Execution started: {execution.started_at}")
        print(f"    - Execution ended: {execution.ended_at}")
        print(f"    - From run ID: {execution.workflow_run_id}")
        print(f"    - output_inline present: {execution.output_inline is not None}")
        print(f"    - output_ref: {execution.output_ref}")
        if isinstance(data, dict):
            print(f"    - Data keys: {list(data.keys())}")
            if 'transformed_data' in data:
                print(f"    - transformed_data rows: {len(data.get('transformed_data', []))}")
            if 'raw_data' in data:
                print(f"    - raw_data rows: {len(data.get('raw_data', []))}")
        
        return Response({
            "node_id": node_id,
            "status": execution.status,
            "data": data or []
        })

    @action(detail=True, methods=['post'], url_path='chat')
    def chat(self, request, pk=None):
        from django.utils import timezone
        workflow = self.get_object()
        node_id = request.data.get('node_id')
        message = request.data.get('message')

        if not node_id or not message:
            return Response({"error": "node_id and message are required"}, status=status.HTTP_400_BAD_REQUEST)

        # 1. Find the target node
        node = workflow.nodes.filter(Q(id=node_id) | Q(langgraph_id=node_id)).first()
        if not node:
            node = workflow.nodes.filter(config__frontend_id=node_id).first()
        
        # If still not found, it might be an un-saved node or a direct widget-to-agent binding
        # We'll allow processing if agent_id is provided directly in request
        request_agent_id = request.data.get('agent_id') or request.data.get('agentId')
        
        if not node and not request_agent_id:
            return Response({"error": "Valid node or agent_id not found"}, status=status.HTTP_404_NOT_FOUND)

        # 2. Get context data: only from the widgets the user placed in the app
        preceding_data = []
        context_node_ids = request.data.get('context_node_ids', [])
        latest_run = workflow.runs.filter(status='success').order_by('-created_at').first()
        if latest_run:
            if context_node_ids:
                # Explicit list from the app's widget bindings
                for ctx_nid in context_node_ids:
                    ctx_node = workflow.nodes.filter(
                        Q(id=ctx_nid) | Q(langgraph_id=ctx_nid) | Q(config__frontend_id=ctx_nid)
                    ).first()
                    if not ctx_node:
                        continue

                    execution = latest_run.node_executions.filter(
                        Q(node=ctx_node) | Q(node__langgraph_id=str(ctx_node.langgraph_id))
                    ).filter(status='success').order_by('-ended_at').first()

                    if not execution or not execution.output_inline:
                        # Fallback: check output_payload keyed by langgraph_id
                        stable_id = str(ctx_node.langgraph_id)
                        if latest_run.output_payload and stable_id in latest_run.output_payload:
                            output = latest_run.output_payload[stable_id]
                        else:
                            continue
                    else:
                        output = execution.output_inline

                    node_name = (
                        ctx_node.config.get('name') or
                        ctx_node.config.get('label') or
                        ctx_node.node_type
                    )
                    
                    # Detect if this is an aggregated result structurally
                    is_agg = False
                    if ctx_node.node_type == 'transform':
                        # 1. Check direct config keys
                        t_key = ctx_node.config.get('transformKey') or ctx_node.config.get('key')
                        
                        # 2. Fallback: Check TransformDefinition if resource_id exists
                        if not t_key and ctx_node.config.get('resource_id'):
                            from transforms.models import TransformDefinition
                            td = TransformDefinition.objects.filter(id=ctx_node.config['resource_id']).first()
                            if td:
                                t_key = td.key
                        
                        # Check match
                        if t_key in ('agg.smart_cube', 'agg.aggregate', 'aggregate', 'smart_cube'):
                            is_agg = True
                        
                        # 3. Fallback: Check if name/label implies aggregation
                        if not is_agg and any(word in node_name.lower() for word in ['aggregate', 'cube', 'summary', 'grouped']):
                            is_agg = True
                            
                        # 4. Lineage Fallback: If it's a transform connected to an aggregate source
                        if not is_agg:
                            # Check predecessors in DAG
                            predecessors = ctx_node.inbound_edges.all()
                            for edge in predecessors:
                                src = edge.source_node
                                if src.node_type == 'transform':
                                    src_t_key = src.config.get('transformKey') or src.config.get('key')
                                    if src_t_key in ('agg.smart_cube', 'aggregate'):
                                        is_agg = True
                                        break
                                elif 'aggregate' in (src.config.get('label') or '').lower():
                                    is_agg = True
                                    break

                    # Extract actual row data from node output
                    # Node outputs are dicts like {raw_data: [...]} or {transformed_data: [...]}
                    # but llm_service expects data to be the actual list of rows
                    if isinstance(output, dict):
                        row_data = (
                            output.get('transformed_data') or 
                            output.get('raw_data') or 
                            output.get('data') or 
                            []
                        )
                        # Extract table ID for Text-to-SQL support
                        table_id = output.get('source_table') or output.get('table_id')
                    elif isinstance(output, list):
                        row_data = output
                        table_id = None
                    else:
                        row_data = []
                        table_id = None
                    
                    # For datasource nodes, try to get the table ID from config
                    if not table_id and ctx_node.node_type == 'datasource':
                        table_id = (
                            ctx_node.config.get('resource_id') or 
                            ctx_node.config.get('resourceId') or
                            ctx_node.config.get('dynamic_table_id')
                        )
                    
                    preceding_data.append({
                        "_source": node_name,
                        "_node_type": ctx_node.node_type,
                        "_is_aggregated": is_agg,
                        "_table_id": table_id,  # For Text-to-SQL
                        "data": row_data if isinstance(row_data, list) else []
                    })
            else:
                # Fallback: use direct predecessors (original behaviour)
                # But wrap them properly with metadata for llm_service
                if node:
                    inbound_edges = node.inbound_edges.all()
                    for edge in inbound_edges:
                        src_node = edge.source_node
                        source_execution = latest_run.node_executions.filter(node=src_node).first()
                        if source_execution and source_execution.output_inline:
                            output = source_execution.output_inline
                            
                            # Get node name
                            fallback_name = (
                                src_node.config.get('name') or
                                src_node.config.get('label') or
                                src_node.node_type
                            )
                            
                            # Detect if aggregated (simplified check for fallback)
                            fallback_is_agg = False
                            if src_node.node_type == 'transform':
                                t_key = src_node.config.get('transformKey') or src_node.config.get('key')
                                if t_key in ('agg.smart_cube', 'agg.aggregate', 'aggregate', 'smart_cube'):
                                    fallback_is_agg = True
                                elif any(word in fallback_name.lower() for word in ['aggregate', 'cube', 'summary', 'grouped']):
                                    fallback_is_agg = True
                            
                            # Extract row data and table ID
                            if isinstance(output, dict):
                                row_data = (
                                    output.get('transformed_data') or 
                                    output.get('raw_data') or 
                                    output.get('data') or 
                                    []
                                )
                                fallback_table_id = output.get('source_table') or output.get('table_id')
                            elif isinstance(output, list):
                                row_data = output
                                fallback_table_id = None
                            else:
                                row_data = []
                                fallback_table_id = None
                            
                            # For datasource nodes, get table ID from config
                            if not fallback_table_id and src_node.node_type == 'datasource':
                                fallback_table_id = (
                                    src_node.config.get('resource_id') or
                                    src_node.config.get('resourceId') or
                                    src_node.config.get('dynamic_table_id')
                                )
                            
                            preceding_data.append({
                                "_source": fallback_name,
                                "_node_type": src_node.node_type,
                                "_is_aggregated": fallback_is_agg,
                                "_table_id": fallback_table_id,  # For Text-to-SQL
                                "data": row_data if isinstance(row_data, list) else []
                            })

        # 3. Resolve the agent associated with this node
        from agents.models import AgentDefinition
        agent_id = (
            request_agent_id or 
            (node.config.get('resource_id') if node else None) or
            (node.config.get('resourceId') if node else None) or
            (node.config.get('agent_id') if node else None) or 
            (node.config.get('agentId') if node else None)
        )
        
        print(f"  [chat] node_id={node_id}, agent_id resolved={agent_id}, node config keys={list(node.config.keys()) if node else 'N/A'}")
        
        if not agent_id:
            return Response({"error": "No agent configured. Please select an agent in the node or widget settings."}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            agent = AgentDefinition.objects.get(id=agent_id)
        except (AgentDefinition.DoesNotExist, ValueError):
            # Fallback: check by name if ID is human-readable/mock ID
            agent = AgentDefinition.objects.filter(name__icontains=str(agent_id)).first()
            if not agent:
                return Response({"error": f"Agent '{agent_id}' not found"}, status=status.HTTP_404_NOT_FOUND)

        # 4. Get or create conversation for this user + workflow + node
        from agents.models import ChatConversation, ChatMessage
        conversation_id = request.data.get('conversation_id')

        if conversation_id:
            # Continue an existing conversation
            try:
                conversation = ChatConversation.objects.get(
                    id=conversation_id, user=request.user
                )
            except ChatConversation.DoesNotExist:
                conversation = None

        if not conversation_id or not conversation:
            # Create a new conversation (or find the latest one if none specified)
            conversation = ChatConversation.objects.create(
                user=request.user,
                workflow_id=workflow.id,
                node_id=node_id,
                agent_definition=agent,
                title=f"Chat - {timezone.now().strftime('%b %d, %H:%M')}"
            )

        # Save the user message
        ChatMessage.objects.create(
            conversation=conversation,
            role='user',
            content=message,
        )

        # Load recent chat history for LLM context
        recent_messages = list(
            conversation.messages.order_by('-timestamp')[:20]
        )[::-1]  # reverse to chronological
        chat_history = [
            {'role': m.role, 'content': m.content}
            for m in recent_messages[:-1]  # exclude the message we just saved (it's the current one)
        ]

        # 5. Real LLM call with data context + chat history
        from agents.llm_service import invoke_agent_chat, log_agent_call
        
        result = invoke_agent_chat(agent, message, context_data=preceding_data, chat_history=chat_history)
        
        # Log for auditing
        log_agent_call(agent, message, result)

        # Save the assistant response — clean any raw LaTeX from the LLM
        assistant_content = clean_latex_from_response(result.get('content', 'No response generated.'))
        ChatMessage.objects.create(
            conversation=conversation,
            role='assistant',
            content=assistant_content,
            tokens_used=result.get('tokens_total', 0),
            latency_ms=result.get('latency_ms', 0),
        )

        # Touch the conversation timestamp
        conversation.save()  # triggers auto_now on updated_at

        return Response({
            "role": "assistant",
            "content": assistant_content,
            "timestamp": timezone.now(),
            "tokens_used": result.get('tokens_total', 0),
            "latency_ms": result.get('latency_ms', 0),
            "conversation_id": str(conversation.id),
        })

    @action(detail=True, methods=['get'], url_path='chat-conversations')
    def chat_conversations(self, request, pk=None):
        """List all chat conversations for a specific workflow + node for the current user."""
        workflow = self.get_object()
        node_id = request.query_params.get('node_id')
        if not node_id:
            return Response({"error": "node_id query param is required"}, status=status.HTTP_400_BAD_REQUEST)

        from agents.models import ChatConversation

        conversations = ChatConversation.objects.filter(
            user=request.user,
            workflow_id=workflow.id,
            node_id=node_id,
        ).values('id', 'title', 'created_at', 'updated_at').order_by('-updated_at')

        return Response(list(conversations))

    @action(detail=True, methods=['get'], url_path='chat-history')
    def chat_history(self, request, pk=None):
        """Return the chat history for a specific conversation or the latest one."""
        workflow = self.get_object()
        node_id = request.query_params.get('node_id')
        conversation_id = request.query_params.get('conversation_id')

        if not node_id and not conversation_id:
            return Response({"error": "node_id or conversation_id is required"}, status=status.HTTP_400_BAD_REQUEST)

        from agents.models import ChatConversation
        from agents.serializers import ChatConversationSerializer

        if conversation_id:
            conversation = ChatConversation.objects.filter(
                id=conversation_id, user=request.user
            ).first()
        else:
            conversation = ChatConversation.objects.filter(
                user=request.user,
                workflow_id=workflow.id,
                node_id=node_id,
            ).first()  # ordered by -updated_at due to model Meta

        if not conversation:
            return Response({"messages": []})

        serializer = ChatConversationSerializer(conversation)
        return Response(serializer.data)

class WorkflowNodeViewSet(viewsets.ModelViewSet):
    queryset = WorkflowNode.objects.all()
    serializer_class = WorkflowNodeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        from django.db.models import Q
        return self.queryset.filter(
            Q(workflow__organization__isnull=True) |
            Q(workflow__organization__memberships__user=self.request.user)
        ).distinct()

class WorkflowEdgeViewSet(viewsets.ModelViewSet):
    queryset = WorkflowEdge.objects.all()
    serializer_class = WorkflowEdgeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        from django.db.models import Q
        return self.queryset.filter(
            Q(workflow__organization__isnull=True) |
            Q(workflow__organization__memberships__user=self.request.user)
        ).distinct()

class WorkflowVersionViewSet(viewsets.ModelViewSet):
    queryset = WorkflowVersion.objects.all()
    serializer_class = WorkflowVersionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.queryset.filter(workflow__organization__memberships__user=self.request.user)

    @action(detail=True, methods=['post'])
    def compile(self, request, pk=None):
        version = self.get_object()
        service = WorkflowCompilationService()
        compiled = service.compile_workflow(version, user=request.user)
        if compiled.is_valid:
            return Response({'status': 'compiled', 'id': compiled.id}, status=status.HTTP_201_CREATED)
        return Response({'status': 'failed', 'errors': compiled.validation_errors}, status=status.HTTP_400_BAD_REQUEST)

class WorkflowRunViewSet(viewsets.ModelViewSet):
    queryset = WorkflowRun.objects.all()
    serializer_class = WorkflowRunSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.queryset.filter(workflow__organization__memberships__user=self.request.user)

    @action(detail=False, methods=['post'])
    def execute(self, request):
        workflow_id = request.data.get('workflow_id')
        input_payload = request.data.get('input_payload', {})
        idempotency_key = request.data.get('idempotency_key')
        
        if idempotency_key:
            existing_run = WorkflowRun.objects.filter(workflow_id=workflow_id, idempotency_key=idempotency_key).first()
            if existing_run:
                return Response(self.get_serializer(existing_run).data)

        try:
            workflow = Workflow.objects.get(id=workflow_id)
            latest_version = workflow.versions.first()
            if not latest_version:
                return Response({'error': 'No versions found'}, status=status.HTTP_400_BAD_REQUEST)
            
            compiled = latest_version.compilations.filter(is_valid=True).first()
            if not compiled:
                return Response({'error': 'No valid compilation found'}, status=status.HTTP_400_BAD_REQUEST)

            run = WorkflowRun.objects.create(
                workflow=workflow,
                compiled_workflow=compiled,
                input_payload=input_payload,
                idempotency_key=idempotency_key,
                triggered_by=request.user,
                status='pending'
            )

            queue_workflow_run(run.id)
            return Response(self.get_serializer(run).data, status=status.HTTP_201_CREATED)
            
        except Workflow.DoesNotExist:
            return Response({'error': 'Workflow not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
