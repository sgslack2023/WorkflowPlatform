import apiClient from '../../../utils/api-client';
import type { User, Organization, Membership, Scenario } from '../types';

// Auth
export const login = async (data: any) => {
    const response = await apiClient.post<{ access: string; refresh: string; user: User }>('/token/', data);
    return response.data;
};

export const registerUser = async (data: any) => {
    const response = await apiClient.post('/core/users/', data);
    return response.data;
};

// Users
export const getUsers = async () => {
    const response = await apiClient.get<User[]>('/core/users/');
    return response.data;
};

export const createUser = async (data: Partial<User> & { password?: string }) => {
    const response = await apiClient.post<User>('/core/users/', data);
    return response.data;
};

export const updateUser = async (id: string, data: Partial<User> & { password?: string }) => {
    const response = await apiClient.patch<User>(`/core/users/${id}/`, data);
    return response.data;
};

export const deleteUser = async (id: string) => {
    await apiClient.delete(`/core/users/${id}/`);
};

// Organizations
export const getOrganizations = async () => {
    const response = await apiClient.get<Organization[]>('/core/organizations/');
    return response.data;
};

export const createOrganization = async (data: Partial<Organization>) => {
    const response = await apiClient.post<Organization>('/core/organizations/', data);
    return response.data;
};

export const updateOrganization = async (id: string, data: Partial<Organization>) => {
    const response = await apiClient.patch<Organization>(`/core/organizations/${id}/`, data);
    return response.data;
};

export const deleteOrganization = async (id: string) => {
    await apiClient.delete(`/core/organizations/${id}/`);
};

// Memberships
export const getMemberships = async () => {
    const response = await apiClient.get<Membership[]>('/core/memberships/');
    return response.data;
};

export const createMembership = async (data: Partial<Membership>) => {
    const response = await apiClient.post<Membership>('/core/memberships/', data);
    return response.data;
};

export const updateMembership = async (id: string, data: Partial<Membership>) => {
    const response = await apiClient.patch<Membership>(`/core/memberships/${id}/`, data);
    return response.data;
};

export const deleteMembership = async (id: string) => {
    await apiClient.delete(`/core/memberships/${id}/`);
};
// Scenarios
export const getScenarios = async () => {
    const response = await apiClient.get<Scenario[]>('/core/scenarios/');
    return response.data;
};

export const createScenario = async (data: Partial<Scenario>) => {
    const response = await apiClient.post<Scenario>('/core/scenarios/', data);
    return response.data;
};

export const updateScenario = async (id: string, data: Partial<Scenario>) => {
    const response = await apiClient.patch<Scenario>(`/core/scenarios/${id}/`, data);
    return response.data;
};

export const deleteScenario = async (id: string) => {
    await apiClient.delete(`/core/scenarios/${id}/`);
};
