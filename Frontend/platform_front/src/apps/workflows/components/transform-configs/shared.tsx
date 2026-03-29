import React, { useMemo } from 'react';
import {
    Box,
    Typography,
    Stack,
    TextField,
    MenuItem,
    alpha,
    Chip,
    CircularProgress,
    Autocomplete,
} from '@mui/material';
import { Table as TableIcon } from 'lucide-react';
import { useDynamicTables } from '../../../datasources/api/queries';
import type { Node, Edge } from 'reactflow';

// ──────────────────────────────────────────────
//  Types
// ──────────────────────────────────────────────
export interface ConnectedSource {
    node: Node;
    label: string;
}

export interface TableInfo {
    id: string;
    name: string;
    columns: { name: string; type: string }[];
    sourceLabel: string;
}

export interface TransformConfigProps {
    params: any;
    onChange: (key: string, value: any) => void;
    allTables: TableInfo[];
    isLoading: boolean;
}

// ──────────────────────────────────────────────
//  Shared Styles
// ──────────────────────────────────────────────
export const sectionTitle = {
    fontSize: '0.68rem', fontWeight: 800, color: '#475569',
    textTransform: 'uppercase' as const, letterSpacing: '0.04em', mb: 1,
};

export const chipStyle = (active: boolean, color: string) => ({
    fontSize: '0.7rem',
    fontWeight: active ? 700 : 500,
    borderColor: active ? color : alpha('#111827', 0.12),
    bgcolor: active ? alpha(color, 0.08) : 'transparent',
    color: active ? color : '#64748b',
    cursor: 'pointer',
    '&:hover': { bgcolor: alpha(color, 0.12) },
});

export const selectFieldSx = {
    '& .MuiOutlinedInput-root': { borderRadius: '8px', fontSize: '0.82rem' },
};

// ──────────────────────────────────────────────
//  Helpers
// ──────────────────────────────────────────────
export function getConnectedSources(nodeId: string, nodes: Node[], edges: Edge[]): ConnectedSource[] {
    const sources: ConnectedSource[] = [];
    const incomingEdges = edges.filter(e => e.target === nodeId);
    
    incomingEdges.forEach(edge => {
        const srcNode = nodes.find(n => n.id === edge.source);
        if (srcNode) {
            sources.push({
                node: srcNode,
                label: srcNode.data?.label || srcNode.id,
            });
        }
    });
    
    return sources;
}


function getUpstreamVirtualColumns(nodeId: string, nodes: Node[], edges: Edge[]): { name: string, type: string }[] {
    const virtualCols: { name: string, type: string }[] = [];
    const seen = new Set<string>();

    function traverse(nid: string) {
        if (seen.has(nid)) return;
        seen.add(nid);

        const node = nodes.find(n => n.id === nid);
        if (!node) return;

        // If this node is a Calculate transform, add its column
        if (node.type === 'transform' && node.data?.transformKey === 'calculate') {
            const name = node.data?.algo_parameters?.new_column_name;
            if (name && !virtualCols.find(c => c.name === name)) {
                virtualCols.push({ name, type: 'VARCHAR' });
            }
        }

        // Keep looking upstream to collect more virtual columns
        const incomingEdges = edges.filter(e => e.target === nid);
        incomingEdges.forEach(e => traverse(e.source));
    }

    traverse(nodeId);
    return virtualCols;
}

// Helper to find the original database table name by tracing back through transform chain
function findOriginalTableName(
    startTableId: string | undefined,
    nodes: Node[],
    edges: Edge[],
    dsTables: any[],
    transformTables: any[]
): string | null {
    if (!startTableId) return null;
    
    const visited = new Set<string>();
    
    function trace(tableId: string): string | null {
        if (visited.has(tableId)) return null;
        visited.add(tableId);
        
        // First check if it's a real database table
        const dbTable = (transformTables || []).find((t: any) => t.id === tableId) ||
                        (dsTables || []).find((t: any) => t.id === tableId);
        if (dbTable?.name) return dbTable.name;
        
        // Otherwise, it might be a node ID - check if it's a transform node
        const node = nodes.find(n => n.id === tableId);
        if (!node) return null;
        
        if (node.type === 'transform') {
            // Get this transform's source table and trace further
            const params = node.data?.algo_parameters || {};
            const upstreamTableId = params.source_table || params.left_table;
            if (upstreamTableId) {
                return trace(upstreamTableId);
            }
            
            // If no source_table param, follow the edge upstream
            const incomingEdge = edges.find(e => e.target === tableId);
            if (incomingEdge) {
                return trace(incomingEdge.source);
            }
        }
        
        return null;
    }
    
    return trace(startTableId);
}

