import React from 'react';
import SleekTextField from '../../../components/SleekTextField';
import SleekSelect from '../../../components/SleekSelect';
import SleekButton from '../../../components/SleekButton'; // If needed for array actions
import { Box, Typography, Switch, FormControlLabel } from '@mui/material';

interface SchemaFormProps {
    schema: any;
    value: any;
    onChange: (value: any) => void;
    readOnly?: boolean;
}

const SchemaForm: React.FC<SchemaFormProps> = ({ schema, value, onChange, readOnly }) => {
    if (!schema) return null;

    // Handle Object
    if (schema.type === 'object' && schema.properties) {
        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {Object.keys(schema.properties).map(key => {
                    const propSchema = schema.properties[key];
                    const isRequired = schema.required?.includes(key);
                    const propValue = value?.[key];

                    return (
                        <Box key={key}>
                            <Typography variant="caption" sx={{ color: '#666', fontWeight: 600, mb: 0.5, display: 'block' }}>
                                {key.replace(/_/g, ' ')} {isRequired && <span style={{ color: 'red' }}>*</span>}
                            </Typography>
                            <SchemaForm
                                schema={propSchema}
                                value={propValue}
                                onChange={(newValue) => onChange({ ...value, [key]: newValue })}
                                readOnly={readOnly}
                            />
                            {propSchema.description && (
                                <Typography variant="caption" sx={{ color: '#999', mt: 0.5, display: 'block' }}>
                                    {propSchema.description}
                                </Typography>
                            )}
                        </Box>
                    );
                })}
            </Box>
        );
    }

    // Handle Array
    if (schema.type === 'array') {
        const items = Array.isArray(value) ? value : [];
        const itemSchema = schema.items;

        const addItem = () => {
            onChange([...items, getTypeDefault(itemSchema.type)]);
        };

        const removeItem = (index: number) => {
            const newItems = [...items];
            newItems.splice(index, 1);
            onChange(newItems);
        };

        const updateItem = (index: number, val: any) => {
            const newItems = [...items];
            newItems[index] = val;
            onChange(newItems);
        };

        return (
            <Box>
                {items.map((item: any, index: number) => (
                    <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'flex-start' }}>
                        <Box sx={{ flex: 1 }}>
                            <SchemaForm
                                schema={itemSchema}
                                value={item}
                                onChange={(v) => updateItem(index, v)}
                                readOnly={readOnly}
                            />
                        </Box>
                        {!readOnly && (
                            <SleekButton onClick={() => removeItem(index)} size="small" variant="outlined" style={{ minWidth: 'auto', padding: '8px' }}>
                                X
                            </SleekButton>
                        )}
                    </Box>
                ))}
                {!readOnly && (
                    <SleekButton onClick={addItem} size="small" variant="outlined">
                        + Add Item
                    </SleekButton>
                )}
            </Box>
        );
    }

    // Handle Enum (Select)
    if (schema.enum) {
        return (
            <SleekSelect
                label={schema.description || "Select Option"}
                value={value || ''}
                onChange={(e) => onChange(e.target.value)}
                options={schema.enum.map((opt: any) => ({ value: opt, label: String(opt) }))}
                disabled={readOnly}
            />
        );
    }

    // Handle Boolean
    if (schema.type === 'boolean') {
        return (
            <FormControlLabel
                control={
                    <Switch
                        checked={!!value}
                        onChange={(e) => onChange(e.target.checked)}
                        disabled={readOnly}
                        size="small"
                    />
                }
                label={schema.description || ""}
            />
        );
    }

    // Handle Number/Integer
    if (schema.type === 'number' || schema.type === 'integer') {
        return (
            <SleekTextField
                type="number"
                value={value || ''}
                onChange={(e) => onChange(Number(e.target.value))}
                disabled={readOnly}
                fullWidth
            />
        );
    }

    // Default: String
    return (
        <SleekTextField
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={readOnly}
            fullWidth
            multiline={schema.type === 'string' && schema.format === 'long'} // Custom format hint
        />
    );
};

// Helper to get default value
const getTypeDefault = (type: string) => {
    switch (type) {
        case 'string': return '';
        case 'number': return 0;
        case 'integer': return 0;
        case 'boolean': return false;
        case 'array': return [];
        case 'object': return {};
        default: return null;
    }
};

export default SchemaForm;
