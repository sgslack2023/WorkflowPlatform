import React, { useState, useEffect, useMemo } from 'react';
import {
    Box,
    Typography,
    Stack,
    alpha,
    IconButton,
    Switch,
} from '@mui/material';
import {
    X, Save, Database, Trash2,
    Merge, Layers, Filter as FilterIcon, ArrowUpDown, Calculator, Copy,
} from 'lucide-react';
import SleekButton from '../../../components/SleekButton';
import DeleteConfirmationModal from '../../../components/DeleteConfirmationModal';
import type { Node, Edge } from 'reactflow';

import {
    JoinConfig,
    AggregateConfig,
    FilterConfig,
    SortConfig,
    CalculateConfig,
    DistinctConfig,
    UnionConfig,
    SmartCubeConfig,
    RenameConfig,
    TrimConfig,
    MeltConfig,
    PivotConfig,
    DropConfig,
    GenericSchemaForm,
    getConnectedSources,
    useAllSourceTables,
} from './transform-configs';

// ──────────────────────────────────────────────
//  Transform Type → Icon
// ──────────────────────────────────────────────
const TRANSFORM_ICONS: Record<string, React.ReactNode> = {
    join: <Merge size={18} />,
    aggregate: <Layers size={18} />,
    filter: <FilterIcon size={18} />,
    sort: <ArrowUpDown size={18} />,
    calculate: <Calculator size={18} />,
    distinct: <Copy size={18} />,
    union: <Database size={18} />,
    'agg.smart_cube': <Layers size={18} color="#6366f1" />,
};

import { TransformsAPI } from '../../transforms/api/transforms-api';

// ──────────────────────────────────────────────
//  Props
// ──────────────────────────────────────────────
interface TransformSettingsSidebarProps {
    open: boolean;
    onClose: () => void;
    node: any;
    onSave: (newParams: any, isExposedToApps: boolean) => void;
    onDelete?: () => void;
    onPreviewResult?: (data: { columns: any[], rows: any[] }) => void;
    nodes: Node[];
    edges: Edge[];
}

