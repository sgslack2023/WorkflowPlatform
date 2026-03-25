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

const FilterConfig: React.FC<TransformConfigProps> = ({ params, onChange, allTables, isLoading }) => {
    const selectedTable = allTables.find(t => t.id === params.source_table);
    const columns = selectedTable?.columns || [];
    const conditions = params.conditions || [];

    const addCondition = () => {
        onChange('conditions', [...conditions, { column: '', operator: '=', value: '' }]);
    };
    const removeCondition = (idx: number) => {
        onChange('conditions', conditions.filter((_: any, i: number) => i !== idx));
    };
    const updateCondition = (idx: number, field: string, value: string) => {
        const updated = [...conditions];
        updated[idx] = { ...updated[idx], [field]: value };
        onChange('conditions', updated);
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
                <>
                    {/* Logic toggle */}
                    <Box>
                        <Typography sx={sectionTitle}>Combine With</Typography>
                        <Stack direction="row" gap={1}>
                            {['AND', 'OR'].map(logic => (
                                <Chip
                                    key={logic}
                                    label={logic}
                                    variant="outlined"
                                    size="small"
                                    onClick={() => onChange('logic', logic)}
                                    sx={chipStyle(params.logic === logic, '#6366f1')}
                                />
                            ))}
                        </Stack>
                    </Box>

                    <Box>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                            <Typography sx={sectionTitle}>Filter Conditions</Typography>
                            <IconButton size="small" onClick={addCondition} sx={{ color: '#6366f1' }}>
                                <Plus size={14} />
                            </IconButton>
                        </Stack>
                        <Stack spacing={1.5}>
                            {conditions.map((cond: any, idx: number) => (
                                <Box key={idx} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                    <TextField
                                        select size="small" label="Column"
                                        value={cond.column || ''}
                                        onChange={(e) => updateCondition(idx, 'column', e.target.value)}
                                        sx={{ flex: 1, ...selectFieldSx }}
                                    >
                                        {columns.map(c => <MenuItem key={c.name} value={c.name}>{c.name}</MenuItem>)}
                                    </TextField>
                                    <TextField
                                        select size="small" label="Op"
                                        value={cond.operator || '='}
                                        onChange={(e) => updateCondition(idx, 'operator', e.target.value)}
                                        sx={{ width: 80, ...selectFieldSx }}
                                    >
                                        {['=', '>', '<', '>=', '<=', '!=', 'LIKE'].map(op => (
                                            <MenuItem key={op} value={op}>{op}</MenuItem>
                                        ))}
                                    </TextField>
                                    <TextField
                                        size="small" label="Value"
                                        value={cond.value || ''}
                                        onChange={(e) => updateCondition(idx, 'value', e.target.value)}
                                        sx={{ flex: 1, ...selectFieldSx }}
                                    />
                                    <IconButton size="small" onClick={() => removeCondition(idx)} sx={{ color: '#ef4444' }}>
                                        <Minus size={14} />
                                    </IconButton>
                                </Box>
                            ))}
                            {conditions.length === 0 && (
                                <Box sx={{
                                    p: 2, textAlign: 'center', borderRadius: '8px',
                                    border: '1px dashed', borderColor: alpha('#111827', 0.12),
                                }}>
                                    <Typography sx={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                                        Click + to add a filter condition
                                    </Typography>
                                </Box>
                            )}
                        </Stack>
                    </Box>
                </>
            )}
        </Stack>
    );
};

export default FilterConfig;
