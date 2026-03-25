export interface User {
    id: string;
    username: string;
    email: string;
    first_name?: string;
    last_name?: string;
    organizations?: any[];
    is_active: boolean;
    is_superuser: boolean;
    date_joined: string;
}

export interface Organization {
    id: string;
    name: string;
    slug: string;
    is_active: boolean;
    created_at: string;
}

export interface Membership {
    id: string;
    user: string; // ID
    organization: string; // ID
    role: 'owner' | 'admin' | 'editor' | 'viewer';
    is_active: boolean;
    joined_at: string;
    user_details?: User;
    organization_name?: string;
}
export interface Scenario {
    id: string;
    organization: string;
    name: string;
    description?: string;
    parent?: string;
    data_overrides: Record<string, any>;
    agent_overrides: Record<string, any>;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}
