import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Stack, Slider, Typography, Box, alpha, FormControlLabel, Checkbox, Autocomplete, TextField as MuiTextField, Chip } from '@mui/material';
import SleekTextField from '../../../components/SleekTextField';
import SleekSelect from '../../../components/SleekSelect';
import SleekButton from '../../../components/SleekButton';
import { useAuthStore } from '../../../store/authStore';
import type { AgentConfig } from '../types';
import { useTools } from '../../tools/api/queries';

// Update schema to include tools
const schema = z.object({
    name: z.string().min(1, 'Name is required'),
    system_prompt: z.string().min(1, 'System prompt is required'),
    temperature: z.number().min(0).max(1),
    max_tokens: z.number().min(1).max(32000),
    memory_policy: z.enum(['window', 'summary', 'strict']),
    is_global: z.boolean(),
    tools: z.array(z.string()).optional(), // Array of tool IDs
});

// ...

type AgentConfigFormData = z.infer<typeof schema>;

interface AgentConfigFormProps {
    initialData?: AgentConfig;
    onSubmit: (data: any) => void;
    onCancel: () => void;
    isSubmitting?: boolean;
}

const AgentConfigForm: React.FC<AgentConfigFormProps> = ({ initialData, onSubmit, onCancel, isSubmitting }) => {
    const currentOrgId = useAuthStore((state) => state.currentOrgId);
    const user = useAuthStore((state) => state.user);
    const { data: tools, isLoading, error } = useTools();

    const { register, handleSubmit, control, formState: { errors } } = useForm<AgentConfigFormData>({
        resolver: zodResolver(schema),
        defaultValues: initialData ? {
            name: initialData.name,
            system_prompt: initialData.system_prompt,
            temperature: initialData.temperature,
            max_tokens: initialData.max_tokens,
            memory_policy: initialData.memory_policy as any,
            is_global: !(initialData as any).organization,
            tools: (initialData.tools || []).map((t: any) => typeof t === 'string' ? t : t.id),
        } : {
            temperature: 0.7,
            max_tokens: 2000,
            memory_policy: 'summary',
            is_global: false,
            tools: [],
        }
    });

    const handleFormSubmit = (data: AgentConfigFormData) => {
        const payload = {
            ...data,
            organization: data.is_global ? null : currentOrgId,
            tool_ids: data.tools, // Map form 'tools' (IDs) to backend 'tool_ids'
        };
        // Remove 'tools' from payload to avoiding confusing the serializer if it expects tool_ids
        delete (payload as any).tools;

        onSubmit(payload);
    };

    return (
        <form onSubmit={handleSubmit(handleFormSubmit)}>
            <Stack spacing={3} sx={{ mt: 1 }}>

                {/* ... (existing fields: Name, System Prompt) ... */}

                <SleekTextField
                    label="Configuration Name"
                    placeholder="e.g. Technical Auditor"
                    {...register('name')}
                    error={!!errors.name}
                    helperText={errors.name?.message}
                />

                <SleekTextField
                    label="System Prompt"
                    placeholder="You are a helpful assistant..."
                    multiline
                    rows={4}
                    {...register('system_prompt')}
                    error={!!errors.system_prompt}
                    helperText={errors.system_prompt?.message}
                />

                {/* Tool Selection */}
                <Box>
                    <Typography variant="caption" sx={{ color: alpha('#111827', 0.5), mb: 1, display: 'block' }}>
                        Tools
                    </Typography>
                    <Controller
                        name="tools"
                        control={control}
                        render={({ field: { value, onChange } }) => (
                            <Autocomplete
                                multiple
                                options={tools || []}
                                loading={isLoading}
                                getOptionLabel={(option) => typeof option === 'string' ? option : option.name}
                                isOptionEqualToValue={(option, val) => option.id === (typeof val === 'string' ? val : val.id)}
                                value={tools?.filter(t => (value || []).includes(t.id)) || []}
                                onChange={(_, newValue) => {
                                    onChange(newValue.map(v => v.id));
                                }}
                                noOptionsText={isLoading ? "Loading tools..." : error ? "Error loading tools" : "No tools available"}
                                renderTags={(value, getTagProps) =>
                                    value.map((option, index) => (
                                        <Chip
                                            label={option.name}
                                            size="small"
                                            {...getTagProps({ index })}
                                            sx={{ borderRadius: '6px', bgcolor: alpha('#4f46e5', 0.1), color: '#4f46e5' }}
                                        />
                                    ))
                                }
                                renderInput={(params) => (
                                    <MuiTextField
                                        {...params}
                                        placeholder="Select tools..."
                                        size="small"
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: '8px',
                                                bgcolor: '#f9fafb',
                                                '& fieldset': { borderColor: alpha('#111827', 0.15) },
                                                '&:hover fieldset': { borderColor: alpha('#111827', 0.3) },
                                                '&.Mui-focused fieldset': { borderColor: '#4f46e5', borderWidth: '1.5px' },
                                            }
                                        }}
                                    />
                                )}
                            />
                        )}
                    />
                </Box>

                <Box>
                    <Typography variant="caption" sx={{ color: alpha('#111827', 0.5), mb: 1, display: 'block' }}>
                        Temperature
                    </Typography>
                    <Controller
                        name="temperature"
                        control={control}
                        render={({ field }) => (
                            <Slider
                                {...field}
                                value={typeof field.value === 'number' ? field.value : 0.7}
                                min={0}
                                max={1}
                                step={0.1}
                                valueLabelDisplay="auto"
                                sx={{ color: '#4f46e5' }}
                            />
                        )}
                    />
                </Box>

                <SleekTextField
                    label="Max Tokens"
                    type="number"
                    {...register('max_tokens', { valueAsNumber: true })}
                    error={!!errors.max_tokens}
                    helperText={errors.max_tokens?.message}
                />

                <Controller
                    name="memory_policy"
                    control={control}
                    render={({ field }) => (
                        <SleekSelect
                            label="Memory Policy"
                            {...field}
                            options={[
                                { value: 'window', label: 'Sliding Window' },
                                { value: 'summary', label: 'Summarization' },
                                { value: 'strict', label: 'Strict (No History)' },
                            ]}
                        />
                    )}
                />

                {user?.is_superuser && (
                    <FormControlLabel
                        control={<Checkbox {...register('is_global')} />}
                        label={
                            <Box>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>Make Global</Typography>
                                <Typography variant="caption" sx={{ color: alpha('#111827', 0.5) }}>
                                    Visible across all organizations.
                                </Typography>
                            </Box>
                        }
                    />
                )}

                <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 2 }}>
                    <SleekButton onClick={onCancel} color="inherit">
                        Cancel
                    </SleekButton>
                    <SleekButton type="submit" variant="contained" loading={isSubmitting}>
                        {initialData ? 'Update Config' : 'Create Config'}
                    </SleekButton>
                </Stack>
            </Stack>
        </form>
    );
};

export default AgentConfigForm;