export function useAllSourceTables(sources: ConnectedSource[], nodes: Node[], edges: Edge[]): { allTables: TableInfo[]; isLoading: boolean } {
    // Collect unique DataSource IDs and Table IDs we need to fetch
    // We need to traverse upstream to find all referenced tables
    const { dsIds, tableIds } = useMemo(() => {
        const dsIds: string[] = [];
        const tableIds: string[] = [];
        const visited = new Set<string>();
        
        function collectUpstreamTables(nodeId: string) {
            if (visited.has(nodeId)) return;
            visited.add(nodeId);
            
            const node = nodes.find(n => n.id === nodeId);
            if (!node) return;
            
            if (node.type === 'dataSource') {
                const dsId = node.data?.resourceId;
                if (dsId && !dsIds.includes(dsId)) dsIds.push(dsId);
            } else if (node.type === 'transform') {
                const params = node.data?.algo_parameters || {};
                // Collect all table IDs from transform parameters
                [params.source_table, params.left_table, params.right_table].forEach(id => {
                    if (id && !tableIds.includes(id)) tableIds.push(id);
                });
            }
            
            // Traverse upstream
            edges.filter(e => e.target === nodeId).forEach(e => collectUpstreamTables(e.source));
        }
        
        // Start from each source and traverse upstream
        sources.forEach(src => collectUpstreamTables(src.node.id));
        
        return { dsIds, tableIds };
    }, [sources, nodes, edges]);

    // Fetch all tables for the connected DataSources
    const { data: dsTables, isLoading: dsLoading } = useDynamicTables(
        dsIds.length > 0 ? { datasource_id__in: dsIds.join(',') } : undefined
    );

    // Fetch the specific tables targeted by transforms (to resolve their names/raw columns)
    const { data: transformTables, isLoading: transformLoading } = useDynamicTables(
        tableIds.length > 0 ? { id__in: tableIds.join(',') } : undefined
    );

    const isLoading = dsLoading || transformLoading;

    const allTables = useMemo(() => {
        const result: TableInfo[] = [];
        
        sources.forEach((src) => {
            if (src.node.type === 'dataSource') {
                const dsId = src.node.data?.resourceId;
                const tables = (dsTables || []).filter((t: any) => t.data_source === dsId);
                
                tables.forEach((t: any) => {
                    result.push({
                        // If the Data Source node represents a specific table, use node.id
                        // but since a DS can have multiple tables, we should combine them for uniqueness
                        id: t.id, 
                        name: t.name,
                        columns: (t.schema_definition?.columns || []).map((c: any) => ({
                            name: c.name,
                            type: c.type,
                        })),
                        sourceLabel: src.label,
                    });
                });
            } else if (src.node.type === 'transform') {
                const tableId = src.node.data?.algo_parameters?.source_table;
                const transformKey = src.node.data?.transformKey || src.node.data?.key;

                // Handle structural transforms that redefine the entire schema (Smart Cube, Aggregate, Join)
                if (transformKey === 'join') {
                    // Join combines columns from two tables
                    const leftTableId = src.node.data?.algo_parameters?.left_table;
                    const rightTableId = src.node.data?.algo_parameters?.right_table;
                    const rightOn = src.node.data?.algo_parameters?.right_on;
                    
                    // Get columns from both tables
                    let leftCols: { name: string; type: string }[] = [];
                    let rightCols: { name: string; type: string }[] = [];
                    
                    // Find left table
                    const leftTable = (transformTables || []).find((t: any) => t.id === leftTableId) ||
                                      (dsTables || []).find((t: any) => t.id === leftTableId);
                    if (leftTable) {
                        leftCols = (leftTable.schema_definition?.columns || []).map((c: any) => ({
                            name: c.name,
                            type: c.type,
                        }));
                    }
                    
                    // Find right table
                    const rightTable = (transformTables || []).find((t: any) => t.id === rightTableId) ||
                                       (dsTables || []).find((t: any) => t.id === rightTableId);
                    if (rightTable) {
                        rightCols = (rightTable.schema_definition?.columns || []).map((c: any) => ({
                            name: c.name,
                            type: c.type,
                        })).filter((c: any) => c.name !== rightOn); // Exclude the join key from right side
                    }
                    
                    const cols = [...leftCols, ...rightCols];
                    const leftName = leftTable?.name || 'Left';
                    const rightName = rightTable?.name || 'Right';
                    
                    result.push({
                        id: src.node.id,
                        name: `${leftName} + ${rightName} (Joined)`,
                        columns: cols.length > 0 ? cols : [{ name: 'joined_data', type: 'VARCHAR' }],
                        sourceLabel: src.label,
                    });
                } else if (transformKey === 'agg.smart_cube') {
                    const dims = src.node.data?.algo_parameters?.dimensions || [];
                    const measures = src.node.data?.algo_parameters?.measures || [];
                    const cols = [
                        ...dims.map((d: string) => ({ name: d.split('.').pop() || d, type: 'VARCHAR' })),
                        ...measures.map((m: any) => {
                            const agg = (m.agg || 'sum').toUpperCase();
                            return { name: `${agg}_${(m.column || '').replace(/\./g, '_')}`, type: 'DOUBLE' };
                        })
                    ];
                    result.push({
                        id: src.node.id,
                        name: `Smart Cube (${src.label})`,
                        columns: cols,
                        sourceLabel: src.label,
                    });
                } else if (transformKey === 'agg.aggregate' || transformKey === 'aggregate') {
                    const aggTableId = src.node.data?.algo_parameters?.source_table;
                    // Trace back through transforms to find the original database table name
                    const tableName = findOriginalTableName(aggTableId, nodes, edges, dsTables || [], transformTables || []) 
                                      || src.node.data?.label 
                                      || 'Data';
                    
                    const gbs = src.node.data?.algo_parameters?.group_by || [];
                    const aggs = src.node.data?.algo_parameters?.aggregations || [];
                    const cols = [
                        ...gbs.map((g: string) => ({ name: g, type: 'VARCHAR' })),
                        ...aggs.map((a: any) => {
                            const fn = (a.function || a.agg || 'sum').toUpperCase();
                            return { name: `${fn.toLowerCase()}_${a.column}`, type: 'DOUBLE' };
                        })
                    ];
                    result.push({
                        id: src.node.id,
                        name: cols.length > 0 ? `${tableName} (Aggregated)` : `Aggregate Results (${src.label})`,
                        columns: cols.length > 0 ? cols : [{ name: 'aggregated_data', type: 'VARCHAR' }],
                        sourceLabel: src.label,
                    });
                } else if (transformKey === 'rename') {
                    // Handle Rename transform - apply column name mappings
                    const renameTableId = src.node.data?.algo_parameters?.source_table;
                    const table = (transformTables || []).find((t: any) => t.id === renameTableId);
                    
                    if (table) {
                        let cols = (table.schema_definition?.columns || []).map((c: any) => ({
                            name: c.name,
                            type: c.type,
                        }));
                        
                        // Apply rename mappings
                        const mappings = src.node.data?.algo_parameters?.mappings || [];
                        mappings.forEach((mapping: any) => {
                            const colIdx = cols.findIndex((c: any) => c.name === mapping.old_name);
                            if (colIdx !== -1 && mapping.new_name) {
                                cols[colIdx] = { ...cols[colIdx], name: mapping.new_name };
                            }
                        });
                        
                        result.push({
                            id: src.node.id,
                            name: `${table.name} (Renamed)`,
                            columns: cols,
                            sourceLabel: src.label,
                        });
                    }
                } else if (transformKey === 'melt') {
                    // Handle Melt transform - creates new schema with id_vars + variable + value columns
                    // Find the original table name by looking at what this node is connected to
                    const meltTableId = src.node.data?.algo_parameters?.source_table;
                    let tableName = 'Data';
                    
                    // First try direct table lookup
                    const meltTable = (transformTables || []).find((t: any) => t.id === meltTableId);
                    const meltDsTable = (dsTables || []).find((t: any) => t.id === meltTableId);
                    
                    if (meltTable?.name) {
                        tableName = meltTable.name;
                    } else if (meltDsTable?.name) {
                        tableName = meltDsTable.name;
                    } else {
                        // source_table might be a node ID (when chained from another transform)
                        // Look at the selected table from the upstream connection
                        const upstreamNode = nodes.find(n => n.id === meltTableId);
                        if (upstreamNode) {
                            // Get the upstream's source table
                            const upstreamTableId = upstreamNode.data?.algo_parameters?.source_table;
                            const upstreamTable = (transformTables || []).find((t: any) => t.id === upstreamTableId);
                            const upstreamDsTable = (dsTables || []).find((t: any) => t.id === upstreamTableId);
                            tableName = upstreamTable?.name || upstreamDsTable?.name || 'Data';
                        }
                    }
                    
                    const id_vars = src.node.data?.algo_parameters?.id_vars || [];
                    const var_name = src.node.data?.algo_parameters?.var_name || 'variable';
                    const value_name = src.node.data?.algo_parameters?.value_name || 'value';
                    
                    const cols = [
                        ...id_vars.map((col: string) => ({ name: col, type: 'VARCHAR' })),
                        { name: var_name, type: 'VARCHAR' },
                        { name: value_name, type: 'VARCHAR' }
                    ];
                    
                    result.push({
                        id: src.node.id,
                        name: `${tableName} (Melted)`,
                        columns: cols,
                        sourceLabel: src.label,
                    });
                } else if (transformKey === 'pivot') {
                    // Handle Pivot transform - creates new schema based on pivot configuration
                    const pivotTableId = src.node.data?.algo_parameters?.source_table;
                    let tableName = 'Data';
                    
                    const pivotTable = (transformTables || []).find((t: any) => t.id === pivotTableId);
                    const pivotDsTable = (dsTables || []).find((t: any) => t.id === pivotTableId);
                    
                    if (pivotTable?.name) {
                        tableName = pivotTable.name;
                    } else if (pivotDsTable?.name) {
                        tableName = pivotDsTable.name;
                    } else {
                        const upstreamNode = nodes.find(n => n.id === pivotTableId);
                        if (upstreamNode) {
                            const upstreamTableId = upstreamNode.data?.algo_parameters?.source_table;
                            const upstreamTable = (transformTables || []).find((t: any) => t.id === upstreamTableId);
                            const upstreamDsTable = (dsTables || []).find((t: any) => t.id === upstreamTableId);
                            tableName = upstreamTable?.name || upstreamDsTable?.name || 'Data';
                        }
                    }
                    
                    const index = src.node.data?.algo_parameters?.index || [];
                    const pivotCol = src.node.data?.algo_parameters?.columns || 'pivot_column';
                    
                    const cols = [
                        ...index.map((col: string) => ({ name: col, type: 'VARCHAR' })),
                        { name: `[${pivotCol} values...]`, type: 'DOUBLE' }
                    ];
                    
                    result.push({
                        id: src.node.id,
                        name: `${tableName} (Pivoted)`,
                        columns: cols,
                        sourceLabel: src.label,
                    });
                } else if (transformKey === 'trim') {
                    // Trim doesn't change schema, pass through from source
                    const trimTableId = src.node.data?.algo_parameters?.source_table;
                    const table = (transformTables || []).find((t: any) => t.id === trimTableId);
                    
                    if (table) {
                        const cols = (table.schema_definition?.columns || []).map((c: any) => ({
                            name: c.name,
                            type: c.type,
                        }));
                        
                        result.push({
                            id: src.node.id,
                            name: `${table.name} (Trimmed)`,
                            columns: cols,
                            sourceLabel: src.label,
                        });
                    }
                } else if (transformKey === 'select_columns') {
                    // Select Columns keeps only the selected columns
                    const selectTableId = src.node.data?.algo_parameters?.source_table;
                    const selectedCols = src.node.data?.algo_parameters?.columns || [];
                    const tableName = findOriginalTableName(selectTableId, nodes, edges, dsTables || [], transformTables || []) || 'Data';
                    
                    // Output is exactly the selected columns
                    const cols = selectedCols.map((colName: string) => ({ name: colName, type: 'VARCHAR' }));
                    
                    result.push({
                        id: src.node.id,
                        name: `${tableName} (${selectedCols.length} cols)`,
                        columns: cols.length > 0 ? cols : [{ name: 'data', type: 'VARCHAR' }],
                        sourceLabel: src.label,
                    });
                } else if (tableId) {
                    // Standard additive transforms (Filter, Sort, Calculate, etc.)
                    const table = (transformTables || []).find((t: any) => t.id === tableId);
                    const dsTable = (dsTables || []).find((t: any) => t.id === tableId);
                    const sourceTable = table || dsTable;
                    
                    if (sourceTable) {
                        const cols = (sourceTable.schema_definition?.columns || []).map((c: any) => ({
                            name: c.name,
                            type: c.type,
                        }));

                        const upstreamVirtuals = getUpstreamVirtualColumns(src.node.id, nodes, edges);
                        upstreamVirtuals.forEach(vCol => {
                            if (!cols.find((c: { name: string, type: string }) => c.name === vCol.name)) {
                                cols.push(vCol);
                            }
                        });

                        result.push({
                            id: src.node.id, 
                            name: `${sourceTable.name} (${src.label})`,
                            columns: cols,
                            sourceLabel: src.label,
                        });
                    } else {
                        // tableId might be a node ID (from upstream transform)
                        // Try to find the upstream node and get its inferred columns
                        const upstreamNode = nodes.find(n => n.id === tableId);
                        if (upstreamNode) {
                            // For now, add with empty columns - downstream will resolve
                            result.push({
                                id: src.node.id,
                                name: `${src.label} Output`,
                                columns: [{ name: 'data', type: 'VARCHAR' }],
                                sourceLabel: src.label,
                            });
                        }
                    }
                } else {
                    // Fallback for any transform that doesn't match above patterns
                    // At minimum, make it selectable as a table option
                    result.push({
                        id: src.node.id,
                        name: `${src.label} Output`,
                        columns: [{ name: 'transform_output', type: 'VARCHAR' }],
                        sourceLabel: src.label,
                    });
                }
            }
        });
        
        return result.filter((v, i, a) => a.findIndex(t => t.id === v.id && t.name === v.name) === i);
    }, [sources, nodes, edges, dsTables, transformTables]);

    return { allTables, isLoading };
}

