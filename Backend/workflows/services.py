import json
import hashlib
import uuid
import socket
from django.db import connection, transaction
from django.utils import timezone
from .models import WorkflowVersion, CompiledWorkflow, WorkflowRun, NodeExecution, WorkflowRunLog
from .output_storage import OutputStorageService

class WorkflowCompilationService:
    def compile_workflow(self, workflow_version: WorkflowVersion, user=None):
        """Compile workflow version into executable format"""
        dag_definition = self._build_dag(workflow_version)
        validation_errors = self._validate_dag(dag_definition)
        
        if validation_errors:
            print(f"[COMPILATION FAILED] Workflow {workflow_version.workflow.id} has errors: {validation_errors}")
            return CompiledWorkflow.objects.create(
                workflow_version=workflow_version,
                dag_definition=dag_definition,
                langgraph_spec={},
                checksum="",
                is_valid=False,
                validation_errors=validation_errors,
                compiled_by=user
            )
        
        from django.core.serializers.json import DjangoJSONEncoder
        langgraph_spec = self._build_langgraph_spec(dag_definition)
        checksum = hashlib.sha256(json.dumps(dag_definition, sort_keys=True, cls=DjangoJSONEncoder).encode()).hexdigest()
        
        return CompiledWorkflow.objects.create(
            workflow_version=workflow_version,
            dag_definition=dag_definition,
            langgraph_spec=langgraph_spec,
            checksum=checksum,
            is_valid=True,
            compiled_by=user
        )
    
    def _build_dag(self, workflow_version):
        nodes = workflow_version.nodes_snapshot
        edges = workflow_version.edges_snapshot
        
        print(f"--- Building DAG for Version v{workflow_version.version_number} ---")
        print(f"Nodes in snapshot: {len(nodes)}")
        print(f"Edges in snapshot: {len(edges)}")

        # Create a mapping from node DB ID to langgraph_id (stable ID for orchestration)
        id_map = {str(node['id']): str(node['langgraph_id']) for node in nodes}
        
        dag_nodes = [{'id': str(node['langgraph_id']), 'type': node['node_type'], 'config': node['config']} for node in nodes]
        dag_edges = []
        
        for edge in edges:
            source_db_id = str(edge.get('source_node_id'))
            target_db_id = str(edge.get('target_node_id'))
            
            from_id = id_map.get(source_db_id)
            to_id = id_map.get(target_db_id)
            
            if from_id and to_id:
                dag_edges.append({'from': from_id, 'to': to_id})
            else:
                print(f"  [!] Skipping edge: source={source_db_id} (found={bool(from_id)}), target={target_db_id} (found={bool(to_id)})")

        return {
            'nodes': dag_nodes,
            'edges': dag_edges
        }
    
    def _validate_dag(self, dag_definition):
        errors = []
        print(f"--- Validating DAG ---")
        print(f"Nodes: {[n['id'] for n in dag_definition['nodes']]}")
        print(f"Edges: {dag_definition['edges']}")

        if self._has_cycles(dag_definition):
            errors.append("DAG contains cycles")
            
        node_ids = {n['id'] for n in dag_definition['nodes']}
        for edge in dag_definition['edges']:
            if not edge.get('from') or edge['from'] not in node_ids:
                errors.append(f"Edge references invalid source node: {edge.get('from')}")
            if not edge.get('to') or edge['to'] not in node_ids:
                errors.append(f"Edge references invalid target node: {edge.get('to')}")
        
        if errors:
            print(f"  [!] Validation Errors: {errors}")
            
        return errors

    def _has_cycles(self, dag_definition):
        adj = {n['id']: [] for n in dag_definition['nodes']}
        for edge in dag_definition['edges']:
            if edge['from'] in adj: adj[edge['from']].append(edge['to'])
        visited = set(); path = set()
        def visit(node_id):
            if node_id in path: return True
            if node_id in visited: return False
            visited.add(node_id); path.add(node_id)
            for neighbor in adj.get(node_id, []):
                if visit(neighbor): return True
            path.remove(node_id); return False
        for node in dag_definition['nodes']:
            if visit(node['id']): return True
        return False
    
    def _build_langgraph_spec(self, dag_definition):
        return {
            'state_schema': {},
            'nodes': dag_definition['nodes'],
            'edges': dag_definition['edges'],
            'entry_point': self._find_entry_node(dag_definition),
            'end_nodes': self._find_end_nodes(dag_definition)
        }

    def _find_entry_node(self, dag_definition):
        all_nodes = {n['id'] for n in dag_definition['nodes']}
        nodes_with_inbound = {e['to'] for e in dag_definition['edges']}
        entries = list(all_nodes - nodes_with_inbound)
        return entries[0] if entries else None

    def _find_end_nodes(self, dag_definition):
        all_nodes = {n['id'] for n in dag_definition['nodes']}
        nodes_with_outbound = {e['from'] for e in dag_definition['edges']}
        return list(all_nodes - nodes_with_outbound)

