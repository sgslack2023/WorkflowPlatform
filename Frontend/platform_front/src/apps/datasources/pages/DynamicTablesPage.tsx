import React, { useState } from 'react';
import { Box, Typography, Stack, alpha, Skeleton } from '@mui/material';
import { Plus, Table, RefreshCw } from 'lucide-react';
import SleekButton from '../../../components/SleekButton';
import SleekCard from '../../../components/SleekCard';
import SleekModal from '../../../components/SleekModal';
import DeleteConfirmationModal from '../../../components/DeleteConfirmationModal';
import { useDynamicTables, useCreateDynamicTable, useUpdateDynamicTable, useDeleteDynamicTable } from '../api/queries';
import DynamicTableForm from '../components/DynamicTableForm';
import { useQueryClient } from '@tanstack/react-query';
import type { DynamicTable } from '../types';

const DynamicTablesPage: React.FC = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTable, setEditingTable] = useState<DynamicTable | null>(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [tableToDelete, setTableToDelete] = useState<DynamicTable | null>(null);

    const { data: dynamicTables, isLoading } = useDynamicTables();
    const createMutation = useCreateDynamicTable();
    const updateMutation = useUpdateDynamicTable();
    const deleteMutation = useDeleteDynamicTable();
    const queryClient = useQueryClient();

    const handleCreate = async (data: any) => {
        try {
            if (editingTable) {
                await updateMutation.mutateAsync({ id: editingTable.id, data });
            } else {
                await createMutation.mutateAsync(data);
            }
            handleClose();
        } catch (error) {
            console.error('Failed to save dynamic table', error);
        }
    };

    const handleEdit = (table: DynamicTable) => {
        setEditingTable(table);
        setIsModalOpen(true);
    };

    const handleDeleteClick = (table: DynamicTable) => {
        setTableToDelete(table);
        setDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (tableToDelete) {
            try {
                await deleteMutation.mutateAsync(tableToDelete.id);
                setDeleteModalOpen(false);
                setTableToDelete(null);
            } catch (error) {
                console.error('Failed to delete dynamic table', error);
            }
        }
    };

    const handleClose = () => {
        setIsModalOpen(false);
        setEditingTable(null);
    };

    const handleRefresh = () => {
        queryClient.invalidateQueries({ queryKey: ['dynamicTables'] });
    };

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
                        Dynamic Tables
                    </Typography>
                    <Typography variant="caption" sx={{ color: alpha('#111827', 0.5) }}>
                        Manage flexible schemas and data storage.
                    </Typography>
                </Box>
                <Stack direction="row" spacing={1}>
                    <SleekButton
                        variant="contained"
                        size="small"
                        startIcon={<Plus size={16} />}
                        onClick={() => setIsModalOpen(true)}
                    >
                        New Table
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

            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 1.5 }}>
                {dynamicTables?.map((table) => (
                    <SleekCard
                        key={table.id}
                        title={table.name}
                        subtitle={`${table.schema_definition?.columns?.length || 0} Columns`}
                        icon={<Table size={16} />}
                        tag={table.data_source ? 'Linked' : 'Manual'}
                        active={true}
                        onEdit={() => handleEdit(table)}
                        onDelete={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(table);
                        }}
                    >
                        <Stack spacing={0.5} sx={{ mt: 1 }}>
                            <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                                Created: {new Date(table.created_at).toLocaleDateString()}
                            </Typography>
                            {table.last_fetched_at && (
                                <Typography variant="caption" sx={{ display: 'block', color: 'success.main' }}>
                                    Synced: {new Date(table.last_fetched_at).toLocaleDateString()}
                                </Typography>
                            )}
                        </Stack>
                    </SleekCard>
                ))}

                {dynamicTables?.length === 0 && (
                    <Box sx={{ py: 12, width: '100%', textAlign: 'center', opacity: 0.5, gridColumn: '1 / -1' }}>
                        <Table size={48} strokeWidth={1} style={{ marginBottom: '16px', margin: '0 auto' }} />
                        <Typography variant="body2">No dynamic tables found.</Typography>
                    </Box>
                )}
            </Box>

            <SleekModal
                open={isModalOpen}
                onClose={handleClose}
                title={editingTable ? "Edit Dynamic Table" : "Create Dynamic Table"}
                maxWidth="650px"
            >
                <DynamicTableForm
                    initialData={editingTable || undefined}
                    onSubmit={handleCreate}
                    onCancel={handleClose}
                    isSubmitting={createMutation.isPending || updateMutation.isPending}
                />
            </SleekModal>

            <DeleteConfirmationModal
                open={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Delete Dynamic Table"
                description={`Are you sure you want to delete "${tableToDelete?.name}"? This action cannot be undone.`}
                isDeleting={deleteMutation.isPending}
            />
        </Box>
    );
};

export default DynamicTablesPage;
