import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Stack, FormControlLabel, Checkbox, Box, Typography, alpha } from '@mui/material';
import SleekTextField from '../../../components/SleekTextField';
import SleekSelect from '../../../components/SleekSelect';
import SleekButton from '../../../components/SleekButton';
import { useAuthStore } from '../../../store/authStore';
import type { AgentUtility } from '../types';

const schema = z.object({
    name: z.string().min(1, 'Name is required'),
    utility_type: z.enum(['forecasting', 'optimization', 'transformation', 'custom']),
    is_global: z.boolean(),
});

type FormData = z.infer<typeof schema>;

interface AgentUtilityFormProps {
    initialData?: AgentUtility;
    onSubmit: (data: any) => void;
    onCancel: () => void;
    isSubmitting?: boolean;
}

const AgentUtilityForm: React.FC<AgentUtilityFormProps> = ({ initialData, onSubmit, onCancel, isSubmitting }) => {
    const currentOrgId = useAuthStore((state) => state.currentOrgId);
    const user = useAuthStore((state) => state.user);

    const { register, handleSubmit, control, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: initialData ? {
            name: initialData.name,
            utility_type: initialData.utility_type as any,
            is_global: !(initialData as any).organization,
        } : {
            utility_type: 'transformation',
            is_global: false,
        }
    });

    const handleFormSubmit = (data: FormData) => {
        onSubmit({
            ...data,
            organization: data.is_global ? null : currentOrgId,
            required_inputs: initialData?.required_inputs || {},
            outputs: initialData?.outputs || {},
            config: initialData?.config || {},
        });
    };

    return (
        <form onSubmit={handleSubmit(handleFormSubmit)}>
            <Stack spacing={3} sx={{ mt: 1 }}>
                <SleekTextField
                    label="Utility Name"
                    placeholder="e.g. Data Cleaner"
                    {...register('name')}
                    error={!!errors.name}
                    helperText={errors.name?.message}
                />

                <Controller
                    name="utility_type"
                    control={control}
                    render={({ field }) => (
                        <SleekSelect
                            label="Utility Type"
                            {...field}
                            options={[
                                { value: 'forecasting', label: 'Forecasting' },
                                { value: 'optimization', label: 'Optimization' },
                                { value: 'transformation', label: 'Transformation' },
                                { value: 'custom', label: 'Custom' },
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
                        {initialData ? 'Update Utility' : 'Register Utility'}
                    </SleekButton>
                </Stack>
            </Stack>
        </form>
    );
};

export default AgentUtilityForm;
