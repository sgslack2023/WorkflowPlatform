import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box, Typography, Stack, IconButton, alpha,
    Drawer, Paper, CircularProgress,
    FormControl, InputLabel, Select, MenuItem, TextField, Tooltip
} from '@mui/material';
import {
    ArrowLeft, Save, Plus, MessageSquare,
    Table as TableIcon,
    Settings2, Layout,
    ChevronRight, Zap, GripVertical, Trash2,
    Database, Brain, Box as BoxIcon, Eye
} from 'lucide-react';
import { Responsive } from 'react-grid-layout';
import { WidthProvider } from '../../../components/WidthProvider';
import 'react-grid-layout/css/styles.css';

import { appsApi, type AppDefinition } from '../api/apps-api';
import SleekButton from '../../../components/SleekButton';
import SleekModal from '../../../components/SleekModal';
import { useDynamicTables } from '../../datasources/api/queries';
import TableWidget from '../components/widgets/TableWidget';
import MetricWidget from '../components/widgets/MetricWidget';
import { CheckCircle2 } from 'lucide-react';

const ResponsiveGridLayout = WidthProvider(Responsive);

interface Widget {
    id: string;
    type: 'chat' | 'table' | 'metric';
    title: string;
    description?: string;
    workflowId: string | null;
    nodeBinding: string | null;
    tableBinding?: string | null;
    config: any;
}

const WIDGET_TYPES = [
    { type: 'chat', label: 'Chat Interface', icon: MessageSquare, color: '#8b5cf6', description: 'Bind to an AI Agent' },
    { type: 'table', label: 'Data Table', icon: TableIcon, color: '#3b82f6', description: 'Bind to a Transform/Source' },
    { type: 'metric', label: 'KPI Metric', icon: Zap, color: '#f59e0b', description: 'Display a single value' },
];

