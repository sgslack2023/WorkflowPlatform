"""
Real LLM integration service using LangChain.
Resolves AgentDefinition → LLMProvider → API Key → LangChain ChatModel
"""
import time
import json
from django.utils import timezone


def get_api_key(agent_definition):
    """Resolve the API key from the agent's LLM provider."""
    provider = agent_definition.llm_provider
    if not provider:
        return None, "No LLM provider configured for this agent."

    # 1. Try EncryptedSecret FK
    if provider.api_key_secret:
        try:
            return provider.api_key_secret.secret_value, None
        except Exception:
            pass

    # 2. Try provider config JSON
    api_key = provider.config.get('api_key') or provider.config.get('apiKey')
    if api_key:
        return api_key, None

    return None, f"No API key found for provider '{provider.name}'. Add one in the LLM Provider settings."


def build_chat_model(agent_definition):
    """
    Build a LangChain ChatModel from the AgentDefinition.
    Returns (chat_model, error_string).
    """
    provider = agent_definition.llm_provider
    if not provider:
        return None, "No LLM provider linked to this agent."

    api_key, err = get_api_key(agent_definition)
    if not api_key:
        return None, err

    provider_type = provider.provider_type  # 'openai', 'anthropic', 'azure', 'local'
    model_name = provider.config.get('model') or provider.config.get('model_name', 'gpt-4o-mini')

    # Agent config overrides
    agent_config = agent_definition.agent_config
    temperature = agent_config.temperature if agent_config else 0.7
    max_tokens = agent_config.max_tokens if agent_config else 1000

    try:
        if provider_type == 'openai':
            from langchain_openai import ChatOpenAI
            llm = ChatOpenAI(
                model=model_name,
                api_key=api_key,
                temperature=temperature,
                max_tokens=max_tokens,
            )
            return llm, None

        elif provider_type == 'anthropic':
            from langchain_anthropic import ChatAnthropic
            llm = ChatAnthropic(
                model=model_name or 'claude-3-5-sonnet-20241022',
                api_key=api_key,
                temperature=temperature,
                max_tokens=max_tokens,
            )
            return llm, None

        elif provider_type == 'azure':
            from langchain_openai import AzureChatOpenAI
            llm = AzureChatOpenAI(
                azure_deployment=provider.config.get('deployment_name', model_name),
                azure_endpoint=provider.config.get('endpoint', ''),
                api_key=api_key,
                api_version=provider.config.get('api_version', '2024-02-01'),
                temperature=temperature,
                max_tokens=max_tokens,
            )
            return llm, None

        elif provider_type == 'local':
            from langchain_openai import ChatOpenAI
            base_url = provider.config.get('base_url', 'http://localhost:11434/v1')
            llm = ChatOpenAI(
                model=model_name or 'llama3',
                api_key=api_key or 'not-needed',
                base_url=base_url,
                temperature=temperature,
                max_tokens=max_tokens,
            )
            return llm, None

        else:
            return None, f"Unsupported provider type: {provider_type}"

    except ImportError as e:
        return None, f"Missing LangChain package for {provider_type}: {e}. Install with: pip install langchain-{provider_type}"
    except Exception as e:
        return None, f"Failed to initialize LLM: {e}"


