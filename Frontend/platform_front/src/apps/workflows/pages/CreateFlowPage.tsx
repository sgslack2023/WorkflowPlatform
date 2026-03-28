import React, { useState, useCallback } from 'react';
import ReactFlow, {
    addEdge,
    Background,
    Controls,
    MiniMap,
    ReactFlowProvider,
    Handle,
    Position,
    useNodesState,
    useEdgesState,
    MarkerType,
    type Connection,
    type Node,
    type NodeTypes,
    Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';

// Custom styles for edge selection
const edgeStyles = `
  .react-flow__edge.selected .react-flow__edge-path {
    stroke: #6366f1 !important;
    stroke-width: 3px !important;
  }
  .react-flow__edge:hover .react-flow__edge-path {
    stroke: #818cf8 !important;
    stroke-width: 2.5px !important;
  }
  .react-flow__edge.selected markerEnd {
    fill: #6366f1 !important;
  }
`;

import {
    Box,
    Typography,
    Stack,
    alpha,
    TextField,
    Skeleton,
    Snackbar,
    Alert,
    Tooltip,
    Grid,
    IconButton,
    CircularProgress
} from '@mui/material';
import {
    Database,
    Bot,
    Search,
    Wrench,
    Info,
    GripVertical,
    TrendingUp,
    DollarSign,
    Package,
    Factory,
    Cpu,
    Mail,
    Globe,
    FileText,
    CheckCircle2,
    ArrowLeft,
    Merge,
    Layers,
    Filter as FilterIcon,
    ArrowUpDown,
    Calculator,
    Copy,
    Rocket,
    Play,
    Save
} from 'lucide-react';
import SleekButton from '../../../components/SleekButton';
import SleekModal from '../../../components/SleekModal';
import { useDataSources } from '../../datasources/api/queries';
import { useAgentDefinitions } from '../../agents/api/queries';
import { useTools } from '../../tools/api/queries'; // Added
import { useCreateWorkflow, useUpdateWorkflow, useWorkflow, usePublishWorkflow, useRunWorkflow } from '../api/queries';
import { useSearchParams } from 'react-router-dom';
import DataSourceSettingsSidebar from '../components/DataSourceSettingsSidebar';
import ToolSettingsSidebar from '../components/ToolSettingsSidebar';
import AgentSettingsSidebar from '../components/AgentSettingsSidebar';
import TransformSettingsSidebar from '../components/TransformSettingsSidebar';
import DynamicTableDataDrawer from '../components/DynamicTableDataDrawer';
import type { DataSource } from '../../datasources/types';
import type { AgentDefinition } from '../../agents/types';
import type { Tool } from '../../tools/api/tools-api';
import { useTransformDefinitions } from '../../transforms/api/queries';
import type { TransformDefinition } from '../../transforms/api/transforms-api';

// ──────────────────────────────────────────────
//  Custom Node: Data Source
// ──────────────────────────────────────────────
const handleStyle = { width: 8, height: 8, background: '#94a3b8', border: '2px solid #fff' };

const DataSourceNode: React.FC<{ data: { label: string; sourceType?: string } }> = ({ data }) => (
    <>
        <Handle type="target" position={Position.Left} style={handleStyle} />
        <Box
            sx={{
                px: 1.5, py: 1, minWidth: 160, borderRadius: '8px',
                backgroundColor: '#fff',
                border: '1.5px solid', borderColor: alpha('#3b82f6', 0.3),
                boxShadow: `0 2px 8px ${alpha('#3b82f6', 0.05)}`,
                display: 'flex', alignItems: 'center', gap: 1,
                transition: 'box-shadow 0.2s, border-color 0.2s',
                '&:hover': { borderColor: '#3b82f6', boxShadow: `0 4px 16px ${alpha('#3b82f6', 0.1)}` },
            }}
        >
            <Box sx={{
                width: 26, height: 26, borderRadius: '6px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                bgcolor: alpha('#3b82f6', 0.1), color: '#3b82f6', flexShrink: 0,
            }}>
                <Database size={13} />
            </Box>
            <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.2 }}>
                    {data.label}
                </Typography>
                <Typography sx={{ fontSize: '0.6rem', color: alpha('#111827', 0.4), textTransform: 'capitalize' }}>
                    {data.sourceType || 'Data Source'}
                </Typography>
            </Box>
            <Tooltip
                title={
                    <Box sx={{ p: 0.5 }}>
                        <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, mb: 0.5 }}>Data Source</Typography>
                        <Typography sx={{ fontSize: '0.65rem', color: alpha('#fff', 0.8) }}>Type: {data.sourceType || 'Database'}</Typography>
                    </Box>
                }
                arrow
            >
                <Box sx={{ color: alpha('#111827', 0.2), '&:hover': { color: '#3b82f6' }, cursor: 'help' }}>
                    <Info size={14} />
                </Box>
            </Tooltip>
        </Box>
        <Handle type="source" position={Position.Right} style={handleStyle} />
    </>
);

// ──────────────────────────────────────────────
//  Custom Node: Agent
// ──────────────────────────────────────────────
const AgentNode: React.FC<{ data: { label: string; isActive?: boolean; llmProvider?: string; description?: string } }> = ({ data }) => (
    <>
        <Handle type="target" position={Position.Left} style={handleStyle} />
        <Box
            sx={{
                px: 1.5, py: 1, minWidth: 160, borderRadius: '8px',
                backgroundColor: '#fff',
                border: '1.5px solid', borderColor: alpha('#8b5cf6', 0.3),
                boxShadow: `0 2px 8px ${alpha('#8b5cf6', 0.05)}`,
                display: 'flex', alignItems: 'center', gap: 1,
                transition: 'box-shadow 0.2s, border-color 0.2s',
                '&:hover': { borderColor: '#8b5cf6', boxShadow: `0 4px 16px ${alpha('#8b5cf6', 0.1)}` },
            }}
        >
            <Box sx={{
                width: 26, height: 26, borderRadius: '6px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                bgcolor: alpha('#8b5cf6', 0.1), color: '#8b5cf6', flexShrink: 0,
            }}>
                <Bot size={13} />
            </Box>
            <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.2 }}>
                    {data.label}
                </Typography>
                <Typography sx={{ fontSize: '0.6rem', color: alpha('#111827', 0.4) }}>
                    {data.isActive ? 'Active Agent' : 'Inactive'}
                </Typography>
            </Box>
            <Tooltip
                title={
                    <Box sx={{ p: 0.5 }}>
                        <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, mb: 0.5 }}>AI Agent</Typography>
                        <Typography sx={{ fontSize: '0.65rem', color: alpha('#fff', 0.8) }}>Provider: {data.llmProvider || 'Unknown'}</Typography>
                        {data.description && (
                            <Typography sx={{ fontSize: '0.6rem', mt: 0.5, color: alpha('#fff', 0.6), fontStyle: 'italic' }}>
                                {data.description}
                            </Typography>
                        )}
                    </Box>
                }
                arrow
            >
                <Box sx={{ color: alpha('#111827', 0.2), '&:hover': { color: '#8b5cf6' }, cursor: 'help' }}>
                    <Info size={14} />
                </Box>
            </Tooltip>
        </Box>
        <Handle type="source" position={Position.Right} style={handleStyle} />
    </>
);

