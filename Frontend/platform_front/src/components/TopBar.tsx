import React from 'react';
import { Box, Typography, IconButton, Avatar, Badge, Stack } from '@mui/material';
import { Bell, Search, Command } from 'lucide-react';
import CyberTextField from './CyberTextField';

export const TopBar: React.FC = () => {
    return (
        <Box sx={{
            height: '64px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 3,
            width: '100%'
        }}>
            <Box sx={{ width: 400, display: { xs: 'none', md: 'block' } }}>
                <CyberTextField
                    size="small"
                    placeholder="Search commands or workflows..."
                    InputProps={{
                        startAdornment: <Search size={18} style={{ marginRight: 8, opacity: 0.5 }} />,
                        endAdornment: (
                            <Stack direction="row" spacing={0.5} alignItems="center" sx={{ opacity: 0.3 }}>
                                <Command size={14} />
                                <Typography variant="caption" sx={{ fontWeight: 700 }}>K</Typography>
                            </Stack>
                        )
                    }}
                    sx={{ '& .MuiOutlinedInput-root': { height: 40 } }}
                />
            </Box>

            <Stack direction="row" spacing={2} alignItems="center">
                <IconButton sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main' } }}>
                    <Badge badgeContent={4} color="error" overlap="circular">
                        <Bell size={20} />
                    </Badge>
                </IconButton>

                <Box sx={{
                    height: 32,
                    width: '1px',
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    mx: 1
                }} />

                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ cursor: 'pointer' }}>
                    <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                            Shiva System
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Administrator
                        </Typography>
                    </Box>
                    <Avatar
                        sx={{
                            width: 36,
                            height: 36,
                            border: '2px solid rgba(123, 97, 255, 0.5)',
                            boxShadow: '0 0 10px rgba(123, 97, 255, 0.3)'
                        }}
                        src="https://api.dicebear.com/7.x/avataaars/svg?seed=Shiva"
                    />
                </Stack>
            </Stack>
        </Box>
    );
};

export default TopBar;