// ──────────────────────────────────────────────
//  Main Sidebar
// ──────────────────────────────────────────────
const TransformSettingsSidebar: React.FC<TransformSettingsSidebarProps> = ({
    open, onClose, node, onSave, onDelete, onPreviewResult, nodes, edges,
}) => {
    const [params, setParams] = useState<any>(node?.data?.algo_parameters || {});
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isPreviewLoading, setIsPreviewLoading] = useState(false);
    const [isExposed, setIsExposed] = useState<boolean>(node?.data?.isExposedToApps ?? true);

    const transformKey: string = node?.data?.transformKey || node?.data?.key || '';

    // Resolve upstream data source nodes
    const connectedSources = useMemo(
        () => (node ? getConnectedSources(node.id, nodes, edges) : []),
        [node, nodes, edges],
    );

    // Fetch tables from connected data sources
    const { allTables, isLoading: tablesLoading } = useAllSourceTables(connectedSources, nodes, edges);

    useEffect(() => {
        setParams(node?.data?.algo_parameters || {});
        setIsExposed(node?.data?.isExposedToApps ?? true);
    }, [node]);

    const handleFieldChange = (key: string, value: any) => {
        setParams((prev: any) => ({ ...prev, [key]: value }));
    };

    const handleSave = () => { onSave(params, isExposed); onClose(); };

    const handleDelete = () => {
        if (onDelete) { onDelete(); setShowDeleteConfirm(false); onClose(); }
    };

    const handleRunPreview = async () => {
        if (!node?.data?.resourceId) return;
        setIsPreviewLoading(true);
        try {
            let inputTableIds: string[] = [];

            if (transformKey === 'join') {
                if (params.left_table) inputTableIds.push(params.left_table);
                if (params.right_table) inputTableIds.push(params.right_table);
            } else if (transformKey === 'union') {
                if (params.table_a) inputTableIds.push(params.table_a);
                if (params.table_b) inputTableIds.push(params.table_b);
            } else if (transformKey === 'agg.smart_cube') {
                if (Array.isArray(params.input_tables)) {
                    inputTableIds = [...params.input_tables];
                }
            } else if (params.source_table) {
                inputTableIds.push(params.source_table);
            } else {
                // Fallback: collect any table-like value
                Object.values(params).forEach(val => {
                    if (typeof val === 'string' && allTables.some(t => t.id === val)) {
                        if (!inputTableIds.includes(val)) inputTableIds.push(val);
                    }
                });
            }

            if (inputTableIds.length === 0) {
                console.warn('No input tables selected for preview');
                setIsPreviewLoading(false);
                return;
            }

            const result = await TransformsAPI.runPreview(
                node.data.resourceId,
                params,
                inputTableIds
            );
            onPreviewResult?.(result);
        } catch (error) {
            console.error('Preview failed:', error);
        } finally {
            setIsPreviewLoading(false);
        }
    };

    if (!open || !node) return null;

    const transformIcon = TRANSFORM_ICONS[transformKey] || <Database size={18} />;

    const renderConfig = () => {
        const configProps = { params, onChange: handleFieldChange, allTables, isLoading: tablesLoading };

        switch (transformKey) {
            case 'join': return <JoinConfig {...configProps} />;
            case 'aggregate': return <AggregateConfig {...configProps} />;
            case 'filter': return <FilterConfig {...configProps} />;
            case 'sort': return <SortConfig {...configProps} />;
            case 'calculate': return <CalculateConfig {...configProps} />;
            case 'distinct': return <DistinctConfig {...configProps} />;
            case 'union': return <UnionConfig {...configProps} />;
            case 'agg.smart_cube': return <SmartCubeConfig {...configProps} />;
            case 'rename': return <RenameConfig {...configProps} />;
            case 'trim': return <TrimConfig {...configProps} />;
            case 'melt': return <MeltConfig {...configProps} />;
            case 'pivot': return <PivotConfig {...configProps} />;
            case 'drop': return <DropConfig {...configProps} />;
            default:
                return <GenericSchemaForm schema={node?.data?.input_schema || {}} params={params} onChange={handleFieldChange} />;
        }
    };

    if (!open) return null;

    return (
        <Box
            sx={{
                position: 'fixed', right: 0, top: 0, bottom: 0,
                width: 420, bgcolor: '#fff', borderLeft: '1px solid #e2e8f0',
                boxShadow: '-4px 0 20px rgba(0,0,0,0.05)',
                zIndex: 1200, display: 'flex', flexDirection: 'column',
            }}
        >
            {/* ── Header ── */}
            <Box sx={{ p: 2.5, borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                    <Box sx={{
                        width: 36, height: 36, borderRadius: '10px',
                        bgcolor: alpha('#6366f1', 0.1), color: '#6366f1',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        {transformIcon}
                    </Box>
                    <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#1e293b', lineHeight: 1.2 }}>
                            {node?.data?.label}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748b' }}>Configure Transformation</Typography>
                    </Box>
                </Stack>
                <Stack direction="row" spacing={0.5} alignItems="center">
                    {onDelete && (
                        <IconButton
                            onClick={() => setShowDeleteConfirm(true)} size="small"
                            sx={{ color: alpha('#ef4444', 0.6), '&:hover': { color: '#ef4444', bgcolor: alpha('#ef4444', 0.05) } }}
                        >
                            <Trash2 size={16} />
                        </IconButton>
                    )}
                    <IconButton onClick={onClose} size="small" sx={{ color: '#94a3b8' }}>
                        <X size={18} />
                    </IconButton>
                </Stack>
            </Box>

            <DeleteConfirmationModal
                open={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={handleDelete}
                title="Delete Transform Node"
                description={`Are you sure you want to remove "${node?.data?.label}" from the canvas? This action cannot be undone.`}
            />

            {/* ── Connected Sources Indicator ── */}
            <Box sx={{ px: 2.5, py: 1.5, bgcolor: alpha('#6366f1', 0.02), borderBottom: '1px solid', borderColor: alpha('#111827', 0.04) }}>
                <Stack direction="row" spacing={1} alignItems="center">
                    <Database size={12} color="#6366f1" />
                    <Typography sx={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600 }}>
                        {connectedSources.length === 0
                            ? 'No data sources connected'
                            : `Connected: ${connectedSources.map(s => s.label).join(', ')}`}
                    </Typography>
                </Stack>
                {connectedSources.length === 0 && (
                    <Typography sx={{ fontSize: '0.62rem', color: '#94a3b8', mt: 0.5 }}>
                        Draw an edge from a Data Source node to this transform to see available tables.
                    </Typography>
                )}
            </Box>

            {/* ── Expose to Apps Toggle ── */}
            <Box sx={{ px: 2.5, py: 1.5, borderBottom: '1px solid', borderColor: alpha('#111827', 0.04) }}>
                <Box sx={{ p: 1.5, borderRadius: '10px', bgcolor: alpha('#6366f1', 0.03), border: '1px dashed', borderColor: alpha('#6366f1', 0.2), display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                        <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#111827' }}>Expose to Apps</Typography>
                        <Typography sx={{ fontSize: '0.6rem', color: alpha('#111827', 0.5) }}>Make this transform available in App Builder</Typography>
                    </Box>
                    <Switch
                        size="small"
                        checked={isExposed}
                        onChange={(e) => setIsExposed(e.target.checked)}
                        sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': { color: '#6366f1' },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#6366f1' }
                        }}
                    />
                </Box>
            </Box>

            {/* ── Scrollable Content ── */}
            <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 3 }}>
                {node?.data?.description && (
                    <Typography sx={{ fontSize: '0.75rem', color: '#64748b', mb: 3, fontStyle: 'italic' }}>
                        {node.data.description}
                    </Typography>
                )}
                {renderConfig()}
            </Box>

            {/* ── Footer ── */}
            <Box sx={{ p: 2.5, borderTop: '1px solid #f1f5f9', bgcolor: '#fafafa' }}>
                <Stack spacing={1}>
                    <SleekButton
                        fullWidth variant="light"
                        startIcon={<Layers size={16} />}
                        onClick={handleRunPreview}
                        loading={isPreviewLoading}
                        sx={{ py: 1 }}
                    >
                        Run & Preview
                    </SleekButton>
                    <SleekButton
                        fullWidth variant="dark"
                        startIcon={<Save size={16} />}
                        onClick={handleSave}
                        sx={{ py: 1.2 }}
                    >
                        Apply Changes
                    </SleekButton>
                </Stack>
            </Box>
        </Box>
    );
};

export default TransformSettingsSidebar;
