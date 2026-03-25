import React, { useState } from 'react';
import { Box, Typography, Stack, alpha, Skeleton } from '@mui/material';
import { Plus, Building2, RefreshCw } from 'lucide-react';
import SleekButton from '../../../components/SleekButton';
import SleekCard from '../../../components/SleekCard';
import SleekModal from '../../../components/SleekModal';
import DeleteConfirmationModal from '../../../components/DeleteConfirmationModal';
import OrganizationForm from '../components/OrganizationForm';
import { useOrganizations, useCreateOrganization, useUpdateOrganization, useDeleteOrganization } from '../api/queries';
import { useQueryClient } from '@tanstack/react-query';
import type { Organization } from '../types';

const OrganizationsPage: React.FC = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [orgToDelete, setOrgToDelete] = useState<Organization | null>(null);

    // const user = useAuthStore((state) => state.user);
    const { data: organizations, isLoading } = useOrganizations();
    const createMutation = useCreateOrganization();
    const updateMutation = useUpdateOrganization();
    const deleteMutation = useDeleteOrganization();

    const handleCreate = async (formData: any) => {
        try {
            if (editingOrg) {
                await updateMutation.mutateAsync({ id: editingOrg.id, data: formData });
            } else {
                await createMutation.mutateAsync(formData);
            }
            handleClose();
        } catch (error) {
            console.error('Failed to save organization', error);
        }
    };

    const handleEdit = (org: Organization) => {
        setEditingOrg(org);
        setIsModalOpen(true);
    };

    const handleClose = () => {
        setIsModalOpen(false);
        setEditingOrg(null);
    };

    const handleDeleteClick = (org: Organization) => {
        setOrgToDelete(org);
        setDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (orgToDelete) {
            try {
                await deleteMutation.mutateAsync(orgToDelete.id);
                setDeleteModalOpen(false);
                setOrgToDelete(null);
            } catch (error) {
                console.error('Failed to delete organization', error);
            }
        }
    };

    if (isLoading) {
        return (
            <Box>
                <Skeleton variant="text" width={200} height={40} sx={{ mb: 4 }} />
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 1.5 }}>
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} variant="rectangular" height={60} sx={{ borderRadius: '10px' }} />
                    ))}
                </Box>
            </Box>
        );
    }

    const queryClient = useQueryClient();

    const handleRefresh = () => {
        queryClient.invalidateQueries({ queryKey: ['organizations'] });
    };

    return (
        <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                <Box>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#111827', mb: 0.2 }}>
                        Organizations
                    </Typography>
                    <Typography variant="caption" sx={{ color: alpha('#111827', 0.5) }}>
                        Manage corporate entities and workspaces.
                    </Typography>
                </Box>
                <Stack direction="row" spacing={1}>
                    <SleekButton
                        variant="contained"
                        size="small"
                        startIcon={<Plus size={16} />}
                        onClick={() => setIsModalOpen(true)}
                    >
                        New Org
                    </SleekButton>
                    <SleekButton
                        size="small"
                        variant="outlined"
                        startIcon={<RefreshCw size={16} />}
                        onClick={handleRefresh}
                    >
                        Refresh
                    </SleekButton>
                </Stack>
            </Stack>

            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                    gap: 1.5
                }}
            >
                {organizations?.map((org) => (
                    <SleekCard
                        key={org.id}
                        title={org.name}
                        subtitle={org.slug}
                        icon={<Building2 size={16} />}
                        tag={org.is_active ? 'Active' : 'Archived'}
                        active={org.is_active}
                        onEdit={() => handleEdit(org)}
                        onDelete={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(org);
                        }}
                        onClick={() => console.log('Select Org', org.id)}
                    />
                ))}

                {organizations?.length === 0 && (
                    <Box sx={{ py: 12, width: '100%', textAlign: 'center', opacity: 0.5, gridColumn: '1 / -1' }}>
                        <Building2 size={48} strokeWidth={1} style={{ marginBottom: '16px', margin: '0 auto' }} />
                        <Typography variant="body2">No organizations found.</Typography>
                    </Box>
                )}
            </Box>

            <SleekModal
                open={isModalOpen}
                onClose={handleClose}
                title={editingOrg ? "Edit Organization" : "Create Organization"}
            >
                <OrganizationForm
                    initialData={editingOrg || undefined}
                    onSubmit={handleCreate}
                    onCancel={handleClose}
                    isSubmitting={createMutation.isPending || updateMutation.isPending}
                />
            </SleekModal>

            <DeleteConfirmationModal
                open={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Delete Organization"
                description={`Are you sure you want to delete "${orgToDelete?.name}"? This action cannot be undone.`}
                isDeleting={deleteMutation.isPending}
            />
        </Box>
    );
};

export default OrganizationsPage;
