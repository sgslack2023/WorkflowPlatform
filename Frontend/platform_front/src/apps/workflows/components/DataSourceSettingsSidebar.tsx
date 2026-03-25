import React from 'react';
import {
    Box,
    Typography,
    Stack,
    alpha,
    CircularProgress,
    Divider,
    Drawer,
    IconButton,
    Switch,
} from '@mui/material';
import {
    Database,
    Clock,
    CheckCircle2,
    Table as TableIcon,
    FileUp,
    Download,
    X,
    ChevronRight,
    Trash2
} from 'lucide-react';
import { useDynamicTables } from '../../datasources/api/queries';
import SleekButton from '../../../components/SleekButton';
import DeleteConfirmationModal from '../../../components/DeleteConfirmationModal';

interface DataSourceSettingsSidebarProps {
    open: boolean;
    onClose: () => void;
    dataSourceId: string;
    dataSourceName: string;
    sourceType?: string;
    onTableClick: (table: any) => void;
    isExposedToApps?: boolean;
    onExposeChange?: (exposed: boolean) => void;
    onDelete?: () => void;
}

const DataSourceSettingsSidebar: React.FC<DataSourceSettingsSidebarProps> = ({
    open,
    onClose,
    dataSourceId,
    dataSourceName,
    sourceType,
    onTableClick,
    isExposedToApps,
    onExposeChange,
    onDelete
}) => {
    const { data: tables = [], isLoading } = useDynamicTables({ datasource_id: dataSourceId });
    const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);

    const handleDelete = () => {
        if (onDelete) {
            onDelete();
            setShowDeleteConfirm(false);
            onClose();
        }
    };

    return (
        <Drawer
            anchor="right"
            open={open}
            onClose={onClose}
            variant="persistent"
            PaperProps={{
                sx: {
                    width: '420px',
                    borderLeft: '1px solid',
                    borderColor: alpha('#111827', 0.06),
                    boxShadow: `-16px 0 32px ${alpha('#111827', 0.05)}`,
                    p: 0,
                    height: '100vh',
                    top: 0,
                }
            }}
        >
            <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid', borderColor: alpha('#111827', 0.04) }}>
                <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', color: '#111827' }}>
                    Source Settings
                </Typography>
                <Stack direction="row" spacing={0.5} alignItems="center">
                    {onDelete && (
                        <IconButton
                            onClick={() => setShowDeleteConfirm(true)}
                            size="small"
                            sx={{ color: alpha('#ef4444', 0.6), '&:hover': { color: '#ef4444', bgcolor: alpha('#ef4444', 0.05) } }}
                        >
                            <Trash2 size={16} />
                        </IconButton>
                    )}
                    <IconButton onClick={onClose} size="small">
                        <X size={18} />
                    </IconButton>
                </Stack>
            </Box>

            <DeleteConfirmationModal
                open={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={handleDelete}
                title="Delete Data Source"
                description={`Are you sure you want to remove "${dataSourceName}" from the canvas? This action cannot be undone.`}
            />

            <Box sx={{ p: 2 }}>
                <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{
                        p: 1.2,
                        borderRadius: '10px',
                        bgcolor: alpha('#3b82f6', 0.1),
                        color: '#3b82f6'
                    }}>
                        <Database size={20} />
                    </Box>
                    <Box>
                        <Typography sx={{ fontWeight: 700, color: '#111827', mb: 0.1, fontSize: '0.9rem' }}>
                            {dataSourceName}
                        </Typography>
                        <Typography sx={{ fontSize: '0.75rem', color: alpha('#111827', 0.5), textTransform: 'capitalize' }}>
                            {sourceType || 'Data Source'}
                        </Typography>
                    </Box>
                </Box>

                <Box sx={{ mb: 2, p: 1.5, borderRadius: '10px', bgcolor: alpha('#3b82f6', 0.03), border: '1px dashed', borderColor: alpha('#3b82f6', 0.2), display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                        <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#111827' }}>Expose to Apps</Typography>
                        <Typography sx={{ fontSize: '0.6rem', color: alpha('#111827', 0.5) }}>Make this source available in App Builder</Typography>
                    </Box>
                    <Switch
                        size="small"
                        checked={isExposedToApps ?? true}
                        onChange={(e) => onExposeChange?.(e.target.checked)}
                        sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': { color: '#3b82f6' },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#3b82f6' }
                        }}
                    />
                </Box>

                <Divider sx={{ mb: 2.5, opacity: 0.06 }} />

                <Box sx={{ mb: 3 }}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
                        <Typography sx={{ fontWeight: 700, fontSize: '0.8rem', color: alpha('#111827', 0.4), textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            Physical Sync
                        </Typography>
                        <Stack direction="row" spacing={1}>
                            {(sourceType === 'csv' || sourceType === 'xls' || sourceType === 'xlsx') ? (
                                <SleekButton
                                    variant="dark"
                                    size="small"
                                    startIcon={<FileUp size={14} />}
                                    sx={{ fontSize: '0.75rem', py: 0.5 }}
                                    onClick={() => {
                                        if (tables && tables.length > 0) {
                                            onTableClick(tables[0]);
                                        }
                                    }}
                                >
                                    Upload CSV
                                </SleekButton>
                            ) : (
                                <SleekButton variant="dark" size="small" startIcon={<Download size={14} />} sx={{ fontSize: '0.75rem', py: 0.5 }}>
                                    Fetch Tables
                                </SleekButton>
                            )}
                        </Stack>
                    </Stack>
                </Box>

                <Box>
                    <Typography sx={{ fontWeight: 700, fontSize: '0.8rem', color: alpha('#111827', 0.4), textTransform: 'uppercase', letterSpacing: '0.04em', mb: 1.5 }}>
                        Mapped Tables
                    </Typography>

                    {isLoading ? (
                        <Box sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
                            <CircularProgress size={20} sx={{ color: '#3b82f6' }} />
                        </Box>
                    ) : tables && tables.length > 0 ? (
                        <Stack spacing={1}>
                            {tables.map((table: any) => (
                                <Box
                                    key={table.id}
                                    onClick={() => onTableClick(table)}
                                    sx={{
                                        p: 1.5,
                                        borderRadius: '10px',
                                        border: '1.5px solid',
                                        borderColor: alpha('#111827', 0.03),
                                        bgcolor: '#fafbfc',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1.5,
                                        cursor: 'pointer',
                                        transition: 'all 0.15s ease',
                                        '&:hover': {
                                            borderColor: alpha('#3b82f6', 0.2),
                                            bgcolor: '#fff',
                                            transform: 'translateX(4px)',
                                            boxShadow: `0 4px 12px ${alpha('#111827', 0.03)}`
                                        }
                                    }}
                                >
                                    <Box sx={{ p: 0.8, borderRadius: '6px', bgcolor: alpha('#111827', 0.04), color: alpha('#111827', 0.5) }}>
                                        <TableIcon size={16} />
                                    </Box>
                                    <Box sx={{ flexGrow: 1 }}>
                                        <Typography sx={{ fontWeight: 600, fontSize: '0.8rem', color: '#111827' }}>
                                            {table.name}
                                        </Typography>
                                        <Stack direction="row" spacing={1.5} sx={{ mt: 0.2 }}>
                                            <Stack direction="row" spacing={0.4} alignItems="center" sx={{ fontSize: '0.65rem', color: alpha('#111827', 0.4) }}>
                                                <Clock size={10} />
                                                <span>{new Date(table.updated_at).toLocaleDateString()}</span>
                                            </Stack>
                                            <Stack direction="row" spacing={0.4} alignItems="center" sx={{ fontSize: '0.65rem', color: '#10b981' }}>
                                                <CheckCircle2 size={10} />
                                                <span>Synced</span>
                                            </Stack>
                                        </Stack>
                                    </Box>
                                    <ChevronRight size={14} color={alpha('#111827', 0.2)} />
                                </Box>
                            ))}
                        </Stack>
                    ) : (
                        <Box sx={{
                            py: 4,
                            textAlign: 'center',
                            borderRadius: '10px',
                            border: '1px dashed',
                            borderColor: alpha('#111827', 0.08)
                        }}>
                            <TableIcon size={24} strokeWidth={1} style={{ marginBottom: 4, opacity: 0.3 }} />
                            <Typography sx={{ fontSize: '0.75rem', color: alpha('#111827', 0.4) }}>
                                No tables mapped yet.
                            </Typography>
                        </Box>
                    )}
                </Box>
            </Box>
        </Drawer>
    );
};

export default DataSourceSettingsSidebar;
