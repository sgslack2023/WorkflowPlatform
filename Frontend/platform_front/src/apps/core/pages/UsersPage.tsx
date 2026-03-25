import React, { useState } from 'react';
import { Box, Typography, Stack, alpha, Skeleton } from '@mui/material';
import { Plus, User as UserIcon, Shield, RefreshCw } from 'lucide-react';
import SleekButton from '../../../components/SleekButton';
import SleekCard from '../../../components/SleekCard';
import SleekModal from '../../../components/SleekModal';
import DeleteConfirmationModal from '../../../components/DeleteConfirmationModal';
import UserForm from '../components/UserForm';
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser } from '../api/queries';
import { useQueryClient } from '@tanstack/react-query';
import type { User } from '../types';

const UsersPage: React.FC = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);

    // const currentUser = useAuthStore((state) => state.user);

    const { data: users, isLoading } = useUsers();
    const createUserMutation = useCreateUser();
    const updateUserMutation = useUpdateUser();
    const deleteUserMutation = useDeleteUser();

    const handleUserSubmit = async (formData: any) => {
        try {
            if (editingUser) {
                await updateUserMutation.mutateAsync({ id: editingUser.id, data: formData });
            } else {
                await createUserMutation.mutateAsync(formData);
            }
            handleClose();
        } catch (error) {
            console.error('Failed to save user', error);
        }
    };

    const handleEdit = (u: User) => {
        setEditingUser(u);
        setIsModalOpen(true);
    };

    const handleClose = () => {
        setEditingUser(null);
        setIsModalOpen(false);
    };

    const handleDeleteClick = (u: User) => {
        setUserToDelete(u);
        setDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (userToDelete) {
            try {
                await deleteUserMutation.mutateAsync(userToDelete.id);
                setDeleteModalOpen(false);
                setUserToDelete(null);
            } catch (error) {
                console.error('Failed to delete user', error);
            }
        }
    };

    if (isLoading) {
        return (
            <Box>
                <Skeleton variant="text" width={200} height={40} sx={{ mb: 4 }} />
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 1.5 }}>
                    {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} variant="rectangular" height={60} sx={{ borderRadius: '10px' }} />
                    ))}
                </Box>
            </Box>
        );
    }

    const queryClient = useQueryClient();

    const handleRefresh = () => {
        queryClient.invalidateQueries({ queryKey: ['users'] });
    };

    return (
        <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                <Box>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#111827', mb: 0.2 }}>
                        User Management
                    </Typography>
                    <Typography variant="caption" sx={{ color: alpha('#111827', 0.5) }}>
                        Manage independent users and global administrative access.
                    </Typography>
                </Box>
                <Stack direction="row" spacing={1}>
                    <SleekButton
                        variant="contained"
                        size="small"
                        startIcon={<Plus size={16} />}
                        onClick={() => setIsModalOpen(true)}
                    >
                        Add User
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
                {users?.map((u) => (
                    <SleekCard
                        key={u.id}
                        title={u.username}
                        subtitle={u.email}
                        icon={u.is_superuser ? <Shield size={16} /> : <UserIcon size={16} />}
                        tag={u.is_superuser ? 'Superuser' : 'Standard'}
                        active={u.is_active}
                        onEdit={() => handleEdit(u)}
                        onDelete={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(u);
                        }}
                        onClick={() => console.log('User Clicked', u.id)}
                    />
                ))}

                {users?.length === 0 && (
                    <Box sx={{ py: 12, width: '100%', textAlign: 'center', opacity: 0.5, gridColumn: '1 / -1' }}>
                        <UserIcon size={48} strokeWidth={1} style={{ marginBottom: '16px', margin: '0 auto' }} />
                        <Typography variant="body2">No users found.</Typography>
                    </Box>
                )}
            </Box>

            <SleekModal
                open={isModalOpen}
                onClose={handleClose}
                title={editingUser ? "Edit User" : "Register New User"}
            >
                <UserForm
                    initialData={editingUser || undefined}
                    onSubmit={handleUserSubmit}
                    onCancel={handleClose}
                    isSubmitting={createUserMutation.isPending || updateUserMutation.isPending}
                />
            </SleekModal>

            <DeleteConfirmationModal
                open={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Delete User"
                description={`Are you sure you want to delete user "${userToDelete?.username}"? This action cannot be undone.`}
                isDeleting={deleteUserMutation.isPending}
            />
        </Box>
    );
};

export default UsersPage;
