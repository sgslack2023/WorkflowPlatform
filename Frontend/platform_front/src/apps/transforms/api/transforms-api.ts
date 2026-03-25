import api from '../../../utils/api-client';

export interface TransformDefinition {
    id: string;
    organization?: string;
    name: string;
    key: string;
    description: string;
    input_schema: any;
    output_schema: any;
    auto_discovered: boolean;
}

export interface TransformRun {
    id: string;
    transform: string;
    output_table?: string;
    status: 'pending' | 'running' | 'success' | 'failed';
    error?: string;
    started_at?: string;
    finished_at?: string;
}

export const TransformsAPI = {
    list: async (): Promise<TransformDefinition[]> => {
        const response = await api.get('/transforms/definitions/');
        return response.data;
    },

    get: async (id: string): Promise<TransformDefinition> => {
        const response = await api.get(`/transforms/definitions/${id}/`);
        return response.data;
    },

    execute: async (id: string): Promise<TransformRun> => {
        const response = await api.post('/transforms/runs/', { transform: id });
        return response.data;
    },

    getRun: async (id: string): Promise<TransformRun> => {
        const response = await api.get(`/transforms/runs/${id}/`);
        return response.data;
    },

    runPreview: async (id: string, parameters: any, inputTableIds: string[]): Promise<{ columns: any[], rows: any[] }> => {
        const response = await api.post(`/transforms/definitions/${id}/run-preview/`, {
            parameters,
            input_table_ids: inputTableIds
        });
        return response.data;
    }
};
