import React from 'react';
import { Box, Container } from '@mui/material';
import { Outlet } from 'react-router-dom';

const AuthLayout: React.FC = () => {
    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'background.default',
                py: 4,
            }}
        >
            <Container maxWidth="xs">
                <Outlet />
            </Container>
        </Box>
    );
};

export default AuthLayout;
