import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Stack } from '@mui/material';
import SleekSelect from '../../../components/SleekSelect';
import SleekButton from '../../../components/SleekButton';
import type { Membership } from '../types';
import { useUsers } from '../api/queries';

const schema = z.object({
    user: z.string().min(1, 'User is required'),
    role: z.enum(['owner', 'admin', 'editor', 'viewer']),
});

type FormData = z.infer<typeof schema>;

interface MembershipFormProps {
    organizationId: string;
    initialData?: Membership;
    onSubmit: (data: any) => void;
    onCancel: () => void;
    isSubmitting?: boolean;
}

const MembershipForm: React.FC<MembershipFormProps> = ({ organizationId, initialData, onSubmit, onCancel, isSubmitting }) => {
    const { data: users } = useUsers();

    const { handleSubmit, control, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: initialData ? {
            user: initialData.user,
            role: initialData.role,
        } : {
            role: 'viewer',
        }
    });

    const handleFormSubmit = (data: FormData) => {
        onSubmit({
            ...data,
            organization: organizationId,
        });
    };

    return (
        <form onSubmit={handleSubmit(handleFormSubmit)}>
            <Stack spacing={3} sx={{ mt: 1 }}>
                <Controller
                    name="user"
                    control={control}
                    render={({ field }) => (
                        <SleekSelect
                            label="Select User"
                            {...field}
                            disabled={!!initialData}
                            options={users?.map(u => ({ value: u.id, label: `${u.username} (${u.email})` })) || []}
                            error={!!errors.user}
                            helperText={errors.user?.message}
                        />
                    )}
                />

                <Controller
                    name="role"
                    control={control}
                    render={({ field }) => (
                        <SleekSelect
                            label="Role"
                            {...field}
                            options={[
                                { value: 'owner', label: 'Owner' },
                                { value: 'admin', label: 'Admin' },
                                { value: 'editor', label: 'Editor' },
                                { value: 'viewer', label: 'Viewer' },
                            ]}
                            error={!!errors.role}
                            helperText={errors.role?.message}
                        />
                    )}
                />

                <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 2 }}>
                    <SleekButton onClick={onCancel} color="inherit">
                        Cancel
                    </SleekButton>
                    <SleekButton type="submit" variant="contained" loading={isSubmitting}>
                        {initialData ? 'Update Membership' : 'Add Member'}
                    </SleekButton>
                </Stack>
            </Stack>
        </form>
    );
};

export default MembershipForm;
