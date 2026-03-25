import React from 'react';
import { Box, Typography, alpha, Stack } from '@mui/material';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricWidgetProps {
    nodeId: string;
    workflowId: string;
    title: string;
}

const MetricWidget: React.FC<MetricWidgetProps> = ({ title, workflowId }) => {
    // Mock value and trend
    const value = "84.2%";
    const trend = +12.5;
    const label = `vs Last Scenario`;

    console.log(`MetricWidget bound to workflow ${workflowId}`);

    return (
        <Box sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            p: 4,
            textAlign: 'center',
            bgcolor: '#fff',
        }}>
            <Typography sx={{
                fontSize: '0.7rem',
                fontWeight: 700,
                color: alpha('#111827', 0.35),
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                mb: 1.5
            }}>
                {title}
            </Typography>

            <Typography sx={{
                fontWeight: 800,
                color: '#111827',
                mb: 2,
                fontSize: '3rem',
                letterSpacing: '-0.02em',
                lineHeight: 1,
            }}>
                {value}
            </Typography>

            <Stack direction="row" spacing={0.8} alignItems="center" sx={{
                px: 1.5, py: 0.5, borderRadius: '6px',
                bgcolor: trend > 0 ? alpha('#10b981', 0.06) : alpha('#ef4444', 0.06),
                color: trend > 0 ? '#059669' : '#dc2626',
                border: '1px solid',
                borderColor: trend > 0 ? alpha('#10b981', 0.1) : alpha('#ef4444', 0.1),
            }}>
                {trend > 0 ? <TrendingUp size={13} /> : trend < 0 ? <TrendingDown size={13} /> : <Minus size={13} />}
                <Typography sx={{ fontSize: '0.78rem', fontWeight: 700 }}>
                    {trend > 0 ? '+' : ''}{trend}%
                </Typography>
                <Typography sx={{ fontSize: '0.68rem', opacity: 0.7, fontWeight: 500 }}>
                    {label}
                </Typography>
            </Stack>

            <Box sx={{
                mt: 3, width: '80%', height: 3,
                bgcolor: alpha('#111827', 0.04),
                borderRadius: '2px', overflow: 'hidden'
            }}>
                <Box sx={{
                    width: '84.2%', height: '100%',
                    bgcolor: '#111827',
                    borderRadius: '2px',
                    transition: 'width 0.8s ease',
                }} />
            </Box>
        </Box>
    );
};

export default MetricWidget;
