import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Stack, FormControlLabel, Checkbox, Box, Typography, alpha } from '@mui/material';
import SleekTextField from '../../../components/SleekTextField';
import SleekSelect from '../../../components/SleekSelect';
import SleekButton from '../../../components/SleekButton';
import { useAuthStore } from '../../../store/authStore';
import type { LLMProvider } from '../types';

const schema = z.object({
    name: z.string().min(1, 'Name is required'),
    provider_type: z.enum(['openai', 'anthropic', 'azure', 'local']),
    api_key: z.string().optional(),
    base_url: z.string().url().optional().or(z.literal('')),
    is_global: z.boolean(),
});

type FormData = z.infer<typeof schema>;

interface LLMProviderFormProps {
    initialData?: LLMProvider;
    onSubmit: (data: any) => void;
    onCancel: () => void;
    isSubmitting?: boolean;
}

const LLMProviderForm: React.FC<LLMProviderFormProps> = ({ initialData, onSubmit, onCancel, isSubmitting }) => {
    const currentOrgId = useAuthStore((state) => state.currentOrgId);
    const user = useAuthStore((state) => state.user);

    const { register, handleSubmit, formState: { errors }, watch, control } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: initialData ? {
            name: initialData.name,
            provider_type: initialData.provider_type,
            base_url: initialData.config?.base_url || '',
            is_global: !(initialData as any).organization,
        } : {
            provider_type: 'openai',
            is_global: false,
        }
    });

    const providerType = watch('provider_type');

    const handleFormSubmit = (data: FormData) => {
        const payload: any = {
            name: data.name,
            provider_type: data.provider_type,
            organization: data.is_global ? null : currentOrgId,
            config: {
                base_url: data.base_url,
            },
            is_active: true,
        };
        // Only send api_key if the user entered a new one
        if (data.api_key) {
            payload.api_key = data.api_key;
        }
        onSubmit(payload);
    };

    return (
        <form onSubmit={handleSubmit(handleFormSubmit)}>
            <Stack spacing={3} sx={{ mt: 1 }}>
                <SleekTextField
                    label="Provider Name"
                    placeholder="e.g. My OpenAI Account"
                    {...register('name')}
                    error={!!errors.name}
                    helperText={errors.name?.message}
                />

                <Controller
                    name="provider_type"
                    control={control}
                    render={({ field }) => (
                        <SleekSelect
                            label="Provider Type"
                            {...field}
                            options={[
                                { value: 'openai', label: 'OpenAI' },
                                { value: 'anthropic', label: 'Anthropic' },
                                { value: 'azure', label: 'Azure' },
                                { value: 'local', label: 'Local (Ollama/LM Studio)' },
                            ]}
                        />
                    )}
                />

                {providerType !== 'local' && (
                    <SleekTextField
                        label="API Key"
                        type="password"
                        placeholder={initialData?.has_api_key ? "Leave blank to keep current key" : "sk-..."}
                        {...register('api_key')}
                        error={!!errors.api_key}
                        helperText={
                            errors.api_key?.message ||
                            (initialData?.masked_api_key ? `Current key: ${initialData.masked_api_key}` : '')
                        }
                    />
                )}

                <SleekTextField
                    label="Base URL (Optional)"
                    placeholder="https://api.openai.com/v1"
                    {...register('base_url')}
                    error={!!errors.base_url}
                    helperText={errors.base_url?.message}
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
                    <SleekButton type="submit" variant="dark" loading={isSubmitting}>
                        {initialData ? 'Update Provider' : 'Create Provider'}
                    </SleekButton>
                </Stack>
            </Stack>
        </form>
    );
};

export default LLMProviderForm;
