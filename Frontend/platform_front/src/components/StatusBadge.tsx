import React from 'react';
import { Box, Typography, styled, alpha } from '@mui/material';

export type StatusType = 'success' | 'warning' | 'error' | 'info' | 'pending' | 'running';

interface StatusBadgeProps {
    status: StatusType;
    label?: string;
    glow?: boolean;
}

const getStatusColors = (status: StatusType, theme: any) => {
    switch (status) {
        case 'success': return theme.palette.success.main;
        case 'error': return theme.palette.error.main;
        case 'warning': return theme.palette.warning.main;
        case 'info': return theme.palette.info.main;
        case 'running': return theme.palette.primary.main;
        case 'pending': return theme.palette.text.secondary;
        default: return theme.palette.text.primary;
    }
};

const BadgeRoot = styled(Box, {
    shouldForwardProp: (prop) => prop !== 'status' && prop !== 'glow',
})<{ status: StatusType; glow?: boolean }>(({ theme, status, glow }) => {
    const color = getStatusColors(status, theme);

    return {
        display: 'inline-flex',
        alignItems: 'center',
        padding: '4px 12px',
        borderRadius: '20px',
        backgroundColor: alpha(color, 0.1),
        border: `1px solid ${alpha(color, 0.3)}`,
        color: color,
        boxShadow: glow ? `0 0 10px ${alpha(color, 0.2)}` : 'none',
        transition: 'all 0.2s ease',

        '&:hover': {
            backgroundColor: alpha(color, 0.15),
            boxShadow: `0 0 15px ${alpha(color, 0.3)}`,
        },
    };
});

const Dot = styled(Box, {
    shouldForwardProp: (prop) => prop !== 'status',
})<{ status: StatusType }>(({ theme, status }) => ({
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: getStatusColors(status, theme),
    marginRight: '8px',
    boxShadow: `0 0 8px ${alpha(getStatusColors(status, theme), 0.6)}`,
    ...(status === 'running' && {
        animation: 'pulse 1.5s infinite ease-in-out',
    }),
    '@keyframes pulse': {
        '0%': { transform: 'scale(1)', opacity: 1 },
        '50%': { transform: 'scale(1.2)', opacity: 0.7 },
        '100%': { transform: 'scale(1)', opacity: 1 },
    },
}));

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label, glow = true }) => {
    return (
        <BadgeRoot status={status} glow={glow}>
            <Dot status={status} />
            <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {label || status}
            </Typography>
        </BadgeRoot>
    );
};

export default StatusBadge;
