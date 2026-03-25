import { Box, styled, alpha } from '@mui/material';

const LoaderRoot = styled(Box)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing(4),
}));

const Spinner = styled(Box)(({ theme }) => ({
    width: '40px',
    height: '40px',
    border: `3px solid ${alpha(theme.palette.primary.main, 0.1)}`,
    borderTop: `3px solid ${theme.palette.primary.main}`,
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    boxShadow: `0 0 15px ${alpha(theme.palette.primary.main, 0.2)}`,
    '@keyframes spin': {
        '0%': { transform: 'rotate(0deg)' },
        '100%': { transform: 'rotate(360deg)' },
    },
}));

const PulseDot = styled(Box)(({ theme }) => ({
    width: '12px',
    height: '12px',
    backgroundColor: theme.palette.secondary.main,
    borderRadius: '50%',
    marginTop: theme.spacing(2),
    animation: 'pulse 1.5s infinite ease-in-out',
    boxShadow: `0 0 10px ${alpha(theme.palette.secondary.main, 0.5)}`,
    '@keyframes pulse': {
        '0%': { transform: 'scale(1)', opacity: 0.5 },
        '50%': { transform: 'scale(1.5)', opacity: 1 },
        '100%': { transform: 'scale(1)', opacity: 0.5 },
    },
}));

export const LoadingSpinner: React.FC = () => {
    return (
        <LoaderRoot>
            <Spinner />
            <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                <PulseDot sx={{ animationDelay: '0s' }} />
                <PulseDot sx={{ animationDelay: '0.2s' }} />
                <PulseDot sx={{ animationDelay: '0.4s' }} />
            </Box>
        </LoaderRoot>
    );
};

export default LoadingSpinner;
