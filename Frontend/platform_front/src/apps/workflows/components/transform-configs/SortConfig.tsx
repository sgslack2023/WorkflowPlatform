import React from 'react';
import { Box, Stack, Typography, TextField, MenuItem, IconButton, Chip, alpha } from '@mui/material';
import { Plus, Minus } from 'lucide-react';
import {
    TableSelector,
    sectionTitle,
    selectFieldSx,
    chipStyle,
    type TransformConfigProps,
} from './shared';

const SortConfig: React.FC<TransformConfigProps> = ({ params, onChange, allTables, isLoading }) => {
    const selectedTable = allTables.find(t => t.id === params.source_table);
    const columns = selectedTable?.columns || [];
    const sortColumns = params.sort_columns || [];

    const addSort = () => {
        onChange('sort_columns', [...sortColumns, { column: '', order: 'ASC' }]);
    };
    const removeSort = (idx: number) => {
        onChange('sort_columns', sortColumns.filter((_: any, i: number) => i !== idx));
    };
    const updateSort = (idx: number, field: string, value: string) => {
        const updated = [...sortColumns];
        updated[idx] = { ...updated[idx], [field]: value };
        onChange('sort_columns', updated);
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
                        <Typography sx={sectionTitle}>Sort Rules</Typography>
                        <IconButton size="small" onClick={addSort} sx={{ color: '#6366f1' }}>
                            <Plus size={14} />
                        </IconButton>
                    </Stack>
                    <Stack spacing={1.5}>
                        {sortColumns.map((sort: any, idx: number) => (
                            <Box key={idx} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                <TextField
                                    select size="small" label="Column"
                                    value={sort.column || ''}
                                    onChange={(e) => updateSort(idx, 'column', e.target.value)}
                                    sx={{ flex: 1, ...selectFieldSx }}
                                >
                                    {columns.map(c => <MenuItem key={c.name} value={c.name}>{c.name}</MenuItem>)}
                                </TextField>
                                <Stack direction="row" gap={0.5}>
                                    <Chip
                                        label="ASC" size="small" variant="outlined"
                                        onClick={() => updateSort(idx, 'order', 'ASC')}
                                        sx={chipStyle(sort.order === 'ASC', '#10b981')}
                                    />
                                    <Chip
                                        label="DESC" size="small" variant="outlined"
                                        onClick={() => updateSort(idx, 'order', 'DESC')}
                                        sx={chipStyle(sort.order === 'DESC', '#ef4444')}
                                    />
                                </Stack>
                                <IconButton size="small" onClick={() => removeSort(idx)} sx={{ color: '#ef4444' }}>
                                    <Minus size={14} />
                                </IconButton>
                            </Box>
                        ))}
                        {sortColumns.length === 0 && (
                            <Box sx={{
                                p: 2, textAlign: 'center', borderRadius: '8px',
                                border: '1px dashed', borderColor: alpha('#111827', 0.12),
                            }}>
                                <Typography sx={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                                    Click + to add a sort rule
                                </Typography>
                            </Box>
                        )}
                    </Stack>
                </Box>
            )}
        </Stack>
    );
};

export default SortConfig;
