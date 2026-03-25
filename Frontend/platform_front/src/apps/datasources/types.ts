
export interface DataSource {
    id: string;
    organization: string;
    name: string;
    source_type: 'database' | 'csv' | 'api';
    config: Record<string, any>;
    fetch_mode: 'live' | 'batch';
    created_at: string;
    scenario_overrides?: Record<string, any>;
    tables_count?: number;
}

export interface DynamicTable {
    id: string;
    organization: string;
    data_source?: string; // Optional link to a DataSource
    name: string;
    schema_definition: Record<string, any>;
    physical_table_name?: string;
    last_fetched_at?: string;
    created_at: string;
    updated_at: string;
}

export interface DynamicTableHistory {
    id: string;
    dynamic_table: string;
    schema_snapshot: Record<string, any>;
    change_reason?: string;
    created_at: string;
}
