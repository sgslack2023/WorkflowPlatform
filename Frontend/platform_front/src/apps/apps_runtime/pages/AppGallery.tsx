import React, { useEffect, useState } from 'react';
import {
    Box, Typography, alpha,
    Stack, Chip, TextField,
    Checkbox, ListItemText, MenuItem, Select, FormControl, InputLabel,
    Snackbar, Alert
} from '@mui/material';
import { Rocket, Layout, Plus } from 'lucide-react';
import { useWorkflows } from '../../workflows/api/queries';
import { appsApi, type AppDefinition } from '../api/apps-api';
import { useNavigate } from 'react-router-dom';
import SleekModal from '../../../components/SleekModal';
import DeleteConfirmationModal from '../../../components/DeleteConfirmationModal';
import SleekButton from '../../../components/SleekButton';
import SleekCard from '../../../components/SleekCard';
import LoadingSpinner from '../../../components/LoadingSpinner';

const AppGallery: React.FC = () => {
    const [apps, setApps] = useState<AppDefinition[]>([]);
    const [loading, setLoading] = useState(true);
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [newAppName, setNewAppName] = useState('');
    const [newAppDescription, setNewAppDescription] = useState('');
    const [selectedWorkflows, setSelectedWorkflows] = useState<string[]>([]);
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const navigate = useNavigate();

    const { data: publishedWorkflowsData } = useWorkflows({ is_published: true });
    const publishedWorkflows = Array.isArray(publishedWorkflowsData) ? publishedWorkflowsData : (publishedWorkflowsData?.results || []);

    const fetchApps = async () => {
        try {
            const data = await appsApi.listDefinitions();
            setApps(data);
        } catch (err) {
            console.error('Failed to fetch apps', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchApps();
    }, []);

    const handleDeleteApp = async () => {
        if (!deleteId) return;
        setIsDeleting(true);
        try {
            await appsApi.deleteDefinition(deleteId);
            setApps(apps.filter(a => a.public_slug !== deleteId && a.id !== deleteId));
            setDeleteId(null);
        } catch (err) {
            console.error('Failed to delete app', err);
            setError('Failed to delete application');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleCreateApp = async () => {
        if (!newAppName.trim()) return;
        setIsCreating(true);
        try {
            const rawSlug = newAppName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').slice(0, 40);
            const public_slug = `${rawSlug}-${Date.now().toString().slice(-4)}`;

            const app = await appsApi.createDefinition({
                name: newAppName,
                description: newAppDescription,
                public_slug,
                is_published: true,
                workflows: selectedWorkflows,
                layout_config: { widgets: [] }
            });

            setCreateModalOpen(false);
            navigate(`/apps/designer/${app.public_slug}`);
        } catch (err: any) {
            console.error('Failed to create app', err);
            const errorData = err.response?.data;
            const errorMessage = typeof errorData === 'object'
                ? Object.entries(errorData).map(([k, v]) => `${k}: ${JSON.stringify(v)}`).join(', ')
                : (err.message || 'Failed to create application');
            setError(errorMessage);
        } finally {
            setIsCreating(false);
        }
    };

    if (loading) return <LoadingSpinner />;

    return (
        <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                <Box>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#111827', mb: 0.2 }}>
                        Applications
                    </Typography>
                    <Typography variant="caption" sx={{ color: alpha('#111827', 0.5) }}>
                        Ready-to-use interfaces powered by your workflows.
                    </Typography>
                </Box>
                <SleekButton
                    variant="dark"
                    size="small"
                    startIcon={<Layout size={18} />}
                    onClick={() => setCreateModalOpen(true)}
                >
                    Create New App
                </SleekButton>
            </Stack>

            {apps.length === 0 ? (
                <Box sx={{
                    py: 12, textAlign: 'center', opacity: 0.5
                }}>
                    <Rocket size={48} strokeWidth={1} style={{ marginBottom: 16 }} />
                    <Typography variant="body2">No apps published yet</Typography>
                    <SleekButton
                        variant="light"
                        sx={{ mt: 2 }}
                        onClick={() => navigate('/apps/components')}
                    >
                        Browse Workflow Components
                    </SleekButton>
                </Box>
            ) : (
                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                        gap: 1.5
                    }}
                >
                    {apps.map((app) => (
                        <SleekCard
                            key={app.id}
                            title={app.name}
                            subtitle={app.is_published ? 'Live' : 'Draft'}
                            icon={<Rocket size={16} />}
                            tag="App"
                            onClick={() => navigate(`/apps/viewer/${app.public_slug}`)}
                            onEdit={() => navigate(`/apps/designer/${app.public_slug}`)}
                            onDelete={() => setDeleteId(app.public_slug)}
                        >
                            <Typography sx={{
                                color: alpha('#111827', 0.4),
                                fontSize: '11px',
                                mt: 0.5,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                            }}>
                                {app.description || 'No description available for this application.'}
                            </Typography>
                        </SleekCard>
                    ))}
                </Box>
            )}

            <SleekModal
                open={createModalOpen}
                onClose={() => setCreateModalOpen(false)}
                title="Create New Application"
            >
                <Stack spacing={3} sx={{ mt: 1 }}>
                    <Typography sx={{ fontSize: '0.85rem', color: alpha('#111827', 0.6) }}>
                        Give your application a name and description. You can pick initial workflow components to include.
                    </Typography>

                    <TextField
                        fullWidth
                        label="Application Name"
                        placeholder="e.g. Executive Summary Dashboard"
                        value={newAppName}
                        onChange={(e) => setNewAppName(e.target.value)}
                        variant="outlined"
                        size="small"
                        autoFocus
                    />

                    <TextField
                        fullWidth
                        label="Description"
                        placeholder="What is this application for?"
                        value={newAppDescription}
                        onChange={(e) => setNewAppDescription(e.target.value)}
                        variant="outlined"
                        multiline
                        rows={2}
                    />

                    <FormControl fullWidth size="small">
                        <InputLabel>Initial Workflow Components</InputLabel>
                        <Select
                            multiple
                            value={selectedWorkflows}
                            onChange={(e) => setSelectedWorkflows(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
                            renderValue={(selected) => (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                    {selected.map((id) => (
                                        <Chip key={id} label={publishedWorkflows.find((w: any) => w.id === id)?.name || id} size="small" />
                                    ))}
                                </Box>
                            )}
                            label="Initial Workflow Components"
                        >
                            {publishedWorkflows.map((wf: any) => (
                                <MenuItem key={wf.id} value={wf.id}>
                                    <Checkbox checked={selectedWorkflows.indexOf(wf.id) > -1} />
                                    <ListItemText primary={wf.name} />
                                </MenuItem>
                            ))}
                            {publishedWorkflows.length === 0 && (
                                <MenuItem disabled>No published components available</MenuItem>
                            )}
                        </Select>
                    </FormControl>

                    <SleekButton
                        fullWidth
                        variant="dark"
                        size="large"
                        onClick={handleCreateApp}
                        disabled={isCreating || !newAppName.trim()}
                        startIcon={isCreating ? null : <Plus size={18} />}
                        sx={{ py: 1.5 }}
                    >
                        {isCreating ? 'Creating...' : 'Create & Design'}
                    </SleekButton>
                </Stack>
            </SleekModal>

            <DeleteConfirmationModal
                open={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={handleDeleteApp}
                title="Delete Application"
                description="Are you sure you want to delete this application? This action cannot be undone."
                isDeleting={isDeleting}
            />

            <Snackbar
                open={!!error}
                autoHideDuration={6000}
                onClose={() => setError(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={() => setError(null)} severity="error" variant="filled">
                    {error}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default AppGallery;