def execute_text_to_sql(llm, table_name, table_id, columns, user_question, sample_data):
    """
    Generate SQL from user question, execute it, and return results.
    Uses Text-to-SQL approach for large raw data tables.
    """
    from langchain_core.messages import SystemMessage, HumanMessage
    from django.db import connections
    
    # Get the physical table name and database connection
    physical_table = None
    schema_info = None
    db_alias = 'data_warehouse'  # DynamicTables use this database
    
    # Check if data_warehouse exists, fallback to default if not
    if db_alias not in connections:
        print(f"    [Text2SQL] '{db_alias}' database not configured, using 'default'")
        db_alias = 'default'
    
    try:
        from datasources.models import DynamicTable
        dt = DynamicTable.objects.filter(id=table_id).first()
        if dt:
            physical_table = dt.physical_table_name
            schema_info = dt.schema_definition  # Get column types from schema
            print(f"    [Text2SQL] Resolved table_id={table_id} -> physical_table={physical_table}")
        else:
            print(f"    [Text2SQL] No DynamicTable found with id={table_id}")
    except Exception as e:
        print(f"    [Text2SQL] Could not resolve physical table: {e}")
    
    if not physical_table:
        return None, f"Could not find the physical database table for table_id={table_id}"
    
    # Determine SQL dialect based on database
    try:
        db_vendor = connections[db_alias].vendor
        sql_dialect = "PostgreSQL" if db_vendor == 'postgresql' else "SQLite"
    except:
        sql_dialect = "SQLite"
    
    # Build detailed column info with types from schema
    column_details = []
    if schema_info and 'columns' in schema_info:
        for col in schema_info['columns']:
            col_name = col.get('name', 'unknown')
            col_type = col.get('type', 'text')
            column_details.append(f'"{col_name}" ({col_type})')
    else:
        # Fallback to just column names
        column_details = [f'"{c}"' for c in columns] if columns else ["unknown columns"]
    
    column_info = ", ".join(column_details)
    sample_str = json.dumps(sample_data[:3], default=str) if sample_data else "[]"
    
    # SQL Generation Prompt with type awareness
    sql_prompt = f"""You are a SQL expert. Generate a SIMPLE SQL query to answer the user's question.

TABLE: {physical_table}
COLUMNS (with types): {column_info}
SAMPLE DATA: {sample_str}
SQL DIALECT: {sql_dialect}

CRITICAL TYPE HANDLING RULES:
- Many columns are stored as TEXT even if they contain numbers or dates
- For numeric operations (SUM, AVG, MIN, MAX) on TEXT columns, use CAST:
  - PostgreSQL: SUM(CAST("column" AS NUMERIC)) or SUM("column"::NUMERIC)
  - SQLite: SUM(CAST("column" AS REAL))

KEEP IT SIMPLE - AVOID:
- NO nested aggregate functions (e.g., AVG(SUM(...)) is INVALID)
- NO window functions (OVER, PARTITION BY, percentile_cont, etc.)
- NO CTEs (WITH clauses)
- NO subqueries in SELECT
- If asked for percentiles/medians, use simple ORDER BY with LIMIT instead

VALID PATTERNS:
- Simple SELECT with WHERE and LIMIT
- GROUP BY with one level of aggregation (SUM, COUNT, AVG, MIN, MAX)
- ORDER BY for sorting results

EXAMPLE - To find top 3 products by sales:
SELECT "product", SUM(CAST("amount" AS NUMERIC)) AS total
FROM table_name
WHERE "date" >= '2025-01-01'
GROUP BY "product"
ORDER BY total DESC
LIMIT 3;

OTHER RULES:
1. Use ONLY the columns listed above (exact names, case-sensitive)
2. Always include LIMIT (max 100 rows)
3. Return ONLY the SQL query - no explanation, no markdown
4. Quote column names with double quotes

USER QUESTION: {user_question}

SQL QUERY:"""

    try:
        # Generate SQL
        sql_response = llm.invoke([
            SystemMessage(content="You are a SQL query generator. Output only valid SQL, nothing else."),
            HumanMessage(content=sql_prompt)
        ])
        
        generated_sql = sql_response.content.strip()
        
        # Clean up the SQL (remove markdown code blocks if present)
        if generated_sql.startswith("```"):
            lines = generated_sql.split("```")
            if len(lines) > 1:
                generated_sql = lines[1]
                if generated_sql.lower().startswith("sql"):
                    generated_sql = generated_sql[3:]
        generated_sql = generated_sql.strip().rstrip(";") + ";"
        
        # Security: Basic SQL injection prevention
        sql_lower = generated_sql.lower()
        dangerous_keywords = ['drop', 'delete', 'update', 'insert', 'alter', 'create', 'truncate', 'exec']
        for keyword in dangerous_keywords:
            import re
            # Check for standalone dangerous keywords (not part of column names)
            if re.search(rf'^\s*{keyword}\s+', sql_lower) or re.search(rf';\s*{keyword}\s+', sql_lower):
                return None, f"SQL query rejected for safety: contains '{keyword}' command"
        
        # Ensure it's a SELECT query
        if not sql_lower.strip().startswith('select'):
            return None, "Only SELECT queries are allowed"
        
        # Ensure LIMIT is present
        if 'limit' not in sql_lower:
            generated_sql = generated_sql.rstrip(';') + ' LIMIT 100;'
        
        print(f"    [Text2SQL] Generated SQL: {generated_sql}")
        print(f"    [Text2SQL] Using database: {db_alias}")
        
        # Execute the SQL on the data_warehouse database
        try:
            with connections[db_alias].cursor() as cursor:
                cursor.execute(generated_sql)
                columns_result = [col[0] for col in cursor.description]
                rows = cursor.fetchall()
                results = [dict(zip(columns_result, row)) for row in rows]
            
            print(f"    [Text2SQL] Query returned {len(results)} rows")
            return results, generated_sql
        except Exception as db_error:
            print(f"    [Text2SQL] Database error on '{db_alias}': {db_error}")
            # If data_warehouse fails, try default database as fallback
            if db_alias != 'default':
                print(f"    [Text2SQL] Retrying on 'default' database...")
                try:
                    with connections['default'].cursor() as cursor:
                        cursor.execute(generated_sql)
                        columns_result = [col[0] for col in cursor.description]
                        rows = cursor.fetchall()
                        results = [dict(zip(columns_result, row)) for row in rows]
                    print(f"    [Text2SQL] Query returned {len(results)} rows (from default db)")
                    return results, generated_sql
                except Exception as fallback_error:
                    print(f"    [Text2SQL] Fallback also failed: {fallback_error}")
            raise db_error
        
    except Exception as e:
        print(f"    [Text2SQL] Error: {e}")
        return None, str(e)


