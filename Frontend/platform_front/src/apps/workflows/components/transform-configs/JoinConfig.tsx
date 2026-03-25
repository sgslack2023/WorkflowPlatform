import React from 'react';
import { Box, Stack, Chip, Typography, alpha } from '@mui/material';
import { Merge } from 'lucide-react';
import {
    TableSelector,
    SingleColumnSelector,
    chipStyle,
    sectionTitle,
    type TransformConfigProps,
} from './shared';

const JoinConfig: React.FC<TransformConfigProps> = ({ params, onChange, allTables, isLoading }) => {
    const leftTable = allTables.find(t => t.id === params.left_table);
    const rightTable = allTables.find(t => t.id === params.right_table);

    return (
        <Stack spacing={3}>
            {/* Join Type */}
            <Box>
                <Typography sx={sectionTitle}>Join Type</Typography>
                <Stack direction="row" flexWrap="wrap" gap={1}>
                    {['inner', 'left', 'right', 'outer', 'cross'].map(type => (
                        <Chip
                            key={type}
                            label={type.toUpperCase()}
                            variant="outlined"
                            size="small"
                            onClick={() => onChange('how', type)}
                            sx={chipStyle(params.how === type, '#6366f1')}
                        />
                    ))}
                </Stack>
            </Box>

            {/* Left Table */}
            <TableSelector
                label="Left Table"
                tables={allTables}
                value={params.left_table || ''}
                onChange={(id) => onChange('left_table', id)}
                isLoading={isLoading}
            />

            {/* Right Table */}
            <TableSelector
                label="Right Table"
                tables={allTables}
                value={params.right_table || ''}
                onChange={(id) => onChange('right_table', id)}
                isLoading={isLoading}
            />

            {/* Column selectors — only show for non-cross joins */}
            {params.how !== 'cross' && (
                <>
                    <SingleColumnSelector
                        label="Left Join Column"
                        columns={leftTable?.columns || []}
                        value={params.left_on || ''}
                        onChange={(col) => onChange('left_on', col)}
                    />
                    <SingleColumnSelector
                        label="Right Join Column"
                        columns={rightTable?.columns || []}
                        value={params.right_on || ''}
                        onChange={(col) => onChange('right_on', col)}
                    />
                </>
            )}

            {/* Preview */}
            {leftTable && rightTable && (
                <Box sx={{
                    p: 2, borderRadius: '10px',
                    bgcolor: alpha('#6366f1', 0.03),
                    border: '1px solid', borderColor: alpha('#6366f1', 0.1),
                }}>
                    <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
                        <Chip label={leftTable.name} size="small" sx={{ fontSize: '0.68rem', fontWeight: 700 }} />
                        <Merge size={16} color="#6366f1" />
                        <Chip label={rightTable.name} size="small" sx={{ fontSize: '0.68rem', fontWeight: 700 }} />
                    </Stack>
                    {params.how !== 'cross' && params.left_on && params.right_on && (
                        <Typography sx={{ fontSize: '0.65rem', color: '#64748b', textAlign: 'center', mt: 1 }}>
                            ON {leftTable.name}.{params.left_on} = {rightTable.name}.{params.right_on}
                        </Typography>
                    )}
                </Box>
            )}
        </Stack>
    );
};

export default JoinConfig;
