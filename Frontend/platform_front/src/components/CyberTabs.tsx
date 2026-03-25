import { Tabs, Tab, styled, alpha } from '@mui/material';

export const CyberTabs = styled(Tabs)(({ theme }) => ({
    '& .MuiTabs-indicator': {
        height: '3px',
        borderRadius: '3px',
        backgroundColor: theme.palette.primary.main,
        boxShadow: `0 0 10px ${alpha(theme.palette.primary.main, 0.6)}`,
    },
    '& .MuiTabs-flexContainer': {
        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
    },
}));

export const CyberTab = styled(Tab)(({ theme }) => ({
    textTransform: 'none',
    fontWeight: 600,
    fontSize: '0.9rem',
    marginRight: theme.spacing(2),
    color: alpha(theme.palette.text.primary, 0.6),
    transition: 'all 0.2s ease',
    '&.Mui-selected': {
        color: theme.palette.primary.main,
    },
    '&:hover': {
        color: theme.palette.primary.light,
        backgroundColor: alpha(theme.palette.primary.main, 0.05),
    },
}));