def invoke_agent_chat(agent_definition, user_message, context_data=None, chat_history=None):
    """
    Send a message to the agent's LLM with context data.
    Returns dict with 'content', 'tokens_used', 'latency_ms', etc.
    
    For large raw data tables, uses Text-to-SQL to avoid context length issues.
    """
    from langchain_core.messages import SystemMessage, HumanMessage, AIMessage

    llm, err = build_chat_model(agent_definition)
    if not llm:
        return {"error": err, "content": f"⚠️ {err}"}

    # Build messages
    messages = []

    # System prompt from AgentConfig
    system_prompt = "You are a helpful AI assistant."
    if agent_definition.agent_config and agent_definition.agent_config.system_prompt:
        system_prompt = agent_definition.agent_config.system_prompt

    # --- PHASE 1: DISCOVERY (Send Table Directory) ---
    # Build a lookup for table metadata (for Text-to-SQL)
    table_metadata = {}
    
    discovery_context = "\n### AVAILABLE TABLES DIRECTORY\n"
    if context_data and isinstance(context_data, list):
        for item in context_data:
            if not isinstance(item, dict): continue
            
            source_name = item.get('_source', 'Unknown Table')
            is_agg = item.get('_is_aggregated', False)
            data = item.get('data', [])
            table_id = item.get('_table_id')  # For Text-to-SQL
            row_count = len(data) if isinstance(data, list) else 0
            
            # Store metadata for later use
            table_metadata[source_name] = {
                'is_aggregated': is_agg,
                'data': data,
                'table_id': table_id,
                'row_count': row_count,
                'columns': list(data[0].keys()) if data and len(data) > 0 else []
            }
            
            # Format as a distinct section for the LLM discovery
            discovery_context += f"#### TABLE NAME: `{source_name}`\n"
            discovery_context += f"- Category: {'Aggregated Results (High Priority)' if is_agg else 'Detailed Raw Data'}\n"
            discovery_context += f"- Row Count: {row_count}\n"
            
            if isinstance(data, list) and len(data) > 0:
                discovery_context += f"- Columns: {list(data[0].keys())}\n"
                discovery_context += f"- Sample (Top 5): {json.dumps(data[:5], default=str)}\n\n"
            else:
                discovery_context += "- [No data or empty table]\n\n"

    discovery_instruction = (
        "\n\n### DATA ACCESS RULES (STRICT):\n"
        "1. Identify the best source from the 'AVAILABLE TABLES DIRECTORY'.\n"
        "2. **CRITICAL: NO MANUAL CALCULATION**: If a table is labeled 'Aggregated Results', you MUST use it for performance, totals, or trends. "
        "DO NOT pull 'Detailed Raw Data' to calculate totals manually if an 'Aggregated Results' table already covers those metrics.\n"
        "3. **PULL PROTOCOL**: To analyze a table, you MUST reply ONLY with: 'PULL_DATA: [Exact TABLE NAME]'.\n"
        "   - Use the EXACT string provided in the backticks after 'TABLE NAME:'.\n"
        "4. **WHEN TO USE RAW DATA**: Only pull 'Detailed Raw Data' if the user asks for a specific transaction ID, a timestamp, or a detail NOT present in the aggregates.\n"
        "5. For large raw data tables (>500 rows), a SQL query will be generated automatically to fetch only relevant data."
    )
    
    # 1. First Call: Discovery
    messages = [
        SystemMessage(content=system_prompt + discovery_instruction + discovery_context)
    ]
    if chat_history:
        for msg in chat_history[-5:]: # Last 5 for discovery to save tokens
            msg_class = HumanMessage if msg.get('role') == 'user' else AIMessage
            messages.append(msg_class(content=msg['content']))
    
    messages.append(HumanMessage(content=user_message))
    
    start_time = time.time()
    try:
        response = llm.invoke(messages)
        content = response.content.strip()
        
        # --- PHASE 2: RESILIENT PULL & ANSWER ---
        if "PULL_DATA:" in content:
            # Extract requested table name
            pull_command = content.split("PULL_DATA:")[-1].strip()
            requested_table = pull_command.split("\n")[0].strip().strip('[]"\'*` ')
            
            print(f"    [Agent] Requested data pull for: '{requested_table}'")
            
            matched_item = None
            actual_name = ""
            
            # 1. Try semantic match (resilient)
            for item in (context_data or []):
                name = item.get('_source', '') if isinstance(item, dict) else ""
                
                # Resilient Match: Exact, Substring, or Cleaned
                req_clean = requested_table.lower().replace("aggregated results", "").strip()
                name_clean = name.lower()
                
                if requested_table.lower() == name.lower() or \
                   (len(req_clean) > 3 and req_clean in name_clean) or \
                   (len(name_clean) > 3 and name_clean in req_clean):
                    matched_item = item
                    actual_name = name
                    break
            
            # 2. Last Resort: If they asked for 'Aggregated Results' generally, give them the first one
            if not matched_item and "aggregated" in requested_table.lower():
                for item in (context_data or []):
                    if item.get('_is_aggregated'):
                        matched_item = item
                        actual_name = item.get('_source')
                        break
            
            if matched_item:
                is_aggregated = matched_item.get('_is_aggregated', False)
                data = matched_item.get('data', [])
                row_count = len(data) if isinstance(data, list) else 0
                table_id = matched_item.get('_table_id')
                
                print(f"    [Agent] SUCCESS: Found '{actual_name}' ({row_count} rows, aggregated={is_aggregated})")
                
                # Decision: Use Text-to-SQL for large raw data tables
                USE_TEXT_TO_SQL_THRESHOLD = 500  # rows
                
                if not is_aggregated and row_count > USE_TEXT_TO_SQL_THRESHOLD and table_id:
                    # --- TEXT-TO-SQL PATH ---
                    print(f"    [Agent] Using Text-to-SQL for large raw table ({row_count} rows)")
                    
                    columns = list(data[0].keys()) if data else []
                    sql_results, sql_or_error = execute_text_to_sql(
                        llm, actual_name, table_id, columns, user_message, data[:10]
                    )
                    
                    if sql_results is not None:
                        # Success - send SQL results to LLM for final answer
                        result_str = json.dumps(sql_results, default=str)
                        messages.append(AIMessage(content=f"I'll query the '{actual_name}' table to find the relevant data."))
                        messages.append(SystemMessage(content=(
                            f"--- SQL QUERY RESULTS for '{actual_name}' ---\n"
                            f"Query executed: {sql_or_error}\n"
                            f"Results ({len(sql_results)} rows):\n{result_str}\n\n"
                            f"Now, provide a clear answer to the user's question based on these query results. "
                            f"DO NOT repeat 'PULL_DATA'. Format the data nicely if appropriate."
                        )))
                        
                        response = llm.invoke(messages)
                        content = response.content
                    else:
                        # SQL failed - fall back to sample data with explanation
                        print(f"    [Agent] Text-to-SQL failed: {sql_or_error}")
                        sample_data = data[:50] if data else []
                        data_str = json.dumps(sample_data, default=str)
                        messages.append(AIMessage(content=f"I'll analyze a sample from '{actual_name}'."))
                        messages.append(SystemMessage(content=(
                            f"--- SAMPLE DATA from '{actual_name}' (first 50 of {row_count} rows) ---\n{data_str}\n\n"
                            f"NOTE: The full table has {row_count} rows. This is a sample. "
                            f"If the user needs specific records, suggest they provide more specific criteria.\n"
                            f"Now, provide the best answer you can based on this sample. DO NOT repeat 'PULL_DATA'."
                        )))
                        
                        response = llm.invoke(messages)
                        content = response.content
                else:
                    # --- DIRECT DATA PATH (aggregated or small tables) ---
                    print(f"    [Agent] Using direct data (aggregated or small table)")
                    data_str = json.dumps(data, default=str)
                    messages.append(AIMessage(content=f"Understood. I have pulled the data for '{actual_name}' and am analyzing it now."))
                    messages.append(SystemMessage(content=f"--- FULL TABLE DATA: {actual_name} ---\n{data_str}\n\nNow, provide the final answer based on this complete data. DO NOT repeat 'PULL_DATA'."))
                    
                    response = llm.invoke(messages)
                    content = response.content
            else:
                print(f"    [Agent] FAILED: No exact match for '{requested_table}'")
                # List available names for the Agent to try again
                avail_names = [i.get('_source') for i in context_data if isinstance(i, dict)]
                messages.append(SystemMessage(content=f"Error: Table '{requested_table}' not found. You must use one of these EXACT names: {avail_names}"))
                response = llm.invoke(messages)
                content = response.content
        
        latency_ms = int((time.time() - start_time) * 1000)
        
        # Token usage (simplified for two calls)
        tokens_total = 0
        if hasattr(response, 'usage_metadata') and response.usage_metadata:
            tokens_total = response.usage_metadata.get('total_tokens', 0)

        return {
            "content": content,
            "tokens_total": tokens_total,
            "latency_ms": latency_ms,
            "model": str(getattr(llm, 'model_name', getattr(llm, 'model', 'unknown'))),
            "provider": agent_definition.llm_provider.provider_type,
        }
    except Exception as e:
        latency_ms = int((time.time() - (start_time if 'start_time' in locals() else time.time())) * 1000)
        error_msg = str(e)
        print(f"  [LLM ERROR] {error_msg}")
        return {
            "error": error_msg,
            "content": f"⚠️ LLM Error: {error_msg}",
            "latency_ms": latency_ms,
        }


def log_agent_call(agent_definition, prompt, response_data, workflow_run=None, node_execution=None):
    """Log the LLM call for cost tracking and auditing."""
    try:
        from agents.models import AgentCallLog
        AgentCallLog.objects.create(
            agent_definition=agent_definition,
            workflow_run=workflow_run,
            node_execution=node_execution,
            provider=response_data.get('provider', 'unknown'),
            model=response_data.get('model', 'unknown'),
            tokens_input=response_data.get('tokens_input', 0),
            tokens_output=response_data.get('tokens_output', 0),
            tokens_total=response_data.get('tokens_total', 0),
            cost_input=0,  # Can be calculated based on model pricing
            cost_output=0,
            cost_total=0,
            latency_ms=response_data.get('latency_ms', 0),
            prompt=prompt[:5000],  # Truncate for storage
            response=response_data.get('content', '')[:5000],
            tools_used=[],
            temperature=agent_definition.agent_config.temperature if agent_definition.agent_config else 0.7,
            max_tokens=agent_definition.agent_config.max_tokens if agent_definition.agent_config else 1000,
        )
    except Exception as e:
        print(f"  [LOG WARNING] Failed to log agent call: {e}")
