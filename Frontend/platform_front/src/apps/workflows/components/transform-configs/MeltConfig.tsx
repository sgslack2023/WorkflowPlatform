import React from 'react';
import { Stack, TextField } from '@mui/material';
import {
    TableSelector,
    ColumnSelector,
    selectFieldSx,
    type TransformConfigProps,
} from './shared';

const MeltConfig: React.FC<TransformConfigProps> = ({ params, onChange, allTables, isLoading }) => {
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
                        label="ID Columns (Keep As-Is)"
                        columns={columns}
                        value={params.id_vars || []}
                        onChange={(cols) => onChange('id_vars', cols)}
                    />

                    <ColumnSelector
                        label="Value Columns (To Unpivot - leave empty for all)"
                        columns={columns}
                        value={params.value_vars || []}
                        onChange={(cols) => onChange('value_vars', cols)}
                    />

                    <TextField
                        size="small"
                        label="Variable Column Name"
                        value={params.var_name !== undefined ? params.var_name : 'variable'}
                        onChange={(e) => onChange('var_name', e.target.value)}
                        sx={selectFieldSx}
                        helperText="Name for the new column containing melted column names"
                        placeholder="variable"
                    />

                    <TextField
                        size="small"
                        label="Value Column Name"
                        value={params.value_name !== undefined ? params.value_name : 'value'}
                        onChange={(e) => onChange('value_name', e.target.value)}
                        sx={selectFieldSx}
                        helperText="Name for the new column containing melted values"
                        placeholder="value"
                    />
                </>
            )}
        </Stack>
    );
};

export default MeltConfig;