// ──────────────────────────────────────────────
//  Custom Node: Tool
// ──────────────────────────────────────────────
const ToolNode: React.FC<{ data: { label: string; input_schema?: any; output_schema?: any; description?: string } }> = ({ data }) => (
    <>
        <Handle type="target" position={Position.Left} style={handleStyle} />
        <Box
            sx={{
                px: 1.5, py: 1, minWidth: 160, borderRadius: '8px',
                backgroundColor: '#fff',
                border: '1.5px solid', borderColor: alpha('#f97316', 0.3),
                boxShadow: `0 2px 8px ${alpha('#f97316', 0.05)}`,
                display: 'flex', alignItems: 'center', gap: 1,
                transition: 'box-shadow 0.2s, border-color 0.2s',
                position: 'relative',
                '&:hover': { borderColor: '#f97316', boxShadow: `0 4px 16px ${alpha('#f97316', 0.1)}` },
            }}
        >
            <Box sx={{
                width: 26, height: 26, borderRadius: '6px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                bgcolor: alpha('#f97316', 0.1), color: '#f97316', flexShrink: 0,
            }}>
                <Wrench size={13} />
            </Box>
            <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.2 }}>
                    {data.label}
                </Typography>
                <Typography sx={{ fontSize: '0.6rem', color: alpha('#111827', 0.4) }}>
                    Tool
                </Typography>
            </Box>

            <Tooltip
                title={
                    <Box sx={{ p: 0.5 }}>
                        <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, mb: 0.5 }}>Schemas</Typography>
                        {data.description && (
                            <Typography sx={{ fontSize: '0.6rem', mb: 1, color: alpha('#fff', 0.6), fontStyle: 'italic' }}>
                                {data.description}
                            </Typography>
                        )}
                        <Typography sx={{ fontSize: '0.65rem', fontWeight: 600, color: alpha('#fff', 0.7) }}>Inputs:</Typography>
                        <pre style={{ fontSize: '0.6rem', margin: '2px 0 8px 0', opacity: 0.9 }}>{JSON.stringify(data.input_schema, null, 2)}</pre>
                        <Typography sx={{ fontSize: '0.65rem', fontWeight: 600, color: alpha('#fff', 0.7) }}>Outputs:</Typography>
                        <pre style={{ fontSize: '0.6rem', margin: '2px 0 0 0', opacity: 0.9 }}>{JSON.stringify(data.output_schema, null, 2)}</pre>
                    </Box>
                }
                arrow
            >
                <Box sx={{ color: alpha('#111827', 0.3), '&:hover': { color: '#f97316' }, cursor: 'help' }}>
                    <Info size={14} />
                </Box>
            </Tooltip>
        </Box>
        <Handle type="source" position={Position.Right} style={handleStyle} />
    </>
);

// ──────────────────────────────────────────────
//  Transform Icon Map (Shared between Node and Modal)
// ──────────────────────────────────────────────
const TRANSFORM_ICONS: Record<string, any> = {
    join: Merge,
    aggregate: Layers,
    filter: FilterIcon,
    sort: ArrowUpDown,
    calculate: Calculator,
    distinct: Copy,
    union: Database,
    'agg.smart_cube': Layers,
};

const TRANSFORM_COLORS: Record<string, string> = {
    join: '#6366f1',
    aggregate: '#6366f1',
    filter: '#6366f1',
    sort: '#6366f1',
    calculate: '#6366f1',
    distinct: '#6366f1',
    union: '#6366f1',
    'agg.smart_cube': '#8b5cf6', // Slightly more purple for the smart one
};

// ──────────────────────────────────────────────
//  Custom Node: Transform
// ──────────────────────────────────────────────
const TransformNode: React.FC<{ data: { label: string; transformKey?: string; description?: string } }> = ({ data }) => {
    const IconComponent = TRANSFORM_ICONS[data.transformKey || ''] || Database;

    return (
        <>
            <Handle type="target" position={Position.Left} style={handleStyle} />
            <Box
                sx={{
                    px: 1.5, py: 1, minWidth: 160, borderRadius: '8px',
                    backgroundColor: '#fff',
                    border: '1.5px solid', borderColor: alpha('#6366f1', 0.3),
                    boxShadow: `0 2px 8px ${alpha('#6366f1', 0.05)}`,
                    display: 'flex', alignItems: 'center', gap: 1,
                    transition: 'box-shadow 0.2s, border-color 0.2s',
                    '&:hover': { borderColor: '#6366f1', boxShadow: `0 4px 16px ${alpha('#6366f1', 0.1)}` },
                }}
            >
                <Box sx={{
                    width: 28, height: 28, borderRadius: '7px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    bgcolor: alpha('#6366f1', 0.1), color: '#6366f1', flexShrink: 0,
                }}>
                    <IconComponent size={15} strokeWidth={2.5} />
                </Box>
                <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                    <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.2 }}>
                        {data.label}
                    </Typography>
                    <Typography sx={{ fontSize: '0.6rem', color: alpha('#111827', 0.4) }}>
                        Transform
                    </Typography>
                </Box>
                <Tooltip title={<Typography sx={{ fontSize: '0.65rem' }}>{data.description || 'Data Transformation'}</Typography>} arrow>
                    <Box sx={{ color: alpha('#111827', 0.2), '&:hover': { color: '#6366f1' }, cursor: 'help' }}>
                        <Info size={14} />
                    </Box>
                </Tooltip>
            </Box>
            <Handle type="source" position={Position.Right} style={handleStyle} />
        </>
    );
};

const nodeTypes: NodeTypes = {
    dataSource: DataSourceNode,
    agent: AgentNode,
    tool: ToolNode,
    transform: TransformNode,
};

// ──────────────────────────────────────────────
//  Resource Row (inside browse modal)
// ──────────────────────────────────────────────
interface ResourceRowProps {
    name: string;
    subtitle: string;
    icon: React.ReactNode;
    alreadyAdded: boolean;
    onAdd: () => void;
}

const CATEGORY_MAP: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
    forecasting: { label: "Forecasting & Time Series", icon: <TrendingUp size={14} />, color: "#3b82f6" },
    finance: { label: "Financial Analysis", icon: <DollarSign size={14} />, color: "#10b981" },
    inventory: { label: "Inventory & Supply Chain", icon: <Package size={14} />, color: "#f59e0b" },
    production: { label: "Production & Operations", icon: <Factory size={14} />, color: "#ef4444" },
    ml: { label: "Machine Learning & Statistics", icon: <Cpu size={14} />, color: "#8b5cf6" },
    data: { label: "Data Transformation", icon: <Database size={14} />, color: "#6366f1" },
    communication: { label: "Communication & Alerts", icon: <Mail size={14} />, color: "#f43f5e" },
    web: { label: "Web & Research", icon: <Globe size={14} />, color: "#06b6d4" },
    docs: { label: "Document Processing", icon: <FileText size={14} />, color: "#64748b" },
    productivity: { label: "Productivity & Integrations", icon: <CheckCircle2 size={14} />, color: "#2dd4bf" },
    other: { label: "Other Tools", icon: <Wrench size={14} />, color: "#94a3b8" }
};

const ResourceRow: React.FC<ResourceRowProps> = ({ name, subtitle, icon, alreadyAdded, onAdd }) => (
    <Box sx={{
        p: 1.5, display: 'flex', alignItems: 'flex-start', gap: 1.5,
        borderRadius: '12px', border: '1px solid', borderColor: alpha('#111827', 0.05),
        transition: 'all 0.15s ease',
        cursor: alreadyAdded ? 'default' : 'pointer',
        '&:hover': alreadyAdded ? {} : { borderColor: alpha('#3b82f6', 0.2), bgcolor: alpha('#3b82f6', 0.02) }
    }} onClick={alreadyAdded ? undefined : onAdd}>
        <Box sx={{
            width: 32, height: 32, borderRadius: '8px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            bgcolor: alpha('#111827', 0.04), color: alpha('#111827', 0.6),
            flexShrink: 0, mt: 0.2 // Small offset to align icon center with first line of text
        }}>
            {icon}
        </Box>
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', mb: 0.2 }}>
                {name}
            </Typography>
            <Typography sx={{ fontSize: '0.62rem', color: alpha('#111827', 0.45), lineHeight: 1.3 }}>
                {subtitle}
            </Typography>
        </Box>
        <SleekButton
            variant="light"
            size="small"
            onClick={(e) => { e.stopPropagation(); onAdd(); }}
            sx={{ fontSize: '0.65rem', minWidth: 'auto', px: 1.2, py: 0.2, mt: 0.2 }}
        >
            Add
        </SleekButton>
    </Box>
);