class WorkflowExecutionService:
    def execute_workflow_run(self, workflow_run_id):
        workflow_run = WorkflowRun.objects.get(id=workflow_run_id)
        if not self._acquire_lock(workflow_run):
            return
        
        try:
            print(f"\n[WORKFLOW START] Running Run ID: {workflow_run.id}")
            workflow_run.status = 'running'
            workflow_run.started_at = timezone.now()
            workflow_run.save()
            
            WorkflowRunLog.objects.create(workflow_run=workflow_run, level='info', message=f"Starting workflow execution for {workflow_run.workflow.name}")

            dag = workflow_run.compiled_workflow.dag_definition
            # Use execution_context as the "State Checkpoint"
            state = workflow_run.execution_context or {}
            if not state:
                state = workflow_run.input_payload.copy()
            
            state['workflow_run_id'] = str(workflow_run.id)
            
            # Map langgraph_id to the current live database ID of the node
            # This is critical because NodeExecution.node is a ForeignKey that needs the DB PK,
            # but orchestration uses langgraph_id.
            live_nodes = {str(n.langgraph_id): str(n.id) for n in workflow_run.workflow.nodes.all()}
            
            # Execute nodes based on DAG
            for node_def in dag['nodes']:
                # Resolve the actual Database Primary Key for this node.
                # NodeExecution and WorkflowRun.current_node are ForeignKeys that require the DB PK (UUID).
                db_node_id = live_nodes.get(str(node_def['id']))
                
                if not db_node_id:
                    print(f"  [!] WARNING: Node {node_def['id']} not found in live cache. Searching DB...")
                    node_obj = workflow_run.workflow.nodes.filter(langgraph_id=node_def['id']).first()
                    if node_obj:
                        db_node_id = str(node_obj.id)
                        live_nodes[str(node_def['id'])] = db_node_id
                    else:
                        print(f"  [!] ERROR: Could not resolve DB ID for node {node_def['id']}. Proceeding with None.")
                        db_node_id = None

                # LangGraph Logic: Check if node already has a successful result in this run
                existing_execution = None
                if db_node_id:
                    existing_execution = NodeExecution.objects.filter(
                        workflow_run=workflow_run,
                        node_id=db_node_id,
                        status='success'
                    ).first()
                
                if existing_execution:
                    # SKIP: Load output from previous checkpoint
                    storage = OutputStorageService()
                    node_output = storage.get_output(existing_execution)
                    state.update(node_output if isinstance(node_output, dict) else {node_def['id']: node_output})
                    continue
                
                # Execute Node
                executor = self._get_node_executor(node_def['type'])
                result = executor.execute(node_def, state, db_node_id=db_node_id, dag=dag)
                
                # Assign output to state (Automatic State Update)
                # 1. Store under node ID for direct binding (Preserve)
                state[node_def['id']] = result
                
                # 2. Merge into root for DSL/Transform access (Flatten)
                if isinstance(result, dict):
                    state.update(result)
                
                # Save checkpoint after every node
                workflow_run.execution_context = state
                # Only set the FK if we have a valid DB ID, otherwise set to None (SET_NULL)
                workflow_run.current_node_id = db_node_id if db_node_id else None
                workflow_run.save()
                print(f"--- Node '{node_def['id']}' completed successfully.")
            
            print(f"[WORKFLOW SUCCESS] Run ID: {workflow_run.id} finished.")
            WorkflowRunLog.objects.create(workflow_run=workflow_run, level='info', message="Workflow completed successfully.")
            workflow_run.output_payload = state
            workflow_run.status = 'success'
            workflow_run.ended_at = timezone.now()
            workflow_run.save()
        except Exception as e:
            print(f"[WORKFLOW FAILED] Run ID: {workflow_run.id} Error: {str(e)}")
            WorkflowRunLog.objects.create(workflow_run=workflow_run, level='error', message=f"Workflow failed: {str(e)}")
            workflow_run.status = 'failed'
            workflow_run.error_message = str(e)
            workflow_run.ended_at = timezone.now()
            workflow_run.save()
            raise e
        finally:
            self._release_lock(workflow_run)

    def _acquire_lock(self, workflow_run):
        # Only use advisory locks if on PostgreSQL
        if connection.vendor != 'postgresql':
            return True

        lock_id = int(str(workflow_run.id).replace('-', '')[:15], 16) % (2**31)
        with connection.cursor() as cursor:
            cursor.execute("SELECT pg_try_advisory_lock(%s)", [lock_id])
            acquired = cursor.fetchone()[0]
            if acquired:
                workflow_run.lock_acquired_at = timezone.now()
                workflow_run.locked_by_worker = socket.gethostname()
                workflow_run.save()
                return True
            return False

    def _release_lock(self, workflow_run):
        if connection.vendor != 'postgresql':
            return

        lock_id = int(str(workflow_run.id).replace('-', '')[:15], 16) % (2**31)
        with connection.cursor() as cursor:
            cursor.execute("SELECT pg_advisory_unlock(%s)", [lock_id])
        workflow_run.lock_acquired_at = None
        workflow_run.locked_by_worker = None
        workflow_run.save()

    def _get_node_executor(self, node_type):
        executors = {
            'datasource': DataSourceNodeExecutor(),
            'transform': TransformNodeExecutor(),
            'agent': AgentNodeExecutor(),
            'tool': ToolNodeExecutor(),
            'memory': MemoryNodeExecutor(),
        }
        return executors.get(node_type, BaseNodeExecutor())

