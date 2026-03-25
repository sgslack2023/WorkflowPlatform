import React, { useState } from 'react';
import { TextField, Button, MenuItem, FormControl, InputLabel, Select, Stack, Typography, Divider, IconButton } from '@mui/material';
import { Plus, Trash2 } from 'lucide-react';
import type { DataSource } from '../types';

interface DataSourceFormProps {
    initialData?: Partial<DataSource>;
    onSubmit: (data: any) => Promise<void>;
    onCancel: () => void;
    isSubmitting: boolean;
}

const DataSourceForm: React.FC<DataSourceFormProps> = ({ initialData, onSubmit, onCancel, isSubmitting }) => {
    const [name, setName] = useState(initialData?.name || '');
    const [sourceType, setSourceType] = useState<'database' | 'csv' | 'api'>(initialData?.source_type || 'database');
    const [fetchMode, setFetchMode] = useState<'live' | 'batch'>(initialData?.fetch_mode || 'live');

    // Config states
    const [dbConfig, setDbConfig] = useState({
        host: initialData?.config?.host || '',
        port: initialData?.config?.port || '5432',
        database: initialData?.config?.database || '',
        user: initialData?.config?.user || '',
        password: initialData?.config?.password || '',
        type: initialData?.config?.type || 'postgres' // postgres, mysql, etc.
    });

    const [apiConfig, setApiConfig] = useState({
        url: initialData?.config?.url || '',
        method: initialData?.config?.method || 'GET',
        headers: initialData?.config?.headers || [] // Array of { key, value }
    });

    const [csvConfig, setCsvConfig] = useState({
        url: initialData?.config?.url || '', // S3 or remote URL for now
        delimiter: initialData?.config?.delimiter || ','
    });

    const handleDbChange = (field: string, value: string) => {
        setDbConfig(prev => ({ ...prev, [field]: value }));
    };

    const handleApiChange = (field: string, value: any) => {
        setApiConfig(prev => ({ ...prev, [field]: value }));
    };

    const handleApiHeaderChange = (index: number, field: 'key' | 'value', value: string) => {
        const newHeaders = [...apiConfig.headers];
        newHeaders[index] = { ...newHeaders[index], [field]: value };
        setApiConfig(prev => ({ ...prev, headers: newHeaders }));
    };

    const addApiHeader = () => {
        setApiConfig(prev => ({ ...prev, headers: [...prev.headers, { key: '', value: '' }] }));
    };

    const removeApiHeader = (index: number) => {
        const newHeaders = apiConfig.headers.filter((_: any, i: number) => i !== index);
        setApiConfig(prev => ({ ...prev, headers: newHeaders }));
    };

    const handleCsvChange = (field: string, value: string) => {
        setCsvConfig(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        let config = {};
        if (sourceType === 'database') {
            config = dbConfig;
        } else if (sourceType === 'api') {
            config = apiConfig;
        } else if (sourceType === 'csv') {
            config = csvConfig;
        }

        onSubmit({
            name,
            source_type: sourceType,
            fetch_mode: fetchMode,
            config
        });
    };

    return (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1rem' }}>
            <TextField
                label="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                fullWidth
            />

            <Stack direction="row" spacing={2}>
                <FormControl fullWidth>
                    <InputLabel>Source Type</InputLabel>
                    <Select
                        value={sourceType}
                        label="Source Type"
                        onChange={(e) => setSourceType(e.target.value as any)}
                    >
                        <MenuItem value="database">Database</MenuItem>
                        <MenuItem value="csv">CSV / File</MenuItem>
                        <MenuItem value="api">API</MenuItem>
                    </Select>
                </FormControl>
                <FormControl fullWidth>
                    <InputLabel>Fetch Mode</InputLabel>
                    <Select
                        value={fetchMode}
                        label="Fetch Mode"
                        onChange={(e) => setFetchMode(e.target.value as any)}
                    >
                            <MenuItem value="live">Live (Real-time)</MenuItem>
                            <MenuItem value="batch">Batch (Scheduled)</MenuItem>
                        </Select>
                    </FormControl>
            </Stack>

            <Divider sx={{ my: 1 }} />
            <Typography variant="subtitle2" color="primary">Connection Details</Typography>

            {sourceType === 'database' && (
                <Stack spacing={2}>
                    <FormControl fullWidth>
                        <InputLabel>Database Type</InputLabel>
                        <Select
                            value={dbConfig.type}
                            label="Database Type"
                            onChange={(e) => handleDbChange('type', e.target.value)}
                        >
                            <MenuItem value="postgres">PostgreSQL</MenuItem>
                            <MenuItem value="mysql">MySQL</MenuItem>
                            <MenuItem value="mssql">SQL Server</MenuItem>
                        </Select>
                    </FormControl>
                    <Stack direction="row" spacing={2}>
                        <TextField
                            label="Host"
                            value={dbConfig.host}
                            onChange={(e) => handleDbChange('host', e.target.value)}
                            fullWidth
                            required={sourceType === 'database'}
                        />
                        <TextField
                            label="Port"
                            value={dbConfig.port}
                            onChange={(e) => handleDbChange('port', e.target.value)}
                            sx={{ width: '150px' }}
                        />
                    </Stack>
                    <TextField
                        label="Database Name"
                        value={dbConfig.database}
                        onChange={(e) => handleDbChange('database', e.target.value)}
                        fullWidth
                        required={sourceType === 'database'}
                    />
                    <Stack direction="row" spacing={2}>
                        <TextField
                            label="Username"
                            value={dbConfig.user}
                            onChange={(e) => handleDbChange('user', e.target.value)}
                            fullWidth
                        />
                        <TextField
                            label="Password"
                            type="password"
                            value={dbConfig.password}
                            onChange={(e) => handleDbChange('password', e.target.value)}
                            fullWidth
                        />
                    </Stack>
                </Stack>
            )}

            {sourceType === 'api' && (
                <Stack spacing={2}>
                    <Stack direction="row" spacing={2}>
                        <FormControl sx={{ minWidth: 120 }}>
                            <InputLabel>Method</InputLabel>
                            <Select
                                value={apiConfig.method}
                                label="Method"
                                onChange={(e) => handleApiChange('method', e.target.value)}
                            >
                                <MenuItem value="GET">GET</MenuItem>
                                <MenuItem value="POST">POST</MenuItem>
                            </Select>
                        </FormControl>
                        <TextField
                            label="Base URL"
                            value={apiConfig.url}
                            onChange={(e) => handleApiChange('url', e.target.value)}
                            fullWidth
                            required={sourceType === 'api'}
                            placeholder="https://api.example.com/v1"
                        />
                    </Stack>

                    <Typography variant="caption" sx={{ fontWeight: 600, mt: 1 }}>Headers</Typography>
                    {apiConfig.headers.map((header: any, index: number) => (
                        <Stack key={index} direction="row" spacing={1} alignItems="center">
                            <TextField
                                label="Key"
                                size="small"
                                value={header.key}
                                onChange={(e) => handleApiHeaderChange(index, 'key', e.target.value)}
                                sx={{ flex: 1 }}
                            />
                            <TextField
                                label="Value"
                                size="small"
                                value={header.value}
                                onChange={(e) => handleApiHeaderChange(index, 'value', e.target.value)}
                                sx={{ flex: 1 }}
                            />
                            <IconButton size="small" onClick={() => removeApiHeader(index)} color="error">
                                <Trash2 size={16} />
                            </IconButton>
                        </Stack>
                    ))}
                    <Button
                        startIcon={<Plus size={16} />}
                        onClick={addApiHeader}
                        variant="outlined"
                        size="small"
                        sx={{ alignSelf: 'flex-start' }}
                    >
                        Add Header
                    </Button>
                </Stack>
            )}

            {sourceType === 'csv' && (
                <Stack spacing={2}>
                    <TextField
                        label="File URL / Path"
                        value={csvConfig.url}
                        onChange={(e) => handleCsvChange('url', e.target.value)}
                        fullWidth
                        required={sourceType === 'csv'}
                        helperText="Provide a URL to the CSV file (e.g., S3 signed URL or public URL)"
                    />
                    <TextField
                        label="Delimiter"
                        value={csvConfig.delimiter}
                        onChange={(e) => handleCsvChange('delimiter', e.target.value)}
                        sx={{ width: '150px' }}
                    />
                </Stack>
            )}

            <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 2 }}>
                <Button onClick={onCancel} disabled={isSubmitting}>
                    Cancel
                </Button>
                <Button type="submit" variant="contained" disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : 'Save Data Source'}
                </Button>
            </Stack>
        </form>
    );
};

export default DataSourceForm;
