import React from 'react';
import { Box, Stack, Typography, TextField, MenuItem, IconButton, alpha } from '@mui/material';
import { Plus, Minus } from 'lucide-react';
import {
    TableSelector,
    ColumnSelector,
    sectionTitle,
    selectFieldSx,
} from './shared';
import type { TransformConfigProps } from './shared';
import { Autocomplete } from '@mui/material';

const AggregateConfig: React.FC<TransformConfigProps> = ({ params, onChange, allTables, isLoading }) => {
    const selectedTable = allTables.find(t => t.id === params.source_table);
    const columns = selectedTable?.columns || [];
    const aggregations = params.aggregations || [];

    const addAggregation = () => {
        onChange('aggregations', [...aggregations, { column: '', function: 'sum' }]);
    };
    const removeAggregation = (idx: number) => {
        onChange('aggregations', aggregations.filter((_: any, i: number) => i !== idx));
    };
    const updateAggregation = (idx: number, field: string, value: string) => {
        const updated = [...aggregations];
        updated[idx] = { ...updated[idx], [field]: value };
        onChange('aggregations', updated);
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
                    <ColumnSelector
                        label="Group By"
                        columns={columns}
                        value={params.group_by || []}
                        onChange={(cols) => onChange('group_by', cols)}
                    />

                    <Box>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                            <Typography sx={sectionTitle}>Aggregations</Typography>
                            <IconButton size="small" onClick={addAggregation} sx={{ color: '#6366f1' }}>
                                <Plus size={14} />
                            </IconButton>
                        </Stack>
                        <Stack spacing={1.5}>
                            {aggregations.map((agg: any, idx: number) => (
                                <Box key={idx} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                    <Autocomplete
                                        freeSolo
                                        size="small"
                                        options={columns.map(c => c.name)}
                                        value={agg.column || ''}
                                        onChange={(_, newVal) => updateAggregation(idx, 'column', newVal as string)}
                                        onBlur={(e: any) => updateAggregation(idx, 'column', e.target.value)}
                                        sx={{ flex: 1 }}
                                        renderInput={(params) => (
                                            <TextField {...params} label="Column" placeholder="Select or type..." sx={selectFieldSx} />
                                        )}
                                    />
                                    <TextField
                                        select size="small" label="Function"
                                        value={agg.function || 'sum'}
                                        onChange={(e) => updateAggregation(idx, 'function', e.target.value)}
                                        sx={{ width: 110, ...selectFieldSx }}
                                    >
                                        {['sum', 'avg', 'count', 'min', 'max'].map(fn => (
                                            <MenuItem key={fn} value={fn}>{fn.toUpperCase()}</MenuItem>
                                        ))}
                                    </TextField>
                                    <IconButton size="small" onClick={() => removeAggregation(idx)} sx={{ color: '#ef4444' }}>
                                        <Minus size={14} />
                                    </IconButton>
                                </Box>
                            ))}
                            {aggregations.length === 0 && (
                                <Box sx={{
                                    p: 2, textAlign: 'center', borderRadius: '8px',
                                    border: '1px dashed', borderColor: alpha('#111827', 0.12),
                                }}>
                                    <Typography sx={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                                        Click + to add an aggregation
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

export default AggregateConfig;
