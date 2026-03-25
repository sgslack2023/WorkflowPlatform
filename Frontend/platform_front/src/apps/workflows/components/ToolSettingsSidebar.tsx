import React from 'react';
import {
    Box,
    Typography,
    Stack,
    alpha,
    Divider,
    Drawer,
    IconButton,
    TextField,
    Chip,
    Paper,
    Switch,
} from '@mui/material';
import {
    Wrench,
    X,
    Settings,
    LogIn,
    LogOut,
    ExternalLink,
    Trash2,
} from 'lucide-react';
import SleekButton from '../../../components/SleekButton';
import DeleteConfirmationModal from '../../../components/DeleteConfirmationModal';

interface ToolSettingsSidebarProps {
    open: boolean;
    onClose: () => void;
    toolName: string;
    description?: string;
    inputSchema: any;
    outputSchema: any;
    algoParameters: any;
    isExposedToApps?: boolean;
    onSave: (newParams: any, isExposedToApps: boolean) => void;
    onDelete?: () => void;
}

const ToolSettingsSidebar: React.FC<ToolSettingsSidebarProps> = ({
    open,
    onClose,
    toolName,
    description,
    inputSchema,
    outputSchema,
    algoParameters,
    isExposedToApps,
    onSave,
    onDelete
}) => {
    const [paramsText, setParamsText] = React.useState(JSON.stringify(algoParameters || {}, null, 2));
    const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
    const [isExposed, setIsExposed] = React.useState(isExposedToApps ?? true);

    React.useEffect(() => {
        setParamsText(JSON.stringify(algoParameters || {}, null, 2));
    }, [algoParameters]);

    React.useEffect(() => {
        setIsExposed(isExposedToApps ?? true);
    }, [isExposedToApps]);

    const handleSave = () => {
        try {
            const parsed = JSON.parse(paramsText);
            onSave(parsed, isExposed);
            onClose();
        } catch (e) {
            alert('Invalid JSON in parameters');
        }
    };

    const handleDelete = () => {
        if (onDelete) {
            onDelete();
            setShowDeleteConfirm(false);
            onClose();
        }
    };

    const renderSchema = (schema: any) => {
        if (!schema || (typeof schema === 'object' && Object.keys(schema).length === 0)) {
            return <Typography sx={{ fontSize: '0.7rem', color: alpha('#111827', 0.4), fontStyle: 'italic' }}>No schema defined</Typography>;
        }

        // Handle standard JSON schema properties
        const properties = schema.properties || schema;

        return (
            <Stack spacing={1}>
                {Object.entries(properties).map(([key, value]: [string, any]) => (
                    <Box key={key} sx={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        p: 1,
                        borderRadius: '6px',
                        bgcolor: alpha('#111827', 0.02),
                        border: '1px solid',
                        borderColor: alpha('#111827', 0.04)
                    }}>
                        <Box>
                            <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#111827' }}>{key}</Typography>
                            {value.description && (
                                <Typography sx={{ fontSize: '0.65rem', color: alpha('#111827', 0.5) }}>{value.description}</Typography>
                            )}
                        </Box>
                        <Chip
                            label={value.type || 'any'}
                            size="small"
                            sx={{
                                height: 18,
                                fontSize: '0.6rem',
                                fontWeight: 600,
                                bgcolor: alpha('#111827', 0.05),
                                color: alpha('#111827', 0.6)
                            }}
                        />
                    </Box>
                ))}
            </Stack>
        );
    };

    return (
        <Drawer
            anchor="right"
            open={open}
            onClose={onClose}
            variant="temporary"
            PaperProps={{
                sx: {
                    width: '420px',
                    borderLeft: '1px solid',
                    borderColor: alpha('#111827', 0.06),
                    boxShadow: `-16px 0 32px ${alpha('#111827', 0.05)}`,
                    p: 0,
                    display: 'flex',
                    flexDirection: 'column'
                }
            }}
        >
            {/* Header */}
            <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid', borderColor: alpha('#111827', 0.04) }}>
                <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', color: '#111827' }}>
                    Tool Inspector
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
                title="Delete Tool Node"
                description={`Are you sure you want to remove "${toolName}" from the canvas? This action cannot be undone.`}
            />

            {/* Content Area */}
            <Box sx={{ p: 2, flexGrow: 1, overflowY: 'auto' }}>
                {/* Tool Info Card */}
                <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{
                        p: 1.2,
                        borderRadius: '12px',
                        bgcolor: alpha('#f97316', 0.1),
                        color: '#f97316'
                    }}>
                        <Wrench size={22} />
                    </Box>
                    <Box>
                        <Typography sx={{ fontWeight: 800, color: '#111827', mb: 0.1, fontSize: '1rem' }}>
                            {toolName}
                        </Typography>
                        <Typography sx={{ fontSize: '0.75rem', color: alpha('#111827', 0.5) }}>
                            System Tool
                        </Typography>
                    </Box>
                </Box>

                {description && (
                    <Typography sx={{ fontSize: '0.8rem', color: alpha('#111827', 0.6), mb: 3, lineHeight: 1.5 }}>
                        {description}
                    </Typography>
                )}

                <Box sx={{ mb: 2, p: 1.5, borderRadius: '10px', bgcolor: alpha('#6366f1', 0.03), border: '1px dashed', borderColor: alpha('#6366f1', 0.2), display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                        <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#111827' }}>Expose to Apps</Typography>
                        <Typography sx={{ fontSize: '0.6rem', color: alpha('#111827', 0.5) }}>Make this tool available in App Builder</Typography>
                    </Box>
                    <Switch
                        size="small"
                        checked={isExposed}
                        onChange={(e) => setIsExposed(e.target.checked)}
                        sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': { color: '#f97316' },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#f97316' }
                        }}
                    />
                </Box>

                <Divider sx={{ mb: 3, opacity: 0.06 }} />

                {/* Integration Details Section */}
                <Box sx={{ mb: 4 }}>
                    <Stack spacing={2}>
                        {/* Input Specs */}
                        <Box>
                            <Stack direction="row" alignItems="center" gap={1} sx={{ mb: 1.5 }}>
                                <LogIn size={14} color="#3b82f6" />
                                <Typography sx={{ fontWeight: 700, fontSize: '0.75rem', color: alpha('#111827', 0.4), textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                    Expected Inputs
                                </Typography>
                            </Stack>
                            <Paper variant="outlined" sx={{ p: 1.5, bgcolor: '#fafbfc', borderRadius: '10px', borderColor: alpha('#111827', 0.05) }}>
                                {renderSchema(inputSchema)}
                            </Paper>
                        </Box>

                        {/* Output Specs */}
                        <Box>
                            <Stack direction="row" alignItems="center" gap={1} sx={{ mb: 1.5 }}>
                                <LogOut size={14} color="#10b981" />
                                <Typography sx={{ fontWeight: 700, fontSize: '0.75rem', color: alpha('#111827', 0.4), textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                    Output Produced
                                </Typography>
                            </Stack>
                            <Paper variant="outlined" sx={{ p: 1.5, bgcolor: '#fafbfc', borderRadius: '10px', borderColor: alpha('#111827', 0.05) }}>
                                {renderSchema(outputSchema)}
                            </Paper>
                        </Box>
                    </Stack>
                </Box>

                {/* Configuration Section */}
                <Box sx={{ mb: 3 }}>
                    <Stack direction="row" alignItems="center" gap={1} sx={{ mb: 1.5 }}>
                        <Settings size={14} color="#f97316" />
                        <Typography sx={{ fontWeight: 700, fontSize: '0.75rem', color: alpha('#111827', 0.4), textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            Execution Parameters
                        </Typography>
                    </Stack>

                    <Box sx={{ position: 'relative' }}>
                        <TextField
                            multiline
                            rows={12}
                            fullWidth
                            value={paramsText}
                            onChange={(e) => setParamsText(e.target.value)}
                            placeholder='{ "key": "value" }'
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    fontSize: '0.75rem',
                                    fontFamily: 'monospace',
                                    bgcolor: alpha('#111827', 0.02),
                                    borderRadius: '12px',
                                    fontWeight: 500,
                                    lineHeight: 1.6,
                                    '& fieldset': { borderColor: alpha('#111827', 0.08) },
                                    '&:hover fieldset': { borderColor: alpha('#111827', 0.15) },
                                    '&.Mui-focused fieldset': { borderColor: '#f97316' }
                                }
                            }}
                        />
                        <Box sx={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            p: 0.5,
                            borderRadius: '4px',
                            bgcolor: alpha('#111827', 0.05),
                            color: alpha('#111827', 0.4),
                            display: 'flex'
                        }}>
                            <ExternalLink size={12} />
                        </Box>
                    </Box>
                    <Typography sx={{ fontSize: '0.65rem', color: alpha('#111827', 0.4), mt: 1.5, px: 0.5, fontStyle: 'italic' }}>
                        * These parameters are injected into the tool during workflow execution.
                    </Typography>
                </Box>
            </Box>

            {/* Footer Actions */}
            <Box sx={{ p: 2, borderTop: '1px solid', borderColor: alpha('#111827', 0.04), bgcolor: '#fafbfc' }}>
                <SleekButton
                    fullWidth
                    variant="dark"
                    onClick={handleSave}
                    sx={{
                        bgcolor: '#f97316',
                        '&:hover': { bgcolor: '#ea580c' },
                        py: 1.2
                    }}
                >
                    Update Tool Node
                </SleekButton>
            </Box>
        </Drawer>
    );
};

export default ToolSettingsSidebar;
