import React, { useState, useEffect } from 'react';
import { useNavigate, Link as RouterLink, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Link,
  Alert,
  Paper,
  Divider,
} from '@mui/material';
import { Google as GoogleIcon, Facebook as FacebookIcon } from '@mui/icons-material';
import { useLoginMutation } from '../features/auth/authApi';
import { setCredentials } from '../features/auth/authSlice';
import { LoginRequest } from '../types';

interface LocationState {
  error?: string;
  from?: {
    pathname: string;
    search?: string;
    hash?: string;
  };
}

/**
 * Login page component
 */
const Login: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const [login, { isLoading }] = useLoginMutation();

  const [formData, setFormData] = useState<LoginRequest>({
    email: '',
    password: '',
  });
  const [error, setError] = useState<string>('');

  // Check for OAuth2 errors from location state
  useEffect(() => {
    const state = location.state as LocationState;
    if (state?.error) {
      setError(state.error);
      // Clear the error from location state
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    try {
      const result = await login(formData).unwrap();
      dispatch(setCredentials(result));

      // Redirect to the page user was trying to access, or home
      const state = location.state as LocationState;
      const from = state?.from;
      const redirectTo = from ? `${from.pathname}${from.search || ''}${from.hash || ''}` : '/';
      navigate(redirectTo, { replace: true });
    } catch (err: any) {
      setError(err.data?.message || 'Failed to login. Please check your credentials.');
    }
  };

  const handleOAuth2Login = (provider: string) => {
    // Save the return URL to sessionStorage for OAuth2 redirect
    const state = location.state as LocationState;
    const from = state?.from;
    if (from) {
      const returnUrl = `${from.pathname}${from.search || ''}${from.hash || ''}`;
      sessionStorage.setItem('oauth2_redirect_url', returnUrl);
    }

    // Use Spring Security's default endpoint for OAuth2 login
    window.location.href = `${import.meta.env.VITE_API_URL.replace(/\/api$/, '')}/oauth2/authorization/${provider}`;
  };

  return (
    <Container component="main" maxWidth="xs">
      <Paper elevation={3} sx={{ mt: 8, p: 4 }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Typography component="h1" variant="h4" gutterBottom>
            Sign In
          </Typography>

          {error && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={formData.email}
              onChange={handleChange}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={isLoading}
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Button>

            <Divider sx={{ my: 2 }}>OR</Divider>

            <Button
              fullWidth
              variant="outlined"
              startIcon={<GoogleIcon />}
              onClick={() => handleOAuth2Login('google')}
              sx={{ mb: 1 }}
            >
              Sign in with Google
            </Button>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<FacebookIcon />}
              onClick={() => handleOAuth2Login('facebook')}
            >
              Sign in with Facebook
            </Button>

            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Link component={RouterLink} to="/register" variant="body2">
                Don't have an account? Sign Up
              </Link>
            </Box>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default Login;
