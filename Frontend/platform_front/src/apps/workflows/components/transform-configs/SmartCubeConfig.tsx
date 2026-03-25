import React from 'react';
import {
    Box,
    Typography,
    Stack,
    TextField,
    MenuItem,
    alpha,
    IconButton,
    Autocomplete,
    Chip,
} from '@mui/material';
import { Plus, Trash2, Database } from 'lucide-react';
import type {
    TransformConfigProps,
} from './shared';
import {
    sectionTitle,
    selectFieldSx,
} from './shared';

export const SmartCubeConfig: React.FC<TransformConfigProps> = ({ params, onChange, allTables }) => {
    const selectedTableIds = params.input_tables || [];
    const dimensions = params.dimensions || [];
    const measures = params.measures || [];

    // Filter tables to only those selected
    const selectedTables = allTables.filter(t => selectedTableIds.includes(t.id));

    // Flatten all columns from all selected tables with prefixing
    const allAvailableColumns = selectedTables.flatMap(t =>
        t.columns.map(c => ({
            label: `${t.name}.${c.name}`,
            value: `${t.name}.${c.name}`,
            tableName: t.name,
            columnName: c.name
        }))
    );

    const handleAddMeasure = () => {
        const newMeasures = [...measures, { column: '', agg: 'sum' }];
        onChange('measures', newMeasures);
    };

    const handleRemoveMeasure = (index: number) => {
        const newMeasures = measures.filter((_: any, i: number) => i !== index);
        onChange('measures', newMeasures);
    };

    const updateMeasure = (index: number, field: string, value: any) => {
        const newMeasures = [...measures];
        newMeasures[index] = { ...newMeasures[index], [field]: value };
        onChange('measures', newMeasures);
    };

    return (
        <Stack spacing={3}>
            {/* 1. Multi-Table Selector */}
            <Box>
                <Typography sx={sectionTitle}>Input Tables (Select multiple to join)</Typography>
                <Autocomplete
                    multiple
                    size="small"
                    options={allTables}
                    getOptionLabel={(option) => option.name}
                    value={selectedTables}
                    onChange={(_, newVal) => {
                        onChange('input_tables', newVal.map(t => t.id));
                    }}
                    renderTags={(tagValue, getTagProps) =>
                        tagValue.map((option, index) => {
                            const { key, ...rest } = getTagProps({ index });
                            return (
                                <Chip
                                    key={key}
                                    label={option.name}
                                    size="small"
                                    icon={<Database size={12} />}
                                    {...rest}
                                    sx={{ fontSize: '0.7rem', fontWeight: 600, bgcolor: alpha('#3b82f6', 0.08), color: '#3b82f6' }}
                                />
                            );
                        })
                    }
                    renderInput={(params) => (
                        <TextField {...params} placeholder="Select base and dimension tables…" sx={selectFieldSx} />
                    )}
                />
                <Typography variant="caption" sx={{ color: '#94a3b8', mt: 0.5, display: 'block' }}>
                    Tables will be automatically joined using Foreign Keys.
                </Typography>
            </Box>

            {/* 2. Dimensions Selector */}
            <Box>
                <Typography sx={sectionTitle}>Grouping Dimensions (Cube)</Typography>
                <Autocomplete
                    multiple
                    freeSolo
                    size="small"
                    options={allAvailableColumns.map(c => c.value)}
                    value={dimensions}
                    onChange={(_, newVal) => onChange('dimensions', newVal)}
                    renderTags={(tagValue, getTagProps) =>
                        tagValue.map((option, index) => {
                            const { key, ...rest } = getTagProps({ index });
                            return (
                                <Chip
                                    key={key}
                                    label={option}
                                    size="small"
                                    {...rest}
                                    sx={{ fontSize: '0.7rem', fontWeight: 600, bgcolor: alpha('#6366f1', 0.08), color: '#6366f1' }}
                                />
                            );
                        })
                    }
                    renderInput={(params) => (
                        <TextField {...params} placeholder="Choose columns to pivot (or type virtual ones)…" sx={selectFieldSx} />
                    )}
                />
            </Box>

            {/* 3. Measures */}
            <Box>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                    <Typography sx={sectionTitle}>Aggregates (Measures)</Typography>
                    <IconButton size="small" onClick={handleAddMeasure} sx={{ color: '#6366f1' }}>
                        <Plus size={16} />
                    </IconButton>
                </Stack>
                {measures.length === 0 && (
                    <Typography sx={{ fontSize: '0.7rem', color: '#94a3b8', textAlign: 'center', py: 2, border: '1px dashed #e2e8f0', borderRadius: '8px' }}>
                        No measures added. Defaults to Row Count.
                    </Typography>
                )}
                <Stack spacing={1.5}>
                    {measures.map((m: any, idx: number) => (
                        <Box key={idx} sx={{ p: 1.5, borderRadius: '8px', border: '1px solid #f1f5f9', position: 'relative' }}>
                            <IconButton
                                size="small"
                                onClick={() => handleRemoveMeasure(idx)}
                                sx={{ position: 'absolute', top: 4, right: 4, color: alpha('#ef4444', 0.5), '&:hover': { color: '#ef4444' } }}
                            >
                                <Trash2 size={12} />
                            </IconButton>
                            <Stack spacing={1.5}>
                                <Autocomplete
                                    freeSolo
                                    size="small"
                                    options={allAvailableColumns.map(c => c.value)}
                                    value={m.column || ''}
                                    onChange={(_, newVal) => updateMeasure(idx, 'column', newVal)}
                                    onBlur={(e: any) => updateMeasure(idx, 'column', e.target.value)}
                                    renderInput={(params) => (
                                        <TextField {...params} label="Column" placeholder="Select or type..." sx={{ ...selectFieldSx, '& .MuiInputBase-root': { height: 32, fontSize: '0.75rem' } }} />
                                    )}
                                />
                                <TextField
                                    select fullWidth size="small" label="Function"
                                    value={m.agg || 'sum'}
                                    onChange={(e) => updateMeasure(idx, 'agg', e.target.value)}
                                    sx={{ ...selectFieldSx, '& .MuiInputBase-root': { height: 32, fontSize: '0.75rem' } }}
                                >
                                    <MenuItem value="sum">SUM</MenuItem>
                                    <MenuItem value="avg">AVERAGE</MenuItem>
                                    <MenuItem value="count">COUNT</MenuItem>
                                    <MenuItem value="min">MIN</MenuItem>
                                    <MenuItem value="max">MAX</MenuItem>
                                </TextField>
                            </Stack>
                        </Box>
                    ))}
                </Stack>
            </Box>
        </Stack>
    );
};