const ToolTile: React.FC<ResourceRowProps> = ({ name, subtitle, icon, onAdd }) => (
    <Box
        onClick={(e) => { e.stopPropagation(); onAdd(); }}
        sx={{
            p: 1.5,
            borderRadius: '12px',
            border: '1.5px solid',
            borderColor: alpha('#111827', 0.06),
            bgcolor: '#fff',
            cursor: 'pointer',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            display: 'flex',
            flexDirection: 'column',
            gap: 1.2,
            position: 'relative',
            height: '100%',
            '&:hover': {
                borderColor: '#3b82f6',
                transform: 'translateY(-2px)',
                boxShadow: `0 6px 16px ${alpha('#3b82f6', 0.12)}`,
                bgcolor: alpha('#3b82f6', 0.01)
            }
        }}
    >
        <Box sx={{
            width: 32, height: 32, borderRadius: '8px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            bgcolor: alpha('#111827', 0.04), color: alpha('#111827', 0.6)
        }}>
            {icon}
        </Box>
        <Box>
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 800, color: '#111827', mb: 0.4, lineHeight: 1.2 }}>
                {name}
            </Typography>
            <Typography sx={{
                fontSize: '0.62rem',
                color: alpha('#111827', 0.45),
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                lineHeight: 1.3,
                fontWeight: 500
            }}>
                {subtitle}
            </Typography>
        </Box>
    </Box>
);



