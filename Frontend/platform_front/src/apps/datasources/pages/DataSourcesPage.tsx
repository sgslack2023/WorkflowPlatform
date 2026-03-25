import React, { useState } from 'react';
import { Box, Typography, Stack, alpha, Skeleton } from '@mui/material';
import { Plus, Database, RefreshCw } from 'lucide-react';
import SleekButton from '../../../components/SleekButton';
import SleekCard from '../../../components/SleekCard';
import SleekModal from '../../../components/SleekModal';
import DeleteConfirmationModal from '../../../components/DeleteConfirmationModal';
import { useDataSources, useCreateDataSource, useUpdateDataSource, useDeleteDataSource } from '../api/queries';
import DataSourceForm from '../components/DataSourceForm';
import { useQueryClient } from '@tanstack/react-query';
import type { DataSource } from '../types';

const DataSourcesPage: React.FC = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSource, setEditingSource] = useState<DataSource | null>(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [sourceToDelete, setSourceToDelete] = useState<DataSource | null>(null);

    const { data: dataSources, isLoading } = useDataSources();
    const createMutation = useCreateDataSource();
    const updateMutation = useUpdateDataSource();
    const deleteMutation = useDeleteDataSource();
    const queryClient = useQueryClient();

    const handleCreate = async (data: any) => {
        try {
            if (editingSource) {
                await updateMutation.mutateAsync({ id: editingSource.id, data });
            } else {
                await createMutation.mutateAsync(data);
            }
            handleClose();
        } catch (error) {
            console.error('Failed to save data source', error);
        }
    };

    const handleEdit = (source: DataSource) => {
        setEditingSource(source);
        setIsModalOpen(true);
    };

    const handleDeleteClick = (source: DataSource) => {
        setSourceToDelete(source);
        setDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (sourceToDelete) {
            try {
                await deleteMutation.mutateAsync(sourceToDelete.id);
                setDeleteModalOpen(false);
                setSourceToDelete(null);
            } catch (error) {
                console.error('Failed to delete data source', error);
            }
        }
    };

    const handleClose = () => {
        setIsModalOpen(false);
        setEditingSource(null);
    };

    const handleRefresh = () => {
        queryClient.invalidateQueries({ queryKey: ['dataSources'] });
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
                        Data Sources
                    </Typography>
                    <Typography variant="caption" sx={{ color: alpha('#111827', 0.5) }}>
                        Connect external APIs, databases, and files.
                    </Typography>
                </Box>
                <Stack direction="row" spacing={1}>
                    <SleekButton
                        variant="dark"
                        size="small"
                        startIcon={<Plus size={16} />}
                        onClick={() => setIsModalOpen(true)}
                    >
                        New Source
                    </SleekButton>
                    <SleekButton
                        size="small"
                        variant="light"
                        startIcon={<RefreshCw size={16} />}
                        onClick={handleRefresh}
                    >
                        Refresh
                    </SleekButton>
                </Stack>
            </Stack>

            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 1.5 }}>
                {dataSources?.map((source) => (
                    <SleekCard
                        key={source.id}
                        title={source.name}
                        subtitle={source.source_type.toUpperCase()}
                        icon={<Database size={16} />}
                        tag={source.fetch_mode === 'live' ? 'Live' : 'Batch'}
                        active={true}
                        onEdit={() => handleEdit(source)}
                        onDelete={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(source);
                        }}
                    >
                        <Stack spacing={0.5} sx={{ mt: 1 }}>
                            <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                                Created: {new Date(source.created_at).toLocaleDateString()}
                            </Typography>
                            {source.tables_count !== undefined && source.tables_count > 0 && (
                                <Typography variant="caption" sx={{ display: 'block', color: 'primary.main', fontWeight: 500 }}>
                                    {source.tables_count} Table{source.tables_count !== 1 ? 's' : ''}
                                </Typography>
                            )}
                        </Stack>
                    </SleekCard>
                ))}

                {dataSources?.length === 0 && (
                    <Box sx={{ py: 12, width: '100%', textAlign: 'center', opacity: 0.5, gridColumn: '1 / -1' }}>
                        <Database size={48} strokeWidth={1} style={{ marginBottom: '16px', margin: '0 auto' }} />
                        <Typography variant="body2">No data sources connected.</Typography>
                    </Box>
                )}
            </Box>

            <SleekModal
                open={isModalOpen}
                onClose={handleClose}
                title={editingSource ? "Edit Data Source" : "Connect Data Source"}
            >
                <DataSourceForm
                    initialData={editingSource || undefined}
                    onSubmit={handleCreate}
                    onCancel={handleClose}
                    isSubmitting={createMutation.isPending || updateMutation.isPending}
                />
            </SleekModal>

            <DeleteConfirmationModal
                open={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Delete Data Source"
                description={`Are you sure you want to delete "${sourceToDelete?.name}"? This action cannot be undone.`}
                isDeleting={deleteMutation.isPending}
            />
        </Box>
    );
};

export default DataSourcesPage;
