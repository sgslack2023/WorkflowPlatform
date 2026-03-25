import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
    Typography,
    styled,
    alpha
} from '@mui/material';
import { X } from 'lucide-react';
// SleekButton removed if unused here

const StyledDialog = styled(Dialog, {
    shouldForwardProp: (prop) => prop !== 'customMaxWidth' && prop !== 'compact',
})<{ customMaxWidth?: string; compact?: boolean }>(({ customMaxWidth, compact }) => ({
    '& .MuiPaper-root': {
        borderRadius: '16px',
        boxShadow: `0 24px 48px ${alpha('#111827', 0.12)}`,
        padding: '8px',
        width: '100%',
        maxWidth: customMaxWidth || '420px',
        minWidth: customMaxWidth ? `min(calc(100vw - 40px), ${customMaxWidth})` : '420px',
        minHeight: compact ? 'auto' : '580px', // Force consistency for large modals
        display: 'flex',
        flexDirection: 'column',
    },
    '& .MuiDialogContent-root': {
        flexGrow: 1,
        overflowY: 'auto',
        '&::-webkit-scrollbar': { width: '6px' },
        '&::-webkit-scrollbar-track': { background: 'transparent' },
        '&::-webkit-scrollbar-thumb': { background: alpha('#111827', 0.1), borderRadius: '10px' },
        '&::-webkit-scrollbar-thumb:hover': { background: alpha('#111827', 0.2) },
    },
    '& .MuiBackdrop-root': {
        backgroundColor: alpha('#111827', 0.4),
        backdropFilter: 'blur(4px)',
    },
}));

interface SleekModalProps {
    open: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    actions?: React.ReactNode;
    maxWidth?: string;
    compact?: boolean;
}

const SleekModal: React.FC<SleekModalProps> = ({ open, onClose, title, children, actions, maxWidth, compact }) => {
    return (
        <StyledDialog open={open} onClose={onClose} fullWidth customMaxWidth={maxWidth} compact={compact}>
            <DialogTitle sx={{ m: 0, p: 1.5, px: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#111827', fontSize: '0.95rem' }}>
                    {title}
                </Typography>
                <IconButton
                    aria-label="close"
                    onClick={onClose}
                    sx={{
                        p: 0.5,
                        color: alpha('#111827', 0.4),
                        '&:hover': { color: '#111827', backgroundColor: alpha('#111827', 0.05) },
                    }}
                >
                    <X size={18} />
                </IconButton>
            </DialogTitle>
            <DialogContent sx={{ p: 2, pt: 1 }}>
                {children}
            </DialogContent>
            {actions && (
                <DialogActions sx={{ p: 1.5, pt: 0 }}>
                    {actions}
                </DialogActions>
            )}
        </StyledDialog>
    );
};

export default SleekModal;
