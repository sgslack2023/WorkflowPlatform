import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Stack, Checkbox, alpha, FormControlLabel, Box, Typography, Autocomplete, TextField as MuiTextField, Chip } from '@mui/material';
import SleekTextField from '../../../components/SleekTextField';
import SleekSelect from '../../../components/SleekSelect';
import SleekButton from '../../../components/SleekButton';
import { useAuthStore } from '../../../store/authStore';
import { useLLMProviders, useAgentConfigs } from '../api/queries';
import { useTools } from '../../tools/api/queries';
import type { AgentDefinition } from '../types';

const schema = z.object({
    name: z.string().min(1, 'Name is required'),
    llm_provider: z.string().min(1, 'LLM Provider is required'),
    agent_config: z.string().min(1, 'Agent Config is required'),
    tools: z.array(z.string()), // Changed from utilities
    is_global: z.boolean(),
});

type FormData = z.infer<typeof schema>;

interface AgentDefinitionFormProps {
    initialData?: AgentDefinition;
    onSubmit: (data: any) => void;
    onCancel: () => void;
    isSubmitting?: boolean;
}

const AgentDefinitionForm: React.FC<AgentDefinitionFormProps> = ({ initialData, onSubmit, onCancel, isSubmitting }) => {
    const currentOrgId = useAuthStore((state) => state.currentOrgId);
    const user = useAuthStore((state) => state.user);
    const { data: providers } = useLLMProviders();
    const { data: configs } = useAgentConfigs();
    const { data: tools } = useTools();

    const { register, handleSubmit, control, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: initialData ? {
            name: initialData.name,
            llm_provider: initialData.llm_provider,
            agent_config: initialData.agent_config,
            tools: (initialData as any).tools?.map((t: any) => t.id || t) || [],
            is_global: !(initialData as any).organization,
        } : {
            tools: [],
            is_global: false,
        }
    });

    const handleFormSubmit = (data: FormData) => {
        onSubmit({
            name: data.name,
            llm_provider: data.llm_provider,
            agent_config: data.agent_config,
            tool_ids: data.tools, // Map to tool_ids
            organization: data.is_global ? null : currentOrgId,
            is_active: true,
        });
    };

    return (
        <form onSubmit={handleSubmit(handleFormSubmit)}>
            <Stack spacing={3} sx={{ mt: 1 }}>
                <SleekTextField
                    label="Agent Name"
                    placeholder="e.g. Finance Analyst Prime"
                    {...register('name')}
                    error={!!errors.name}
                    helperText={errors.name?.message}
                />

                <Controller
                    name="llm_provider"
                    control={control}
                    render={({ field }) => (
                        <SleekSelect
                            label="LLM Provider"
                            {...field}
                            options={providers?.map(p => ({ value: p.id, label: p.name })) || []}
                            error={!!errors.llm_provider}
                            helperText={errors.llm_provider?.message}
                        />
                    )}
                />

                <Controller
                    name="agent_config"
                    control={control}
                    render={({ field }) => (
                        <SleekSelect
                            label="Agent Configuration"
                            {...field}
                            options={configs?.map(c => ({ value: c.id, label: c.name })) || []}
                            error={!!errors.agent_config}
                            helperText={errors.agent_config?.message}
                        />
                    )}
                />

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
                                getOptionLabel={(option) => typeof option === 'string' ? option : option.name}
                                isOptionEqualToValue={(option, val) => option.id === (typeof val === 'string' ? val : val.id)}
                                value={tools?.filter(t => (value || []).includes(t.id)) || []}
                                onChange={(_, newValue) => {
                                    onChange(newValue.map(v => v.id));
                                }}
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
                                        placeholder="Add tools..."
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
                        {initialData ? 'Update Agent' : 'Deploy Agent'}
                    </SleekButton>
                </Stack>
            </Stack>
        </form>
    );
};

export default AgentDefinitionForm;