// ──────────────────────────────────────────────
//  Table Selector
// ──────────────────────────────────────────────
export const TableSelector: React.FC<{
    label: string;
    tables: TableInfo[];
    value: string;
    onChange: (tableId: string) => void;
    isLoading?: boolean;
}> = ({ label, tables, value, onChange, isLoading }) => (
    <Box>
        <Typography sx={sectionTitle}>{label}</Typography>
        {isLoading ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1 }}>
                <CircularProgress size={14} />
                <Typography sx={{ fontSize: '0.75rem', color: '#94a3b8' }}>Loading tables…</Typography>
            </Box>
        ) : tables.length === 0 ? (
            <Box sx={{ p: 2, borderRadius: '8px', bgcolor: alpha('#f59e0b', 0.04), border: '1px dashed', borderColor: alpha('#f59e0b', 0.3) }}>
                <Typography sx={{ fontSize: '0.72rem', color: '#92400e', fontWeight: 600 }}>
                    No tables found. Connect a Data Source node to this transform.
                </Typography>
            </Box>
        ) : (
            <TextField
                select fullWidth size="small" value={value || ''}
                onChange={(e) => onChange(e.target.value)}
                sx={selectFieldSx}
            >
                {tables.map(t => (
                    <MenuItem key={t.id} value={t.id}>
                        <Stack direction="row" spacing={1} alignItems="center">
                            <TableIcon size={13} color="#6366f1" />
                            <span>{t.name}</span>
                            <Typography component="span" sx={{ fontSize: '0.6rem', color: '#94a3b8', ml: 0.5 }}>
                                ({t.sourceLabel})
                            </Typography>
                        </Stack>
                    </MenuItem>
                ))}
            </TextField>
        )}
    </Box>
);

