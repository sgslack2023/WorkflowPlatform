import React from 'react';
import { Globe } from 'lucide-react';
import SchemaIcon from '@mui/icons-material/SchemaRounded';
import ModuleLayout from '../../../components/ModuleLayout';
import type { RailItem } from '../../../components/SleekRail';

const AppsRuntimeLayout: React.FC = () => {
    const subMenuItems: RailItem[] = [
        { label: 'Published', icon: <Globe size={18} />, path: '/apps/gallery' },
        { label: 'Workflows', icon: <SchemaIcon sx={{ fontSize: 18 }} />, path: '/apps/components' },
    ];

    return <ModuleLayout subMenuItems={subMenuItems} />;
};

export default AppsRuntimeLayout;
