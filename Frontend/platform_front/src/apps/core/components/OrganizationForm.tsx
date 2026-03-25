import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Stack } from '@mui/material';
import SleekTextField from '../../../components/SleekTextField';
import SleekButton from '../../../components/SleekButton';
import type { Organization } from '../types';

const schema = z.object({
    name: z.string().min(1, 'Name is required'),
    slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
});

type FormData = z.infer<typeof schema>;

interface OrganizationFormProps {
    initialData?: Organization;
    onSubmit: (data: any) => void;
    onCancel: () => void;
    isSubmitting?: boolean;
}

const OrganizationForm: React.FC<OrganizationFormProps> = ({ initialData, onSubmit, onCancel, isSubmitting }) => {
    const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: initialData || {}
    });

    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <Stack spacing={3} sx={{ mt: 1 }}>
                <SleekTextField
                    label="Organization Name"
                    placeholder="e.g. Acme Corp"
                    {...register('name')}
                    error={!!errors.name}
                    helperText={errors.name?.message}
                />

                <SleekTextField
                    label="Slug"
                    placeholder="e.g. acme-corp"
                    {...register('slug')}
                    error={!!errors.slug}
                    helperText={errors.slug?.message}
                />

                <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 2 }}>
                    <SleekButton onClick={onCancel} color="inherit">
                        Cancel
                    </SleekButton>
                    <SleekButton type="submit" variant="contained" loading={isSubmitting}>
                        {initialData ? 'Update Organization' : 'Create Organization'}
                    </SleekButton>
                </Stack>
            </Stack>
        </form>
    );
};

export default OrganizationForm;
