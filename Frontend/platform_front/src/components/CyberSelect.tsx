import type { SelectProps } from '@mui/material';
import { Select, MenuItem, FormControl, InputLabel, styled, alpha } from '@mui/material';

const StyledSelect = styled(Select)<SelectProps>(({ theme }) => ({
    backgroundColor: alpha(theme.palette.background.paper, 0.4),
    backdropFilter: 'blur(8px)',
    borderRadius: '10px',
    '& .MuiOutlinedInput-notchedOutline': {
        borderColor: alpha(theme.palette.divider, 0.2),
    },
    '&:hover .MuiOutlinedInput-notchedOutline': {
        borderColor: alpha(theme.palette.primary.main, 0.5),
    },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
        borderColor: theme.palette.primary.main,
        boxShadow: `0 0 10px ${alpha(theme.palette.primary.main, 0.3)}`,
    },
    '& .MuiSelect-icon': {
        color: alpha(theme.palette.text.primary, 0.5),
    },
}));

interface CyberSelectProps extends Omit<SelectProps, 'label'> {
    options: { value: string | number; label: string }[];
    label: string;
}

export const CyberSelect: React.FC<CyberSelectProps> = ({ options, label, fullWidth = true, ...props }) => {
    return (
        <FormControl fullWidth={fullWidth} variant="outlined">
            <InputLabel sx={{ color: alpha('#fff', 0.5), '&.Mui-focused': { color: 'primary.main' } }}>{label}</InputLabel>
            <StyledSelect label={label} {...props}>
                {options.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                        {opt.label}
                    </MenuItem>
                ))}
            </StyledSelect>
        </FormControl>
    );
};

export default CyberSelect;
