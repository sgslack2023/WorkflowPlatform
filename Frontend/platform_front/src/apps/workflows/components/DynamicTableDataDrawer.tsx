import React, { useMemo, useState, useRef } from 'react';
import {
    Box,
    Typography,
    Stack,
    alpha,
    Drawer,
    IconButton,
    CircularProgress,
    Alert,
} from '@mui/material';
import {
    X,
    Table as TableIcon,
    Download,
    Columns,
    FileUp,
    Trash2
} from 'lucide-react';
import { useDynamicTableRows, useValidateUpload, useUploadFile, useClearTableRows } from '../../datasources/api/queries';
import CyberTable from '../../../components/CyberTable';
import SleekButton from '../../../components/SleekButton';
import SleekModal from '../../../components/SleekModal';
import DataValidationModal from '../../datasources/components/DataValidationModal.tsx';
import { useQueryClient } from '@tanstack/react-query';

interface DynamicTableDataDrawerProps {
    open: boolean;
    onClose: () => void;
    table?: any | null;
    isSettingsOpen?: boolean;
    previewData?: { columns: any[], rows: any[] } | null;
}

const DynamicTableDataDrawer: React.FC<DynamicTableDataDrawerProps> = ({
    open,
    onClose,
    table,
    isSettingsOpen,
    previewData
}) => {
    const queryClient = useQueryClient();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [validationModalOpen, setValidationModalOpen] = useState(false);
    const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const { data: fetchRows, isLoading: isFetching } = useDynamicTableRows(table?.id || '', { limit: 50 });

    // Determine rows: either from fetch or preview
    const rows = (previewData ? previewData.rows : fetchRows) as any[];
    const isLoading = previewData ? false : isFetching;

    const validateMutation = useValidateUpload();
    const uploadMutation = useUploadFile();
    const clearMutation = useClearTableRows();

    const columns = useMemo(() => {
        if (previewData) {
            return previewData.columns.map((col: any) => ({
                id: col.name,
                label: col.name.replace(/_/g, ' ').toUpperCase(),
                minWidth: 80,
            }));
        }
        if (!table?.schema_definition?.columns) return [];
        return table.schema_definition.columns.map((col: any) => ({
            id: col.name,
            label: col.name.replace(/_/g, ' ').toUpperCase(),
            minWidth: 80,
        }));
    }, [table, previewData]);

    const handleClearRows = async () => {
        if (!table) return;

        clearMutation.mutate(table.id, {
            onSuccess: () => {
                setErrorMessage(null);
                setClearConfirmOpen(false);
                queryClient.invalidateQueries({ queryKey: ['dynamicTableRows', table.id] });
            },
            onError: (err: any) => {
                setErrorMessage(err.response?.data?.error || 'Failed to clear rows');
            }
        });
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !table) return;

        console.log('File selected:', file.name);
        setErrorMessage(null);
        setSelectedFile(file);
        setValidationModalOpen(true);

        validateMutation.mutate({ tableId: table.id, file }, {
            onSuccess: () => {
                // Reset file input so same file can be selected again
                if (fileInputRef.current) fileInputRef.current.value = '';
            },
            onError: (err: any) => {
                setErrorMessage(err.response?.data?.error || 'Validation failed');
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        });
    };

    const handleConfirmUpload = async (skipErrors: boolean = false) => {
        if (!selectedFile || !table) return;

        uploadMutation.mutate({ tableId: table.id, file: selectedFile, skipErrors }, {
            onSuccess: () => {
                setValidationModalOpen(false);
                setSelectedFile(null);
                queryClient.invalidateQueries({ queryKey: ['dynamicTableRows', table.id] });
            },
            onError: (err: any) => {
                setErrorMessage(err.response?.data?.error || 'Upload failed');
            }
        });
    };

    const handleExportCsv = () => {
        if (!rows || rows.length === 0 || columns.length === 0) return;
        
        const header = columns.map((c: { id: string; label: string; minWidth: number }) => c.id).join(',');
        const csvRows = rows.map((row: any) =>
            columns.map((c: { id: string; label: string; minWidth: number }) => {
                const val = row[c.id];
                const str = val === null || val === undefined ? '' : String(val);
                // Escape commas, quotes, and newlines
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
        const filename = previewData 
            ? `preview_${new Date().toISOString().slice(0, 10)}.csv`
            : `${table?.name || 'data'}_${new Date().toISOString().slice(0, 10)}.csv`;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
    };

    return (
        <>
            <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept=".csv,.xlsx,.xls"
                onChange={handleFileChange}
            />

            <Drawer
                anchor="bottom"
                open={open}
                onClose={onClose}
                variant="persistent"
                sx={{ zIndex: 1200 }}
                PaperProps={{
                    sx: {
                        height: '50vh',
                        width: isSettingsOpen ? 'calc(100% - 468px) !important' : 'calc(100% - 48px) !important',
                        borderTop: '1px solid #e2e8f0',
                        boxShadow: `0 -4px 20px ${alpha('#000', 0.05)}`,
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        left: '48px !important',
                        right: isSettingsOpen ? '420px !important' : '0 !important',
                        backgroundColor: '#fff',
                        boxSizing: 'border-box'
                    }
                }}
            >
                <Box sx={{
                    p: 1.5,
                    px: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    bgcolor: '#fff',
                    borderBottom: '1px solid',
                    borderColor: alpha('#111827', 0.08)
                }}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                        <Box sx={{ p: 0.8, borderRadius: '8px', bgcolor: alpha('#3b82f6', 0.1), color: '#3b82f6' }}>
                            <TableIcon size={18} />
                        </Box>
                        <Box>
                            <Typography sx={{ fontWeight: 800, fontSize: '0.8rem', color: '#1e293b', lineHeight: 1.2 }}>
                                {previewData ? 'TRANSFORMATION PREVIEW' : (table?.name || 'TABLE DATA')}
                            </Typography>
                            <Typography sx={{ fontSize: '0.6rem', color: alpha('#64748b', 0.8), fontWeight: 600, letterSpacing: '0.01em' }}>
                                {previewData ? 'Live execution results' : 'Database samples'}
                            </Typography>
                        </Box>
                    </Stack>
                    <Stack direction="row" spacing={1} alignItems="center">
                        {!previewData && rows && rows.length > 0 && (
                            <SleekButton
                                variant="light"
                                size="small"
                                startIcon={<Trash2 size={14} />}
                                sx={{ fontSize: '0.75rem', px: 1, color: '#ef4444' }}
                                onClick={() => setClearConfirmOpen(true)}
                            >
                                Clear
                            </SleekButton>
                        )}
                        {!previewData && (
                            <SleekButton
                                variant="light"
                                size="small"
                                startIcon={<FileUp size={14} />}
                                sx={{ fontSize: '0.75rem' }}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                Upload Data
                            </SleekButton>
                        )}
                        <SleekButton 
                            variant="light" 
                            size="small" 
                            startIcon={<Download size={14} />} 
                            sx={{ fontSize: '0.75rem' }}
                            onClick={handleExportCsv}
                            disabled={!rows || rows.length === 0}
                        >
                            Export CSV
                        </SleekButton>
                        <IconButton onClick={onClose} size="small">
                            <X size={20} />
                        </IconButton>
                    </Stack>
                </Box>

                <Box sx={{ flexGrow: 1, overflow: 'auto', p: 0 }}>
                    {errorMessage && (
                        <Alert
                            severity="error"
                            onClose={() => setErrorMessage(null)}
                            sx={{ m: 2, borderRadius: '8px' }}
                        >
                            {errorMessage}
                        </Alert>
                    )}

                    {isLoading ? (
                        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                            <CircularProgress size={24} sx={{ color: '#3b82f6', mb: 2 }} />
                            <Typography sx={{ fontSize: '0.8rem', color: alpha('#111827', 0.4) }}>
                                Fetching table rows...
                            </Typography>
                        </Box>
                    ) : columns.length > 0 ? (
                        <>
                            <CyberTable
                                columns={columns}
                                rows={rows || []}
                                rowsPerPage={50}
                            />
                            {(!rows || rows.length === 0) && (
                                <Box sx={{ py: 6, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                    <Columns size={40} strokeWidth={1} style={{ opacity: 0.1, marginBottom: 12 }} />
                                    <Typography sx={{ fontSize: '0.8rem', color: alpha('#111827', 0.4), fontWeight: 600 }}>
                                        No data available in this table
                                    </Typography>
                                    <SleekButton
                                        variant="light"
                                        size="small"
                                        startIcon={<FileUp size={14} />}
                                        sx={{ mt: 1, fontSize: '0.7rem' }}
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        Upload CSV to populate
                                    </SleekButton>
                                </Box>
                            )}
                        </>
                    ) : (
                        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                            <TableIcon size={48} strokeWidth={1} style={{ opacity: 0.1, marginBottom: 12 }} />
                            <Typography sx={{ fontSize: '0.85rem', color: alpha('#111827', 0.4), fontWeight: 600 }}>
                                No Schema Definition
                            </Typography>
                            <Typography sx={{ fontSize: '0.75rem', color: alpha('#111827', 0.3), mt: 0.5, textAlign: 'center', maxWidth: 300 }}>
                                This table has no columns mapped in the database schema. Start by uploading a file or syncing the source.
                            </Typography>
                            <SleekButton
                                variant="dark"
                                size="small"
                                startIcon={<FileUp size={14} />}
                                sx={{ mt: 2, fontSize: '0.75rem' }}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                Upload & Define Schema
                            </SleekButton>
                        </Box>
                    )}
                </Box>
            </Drawer>

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

            <SleekModal
                open={clearConfirmOpen}
                onClose={() => setClearConfirmOpen(false)}
                title="Clear Table Data"
                maxWidth="400px"
                actions={
                    <Stack direction="row" spacing={1.5} sx={{ width: '100%' }}>
                        <SleekButton
                            variant="light"
                            fullWidth
                            onClick={() => setClearConfirmOpen(false)}
                            disabled={clearMutation.isPending}
                        >
                            Cancel
                        </SleekButton>
                        <SleekButton
                            variant="dark"
                            sx={{ bgcolor: '#ef4444', '&:hover': { bgcolor: '#dc2626' } }}
                            fullWidth
                            onClick={handleClearRows}
                            loading={clearMutation.isPending}
                        >
                            Clear All
                        </SleekButton>
                    </Stack>
                }
            >
                <Box sx={{ py: 1 }}>
                    <Typography sx={{ fontSize: '0.85rem', color: alpha('#111827', 0.6), lineHeight: 1.6 }}>
                        Are you sure you want to delete all data from <strong>{table?.name}</strong>?
                        This action is permanent and cannot be undone.
                    </Typography>
                </Box>
            </SleekModal>
        </>
    );
};

export default DynamicTableDataDrawer;
