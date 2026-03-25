import apiClient from '../../../utils/api-client';
import type { LLMProvider, AgentConfig, AgentUtility, AgentDefinition } from '../types';

// LLM Providers
export const getLLMProviders = async () => {
    const response = await apiClient.get<LLMProvider[]>('/agents/providers/');
    return response.data;
};

export const createLLMProvider = async (data: Partial<LLMProvider>) => {
    const response = await apiClient.post<LLMProvider>('/agents/providers/', data);
    return response.data;
};

export const updateLLMProvider = async (id: string, data: Partial<LLMProvider>) => {
    const response = await apiClient.patch<LLMProvider>(`/agents/providers/${id}/`, data);
    return response.data;
};

export const deleteLLMProvider = async (id: string) => {
    await apiClient.delete(`/agents/providers/${id}/`);
};

// Agent Configs
export const getAgentConfigs = async () => {
    const response = await apiClient.get<AgentConfig[]>('/agents/configs/');
    return response.data;
};

export const createAgentConfig = async (data: Partial<AgentConfig>) => {
    const response = await apiClient.post<AgentConfig>('/agents/configs/', data);
    return response.data;
};

export const updateAgentConfig = async (id: string, data: Partial<AgentConfig>) => {
    const response = await apiClient.patch<AgentConfig>(`/agents/configs/${id}/`, data);
    return response.data;
};

export const deleteAgentConfig = async (id: string) => {
    await apiClient.delete(`/agents/configs/${id}/`);
};

// Agent Utilities
export const getAgentUtilities = async () => {
    const response = await apiClient.get<AgentUtility[]>('/agents/utilities/');
    return response.data;
};

export const createAgentUtility = async (data: Partial<AgentUtility>) => {
    const response = await apiClient.post<AgentUtility>('/agents/utilities/', data);
    return response.data;
};

export const updateAgentUtility = async (id: string, data: Partial<AgentUtility>) => {
    const response = await apiClient.patch<AgentUtility>(`/agents/utilities/${id}/`, data);
    return response.data;
};

export const deleteAgentUtility = async (id: string) => {
    await apiClient.delete(`/agents/utilities/${id}/`);
};

// Agent Definitions
export const getAgentDefinitions = async () => {
    const response = await apiClient.get<AgentDefinition[]>('/agents/definitions/');
    return response.data;
};

export const createAgentDefinition = async (data: Partial<AgentDefinition>) => {
    const response = await apiClient.post<AgentDefinition>('/agents/definitions/', data);
    return response.data;
};

export const updateAgentDefinition = async (id: string, data: Partial<AgentDefinition>) => {
    const response = await apiClient.patch<AgentDefinition>(`/agents/definitions/${id}/`, data);
    return response.data;
};

export const deleteAgentDefinition = async (id: string) => {
    await apiClient.delete(`/agents/definitions/${id}/`);
};

export const testAgent = async (id: string, message: string) => {
    const response = await apiClient.post(`/agents/definitions/${id}/test/`, { message });
    return response.data;
};
