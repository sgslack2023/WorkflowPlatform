import React from 'react';
import { Database, Table } from 'lucide-react';
import ModuleLayout from '../../../components/ModuleLayout';
import type { RailItem } from '../../../components/SleekRail';

const DataSourcesLayout: React.FC = () => {
    const subMenuItems: RailItem[] = [
        { icon: <Database size={18} />, label: 'Sources', path: '/datasources/source' },
        { icon: <Table size={18} />, label: 'Dynamic Tables', path: '/datasources/dynamic-table' },
    ];

    return <ModuleLayout subMenuItems={subMenuItems} />;
};

export default DataSourcesLayout;