const CategoryTile: React.FC<{
    label: string;
    icon: React.ReactNode;
    color: string;
    count: number;
    onClick: () => void
}> = ({ label, icon, color, count, onClick }) => (
    <Box
        onClick={onClick}
        sx={{
            p: 3,
            borderRadius: '16px',
            border: '2px solid',
            borderColor: alpha(color, 0.15),
            bgcolor: alpha(color, 0.02),
            cursor: 'pointer',
            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
            textAlign: 'center',
            height: '100%',
            '&:hover': {
                borderColor: color,
                bgcolor: alpha(color, 0.05),
                transform: 'translateY(-5px)',
                boxShadow: `0 12px 28px ${alpha(color, 0.15)}`,
            }
        }}
    >
        <Box sx={{
            width: 56,
            height: 56,
            borderRadius: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: alpha(color, 0.1),
            color: color,
            mb: 0.5
        }}>
            {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { size: 28 }) : icon}
        </Box>
        <Box>
            <Typography sx={{ fontSize: '0.9rem', fontWeight: 800, color: '#111827', mb: 0.5 }}>
                {label}
            </Typography>
            <Typography sx={{ fontSize: '0.65rem', color: alpha('#111827', 0.4), fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {count} tools
            </Typography>
        </Box>
    </Box>
);

// ──────────────────────────────────────────────
//  Main Create Flow Page
// ──────────────────────────────────────────────
const getNodeId = () => {
    // browser crypto.randomUUID() is preferred if available
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    // Simple fallback if needed
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

const defaultEdgeOptions = {
    animated: true,
    style: { stroke: '#94a3b8', strokeWidth: 1.5 },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8', width: 16, height: 16 },
    selectable: true,
    focusable: true,
};

const CreateFlowPage: React.FC = () => {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [flowName, setFlowName] = useState('');
    const createMutation = useCreateWorkflow();
    const updateMutation = useUpdateWorkflow();
    const publishMutation = usePublishWorkflow();
    const runMutation = useRunWorkflow();
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [isRunning, setIsRunning] = useState(false);

    // Edit mode: load existing workflow
    const [searchParams, setSearchParams] = useSearchParams();
    const editId = searchParams.get('id');
    const { data: existingWorkflow } = useWorkflow(editId || '');

    // Modal states
    const [dsModalOpen, setDsModalOpen] = useState(false);
    const [agentModalOpen, setAgentModalOpen] = useState(false);
    const [toolModalOpen, setToolModalOpen] = useState(false);
    const [transformModalOpen, setTransformModalOpen] = useState(false);
    const [dsSearch, setDsSearch] = useState('');
    const [agentSearch, setAgentSearch] = useState('');
    const [toolSearch, setToolSearch] = useState('');
    const [transformSearch, setTransformSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    // Node configuration states
    const [selectedDSNode, setSelectedDSNode] = useState<Node | null>(null);
    const [selectedToolNode, setSelectedToolNode] = useState<Node | null>(null);
    const [selectedAgentNode, setSelectedAgentNode] = useState<Node | null>(null);
    const [selectedTransformNode, setSelectedTransformNode] = useState<Node | null>(null);
    const [configSidebarOpen, setConfigSidebarOpen] = useState(false);
    const [toolSidebarOpen, setToolSidebarOpen] = useState(false);
    const [agentSidebarOpen, setAgentSidebarOpen] = useState(false);
    const [transformSidebarOpen, setTransformSidebarOpen] = useState(false);
    const [selectedTable, setSelectedTable] = useState<any | null>(null);
    const [previewData, setPreviewData] = useState<{ columns: any[], rows: any[] } | null>(null);
    const [tableDrawerOpen, setTableDrawerOpen] = useState(false);
    const [appModalOpen, setAppModalOpen] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);

    const handlePreviewResult = (data: { columns: any[], rows: any[] }) => {
        setPreviewData(data);
        setSelectedTable(null); // Clear selected table if we are showing preview
        setTableDrawerOpen(true);
    };

    // Track which resources are on canvas
    const [addedDSIds, setAddedDSIds] = useState<Set<string>>(new Set());
    const [addedAgentIds, setAddedAgentIds] = useState<Set<string>>(new Set());
    const [addedToolIds, setAddedToolIds] = useState<Set<string>>(new Set());
    const [addedTransformIds, setAddedTransformIds] = useState<Set<string>>(new Set());

    // Fetch
    const { data: allDataSources, isLoading: dsLoading } = useDataSources();
    const { data: allAgents, isLoading: agentsLoading } = useAgentDefinitions();
    const { data: allTools, isLoading: toolsLoading } = useTools();
    const { data: allTransforms, isLoading: transformsLoading } = useTransformDefinitions();

    // Restore saved workflow when editing
    const [restored, setRestored] = useState(false);
    React.useEffect(() => {
        if (!existingWorkflow || restored || toolsLoading || agentsLoading || transformsLoading) return;
        setRestored(true);

        setFlowName(existingWorkflow.name || '');

        // Restore nodes
        const restoredNodes: Node[] = (existingWorkflow.nodes || []).map((n: any, i: number) => {
            const cfg = n.config || {};
            let type = 'dataSource';
            if (n.node_type === 'agent') type = 'agent';
            if (n.node_type === 'tool') type = 'tool';
            if (n.node_type === 'transform') type = 'transform';

            const resourceId = cfg.resource_id;
            let metadata: any = {};

            // Hydrate Tool data if it's a tool node
            if (type === 'tool' && allTools) {
                const toolMeta = allTools.find(t => t.id === resourceId);
                if (toolMeta) {
                    metadata = {
                        description: toolMeta.description,
                        input_schema: toolMeta.input_schema,
                        output_schema: toolMeta.output_schema,
                        algo_parameters: toolMeta.algo_parameters,
                    };
                }
            }

            // Hydrate Agent data if it's an agent node
            if (type === 'agent' && allAgents) {
                const agentMeta = allAgents.find(a => a.id === resourceId);
                if (agentMeta) {
                    metadata = {
                        description: `Agent using ${agentMeta.llm_provider}`,
                        llmProvider: agentMeta.llm_provider,
                        isActive: agentMeta.is_active
                    };
                }
            }

            // Hydrate Transform data if it's a transform node
            if (type === 'transform' && allTransforms) {
                const transformMeta = allTransforms.find(t => t.id === resourceId);
                if (transformMeta) {
                    metadata = {
                        transformKey: transformMeta.key,
                        description: transformMeta.description,
                        input_schema: transformMeta.input_schema,
                        output_schema: transformMeta.output_schema,
                        algo_parameters: {}, // Transforms don't have default algo_parameters in library
                    };
                }
            }

            return {
                id: n.langgraph_id || n.id,
                type,
                position: cfg.position || { x: 100 + i * 200, y: 100 },
                data: {
                    label: cfg.label || n.node_type,
                    sourceType: n.node_type === 'datasource' ? cfg.source_type : undefined,
                    isActive: n.node_type === 'agent' ? cfg.is_active : undefined,
                    resourceId: resourceId,
                    isExposedToApps: n.is_exposed_to_apps,
                    ...metadata,
                    // If the node already has parameters in config (saved state), override
                    algo_parameters: cfg.algo_parameters || metadata.algo_parameters
                },
            };
        });
        setNodes(restoredNodes);

        // Track added resource IDs
        const dsIds = new Set<string>();
        const agentIds = new Set<string>();
        const toolIds = new Set<string>();
        const transformIds = new Set<string>();
        restoredNodes.forEach((n) => {
            if (n.data.resourceId) {
                if (n.type === 'dataSource') dsIds.add(n.data.resourceId);
                if (n.type === 'agent') agentIds.add(n.data.resourceId);
                if (n.type === 'tool') toolIds.add(n.data.resourceId);
                if (n.type === 'transform') transformIds.add(n.data.resourceId);
            }
        });
        setAddedDSIds(dsIds);
        setAddedAgentIds(agentIds);
        setAddedToolIds(toolIds);
        setAddedTransformIds(transformIds);

        // Restore edges - use langgraph_id (stable IDs) that match the restored node IDs
        const restoredEdges = (existingWorkflow.edges || []).map((e: any) => ({
            id: e.id,
            source: e.source_langgraph_id || e.source_node,
            target: e.target_langgraph_id || e.target_node,
        }));
        setEdges(restoredEdges);

    }, [existingWorkflow, restored, allTools, allAgents, allTransforms, toolsLoading, agentsLoading, transformsLoading]);

    const onConnect = useCallback(
        (params: Connection) => setEdges((eds) => addEdge(params, eds)),
        [setEdges]
    );

    const onNodesDelete = useCallback((deleted: Node[]) => {
        deleted.forEach((node) => {
            const resId = node.data.resourceId;
            if (!resId) return;
            if (node.type === 'dataSource') setAddedDSIds((p) => { const s = new Set(p); s.delete(resId); return s; });
            if (node.type === 'agent') setAddedAgentIds((p) => { const s = new Set(p); s.delete(resId); return s; });
            if (node.type === 'tool') setAddedToolIds((p) => { const s = new Set(p); s.delete(resId); return s; });
            if (node.type === 'transform') setAddedTransformIds((p) => { const s = new Set(p); s.delete(resId); return s; });
        });
    }, []);

    const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
        // Close all first to avoid overlaps
        setConfigSidebarOpen(false);
        setToolSidebarOpen(false);
        setAgentSidebarOpen(false);
        setTransformSidebarOpen(false);

        // Clear specific node states to be sure
        setSelectedDSNode(null);
        setSelectedToolNode(null);
        setSelectedAgentNode(null);
        setSelectedTransformNode(null);

        if (node.type === 'dataSource') {
            setSelectedDSNode(node);
            setConfigSidebarOpen(true);
        } else if (node.type === 'tool') {
            setSelectedToolNode(node);
            setToolSidebarOpen(true);
        } else if (node.type === 'agent') {
            setSelectedAgentNode(node);
            setAgentSidebarOpen(true);
        } else if (node.type === 'transform') {
            setSelectedTransformNode(node);
            setTransformSidebarOpen(true);
        }
    }, []);

    const onPaneClick = useCallback(() => {
        setConfigSidebarOpen(false);
        setToolSidebarOpen(false);
        setAgentSidebarOpen(false);
        setTransformSidebarOpen(false);
    }, []);

    const handleDeleteNode = (nodeId: string) => {
        setNodes((nds) => nds.filter((n) => n.id !== nodeId));
        // Cleanup resources
        const node = nodes.find(n => n.id === nodeId);
        if (node) {
            onNodesDelete([node]);
        }
    };

    const handleToolParamSave = (newParams: any, isExposed: boolean) => {
        if (!selectedToolNode) return;
        setNodes((nds) =>
            nds.map((n) => {
                if (n.id === selectedToolNode.id) {
                    return {
                        ...n,
                        data: {
                            ...n.data,
                            algo_parameters: newParams,
                            isExposedToApps: isExposed
                        }
                    };
                }
                return n;
            })
        );
    };

    const handleTransformParamSave = (newParams: any, isExposed: boolean) => {
        if (!selectedTransformNode) return;
        setNodes((nds) =>
            nds.map((n) => {
                if (n.id === selectedTransformNode.id) {
                    return {
                        ...n,
                        data: {
                            ...n.data,
                            algo_parameters: newParams,
                            isExposedToApps: isExposed
                        }
                    };
                }
                return n;
            })
        );
    };

    const handleAgentParamSave = (newParams: any, isExposed: boolean) => {
        if (!selectedAgentNode) return;
        setNodes((nds) =>
            nds.map((n) => {
                if (n.id === selectedAgentNode.id) {
                    return {
                        ...n,
                        data: {
                            ...n.data,
                            algo_parameters: newParams,
                            isExposedToApps: isExposed
                        }
                    };
                }
                return n;
            })
        );
    };

    const handleDSExposeChange = (isExposed: boolean) => {
        if (!selectedDSNode) return;
        setNodes((nds) =>
            nds.map((n) => {
                if (n.id === selectedDSNode.id) {
                    return {
                        ...n,
                        data: {
                            ...n.data,
                            isExposedToApps: isExposed
                        }
                    };
                }
                return n;
            })
        );
    };

    const handleTableClick = (table: any) => {
        setSelectedTable(table);
        setTableDrawerOpen(true);
    };

    // ─── Add a single data source as a node ────────────
    const addDataSourceNode = (ds: DataSource) => {
        const newNode: Node = {
            id: getNodeId(),
            type: 'dataSource',
            position: { x: 100 + Math.random() * 60, y: 80 + nodes.length * 90 },
            data: { label: ds.name, sourceType: ds.source_type, resourceId: ds.id, isExposedToApps: true },
        };
        setNodes((nds) => [...nds, newNode]);
    };

    // ─── Add a single agent as a node ──────────────────
    const addAgentNode = (agent: AgentDefinition) => {
        const newNode: Node = {
            id: getNodeId(),
            type: 'agent',
            position: { x: 400 + Math.random() * 60, y: 80 + nodes.length * 90 },
            data: {
                label: agent.name,
                isActive: agent.is_active,
                resourceId: agent.id,
                description: `Agent using ${agent.llm_provider}`,
                llmProvider: agent.llm_provider,
                algo_parameters: {}, // Default empty for agent overrides
                isExposedToApps: true
            },
        };
        setNodes((nds) => [...nds, newNode]);
    };

    // ─── Add a single transform as a node ──────────────────
    const addTransformNode = (transform: TransformDefinition) => {
        const newNode: Node = {
            id: getNodeId(),
            type: 'transform',
            position: { x: 550 + Math.random() * 60, y: 80 + nodes.length * 90 },
            data: {
                label: transform.name,
                resourceId: transform.id,
                transformKey: transform.key,
                description: transform.description,
                input_schema: transform.input_schema,
                output_schema: transform.output_schema,
                algo_parameters: {},
                isExposedToApps: true
            },
        };
        setNodes((nds) => [...nds, newNode]);
    };

    // ─── Add a single tool as a node ───────────────────
    const addToolNode = (tool: Tool) => {
        const newNode: Node = {
            id: getNodeId(),
            type: 'tool',
            position: { x: 700 + Math.random() * 60, y: 80 + nodes.length * 90 },
            data: {
                label: tool.name,
                resourceId: tool.id,
                description: tool.description,
                input_schema: tool.input_schema,
                output_schema: tool.output_schema,
                algo_parameters: tool.algo_parameters || {},
                isExposedToApps: true
            },
        };
        setNodes((nds) => [...nds, newNode]);
    };

    // ─── Save flow ─────────────────────────────────
    const handleSaveFlow = async () => {
        if (!flowName.trim() || nodes.length === 0) return;

        const nodes_data = nodes.map((n) => ({
            frontend_id: n.id,
            node_type: n.type === 'dataSource' ? 'datasource' : n.type === 'agent' ? 'agent' : n.type === 'transform' ? 'transform' : 'tool',
            is_exposed_to_apps: n.data.isExposedToApps ?? true,
            config: {
                resource_id: n.data.resourceId,
                label: n.data.label,
                position: n.position,
                algo_parameters: n.data.algo_parameters
            },
        }));

        const edges_data = edges.map((e) => ({
            source: e.source,
            target: e.target,
        }));

        try {
            if (editId) {
                await updateMutation.mutateAsync({
                    id: editId,
                    data: { name: flowName, nodes_data, edges_data },
                });
            } else {
                const result = await createMutation.mutateAsync({
                    name: flowName,
                    nodes_data,
                    edges_data,
                });
                // Update URL to edit mode with the new ID
                if (result?.id) {
                    setSearchParams({ id: result.id });
                }
            }
            setSaveSuccess(true);
        } catch (err) {
            console.error('Failed to save flow', err);
        }
    };

    const handlePublishComponent = async () => {
        if (!editId) return;
        setIsPublishing(true);
        try {
            await publishMutation.mutateAsync({
                id: editId,
                isPublished: true
            });
            setAppModalOpen(false);
            setSaveSuccess(true);
        } catch (err) {
            console.error('Failed to publish component', err);
        } finally {
            setIsPublishing(false);
        }
    };

    const handleRunFlow = async () => {
        if (!editId) return;
        setIsRunning(true);
        try {
            // 1. Save changes first
            await handleSaveFlow();

            // 2. Queue execution
            // Note: In a full implementation we would ensure a version & compilation exist here.
            // For now we assume the backend handles basic execution triggers.
            await runMutation.mutateAsync({ id: editId, input: {} });
            setSaveSuccess(true);
        } catch (err) {
            console.error('Failed to run flow', err);
        } finally {
            setIsRunning(false);
        }
    };

    // Filtered lists
    const filteredDS = (allDataSources || []).filter((ds) =>
        ds.name.toLowerCase().includes(dsSearch.toLowerCase())
    );
    const filteredAgents = (allAgents || []).filter((a) =>
        a.name.toLowerCase().includes(agentSearch.toLowerCase())
    );
    const filteredTools = (allTools || []).filter((t) =>
        t.name.toLowerCase().includes(toolSearch.toLowerCase())
    );
    const filteredTransforms = (allTransforms || []).filter((t) =>
        t.name.toLowerCase().includes(transformSearch.toLowerCase())
    );

    const groupedTools = React.useMemo(() => {
        const groups: Record<string, Tool[]> = {};
        filteredTools.forEach((tool) => {
            const cat = tool.key.split('.')[0] || 'other';
            if (!groups[cat]) groups[cat] = [];
            groups[cat].push(tool);
        });

        // Sort categories by predefined order or alphabetically
        return Object.keys(groups).sort().reduce((acc, key) => {
            acc[key] = groups[key];
            return acc;
        }, {} as Record<string, Tool[]>);
    }, [filteredTools]);

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 32px)' }}>
            <style>{edgeStyles}</style>
            {/* ─── React Flow Canvas (fills remaining space) ── */}
            <Box sx={{ flexGrow: 1, position: 'relative' }}>
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    onNodeClick={onNodeClick}
                    onPaneClick={onPaneClick}
                    onNodesDelete={onNodesDelete}
                    nodeTypes={nodeTypes}
                    defaultEdgeOptions={defaultEdgeOptions}
                    defaultViewport={{ x: 0, y: 0, zoom: 0.7 }}
                    snapToGrid
                    snapGrid={[16, 16]}
                    deleteKeyCode={['Backspace', 'Delete']}
                    style={{ backgroundColor: '#fafbfc' }}
                >
                    <Background color="#e2e8f0" gap={20} size={1} />
                    <Controls
                        style={{
                            borderRadius: '10px', overflow: 'hidden',
                            boxShadow: `0 2px 8px ${alpha('#111827', 0.08)}`,
                            border: `1px solid ${alpha('#111827', 0.06)}`,
                        }}
                    />
                    <MiniMap
                        nodeColor={(n) => {
                            if (n.type === 'dataSource') return '#3b82f6';
                            if (n.type === 'agent') return '#8b5cf6';
                            if (n.type === 'tool') return '#f97316';
                            return '#94a3b8';
                        }}
                        maskColor={alpha('#fff', 0.85)}
                        style={{
                            borderRadius: '10px', overflow: 'hidden',
                            border: `1px solid ${alpha('#111827', 0.06)}`,
                        }}
                    />

                    {/* Empty state */}
                    {nodes.length === 0 && (
                        <Panel position="top-center">
                            <Box sx={{ mt: 12, textAlign: 'center', opacity: 0.45 }}>
                                <GripVertical size={36} strokeWidth={1} style={{ marginBottom: 8 }} />
                                <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#111827' }}>
                                    Your canvas is empty
                                </Typography>
                                <Typography sx={{ fontSize: '0.7rem', color: alpha('#111827', 0.5), mt: 0.5 }}>
                                    Use the panel below to add Data Sources, Agents, and Tools.
                                </Typography>
                            </Box>
                        </Panel>
                    )}
                </ReactFlow>
            </Box>

            {/* ─── Bottom Panel ─────────────────────────────── */}
            <Box
                sx={{
                    flexShrink: 0,
                    px: 2, py: 1.2,
                    backgroundColor: '#fff',
                    borderTop: '1px solid',
                    borderColor: alpha('#111827', 0.06),
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                }}
            >
                <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: alpha('#111827', 0.3), textTransform: 'uppercase', letterSpacing: '0.04em', mr: 0.5 }}>
                    Nodes
                </Typography>

                {/* Data Sources card */}
                <Box
                    onClick={() => setDsModalOpen(true)}
                    sx={{
                        display: 'flex', alignItems: 'center', gap: 0.8, px: 1.5,
                        height: 36,
                        borderRadius: '8px', cursor: 'pointer',
                        border: '1.5px solid', borderColor: alpha('#3b82f6', 0.15),
                        backgroundColor: alpha('#3b82f6', 0.02),
                        transition: 'all 0.15s ease',
                        '&:hover': {
                            borderColor: alpha('#3b82f6', 0.3),
                            backgroundColor: alpha('#3b82f6', 0.04),
                            transform: 'translateY(-1px)',
                        },
                    }}
                >
                    <Box sx={{
                        width: 22, height: 22, borderRadius: '5px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        bgcolor: alpha('#3b82f6', 0.08), color: '#3b82f6',
                    }}>
                        <Database size={12} />
                    </Box>
                    <Box>
                        <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#111827', lineHeight: 1.1 }}>
                            Data Sources
                        </Typography>
                        <Typography sx={{ fontSize: '0.55rem', color: alpha('#111827', 0.35) }}>
                            {nodes.filter(n => n.type === 'dataSource').length} added
                        </Typography>
                    </Box>
                </Box>

                {/* Agents card */}
                <Box
                    onClick={() => setAgentModalOpen(true)}
                    sx={{
                        display: 'flex', alignItems: 'center', gap: 0.8, px: 1.5,
                        height: 36,
                        borderRadius: '8px', cursor: 'pointer',
                        border: '1.5px solid', borderColor: alpha('#8b5cf6', 0.15),
                        backgroundColor: alpha('#8b5cf6', 0.02),
                        transition: 'all 0.15s ease',
                        '&:hover': {
                            borderColor: alpha('#8b5cf6', 0.3),
                            backgroundColor: alpha('#8b5cf6', 0.04),
                            transform: 'translateY(-1px)',
                        },
                    }}
                >
                    <Box sx={{
                        width: 22, height: 22, borderRadius: '5px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        bgcolor: alpha('#8b5cf6', 0.08), color: '#8b5cf6',
                    }}>
                        <Bot size={12} />
                    </Box>
                    <Box>
                        <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#111827', lineHeight: 1.1 }}>
                            Ai Agents
                        </Typography>
                        <Typography sx={{ fontSize: '0.55rem', color: alpha('#111827', 0.35) }}>
                            {nodes.filter(n => n.type === 'agent').length} added
                        </Typography>
                    </Box>
                </Box>

                {/* Transforms card */}
                <Box
                    onClick={() => setTransformModalOpen(true)}
                    sx={{
                        display: 'flex', alignItems: 'center', gap: 0.8, px: 1.5,
                        height: 36,
                        borderRadius: '8px', cursor: 'pointer',
                        border: '1.5px solid', borderColor: alpha('#6366f1', 0.15),
                        backgroundColor: alpha('#6366f1', 0.02),
                        transition: 'all 0.15s ease',
                        '&:hover': {
                            borderColor: alpha('#6366f1', 0.3),
                            backgroundColor: alpha('#6366f1', 0.04),
                            transform: 'translateY(-1px)',
                        },
                    }}
                >
                    <Box sx={{
                        width: 22, height: 22, borderRadius: '5px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        bgcolor: alpha('#6366f1', 0.08), color: '#6366f1',
                    }}>
                        <Database size={12} />
                    </Box>
                    <Box>
                        <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#111827', lineHeight: 1.1 }}>
                            Transforms
                        </Typography>
                        <Typography sx={{ fontSize: '0.55rem', color: alpha('#111827', 0.35) }}>
                            {nodes.filter(n => n.type === 'transform').length} added
                        </Typography>
                    </Box>
                </Box>

                {/* Tools card */}
                <Box
                    onClick={() => setToolModalOpen(true)}
                    sx={{
                        display: 'flex', alignItems: 'center', gap: 0.8, px: 1.5,
                        height: 36,
                        borderRadius: '8px', cursor: 'pointer',
                        border: '1.5px solid', borderColor: alpha('#f97316', 0.15),
                        backgroundColor: alpha('#f97316', 0.02),
                        transition: 'all 0.15s ease',
                        '&:hover': {
                            borderColor: alpha('#f97316', 0.3),
                            backgroundColor: alpha('#f97316', 0.04),
                            transform: 'translateY(-1px)',
                        },
                    }}
                >
                    <Box sx={{
                        width: 22, height: 22, borderRadius: '5px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        bgcolor: alpha('#f97316', 0.08), color: '#f97316',
                    }}>
                        <Wrench size={12} />
                    </Box>
                    <Box>
                        <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#111827', lineHeight: 1.1 }}>
                            Tools
                        </Typography>
                        <Typography sx={{ fontSize: '0.55rem', color: alpha('#111827', 0.35) }}>
                            {nodes.filter(n => n.type === 'tool').length} added
                        </Typography>
                    </Box>
                </Box>

                {/* Spacer + Save */}
                <Box sx={{ flexGrow: 1 }} />

                {/* Flow name input */}
                <TextField
                    size="small"
                    placeholder="Flow name…"
                    value={flowName}
                    onChange={(e) => setFlowName(e.target.value)}
                    sx={{ width: 180, '& .MuiInputBase-root': { fontSize: '0.8rem', height: 36 } }}
                />

                <Typography sx={{ fontSize: '0.7rem', color: alpha('#111827', 0.35) }}>
                    {nodes.length} node{nodes.length !== 1 ? 's' : ''} · {edges.length} edge{edges.length !== 1 ? 's' : ''}
                </Typography>
                <Tooltip
                    title="Run Flow (Save & Execute)"
                    arrow
                    enterDelay={200}
                    componentsProps={{
                        tooltip: {
                            sx: {
                                bgcolor: '#111827',
                                '& .MuiTooltip-arrow': { color: '#111827' },
                                fontWeight: 700,
                                fontSize: '0.7rem',
                                px: 1.5,
                                py: 1,
                                borderRadius: '8px'
                            }
                        }
                    }}
                >
                    <Box>
                        <SleekButton
                            variant="light"
                            size="small"
                            disabled={!editId || nodes.length === 0 || isRunning}
                            onClick={handleRunFlow}
                            loading={isRunning}
                            sx={{
                                height: 40, width: 40, minWidth: 40, px: 0,
                                borderRadius: '10px',
                                color: '#10b981',
                                borderColor: alpha('#10b981', 0.2),
                                '&:hover': { borderColor: '#10b981', bgcolor: alpha('#10b981', 0.04) }
                            }}
                        >
                            <Play size={20} fill={alpha('#10b981', 0.1)} />
                        </SleekButton>
                    </Box>
                </Tooltip>

                <Tooltip
                    title="Deploy Component"
                    arrow
                    enterDelay={200}
                    componentsProps={{
                        tooltip: {
                            sx: {
                                bgcolor: '#111827',
                                '& .MuiTooltip-arrow': { color: '#111827' },
                                fontWeight: 700,
                                fontSize: '0.7rem',
                                px: 1.5,
                                py: 1,
                                borderRadius: '8px'
                            }
                        }
                    }}
                >
                    <Box>
                        <SleekButton
                            variant="light"
                            size="small"
                            disabled={!editId || nodes.length === 0}
                            onClick={() => {
                                setAppModalOpen(true);
                            }}
                            sx={{
                                height: 40, width: 40, minWidth: 40, px: 0,
                                borderRadius: '10px',
                                color: '#3b82f6',
                                borderColor: alpha('#3b82f6', 0.15)
                            }}
                        >
                            <Rocket size={20} fill={alpha('#3b82f6', 0.05)} />
                        </SleekButton>
                    </Box>
                </Tooltip>

                <Tooltip
                    title={editId ? "Update Changes" : "Save Workflow"}
                    arrow
                    enterDelay={200}
                    componentsProps={{
                        tooltip: {
                            sx: {
                                bgcolor: '#111827',
                                '& .MuiTooltip-arrow': { color: '#111827' },
                                fontWeight: 700,
                                fontSize: '0.7rem',
                                px: 1.5,
                                py: 1,
                                borderRadius: '8px'
                            }
                        }
                    }}
                >
                    <Box>
                        <SleekButton
                            variant="dark"
                            size="small"
                            disabled={nodes.length === 0 || !flowName.trim() || createMutation.isPending || updateMutation.isPending}
                            onClick={handleSaveFlow}
                            sx={{
                                height: 40, width: 40, minWidth: 40, px: 0,
                                borderRadius: '10px',
                                background: 'linear-gradient(135deg, #111827 0%, #000 100%)',
                                border: 'none'
                            }}
                        >
                            {createMutation.isPending || updateMutation.isPending ? (
                                <CircularProgress size={18} color="inherit" thickness={5} />
                            ) : (
                                <Save size={20} />
                            )}
                        </SleekButton>
                    </Box>
                </Tooltip>
            </Box>

            {/* ─── Data Sources Picker Modal ──────────────── */}
            <SleekModal
                open={dsModalOpen}
                onClose={() => { setDsModalOpen(false); setDsSearch(''); }}
                title="Add Data Sources"
            >
                <Box sx={{ mb: 2 }}>
                    <TextField
                        fullWidth size="small"
                        placeholder="Search data sources…"
                        value={dsSearch}
                        onChange={(e) => setDsSearch(e.target.value)}
                        InputProps={{
                            startAdornment: <Search size={16} style={{ marginRight: 8, color: alpha('#111827', 0.3) }} />,
                        }}
                    />
                </Box>

                {dsLoading ? (
                    <Stack spacing={1}>
                        {[1, 2, 3].map((i) => <Skeleton key={i} height={48} sx={{ borderRadius: '10px' }} />)}
                    </Stack>
                ) : filteredDS.length === 0 ? (
                    <Box sx={{ py: 4, textAlign: 'center' }}>
                        <Database size={32} color={alpha('#111827', 0.15)} />
                        <Typography variant="body2" sx={{ mt: 1, color: alpha('#111827', 0.4) }}>
                            {dsSearch ? 'No matching data sources.' : 'No data sources available.'}
                        </Typography>
                    </Box>
                ) : (
                    <Stack spacing={0.5} sx={{ maxHeight: 350, overflowY: 'auto' }}>
                        {filteredDS.map((ds) => (
                            <ResourceRow
                                key={ds.id}
                                name={ds.name}
                                subtitle={`${ds.source_type} · ${ds.fetch_mode}`}
                                icon={<Database size={16} />}
                                alreadyAdded={addedDSIds.has(ds.id)}
                                onAdd={() => addDataSourceNode(ds)}
                            />
                        ))}
                    </Stack>
                )}
            </SleekModal>

            {/* ─── Agents Picker Modal ────────────────────── */}
            <SleekModal
                open={agentModalOpen}
                onClose={() => { setAgentModalOpen(false); setAgentSearch(''); }}
                title="Add Agents"
            >
                <Box sx={{ mb: 2 }}>
                    <TextField
                        fullWidth size="small"
                        placeholder="Search agents…"
                        value={agentSearch}
                        onChange={(e) => setAgentSearch(e.target.value)}
                        InputProps={{
                            startAdornment: <Search size={16} style={{ marginRight: 8, color: alpha('#111827', 0.3) }} />,
                        }}
                    />
                </Box>

                {agentsLoading ? (
                    <Stack spacing={1}>
                        {[1, 2, 3].map((i) => <Skeleton key={i} height={48} sx={{ borderRadius: '10px' }} />)}
                    </Stack>
                ) : filteredAgents.length === 0 ? (
                    <Box sx={{ py: 4, textAlign: 'center' }}>
                        <Bot size={32} color={alpha('#111827', 0.15)} />
                        <Typography variant="body2" sx={{ mt: 1, color: alpha('#111827', 0.4) }}>
                            {agentSearch ? 'No matching agents.' : 'No agents available.'}
                        </Typography>
                    </Box>
                ) : (
                    <Stack spacing={0.5} sx={{ maxHeight: 350, overflowY: 'auto' }}>
                        {filteredAgents.map((agent) => (
                            <ResourceRow
                                key={agent.id}
                                name={agent.name}
                                subtitle={agent.is_active ? 'Active' : 'Inactive'}
                                icon={<Bot size={16} />}
                                alreadyAdded={addedAgentIds.has(agent.id)}
                                onAdd={() => addAgentNode(agent)}
                            />
                        ))}
                    </Stack>
                )}
            </SleekModal>

            {/* ─── Transforms Picker Modal ───────────────── */}
            <SleekModal
                open={transformModalOpen}
                onClose={() => { setTransformModalOpen(false); setTransformSearch(''); }}
                title="Add Data Transformations"
            >
                <Box sx={{ mb: 2 }}>
                    <TextField
                        fullWidth size="small"
                        placeholder="Search transforms (Join, Group, Filter)…"
                        value={transformSearch}
                        onChange={(e) => setTransformSearch(e.target.value)}
                        InputProps={{
                            startAdornment: <Search size={16} style={{ marginRight: 8, color: alpha('#111827', 0.3) }} />,
                        }}
                    />
                </Box>

                {transformsLoading ? (
                    <Stack spacing={1}>
                        {[1, 2, 3].map((i) => <Skeleton key={i} height={48} sx={{ borderRadius: '10px' }} />)}
                    </Stack>
                ) : filteredTransforms.length === 0 ? (
                    <Box sx={{ py: 4, textAlign: 'center' }}>
                        <Database size={32} color={alpha('#6366f1', 0.15)} />
                        <Typography variant="body2" sx={{ mt: 1, color: alpha('#111827', 0.4) }}>
                            {transformSearch ? 'No matching transforms.' : 'No transformations available.'}
                        </Typography>
                    </Box>
                ) : (
                    <Stack spacing={0.5} sx={{ maxHeight: 350, overflowY: 'auto' }}>
                        {filteredTransforms.map((t) => {
                            const IconComponent = TRANSFORM_ICONS[t.key] || Database;
                            const color = TRANSFORM_COLORS[t.key] || '#6366f1';
                            return (
                                <ResourceRow
                                    key={t.id}
                                    name={t.name}
                                    subtitle={t.description}
                                    icon={<IconComponent size={18} color={color} strokeWidth={2.2} />}
                                    alreadyAdded={addedTransformIds.has(t.id)}
                                    onAdd={() => addTransformNode(t)}
                                />
                            );
                        })}
                    </Stack>
                )}
            </SleekModal>

            {/* ─── Publish Component Modal ─────────────────── */}
            <SleekModal
                open={appModalOpen}
                onClose={() => setAppModalOpen(false)}
                title="Publish Component"
            >
                <Stack spacing={3} sx={{ mt: 1 }}>
                    <Box sx={{ p: 2, borderRadius: '12px', bgcolor: alpha('#6366f1', 0.04), border: '1px dashed', borderColor: alpha('#6366f1', 0.2) }}>
                        <Stack direction="row" spacing={2} alignItems="center">
                            <Box sx={{ width: 42, height: 42, borderRadius: '10px', bgcolor: '#6366f1', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Rocket size={24} />
                            </Box>
                            <Box>
                                <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, color: '#111827' }}>
                                    Publish as App Component
                                </Typography>
                                <Typography sx={{ fontSize: '0.7rem', color: alpha('#111827', 0.5) }}>
                                    This workflow will be available as a reusable component in the App Designer.
                                </Typography>
                            </Box>
                        </Stack>
                    </Box>

                    <Typography sx={{ fontSize: '0.85rem', color: alpha('#111827', 0.6) }}>
                        Publishing this workflow makes its exposed nodes available for binding to widgets in the App Gallery and Designer.
                    </Typography>

                    <SleekButton
                        fullWidth
                        variant="dark"
                        size="large"
                        onClick={handlePublishComponent}
                        disabled={isPublishing}
                        loading={isPublishing}
                        startIcon={<Rocket size={18} />}
                    >
                        Confirm Deployment
                    </SleekButton>
                </Stack>
            </SleekModal>

            {/* ─── Tools Picker Modal ────────────────────── */}
            <SleekModal
                open={toolModalOpen}
                onClose={() => { setToolModalOpen(false); setToolSearch(''); setSelectedCategory(null); }}
                title={selectedCategory ? CATEGORY_MAP[selectedCategory]?.label : "Add Tools"}
                maxWidth="900px"
            >
                <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
                    {selectedCategory && (
                        <IconButton
                            onClick={() => setSelectedCategory(null)}
                            sx={{ bgcolor: alpha('#111827', 0.05), '&:hover': { bgcolor: alpha('#111827', 0.1) } }}
                        >
                            <ArrowLeft size={18} />
                        </IconButton>
                    )}
                    <TextField
                        fullWidth size="small"
                        placeholder="Search all tools…"
                        value={toolSearch}
                        onChange={(e) => setToolSearch(e.target.value)}
                        InputProps={{
                            startAdornment: <Search size={16} style={{ marginRight: 8, color: alpha('#111827', 0.3) }} />,
                        }}
                    />
                </Box>

                {toolsLoading ? (
                    <Grid container spacing={2}>
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={i}>
                                <Skeleton height={120} sx={{ borderRadius: '16px' }} />
                            </Grid>
                        ))}
                    </Grid>
                ) : !selectedCategory && !toolSearch ? (
                    /* Dashboard View of Categories */
                    <Grid container spacing={2.5} sx={{ p: 0.5 }}>
                        {Object.entries(groupedTools).map(([catKey, tools]) => {
                            const catInfo = CATEGORY_MAP[catKey] || CATEGORY_MAP.other;
                            return (
                                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={catKey}>
                                    <CategoryTile
                                        label={catInfo.label}
                                        icon={catInfo.icon}
                                        color={catInfo.color}
                                        count={tools.length}
                                        onClick={() => setSelectedCategory(catKey)}
                                    />
                                </Grid>
                            );
                        })}
                    </Grid>
                ) : (
                    /* Results View (Search or Category drill-down) */
                    <Box>
                        {toolSearch && (
                            <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: alpha('#111827', 0.4), mb: 2, textTransform: 'uppercase' }}>
                                Search Results ({filteredTools.length})
                            </Typography>
                        )}
                        <Box sx={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                            gap: 2.5,
                            p: 0.5
                        }}>
                            {(selectedCategory ? (groupedTools[selectedCategory] || []) : filteredTools).map((tool) => (
                                <ToolTile
                                    key={tool.id}
                                    name={tool.name}
                                    subtitle={tool.description}
                                    icon={CATEGORY_MAP[tool.key.split('.')[0]]?.icon || <Wrench size={14} />}
                                    alreadyAdded={addedToolIds.has(tool.id)}
                                    onAdd={() => addToolNode(tool)}
                                />
                            ))}
                        </Box>
                        {filteredTools.length === 0 && (
                            <Box sx={{ py: 6, textAlign: 'center' }}>
                                <Wrench size={48} color={alpha('#111827', 0.1)} />
                                <Typography sx={{ mt: 2, color: alpha('#111827', 0.4), fontWeight: 600 }}>
                                    No tools matching your search.
                                </Typography>
                            </Box>
                        )}
                    </Box>
                )}
            </SleekModal>
            {/* ─── Save Feedback ─────────────────────────── */}
            <Snackbar
                open={saveSuccess}
                autoHideDuration={4000}
                onClose={() => setSaveSuccess(false)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    onClose={() => setSaveSuccess(false)}
                    severity="success"
                    variant="filled"
                    sx={{
                        width: '100%',
                        borderRadius: '12px',
                        background: '#111827',
                        color: '#fff',
                        fontWeight: 600,
                        '& .MuiAlert-icon': { color: '#10b981' }
                    }}
                >
                    Workflow {editId ? 'updated' : 'saved'} successfully!
                </Alert>
            </Snackbar>

            {/* ─── Node Config Sidebars ──────────────────── */}
            <ToolSettingsSidebar
                open={toolSidebarOpen}
                onClose={() => setToolSidebarOpen(false)}
                toolName={selectedToolNode?.data.label || ''}
                description={selectedToolNode?.data.description}
                inputSchema={selectedToolNode?.data.input_schema}
                outputSchema={selectedToolNode?.data.output_schema}
                algoParameters={selectedToolNode?.data.algo_parameters}
                isExposedToApps={selectedToolNode?.data.isExposedToApps}
                onSave={handleToolParamSave}
                onDelete={() => selectedToolNode && handleDeleteNode(selectedToolNode.id)}
            />

            <AgentSettingsSidebar
                open={agentSidebarOpen}
                onClose={() => setAgentSidebarOpen(false)}
                agentName={selectedAgentNode?.data.label || ''}
                description={selectedAgentNode?.data.description}
                llmProvider={selectedAgentNode?.data.llmProvider}
                isActive={selectedAgentNode?.data.isActive}
                algoParameters={selectedAgentNode?.data.algo_parameters}
                isExposedToApps={selectedAgentNode?.data.isExposedToApps}
                onSave={handleAgentParamSave}
                onDelete={() => selectedAgentNode && handleDeleteNode(selectedAgentNode.id)}
            />

            <TransformSettingsSidebar
                open={transformSidebarOpen}
                onClose={() => setTransformSidebarOpen(false)}
                node={selectedTransformNode}
                onSave={handleTransformParamSave}
                onDelete={() => selectedTransformNode && handleDeleteNode(selectedTransformNode.id)}
                onPreviewResult={handlePreviewResult}
                nodes={nodes}
                edges={edges}
            />

            {selectedDSNode && (
                <DataSourceSettingsSidebar
                    open={configSidebarOpen}
                    onClose={() => setConfigSidebarOpen(false)}
                    dataSourceId={selectedDSNode.data.resourceId}
                    dataSourceName={selectedDSNode.data.label}
                    sourceType={selectedDSNode.data.sourceType}
                    isExposedToApps={selectedDSNode.data.isExposedToApps}
                    onExposeChange={handleDSExposeChange}
                    onTableClick={handleTableClick}
                    onDelete={() => handleDeleteNode(selectedDSNode.id)}
                />
            )}

            <DynamicTableDataDrawer
                open={tableDrawerOpen}
                onClose={() => {
                    setTableDrawerOpen(false);
                    setPreviewData(null);
                }}
                table={selectedTable}
                previewData={previewData}
                isSettingsOpen={configSidebarOpen || toolSidebarOpen || agentSidebarOpen || transformSidebarOpen}
            />
        </Box>
    );
};

// Wrap in ReactFlowProvider — required for useNodesState/useEdgesState hooks
const CreateFlowPageWrapper: React.FC = () => (
    <ReactFlowProvider>
        <CreateFlowPage />
    </ReactFlowProvider>
);

export default CreateFlowPageWrapper;