class BaseNodeExecutor:
    def execute(self, node_def, state, db_node_id=None, dag=None):
        # Only create NodeExecution if we have a valid node link to avoid IntegrityError
        if not db_node_id:
             print(f"  [!] ERROR: Cannot create NodeExecution for {node_def['id']} - missing DB node ID.")
             return self._do_execute(node_def, state, dag=dag)

        node_execution = NodeExecution.objects.create(
            workflow_run_id=state['workflow_run_id'],
            node_id=db_node_id,
            status='running',
            input_inline=state,
            started_at=timezone.now()
        )
        print(f"  > Executing Node: {node_def['id']} ({node_def['type']})...")
        try:
            result = self._do_execute(node_def, state, dag=dag)
            storage = OutputStorageService()
            storage.store_output(node_execution, result)
            node_execution.status = 'success'
            node_execution.ended_at = timezone.now()
            node_execution.save()
            return result
        except Exception as e:
            node_execution.status = 'failed'
            node_execution.error_message = str(e)
            node_execution.ended_at = timezone.now()
            node_execution.save()
            raise e
    def _do_execute(self, node_def, state, dag=None): return state

class DataSourceNodeExecutor(BaseNodeExecutor):
    def _do_execute(self, node_def, state, dag=None):
        from datasources.models import DataSource, DynamicTable
        
        config = node_def.get('config', {})
        resource_id = config.get('resource_id') or config.get('resourceId') or config.get('dynamic_table_id')
        
        print(f"    [DS] resource_id={resource_id}, config keys={list(config.keys())}")
        
        if not resource_id:
            return {"error": "No data source configured", "raw_data": []}
        
        # Try as DynamicTable first
        dt = DynamicTable.objects.filter(id=resource_id).first()
        
        if not dt:
            # Try as DataSource -> find its first table
            ds = DataSource.objects.filter(id=resource_id).first()
            if ds:
                dt = ds.tables.first()
                print(f"    [DS] Resolved DataSource '{ds.name}' -> DynamicTable '{dt.name if dt else 'NONE'}'")
        
        if dt:
            from datasources.services import DynamicTableService
            service = DynamicTableService()
            # Default to 10000 rows for workflow processing; configurable via node config
            data = service.fetch_rows(dt, limit=config.get('limit', 10000))
            print(f"    [DS] Fetched {len(data) if isinstance(data, list) else '?'} rows from table '{dt.name}'")
            return {"raw_data": data, "source_table": str(dt.id), "source_name": dt.name}
        
        return {"error": f"No table found for resource_id={resource_id}", "raw_data": []}

