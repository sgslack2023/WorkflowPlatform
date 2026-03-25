import { Typography, alpha } from '@mui/material';
import SleekCard from '../../../components/SleekCard';
import { Wrench } from 'lucide-react';
import type { Tool } from '../api/tools-api';

interface ToolCardProps {
    tool: Tool;
    onConfigure: (tool: Tool) => void;
}

const ToolCard: React.FC<ToolCardProps> = ({ tool, onConfigure }) => {
    return (
        <SleekCard
            title={tool.name}
            subtitle={tool.key}
            icon={<Wrench size={16} />}
            tag={tool.execution_mode}
            onClick={() => onConfigure(tool)}
            onEdit={() => onConfigure(tool)}
        >
            <Typography variant="caption" sx={{ color: alpha('#111827', 0.4), mt: 0.5, display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {tool.description}
            </Typography>
        </SleekCard>
    );
};

export default ToolCard;
