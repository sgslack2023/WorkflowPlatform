import React from 'react';
import { Box, Typography, styled, alpha, IconButton, Tooltip } from '@mui/material';
import { Settings2, Trash2 } from 'lucide-react';

const CardContainer = styled(Box)(() => ({
    backgroundColor: '#fff',
    border: '1px solid',
    borderColor: alpha('#111827', 0.08),
    borderRadius: '10px',
    padding: '8px 12px',
    transition: 'all 0.2s ease',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    minHeight: '60px',
    position: 'relative',

    '&:hover': {
        borderColor: '#4f46e5',
        backgroundColor: alpha('#4f46e5', 0.01),
        '& .edit-button': {
            opacity: 1,
            transform: 'scale(1)',
        }
    },
}));

const IconContainer = styled(Box)(() => ({
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: alpha('#111827', 0.04),
    color: '#111827',
    flexShrink: 0,
    transition: 'all 0.3s ease',
}));

const EditButton = styled(IconButton)(() => ({
    padding: '6px',
    borderRadius: '8px',
    color: alpha('#111827', 0.4),
    opacity: 0.3,
    transform: 'scale(0.9)',
    transition: 'all 0.2s ease',
    '&:hover': {
        backgroundColor: alpha('#4f46e5', 0.1),
        color: '#4f46e5',
    },
}));

interface SleekCardProps {
    title: string;
    subtitle?: string;
    description?: string; // Keep for data, but hide in number plate view
    icon?: React.ReactNode;
    tag?: string;
    onClick?: () => void;
    onEdit?: (e: React.MouseEvent) => void;
    onDelete?: (e: React.MouseEvent) => void;
    active?: boolean;
    children?: React.ReactNode;
    actionIcon?: React.ReactNode;
}

const DeleteButton = styled(IconButton)(({ theme }) => ({
    padding: '6px',
    borderRadius: '8px',
    color: alpha(theme.palette.error.main, 0.4),
    opacity: 0.3,
    transform: 'scale(0.9)',
    transition: 'all 0.2s ease',
    '&:hover': {
        backgroundColor: alpha(theme.palette.error.main, 0.1),
        color: theme.palette.error.main,
    },
}));

const SleekCard: React.FC<SleekCardProps> = ({
    title,
    subtitle,
    icon,
    tag,
    onClick,
    onEdit,
    onDelete,
    active,
    children,
    actionIcon
}) => {
    return (
        <CardContainer
            onClick={onClick}
            sx={{
                ...(active && {
                    borderColor: '#4f46e5',
                    backgroundColor: alpha('#4f46e5', 0.02),
                })
            }}
        >
            {icon && (
                <IconContainer className="card-icon-container">
                    {React.cloneElement(icon as React.ReactElement<any>, { size: 16 })}
                </IconContainer>
            )}

            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Typography
                    variant="body2"
                    sx={{
                        fontWeight: 700,
                        color: '#111827',
                        lineHeight: 1.2,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                    }}
                >
                    {title}
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.2 }}>
                    {subtitle && (
                        <Typography
                            variant="caption"
                            sx={{
                                color: '#4f46e5',
                                fontWeight: 600,
                                textTransform: 'uppercase',
                                letterSpacing: '0.4px',
                                fontSize: '10px'
                            }}
                        >
                            {subtitle}
                        </Typography>
                    )}

                    {tag && (
                        <Typography
                            variant="caption"
                            sx={{
                                fontSize: '10px',
                                color: alpha('#111827', 0.4),
                                backgroundColor: alpha('#111827', 0.04),
                                px: 0.8,
                                borderRadius: '4px'
                            }}
                        >
                            {tag}
                        </Typography>
                    )}
                </Box>
                {/* Render children if provided, allowing dynamic content extension */}
                {children && (
                    <Box sx={{ mt: 1 }}>
                        {children}
                    </Box>
                )}
            </Box>

            {actionIcon && actionIcon}

            {onEdit && (
                <Tooltip title="Edit" arrow>
                    <EditButton
                        className="edit-button"
                        size="small"
                        onClick={(e) => {
                            e.stopPropagation();
                            onEdit(e);
                        }}
                    >
                        <Settings2 size={14} />
                    </EditButton>
                </Tooltip>
            )}

            {onDelete && (
                <Tooltip title="Delete" arrow>
                    <DeleteButton
                        className="edit-button"
                        size="small"
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(e);
                        }}
                    >
                        <Trash2 size={14} />
                    </DeleteButton>
                </Tooltip>
            )}
        </CardContainer>
    );
};

export default SleekCard;
