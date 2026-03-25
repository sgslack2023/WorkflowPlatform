import apiClient from '../../../utils/api-client';
import type { DataSource, DynamicTable, DynamicTableHistory } from '../types';

// Data Sources
export const getDataSources = async () => {
    // URL: /api/datasources/datasources/
    const response = await apiClient.get<DataSource[]>('/datasources/datasources/');
    return response.data;
};

export const createDataSource = async (data: Partial<DataSource>) => {
    const response = await apiClient.post<DataSource>('/datasources/datasources/', data);
    return response.data;
};

export const updateDataSource = async (id: string, data: Partial<DataSource>) => {
    const response = await apiClient.patch<DataSource>(`/datasources/datasources/${id}/`, data);
    return response.data;
};

export const deleteDataSource = async (id: string) => {
    await apiClient.delete(`/datasources/datasources/${id}/`);
};

// Dynamic Tables
export const getDynamicTables = async (params?: any) => {
    // URL: /api/datasources/dynamic-tables/
    const response = await apiClient.get<DynamicTable[]>('/datasources/dynamic-tables/', { params });
    return response.data;
};

export const createDynamicTable = async (data: Partial<DynamicTable>) => {
    const response = await apiClient.post<DynamicTable>('/datasources/dynamic-tables/', data);
    return response.data;
};

export const updateDynamicTable = async (id: string, data: Partial<DynamicTable>) => {
    const response = await apiClient.patch<DynamicTable>(`/datasources/dynamic-tables/${id}/`, data);
    return response.data;
};

export const deleteDynamicTable = async (id: string) => {
    await apiClient.delete(`/datasources/dynamic-tables/${id}/`);
};

export const getDynamicTableHistory = async (tableId: string) => {
    const response = await apiClient.get<DynamicTableHistory[]>(`/datasources/dynamic-tables/${tableId}/history/`);
    return response.data;
};

export const getDynamicTableRows = async (tableId: string, params?: { limit?: number }) => {
    const response = await apiClient.get<any[]>(`/datasources/dynamic-tables/${tableId}/rows/`, { params });
    return response.data;
};

export const validateDynamicTableUpload = async (tableId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post(`/datasources/dynamic-tables/${tableId}/validate-upload/`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

export const uploadDynamicTableFile = async (tableId: string, file: File, skipErrors: boolean = false) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post(`/datasources/dynamic-tables/${tableId}/upload/`, formData, {
        params: { skip_errors: skipErrors },
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};
export const clearDynamicTableRows = async (tableId: string) => {
    const response = await apiClient.post(`/datasources/dynamic-tables/${tableId}/clear-rows/`);
    return response.data;
};
