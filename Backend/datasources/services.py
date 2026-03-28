import uuid
import re
import pandas as pd
from django.db import connections, transaction
from .models import DynamicTable, DynamicTableHistory

class DynamicTableService:
    @property
    def connection(self):
        return connections['data_warehouse']

    def generate_physical_table_name(self, dynamic_table):
        """Generates a unique physical table name: dt_{org_id_short}_{uuid}_v{version}"""
        # Sanitizing org ID (taking first 8 chars) and uuid
        if dynamic_table.organization:
            org_suffix = str(dynamic_table.organization.id).split('-')[0]
        else:
            org_suffix = "global"  # For tables without organization
        table_uuid = str(dynamic_table.id).replace('-', '')
        return f"dt_{org_suffix}_{table_uuid}"

    def get_column_type_sql(self, col_type):
        """Maps simplified types to SQL types (optimized for Postgres/SQLite)"""
        is_postgres = self.connection.vendor == 'postgresql'
        
        type_map = {
            'text': 'TEXT',
            'string': 'VARCHAR(255)',
            'number': 'DOUBLE PRECISION' if is_postgres else 'FLOAT',
            'integer': 'INTEGER',
            'boolean': 'BOOLEAN',
            'date': 'DATE',
            'datetime': 'TIMESTAMP WITH TIME ZONE' if is_postgres else 'TIMESTAMP',
            'json': 'JSONB' if is_postgres else 'TEXT' 
        }
        return type_map.get(col_type, 'TEXT')

    def create_table(self, dynamic_table):
        """Creates the physical table based on schema_definition"""
        table_name = self.generate_physical_table_name(dynamic_table)
        schema = dynamic_table.schema_definition
        # Schema Structure: {'columns': [{'name': 'age', 'type': 'integer', 'foreign_key': {...}}, ...]}
        
        columns_sql = ["id INTEGER PRIMARY KEY AUTOINCREMENT" if self.connection.vendor == 'sqlite' else "id SERIAL PRIMARY KEY"]
        
        for col in schema.get('columns', []):
            col_name = col['name']
            col_type = self.get_column_type_sql(col['type'])
            # Basic sanitization for column name to prevent SQL injection
            if not re.match(r'^[a-zA-Z0-9_]+$', col_name):
                raise ValueError(f"Invalid column name: {col_name}")
            
            # Handle Foreign Key relationships
            fk_data = col.get('foreign_key')
            fk_sql = ""
            if fk_data:
                target_table_id = fk_data.get('target_table_id')
                target_col = fk_data.get('target_column', 'id')
                rel_type = fk_data.get('relationship_type', 'many_to_one')
                
                try:
                    target_table = DynamicTable.objects.get(id=target_table_id)
                    
                    # Validate: Both tables must belong to the same data source
                    if target_table.data_source_id != dynamic_table.data_source_id:
                         raise ValueError(f"Cross-DataSource relationships are not allowed. Table '{target_table.name}' belongs to a different Data Source.")
                    
                    if target_table.physical_table_name:
                        fk_sql = f" REFERENCES {target_table.physical_table_name}({target_col})"
                        if rel_type == 'one_to_one':
                            fk_sql += " UNIQUE"
                except DynamicTable.DoesNotExist:
                    pass # Ignore if target table not found during creation
            
            columns_sql.append(f'"{col_name}" {col_type}{fk_sql}')
            
        create_sql = f"CREATE TABLE IF NOT EXISTS {table_name} ({', '.join(columns_sql)});"
        
        with self.connection.cursor() as cursor:
            cursor.execute(create_sql)
            
        dynamic_table.physical_table_name = table_name
        dynamic_table.save()
        
        # Log History
        DynamicTableHistory.objects.create(
            dynamic_table=dynamic_table,
            schema_snapshot=schema,
            change_reason="Initial Creation"
        )
        
        return table_name

    def delete_table(self, dynamic_table):
        if not dynamic_table.physical_table_name:
            return
            
        with self.connection.cursor() as cursor:
            cursor.execute(f"DROP TABLE IF EXISTS {dynamic_table.physical_table_name}")
            
        dynamic_table.physical_table_name = None
        dynamic_table.save()

    def sync_schema(self, dynamic_table):
        """
        Handles schema updates. 
        For simplicity in this iteration:
        1. Create new temporary table with new schema
        2. Copy compatible data from old table to new table
        3. Drop old table
        4. Rename new table to old table name
        """
        print(f"  [sync_schema] Starting sync for '{dynamic_table.name}'")
        
        if not dynamic_table.physical_table_name:
            print(f"  [sync_schema] No physical table exists, creating new one")
            return self.create_table(dynamic_table)
            
        old_table = dynamic_table.physical_table_name
        # Use a more unique temp name to avoid collisions
        unique_suffix = uuid.uuid4().hex[:8]
        new_table_temp = f"{old_table}_sync_{unique_suffix}"
        
        schema = dynamic_table.schema_definition
        columns_sql = ["id INTEGER PRIMARY KEY AUTOINCREMENT" if self.connection.vendor == 'sqlite' else "id SERIAL PRIMARY KEY"]
        new_columns = []
        
        for col in schema.get('columns', []):
            col_name = col['name']
            col_type = self.get_column_type_sql(col['type'])
            if not re.match(r'^[a-zA-Z0-9_]+$', col_name):
                raise ValueError(f"Invalid column name: {col_name}")
            
            # Handle Foreign Key relationships for sync
            fk_data = col.get('foreign_key')
            fk_sql = ""
            if fk_data:
                target_table_id = fk_data.get('target_table_id')
                target_col = fk_data.get('target_column', 'id')
                rel_type = fk_data.get('relationship_type', 'many_to_one')
                
                try:
                    target_table = DynamicTable.objects.get(id=target_table_id)
                    
                    # Validate: Both tables must belong to the same data source
                    if target_table.data_source_id != dynamic_table.data_source_id:
                         raise ValueError(f"Cross-DataSource relationships are not allowed. Table '{target_table.name}' belongs to a different Data Source.")
                    
                    if target_table.physical_table_name:
                        fk_sql = f" REFERENCES {target_table.physical_table_name}({target_col})"
                        if rel_type == 'one_to_one':
                            fk_sql += " UNIQUE"
                except DynamicTable.DoesNotExist:
                    pass
            
            columns_sql.append(f'"{col_name}" {col_type}{fk_sql}')
            new_columns.append(col_name)
            
        create_sql = f"CREATE TABLE {new_table_temp} ({', '.join(columns_sql)});"
        print(f"  [sync_schema] Creating temp table: {new_table_temp}")
        print(f"  [sync_schema] New columns: {new_columns}")
        
        # Determine common columns for copying
        # We need to query the existing table's columns
        with self.connection.cursor() as cursor:
            # Ensure no collision
            cursor.execute(f"DROP TABLE IF EXISTS {new_table_temp}")
            # Create new table
            cursor.execute(create_sql)
            print(f"  [sync_schema] Temp table created")
            
            # Get existing columns
            # This is vendor specific. Using a generic try-catch approach or specific PRAGMA for SQLite
            if self.connection.vendor == 'sqlite':
                cursor.execute(f"PRAGMA table_info({old_table})")
                existing_cols_info = cursor.fetchall() # list of tuples
                existing_cols = [row[1] for row in existing_cols_info]
            else:
                # Postgres logic for column fetch
                cursor.execute(f"SELECT column_name FROM information_schema.columns WHERE table_name = '{old_table}'")
                existing_cols = [row[0] for row in cursor.fetchall()]
            
            common_cols = [col for col in new_columns if col in existing_cols]
            
            if common_cols:
                # Build type map for conversions
                type_map = {c['name']: c['type'] for c in schema.get('columns', [])}
                
                # Get old column types for comparison
                old_type_map = {}
                if self.connection.vendor == 'sqlite':
                    for row in existing_cols_info:
                        old_type_map[row[1]] = row[2].upper()  # column name -> type
                else:
                    cursor.execute(f"""
                        SELECT column_name, data_type 
                        FROM information_schema.columns 
                        WHERE table_name = '{old_table}'
                    """)
                    for row in cursor.fetchall():
                        old_type_map[row[0]] = row[1].upper()
                
                # Build SELECT with type casting for changed columns
                select_parts = []
                for col in common_cols:
                    new_type = type_map.get(col, 'text')
                    old_db_type = old_type_map.get(col, '')
                    
                    # Check if type conversion is needed
                    needs_cast = False
                    cast_to = None
                    
                    if new_type in ('datetime', 'date'):
                        # If old type was numeric/integer, we can't convert - set to NULL
                        if any(t in old_db_type for t in ['INT', 'NUMERIC', 'DOUBLE', 'FLOAT', 'REAL']):
                            # Old data was numeric, new is datetime - can't convert, use NULL
                            select_parts.append(f'NULL AS "{col}"')
                            continue
                    elif new_type == 'integer':
                        if any(t in old_db_type for t in ['TIMESTAMP', 'DATE', 'TIME']):
                            # Old data was datetime, new is integer - can't convert, use NULL
                            select_parts.append(f'NULL AS "{col}"')
                            continue
                    elif new_type in ('float', 'number'):
                        if any(t in old_db_type for t in ['TIMESTAMP', 'DATE', 'TIME']):
                            select_parts.append(f'NULL AS "{col}"')
                            continue
                    
                    # Default: just copy the column
                    select_parts.append(f'"{col}"')
                
                cols_str = ", ".join([f'"{col}"' for col in common_cols])
                select_str = ", ".join(select_parts)
                copy_sql = f"INSERT INTO {new_table_temp} ({cols_str}) SELECT {select_str} FROM {old_table}"
                
                try:
                    cursor.execute(copy_sql)
                except Exception as e:
                    print(f"[Schema Sync] Data copy failed: {e}. Proceeding with empty table.")
                    # If copy fails, just continue with empty table
                
            # Drop old and rename
            if self.connection.vendor == 'postgresql':
                cursor.execute(f"DROP TABLE IF EXISTS {old_table} CASCADE")
            else:
                cursor.execute(f"DROP TABLE IF EXISTS {old_table}")
            cursor.execute(f"ALTER TABLE {new_table_temp} RENAME TO {old_table}")
            
        # Log History
        DynamicTableHistory.objects.create(
            dynamic_table=dynamic_table,
            schema_snapshot=schema,
            change_reason="Schema Update (Sync)"
        )

    def insert_rows(self, dynamic_table, rows):
        """
        rows: list of dicts
        """
        if not rows:
            return
            
        table_name = dynamic_table.physical_table_name
        
        # Check if table exists in DB, create if not
        with self.connection.cursor() as cursor:
            if self.connection.vendor == 'postgresql':
                cursor.execute(f"SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = '{table_name}');")
                exists = cursor.fetchone()[0]
            else:
                cursor.execute(f"SELECT name FROM sqlite_master WHERE type='table' AND name='{table_name}';")
                exists = cursor.fetchone() is not None
        
        if not exists:
            self.create_table(dynamic_table)
            table_name = dynamic_table.physical_table_name
        else:
            # Table exists, but does it have all required columns?
            with self.connection.cursor() as cursor:
                if self.connection.vendor == 'postgresql':
                    cursor.execute(f"SELECT column_name FROM information_schema.columns WHERE table_name = '{table_name}'")
                    existing_cols = {row[0] for row in cursor.fetchall()}
                else:
                    cursor.execute(f"PRAGMA table_info({table_name})")
                    existing_cols = {row[1] for row in cursor.fetchall()}
                
                schema = dynamic_table.schema_definition
                schema_cols = [c['name'] for c in schema.get('columns', [])]
                missing_in_db = [c for c in schema_cols if c not in existing_cols]
                
                if missing_in_db:
                    # Automatically sync if columns are missing
                    self.sync_schema(dynamic_table)
                    table_name = dynamic_table.physical_table_name

        # Determine valid columns from schema again after potential sync
        schema = dynamic_table.schema_definition
        schema_cols_def = schema.get('columns', [])
        schema_cols = [c['name'] for c in schema_cols_def]
        
        # Build type map for conversion
        type_map = {c['name']: c['type'] for c in schema_cols_def}
        
        data_cols = list(rows[0].keys())
        
        # Intersection of schema columns and data columns, excluding ID
        columns = [col for col in schema_cols if col in data_cols and col != 'id']
        
        if not columns:
            return

        # SQL placeholders for insertion
        param_placeholder = "?" if self.connection.vendor == 'sqlite' else "%s"
        placeholders = ", ".join([param_placeholder for _ in columns])
        columns_str = ", ".join([f'"{col}"' for col in columns])
        
        sql = f"INSERT INTO {table_name} ({columns_str}) VALUES ({placeholders})"
        
        def convert_value(val, col_type):
            """Convert value to match expected column type"""
            if val is None or val == '' or (isinstance(val, float) and pd.isna(val)):
                return None
            
            try:
                if col_type == 'integer':
                    # Try to convert to int, return None if fails
                    return int(float(val))
                elif col_type in ('float', 'number'):
                    return float(val)
                elif col_type == 'boolean':
                    if isinstance(val, bool):
                        return val
                    return str(val).lower().strip() in ['true', '1', 'yes', 't', 'y']
                elif col_type in ('date', 'datetime'):
                    # Parse datetime and return in proper format
                    from datetime import datetime
                    if isinstance(val, datetime):
                        return val
                    parsed = pd.to_datetime(val, errors='coerce')
                    if pd.isna(parsed):
                        return None
                    return parsed.to_pydatetime()
                else:
                    # text, string, json etc - return as string
                    return str(val) if val is not None else None
            except (ValueError, TypeError):
                return None
        
        with self.connection.cursor() as cursor:
            for row in rows:
                values = [convert_value(row.get(col), type_map.get(col, 'text')) for col in columns]
                cursor.execute(sql, values)
            
            # If postgres, we might need to sync the ID sequence if someone DID try to insert IDs
            # but usually we just let SERIAL handle it.
            if self.connection.vendor == 'postgresql':
                # Sync the sequence to avoid unique constraint violations on future manual inserts
                cursor.execute(f"SELECT setval(pg_get_serial_sequence('{table_name}', 'id'), COALESCE(MAX(id), 1)) FROM {table_name};")

    def fetch_rows(self, dynamic_table, limit=10000):
        """Fetch rows from a dynamic table. Default limit is 10000 for larger dataset support."""
        table_name = dynamic_table.physical_table_name
        if not table_name:
            return []
            
        with self.connection.cursor() as cursor:
            param_placeholder = "?" if self.connection.vendor == 'sqlite' else "%s"
            cursor.execute(f"SELECT * FROM {table_name} LIMIT {param_placeholder}", [limit])
            columns = [col[0] for col in cursor.description]
            return [dict(zip(columns, row)) for row in cursor.fetchall()]

    def clear_rows(self, dynamic_table):
        table_name = dynamic_table.physical_table_name
        if not table_name:
            return
            
        with self.connection.cursor() as cursor:
            # DELETE is more universal than TRUNCATE for basic dynamic setups
            cursor.execute(f"DELETE FROM {table_name}")
