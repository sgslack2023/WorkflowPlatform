import { Card, styled, alpha } from '@mui/material';
import type { CardProps } from '@mui/material';

interface CyberCardProps extends CardProps {
    noBlur?: boolean;
    glow?: boolean;
}

const StyledCard = styled(Card, {
    shouldForwardProp: (prop) => prop !== 'noBlur' && prop !== 'glow',
})<CyberCardProps>(({ theme, noBlur, glow }) => ({
    background: noBlur
        ? alpha(theme.palette.background.paper, 0.9)
        : alpha(theme.palette.background.paper, 0.6),
    backdropFilter: noBlur ? 'none' : 'blur(16px)',
    WebkitBackdropFilter: noBlur ? 'none' : 'blur(16px)',
    border: `1px solid ${alpha('#ffffff', 0.1)}`,
    borderRadius: '16px',
    boxShadow: glow
        ? `0 8px 32px 0 ${alpha('#000000', 0.8)}, 0 0 12px ${alpha(theme.palette.primary.main, 0.15)}`
        : `0 8px 32px 0 ${alpha('#000000', 0.6)}`,
    transition: 'all 0.3s ease-in-out',
    position: 'relative',
    overflow: 'visible',

    '&:hover': {
        borderColor: alpha(theme.palette.primary.main, 0.3),
        boxShadow: glow
            ? `0 12px 48px 0 ${alpha('#000000', 0.9)}, 0 0 20px ${alpha(theme.palette.primary.main, 0.25)}`
            : `0 12px 48px 0 ${alpha('#000000', 0.7)}`,
    },

    '&::before': glow ? {
        content: '""',
        position: 'absolute',
        top: -1,
        left: -1,
        right: -1,
        bottom: -1,
        background: `linear-gradient(45deg, ${alpha(theme.palette.primary.main, 0.2)}, transparent, ${alpha(theme.palette.secondary.main, 0.2)})`,
        borderRadius: 'inherit',
        zIndex: -1,
        pointerEvents: 'none',
    } : {},
}));

export const CyberCard: React.FC<CyberCardProps> = ({ children, ...props }) => {
    return <StyledCard {...props}>{children}</StyledCard>;
};

export default CyberCard;
