import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from './functions';

export const useLLMProviders = () => {
    return useQuery({
        queryKey: ['llmProviders'],
        queryFn: api.getLLMProviders,
    });
};

export const useCreateLLMProvider = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: api.createLLMProvider,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['llmProviders'] });
        },
    });
};

export const useUpdateLLMProvider = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => api.updateLLMProvider(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['llmProviders'] });
        },
    });
};

export const useDeleteLLMProvider = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: api.deleteLLMProvider,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['llmProviders'] });
        },
    });
};

export const useAgentConfigs = () => {
    return useQuery({
        queryKey: ['agentConfigs'],
        queryFn: api.getAgentConfigs,
    });
};

export const useCreateAgentConfig = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: api.createAgentConfig,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['agentConfigs'] });
        },
    });
};

export const useUpdateAgentConfig = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => api.updateAgentConfig(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['agentConfigs'] });
        },
    });
};

export const useDeleteAgentConfig = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: api.deleteAgentConfig,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['agentConfigs'] });
        },
    });
};

export const useAgentUtilities = () => {
    return useQuery({
        queryKey: ['agentUtilities'],
        queryFn: api.getAgentUtilities,
    });
};

export const useCreateAgentUtility = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: api.createAgentUtility,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['agentUtilities'] });
        },
    });
};

export const useUpdateAgentUtility = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => api.updateAgentUtility(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['agentUtilities'] });
        },
    });
};

export const useDeleteAgentUtility = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: api.deleteAgentUtility,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['agentUtilities'] });
        },
    });
};

export const useAgentDefinitions = () => {
    return useQuery({
        queryKey: ['agentDefinitions'],
        queryFn: api.getAgentDefinitions,
    });
};

export const useCreateAgentDefinition = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: api.createAgentDefinition,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['agentDefinitions'] });
        },
    });
};

export const useUpdateAgentDefinition = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => api.updateAgentDefinition(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['agentDefinitions'] });
        },
    });
};

export const useDeleteAgentDefinition = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: api.deleteAgentDefinition,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['agentDefinitions'] });
        },
    });
};

export const useTestAgent = () => {
    return useMutation({
        mutationFn: ({ id, message }: { id: string; message: string }) => api.testAgent(id, message),
    });
};
