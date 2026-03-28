import React from 'react';
import { Box, Stack, Chip, Typography, alpha } from '@mui/material';
import { Merge } from 'lucide-react';
import {
    TableSelector,
    ColumnSelector,
    chipStyle,
    sectionTitle,
    type TransformConfigProps,
} from './shared';

const JoinConfig: React.FC<TransformConfigProps> = ({ params, onChange, allTables, isLoading }) => {
    const leftTable = allTables.find(t => t.id === params.left_table);
    const rightTable = allTables.find(t => t.id === params.right_table);

    // Support both single column (legacy) and multi-column joins
    const leftOn = Array.isArray(params.left_on) ? params.left_on : (params.left_on ? [params.left_on] : []);
    const rightOn = Array.isArray(params.right_on) ? params.right_on : (params.right_on ? [params.right_on] : []);

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
                    <ColumnSelector
                        label="Left Join Columns"
                        columns={leftTable?.columns || []}
                        value={leftOn}
                        onChange={(cols) => onChange('left_on', cols)}
                    />
                    <ColumnSelector
                        label="Right Join Columns"
                        columns={rightTable?.columns || []}
                        value={rightOn}
                        onChange={(cols) => onChange('right_on', cols)}
                    />
                    {leftOn.length !== rightOn.length && leftOn.length > 0 && rightOn.length > 0 && (
                        <Box sx={{
                            p: 1.5, borderRadius: '8px',
                            bgcolor: alpha('#f59e0b', 0.08),
                            border: '1px solid', borderColor: alpha('#f59e0b', 0.3),
                        }}>
                            <Typography sx={{ fontSize: '0.7rem', color: '#92400e', fontWeight: 600 }}>
                                Warning: Left and right join columns should have the same count
                            </Typography>
                        </Box>
                    )}
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
                    {params.how !== 'cross' && leftOn.length > 0 && rightOn.length > 0 && (
                        <Typography sx={{ fontSize: '0.65rem', color: '#64748b', textAlign: 'center', mt: 1 }}>
                            ON {leftOn.map((col: string, i: number) => `${leftTable.name}.${col} = ${rightTable.name}.${rightOn[i] || '?'}`).join(' AND ')}
                        </Typography>
                    )}
                </Box>
            )}
        </Stack>
    );
};

export default JoinConfig;
