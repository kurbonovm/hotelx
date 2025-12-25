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
  useTheme,
} from '@mui/material';
import { Google as GoogleIcon, AccountCircle as OktaIcon } from '@mui/icons-material';
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
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
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
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        backgroundImage: 'url(https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=2000)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: isDarkMode ? 'linear-gradient(135deg, rgba(0,0,0,0.7) 0%, rgba(26,26,26,0.8) 100%)' : 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(240,240,240,0.95) 100%)',
        },
      }}
    >
      <Container component="main" maxWidth="sm">
        <Paper
          elevation={24}
          sx={{
            position: 'relative',
            p: { xs: 3, sm: 5 },
            background: isDarkMode ? 'linear-gradient(135deg, rgba(26,26,26,0.95) 0%, rgba(0,0,0,0.98) 100%)' : 'linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(250,250,250,0.95) 100%)',
            backdropFilter: 'blur(20px)',
            border: '1px solid',
            borderColor: isDarkMode ? 'rgba(255,215,0,0.2)' : 'divider',
            borderRadius: 3,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <Typography
              component="h1"
              variant="h3"
              gutterBottom
              sx={{
                background: isDarkMode ? 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)' : 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontWeight: 700,
                mb: 1,
              }}
            >
              Welcome Back
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: isDarkMode ? 'rgba(255,255,255,0.7)' : 'text.secondary',
                mb: 3,
                textAlign: 'center',
              }}
            >
              Sign in to access your luxury hotel experience
            </Typography>

            {error && (
              <Alert
                severity="error"
                sx={{
                  width: '100%',
                  mb: 3,
                  backgroundColor: 'rgba(211,47,47,0.1)',
                  color: '#ff6b6b',
                  border: '1px solid rgba(211,47,47,0.3)',
                }}
              >
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
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
                sx={{
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    color: isDarkMode ? '#fff' : 'text.primary',
                    '& fieldset': {
                      borderColor: isDarkMode ? 'rgba(255,215,0,0.3)' : 'rgba(0,0,0,0.23)',
                    },
                    '&:hover fieldset': {
                      borderColor: isDarkMode ? 'rgba(255,215,0,0.5)' : 'rgba(0,0,0,0.87)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: isDarkMode ? '#FFD700' : 'primary.main',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: isDarkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
                    '&.Mui-focused': {
                      color: isDarkMode ? '#FFD700' : 'primary.main',
                    },
                  },
                }}
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
                sx={{
                  mb: 3,
                  '& .MuiOutlinedInput-root': {
                    color: isDarkMode ? '#fff' : 'text.primary',
                    '& fieldset': {
                      borderColor: isDarkMode ? 'rgba(255,215,0,0.3)' : 'rgba(0,0,0,0.23)',
                    },
                    '&:hover fieldset': {
                      borderColor: isDarkMode ? 'rgba(255,215,0,0.5)' : 'rgba(0,0,0,0.87)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: isDarkMode ? '#FFD700' : 'primary.main',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: isDarkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
                    '&.Mui-focused': {
                      color: isDarkMode ? '#FFD700' : 'primary.main',
                    },
                  },
                }}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={isLoading}
                sx={{
                  py: 1.5,
                  mb: 2,
                  background: isDarkMode ? 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)' : 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
                  color: isDarkMode ? '#000' : '#fff',
                  fontWeight: 600,
                  fontSize: '1rem',
                  '&:hover': {
                    background: isDarkMode ? 'linear-gradient(135deg, #FFA500 0%, #FFD700 100%)' : 'linear-gradient(135deg, #42a5f5 0%, #1976d2 100%)',
                    transform: 'translateY(-2px)',
                    boxShadow: isDarkMode ? '0 8px 20px rgba(255,215,0,0.3)' : '0 8px 20px rgba(25,118,210,0.3)',
                  },
                  transition: 'all 0.3s ease',
                  '&.Mui-disabled': {
                    background: isDarkMode ? 'rgba(255,215,0,0.3)' : 'rgba(25,118,210,0.3)',
                    color: isDarkMode ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.5)',
                  },
                }}
              >
                {isLoading ? 'Signing In...' : 'Sign In'}
              </Button>

              <Divider
                sx={{
                  my: 3,
                  color: isDarkMode ? 'rgba(255,255,255,0.5)' : 'text.secondary',
                  '&::before, &::after': {
                    borderColor: isDarkMode ? 'rgba(255,215,0,0.3)' : 'divider',
                  },
                }}
              >
                OR
              </Divider>

              <Button
                fullWidth
                variant="outlined"
                startIcon={<GoogleIcon />}
                onClick={() => handleOAuth2Login('google')}
                sx={{
                  py: 1.5,
                  mb: 2,
                  color: isDarkMode ? '#fff' : 'text.primary',
                  borderColor: isDarkMode ? 'rgba(255,215,0,0.3)' : 'divider',
                  '&:hover': {
                    borderColor: isDarkMode ? '#FFD700' : 'primary.main',
                    backgroundColor: isDarkMode ? 'rgba(255,215,0,0.1)' : 'rgba(25,118,210,0.05)',
                    transform: 'translateY(-2px)',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                Continue with Google
              </Button>

              <Button
                fullWidth
                variant="outlined"
                startIcon={<OktaIcon />}
                onClick={() => handleOAuth2Login('okta')}
                sx={{
                  py: 1.5,
                  mb: 3,
                  color: isDarkMode ? '#fff' : 'text.primary',
                  borderColor: isDarkMode ? 'rgba(255,215,0,0.3)' : 'divider',
                  '&:hover': {
                    borderColor: isDarkMode ? '#FFD700' : 'primary.main',
                    backgroundColor: isDarkMode ? 'rgba(255,215,0,0.1)' : 'rgba(25,118,210,0.05)',
                    transform: 'translateY(-2px)',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                Continue with Okta
              </Button>

              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Link
                  component={RouterLink}
                  to="/register"
                  variant="body2"
                  sx={{
                    color: isDarkMode ? 'rgba(255,255,255,0.7)' : 'text.secondary',
                    textDecoration: 'none',
                    '&:hover': {
                      color: isDarkMode ? '#FFD700' : 'primary.main',
                    },
                    transition: 'color 0.3s ease',
                  }}
                >
                  Don't have an account? Sign Up
                </Link>
              </Box>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Login;
