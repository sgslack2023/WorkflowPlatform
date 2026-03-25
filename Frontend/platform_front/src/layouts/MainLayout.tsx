import React from 'react';
import { Box } from '@mui/material';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

const MainLayout: React.FC = () => {
    return (
        <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: 'background.default' }}>
            {/* Fixed Thin Sidebar */}
            <Sidebar />

            {/* Main Content Area */}
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    ml: '48px', // Matches ultra-thin sidebar width
                    minHeight: '100vh'
                }}
            >
                <Outlet />
            </Box>
        </Box>
    );
};

export default MainLayout;
