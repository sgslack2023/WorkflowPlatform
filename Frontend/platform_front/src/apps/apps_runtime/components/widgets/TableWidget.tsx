import React, { useState, useMemo, useRef } from 'react';
import {
    Box, alpha, TextField,
    InputAdornment, IconButton, Stack, Typography,
    CircularProgress, Alert, Snackbar, Tooltip,
    Popover, Chip
} from '@mui/material';
import { Search, Filter, Download, FileUp, Database, AlertCircle, Info, X } from 'lucide-react';
import { useDynamicTableRows, useValidateUpload, useUploadFile, useDynamicTables } from '../../../datasources/api/queries';
import { useWorkflow, useWorkflowNodeData } from '../../../workflows/api/queries';
import CyberTable from '../../../../components/CyberTable';
import SleekButton from '../../../../components/SleekButton';
import DataValidationModal from '../../../datasources/components/DataValidationModal';

interface TableWidgetProps {
    nodeId: string;
    workflowId: string;
    tableBinding?: string | null;
}

const TableWidget: React.FC<TableWidgetProps> = ({ nodeId, workflowId, tableBinding }) => {
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [search, setSearch] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [filterAnchor, setFilterAnchor] = useState<null | HTMLElement>(null);
    const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});

    // Upload state
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [validationModalOpen, setValidationModalOpen] = useState(false);

    // 1. Fetch the workflow to find the node's config
    const { data: workflow, isLoading: workflowLoading } = useWorkflow(workflowId);

    // Find the node in the workflow definition
    const boundNode = workflow?.nodes?.find((n: any) => n.id === nodeId || n.frontend_id === nodeId || n.langgraph_id === nodeId);
    const isDataSource = boundNode?.node_type === 'datasource';
    const isTransform = boundNode?.node_type === 'transform' || boundNode?.node_type === 'aggregate';

    const rawId = boundNode?.config?.resource_id || boundNode?.config?.resourceId || boundNode?.config?.tableId;

    // 2. Resolve tableId: if it's a datasource node, we need to fetch its tables
    const { data: tables, isLoading: tablesLoading } = useDynamicTables(
        { datasource_id: rawId },
        { enabled: !!rawId && isDataSource && !tableBinding }
    );

    // Priority: Explicit tableBinding > First table from datasource > rawId from node config
    const tableId = tableBinding || (isDataSource ? (tables as any)?.[0]?.id : rawId);

    // 3. Fetch real data
    // Data Source Rows - increased limit to support larger datasets
    const { data: dsRowsData, isLoading: dsRowsLoading, refetch } = useDynamicTableRows(
        tableId || '',
        { limit: 10000 },
        { enabled: !!tableId && isDataSource }
    );

    // Transform / Aggregate Node Data
    const { data: nodeOutputData, isLoading: nodeOutputLoading } = useWorkflowNodeData(
        workflowId,
        nodeId
    );

    const rows = useMemo(() => {
        const rawData = nodeOutputData?.data;

        // 1. If we have workflow output data, use it (works for all node types)
        if (rawData) {
            // Skip error responses from the backend
            if (typeof rawData === 'object' && !Array.isArray(rawData) && rawData.error) {
                console.warn('[TableWidget] Node returned error:', rawData.error);
                // Don't use error data, fall through to fallbacks
            } else {
                if (Array.isArray(rawData)) return rawData;

                // If it's an object, look for the first array property (common in transform/datasource outputs)
                if (typeof rawData === 'object') {
                    const arrayKeys = Object.keys(rawData).filter(key => Array.isArray((rawData as any)[key]));
                    if (arrayKeys.length > 0) {
                        // Prefer well-known keys
                        const preferredKey = arrayKeys.find(k => ['transformed_data', 'raw_data', 'rows', 'data', 'results'].includes(k)) || arrayKeys[0];
                        return (rawData as any)[preferredKey];
                    }
                }

                // If it's a single object with meaningful data, wrap it
                return [rawData];
            }
        }

        // 2. Fallback to raw Data Source rows if it's a datasource node and we have no workflow data yet
        if (isDataSource && dsRowsData) {
            return (dsRowsData || []) as any[];
        }

        return [];
    }, [isDataSource, dsRowsData, nodeOutputData]);

    const rowsLoading = isDataSource ? dsRowsLoading : nodeOutputLoading;

    // 3. Mutation hooks
    const validateMutation = useValidateUpload();
    const uploadMutation = useUploadFile();

    const columns = useMemo(() => {
        if (!rows || rows.length === 0) return [];
        // Attempt to extract columns from the first row keys
        return Object.keys(rows[0]).map(key => ({
            id: key,
            label: key.replace(/_/g, ' ').toUpperCase(),
            minWidth: 120
        }));
    }, [rows]);

    const filteredData = useMemo(() => {
        if (!rows) return [];
        return rows.filter((row: any) => {
            // Global search
            const matchesSearch = !search || Object.values(row).some(val =>
                val?.toString().toLowerCase().includes(search.toLowerCase())
            );
            // Column filters
            const matchesFilters = Object.entries(columnFilters).every(([col, val]) => {
                if (!val) return true;
                return row[col]?.toString().toLowerCase().includes(val.toLowerCase());
            });
            return matchesSearch && matchesFilters;
        });
    }, [rows, search, columnFilters]);

    const activeFilterCount = Object.values(columnFilters).filter(v => v).length;

    const handleDownloadCsv = () => {
        if (!filteredData.length || !columns.length) return;
        const header = columns.map(c => c.id).join(',');
        const csvRows = filteredData.map((row: any) =>
            columns.map(c => {
                const val = row[c.id];
                const str = val === null || val === undefined ? '' : String(val);
                // Escape commas and quotes
                return str.includes(',') || str.includes('"') || str.includes('\n')
                    ? `"${str.replace(/"/g, '""')}"`
                    : str;
            }).join(',')
        );
        const csv = [header, ...csvRows].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `data_export_${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !tableId) return;

        setError(null);
        setSelectedFile(file);
        setValidationModalOpen(true);

        validateMutation.mutate({ tableId, file }, {
            onError: (err: any) => {
                setError(err.response?.data?.error || 'Validation failed');
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        });
    };

    const handleConfirmUpload = async () => {
        if (!selectedFile || !tableId) return;

        uploadMutation.mutate({ tableId, file: selectedFile }, {
            onSuccess: () => {
                setValidationModalOpen(false);
                setSelectedFile(null);
                setUploadSuccess(true);
                refetch();
            },
            onError: (err: any) => {
                setError(err.response?.data?.error || 'Upload failed');
            }
        });
    };

    if (workflowLoading || (boundNode?.node_type === 'datasource' && tablesLoading)) {
        return (
            <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CircularProgress size={24} />
            </Box>
        );
    }

    if (!tableId) {
        return (
            <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 3, opacity: 0.5 }}>
                <Database size={40} strokeWidth={1} style={{ marginBottom: 12 }} />
                <Typography sx={{ fontSize: '0.85rem', fontWeight: 600 }}>No Source Connected</Typography>
                <Typography sx={{ fontSize: '0.75rem' }}>Configure node binding in designer.</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: '#fff' }}>
            <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept=".csv,.xlsx,.xls"
                onChange={handleFileChange}
            />

            <Box sx={{
                px: 2, py: 1.2,
                borderBottom: '1px solid',
                borderColor: alpha('#111827', 0.04),
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
            }}>
                <TextField
                    size="small"
                    placeholder="Search results..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <Search size={14} color={alpha('#111827', 0.3)} />
                            </InputAdornment>
                        ),
                    }}
                    sx={{
                        width: 220,
                        '& .MuiOutlinedInput-root': {
                            borderRadius: '8px',
                            bgcolor: alpha('#f8fafc', 0.8),
                            fontSize: '0.8rem',
                            '& fieldset': { borderColor: alpha('#111827', 0.06) },
                            '&:hover fieldset': { borderColor: alpha('#111827', 0.12) },
                            '&.Mui-focused fieldset': { borderColor: alpha('#111827', 0.2) },
                        }
                    }}
                />
                <Stack direction="row" spacing={0.5} alignItems="center">
                    {isDataSource && (
                        <SleekButton
                            size="small"
                            variant="light"
                            startIcon={<FileUp size={14} />}
                            onClick={() => fileInputRef.current?.click()}
                            sx={{ fontSize: '0.72rem', py: 0.4, height: 30 }}
                        >
                            Upload
                        </SleekButton>
                    )}
                    {isTransform && (
                        <Box sx={{
                            display: 'flex', alignItems: 'center', gap: 0.5,
                            px: 1, py: 0.4, borderRadius: '5px',
                            bgcolor: alpha('#111827', 0.03),
                            border: '1px solid', borderColor: alpha('#111827', 0.06),
                        }}>
                            <Info size={11} color={alpha('#111827', 0.35)} />
                            <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: alpha('#111827', 0.4), textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                                Workflow Output
                            </Typography>
                        </Box>
                    )}
                    <Tooltip title="Filter columns" arrow>
                        <IconButton
                            size="small"
                            onClick={(e) => setFilterAnchor(e.currentTarget)}
                            sx={{
                                p: '4px', borderRadius: '6px',
                                color: activeFilterCount > 0 ? '#111827' : alpha('#111827', 0.3),
                                bgcolor: activeFilterCount > 0 ? alpha('#111827', 0.06) : 'transparent',
                                '&:hover': { bgcolor: alpha('#111827', 0.04), color: '#111827' },
                            }}
                        >
                            <Filter size={15} />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Download CSV" arrow>
                        <IconButton
                            size="small"
                            onClick={handleDownloadCsv}
                            disabled={filteredData.length === 0}
                            sx={{
                                p: '4px', borderRadius: '6px',
                                color: alpha('#111827', 0.3),
                                '&:hover': { bgcolor: alpha('#111827', 0.04), color: '#111827' },
                                '&.Mui-disabled': { color: alpha('#111827', 0.1) },
                            }}
                        >
                            <Download size={15} />
                        </IconButton>
                    </Tooltip>
                </Stack>

                {/* Filter Popover */}
                <Popover
                    open={Boolean(filterAnchor)}
                    anchorEl={filterAnchor}
                    onClose={() => setFilterAnchor(null)}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                    PaperProps={{
                        sx: {
                            mt: 0.5, p: 2, borderRadius: '10px', minWidth: 260,
                            boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                            border: '1px solid', borderColor: alpha('#111827', 0.06),
                        }
                    }}
                >
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                        <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#111827' }}>
                            Column Filters
                        </Typography>
                        {activeFilterCount > 0 && (
                            <Chip
                                label="Clear all"
                                size="small"
                                onClick={() => setColumnFilters({})}
                                deleteIcon={<X size={12} />}
                                onDelete={() => setColumnFilters({})}
                                sx={{ height: 22, fontSize: '0.65rem', fontWeight: 600 }}
                            />
                        )}
                    </Stack>
                    <Stack spacing={1.2}>
                        {columns.slice(0, 8).map(col => (
                            <TextField
                                key={col.id}
                                size="small"
                                placeholder={col.label}
                                value={columnFilters[col.id] || ''}
                                onChange={(e) => setColumnFilters(prev => ({ ...prev, [col.id]: e.target.value }))}
                                InputProps={{
                                    endAdornment: columnFilters[col.id] ? (
                                        <InputAdornment position="end">
                                            <IconButton size="small" onClick={() => setColumnFilters(prev => ({ ...prev, [col.id]: '' }))} sx={{ p: '2px' }}>
                                                <X size={12} />
                                            </IconButton>
                                        </InputAdornment>
                                    ) : null
                                }}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: '6px', fontSize: '0.75rem',
                                        '& fieldset': { borderColor: alpha('#111827', 0.08) },
                                        '&:hover fieldset': { borderColor: alpha('#111827', 0.15) },
                                        '&.Mui-focused fieldset': { borderColor: alpha('#111827', 0.25) },
                                    },
                                    '& .MuiInputBase-input::placeholder': { fontSize: '0.7rem' },
                                }}
                            />
                        ))}
                    </Stack>
                </Popover>
            </Box>

            <Box sx={{ flexGrow: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                {nodeOutputLoading ? (
                    <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, bgcolor: 'rgba(255,255,255,0.7)' }}>
                        <CircularProgress size={20} />
                    </Box>
                ) : null}

                {rows.length === 0 && !nodeOutputLoading ? (
                    <Box sx={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        p: 4,
                        textAlign: 'center',
                        color: alpha('#111827', 0.3)
                    }}>
                        <Database size={28} strokeWidth={1.5} style={{ marginBottom: 10 }} />
                        <Typography sx={{ fontSize: '0.78rem', fontWeight: 600 }}>No results found</Typography>
                        <Typography sx={{ fontSize: '0.68rem', mt: 0.3 }}>
                            {isTransform
                                ? "Execute the workflow from the designer first."
                                : "The connected table is currently empty."}
                        </Typography>
                    </Box>
                ) : (
                    <CyberTable
                        columns={columns}
                        rows={filteredData}
                        isLoading={rowsLoading}
                        totalCount={filteredData.length}
                        page={page}
                        rowsPerPage={rowsPerPage}
                        onPageChange={(_, p) => setPage(p)}
                        onRowsPerPageChange={(e) => setRowsPerPage(parseInt(e.target.value, 10))}
                        compact
                    />
                )}
            </Box>

            <DataValidationModal
                open={validationModalOpen}
                onClose={() => {
                    setValidationModalOpen(false);
                    setSelectedFile(null);
                }}
                validationData={validateMutation.data}
                isLoading={validateMutation.isPending}
                onConfirm={handleConfirmUpload}
                isUploading={uploadMutation.isPending}
            />

            <Snackbar
                open={!!error}
                autoHideDuration={6000}
                onClose={() => setError(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert severity="error" variant="filled" icon={<AlertCircle size={18} />}>
                    {error}
                </Alert>
            </Snackbar>

            <Snackbar
                open={uploadSuccess}
                autoHideDuration={3000}
                onClose={() => setUploadSuccess(false)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert severity="success" variant="filled">
                    Data uploaded and processed successfully!
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default TableWidget;
