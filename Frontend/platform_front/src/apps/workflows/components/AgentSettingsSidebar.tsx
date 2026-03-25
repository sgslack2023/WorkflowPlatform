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
    Switch,
} from '@mui/material';
import {
    Bot,
    X,
    Settings,
    Cpu,
    Zap,
    Trash2,
} from 'lucide-react';
import SleekButton from '../../../components/SleekButton';
import DeleteConfirmationModal from '../../../components/DeleteConfirmationModal';

interface AgentSettingsSidebarProps {
    open: boolean;
    onClose: () => void;
    agentName: string;
    description?: string;
    llmProvider?: string;
    isActive?: boolean;
    algoParameters: any;
    isExposedToApps?: boolean;
    onSave: (newParams: any, isExposedToApps: boolean) => void;
    onDelete?: () => void;
}

const AgentSettingsSidebar: React.FC<AgentSettingsSidebarProps> = ({
    open,
    onClose,
    agentName,
    description,
    llmProvider,
    isActive,
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
                    Agent Settings
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
                title="Delete AI Agent"
                description={`Are you sure you want to remove "${agentName}" from the canvas? This action cannot be undone.`}
            />

            {/* Content Area */}
            <Box sx={{ p: 2, flexGrow: 1, overflowY: 'auto' }}>
                <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{
                        p: 1.2,
                        borderRadius: '12px',
                        bgcolor: alpha('#8b5cf6', 0.1),
                        color: '#8b5cf6'
                    }}>
                        <Bot size={22} />
                    </Box>
                    <Box>
                        <Stack direction="row" spacing={1} alignItems="center">
                            <Typography sx={{ fontWeight: 800, color: '#111827', fontSize: '1rem' }}>
                                {agentName}
                            </Typography>
                            <Chip
                                label={isActive ? "Active" : "Paused"}
                                size="small"
                                sx={{
                                    height: 18,
                                    fontSize: '0.6rem',
                                    bgcolor: isActive ? alpha('#10b981', 0.1) : alpha('#f59e0b', 0.1),
                                    color: isActive ? '#10b981' : '#f59e0b',
                                    fontWeight: 700
                                }}
                            />
                        </Stack>
                        <Typography sx={{ fontSize: '0.75rem', color: alpha('#111827', 0.5) }}>
                            AI Logic Engine
                        </Typography>
                    </Box>
                </Box>

                {description && (
                    <Typography sx={{ fontSize: '0.8rem', color: alpha('#111827', 0.6), mb: 3, lineHeight: 1.5 }}>
                        {description}
                    </Typography>
                )}

                <Divider sx={{ mb: 3, opacity: 0.06 }} />

                {/* Infrastructure Settings */}
                <Box sx={{ mb: 4 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: '0.75rem', color: alpha('#111827', 0.4), textTransform: 'uppercase', letterSpacing: '0.04em', mb: 1.5 }}>
                        Infrastructure & Apps
                    </Typography>
                    <Stack spacing={1.5}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1.5, borderRadius: '10px', bgcolor: alpha('#6366f1', 0.03), border: '1px dashed', borderColor: alpha('#6366f1', 0.2) }}>
                            <Box>
                                <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#111827' }}>Expose to Apps</Typography>
                                <Typography sx={{ fontSize: '0.6rem', color: alpha('#111827', 0.5) }}>Make this agent available in App Builder</Typography>
                            </Box>
                            <Switch
                                size="small"
                                checked={isExposed}
                                onChange={(e) => setIsExposed(e.target.checked)}
                                sx={{
                                    '& .MuiSwitch-switchBase.Mui-checked': { color: '#8b5cf6' },
                                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#8b5cf6' }
                                }}
                            />
                        </Box>

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 1.5, borderRadius: '10px', bgcolor: alpha('#111827', 0.02), border: '1px solid', borderColor: alpha('#111827', 0.04) }}>
                            <Stack direction="row" spacing={1} alignItems="center">
                                <Cpu size={14} color={alpha('#111827', 0.4)} />
                                <Typography sx={{ fontSize: '0.75rem', fontWeight: 600 }}>LLM Provider</Typography>
                            </Stack>
                            <Typography sx={{ fontSize: '0.75rem', color: '#8b5cf6', fontWeight: 700 }}>{llmProvider || 'Unknown'}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 1.5, borderRadius: '10px', bgcolor: alpha('#111827', 0.02), border: '1px solid', borderColor: alpha('#111827', 0.04) }}>
                            <Stack direction="row" spacing={1} alignItems="center">
                                <Zap size={14} color={alpha('#111827', 0.4)} />
                                <Typography sx={{ fontSize: '0.75rem', fontWeight: 600 }}>Inference Mode</Typography>
                            </Stack>
                            <Typography sx={{ fontSize: '0.75rem', color: '#111827', fontWeight: 700 }}>Chain-of-Thought</Typography>
                        </Box>
                    </Stack>
                </Box>

                {/* Configuration Section */}
                <Box sx={{ mb: 3 }}>
                    <Stack direction="row" alignItems="center" gap={1} sx={{ mb: 1.5 }}>
                        <Settings size={14} color="#8b5cf6" />
                        <Typography sx={{ fontWeight: 700, fontSize: '0.75rem', color: alpha('#111827', 0.4), textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            Agent Overrides (JSON)
                        </Typography>
                    </Stack>

                    <TextField
                        multiline
                        rows={10}
                        fullWidth
                        value={paramsText}
                        onChange={(e) => setParamsText(e.target.value)}
                        placeholder='{ "temperature": 0.7, "max_tokens": 1000 }'
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                fontSize: '0.75rem',
                                fontFamily: 'monospace',
                                bgcolor: alpha('#111827', 0.02),
                                borderRadius: '12px',
                                '& fieldset': { borderColor: alpha('#111827', 0.08) },
                                '&.Mui-focused fieldset': { borderColor: '#8b5cf6' }
                            }
                        }}
                    />
                </Box>
            </Box>

            {/* Footer Actions */}
            <Box sx={{ p: 2, borderTop: '1px solid', borderColor: alpha('#111827', 0.04), bgcolor: '#fafbfc' }}>
                <SleekButton
                    fullWidth
                    variant="dark"
                    onClick={handleSave}
                    sx={{
                        bgcolor: '#8b5cf6',
                        '&:hover': { bgcolor: '#7c3aed' },
                        py: 1.2
                    }}
                >
                    Apply Agent Config
                </SleekButton>
            </Box>
        </Drawer>
    );
};

export default AgentSettingsSidebar;
