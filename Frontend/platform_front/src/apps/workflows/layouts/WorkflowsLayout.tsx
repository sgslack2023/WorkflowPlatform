import React from 'react';
import { List, PlusCircle } from 'lucide-react';
import ModuleLayout from '../../../components/ModuleLayout';
import type { RailItem } from '../../../components/SleekRail';

const WorkflowsLayout: React.FC = () => {
    const subMenuItems: RailItem[] = [
        { icon: <List size={18} />, label: 'Workflows', path: '/workflows/list' },
        { icon: <PlusCircle size={18} />, label: 'Create Flow', path: '/workflows/create' },
    ];

    return <ModuleLayout subMenuItems={subMenuItems} />;
};

export default WorkflowsLayout;
