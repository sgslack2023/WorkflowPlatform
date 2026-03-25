import React from 'react';
import {
    Box,
    Typography,
    Stack,
    TextField,
    Button,
    Paper,
    Link as MuiLink,
    CircularProgress,
    Alert
} from '@mui/material';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useLogin } from '../api/queries';

const loginSchema = z.object({
    username: z.string().min(1, 'Username is required'),
    password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const LoginPage: React.FC = () => {
    const {
        register,
        handleSubmit,
        formState: { errors }
    } = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
    });

    const loginMutation = useLogin();

    const onSubmit = (data: LoginFormValues) => {
        loginMutation.mutate(data);
    };

    return (
        <Paper sx={{ p: 4, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
            <Box sx={{ mb: 4, textAlign: 'center' }}>
                <Typography variant="h4" sx={{ mb: 1, fontWeight: 800 }}>
                    Welcome Back
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Enter your details to sign in
                </Typography>
            </Box>

            {loginMutation.isError && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    Invalid email or password. Please try again.
                </Alert>
            )}

            <form onSubmit={handleSubmit(onSubmit)}>
                <Stack spacing={3}>
                    <TextField
                        fullWidth
                        label="Username"
                        placeholder="testuser"
                        variant="outlined"
                        {...register('username')}
                        error={!!errors.username}
                        helperText={errors.username?.message}
                    />
                    <TextField
                        fullWidth
                        label="Password"
                        type="password"
                        placeholder="••••••••"
                        variant="outlined"
                        {...register('password')}
                        error={!!errors.password}
                        helperText={errors.password?.message}
                    />

                    <Button
                        type="submit"
                        variant="contained"
                        size="large"
                        fullWidth
                        disableElevation
                        disabled={loginMutation.isPending}
                        sx={{ py: 1.5 }}
                    >
                        {loginMutation.isPending ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
                    </Button>

                    <Box sx={{ textAlign: 'center', mt: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                            Don't have an account?{' '}
                            <MuiLink
                                component={Link}
                                to="/register"
                                sx={{
                                    fontWeight: 600,
                                    textDecoration: 'none',
                                    color: 'primary.main'
                                }}
                            >
                                Sign Up
                            </MuiLink>
                        </Typography>
                    </Box>
                </Stack>
            </form>
        </Paper>
    );
};

export default LoginPage;
