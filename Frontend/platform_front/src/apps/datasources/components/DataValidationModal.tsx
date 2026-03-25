import React from 'react';
import {
    Box,
    Typography,
    Stack,
    alpha,
    CircularProgress,
    Tabs,
    Tab
} from '@mui/material';
import {
    CheckCircle2,
    AlertCircle,
    Layout,
    FileText
} from 'lucide-react';
import SleekModal from '../../../components/SleekModal';
import SleekButton from '../../../components/SleekButton';
import CyberTable from '../../../components/CyberTable';
import * as XLSX from 'xlsx';

interface DataValidationModalProps {
    open: boolean;
    onClose: () => void;
    validationData: any | null;
    isLoading: boolean;
    onConfirm: (skipErrors?: boolean) => void;
    isUploading: boolean;
}

const StatCard = ({ icon, label, value, color }: { icon: any, label: string, value: number, color: string }) => (
    <Box sx={{
        p: 2,
        borderRadius: '12px',
        bgcolor: alpha(color, 0.04),
        border: '1.5px solid',
        borderColor: alpha(color, 0.1),
        height: '100%'
    }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
            <Box sx={{ color }}>
                {icon}
            </Box>
            <Box>
                <Typography sx={{ fontSize: '0.75rem', color: alpha('#111827', 0.5), fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                    {label}
                </Typography>
                <Typography sx={{ fontSize: '1.1rem', fontWeight: 800, color: '#111827' }}>
                    {value.toLocaleString()}
                </Typography>
            </Box>
        </Stack>
    </Box>
);

const DataValidationModal: React.FC<DataValidationModalProps> = ({
    open,
    onClose,
    validationData,
    isLoading,
    onConfirm,
    isUploading
}) => {
    const [tabValue, setTabValue] = React.useState(0);

    const handleDownloadReport = () => {
        if (!validationData?.error_report_csv) return;

        const link = document.createElement('a');
        link.href = `data:text/csv;base64,${validationData.error_report_csv}`;
        link.download = `validation_errors_${new Date().getTime()}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleClose = () => {
        setTabValue(0);
        onClose();
    };

    const stats = validationData?.stats;
    const schema_match = validationData?.schema_match;
    const preview = validationData?.preview;
    const error_report_csv = validationData?.error_report_csv;

    const previewColumns = React.useMemo(() => {
        const cols = validationData?.columns || [];
        if (!Array.isArray(cols)) return [];
        return cols.map((col: any) => ({
            id: String(col),
            label: String(col).replace(/_/g, ' ').toUpperCase(),
            minWidth: 120,
        }));
    }, [validationData?.columns]);

    const errorColumns = React.useMemo(() => {
        const cols = validationData?.columns || [];
        if (!Array.isArray(cols)) return [];
        return [
            { id: '__validation_errors', label: 'ERROR DETAILS', minWidth: 250 },
            ...cols.map((col: any) => ({
                id: String(col),
                label: String(col).replace(/_/g, ' ').toUpperCase(),
                minWidth: 120,
            }))
        ];
    }, [validationData?.columns]);

    const errorRecords = React.useMemo(() => {
        const b64 = validationData?.error_report_csv;
        if (!b64 || typeof b64 !== 'string') return [];
        try {
            const workbook = XLSX.read(b64, { type: 'base64' });
            if (!workbook || !workbook.SheetNames || workbook.SheetNames.length === 0) return [];
            
            const sheetName = workbook.SheetNames[0];
            const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]) as any[];
            if (!Array.isArray(data)) return [];
            
            return data.slice(0, 50).map((row: any, i: number) => ({ 
                ...row, 
                id: row.id || `err-${i}` 
            }));
        } catch (e) {
            console.error("XLSX Parsing Error:", e);
            return [];
        }
    }, [validationData?.error_report_csv]);

    if (isLoading) {
        return (
            <SleekModal open={open} onClose={handleClose} title="Validating Data...">
                <Box sx={{ py: 8, textAlign: 'center' }}>
                    <CircularProgress size={32} sx={{ color: '#4f46e5', mb: 2 }} />
                    <Typography sx={{ fontSize: '0.9rem', color: alpha('#111827', 0.6) }}>
                        Scanning file structure and verifying types...
                    </Typography>
                </Box>
            </SleekModal>
        );
    }

    if (!validationData && !isLoading) return null;

    return (
        <SleekModal
            open={open}
            onClose={handleClose}
            title="Import Preview & Validation"
            maxWidth="800px"
            actions={
                <Stack direction="row" spacing={1.5} sx={{ width: '100%' }}>
                    <SleekButton variant="light" onClick={handleClose} disabled={isUploading}>
                        Cancel
                    </SleekButton>
                    {error_report_csv && (
                        <SleekButton
                            variant="light"
                            onClick={handleDownloadReport}
                            startIcon={<FileText size={16} />}
                            sx={{ color: '#ef4444', borderColor: alpha('#ef4444', 0.2) }}
                        >
                            Download Error Report
                        </SleekButton>
                    )}
                    <Box sx={{ flexGrow: 1 }} />
                    {stats && stats.invalid > 0 && schema_match && (
                        <SleekButton
                            variant="light"
                            onClick={() => onConfirm(true)}
                            loading={isUploading}
                            sx={{ 
                                color: '#10b981', 
                                borderColor: alpha('#10b981', 0.2),
                                '&:hover': { bgcolor: alpha('#10b981', 0.05) }
                            }}
                        >
                            Proceed with Valid Rows ({stats.valid})
                        </SleekButton>
                    )}
                    <SleekButton
                        variant="dark"
                        onClick={() => onConfirm(false)}
                        loading={isUploading}
                        disabled={!schema_match || (stats?.invalid || 0) > 0}
                    >
                        Confirm & Upload All
                    </SleekButton>
                </Stack>
            }
        >
            <Box sx={{ mb: 3 }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <Box sx={{ flex: 1 }}>
                        <StatCard
                            icon={<FileText size={18} />}
                            label="Total Rows"
                            value={stats?.total || 0}
                            color="#4f46e5"
                        />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                        <StatCard
                            icon={<CheckCircle2 size={18} />}
                            label="Passed"
                            value={stats?.valid || 0}
                            color="#10b981"
                        />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                        <StatCard
                            icon={<AlertCircle size={18} />}
                            label="Failed"
                            value={stats?.invalid || 0}
                            color="#ef4444"
                        />
                    </Box>
                </Stack>
            </Box>



            <Box sx={{ borderBottom: 1, borderColor: alpha('#111827', 0.1), mb: 2 }}>
                <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ minHeight: '40px' }}>
                    <Tab 
                        label="Data Preview" 
                        icon={<Layout size={14} />} 
                        iconPosition="start" 
                        sx={{ fontSize: '0.75rem', fontWeight: 700, minHeight: '40px' }} 
                    />
                    <Tab 
                        label={`Invalid Rows (${stats?.invalid || 0})`} 
                        icon={<AlertCircle size={14} />} 
                        iconPosition="start" 
                        sx={{ 
                            fontSize: '0.75rem', 
                            fontWeight: 700, 
                            minHeight: '40px',
                            color: (stats?.invalid || 0) > 0 ? '#ef4444' : 'inherit'
                        }} 
                        disabled={!stats?.invalid}
                    />
                </Tabs>
            </Box>

            <Box sx={{ mb: 2 }}>
                <Box sx={{ border: '1px solid', borderColor: alpha('#111827', 0.06), borderRadius: '12px', overflow: 'hidden' }}>
                    {tabValue === 0 ? (
                        <CyberTable
                            columns={previewColumns}
                            rows={Array.isArray(preview) ? preview : []}
                            rowsPerPage={10}
                        />
                    ) : (
                        <CyberTable
                            columns={errorColumns}
                            rows={errorRecords}
                            rowsPerPage={10}
                        />
                    )}
                </Box>
                {tabValue === 1 && (stats?.invalid || 0) > 50 && (
                    <Typography variant="caption" sx={{ mt: 1, display: 'block', textAlign: 'center', color: alpha('#111827', 0.4) }}>
                        Showing first 50 errors. Please download the Full Error Report if needed.
                    </Typography>
                )}
            </Box>
        </SleekModal>
    );
};

export default DataValidationModal;
