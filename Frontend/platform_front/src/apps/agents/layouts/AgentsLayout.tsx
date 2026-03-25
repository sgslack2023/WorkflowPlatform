import React from 'react';
import { Cpu, Settings2, FileCode2 } from 'lucide-react';
import ModuleLayout from '../../../components/ModuleLayout';
import type { RailItem } from '../../../components/SleekRail';

const AgentsLayout: React.FC = () => {
    const subMenuItems: RailItem[] = [
        { icon: <Cpu size={18} />, label: 'LLM Provider', path: '/agents/llm-provider' },
        { icon: <Settings2 size={18} />, label: 'Config', path: '/agents/config' },
        { icon: <FileCode2 size={18} />, label: 'Definition', path: '/agents/definition' },
    ];

    return <ModuleLayout subMenuItems={subMenuItems} />;
};

export default AgentsLayout;
