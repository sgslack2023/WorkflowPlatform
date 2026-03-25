import React from 'react';
import { Box, Typography } from '@mui/material';
import { AlertTriangle } from 'lucide-react';
import SleekModal from './SleekModal';
import SleekButton from './SleekButton';

interface DeleteConfirmationModalProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    isDeleting?: boolean;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
    open,
    onClose,
    onConfirm,
    title,
    description,
    isDeleting
}) => {
    return (
        <SleekModal
            open={open}
            onClose={onClose}
            title={title}
            maxWidth="400px"
            compact
        >
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    <Box sx={{
                        p: 1.5,
                        borderRadius: '50%',
                        bgcolor: 'error.lighter', // You might need to adjust this color if not in theme
                        color: 'error.main',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                    }}>
                        <AlertTriangle size={24} />
                    </Box>
                    <Box>
                        <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.primary', mb: 0.5 }}>
                            Are you sure?
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {description}
                        </Typography>
                    </Box>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 1 }}>
                    <SleekButton variant="light" onClick={onClose} disabled={isDeleting}>
                        Cancel
                    </SleekButton>
                    <SleekButton
                        onClick={onConfirm}
                        variant="dark"
                        loading={isDeleting}
                        sx={{ bgcolor: '#ef4444', '&:hover': { bgcolor: '#dc2626' } }}
                    >
                        Delete
                    </SleekButton>
                </Box>
            </Box>
        </SleekModal>
    );
};

export default DeleteConfirmationModal;
