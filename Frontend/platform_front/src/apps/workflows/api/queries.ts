import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from './functions';

export const useWorkflows = (params?: any) => {
    return useQuery({
        queryKey: ['workflows', params],
        queryFn: () => api.getWorkflows(params),
    });
};

export const useWorkflow = (id: string) => {
    return useQuery({
        queryKey: ['workflow', id],
        queryFn: () => api.getWorkflow(id),
        enabled: !!id,
    });
};

export const useCreateWorkflow = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: api.createWorkflow,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workflows'] });
        },
    });
};

export const useUpdateWorkflow = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: api.updateWorkflow,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workflows'] });
        },
    });
};

export const useDeleteWorkflow = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: api.deleteWorkflow,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workflows'] });
        },
    });
};

export const useRunWorkflow = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, input }: { id: string; input: any }) => api.runWorkflow(id, input),
        onSuccess: (_, variables) => {
            // Invalidate all node data caches for this workflow so widgets fetch fresh data
            queryClient.invalidateQueries({ queryKey: ['workflowNodeData', variables.id] });
            queryClient.invalidateQueries({ queryKey: ['workflowRuns', variables.id] });
        },
    });
};

export const useWorkflowRuns = (workflowId: string) => {
    return useQuery({
        queryKey: ['workflowRuns', workflowId],
        queryFn: () => api.getWorkflowRuns(workflowId),
        enabled: !!workflowId,
        refetchInterval: 5000,
    });
};

export const usePublishWorkflow = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: api.publishWorkflow,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workflows'] });
        },
    });
};

export const useWorkflowNodeData = (workflowId: string, nodeId: string) => {
    return useQuery({
        queryKey: ['workflowNodeData', workflowId, nodeId],
        queryFn: () => api.getWorkflowNodeData(workflowId, nodeId),
        enabled: !!workflowId && !!nodeId,
        staleTime: 0, // Always consider data stale to fetch latest run data
        gcTime: 0, // Don't cache results at all - always fetch fresh
        refetchOnMount: 'always', // Refetch every time component mounts
    });
};

export const useWorkflowChat = () => {
    return useMutation({
        mutationFn: ({ workflowId, nodeId, message, agentId, contextNodeIds, conversationId }: { workflowId: string, nodeId: string, message: string, agentId?: string, contextNodeIds?: string[], conversationId?: string }) =>
            api.workflowChat(workflowId, nodeId, message, agentId, contextNodeIds, conversationId),
    });
};

export const useChatHistory = (workflowId: string, nodeId: string, conversationId?: string) => {
    return useQuery({
        queryKey: ['chatHistory', workflowId, nodeId, conversationId],
        queryFn: () => api.getChatHistory(workflowId, nodeId, conversationId),
        enabled: !!workflowId && !!nodeId,
    });
};

export const useChatConversations = (workflowId: string, nodeId: string) => {
    return useQuery({
        queryKey: ['chatConversations', workflowId, nodeId],
        queryFn: () => api.getChatConversations(workflowId, nodeId),
        enabled: !!workflowId && !!nodeId,
    });
};
