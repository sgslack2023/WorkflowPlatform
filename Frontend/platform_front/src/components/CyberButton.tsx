import React from 'react';
import { Button, styled, alpha, CircularProgress } from '@mui/material';
import type { ButtonProps } from '@mui/material';

interface CyberButtonProps extends ButtonProps {
    glowColor?: string;
    neon?: boolean;
    isLoading?: boolean;
}

const StyledButton = styled(Button, {
    shouldForwardProp: (prop) => prop !== 'glowColor' && prop !== 'neon' && prop !== 'isLoading',
})<CyberButtonProps>(({ theme, glowColor, neon, variant, isLoading }) => {
    const color = glowColor || theme.palette.primary.main;

    return {
        borderRadius: '8px',
        padding: '8px 20px',
        fontWeight: 600,
        letterSpacing: '0.05em',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        overflow: 'hidden',
        pointerEvents: isLoading ? 'none' : 'auto',

        ...(variant === 'contained' && {
            background: `linear-gradient(45deg, ${color}, ${alpha(theme.palette.secondary.main, 0.8)})`,
            boxShadow: neon ? `0 0 15px ${alpha(color, 0.4)}` : 'none',
            '&:hover': {
                background: `linear-gradient(45deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.dark})`,
                boxShadow: `0 0 25px ${alpha(color, 0.6)}`,
                transform: 'translateY(-2px)',
            },
        }),

        ...(variant === 'outlined' && {
            border: `1px solid ${alpha(color, 0.5)}`,
            backgroundColor: 'transparent',
            color: color,
            '&:hover': {
                borderColor: color,
                backgroundColor: alpha(color, 0.05),
                boxShadow: `0 0 15px ${alpha(color, 0.3)}`,
                transform: 'translateY(-1px)',
            },
        }),

        ...(variant === 'text' && {
            color: color,
            '&:hover': {
                backgroundColor: alpha(color, 0.1),
                transform: 'scale(1.02)',
            },
        }),
    };
});

export const CyberButton: React.FC<CyberButtonProps> = ({ children, isLoading, disabled, ...props }) => {
    return (
        <StyledButton disabled={disabled || isLoading} isLoading={isLoading} {...props}>
            {isLoading ? <CircularProgress size={24} color="inherit" /> : children}
        </StyledButton>
    );
};

export default CyberButton;
