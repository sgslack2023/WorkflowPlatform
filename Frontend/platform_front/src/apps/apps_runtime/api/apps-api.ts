import axios from 'axios';

const api = axios.create({
    baseURL: '/api/apps/',
});

// Interceptor for Auth
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export interface AppDefinition {
    id: string;
    organization: string;
    workflows: string[];
    name: string;
    description: string;
    public_slug: string;
    is_published: boolean;
    icon: string;
    color: string;
    layout_config: {
        widgets: any[];
        layouts?: any;
    };
    created_at: string;
    updated_at: string;
}

export interface AppRun {
    id: string;
    app: string;
    scenario: string | null;
    input_payload: any;
    output_payload: any;
    run_at: string;
}

export const appsApi = {
    listDefinitions: async () => {
        const response = await api.get<AppDefinition[]>('definitions/');
        return response.data;
    },
    getDefinition: async (slug: string) => {
        const response = await api.get<AppDefinition>(`definitions/${slug}/`);
        return response.data;
    },
    createDefinition: async (data: Partial<AppDefinition>) => {
        const response = await api.post<AppDefinition>('definitions/', data);
        return response.data;
    },
    updateDefinition: async (slug: string, data: Partial<AppDefinition>) => {
        const response = await api.patch<AppDefinition>(`definitions/${slug}/`, data);
        return response.data;
    },
    deleteDefinition: async (slug: string) => {
        await api.delete(`definitions/${slug}/`);
    },
    listRuns: async (appId: string) => {
        const response = await api.get<AppRun[]>(`runs/?app=${appId}`);
        return response.data;
    },
    triggerRun: async (appId: string, payload: any) => {
        const response = await api.post<AppRun>('runs/', { app: appId, ...payload });
        return response.data;
    }
};
