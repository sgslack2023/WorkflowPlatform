import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from './functions';
import type { DataSource, DynamicTable } from '../types';

// Data Sources Hooks
export const useDataSources = () => {
    return useQuery({
        queryKey: ['dataSources'],
        queryFn: api.getDataSources,
    });
};

export const useCreateDataSource = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: api.createDataSource,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['dataSources'] });
        },
    });
};

export const useUpdateDataSource = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<DataSource> }) => api.updateDataSource(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['dataSources'] });
        },
    });
};

export const useDeleteDataSource = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: api.deleteDataSource,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['dataSources'] });
        },
    });
};

// Dynamic Tables Hooks
export const useDynamicTables = (params?: any, options?: any) => {
    return useQuery<DynamicTable[]>({
        queryKey: ['dynamicTables', params],
        queryFn: () => api.getDynamicTables(params),
        ...options
    });
};

export const useCreateDynamicTable = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: api.createDynamicTable,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['dynamicTables'] });
        },
    });
};

export const useUpdateDynamicTable = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<DynamicTable> }) => api.updateDynamicTable(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['dynamicTables'] });
        },
    });
};

export const useDeleteDynamicTable = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: api.deleteDynamicTable,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['dynamicTables'] });
        },
    });
};

export const useDynamicTableHistory = (tableId: string) => {
    return useQuery({
        queryKey: ['dynamicTableHistory', tableId],
        queryFn: () => api.getDynamicTableHistory(tableId),
        enabled: !!tableId,
    });
};

export const useDynamicTableRows = (tableId: string, params?: { limit?: number }, options?: any) => {
    return useQuery({
        queryKey: ['dynamicTableRows', tableId, params],
        queryFn: () => api.getDynamicTableRows(tableId, params),
        enabled: !!tableId,
        ...options
    });
};

export const useValidateUpload = () => {
    return useMutation({
        mutationFn: ({ tableId, file }: { tableId: string, file: File }) => api.validateDynamicTableUpload(tableId, file),
    });
};

export const useUploadFile = () => {
    return useMutation({
        mutationFn: ({ tableId, file, skipErrors }: { tableId: string, file: File, skipErrors?: boolean }) => 
            api.uploadDynamicTableFile(tableId, file, skipErrors),
    });
};
export const useClearTableRows = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (tableId: string) => api.clearDynamicTableRows(tableId),
        onSuccess: (_, tableId) => {
            queryClient.invalidateQueries({ queryKey: ['dynamicTableRows', tableId] });
        },
    });
};
