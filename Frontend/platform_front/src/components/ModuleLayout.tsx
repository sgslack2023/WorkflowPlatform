import React from 'react';
import { Box } from '@mui/material';
import { Outlet, useLocation } from 'react-router-dom';
import SleekRail from './SleekRail';
import type { RailItem } from './SleekRail';
import { useUIStore } from '../store/uiStore';

interface ModuleLayoutProps {
    subMenuItems: RailItem[];
}

const ModuleLayout: React.FC<ModuleLayoutProps> = ({ subMenuItems }) => {
    const isSubRailOpen = useUIStore((state) => state.isSubRailOpen);
    const location = useLocation();

    // Pages that handle their own scrolling and padding (like Designer/Viewer)
    const isFullScreenApp =
        location.pathname.includes('/designer/') ||
        location.pathname.includes('/viewer/') ||
        location.pathname.includes('/canvas/'); // Added canvas for workflow if needed

    return (
        <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
            {/* Secondary White Rail with conditional visibility */}
            <Box
                sx={{
                    width: isSubRailOpen ? '48px' : 0,
                    overflow: 'hidden',
                    transition: 'width 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                    display: 'flex',
                    flexShrink: 0,
                    borderRight: isSubRailOpen ? '1px solid rgba(0,0,0,0.05)' : 'none'
                }}
            >
                <SleekRail
                    items={subMenuItems}
                    variant="light"
                    sx={{
                        height: '100vh',
                        width: '48px'
                    }}
                />
            </Box>

            {/* Module Content */}
            <Box sx={{
                flexGrow: 1,
                pt: isFullScreenApp ? 0 : 2,
                pl: isFullScreenApp ? 0 : 3,
                pr: isFullScreenApp ? 0 : 3,
                overflowY: isFullScreenApp ? 'hidden' : 'auto',
                display: isFullScreenApp ? 'flex' : 'block',
                flexDirection: 'column',
                height: '100vh'
            }}>
                <Outlet />
            </Box>
        </Box>
    );
};

export default ModuleLayout;
