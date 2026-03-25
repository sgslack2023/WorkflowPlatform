import React from 'react';
import { ShoppingBag, Wrench } from 'lucide-react';
import ModuleLayout from '../../../components/ModuleLayout';
import type { RailItem } from '../../../components/SleekRail';

const ToolsLayout: React.FC = () => {
    const subMenuItems: RailItem[] = [
        { icon: <ShoppingBag size={18} />, label: 'Marketplace', path: '/tools/marketplace' },
        { icon: <Wrench size={18} />, label: 'My Tools', path: '/tools/my-tools' },
    ];

    return <ModuleLayout subMenuItems={subMenuItems} />;
};

export default ToolsLayout;
