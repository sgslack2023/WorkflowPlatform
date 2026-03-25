import React from 'react';
import { Box, Stack, Typography, Chip } from '@mui/material';
import {
    TableSelector,
    sectionTitle,
    chipStyle,
    type TransformConfigProps,
} from './shared';

const UnionConfig: React.FC<TransformConfigProps> = ({ params, onChange, allTables, isLoading }) => {
    return (
        <Stack spacing={3}>
            <TableSelector
                label="First Table"
                tables={allTables}
                value={params.table_a || ''}
                onChange={(id) => onChange('table_a', id)}
                isLoading={isLoading}
            />
            <TableSelector
                label="Second Table"
                tables={allTables}
                value={params.table_b || ''}
                onChange={(id) => onChange('table_b', id)}
                isLoading={isLoading}
            />

            <Box>
                <Typography sx={sectionTitle}>Union Mode</Typography>
                <Stack direction="row" gap={1}>
                    <Chip
                        label="UNION ALL (keep duplicates)"
                        variant="outlined" size="small"
                        onClick={() => onChange('union_all', true)}
                        sx={chipStyle(params.union_all !== false, '#6366f1')}
                    />
                    <Chip
                        label="UNION (remove duplicates)"
                        variant="outlined" size="small"
                        onClick={() => onChange('union_all', false)}
                        sx={chipStyle(params.union_all === false, '#6366f1')}
                    />
                </Stack>
            </Box>
        </Stack>
    );
};

export default UnionConfig;
