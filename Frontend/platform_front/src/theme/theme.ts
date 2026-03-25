import { createTheme } from '@mui/material/styles';

const theme = createTheme({
    palette: {
        mode: 'light',
        primary: {
            main: '#6366f1', // Indigo
            light: '#818cf8',
            dark: '#4f46e5',
        },
        secondary: {
            main: '#ec4899', // Pink
        },
        background: {
            default: '#f8fafc',
            paper: '#ffffff',
        },
        text: {
            primary: '#1e293b',
            secondary: '#64748b',
        },
        divider: 'rgba(0, 0, 0, 0.08)',
    },
    typography: {
        fontFamily: '"Inter", "Outfit", sans-serif',
        htmlFontSize: 14, // Scale down the base
        h1: { fontSize: '2rem', fontWeight: 800 },
        h2: { fontSize: '1.75rem', fontWeight: 800 },
        h3: { fontSize: '1.5rem', fontWeight: 800 },
        h4: { fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em' },
        h5: { fontSize: '1.1rem', fontWeight: 800 },
        h6: { fontSize: '1rem', fontWeight: 800 },
        body1: { fontSize: '0.9rem' },
        body2: { fontSize: '0.8rem' },
        button: { fontSize: '0.8rem' },
        overline: { fontSize: '0.7rem' },
        caption: { fontSize: '0.7rem' },
    },
    shape: {
        borderRadius: 10,
    },
    components: {
        MuiCssBaseline: {
            styleOverrides: `
                :root {
                    --global-font-scale: 0.92;
                }
                html {
                    font-size: calc(14px * var(--global-font-scale));
                }
            `,
        },
        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: 'none',
                    fontWeight: 600,
                    padding: '6px 16px', // More compact
                    boxShadow: 'none',
                    '&:hover': {
                        boxShadow: 'none',
                    },
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundImage: 'none',
                    boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
                },
            },
        },
    },
});

export default theme;
