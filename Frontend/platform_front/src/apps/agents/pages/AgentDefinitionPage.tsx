import React, { useState } from 'react';
import { Box, Typography, Stack, alpha, Skeleton, Tooltip, IconButton } from '@mui/material';
import { Plus, Bot, Play, Terminal, Code } from 'lucide-react';
import SleekButton from '../../../components/SleekButton';
import SleekCard from '../../../components/SleekCard';
import SleekModal from '../../../components/SleekModal';
import DeleteConfirmationModal from '../../../components/DeleteConfirmationModal';
import AgentDefinitionForm from '../components/AgentDefinitionForm';
import {
    useAgentDefinitions,
    useCreateAgentDefinition,
    useUpdateAgentDefinition,
    useDeleteAgentDefinition,
    useTestAgent
} from '../api/queries';
import type { AgentDefinition } from '../types';
import { TextField, CircularProgress, Divider } from '@mui/material';

const AgentDefinitionPage: React.FC = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAgent, setEditingAgent] = useState<AgentDefinition | null>(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [agentToDelete, setAgentToDelete] = useState<AgentDefinition | null>(null);
    const [testModalOpen, setTestModalOpen] = useState(false);
    const [agentToTest, setAgentToTest] = useState<AgentDefinition | null>(null);
    const [testInput, setTestInput] = useState('');
    const [testResponse, setTestResponse] = useState<string | null>(null);

    const { data: agents, isLoading } = useAgentDefinitions();
    const createMutation = useCreateAgentDefinition();
    const updateMutation = useUpdateAgentDefinition();
    const deleteMutation = useDeleteAgentDefinition();
    const testMutation = useTestAgent();

    const handleCreate = async (formData: any) => {
        try {
            if (editingAgent) {
                await updateMutation.mutateAsync({ id: editingAgent.id, data: formData });
            } else {
                await createMutation.mutateAsync(formData);
            }
            handleClose();
        } catch (error) {
            console.error('Failed to save agent', error);
        }
    };

    const handleEdit = (agent: AgentDefinition) => {
        setEditingAgent(agent);
        setIsModalOpen(true);
    };

    const handleClose = () => {
        setIsModalOpen(false);
        setEditingAgent(null);
    };

    const handleDeleteClick = (agent: AgentDefinition) => {
        setAgentToDelete(agent);
        setDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (agentToDelete) {
            try {
                await deleteMutation.mutateAsync(agentToDelete.id);
                setDeleteModalOpen(false);
                setAgentToDelete(null);
            } catch (error) {
                console.error('Failed to delete agent', error);
            }
        }
    };

    const handleTestClick = (agent: AgentDefinition) => {
        setAgentToTest(agent);
        setTestInput('');
        setTestResponse(null);
        setTestModalOpen(true);
    };

    const handleSendTest = async () => {
        if (!testInput.trim() || !agentToTest) return;

        try {
            const response = await testMutation.mutateAsync({ id: agentToTest.id, message: testInput });
            setTestResponse(response.content);
        } catch (error) {
            setTestResponse("Error: Failed to get response from agent. Check backend logs.");
        }
    };

    if (isLoading) {
        return (
            <Box>
                <Skeleton variant="text" width={200} height={40} sx={{ mb: 4 }} />
                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
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
                        Agent Definitions
                    </Typography>
                    <Typography variant="caption" sx={{ color: alpha('#111827', 0.5) }}>
                        Assemble and deploy your AI team.
                    </Typography>
                </Box>
                <SleekButton
                    variant="dark"
                    size="small"
                    startIcon={<Plus size={16} />}
                    onClick={() => setIsModalOpen(true)}
                >
                    Deploy Agent
                </SleekButton>
            </Stack>

            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                    gap: 1.5
                }}
            >
                {agents?.map((agent) => (
                    <SleekCard
                        key={agent.id}
                        title={agent.name}
                        subtitle={agent.is_active ? 'Active' : 'Draft'}
                        icon={<Bot size={16} />}
                        tag="Agent"
                        active={agent.is_active}
                        onEdit={() => handleEdit(agent)}
                        onDelete={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(agent);
                        }}
                        actionIcon={
                            <Tooltip title="Test Agent" arrow>
                                <IconButton
                                    size="small"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleTestClick(agent);
                                    }}
                                    sx={{
                                        p: '5px',
                                        borderRadius: '6px',
                                        color: alpha('#6366f1', 0.5),
                                        '&:hover': {
                                            bgcolor: alpha('#6366f1', 0.08),
                                            color: '#6366f1',
                                        }
                                    }}
                                >
                                    <Play size={13} />
                                </IconButton>
                            </Tooltip>
                        }
                    />
                ))}

                {agents?.length === 0 && (
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
                        <Bot size={48} strokeWidth={1} style={{ marginBottom: '16px' }} />
                        <Typography variant="body2">No agents deployed.</Typography>
                    </Box>
                )}
            </Box>

            <SleekModal
                open={isModalOpen}
                onClose={handleClose}
                title={editingAgent ? "Edit Agent Definition" : "Deploy New Agent"}
            >
                <AgentDefinitionForm
                    initialData={editingAgent || undefined}
                    onSubmit={handleCreate}
                    onCancel={handleClose}
                    isSubmitting={createMutation.isPending || updateMutation.isPending}
                />
            </SleekModal>

            <SleekModal
                open={testModalOpen}
                onClose={() => setTestModalOpen(false)}
                title={`Agent Playground: ${agentToTest?.name}`}
                maxWidth="600px"
            >
                <Box sx={{ p: 0 }}>
                    <Box sx={{ p: 2 }}>
                        <Typography variant="overline" sx={{ color: '#6366f1', fontWeight: 800, mb: 1.5, display: 'block', letterSpacing: '0.05em' }}>
                            INPUT PARAMETERS
                        </Typography>
                        <TextField
                            fullWidth
                            multiline
                            rows={4}
                            placeholder="Describe the task or question for the agent..."
                            value={testInput}
                            onChange={(e) => setTestInput(e.target.value)}
                            disabled={testMutation.isPending}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: '12px',
                                    bgcolor: alpha('#f8fafc', 0.5),
                                    border: '1px solid',
                                    borderColor: alpha('#e2e8f0', 0.8),
                                    fontSize: '0.9rem',
                                    transition: 'all 0.2s',
                                    '&:hover': { borderColor: '#6366f1' },
                                    '&.Mui-focused': { borderColor: '#6366f1', bgcolor: '#fff' },
                                    '& fieldset': { border: 'none' }
                                }
                            }}
                        />
                        <Stack direction="row" justifyContent="flex-end" sx={{ mt: 2 }}>
                            <SleekButton
                                variant="dark"
                                size="small"
                                onClick={handleSendTest}
                                loading={testMutation.isPending}
                                disabled={!testInput.trim()}
                                startIcon={<Play size={14} />}
                                sx={{ borderRadius: '8px', px: 3, height: '36px' }}
                            >
                                Execute Agent
                            </SleekButton>
                        </Stack>
                    </Box>

                    <Divider sx={{ opacity: 0.5 }} />

                    <Box sx={{ p: 2, bgcolor: alpha('#f8fafc', 0.3), minHeight: '180px' }}>
                        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                            <Terminal size={14} style={{ color: '#6366f1' }} />
                            <Typography variant="overline" sx={{ color: '#1e293b', fontWeight: 900, letterSpacing: '0.05em' }}>
                                RESPONSE PREVIEW
                            </Typography>
                        </Stack>

                        {testMutation.isPending ? (
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 4, gap: 2 }}>
                                <CircularProgress size={24} thickness={5} sx={{ color: '#6366f1' }} />
                                <Typography variant="caption" sx={{ color: alpha('#1e293b', 0.6), fontWeight: 600 }}>
                                    Processing request...
                                </Typography>
                            </Box>
                        ) : testResponse ? (
                            <Box sx={{
                                p: 2,
                                borderRadius: '8px',
                                border: '1px solid',
                                borderColor: '#e2e8f0',
                                bgcolor: '#fff',
                                width: '100%'
                            }}>
                                <Typography sx={{
                                    fontSize: '0.9rem',
                                    color: '#1e293b',
                                    lineHeight: 1.6,
                                    whiteSpace: 'pre-wrap'
                                }}>
                                    {testResponse}
                                </Typography>
                            </Box>
                        ) : (
                            <Box sx={{
                                py: 6,
                                textAlign: 'center',
                                opacity: 0.2,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                border: '2px dashed',
                                borderColor: alpha('#111827', 0.1),
                                borderRadius: '12px'
                            }}>
                                <Code size={32} strokeWidth={1} style={{ marginBottom: '12px' }} />
                                <Typography variant="caption" sx={{ fontWeight: 600 }}>Ready for execution</Typography>
                            </Box>
                        )}
                    </Box>
                </Box>
            </SleekModal>

            <DeleteConfirmationModal
                open={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Delete Agent"
                description={`Are you sure you want to delete agent "${agentToDelete?.name}"? This action cannot be undone.`}
                isDeleting={deleteMutation.isPending}
            />
        </Box>
    );
};

export default AgentDefinitionPage;
