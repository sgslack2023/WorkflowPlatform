import React from 'react';
import { Box } from '@mui/material';
import { useLocation } from 'react-router-dom';
import { Bot, Database, Settings, Users, Rocket } from 'lucide-react';
import SchemaIcon from '@mui/icons-material/SchemaRounded';
import SleekRail from './SleekRail';
import type { RailItem } from './SleekRail';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';

const Sidebar: React.FC = () => {
    const location = useLocation();
    const toggleSubRail = useUIStore((state) => state.toggleSubRail);
    const setSubRailOpen = useUIStore((state) => state.setSubRailOpen);

    const menuItems: RailItem[] = [
        { icon: <Rocket size={18} />, label: 'Apps', path: '/apps' },
        { icon: <SchemaIcon sx={{ fontSize: 20 }} />, label: 'Workflows', path: '/workflows' },
        { icon: <Bot size={18} />, label: 'Agents', path: '/agents' },
        { icon: <Database size={18} />, label: 'DataSources', path: '/datasources' },
        { icon: <Users size={18} />, label: 'Membership', path: '/membership' },
    ];

    const handleItemClick = (path: string) => {
        // If we click the same main module that is already active
        if (location.pathname.startsWith(path)) {
            toggleSubRail();
        } else {
            // If navigating to a new module, ensure the sub-rail is open
            setSubRailOpen(true);
        }
    };

    const logo = (
        <Box
            sx={{
                color: '#4f46e5',
                fontWeight: 900,
                fontSize: '1rem',
                letterSpacing: '1px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: 'rgba(79, 70, 229, 0.1)'
            }}
        >
            P
        </Box>
    );

    const settingsItem: RailItem = {
        icon: <Settings size={18} />,
        label: 'Settings',
        path: '/settings'
    };

    const handleLogout = () => {
        // Clear tokens from local storage
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        // Clear auth store
        useAuthStore.getState().logout();
        // Redirect to login or home
        window.location.href = '/login';
    };

    return (
        <SleekRail
            items={menuItems}
            header={logo}
            footerItem={settingsItem}
            variant="dark"
            onItemClick={handleItemClick}
            onLogout={handleLogout}
            sx={{
                position: 'fixed',
                left: 0,
                top: 0,
                zIndex: 1200
            }}
        />
    );
};

export default Sidebar;
