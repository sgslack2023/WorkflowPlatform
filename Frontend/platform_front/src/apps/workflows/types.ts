export interface FlowNode {
    id: string;
    type: 'data_source' | 'agent';
    resourceId: string;  // ID of the DataSource or AgentDefinition
    name: string;
    position: number;    // Order in the flow
}

export interface WorkflowFlow {
    name: string;
    description?: string;
    nodes: FlowNode[];
}
