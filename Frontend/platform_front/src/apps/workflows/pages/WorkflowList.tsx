import React, { useState } from 'react';
import { Box, Typography, Stack, alpha, Skeleton, Tooltip, IconButton } from '@mui/material';
import { Plus, Rocket } from 'lucide-react';
import SchemaIcon from '@mui/icons-material/SchemaRounded';
import { useNavigate } from 'react-router-dom';
import SleekButton from '../../../components/SleekButton';
import SleekCard from '../../../components/SleekCard';
import DeleteConfirmationModal from '../../../components/DeleteConfirmationModal';
import { useWorkflows, useDeleteWorkflow, usePublishWorkflow } from '../api/queries';

const WorkflowList: React.FC = () => {
    const { data: workflowData, isLoading, isError } = useWorkflows();
    const deleteMutation = useDeleteWorkflow();
    const publishMutation = usePublishWorkflow();
    const navigate = useNavigate();

    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [workflowToDelete, setWorkflowToDelete] = useState<any>(null);

    const handleDeleteClick = (workflow: any) => {
        setWorkflowToDelete(workflow);
        setDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (workflowToDelete) {
            try {
                await deleteMutation.mutateAsync(workflowToDelete.id);
            } catch (error) {
                console.error('Failed to delete workflow', error);
            }
        }
        setDeleteModalOpen(false);
        setWorkflowToDelete(null);
    };

    const handleTogglePublish = async (e: React.MouseEvent, workflow: any) => {
        e.stopPropagation();
        try {
            await publishMutation.mutateAsync({
                id: workflow.id,
                isPublished: !workflow.is_published
            });
        } catch (err) {
            console.error('Failed to toggle publish status', err);
        }
    };

    // Use API data, handle both paginated and list responses
    const workflows: any[] = Array.isArray(workflowData)
        ? workflowData
        : workflowData?.results || [];

    if (isLoading) {
        return (
            <Box>
                <Skeleton variant="text" width={200} height={40} sx={{ mb: 4 }} />
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 1.5 }}>
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} variant="rectangular" height={100} sx={{ borderRadius: '10px' }} />
                    ))}
                </Box>
            </Box>
        );
    }

    return (
        <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                <Box>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#111827', mb: 0.2 }}>
                        Workflows
                    </Typography>
                    <Typography variant="caption" sx={{ color: alpha('#111827', 0.5) }}>
                        Manage and orchestrate your execution flows.
                    </Typography>
                </Box>
                <Stack direction="row" spacing={1}>
                    <SleekButton
                        variant="dark"
                        size="small"
                        startIcon={<Plus size={16} />}
                        onClick={() => navigate('/workflows/create')}
                    >
                        New Workflow
                    </SleekButton>
                </Stack>
            </Stack>

            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 1.5 }}>
                {workflows.map((workflow: any) => (
                    <SleekCard
                        key={workflow.id}
                        title={workflow.name}
                        subtitle={`${workflow.nodes?.length || workflow.nodes_count || 0}N-${workflow.edges?.length || workflow.edges_count || 0}E`}
                        icon={<SchemaIcon sx={{ fontSize: 18 }} />}
                        active={workflow.is_published}
                        onEdit={() => navigate(`/workflows/create?id=${workflow.id}`)}
                        onDelete={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(workflow);
                        }}
                        actionIcon={
                            <Stack direction="row" spacing={0.5} alignItems="center">
                                <Typography sx={{
                                    fontSize: '9px',
                                    fontWeight: 700,
                                    color: workflow.is_published ? '#16a34a' : alpha('#111827', 0.35),
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.3px',
                                    whiteSpace: 'nowrap',
                                }}>
                                    {workflow.is_published ? 'Live' : 'Draft'}
                                </Typography>
                                <Tooltip title={workflow.is_published ? 'Unpublish' : 'Deploy'} arrow>
                                    <IconButton
                                        size="small"
                                        onClick={(e) => handleTogglePublish(e, workflow)}
                                        sx={{
                                            p: '4px',
                                            borderRadius: '6px',
                                            color: workflow.is_published ? '#16a34a' : alpha('#111827', 0.3),
                                            '&:hover': {
                                                bgcolor: workflow.is_published ? alpha('#16a34a', 0.1) : alpha('#111827', 0.06),
                                            }
                                        }}
                                    >
                                        <Rocket size={13} />
                                    </IconButton>
                                </Tooltip>
                            </Stack>
                        }
                    />
                ))}

                {(workflows.length === 0 || isError) && (
                    <Box
                        sx={{
                            py: 12,
                            width: '100%',
                            textAlign: 'center',
                            opacity: 0.5,
                            gridColumn: '1 / -1',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <SchemaIcon sx={{ fontSize: 48, mb: 2, opacity: 0.3 }} />
                        <Typography variant="body2">
                            {isError ? 'Could not load workflows.' : 'No workflows yet. Create your first flow!'}
                        </Typography>
                    </Box>
                )}
            </Box>

            <DeleteConfirmationModal
                open={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Delete Workflow"
                description={`Are you sure you want to delete "${workflowToDelete?.name}"? This action cannot be undone.`}
                isDeleting={false}
            />
        </Box>
    );
};

export default WorkflowList;
