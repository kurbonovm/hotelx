import React from 'react';
import { Box, Container, Typography, Button, Grid, Card, CardContent } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Hotel, EventAvailable, Payment, Security } from '@mui/icons-material';
import { selectIsAuthenticated } from '../features/auth/authSlice';

interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
}

/**
 * Home page component
 */
const Home: React.FC = () => {
  const navigate = useNavigate();
  const isAuthenticated = useSelector(selectIsAuthenticated);

  const features: Feature[] = [
    {
      icon: <Hotel sx={{ fontSize: 60, color: 'primary.main' }} />,
      title: 'Browse Rooms',
      description: 'Explore our wide selection of comfortable and luxurious rooms.',
    },
    {
      icon: <EventAvailable sx={{ fontSize: 60, color: 'primary.main' }} />,
      title: 'Easy Booking',
      description: 'Book your stay in just a few clicks with real-time availability.',
    },
    {
      icon: <Payment sx={{ fontSize: 60, color: 'primary.main' }} />,
      title: 'Secure Payments',
      description: 'Safe and secure payment processing with Stripe integration.',
    },
    {
      icon: <Security sx={{ fontSize: 60, color: 'primary.main' }} />,
      title: 'Trusted Service',
      description: 'OAuth2 authentication for a secure and seamless experience.',
    },
  ];

  return (
    <Box>
      <Box
        sx={{
          bgcolor: 'primary.main',
          color: 'white',
          py: 8,
          px: 2,
          textAlign: 'center',
        }}
      >
        <Container maxWidth="md">
          <Typography variant="h2" component="h1" gutterBottom>
            Welcome to Hotel Reservation System
          </Typography>
          <Typography variant="h5" component="p" gutterBottom>
            Your perfect stay is just a click away
          </Typography>
          <Box sx={{ mt: 4 }}>
            <Button
              variant="contained"
              size="large"
              color="secondary"
              onClick={() => navigate('/rooms')}
              sx={{ mr: isAuthenticated ? 0 : 2 }}
            >
              Browse Rooms
            </Button>
            {!isAuthenticated && (
              <Button
                variant="outlined"
                size="large"
                sx={{ color: 'white', borderColor: 'white' }}
                onClick={() => navigate('/register')}
              >
                Get Started
              </Button>
            )}
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography variant="h3" component="h2" align="center" gutterBottom>
          Why Choose Us?
        </Typography>
        <Grid container spacing={4} sx={{ mt: 2 }}>
          {features.map((feature, index) => (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
              <Card sx={{ height: '100%', textAlign: 'center', p: 2 }}>
                <CardContent>
                  <Box sx={{ mb: 2 }}>{feature.icon}</Box>
                  <Typography variant="h6" component="h3" gutterBottom>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

export default Home;
