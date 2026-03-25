import React from 'react';
import { Box, Typography, alpha, Stack } from '@mui/material';
import SchemaIcon from '@mui/icons-material/SchemaRounded';
import { useWorkflows } from '../../workflows/api/queries';
import { useNavigate } from 'react-router-dom';
import SleekCard from '../../../components/SleekCard';
import LoadingSpinner from '../../../components/LoadingSpinner';

const WorkflowComponentsPage: React.FC = () => {
    const navigate = useNavigate();
    const { data: publishedWorkflowsData, isLoading: workflowsLoading } = useWorkflows({ is_published: true });

    const workflows = Array.isArray(publishedWorkflowsData)
        ? publishedWorkflowsData
        : (publishedWorkflowsData?.results || []);

    if (workflowsLoading) return <LoadingSpinner />;

    return (
        <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                <Box>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#111827', mb: 0.2 }}>
                        Workflow Components
                    </Typography>
                    <Typography variant="caption" sx={{ color: alpha('#111827', 0.5) }}>
                        Published components ready to be used in applications.
                    </Typography>
                </Box>
            </Stack>

            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: 1.5
                }}
            >
                {workflows.map((wf: any) => (
                    <SleekCard
                        key={wf.id}
                        title={wf.name}
                        subtitle={`${wf.nodes?.length || wf.nodes_count || 0} Nodes · ${wf.edges?.length || wf.edges_count || 0} Edges`}
                        icon={<SchemaIcon sx={{ fontSize: 18 }} />}
                        tag="Component"
                        onClick={() => navigate(`/workflows/create?id=${wf.id}`)}
                    >
                        <Typography sx={{
                            color: alpha('#111827', 0.4),
                            fontSize: '11px',
                            mt: 0.5,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                        }}>
                            {wf.description || 'Workflow component ready to be embedded.'}
                        </Typography>
                    </SleekCard>
                ))}

                {workflows.length === 0 && (
                    <Box sx={{ py: 12, textAlign: 'center', opacity: 0.5, gridColumn: '1 / -1' }}>
                        <SchemaIcon sx={{ fontSize: 48, mb: 2, opacity: 0.3 }} />
                        <Typography>No workflows published as components yet.</Typography>
                    </Box>
                )}
            </Box>
        </Box>
    );
};

export default WorkflowComponentsPage;
