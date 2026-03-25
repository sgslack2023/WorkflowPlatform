export interface LLMProvider {
    id: string;
    name: string;
    provider_type: 'openai' | 'anthropic' | 'azure' | 'local';
    config: Record<string, any>;
    is_active: boolean;
    has_api_key?: boolean;
    masked_api_key?: string;
    created_at: string;
}

export interface AgentConfig {
    id: string;
    name: string;
    system_prompt: string;
    temperature: number;
    max_tokens: number;
    tool_policy: Record<string, any>;
    memory_policy: string;
    tools?: any[]; // List of Tool objects
    created_at: string;
}

export interface AgentUtility {
    id: string;
    name: string;
    utility_type: string;
    required_inputs: Record<string, any>;
    outputs: Record<string, any>;
    config: Record<string, any>;
    created_at: string;
}

export interface AgentDefinition {
    id: string;
    name: string;
    llm_provider: string; // ID
    agent_config: string; // ID
    utilities: string[]; // IDs
    is_active: boolean;
    created_at: string;
}
