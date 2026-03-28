import React from 'react';
import { Box, Stack, Typography, TextField, MenuItem, Chip } from '@mui/material';
import {
    TableSelector,
    ColumnSelector,
    sectionTitle,
    selectFieldSx,
    chipStyle,
    type TransformConfigProps,
} from './shared';

const PivotConfig: React.FC<TransformConfigProps> = ({ params, onChange, allTables, isLoading }) => {
    const selectedTable = allTables.find(t => t.id === params.source_table);
    const columns = selectedTable?.columns || [];

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
                        label="Index Columns (optional)"
                        columns={columns}
                        value={params.index || []}
                        onChange={(cols) => onChange('index', cols)}
                    />

                    <TextField
                        select
                        size="small"
                        label="Pivot Column"
                        value={params.columns || ''}
                        onChange={(e) => onChange('columns', e.target.value)}
                        sx={selectFieldSx}
                        helperText="Column whose values will become new column headers"
                    >
                        {columns.map((c: any) => (
                            <MenuItem key={c.name} value={c.name}>
                                {c.name}
                            </MenuItem>
                        ))}
                    </TextField>

                    <TextField
                        select
                        size="small"
                        label="Values Column"
                        value={params.values || ''}
                        onChange={(e) => onChange('values', e.target.value)}
                        sx={selectFieldSx}
                        helperText="Column containing the values to populate the table"
                    >
                        {columns.map((c: any) => (
                            <MenuItem key={c.name} value={c.name}>
                                {c.name}
                            </MenuItem>
                        ))}
                    </TextField>

                    <Box>
                        <Typography sx={sectionTitle}>Aggregation Function</Typography>
                        <Stack direction="row" gap={1} flexWrap="wrap">
                            {['sum', 'mean', 'count', 'min', 'max', 'first', 'last'].map(func => (
                                <Chip
                                    key={func}
                                    label={func.toUpperCase()}
                                    variant="outlined"
                                    size="small"
                                    onClick={() => onChange('aggfunc', func)}
                                    sx={chipStyle(params.aggfunc === func, '#6366f1')}
                                />
                            ))}
                        </Stack>
                    </Box>
                </>
            )}
        </Stack>
    );
};

export default PivotConfig;
