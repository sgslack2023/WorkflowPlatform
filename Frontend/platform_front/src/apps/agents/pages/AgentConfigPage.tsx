import React, { useState } from 'react';
import { Box, Typography, Stack, alpha, Skeleton } from '@mui/material';
import { Plus, Sliders } from 'lucide-react';
import SleekButton from '../../../components/SleekButton';
import SleekCard from '../../../components/SleekCard';
import SleekModal from '../../../components/SleekModal';
import DeleteConfirmationModal from '../../../components/DeleteConfirmationModal';
import AgentConfigForm from '../components/AgentConfigForm';
import { useAgentConfigs, useCreateAgentConfig, useUpdateAgentConfig, useDeleteAgentConfig } from '../api/queries';
import type { AgentConfig } from '../types';

const AgentConfigPage: React.FC = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingConfig, setEditingConfig] = useState<AgentConfig | null>(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [configToDelete, setConfigToDelete] = useState<AgentConfig | null>(null);

    const { data: configs, isLoading } = useAgentConfigs();
    const createMutation = useCreateAgentConfig();
    const updateMutation = useUpdateAgentConfig();
    const deleteMutation = useDeleteAgentConfig();

    const handleCreate = async (formData: any) => {
        try {
            if (editingConfig) {
                await updateMutation.mutateAsync({ id: editingConfig.id, data: formData });
            } else {
                await createMutation.mutateAsync(formData);
            }
            handleClose();
        } catch (error) {
            console.error('Failed to save config', error);
        }
    };

    const handleEdit = (config: AgentConfig) => {
        setEditingConfig(config);
        setIsModalOpen(true);
    };

    const handleClose = () => {
        setIsModalOpen(false);
        setEditingConfig(null);
    };

    const handleDeleteClick = (config: AgentConfig) => {
        setConfigToDelete(config);
        setDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (configToDelete) {
            try {
                await deleteMutation.mutateAsync(configToDelete.id);
                setDeleteModalOpen(false);
                setConfigToDelete(null);
            } catch (error) {
                console.error('Failed to delete config', error);
            }
        }
    };

    if (isLoading) {
        return (
            <Box>
                <Skeleton variant="text" width={200} height={40} sx={{ mb: 4 }} />
                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                        gap: 1.5
                    }}
                >
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <Skeleton key={i} variant="rectangular" height={60} sx={{ borderRadius: '10px' }} />
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
                        Agent Configuration
                    </Typography>
                    <Typography variant="caption" sx={{ color: alpha('#111827', 0.5) }}>
                        Define how agents think and behave.
                    </Typography>
                </Box>
                <SleekButton
                    variant="dark"
                    size="small"
                    startIcon={<Plus size={16} />}
                    onClick={() => setIsModalOpen(true)}
                >
                    New Config
                </SleekButton>
            </Stack>

            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                    gap: 1.5
                }}
            >
                {configs?.map((config) => (
                    <SleekCard
                        key={config.id}
                        title={config.name}
                        subtitle={`${config.memory_policy} Memory`}
                        icon={<Sliders size={16} />}
                        tag="Standard"
                        onEdit={() => handleEdit(config)}
                        onDelete={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(config);
                        }}
                        onClick={() => console.log('Select', config.id)}
                    />
                ))}
                {configs?.length === 0 && (
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
                        <Sliders size={48} strokeWidth={1} style={{ marginBottom: '16px' }} />
                        <Typography variant="body2">No configurations found.</Typography>
                    </Box>
                )}
            </Box>

            <SleekModal
                open={isModalOpen}
                onClose={handleClose}
                title={editingConfig ? "Edit Agent Configuration" : "Create Agent Configuration"}
            >
                <AgentConfigForm
                    initialData={editingConfig || undefined}
                    onSubmit={handleCreate}
                    onCancel={handleClose}
                    isSubmitting={createMutation.isPending || updateMutation.isPending}
                />
            </SleekModal>

            <DeleteConfirmationModal
                open={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Delete Configuration"
                description={`Are you sure you want to delete "${configToDelete?.name}"? This action cannot be undone.`}
                isDeleting={deleteMutation.isPending}
            />
        </Box>
    );
};

export default AgentConfigPage;
