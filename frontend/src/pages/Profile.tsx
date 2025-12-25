import React, { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Avatar,
  Alert,
  useTheme,
} from '@mui/material';
import { Person, Edit, Save } from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../features/auth/authSlice';
import { useUpdateProfileMutation } from '../features/auth/authApi';
import { UpdateProfileRequest } from '../types';

/**
 * User profile page component
 */
const Profile: React.FC = () => {
  const user = useSelector(selectCurrentUser);
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const [updateProfile, { isLoading }] = useUpdateProfileMutation();

  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [formData, setFormData] = useState<UpdateProfileRequest>({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phoneNumber: user?.phoneNumber || '',
  });
  const [success, setSuccess] = useState<string>('');
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
    setSuccess('');

    try {
      await updateProfile(formData).unwrap();
      setSuccess('Profile updated successfully!');
      setIsEditing(false);
    } catch (err: any) {
      setError(err.data?.message || 'Failed to update profile');
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        py: { xs: 4, md: 6 },
      }}
    >
      <Container maxWidth="md">
        <Paper
          elevation={24}
          sx={{
            p: 4,
            bgcolor: isDarkMode ? 'rgba(26,26,26,0.95)' : 'background.paper',
            border: '1px solid',
            borderColor: isDarkMode ? 'rgba(255,215,0,0.2)' : 'divider',
            borderRadius: 3,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
            <Avatar
              sx={{
                width: 80,
                height: 80,
                background: isDarkMode ? 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)' : 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
              }}
              src={user?.avatar}
            >
              <Person sx={{ fontSize: 40, color: isDarkMode ? '#000' : '#fff' }} />
            </Avatar>
            <Box sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
              <Typography
                variant="h4"
                sx={{
                  color: isDarkMode ? '#FFD700' : 'primary.main',
                  fontWeight: 700,
                }}
              >
                {user?.firstName} {user?.lastName}
              </Typography>
              <Typography variant="body1" sx={{ color: isDarkMode ? 'rgba(255,255,255,0.8)' : 'text.primary' }}>
                {user?.email}
              </Typography>
              <Typography variant="body2" sx={{ color: isDarkMode ? 'rgba(255,255,255,0.6)' : 'text.secondary' }}>
                Role: {user?.roles?.join(', ')}
              </Typography>
            </Box>
          </Box>

          {success && (
            <Alert
              severity="success"
              sx={{
                mb: 2,
                backgroundColor: 'rgba(46,125,50,0.1)',
                color: '#66bb6a',
                border: '1px solid rgba(46,125,50,0.3)',
              }}
              onClose={() => setSuccess('')}
            >
              {success}
            </Alert>
          )}

          {error && (
            <Alert
              severity="error"
              sx={{
                mb: 2,
                backgroundColor: 'rgba(211,47,47,0.1)',
                color: '#ff6b6b',
                border: '1px solid rgba(211,47,47,0.3)',
              }}
              onClose={() => setError('')}
            >
              {error}
            </Alert>
          )}

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Typography variant="h5" sx={{ color: isDarkMode ? '#FFD700' : 'primary.main', fontWeight: 600 }}>
              Profile Information
            </Typography>
            {!isEditing ? (
              <Button
                variant="outlined"
                startIcon={<Edit />}
                onClick={() => setIsEditing(true)}
                sx={{
                  color: isDarkMode ? '#FFD700' : 'primary.main',
                  borderColor: isDarkMode ? 'rgba(255,215,0,0.3)' : 'divider',
                  '&:hover': {
                    borderColor: isDarkMode ? '#FFD700' : 'primary.main',
                    backgroundColor: isDarkMode ? 'rgba(255,215,0,0.1)' : 'rgba(25,118,210,0.05)',
                  },
                }}
              >
                Edit Profile
              </Button>
            ) : (
              <Button
                variant="outlined"
                onClick={() => {
                  setIsEditing(false);
                  setFormData({
                    firstName: user?.firstName || '',
                    lastName: user?.lastName || '',
                    phoneNumber: user?.phoneNumber || '',
                  });
                }}
                sx={{
                  color: isDarkMode ? 'rgba(255,255,255,0.7)' : 'text.secondary',
                  borderColor: isDarkMode ? 'rgba(255,255,255,0.3)' : 'divider',
                  '&:hover': {
                    borderColor: isDarkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.23)',
                    backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                  },
                }}
              >
                Cancel
              </Button>
            )}
          </Box>

          <Box component="form" onSubmit={handleSubmit}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <Box>
                <TextField
                  fullWidth
                  label="First Name"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  disabled={!isEditing}
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
                      '&.Mui-disabled': {
                        color: isDarkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.38)',
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
              <Box>
                <TextField
                  fullWidth
                  label="Last Name"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  disabled={!isEditing}
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
                      '&.Mui-disabled': {
                        color: isDarkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.38)',
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
              <Box sx={{ gridColumn: { xs: '1', sm: '1 / -1' } }}>
                <TextField
                  fullWidth
                  label="Email"
                  value={user?.email || ''}
                  disabled
                  helperText="Email cannot be changed"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      color: isDarkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.38)',
                      '& fieldset': {
                        borderColor: isDarkMode ? 'rgba(255,215,0,0.2)' : 'rgba(0,0,0,0.12)',
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: isDarkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.38)',
                    },
                    '& .MuiFormHelperText-root': {
                      color: isDarkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.6)',
                    },
                  }}
                />
              </Box>
              <Box sx={{ gridColumn: { xs: '1', sm: '1 / -1' } }}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  disabled={!isEditing}
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
                      '&.Mui-disabled': {
                        color: isDarkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.38)',
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
            </Box>

            {isEditing && (
              <Button
                type="submit"
                variant="contained"
                startIcon={<Save />}
                disabled={isLoading}
                sx={{
                  mt: 3,
                  py: 1.5,
                  background: isDarkMode ? 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)' : 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
                  color: isDarkMode ? '#000' : '#fff',
                  fontWeight: 600,
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
                {isLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            )}
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Profile;
