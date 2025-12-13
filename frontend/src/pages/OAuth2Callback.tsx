import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Box, CircularProgress, Alert, Container } from '@mui/material';
import { setCredentials } from '../features/auth/authSlice';

/**
 * OAuth2 callback handler page
 * Processes OAuth2 authentication response and redirects user
 */
const OAuth2Callback: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error) {
      // OAuth2 authentication failed
      console.error('OAuth2 authentication error:', error);
      // Redirect to login with error message
      navigate('/login', {
        state: { error: `Authentication failed: ${error}` },
        replace: true,
      });
      return;
    }

    if (token) {
      // OAuth2 authentication succeeded
      (async () => {
        try {
          // Fetch user info from backend using token
          const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/me`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          if (!response.ok) throw new Error('Failed to fetch user info');
          const user = await response.json();
          dispatch(setCredentials({ user, token }));

          // Check if there's a saved return URL
          const returnUrl = sessionStorage.getItem('oauth2_redirect_url');
          if (returnUrl) {
            sessionStorage.removeItem('oauth2_redirect_url');
            navigate(returnUrl, { replace: true });
          } else {
            navigate('/', { replace: true });
          }
        } catch (err) {
          console.error('Failed to process OAuth2 token:', err);
          navigate('/login', {
            state: { error: 'Failed to process authentication. Please try again.' },
            replace: true,
          });
        }
      })();
    } else {
      // No token or error - redirect to login
      navigate('/login', {
        state: { error: 'OAuth2 authentication was not completed.' },
        replace: true,
      });
    }
  }, [searchParams, navigate, dispatch]);

  return (
    <Container maxWidth="sm">
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        minHeight="60vh"
        gap={2}
      >
        <CircularProgress size={60} />
        <Alert severity="info">Processing authentication...</Alert>
      </Box>
    </Container>
  );
};

export default OAuth2Callback;
