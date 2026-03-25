import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Stack, alpha } from '@mui/material';
import { ShoppingBag, Wrench } from 'lucide-react';
import { type Tool, ToolsAPI } from '../api/tools-api';
import ToolCard from '../components/ToolCard';
import LoadingSpinner from '../../../components/LoadingSpinner';
import SleekButton from '../../../components/SleekButton';

const MyToolsPage = () => {
    const navigate = useNavigate();
    const [tools, setTools] = useState<Tool[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadMyTools();
    }, []);

    const loadMyTools = async () => {
        try {
            setLoading(true);
            const allTools = await ToolsAPI.list();
            const myTools = allTools.filter(t => t.organization !== null);
            setTools(myTools);
        } catch (err) {
            console.error(err);
            setError("Failed to load your tools.");
        } finally {
            setLoading(false);
        }
    };

    const handleConfigure = (tool: Tool) => {
        navigate(`/tools/configure/${tool.id}`);
    };

    if (loading) return <LoadingSpinner />;

    return (
        <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                <Box>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#111827', mb: 0.2 }}>
                        My Tools
                    </Typography>
                    <Typography variant="caption" sx={{ color: alpha('#111827', 0.5) }}>
                        Manage your active tool integrations.
                    </Typography>
                </Box>
                <SleekButton
                    variant="dark"
                    size="small"
                    startIcon={<ShoppingBag size={16} />}
                    onClick={() => navigate('/tools/marketplace')}
                >
                    Browse Marketplace
                </SleekButton>
            </Stack>

            {error && (
                <Box sx={{ p: 2, mb: 3, bgcolor: alpha('#ef4444', 0.05), borderRadius: '10px', border: '1px solid', borderColor: alpha('#ef4444', 0.1) }}>
                    <Typography variant="body2" color="error">{error}</Typography>
                </Box>
            )}

            {tools.length === 0 ? (
                <Box sx={{ py: 12, textAlign: 'center', opacity: 0.5 }}>
                    <Wrench size={48} strokeWidth={1} style={{ marginBottom: '16px' }} />
                    <Typography variant="body2">No tools configured yet.</Typography>
                    <SleekButton
                        variant="light"
                        sx={{ mt: 2 }}
                        onClick={() => navigate('/tools/marketplace')}
                    >
                        Go to Marketplace
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
                    {tools.map(tool => (
                        <ToolCard key={tool.id} tool={tool} onConfigure={handleConfigure} />
                    ))}
                </Box>
            )}
        </Box>
    );
};

export default MyToolsPage;