const AppDesigner: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const [app, setApp] = useState<AppDefinition | null>(null);
    const [associatedWorkflows, setAssociatedWorkflows] = useState<any[]>([]);
    const [activeWorkflowId, setActiveWorkflowId] = useState<string | null>(null);
    const [widgets, setWidgets] = useState<Widget[]>([]);
    const [layouts, setLayouts] = useState<any>({ lg: [] });
    const [isSaving, setIsSaving] = useState(false);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [selectedWidget, setSelectedWidget] = useState<Widget | null>(null);
    const [bindingModalOpen, setBindingModalOpen] = useState(false);
    const [bindingNodeId, setBindingNodeId] = useState<string | null>(null);

    useEffect(() => {
        if (slug) {
            appsApi.getDefinition(slug).then(async data => {
                setApp(data);
                if (data.layout_config?.widgets) {
                    setWidgets(data.layout_config.widgets);
                }
                if (data.layout_config?.layouts) {
                    setLayouts(data.layout_config.layouts);
                } else if (data.layout_config?.widgets) {
                    const initialLayout = data.layout_config.widgets.map((w: any, i: number) => ({
                        i: w.id,
                        x: (i * 4) % 12,
                        y: Math.floor(i / 3) * 4,
                        w: w.type === 'chat' ? 4 : 8,
                        h: 6
                    }));
                    setLayouts({ lg: initialLayout });
                }

                if (data.workflows && data.workflows.length > 0) {
                    try {
                        const workflowData = await Promise.all(
                            data.workflows.map((id: string) =>
                                fetch(`/api/workflows/${id}/`, {
                                    headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
                                }).then(res => res.json())
                            )
                        );
                        setAssociatedWorkflows(workflowData);
                        if (workflowData.length > 0) setActiveWorkflowId(workflowData[0].id);
                    } catch (err) {
                        console.error("Failed to fetch workflows", err);
                    }
                }
            });
        }
    }, [slug]);

    const activeWorkflow = associatedWorkflows.find(w => w.id === activeWorkflowId);
    const workflowNodes = activeWorkflow?.nodes || [];

    const { data: boundNodeTables, isLoading: tablesLoading } = useDynamicTables(
        { datasource_id: workflowNodes.find((n: any) => n.langgraph_id === bindingNodeId || n.id === bindingNodeId)?.config?.resource_id },
        { enabled: !!bindingNodeId && (workflowNodes.find((n: any) => n.langgraph_id === bindingNodeId || n.id === bindingNodeId)?.node_type === 'datasource') }
    );

    const handleAddWidget = (type: any) => {
        const id = `widget_${Date.now()}`;
        const newWidget: Widget = {
            id,
            type: type.type,
            title: `New ${type.label}`,
            workflowId: null,
            nodeBinding: null,
            config: {},
        };

        const lgLayout = layouts.lg || [];
        const newLayoutItem = {
            i: id,
            x: (lgLayout.length * 4) % 12,
            y: 0,
            w: type.type === 'metric' ? 3 : 6,
            h: type.type === 'table' ? 8 : 6
        };

        setWidgets([...widgets, newWidget]);
        setLayouts({
            ...layouts,
            lg: [...lgLayout, newLayoutItem]
        });
        setDrawerOpen(false);
    };

    const handleRemoveWidget = (id: string) => {
        setWidgets(widgets.filter(w => w.id !== id));
        setLayouts({
            ...layouts,
            lg: (layouts.lg || []).filter((l: any) => l.i !== id)
        });
    };

    const onLayoutChange = (_: any, allLayouts: any) => {
        setLayouts(allLayouts);
    };

    const handleSaveLayout = async () => {
        if (!app) return;
        setIsSaving(true);
        try {
            await appsApi.updateDefinition(app.public_slug, {
                layout_config: { ...app.layout_config, widgets, layouts }
            });
        } catch (err) {
            console.error('Failed to save layout', err);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: '#f8fafc' }}>
            {/* ── Header ── */}
            <Box sx={{
                px: 3, py: 1.5,
                borderBottom: '1px solid',
                borderColor: alpha('#111827', 0.06),
                bgcolor: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                zIndex: 1100,
            }}>
                {/* Left side */}
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
                                '&:hover': { bgcolor: alpha('#111827', 0.03) }
                            }}
                        >
                            <ArrowLeft size={18} />
                        </IconButton>
                    </Tooltip>
                    <Box>
                        <Stack direction="row" spacing={1.2} alignItems="center">
                            <Layout size={16} style={{ color: alpha('#111827', 0.4) }} />
                            <Typography sx={{ fontWeight: 800, color: '#111827', fontSize: '0.95rem', letterSpacing: '-0.01em' }}>
                                {app?.name || 'App Designer'}
                            </Typography>
                            <Box sx={{
                                px: 1, py: 0.2,
                                bgcolor: alpha('#111827', 0.04),
                                borderRadius: '4px',
                                border: '1px solid',
                                borderColor: alpha('#111827', 0.06),
                            }}>
                                <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: alpha('#111827', 0.4), textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    Designer
                                </Typography>
                            </Box>
                        </Stack>
                        <Typography sx={{ fontSize: '0.68rem', color: alpha('#111827', 0.4), mt: 0.2 }}>
                            {widgets.length} widget{widgets.length !== 1 ? 's' : ''} on canvas
                        </Typography>
                    </Box>
                </Stack>

                {/* Right side — actions */}
                <Stack direction="row" spacing={1.5} alignItems="center">
                    <SleekButton
                        variant="light"
                        size="small"
                        startIcon={<Eye size={14} />}
                        onClick={() => navigate(`/apps/${slug}`)}
                        sx={{ fontSize: '0.78rem', height: 34 }}
                    >
                        Preview
                    </SleekButton>
                    <SleekButton
                        variant="light"
                        size="small"
                        startIcon={<Plus size={14} />}
                        onClick={() => setDrawerOpen(true)}
                        sx={{ fontSize: '0.78rem', height: 34 }}
                    >
                        Add Widget
                    </SleekButton>
                    <SleekButton
                        variant="dark"
                        size="small"
                        loading={isSaving}
                        startIcon={<Save size={14} />}
                        onClick={handleSaveLayout}
                        sx={{ fontSize: '0.78rem', height: 34 }}
                    >
                        Save
                    </SleekButton>
                </Stack>
            </Box>

            {/* ── Canvas ── */}
            <Box sx={{ flexGrow: 1, overflowY: 'auto', px: 3, py: 2 }}>
                {widgets.length === 0 ? (
                    <Box sx={{
                        height: '100%', display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center',
                    }}>
                        <Box sx={{
                            width: 80, height: 80, borderRadius: '50%',
                            bgcolor: alpha('#111827', 0.03),
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            mb: 2,
                        }}>
                            <Layout size={32} strokeWidth={1.5} style={{ color: alpha('#111827', 0.15) }} />
                        </Box>
                        <Typography sx={{ fontWeight: 700, color: alpha('#111827', 0.6), fontSize: '1rem', mb: 0.5 }}>
                            Canvas Empty
                        </Typography>
                        <Typography sx={{ fontSize: '0.8rem', color: alpha('#111827', 0.35), mb: 3 }}>
                            Start building by adding widgets to your app.
                        </Typography>
                        <SleekButton
                            variant="dark"
                            size="small"
                            startIcon={<Plus size={14} />}
                            onClick={() => setDrawerOpen(true)}
                        >
                            Add Your First Widget
                        </SleekButton>
                    </Box>
                ) : (
                    <ResponsiveGridLayout
                        className="layout"
                        layouts={layouts}
                        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
                        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
                        rowHeight={50}
                        draggableHandle=".drag-handle"
                        onLayoutChange={onLayoutChange}
                    >
                        {widgets.map((w) => (
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
                                    transition: 'all 0.2s ease',
                                    '&:hover': {
                                        borderColor: alpha('#111827', 0.12),
                                        boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
                                    }
                                }}>
                                    {/* Widget card header */}
                                    <Stack
                                        direction="row"
                                        justifyContent="space-between"
                                        alignItems="center"
                                        sx={{
                                            px: 2, py: 1.2,
                                            borderBottom: '1px solid',
                                            borderColor: alpha('#111827', 0.04),
                                            bgcolor: alpha('#f8fafc', 0.5),
                                        }}
                                    >
                                        <Stack direction="row" spacing={1} alignItems="center">
                                            <Box className="drag-handle" sx={{
                                                cursor: 'grab',
                                                display: 'flex',
                                                alignItems: 'center',
                                                p: 0.3,
                                                borderRadius: '4px',
                                                '&:hover': { bgcolor: alpha('#111827', 0.04) }
                                            }}>
                                                <GripVertical size={14} color={alpha('#111827', 0.2)} />
                                            </Box>
                                            <Box sx={{
                                                width: 22, height: 22, borderRadius: '5px',
                                                bgcolor: alpha(
                                                    w.type === 'chat' ? '#8b5cf6' : w.type === 'table' ? '#3b82f6' : '#f59e0b',
                                                    0.08
                                                ),
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            }}>
                                                {w.type === 'chat' && <MessageSquare size={12} color="#8b5cf6" />}
                                                {w.type === 'table' && <TableIcon size={12} color="#3b82f6" />}
                                                {w.type === 'metric' && <Zap size={12} color="#f59e0b" />}
                                            </Box>
                                            <Typography sx={{ fontWeight: 700, color: '#111827', fontSize: '0.8rem' }}>
                                                {w.title}
                                            </Typography>
                                        </Stack>
                                        <Stack direction="row" spacing={0.3}>
                                            <Tooltip title="Configure" arrow>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => {
                                                        setSelectedWidget(w);
                                                        setBindingModalOpen(true);
                                                    }}
                                                    sx={{
                                                        p: '4px', borderRadius: '6px',
                                                        color: alpha('#111827', 0.3),
                                                        '&:hover': { bgcolor: alpha('#111827', 0.04), color: '#111827' }
                                                    }}
                                                >
                                                    <Settings2 size={14} />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Remove" arrow>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleRemoveWidget(w.id)}
                                                    sx={{
                                                        p: '4px', borderRadius: '6px',
                                                        color: alpha('#ef4444', 0.4),
                                                        '&:hover': { bgcolor: alpha('#ef4444', 0.06), color: '#ef4444' }
                                                    }}
                                                >
                                                    <Trash2 size={14} />
                                                </IconButton>
                                            </Tooltip>
                                        </Stack>
                                    </Stack>

                                    {/* Widget card body */}
                                    <Box sx={{
                                        flexGrow: 1,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        overflow: 'hidden',
                                        position: 'relative'
                                    }}>
                                        {w.nodeBinding ? (
                                            <Box sx={{ height: '100%', width: '100%' }}>
                                                {w.type === 'table' && (
                                                    <TableWidget
                                                        nodeId={w.nodeBinding}
                                                        workflowId={w.workflowId || ''}
                                                        tableBinding={w.tableBinding}
                                                    />
                                                )}
                                                {w.type === 'metric' && (
                                                    <MetricWidget
                                                        nodeId={w.nodeBinding}
                                                        workflowId={w.workflowId || ''}
                                                        title={w.title}
                                                    />
                                                )}
                                                {w.type === 'chat' && (
                                                    <Box sx={{
                                                        height: '100%',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        p: 3,
                                                        bgcolor: alpha('#10b981', 0.02)
                                                    }}>
                                                        <Box sx={{
                                                            p: 1.5, borderRadius: '50%',
                                                            bgcolor: alpha('#10b981', 0.1),
                                                            color: '#059669',
                                                            mb: 2
                                                        }}>
                                                            <CheckCircle2 size={32} />
                                                        </Box>
                                                        <Typography sx={{ fontWeight: 800, fontSize: '0.9rem', color: '#111827' }}>
                                                            Agent Attached
                                                        </Typography>
                                                        <Typography sx={{ fontSize: '0.75rem', color: alpha('#111827', 0.4), mt: 0.5 }}>
                                                            {associatedWorkflows.find(wf => wf.id === w.workflowId)?.nodes?.find((n: any) => n.id === w.nodeBinding)?.config?.label || 'AI Assistant'}
                                                        </Typography>

                                                        {/* Floating connection badge */}
                                                        <Box sx={{
                                                            position: 'absolute',
                                                            bottom: 12,
                                                            right: 12,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: 1,
                                                            px: 1.2, py: 0.5,
                                                            bgcolor: '#fff',
                                                            borderRadius: '6px',
                                                            border: '1px solid',
                                                            borderColor: alpha('#10b981', 0.2),
                                                            boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                                                        }}>
                                                            <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#10b981' }} />
                                                            <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: '#059669' }}>
                                                                LIVE
                                                            </Typography>
                                                        </Box>
                                                    </Box>
                                                )}
                                            </Box>
                                        ) : (
                                            <Box sx={{
                                                height: '100%',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                p: 2,
                                                textAlign: 'center'
                                            }}>
                                                <Box sx={{ color: alpha('#111827', 0.08), mb: 1.5 }}>
                                                    {w.type === 'chat' && <MessageSquare size={36} strokeWidth={1.5} />}
                                                    {w.type === 'table' && <TableIcon size={36} strokeWidth={1.5} />}
                                                    {w.type === 'metric' && <Zap size={36} strokeWidth={1.5} />}
                                                </Box>
                                                <Typography sx={{ fontSize: '0.75rem', color: alpha('#111827', 0.35), fontWeight: 500 }}>
                                                    {w.type === 'chat' ? 'No Agent Connected' : 'No Data Source Connected'}
                                                </Typography>
                                                <Typography sx={{ fontSize: '0.65rem', color: alpha('#111827', 0.25), mt: 0.5 }}>
                                                    Click ⚙ in header to link workflow
                                                </Typography>
                                            </Box>
                                        )}
                                    </Box>
                                </Paper>
                            </div>
                        ))}
                    </ResponsiveGridLayout>
                )}
            </Box>

            {/* ── Widget Drawer ── */}
            <Drawer
                anchor="right"
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                PaperProps={{
                    sx: {
                        width: 340, p: 3,
                        borderLeft: 'none',
                        boxShadow: '-10px 0 40px rgba(0,0,0,0.05)',
                    }
                }}
            >
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                    <Plus size={18} style={{ color: alpha('#111827', 0.4) }} />
                    <Typography sx={{ fontWeight: 800, fontSize: '1rem' }}>Add Widget</Typography>
                </Stack>
                <Typography sx={{ fontSize: '0.78rem', color: alpha('#111827', 0.45), mb: 3 }}>
                    Select a widget type to add to your canvas.
                </Typography>

                <Stack spacing={1.5}>
                    {WIDGET_TYPES.map((type) => (
                        <Paper
                            key={type.type}
                            onClick={() => handleAddWidget(type)}
                            sx={{
                                p: 2, borderRadius: '10px', cursor: 'pointer',
                                border: '1.5px solid', borderColor: alpha('#111827', 0.06),
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                    borderColor: alpha(type.color, 0.3),
                                    bgcolor: alpha(type.color, 0.02),
                                    transform: 'translateX(-3px)',
                                    boxShadow: `0 4px 12px ${alpha(type.color, 0.08)}`,
                                }
                            }}
                        >
                            <Stack direction="row" spacing={1.5} alignItems="center">
                                <Box sx={{
                                    width: 38, height: 38, borderRadius: '8px',
                                    bgcolor: alpha(type.color, 0.08), color: type.color,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    flexShrink: 0,
                                }}>
                                    <type.icon size={18} />
                                </Box>
                                <Box sx={{ flex: 1 }}>
                                    <Typography sx={{ fontWeight: 700, fontSize: '0.82rem', color: '#111827' }}>{type.label}</Typography>
                                    <Typography sx={{ fontSize: '0.68rem', color: alpha('#111827', 0.4), mt: 0.2 }}>{type.description}</Typography>
                                </Box>
                                <ChevronRight size={14} style={{ color: alpha('#111827', 0.15), flexShrink: 0 }} />
                            </Stack>
                        </Paper>
                    ))}
                </Stack>
            </Drawer>

            {/* ── Configuration Modal ── */}
            <SleekModal
                open={bindingModalOpen}
                onClose={() => {
                    setBindingModalOpen(false);
                    setBindingNodeId(null);
                }}
                title="Configure Widget"
                maxWidth="400px"
                compact
            >
                <Stack spacing={2.5} sx={{ py: 1 }}>
                    {/* Widget Title */}
                    <TextField
                        label="Widget Title"
                        size="small"
                        fullWidth
                        value={selectedWidget?.title || ''}
                        onChange={(e) => {
                            if (selectedWidget) {
                                setWidgets(widgets.map(w =>
                                    w.id === selectedWidget.id ? { ...w, title: e.target.value } : w
                                ));
                                setSelectedWidget({ ...selectedWidget, title: e.target.value });
                            }
                        }}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                    />

                    <FormControl fullWidth size="small">
                        <InputLabel>Workflow Source</InputLabel>
                        <Select
                            value={activeWorkflowId || ''}
                            onChange={(e) => {
                                setActiveWorkflowId(e.target.value);
                                setBindingNodeId(null);
                            }}
                            label="Workflow Source"
                            sx={{ borderRadius: '8px' }}
                        >
                            {associatedWorkflows.map(wf => (
                                <MenuItem key={wf.id} value={wf.id}>{wf.name}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <FormControl fullWidth size="small" disabled={!activeWorkflowId}>
                        <InputLabel>Select Output Node</InputLabel>
                        <Select
                            value={bindingNodeId || (selectedWidget?.nodeBinding && selectedWidget.workflowId === activeWorkflowId ? selectedWidget.nodeBinding : '')}
                            onChange={(e) => {
                                const nid = e.target.value as string;
                                const node = workflowNodes.find((n: any) => n.langgraph_id === nid || n.id === nid);
                                if (selectedWidget?.type === 'table' && node?.node_type === 'datasource') {
                                    setBindingNodeId(nid);
                                } else {
                                    setWidgets(widgets.map((tw: any) =>
                                        tw.id === selectedWidget?.id ? { ...tw, workflowId: activeWorkflowId, nodeBinding: nid, tableBinding: null } : tw
                                    ));
                                    setBindingModalOpen(false);
                                }
                            }}
                            label="Select Output Node"
                            sx={{ borderRadius: '8px' }}
                        >
                            {workflowNodes
                                .filter((n: any) => {
                                    if (!n.is_exposed_to_apps) return false;
                                    if (selectedWidget?.type === 'chat') return n.node_type === 'agent';
                                    if (selectedWidget?.type === 'table') return n.node_type === 'transform' || n.node_type === 'datasource';
                                    return true;
                                })
                                .map((n: any) => (
                                    <MenuItem key={n.langgraph_id || n.id} value={n.langgraph_id || n.id}>
                                        <Stack direction="row" spacing={1} alignItems="center">
                                            {n.node_type === 'agent' && <Brain size={14} />}
                                            {n.node_type === 'datasource' && <Database size={14} />}
                                            {n.node_type === 'transform' && <BoxIcon size={14} />}
                                            <Typography sx={{ fontSize: '0.85rem' }}>{n.config?.label || n.node_type}</Typography>
                                        </Stack>
                                    </MenuItem>
                                ))}
                        </Select>
                    </FormControl>

                    {bindingNodeId && workflowNodes.find((n: any) => n.langgraph_id === bindingNodeId || n.id === bindingNodeId)?.node_type === 'datasource' && (
                        <FormControl fullWidth size="small">
                            <InputLabel>Select Physical Table</InputLabel>
                            <Select
                                value={selectedWidget?.tableBinding || ''}
                                onChange={(e) => {
                                    setWidgets(widgets.map((tw: any) =>
                                        tw.id === selectedWidget?.id ? { ...tw, workflowId: activeWorkflowId, nodeBinding: bindingNodeId, tableBinding: e.target.value as string } : tw
                                    ));
                                    setBindingModalOpen(false);
                                    setBindingNodeId(null);
                                }}
                                label="Select Physical Table"
                                sx={{ borderRadius: '8px' }}
                            >
                                {tablesLoading ? (
                                    <MenuItem disabled><CircularProgress size={16} /></MenuItem>
                                ) : (boundNodeTables as any[])?.map((table: any) => (
                                    <MenuItem key={table.id} value={table.id}>
                                        <Stack direction="row" spacing={1} alignItems="center">
                                            <TableIcon size={14} />
                                            {table.name}
                                        </Stack>
                                    </MenuItem>
                                ))}
                                {!tablesLoading && (boundNodeTables as any[])?.length === 0 && (
                                    <MenuItem disabled>No tables found in source</MenuItem>
                                )}
                            </Select>
                        </FormControl>
                    )}
                </Stack>
            </SleekModal>
        </Box>
    );
};

export default AppDesigner;
