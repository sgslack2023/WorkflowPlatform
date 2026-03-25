import React, { useState } from 'react';
import { Box, Typography, Stack, alpha, Skeleton } from '@mui/material';
import { Plus, Cpu, Zap, Shield, Database } from 'lucide-react';
import SleekButton from '../../../components/SleekButton';
import SleekCard from '../../../components/SleekCard';
import SleekModal from '../../../components/SleekModal';
import DeleteConfirmationModal from '../../../components/DeleteConfirmationModal';
import LLMProviderForm from '../components/LLMProviderForm';
import { useLLMProviders, useCreateLLMProvider, useUpdateLLMProvider, useDeleteLLMProvider } from '../api/queries';
import type { LLMProvider } from '../types';

const LLMProviderPage: React.FC = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProvider, setEditingProvider] = useState<LLMProvider | null>(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [providerToDelete, setProviderToDelete] = useState<LLMProvider | null>(null);

    const { data: providers, isLoading } = useLLMProviders();
    const createMutation = useCreateLLMProvider();
    const updateMutation = useUpdateLLMProvider();
    const deleteMutation = useDeleteLLMProvider();

    const renderProviderIcon = (type: string) => {
        switch (type) {
            case 'openai': return <Zap size={16} />;
            case 'anthropic': return <Shield size={16} />;
            case 'azure': return <Database size={16} />;
            default: return <Cpu size={16} />;
        }
    };

    const handleCreate = async (formData: any) => {
        try {
            if (editingProvider) {
                await updateMutation.mutateAsync({ id: editingProvider.id, data: formData });
            } else {
                await createMutation.mutateAsync(formData);
            }
            handleClose();
        } catch (error) {
            console.error('Failed to save provider', error);
        }
    };

    const handleEdit = (provider: LLMProvider) => {
        setEditingProvider(provider);
        setIsModalOpen(true);
    };

    const handleClose = () => {
        setIsModalOpen(false);
        setEditingProvider(null);
    };

    const handleDeleteClick = (provider: LLMProvider) => {
        setProviderToDelete(provider);
        setDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (providerToDelete) {
            try {
                await deleteMutation.mutateAsync(providerToDelete.id);
                setDeleteModalOpen(false);
                setProviderToDelete(null);
            } catch (error) {
                console.error('Failed to delete provider', error);
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
                        LLM Providers
                    </Typography>
                    <Typography variant="caption" sx={{ color: alpha('#111827', 0.5) }}>
                        Manage your AI backbone.
                    </Typography>
                </Box>
                <SleekButton
                    variant="dark"
                    size="small"
                    startIcon={<Plus size={16} />}
                    onClick={() => setIsModalOpen(true)}
                >
                    Connect
                </SleekButton>
            </Stack>

            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                    gap: 1.5
                }}
            >
                {providers?.map((provider) => (
                    <SleekCard
                        key={provider.id}
                        title={provider.name}
                        subtitle={provider.provider_type}
                        icon={renderProviderIcon(provider.provider_type)}
                        tag={provider.is_active ? 'Active' : 'Inactive'}
                        active={provider.is_active}
                        onEdit={() => handleEdit(provider)}
                        onDelete={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(provider);
                        }}
                        onClick={() => console.log('Select', provider.id)}
                    />
                ))}

                {providers?.length === 0 && (
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
                        <Cpu size={48} strokeWidth={1} style={{ marginBottom: '16px' }} />
                        <Typography variant="body2">No providers connected yet.</Typography>
                    </Box>
                )}
            </Box>

            <SleekModal
                open={isModalOpen}
                onClose={handleClose}
                title={editingProvider ? "Edit LLM Provider" : "Connect LLM Provider"}
            >
                <LLMProviderForm
                    initialData={editingProvider || undefined}
                    onSubmit={handleCreate}
                    onCancel={handleClose}
                    isSubmitting={createMutation.isPending || updateMutation.isPending}
                />
            </SleekModal>

            <DeleteConfirmationModal
                open={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Delete Provider"
                description={`Are you sure you want to delete "${providerToDelete?.name}"? This action cannot be undone.`}
                isDeleting={deleteMutation.isPending}
            />
        </Box>
    );
};

export default LLMProviderPage;
