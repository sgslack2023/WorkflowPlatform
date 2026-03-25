import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { type Tool, ToolsAPI } from '../api/tools-api';
import ToolCard from '../components/ToolCard';
import LoadingSpinner from '../../../components/LoadingSpinner';

const ToolLibrary = () => {
    const navigate = useNavigate();
    const [tools, setTools] = useState<Tool[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadTools();
    }, []);

    const loadTools = async () => {
        try {
            setLoading(true);
            const data = await ToolsAPI.list();
            setTools(data);
        } catch (err) {
            console.error(err);
            setError("Failed to load tools.");
        } finally {
            setLoading(false);
        }
    };

    const handleConfigure = (tool: Tool) => {
        navigate(`/tools/configure/${tool.id}`);
    };

    if (loading) return <LoadingSpinner />;
    if (error) return <div style={{ color: 'red', padding: '1rem' }}>{error}</div>;

    const categories = Array.from(new Set(tools.map(t => t.key.split('.')[0])));

    return (
        <div>
            {categories.map(category => (
                <div key={category} style={{ marginBottom: '2rem' }}>
                    <h3 style={{ textTransform: 'capitalize', marginBottom: '1rem', color: '#444' }}>
                        {category} Tools
                    </h3>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                        gap: '1.5rem'
                    }}>
                        {tools.filter(t => t.key.startsWith(category)).map(tool => (
                            <ToolCard key={tool.id} tool={tool} onConfigure={handleConfigure} />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ToolLibrary;
