import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Stack, Checkbox, FormControlLabel, Box, Typography, alpha } from '@mui/material';
import SleekTextField from '../../../components/SleekTextField';
import SleekButton from '../../../components/SleekButton';
import type { User } from '../types';

const schema = z.object({
    username: z.string().min(1, 'Username is required'),
    email: z.string().email('Invalid email'),
    password: z.string().optional().or(z.literal('')),
    is_superuser: z.boolean(),
});

type FormData = z.infer<typeof schema>;

interface UserFormProps {
    initialData?: User;
    onSubmit: (data: any) => void;
    onCancel: () => void;
    isSubmitting?: boolean;
}

const UserForm: React.FC<UserFormProps> = ({ initialData, onSubmit, onCancel, isSubmitting }) => {
    const { register, handleSubmit, control, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: initialData ? {
            username: initialData.username,
            email: initialData.email,
            is_superuser: initialData.is_superuser,
        } : {
            is_superuser: false,
        }
    });

    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <Stack spacing={3} sx={{ mt: 1 }}>
                <SleekTextField
                    label="Username"
                    placeholder="e.g. jdoe"
                    {...register('username')}
                    error={!!errors.username}
                    helperText={errors.username?.message}
                />

                <SleekTextField
                    label="Email Address"
                    placeholder="e.g. jane@example.com"
                    {...register('email')}
                    error={!!errors.email}
                    helperText={errors.email?.message}
                />

                <SleekTextField
                    label={initialData ? "Reset Password (Optional)" : "Password"}
                    type="password"
                    placeholder="••••••••"
                    {...register('password')}
                    error={!!errors.password}
                    helperText={errors.password?.message}
                />

                <FormControlLabel
                    control={
                        <Controller
                            name="is_superuser"
                            control={control}
                            render={({ field }) => (
                                <Checkbox
                                    checked={field.value}
                                    onChange={(e) => field.onChange(e.target.checked)}
                                />
                            )}
                        />
                    }
                    label={
                        <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>Superuser Privileges</Typography>
                            <Typography variant="caption" sx={{ color: alpha('#111827', 0.5) }}>
                                Full administrative access to the platform.
                            </Typography>
                        </Box>
                    }
                />

                <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 2 }}>
                    <SleekButton onClick={onCancel} color="inherit">
                        Cancel
                    </SleekButton>
                    <SleekButton type="submit" variant="contained" loading={isSubmitting}>
                        {initialData ? 'Update User' : 'Create User'}
                    </SleekButton>
                </Stack>
            </Stack>
        </form>
    );
};

export default UserForm;
