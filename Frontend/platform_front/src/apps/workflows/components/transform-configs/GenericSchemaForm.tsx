import React from 'react';
import { Box, Stack, Typography, TextField, MenuItem } from '@mui/material';
import { sectionTitle, selectFieldSx } from './shared';

interface GenericSchemaFormProps {
    schema: any;
    params: any;
    onChange: (key: string, value: any) => void;
}

const GenericSchemaForm: React.FC<GenericSchemaFormProps> = ({ schema, params, onChange }) => (
    <Stack spacing={3}>
        {schema.properties && Object.entries(schema.properties).map(([key, prop]: [string, any]) => (
            <Box key={key}>
                <Typography sx={sectionTitle}>
                    {prop.label || key}
                </Typography>
                {prop.enum ? (
                    <TextField
                        select fullWidth size="small"
                        value={params[key] || prop.default || ''}
                        onChange={(e) => onChange(key, e.target.value)}
                        sx={selectFieldSx}
                    >
                        {prop.enum.map((option: string) => (
                            <MenuItem key={option} value={option}>
                                {option.charAt(0).toUpperCase() + option.slice(1)}
                            </MenuItem>
                        ))}
                    </TextField>
                ) : (
                    <TextField
                        fullWidth size="small"
                        placeholder={prop.placeholder || `Enter ${key}`}
                        value={params[key] || ''}
                        onChange={(e) => onChange(key, e.target.value)}
                        sx={selectFieldSx}
                    />
                )}
            </Box>
        ))}
    </Stack>
);

export default GenericSchemaForm;
