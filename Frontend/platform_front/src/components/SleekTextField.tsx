import React from 'react';
import { TextField, styled, alpha } from '@mui/material';
import type { TextFieldProps } from '@mui/material';

const StyledTextField = styled(TextField)(() => ({
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
    '& .MuiInputBase-input': {
        fontSize: '0.9rem',
    }
}));

const SleekTextField: React.FC<TextFieldProps> = (props) => {
    return <StyledTextField variant="outlined" fullWidth {...props} />;
};

export default SleekTextField;
