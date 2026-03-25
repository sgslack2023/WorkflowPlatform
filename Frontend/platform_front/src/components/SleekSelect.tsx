import React from 'react';
import { FormControl, InputLabel, Select, MenuItem, styled, alpha, FormHelperText } from '@mui/material';
import type { SelectProps } from '@mui/material';

const StyledFormControl = styled(FormControl)(() => ({
    '& .MuiOutlinedInput-root': {
        borderRadius: '10px',
        backgroundColor: alpha('#111827', 0.02),
        transition: 'all 0.2s ease',
        '& fieldset': {
            borderColor: alpha('#111827', 0.1),
        },
        '&:hover fieldset': {
            borderColor: alpha('#4f46e5', 0.3),
        },
        '&.Mui-focused fieldset': {
            borderColor: '#4f46e5',
            borderWidth: '1.5px',
        },
    },
    '& .MuiInputLabel-root': {
        color: alpha('#111827', 0.5),
        '&.Mui-focused': {
            color: '#4f46e5',
        },
    },
}));

interface SleekSelectProps extends Omit<SelectProps, 'error'> {
    label: string;
    options: { value: string | number; label: string }[];
    helperText?: string;
    error?: boolean;
}

const SleekSelect: React.FC<SleekSelectProps> = ({ label, options, helperText, error, ...props }) => {
    return (
        <StyledFormControl fullWidth error={error}>
            <InputLabel>{label}</InputLabel>
            <Select label={label} {...props}>
                {options.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                        {opt.label}
                    </MenuItem>
                ))}
            </Select>
            {helperText && <FormHelperText>{helperText}</FormHelperText>}
        </StyledFormControl>
    );
};

export default SleekSelect;
