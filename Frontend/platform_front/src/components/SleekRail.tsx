import React from 'react';
import { Box, Tooltip, Stack, styled, alpha, useTheme } from '@mui/material';
import { NavLink } from 'react-router-dom';
import { LogOut } from 'lucide-react';

const RAIL_WIDTH = 48;

const RailLink = styled(NavLink, {
    shouldForwardProp: (prop) => prop !== 'variant'
})<{ variant: 'dark' | 'light' }>(({ theme, variant }) => ({
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: variant === 'dark' ? alpha('#fff', 0.6) : theme.palette.text.secondary,
    transition: 'all 0.2s ease',
    textDecoration: 'none',
    '&:hover': {
        backgroundColor: variant === 'dark' ? alpha('#fff', 0.1) : alpha(theme.palette.primary.main, 0.05),
        color: variant === 'dark' ? '#fff' : theme.palette.primary.main,
    },
    '&.active': {
        backgroundColor: theme.palette.primary.main,
        color: '#fff',
        boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.4)}`,
    },
}));

export interface RailItem {
    icon: React.ReactNode;
    label: string;
    path: string;
}

interface SleekRailProps {
    items: RailItem[];
    header?: React.ReactNode;
    footerItem?: RailItem;
    variant?: 'dark' | 'light';
    onItemClick?: (path: string) => void;
    onLogout?: () => void;
    sx?: object;
}

const SleekRail: React.FC<SleekRailProps> = ({ items, header, footerItem, variant = 'light', onItemClick, onLogout, sx }) => {
    const theme = useTheme();

    const bgColor = variant === 'dark' ? '#111827' : '#fff';
    const borderColor = variant === 'dark' ? alpha('#fff', 0.1) : theme.palette.divider;

    return (
        <Box
            sx={{
                width: RAIL_WIDTH,
                height: '100vh',
                backgroundColor: bgColor,
                borderRight: '1px solid',
                borderColor: borderColor,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                paddingY: 3,
                flexShrink: 0,

                // Slower, more gradual entry
                animation: 'railEntry 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                '@keyframes railEntry': {
                    '0%': {
                        transform: 'translateX(-20px)',
                        opacity: 0,
                    },
                    '100%': {
                        transform: 'translateX(0)',
                        opacity: 1,
                    }
                },
                ...sx
            }}
        >
            {header && (
                <Box
                    sx={{
                        mb: 4,
                        animation: 'itemFadeIn 0.8s ease-out forwards 0.2s',
                        opacity: 0,
                        '@keyframes itemFadeIn': {
                            to: { opacity: 1 }
                        }
                    }}
                >
                    {header}
                </Box>
            )}

            <Stack spacing={2} sx={{ flexGrow: 1 }}>
                {items.map((item, index) => (
                    <Tooltip key={item.path} title={item.label} placement="right" arrow>
                        <Box
                            sx={{
                                opacity: 0,
                                transform: 'scale(0.9)',
                                animation: 'staggerIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
                                animationDelay: `${0.3 + (index * 0.1)}s`,
                                '@keyframes staggerIn': {
                                    to: { opacity: 1, transform: 'scale(1)' }
                                }
                            }}
                        >
                            <RailLink to={item.path} variant={variant} onClick={() => onItemClick?.(item.path)}>
                                {item.icon}
                            </RailLink>
                        </Box>
                    </Tooltip>
                ))}
            </Stack>

            {footerItem && (
                <Tooltip title={footerItem.label} placement="right" arrow>
                    <Box
                        sx={{
                            opacity: 0,
                            animation: 'itemFadeIn 0.8s ease-out forwards 0.6s',
                            '@keyframes itemFadeIn': {
                                to: { opacity: 1 }
                            }
                        }}
                    >
                        <RailLink to={footerItem.path} variant={variant}>
                            {footerItem.icon}
                        </RailLink>
                    </Box>
                </Tooltip>
            )}

            {onLogout && (
                <Tooltip title="Log Out" placement="right" arrow>
                    <Box
                        sx={{
                            mt: 2,
                            opacity: 0,
                            animation: 'itemFadeIn 0.8s ease-out forwards 0.7s',
                            '@keyframes itemFadeIn': {
                                to: { opacity: 1 }
                            }
                        }}
                    >
                        <Box
                            onClick={onLogout}
                            sx={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                color: variant === 'dark' ? alpha('#fff', 0.6) : theme.palette.text.secondary,
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                    backgroundColor: variant === 'dark' ? alpha('#fff', 0.1) : alpha(theme.palette.error.main, 0.1),
                                    color: theme.palette.error.main,
                                },
                            }}
                        >
                            <LogOut size={18} />
                        </Box>
                    </Box>
                </Tooltip>
            )}
        </Box>
    );
};

export default SleekRail;
