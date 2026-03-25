import { TextField, styled, alpha } from '@mui/material';
import type { TextFieldProps } from '@mui/material';

const StyledTextField = styled(TextField)<TextFieldProps>(({ theme }) => ({
    '& .MuiOutlinedInput-root': {
        backgroundColor: alpha(theme.palette.background.paper, 0.4),
        backdropFilter: 'blur(8px)',
        borderRadius: '10px',
        transition: 'all 0.2s ease-in-out',
        '& fieldset': {
            borderColor: alpha(theme.palette.divider, 0.2),
        },
        '&:hover fieldset': {
            borderColor: alpha(theme.palette.primary.main, 0.5),
        },
        '&.Mui-focused fieldset': {
            borderColor: theme.palette.primary.main,
            boxShadow: `0 0 10px ${alpha(theme.palette.primary.main, 0.3)}`,
        },
    },
    '& .MuiInputLabel-root': {
        color: alpha(theme.palette.text.primary, 0.5),
        '&.Mui-focused': {
            color: theme.palette.primary.main,
        },
    },
    '& .MuiInputBase-input': {
        color: theme.palette.text.primary,
        '&::placeholder': {
            color: alpha(theme.palette.text.primary, 0.3),
            opacity: 1,
        },
    },
}));

export const CyberTextField: React.FC<TextFieldProps> = (props) => {
    return <StyledTextField variant="outlined" fullWidth {...props} />;
};

export default CyberTextField;
