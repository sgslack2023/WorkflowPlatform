import React from 'react';
import { Box, Stack, Typography, TextField, MenuItem, IconButton, alpha } from '@mui/material';
import { Plus, Minus } from 'lucide-react';
import {
    TableSelector,
    sectionTitle,
    selectFieldSx,
    type TransformConfigProps,
} from './shared';

const RenameConfig: React.FC<TransformConfigProps> = ({ params, onChange, allTables, isLoading }) => {
    const selectedTable = allTables.find(t => t.id === params.source_table);
    const columns = selectedTable?.columns || [];
    const mappings = params.mappings || [];

    const addMapping = () => {
        onChange('mappings', [...mappings, { old_name: '', new_name: '' }]);
    };

    const removeMapping = (idx: number) => {
        onChange('mappings', mappings.filter((_: any, i: number) => i !== idx));
    };

    const updateMapping = (idx: number, field: string, value: string) => {
        const updated = [...mappings];
        updated[idx] = { ...updated[idx], [field]: value };
        onChange('mappings', updated);
    };

    return (
        <Stack spacing={3}>
            <TableSelector
                label="Source Table"
                tables={allTables}
                value={params.source_table || ''}
                onChange={(id) => onChange('source_table', id)}
                isLoading={isLoading}
            />

            {selectedTable && (
                <Box>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                        <Typography sx={sectionTitle}>Column Mappings</Typography>
                        <IconButton size="small" onClick={addMapping} sx={{ color: '#6366f1' }}>
                            <Plus size={14} />
                        </IconButton>
                    </Stack>
                    <Stack spacing={1.5}>
                        {mappings.map((mapping: any, idx: number) => (
                            <Box key={idx} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                <TextField
                                    select
                                    size="small"
                                    label="Current Name"
                                    value={mapping.old_name || ''}
                                    onChange={(e) => updateMapping(idx, 'old_name', e.target.value)}
                                    sx={{ flex: 1, ...selectFieldSx }}
                                >
                                    {columns.map((c: any) => (
                                        <MenuItem key={c.name} value={c.name}>
                                            {c.name}
                                        </MenuItem>
                                    ))}
                                </TextField>
                                <Typography sx={{ color: '#94a3b8', fontSize: '0.875rem' }}>→</Typography>
                                <TextField
                                    size="small"
                                    label="New Name"
                                    value={mapping.new_name || ''}
                                    onChange={(e) => updateMapping(idx, 'new_name', e.target.value)}
                                    sx={{ flex: 1, ...selectFieldSx }}
                                />
                                <IconButton size="small" onClick={() => removeMapping(idx)} sx={{ color: '#ef4444' }}>
                                    <Minus size={14} />
                                </IconButton>
                            </Box>
                        ))}
                        {mappings.length === 0 && (
                            <Box sx={{
                                p: 2, textAlign: 'center', borderRadius: '8px',
                                border: '1px dashed', borderColor: alpha('#111827', 0.12),
                            }}>
                                <Typography sx={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                                    Click + to add a column rename mapping
                                </Typography>
                            </Box>
                        )}
                    </Stack>
                </Box>
            )}
        </Stack>
    );
};

export default RenameConfig;
