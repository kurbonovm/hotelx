import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
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
  useTheme,
} from '@mui/material';
import { useRegisterMutation } from '../features/auth/authApi';
import { setCredentials } from '../features/auth/authSlice';
import { RegisterRequest } from '../types';

/**
 * Register page component
 */
const Register: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const [register, { isLoading }] = useRegisterMutation();

  const [formData, setFormData] = useState<RegisterRequest>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phoneNumber: '',
  });
  const [error, setError] = useState<string>('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    // Validation
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    try {
      const result = await register(formData).unwrap();
      dispatch(setCredentials(result));
      navigate('/');
    } catch (err: any) {
      setError(err.data?.message || 'Failed to register. Please try again.');
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        backgroundImage: 'url(https://images.unsplash.com/photo-1571896349842-33c89424de2d?q=80&w=2000)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        py: 4,
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
              Join HotelX
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: isDarkMode ? 'rgba(255,255,255,0.7)' : 'text.secondary',
                mb: 3,
                textAlign: 'center',
              }}
            >
              Create an account to unlock exclusive luxury experiences
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
              <Box
                sx={{
                  display: 'flex',
                  gap: 2,
                  flexDirection: { xs: 'column', sm: 'row' },
                  mb: 2,
                }}
              >
                <TextField
                  required
                  fullWidth
                  id="firstName"
                  label="First Name"
                  name="firstName"
                  autoComplete="given-name"
                  autoFocus
                  value={formData.firstName}
                  onChange={handleChange}
                  sx={{
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
                  required
                  fullWidth
                  id="lastName"
                  label="Last Name"
                  name="lastName"
                  autoComplete="family-name"
                  value={formData.lastName}
                  onChange={handleChange}
                  sx={{
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
              </Box>
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                sx={{
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    color: '#fff',
                    '& fieldset': {
                      borderColor: 'rgba(255,215,0,0.3)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(255,215,0,0.5)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#FFD700',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: 'rgba(255,255,255,0.7)',
                    '&.Mui-focused': {
                      color: '#FFD700',
                    },
                  },
                }}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                id="phoneNumber"
                label="Phone Number"
                name="phoneNumber"
                autoComplete="tel"
                value={formData.phoneNumber}
                onChange={handleChange}
                sx={{
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    color: '#fff',
                    '& fieldset': {
                      borderColor: 'rgba(255,215,0,0.3)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(255,215,0,0.5)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#FFD700',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: 'rgba(255,255,255,0.7)',
                    '&.Mui-focused': {
                      color: '#FFD700',
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
                autoComplete="new-password"
                value={formData.password}
                onChange={handleChange}
                helperText="Must be at least 8 characters"
                sx={{
                  mb: 3,
                  '& .MuiOutlinedInput-root': {
                    color: '#fff',
                    '& fieldset': {
                      borderColor: 'rgba(255,215,0,0.3)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(255,215,0,0.5)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#FFD700',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: 'rgba(255,255,255,0.7)',
                    '&.Mui-focused': {
                      color: '#FFD700',
                    },
                  },
                  '& .MuiFormHelperText-root': {
                    color: isDarkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.6)',
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
                  mb: 3,
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
                {isLoading ? 'Creating Account...' : 'Sign Up'}
              </Button>

              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Link
                  component={RouterLink}
                  to="/login"
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
                  Already have an account? Sign In
                </Link>
              </Box>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Register;
