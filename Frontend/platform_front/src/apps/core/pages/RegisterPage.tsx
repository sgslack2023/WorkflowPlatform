import React from 'react';
import {
    Box,
    Typography,
    Stack,
    TextField,
    Button,
    Paper,
    Link as MuiLink
} from '@mui/material';
import { Link } from 'react-router-dom';

const RegisterPage: React.FC = () => {
    return (
        <Paper sx={{ p: 4, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
            <Box sx={{ mb: 4, textAlign: 'center' }}>
                <Typography variant="h4" sx={{ mb: 1, fontWeight: 800 }}>
                    Create Account
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Join the system today
                </Typography>
            </Box>

            <form>
                <Stack spacing={3}>
                    <TextField
                        fullWidth
                        label="Full Name"
                        placeholder="John Doe"
                        variant="outlined"
                    />
                    <TextField
                        fullWidth
                        label="Email Address"
                        placeholder="name@example.com"
                        variant="outlined"
                    />
                    <TextField
                        fullWidth
                        label="Password"
                        type="password"
                        placeholder="••••••••"
                        variant="outlined"
                    />

                    <Button
                        variant="contained"
                        size="large"
                        fullWidth
                        disableElevation
                        sx={{ py: 1.5 }}
                    >
                        Sign Up
                    </Button>

                    <Box sx={{ textAlign: 'center', mt: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                            Already have an account?{' '}
                            <MuiLink
                                component={Link}
                                to="/login"
                                sx={{
                                    fontWeight: 600,
                                    textDecoration: 'none',
                                    color: 'primary.main'
                                }}
                            >
                                Sign In
                            </MuiLink>
                        </Typography>
                    </Box>
                </Stack>
            </form>
        </Paper>
    );
};

export default RegisterPage;
