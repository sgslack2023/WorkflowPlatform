import React from 'react';
import { Building2, UserRound } from 'lucide-react';
import ModuleLayout from '../../../components/ModuleLayout';
import type { RailItem } from '../../../components/SleekRail';

const MembershipLayout: React.FC = () => {
    const subMenuItems: RailItem[] = [
        { icon: <Building2 size={18} />, label: 'Organizations', path: '/membership/organizations' },
        { icon: <UserRound size={18} />, label: 'Users & Teams', path: '/membership/users' },
    ];

    return <ModuleLayout subMenuItems={subMenuItems} />;
};

export default MembershipLayout;