class TransformNodeExecutor(BaseNodeExecutor):
    def _do_execute(self, node_def, state, dag=None):
        import importlib
        import pandas as pd
        from transforms.models import TransformDefinition
        from datasources.models import DynamicTable
        from datasources.services import DynamicTableService
        
        config = node_def.get('config', {})
        resource_id = config.get('resource_id') or config.get('resourceId')
        algo_parameters = config.get('algo_parameters', {})
        
        print(f"    [Transform] resource_id={resource_id}, algo_parameters={algo_parameters}")
        
        # 1. Load the TransformDefinition
        if not resource_id:
            return {"error": "No transform configured", "transformed_data": []}
        
        try:
            transform_def = TransformDefinition.objects.get(id=resource_id)
        except TransformDefinition.DoesNotExist:
            return {"error": f"Transform definition '{resource_id}' not found", "transformed_data": []}
        
        if not transform_def.python_path:
            return {"error": "Transform has no python_path configured", "transformed_data": []}
        
        # 2. Load the transform class
        try:
            module_name, class_name = transform_def.python_path.rsplit('.', 1)
            module = importlib.import_module(module_name)
            transform_class = getattr(module, class_name)
            transform_instance = transform_class()
        except Exception as e:
            return {"error": f"Failed to load transform class: {e}", "transformed_data": []}
        
        # 3. Build input DataFrames
        # Some transforms (like Smart Cube) expect multiple inputs matching specific Table IDs
        # Others (Filter, Calculate) use a single source_table field
        input_tables = algo_parameters.get('input_tables') or algo_parameters.get('_input_table_ids') or algo_parameters.get('source_table')
        
        # Ensure we are working with a list of IDs
        if input_tables and not isinstance(input_tables, list):
            input_tables = [input_tables]
            
        input_dfs = []
        
        if input_tables:
            # Try to find DataFrames for each requested table in the entire workflow state
            for tid in input_tables:
                found = False
                # Search all node outputs in the state in REVERSE order (newest nodes first)
                # This ensures we pick up the output of upstream transforms (like Calculated Columns)
                # rather than the original raw DataSource if both are in the graph.
                state_keys = list(state.keys())
                state_keys.reverse()
                
                for key in state_keys:
                    output = state[key]
                    # Check if the state key matches the requested ID (Direct Node reference)
                    # or if the source_table metadata matches (Logical Table reference)
                    is_match = (key == str(tid))
                    if not is_match and isinstance(output, dict):
                        is_match = (str(output.get('source_table')) == str(tid))

                    if is_match:
                        df_data = None
                        if isinstance(output, dict):
                            df_data = output.get('raw_data') or output.get('transformed_data')
                        elif isinstance(output, list):
                            df_data = output
                            
                        if df_data is not None:
                            input_dfs.append(pd.DataFrame(df_data))
                            found = True
                            print(f"    [Transform] Found data for table {tid} in state (node_id: {key})")
                            break
                
                if not found:
                    # Fallback: try to load from the DB directly
                    try:
                        from datasources.models import DynamicTable
                        from datasources.services import DynamicTableService
                        dt = DynamicTable.objects.get(id=tid)
                        dt_service = DynamicTableService()
                        rows = dt_service.fetch_rows(dt, limit=10000)
                        input_dfs.append(pd.DataFrame(rows))
                        print(f"    [Transform] Loaded input table {tid} ('{dt.name}') directly from DB")
                        found = True
                    except Exception as e:
                        print(f"    [Transform] Could not resolve input table {tid}: {e}")
        
        # Legacy Fallback: if no specific tables found, use any available raw_data from state
        if not input_dfs:
            raw_data = state.get('raw_data', [])
            if not raw_data:
                # Search state for any list data from upstream nodes
                for key, value in state.items():
                    if key in ('workflow_run_id',): continue
                    if isinstance(value, list) and len(value) > 0:
                        raw_data = value
                        break
                    if isinstance(value, dict) and 'raw_data' in value:
                        raw_data = value['raw_data']
                        break
            
            if raw_data:
                input_dfs.append(pd.DataFrame(raw_data))
                print(f"    [Transform] Falling back to generic input data ({len(raw_data)} rows)")
        
        if not input_dfs:
            return {"error": "No input data for transform", "transformed_data": []}
        
        # 4. Execute the real transform with configured parameters
        try:
            result_df = transform_instance.execute(input_dfs, algo_parameters)
            # Increased limit to 10000 to support larger datasets
            data = result_df.head(10000).to_dict(orient='records')
            
            columns = []
            for col_name, dtype in result_df.dtypes.items():
                columns.append({"name": str(col_name), "type": str(dtype)})
            
            print(f"    [Transform] SUCCESS: {len(data)} result rows (of {len(result_df)} total), columns={[c['name'] for c in columns]}")
            
            result_payload = {
                "transformed_data": data, 
                "columns": columns, 
                "row_count": len(data)
            }
            
            # Pass through source table ID so downstream nodes know this data replaces the raw table
            source_id = config.get('source_table') or config.get('source_table_id')
            if source_id:
                result_payload['source_table'] = str(source_id)
                
            return result_payload
        except Exception as e:
            print(f"    [Transform] Execution failed: {e}")
            import traceback
            traceback.print_exc()
            return {"error": f"Transform execution failed: {str(e)}", "transformed_data": []}

