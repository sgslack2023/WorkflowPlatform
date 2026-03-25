import api from '../../../utils/api-client';

export interface Tool {
    id: string;
    organization: string | null; // Null for system tools
    name: string;
    description: string;
    key: string;
    python_path: string;
    execution_mode: 'synchronous' | 'asynchronous';
    input_schema: any;
    output_schema: any;
    algo_parameters: any;
    created_at: string;
    updated_at: string;
}

export const ToolsAPI = {
    // List all tools (System + Org)
    list: async () => {
        const response = await api.get<Tool[]>('/tools/items/');
        return response.data;
    },

    // Get a specific tool
    get: async (id: string) => {
        const response = await api.get<Tool>(`/tools/items/${id}/`);
        return response.data;
    },

    // Execute a tool
    execute: async (id: string, inputs: any) => {
        const response = await api.post(`/tools/items/${id}/execute/`, inputs);
        return response.data;
    },

    // Create a new tool
    create: async (data: Partial<Tool>) => {
        const response = await api.post('/tools/items/', data);
        return response.data;
    },

    // Create/Update a tool is done via sync_tools for now, 
    // but maybe users can create config-wrappers later.
};
