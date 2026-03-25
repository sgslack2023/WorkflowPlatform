import api from '../../../utils/api-client';

export const getWorkflows = async (params: any) => {
    const response = await api.get('/workflows/', { params });
    return response.data;
};

export const createWorkflow = async (data: any) => {
    const response = await api.post('/workflows/', data);
    return response.data;
};

export const updateWorkflow = async ({ id, data }: { id: string; data: any }) => {
    const response = await api.patch(`/workflows/${id}/`, data);
    return response.data;
};

export const deleteWorkflow = async (id: string) => {
    const response = await api.delete(`/workflows/${id}/`);
    return response.data;
};

export const getWorkflow = async (id: string) => {
    const response = await api.get(`/workflows/${id}/`);
    return response.data;
};

export const runWorkflow = async (id: string, input: any) => {
    const response = await api.post(`/workflows/${id}/run/`, input);
    return response.data;
};

export const getWorkflowRuns = async (workflowId: string) => {
    const response = await api.get(`/workflows/${workflowId}/runs/`);
    return response.data;
};

export const publishWorkflow = async ({ id, isPublished }: { id: string, isPublished: boolean }) => {
    const response = await api.post(`/workflows/${id}/publish/`, { is_published: isPublished });
    return response.data;
};

export const getWorkflowNodeData = async (workflowId: string, nodeId: string) => {
    // Add timestamp to bypass any caching
    const response = await api.post(`/workflows/${workflowId}/node-data/`, { 
        node_id: nodeId,
        _ts: Date.now() // Cache buster
    });
    return response.data;
};

export const workflowChat = async (workflowId: string, nodeId: string, message: string, agentId?: string, contextNodeIds?: string[], conversationId?: string) => {
    const response = await api.post(`/workflows/${workflowId}/chat/`, {
        node_id: nodeId,
        message,
        agent_id: agentId,
        context_node_ids: contextNodeIds,
        conversation_id: conversationId
    });
    return response.data;
};

export const getChatHistory = async (workflowId: string, nodeId: string, conversationId?: string) => {
    const response = await api.get(`/workflows/${workflowId}/chat-history/`, {
        params: { node_id: nodeId, conversation_id: conversationId }
    });
    return response.data;
};

export const getChatConversations = async (workflowId: string, nodeId: string) => {
    const response = await api.get(`/workflows/${workflowId}/chat-conversations/`, {
        params: { node_id: nodeId }
    });
    return response.data;
};
