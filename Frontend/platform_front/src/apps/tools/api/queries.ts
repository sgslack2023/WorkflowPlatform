import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ToolsAPI } from './tools-api';

export const useTools = () => {
    return useQuery({
        queryKey: ['tools'],
        queryFn: ToolsAPI.list,
    });
};

export const useTool = (id: string) => {
    return useQuery({
        queryKey: ['tool', id],
        queryFn: () => ToolsAPI.get(id),
        enabled: !!id,
    });
};

export const useExecuteTool = () => {
    return useMutation({
        mutationFn: (data: { id: string; inputs: any }) => ToolsAPI.execute(data.id, data.inputs),
    });
};

export const useCreateTool = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ToolsAPI.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tools'] });
        },
    });
};