class AgentNodeExecutor(BaseNodeExecutor):
    def _do_execute(self, node_def, state, dag=None):
        from agents.models import AgentDefinition
        from agents.llm_service import invoke_agent_chat, log_agent_call
        
        config = node_def.get('config', {})
        resource_id = config.get('resource_id') or config.get('resourceId') or config.get('agent_id')
        
        print(f"    [Agent] resource_id={resource_id}")
        
        # 1. Resolve the AgentDefinition
        if not resource_id:
            return {"error": "No agent configured", "agent_response": ""}
        
        try:
            agent = AgentDefinition.objects.get(id=resource_id)
        except AgentDefinition.DoesNotExist:
            return {"error": f"Agent '{resource_id}' not found", "agent_response": ""}
        
        # 2. Gather context data from UPSTREAM nodes based on dag edges
        # Format: list of {_source, _is_aggregated, data} for llm_service discovery
        context_data = []
        node_id = node_def['id']
        incoming_sources = [e['from'] for e in dag['edges'] if e['to'] == node_id] if dag else []
        
        if incoming_sources:
            print(f"    [Agent] Resolving context from {len(incoming_sources)} upstream nodes: {incoming_sources}")
            for src_id in incoming_sources:
                node_res = state.get(src_id)
                if node_res:
                    # Extract the actual data list
                    data_list = None
                    if isinstance(node_res, dict):
                        data_list = node_res.get('transformed_data') or node_res.get('raw_data')
                    elif isinstance(node_res, list):
                        data_list = node_res
                    
                    if data_list:
                        # Find source node definition to get metadata
                        src_node_def = next((n for n in dag.get('nodes', []) if n['id'] == src_id), None) if dag else None
                        src_name = "Unknown"
                        is_agg = False
                        
                        if src_node_def:
                            src_config = src_node_def.get('data', {}).get('config', {})
                            src_name = src_config.get('name') or src_config.get('label') or src_node_def.get('type', 'Unknown')
                            
                            # Detect if aggregated
                            if src_node_def.get('type') == 'transform':
                                t_key = src_config.get('transformKey') or src_config.get('key')
                                if t_key in ('agg.smart_cube', 'agg.aggregate', 'aggregate', 'smart_cube'):
                                    is_agg = True
                                elif any(word in src_name.lower() for word in ['aggregate', 'cube', 'summary', 'grouped']):
                                    is_agg = True
                        
                        # Wrap data with metadata for llm_service discovery
                        context_data.append({
                            "_source": src_name,
                            "_node_type": src_node_def.get('type', 'unknown') if src_node_def else 'unknown',
                            "_is_aggregated": is_agg,
                            "data": data_list if isinstance(data_list, list) else []
                        })
        
        # Fallback to legacy context if no edges found (though there should be)
        if not context_data:
            print(f"    [Agent] No explicit source nodes found via edges. Falling back to global state.")
            fallback_data = state.get('transformed_data') or state.get('raw_data') or []
            fallback_name = "Legacy Data"
            fallback_is_agg = False
            
            if not fallback_data:
                for key, value in state.items():
                    if key in ('workflow_run_id',): continue
                    if isinstance(value, list) and len(value) > 0:
                        fallback_data = value
                        fallback_name = key
                        # Heuristic: check if key suggests aggregation
                        if any(word in key.lower() for word in ['aggregate', 'cube', 'summary', 'grouped', 'transform']):
                            fallback_is_agg = True
                        break
            
            if fallback_data:
                context_data = [{
                    "_source": fallback_name,
                    "_node_type": "unknown",
                    "_is_aggregated": fallback_is_agg,
                    "data": fallback_data if isinstance(fallback_data, list) else []
                }]
        
        # 3. Build a message from the agent's system prompt context
        agent_message = config.get('message', '') or config.get('prompt', '') or "Analyze the provided data and generate insights."
        
        print(f"    [Agent] Calling LLM for agent '{agent.name}' with {len(context_data) if isinstance(context_data, list) else '?'} context items")
        
        # 4. Call the real LLM
        result = invoke_agent_chat(agent, agent_message, context_data=context_data)
        
        # 5. Log for cost tracking
        log_agent_call(agent, agent_message, result)
        
        print(f"    [Agent] LLM responded in {result.get('latency_ms', '?')}ms, tokens={result.get('tokens_total', '?')}")
        
        return {
            "agent_response": result.get('content', ''),
            "tokens_used": result.get('tokens_total', 0),
            "latency_ms": result.get('latency_ms', 0),
            "model": result.get('model', 'unknown'),
        }

class ToolNodeExecutor(BaseNodeExecutor):
    def _do_execute(self, node_def, state):
        return {"tool_output": "Tool execution result"}

class MemoryNodeExecutor(BaseNodeExecutor):
    def _do_execute(self, node_def, state):
        return {"memory_status": "saved"}
