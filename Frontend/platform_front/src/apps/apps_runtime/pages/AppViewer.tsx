import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box, Typography, Stack, alpha,
    Paper, Skeleton, Tooltip, IconButton
} from '@mui/material';
import {
    Table as TableIcon,
    ArrowLeft, Zap, MessageSquare, Layout, Pencil
} from 'lucide-react';
import { Responsive } from 'react-grid-layout';
import { WidthProvider } from '../../../components/WidthProvider';
import 'react-grid-layout/css/styles.css';

import { appsApi, type AppDefinition } from '../api/apps-api';
import SleekButton from '../../../components/SleekButton';
import ChatWidget from '../components/widgets/ChatWidget';
import TableWidget from '../components/widgets/TableWidget';
import MetricWidget from '../components/widgets/MetricWidget';

const ResponsiveGridLayout = WidthProvider(Responsive);

const AppViewer: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const [app, setApp] = useState<AppDefinition | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (slug) {
            appsApi.getDefinition(slug).then(data => {
                setApp(data);
                setLoading(false);
            }).catch(err => {
                console.error('Failed to load app', err);
                setLoading(false);
            });
        }
    }, [slug]);

    if (loading) {
        return (
            <Box sx={{ p: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Skeleton variant="text" width={300} height={40} sx={{ borderRadius: '8px' }} />
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 3 }}>
                    <Box sx={{ gridColumn: 'span 4' }}><Skeleton variant="rectangular" height={400} sx={{ borderRadius: '12px' }} /></Box>
                    <Box sx={{ gridColumn: 'span 8' }}><Skeleton variant="rectangular" height={400} sx={{ borderRadius: '12px' }} /></Box>
                </Box>
            </Box>
        );
    }

    if (!app) {
        return (
            <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography>Application not found.</Typography>
            </Box>
        );
    }

    const widgets = app.layout_config?.widgets || [];

    // Lock the layouts for the viewer
    const rawLayouts = app.layout_config?.layouts || { lg: [] };
    const layouts = Object.keys(rawLayouts).reduce((acc: any, breakpoint: string) => {
        acc[breakpoint] = rawLayouts[breakpoint].map((item: any) => ({
            ...item,
            static: true
        }));
        return acc;
    }, {});

    const getWidgetIcon = (type: string) => {
        const iconMap: Record<string, { icon: React.ReactNode; color: string }> = {
            chat: { icon: <MessageSquare size={13} />, color: '#8b5cf6' },
            table: { icon: <TableIcon size={13} />, color: '#3b82f6' },
            metric: { icon: <Zap size={13} />, color: '#f59e0b' },
        };
        return iconMap[type] || iconMap.table;
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: '#f8fafc' }}>
            {/* ── Header ── */}
            <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{ mb: 2.5 }}
            >
                <Stack direction="row" spacing={2} alignItems="center">
                    <Tooltip title="Back to Apps" arrow>
                        <IconButton
                            onClick={() => navigate('/apps/gallery')}
                            size="small"
                            sx={{
                                border: '1px solid',
                                borderColor: alpha('#111827', 0.1),
                                borderRadius: '8px',
                                p: '6px',
                                '&:hover': { bgcolor: alpha('#111827', 0.03) },
                            }}
                        >
                            <ArrowLeft size={18} />
                        </IconButton>
                    </Tooltip>
                    <Box>
                        <Stack direction="row" spacing={1.2} alignItems="center">
                            <Typography sx={{ fontWeight: 800, color: '#111827', fontSize: '1rem', letterSpacing: '-0.01em' }}>
                                {app.name}
                            </Typography>
                            <Box sx={{
                                px: 0.8, py: 0.2,
                                bgcolor: alpha('#10b981', 0.06),
                                borderRadius: '4px',
                                border: '1px solid',
                                borderColor: alpha('#10b981', 0.12),
                            }}>
                                <Typography sx={{ fontSize: '0.58rem', fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    Live
                                </Typography>
                            </Box>
                        </Stack>
                        <Typography sx={{ fontSize: '0.68rem', color: alpha('#111827', 0.4), mt: 0.1 }}>
                            {widgets.length} widget{widgets.length !== 1 ? 's' : ''} · Designed and assembled by you
                        </Typography>
                    </Box>
                </Stack>

                <SleekButton
                    variant="light"
                    size="small"
                    startIcon={<Pencil size={13} />}
                    onClick={() => navigate(`/apps/designer/${slug}`)}
                    sx={{ fontSize: '0.75rem', height: 32 }}
                >
                    Edit Design
                </SleekButton>
            </Stack>

            {/* ── Widget Grid ── */}
            <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 3 }}>
                {widgets.length === 0 ? (
                    <Box sx={{
                        py: 12, display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center',
                    }}>
                        <Box sx={{
                            width: 64, height: 64, borderRadius: '50%',
                            bgcolor: alpha('#111827', 0.03),
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            mb: 2,
                        }}>
                            <Layout size={28} strokeWidth={1.5} style={{ color: alpha('#111827', 0.15) }} />
                        </Box>
                        <Typography sx={{ fontWeight: 700, color: alpha('#111827', 0.5), fontSize: '0.9rem', mb: 0.5 }}>
                            No widgets configured
                        </Typography>
                        <Typography sx={{ fontSize: '0.75rem', color: alpha('#111827', 0.3), mb: 2 }}>
                            Open the designer to add widgets to this app.
                        </Typography>
                        <SleekButton
                            variant="dark"
                            size="small"
                            startIcon={<Pencil size={13} />}
                            onClick={() => navigate(`/apps/${slug}/design`)}
                        >
                            Open Designer
                        </SleekButton>
                    </Box>
                ) : (
                    <ResponsiveGridLayout
                        className="layout"
                        layouts={layouts}
                        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
                        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
                        rowHeight={50}
                        isDraggable={false}
                        isResizable={false}
                    >
                        {widgets.map((w: any) => {
                            const { icon, color } = getWidgetIcon(w.type);
                            const isChatWidget = w.type === 'chat';

                            return (
                                <div key={w.id}>
                                    <Paper sx={{
                                        height: '100%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        borderRadius: '12px',
                                        border: '1.5px solid',
                                        borderColor: alpha('#111827', 0.06),
                                        overflow: 'hidden',
                                        bgcolor: '#fff',
                                        transition: 'border-color 0.2s ease',
                                        '&:hover': { borderColor: alpha('#111827', 0.1) },
                                    }}>
                                        {/* Widget header — skip for chat since ChatWidget has its own */}
                                        {!isChatWidget && (
                                            <Box sx={{
                                                px: 2, py: 1.2,
                                                borderBottom: '1px solid',
                                                borderColor: alpha('#111827', 0.04),
                                                bgcolor: alpha('#f8fafc', 0.5),
                                            }}>
                                                <Stack direction="row" spacing={1} alignItems="center">
                                                    <Box sx={{
                                                        width: 22, height: 22, borderRadius: '5px',
                                                        bgcolor: alpha(color, 0.08),
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        color: color,
                                                    }}>
                                                        {icon}
                                                    </Box>
                                                    <Typography sx={{ fontWeight: 700, fontSize: '0.8rem', color: '#111827' }}>
                                                        {w.title}
                                                    </Typography>
                                                </Stack>
                                            </Box>
                                        )}

                                        <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
                                            {isChatWidget && (
                                                <ChatWidget
                                                    nodeId={w.nodeBinding || ''}
                                                    workflowId={w.workflowId || ''}
                                                    agentId={w.config?.agentId || w.config?.agent_id}
                                                    contextNodeIds={
                                                        widgets
                                                            .filter((sibling: any) => sibling.id !== w.id && sibling.nodeBinding)
                                                            .map((sibling: any) => sibling.nodeBinding)
                                                    }
                                                />
                                            )}
                                            {w.type === 'table' && <TableWidget nodeId={w.nodeBinding || ''} workflowId={w.workflowId || ''} tableBinding={w.tableBinding} />}
                                            {w.type === 'metric' && <MetricWidget nodeId={w.nodeBinding || ''} workflowId={w.workflowId || ''} title={w.title} />}
                                        </Box>
                                    </Paper>
                                </div>
                            );
                        })}
                    </ResponsiveGridLayout>
                )}
            </Box>
        </Box>
    );
};

export default AppViewer;
