import React from 'react';
import { Stack } from '@mui/material';
import {
    TableSelector,
    ColumnSelector,
    type TransformConfigProps,
} from './shared';

const DistinctConfig: React.FC<TransformConfigProps> = ({ params, onChange, allTables, isLoading }) => {
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
                <ColumnSelector
                    label="Columns to check for uniqueness (leave empty for all)"
                    columns={columns}
                    value={params.columns || []}
                    onChange={(cols) => onChange('columns', cols)}
                />
            )}
        </Stack>
    );
};

export default DistinctConfig;
