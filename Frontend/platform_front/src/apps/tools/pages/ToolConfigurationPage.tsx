import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { type Tool, ToolsAPI } from '../api/tools-api';
import SchemaForm from '../components/SchemaForm';
import { Box, Typography, Divider, Alert } from '@mui/material';
import SleekButton from '../../../components/SleekButton';
import SleekCard from '../../../components/SleekCard';
import LoadingSpinner from '../../../components/LoadingSpinner';

const ToolConfigurationPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [tool, setTool] = useState<Tool | null>(null);
    const [loading, setLoading] = useState(true);
    const [inputs, setInputs] = useState<any>({});
    const [result, setResult] = useState<any>(null);
    const [executionError, setExecutionError] = useState<string | null>(null);
    const [executing, setExecuting] = useState(false);

    useEffect(() => {
        if (id) loadTool(id);
    }, [id]);

    const loadTool = async (toolId: string) => {
        try {
            setLoading(true);
            const data = await ToolsAPI.get(toolId);
            setTool(data);
            // Initialize inputs?
            setInputs(initializeDefaults(data.input_schema));
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // Helper to deeply initialize defaults from schema
    const initializeDefaults = (schema: any): any => {
        if (!schema) return {};
        if (schema.type === 'object' && schema.properties) {
            const defaults: any = {};
            for (const key in schema.properties) {
                const prop = schema.properties[key];
                if (prop.default !== undefined) {
                    defaults[key] = prop.default;
                } else if (prop.type === 'object') {
                    defaults[key] = initializeDefaults(prop);
                }
            }
            return defaults;
        }
        return {};
    };

    const handleExecute = async () => {
        if (!tool) return;
        setExecuting(true);
        setExecutionError(null);
        setResult(null);
        try {
            const execution = await ToolsAPI.execute(tool.id, inputs);
            if (execution.status === 'failed') {
                setExecutionError(execution.error_message || "Execution failed");
                if (execution.output_data) setResult(execution.output_data);
            } else {
                setResult(execution.output_data);
            }
        } catch (err: any) {
            setExecutionError(err.message || "Execution failed");
        } finally {
            setExecuting(false);
        }
    };

    const handleSave = async () => {
        if (!tool) return;
        setLoading(true); // Re-use loading state or add separate saving state
        try {
            // Generate a unique key for the new tool (simple random suffix for now)
            const randomSuffix = Math.random().toString(36).substring(7);

            const newToolData = {
                name: `${tool.name} (Copy)`,
                key: `${tool.key}_copy_${randomSuffix}`,
                description: tool.description,
                python_path: tool.python_path,
                execution_mode: tool.execution_mode,
                input_schema: tool.input_schema,
                output_schema: tool.output_schema,
                algo_parameters: { ...tool.algo_parameters, ...inputs }
            };

            await ToolsAPI.create(newToolData);
            alert("Tool saved successfully to My Tools!");
            navigate('/tools/library'); // Or to My Tools
        } catch (error: any) {
            console.error(error);
            alert(`Failed to save tool: ${error.message || "Unknown error"}`);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <LoadingSpinner />;
    if (!tool) return <div>Tool not found</div>;

    return (
        <Box sx={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '2rem' }}>
            <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="h5" fontWeight="bold">{tool.name}</Typography>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <SleekButton onClick={() => navigate('/tools')} variant="outlined">Back to Library</SleekButton>
                    {tool.organization === null && (
                        <SleekButton onClick={handleSave} variant="outlined">Save as My Tool</SleekButton>
                    )}
                </div>
            </Box>

            <SleekCard title="Configuration">
                <Box sx={{ p: 2 }}>
                    <Typography variant="body2" color="text.secondary" paragraph>
                        {tool.description}
                    </Typography>

                    <Divider sx={{ my: 2 }} />

                    <SchemaForm
                        schema={tool.input_schema}
                        value={inputs}
                        onChange={setInputs}
                    />

                    <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                        <SleekButton onClick={handleExecute} disabled={executing}>
                            {executing ? 'Executing...' : 'Run Tool'}
                        </SleekButton>
                    </Box>
                </Box>
            </SleekCard>

            {/* Results Section */}
            {(result || executionError) && (
                <Box sx={{ mt: 3 }}>
                    <SleekCard title="Execution Result">
                        {executionError && (
                            <Alert severity="error" sx={{ m: 2 }}>{executionError}</Alert>
                        )}
                        {result && (
                            <Box sx={{ p: 2, background: '#f8f9fa', borderRadius: '8px', overflow: 'auto' }}>
                                <pre style={{ margin: 0 }}>{JSON.stringify(result, null, 2)}</pre>
                            </Box>
                        )}
                    </SleekCard>
                </Box>
            )}
        </Box>
    );
};

export default ToolConfigurationPage;
