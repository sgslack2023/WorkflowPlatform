import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../store/authStore';
import * as api from './functions';

// Auth
export const useLogin = () => {
    const setAuth = useAuthStore((state) => state.setAuth);
    const navigate = useNavigate();
    return useMutation({
        mutationFn: api.login,
        onSuccess: (data) => {
            setAuth(data.access, data.refresh, data.user);
            navigate('/agents');
        },
    });
};

export const useRegister = () => {
    const navigate = useNavigate();
    return useMutation({
        mutationFn: api.registerUser,
        onSuccess: () => {
            navigate('/login');
        },
    });
};

// Users
export const useUsers = () => {
    return useQuery({
        queryKey: ['users'],
        queryFn: api.getUsers,
    });
};

export const useCreateUser = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: api.createUser,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
        },
    });
};

export const useUpdateUser = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => api.updateUser(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            queryClient.invalidateQueries({ queryKey: ['memberships'] });
        },
    });
};

export const useDeleteUser = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: api.deleteUser,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            queryClient.invalidateQueries({ queryKey: ['memberships'] });
        },
    });
};

// Organizations
export const useOrganizations = () => {
    return useQuery({
        queryKey: ['organizations'],
        queryFn: api.getOrganizations,
    });
};

export const useCreateOrganization = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: api.createOrganization,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['organizations'] });
        },
    });
};

export const useUpdateOrganization = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => api.updateOrganization(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['organizations'] });
        },
    });
};

export const useDeleteOrganization = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: api.deleteOrganization,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['organizations'] });
        },
    });
};

// Memberships
export const useMemberships = () => {
    return useQuery({
        queryKey: ['memberships'],
        queryFn: api.getMemberships,
    });
};

export const useCreateMembership = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: api.createMembership,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['memberships'] });
        },
    });
};

export const useUpdateMembership = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => api.updateMembership(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['memberships'] });
        },
    });
};

export const useDeleteMembership = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: api.deleteMembership,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['memberships'] });
        },
    });
};
// Scenarios
export const useScenarios = () => {
    return useQuery({
        queryKey: ['scenarios'],
        queryFn: api.getScenarios,
    });
};

export const useCreateScenario = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: api.createScenario,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['scenarios'] });
        },
    });
};

export const useUpdateScenario = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => api.updateScenario(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['scenarios'] });
        },
    });
};

export const useDeleteScenario = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: api.deleteScenario,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['scenarios'] });
        },
    });
};
