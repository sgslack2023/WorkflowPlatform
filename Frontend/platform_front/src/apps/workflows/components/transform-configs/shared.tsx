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

export function useAllSourceTables(sources: ConnectedSource[], nodes: Node[], edges: Edge[]): { allTables: TableInfo[]; isLoading: boolean } {
    // Collect unique DataSource IDs and Table IDs we need to fetch
    const dsIds = sources
        .filter(s => s.node.type === 'dataSource')
        .map(s => s.node.data?.resourceId)
        .filter(Boolean);
        
    const transformTargetTableIds = sources
        .filter(s => s.node.type === 'transform')
        .map(s => s.node.data?.algo_parameters?.source_table)
        .filter(Boolean);

    // Fetch all tables for the connected DataSources
    const { data: dsTables, isLoading: dsLoading } = useDynamicTables(
        dsIds.length > 0 ? { datasource_id__in: dsIds.join(',') } : undefined
    );

    // Fetch the specific tables targeted by transforms (to resolve their names/raw columns)
    const { data: transformTables, isLoading: transformLoading } = useDynamicTables(
        transformTargetTableIds.length > 0 ? { id__in: transformTargetTableIds.join(',') } : undefined
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

                // Handle structural transforms that redefine the entire schema (Smart Cube, Aggregate)
                if (transformKey === 'agg.smart_cube') {
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
                } else if (transformKey === 'agg.aggregate') {
                    const gbs = src.node.data?.algo_parameters?.group_by || [];
                    const aggs = src.node.data?.algo_parameters?.aggregations || [];
                    const cols = [
                        ...gbs.map((g: string) => ({ name: g, type: 'VARCHAR' })),
                        ...aggs.map((a: any) => {
                            const fn = (a.function || a.agg || 'sum').toUpperCase();
                            return { name: `${fn}_${a.column}`, type: 'DOUBLE' };
                        })
                    ];
                    result.push({
                        id: src.node.id,
                        name: `Aggregate Results (${src.label})`,
                        columns: cols,
                        sourceLabel: src.label,
                    });
                } else if (tableId) {
                    // Standard additive transforms (Filter, Sort, Calculate, etc.)
                    const table = (transformTables || []).find((t: any) => t.id === tableId);
                    
                    if (table) {
                        const cols = (table.schema_definition?.columns || []).map((c: any) => ({
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
                            name: `${table.name} (${src.label})`,
                            columns: cols,
                            sourceLabel: src.label,
                        });
                    }
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
