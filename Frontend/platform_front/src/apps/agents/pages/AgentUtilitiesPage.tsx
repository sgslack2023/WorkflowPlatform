import React, { useState } from 'react';
import { Box, Typography, Stack, alpha, Skeleton } from '@mui/material';
import { Plus, BarChart3, Scissors, Binary, Code2, Wrench } from 'lucide-react';
import SleekButton from '../../../components/SleekButton';
import SleekCard from '../../../components/SleekCard';
import SleekModal from '../../../components/SleekModal';
import DeleteConfirmationModal from '../../../components/DeleteConfirmationModal';
import AgentUtilityForm from '../components/AgentUtilityForm';
import { useAgentUtilities, useCreateAgentUtility, useUpdateAgentUtility, useDeleteAgentUtility } from '../api/queries';
import type { AgentUtility } from '../types';

const AgentUtilitiesPage: React.FC = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUtility, setEditingUtility] = useState<AgentUtility | null>(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [utilityToDelete, setUtilityToDelete] = useState<AgentUtility | null>(null);

    const { data: utilities, isLoading } = useAgentUtilities();
    const createMutation = useCreateAgentUtility();
    const updateMutation = useUpdateAgentUtility();
    const deleteMutation = useDeleteAgentUtility();

    const handleCreate = async (formData: any) => {
        try {
            if (editingUtility) {
                await updateMutation.mutateAsync({ id: editingUtility.id, data: formData });
            } else {
                await createMutation.mutateAsync(formData);
            }
            handleClose();
        } catch (error) {
            console.error('Failed to save utility', error);
        }
    };

    const handleEdit = (utility: AgentUtility) => {
        setEditingUtility(utility);
        setIsModalOpen(true);
    };

    const handleClose = () => {
        setIsModalOpen(false);
        setEditingUtility(null);
    };

    const handleDeleteClick = (utility: AgentUtility) => {
        setUtilityToDelete(utility);
        setDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (utilityToDelete) {
            try {
                await deleteMutation.mutateAsync(utilityToDelete.id);
                setDeleteModalOpen(false);
                setUtilityToDelete(null);
            } catch (error) {
                console.error('Failed to delete utility', error);
            }
        }
    };


    const renderIcon = (type: string) => {
        switch (type) {
            case 'forecasting': return <BarChart3 size={16} />;
            case 'transformation': return <Scissors size={16} />;
            case 'optimization': return <Binary size={16} />;
            default: return <Code2 size={16} />;
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
                        Agent Utilities
                    </Typography>
                    <Typography variant="caption" sx={{ color: alpha('#111827', 0.5) }}>
                        Extend agents with specialized tools.
                    </Typography>
                </Box>
                <SleekButton
                    variant="dark"
                    size="small"
                    startIcon={<Plus size={16} />}
                    onClick={() => setIsModalOpen(true)}
                >
                    Register
                </SleekButton>
            </Stack>

            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                    gap: 1.5
                }}
            >
                {utilities?.map((util) => (
                    <SleekCard
                        key={util.id}
                        title={util.name}
                        subtitle={util.utility_type}
                        icon={renderIcon(util.utility_type)}
                        tag="Tool"
                        onEdit={() => handleEdit(util)}
                        onDelete={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(util);
                        }}
                        onClick={() => console.log('Select', util.id)}
                    />
                ))}

                {utilities?.length === 0 && (
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
                        <Wrench size={48} strokeWidth={1} style={{ marginBottom: '16px' }} />
                        <Typography variant="body2">No utilities registered.</Typography>
                    </Box>
                )}
            </Box>

            <SleekModal
                open={isModalOpen}
                onClose={handleClose}
                title={editingUtility ? "Edit Agent Utility" : "Register Agent Utility"}
            >
                <AgentUtilityForm
                    initialData={editingUtility || undefined}
                    onSubmit={handleCreate}
                    onCancel={handleClose}
                    isSubmitting={createMutation.isPending || updateMutation.isPending}
                />
            </SleekModal>

            <DeleteConfirmationModal
                open={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Delete Utility"
                description={`Are you sure you want to delete "${utilityToDelete?.name}"? This action cannot be undone.`}
                isDeleting={deleteMutation.isPending}
            />
        </Box>
    );
};

export default AgentUtilitiesPage;
