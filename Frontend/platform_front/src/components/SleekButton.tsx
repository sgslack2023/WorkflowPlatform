import React from 'react';
import { Button, styled, CircularProgress } from '@mui/material';
import type { ButtonProps } from '@mui/material';

const StyledButton = styled(Button, {
    shouldForwardProp: (prop) => prop !== 'variant' && prop !== 'color' && prop !== 'themeVariant'
})<{ themeVariant?: 'dark' | 'light' }>(({ themeVariant }) => ({
    textTransform: 'none',
    borderRadius: '6px',
    padding: '8px 20px',
    fontWeight: 600,
    fontSize: '0.85rem',
    letterSpacing: '0.01em',
    transition: 'all 0.15s ease-in-out',
    boxShadow: 'none',
    border: '1px solid transparent',

    ...(themeVariant === 'dark' ? {
        backgroundColor: '#111827',
        color: '#fff',
        borderColor: '#111827',
        '&:hover': {
            backgroundColor: '#000',
            borderColor: '#000',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        },
    } : {
        backgroundColor: '#fff',
        color: '#111827',
        borderColor: '#e2e8f0',
        '&:hover': {
            backgroundColor: '#f8fafc',
            borderColor: '#cbd5e1',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        },
    }),

    '&:active': {
        transform: 'scale(0.98)',
    },

    '&.Mui-disabled': {
        opacity: 0.5,
        background: '#f1f5f9',
        color: '#94a3b8',
        borderColor: '#e2e8f0',
    },
}));

interface SleekButtonProps extends Omit<ButtonProps, 'variant'> {
    loading?: boolean;
    variant?: 'dark' | 'light' | 'contained' | 'outlined';
}

const SleekButton: React.FC<SleekButtonProps> = ({ loading, children, startIcon, disabled, variant = 'dark', ...props }) => {
    // Map MUI variants to our theme variants
    const themeVariant = (variant === 'contained' || variant === 'outlined') ? 'dark' : variant;
    
    return (
        <StyledButton
            {...props}
            themeVariant={themeVariant}
            disabled={disabled || loading}
            startIcon={loading ? <CircularProgress size={14} color="inherit" thickness={6} /> : startIcon}
        >
            {children}
        </StyledButton>
    );
};

export default SleekButton;