// ──────────────────────────────────────────────
//  Column Selector (multi)
// ──────────────────────────────────────────────
export const ColumnSelector: React.FC<{
    label: string;
    columns: { name: string; type: string }[];
    value: string[];
    onChange: (cols: string[]) => void;
}> = ({ label, columns, value, onChange }) => (
    <Box>
        <Typography sx={sectionTitle}>{label}</Typography>
        <Autocomplete
            multiple
            freeSolo
            size="small"
            options={columns.map(c => c.name)}
            value={value || []}
            onChange={(_, newVal) => onChange(newVal as string[])}
            renderTags={(tagValue, getTagProps) =>
                tagValue.map((option, index) => {
                    const { key, ...rest } = getTagProps({ index });
                    return (
                        <Chip
                            key={key}
                            label={option}
                            size="small"
                            {...rest}
                            sx={{ fontSize: '0.7rem', fontWeight: 600, bgcolor: alpha('#6366f1', 0.08), color: '#6366f1' }}
                        />
                    );
                })
            }
            renderInput={(params) => (
                <TextField {...params} placeholder="Select or type columns…" sx={selectFieldSx} />
            )}
        />
    </Box>
);

// ──────────────────────────────────────────────
//  Single Column Selector
// ──────────────────────────────────────────────
export const SingleColumnSelector: React.FC<{
    label: string;
    columns: { name: string; type: string }[];
    value: string;
    onChange: (col: string) => void;
}> = ({ label, columns, value, onChange }) => (
    <Box>
        <Typography sx={sectionTitle}>{label}</Typography>
        <Autocomplete
            freeSolo
            size="small"
            options={columns.map(c => c.name)}
            value={value || ''}
            onChange={(_, newVal) => onChange(newVal as string)}
            onBlur={(e: any) => onChange(e.target.value)}
            renderInput={(params) => (
                <TextField {...params} placeholder="Select or type column…" sx={selectFieldSx} />
            )}
        />
    </Box>
);
