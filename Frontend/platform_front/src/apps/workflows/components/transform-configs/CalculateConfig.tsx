import React from 'react';
import { Box, Stack, Typography, TextField, MenuItem } from '@mui/material';
import {
    TableSelector,
    ColumnSelector,
    SingleColumnSelector,
    sectionTitle,
    selectFieldSx,
    type TransformConfigProps,
} from './shared';

const CalculateConfig: React.FC<TransformConfigProps> = ({ params, onChange, allTables, isLoading }) => {
    const selectedTable = allTables.find(t => t.id === params.source_table);
    const columns = selectedTable?.columns || [];
    const operation = params.operation || 'expression';

    const operations = [
        { value: 'expression', label: 'Custom SQL Expression' },
        { value: 'concatenate', label: 'Concatenate Columns' },
        { value: 'year', label: 'Extract Year' },
        { value: 'month', label: 'Extract Month' },
        { value: 'day', label: 'Extract Day' },
        { value: 'date_only', label: 'Date (Remove Time)' },
    ];

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
                    <Box>
                        <Typography sx={sectionTitle}>New Column Name</Typography>
                        <TextField
                            fullWidth size="small"
                            value={params.new_column_name || ''}
                            onChange={(e) => onChange('new_column_name', e.target.value)}
                            placeholder="e.g. formatted_date"
                            sx={selectFieldSx}
                        />
                    </Box>

                    <Box>
                        <Typography sx={sectionTitle}>Operation</Typography>
                        <TextField
                            select fullWidth size="small"
                            value={operation}
                            onChange={(e) => onChange('operation', e.target.value)}
                            sx={selectFieldSx}
                        >
                            {operations.map(op => (
                                <MenuItem key={op.value} value={op.value}>{op.label}</MenuItem>
                            ))}
                        </TextField>
                    </Box>

                    {operation === 'expression' && (
                        <Box>
                            <Typography sx={sectionTitle}>SQL Expression</Typography>
                            <TextField
                                fullWidth size="small" multiline rows={2}
                                value={params.expression || ''}
                                onChange={(e) => onChange('expression', e.target.value)}
                                placeholder="e.g. qty * unit_price"
                                sx={selectFieldSx}
                            />
                            <Typography sx={{ fontSize: '0.62rem', color: '#94a3b8', mt: 1 }}>
                                Available columns: {columns.map(c => c.name).join(', ')}
                            </Typography>
                        </Box>
                    )}

                    {['year', 'month', 'day', 'date_only'].includes(operation) && (
                        <SingleColumnSelector
                            label="Source Column"
                            columns={columns}
                            value={params.source_column || ''}
                            onChange={(col) => onChange('source_column', col)}
                        />
                    )}

                    {operation === 'concatenate' && (
                        <>
                            <ColumnSelector
                                label="Columns to Join"
                                columns={columns}
                                value={params.concat_columns || []}
                                onChange={(cols) => onChange('concat_columns', cols)}
                            />
                            <Box>
                                <Typography sx={sectionTitle}>Separator</Typography>
                                <TextField
                                    fullWidth size="small"
                                    value={params.separator || ' '}
                                    onChange={(e) => onChange('separator', e.target.value)}
                                    placeholder="e.g. - or , "
                                    sx={selectFieldSx}
                                />
                            </Box>
                        </>
                    )}
                </>
            )}
        </Stack>
    );
};

export default CalculateConfig;
