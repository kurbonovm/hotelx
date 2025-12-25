import React from 'react';
import { Box, Container, Typography, Button, Card, CardContent, Stack, Chip, alpha, useTheme } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Hotel,
  EventAvailable,
  Payment,
  Security,
  Star,
  CheckCircle,
  ArrowForward,
  Wifi,
  LocalParking,
  FitnessCenter,
  Restaurant
} from '@mui/icons-material';
import { selectIsAuthenticated } from '../features/auth/authSlice';

interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
}

interface Amenity {
  icon: React.ReactNode;
  title: string;
}

/**
 * Home page component with luxury hotel design
 */
const Home: React.FC = () => {
  const navigate = useNavigate();
  const isAuthenticated = useSelector(selectIsAuthenticated);

  const features: Feature[] = [
    {
      icon: <Hotel sx={{ fontSize: 50 }} />,
      title: 'Luxury Suites',
      description: 'Experience world-class comfort in our premium accommodations with breathtaking city views.',
    },
    {
      icon: <EventAvailable sx={{ fontSize: 50 }} />,
      title: 'Instant Booking',
      description: 'Reserve your room instantly with real-time availability and immediate confirmation.',
    },
    {
      icon: <Payment sx={{ fontSize: 50 }} />,
      title: 'Secure Payments',
      description: 'Bank-level security with Stripe integration for safe and hassle-free transactions.',
    },
    {
      icon: <Security sx={{ fontSize: 50 }} />,
      title: 'Privacy First',
      description: 'Your data is protected with OAuth2 authentication and enterprise-grade security.',
    },
  ];

  const amenities: Amenity[] = [
    { icon: <Wifi />, title: 'Free WiFi' },
    { icon: <LocalParking />, title: 'Free Parking' },
    { icon: <FitnessCenter />, title: 'Fitness Center' },
    { icon: <Restaurant />, title: 'Fine Dining' },
  ];

  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  return (
    <Box>
      {/* Hero Section with Hotel Image */}
      <Box
        sx={{
          position: 'relative',
          height: { xs: '600px', md: '700px' },
          backgroundImage: 'url(https://images.unsplash.com/photo-1618773928121-c32242e63f39?q=80&w=2000)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: { xs: 'scroll', md: 'fixed' },
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(to right, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.4) 100%)',
          },
        }}
      >
        <Container
          maxWidth="lg"
          sx={{
            position: 'relative',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            zIndex: 1,
          }}
        >
          <Box sx={{ maxWidth: '650px', color: 'white' }}>
            <Chip
              icon={<Star sx={{ color: '#ffc107 !important' }} />}
              label="5-Star Luxury Experience"
              sx={{
                bgcolor: alpha('#fff', 0.15),
                backdropFilter: 'blur(10px)',
                color: 'white',
                fontWeight: 600,
                mb: 3,
                border: '1px solid rgba(255,255,255,0.2)',
              }}
            />

            <Typography
              variant="h1"
              sx={{
                fontWeight: 900,
                fontSize: { xs: '3rem', sm: '4rem', md: '5.5rem' },
                mb: 3,
                lineHeight: 1.1,
                textShadow: '0 4px 30px rgba(0,0,0,0.5)',
                letterSpacing: '-0.02em',
              }}
            >
              Welcome to
              <br />
              <Box
                component="span"
                sx={{
                  background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                HotelX
              </Box>
            </Typography>

            <Typography
              variant="h5"
              sx={{
                mb: 5,
                lineHeight: 1.6,
                fontWeight: 300,
                textShadow: '0 2px 20px rgba(0,0,0,0.5)',
                maxWidth: '550px',
              }}
            >
              Where luxury meets comfort. Experience unparalleled hospitality in the heart of the city.
            </Typography>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Button
                variant="contained"
                size="large"
                endIcon={<ArrowForward />}
                onClick={() => navigate('/rooms')}
                sx={{
                  bgcolor: '#FFD700',
                  color: '#000',
                  px: 5,
                  py: 2,
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  borderRadius: 2,
                  textTransform: 'none',
                  boxShadow: '0 10px 40px rgba(255, 215, 0, 0.4)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    bgcolor: '#FFC700',
                    transform: 'translateY(-3px)',
                    boxShadow: '0 15px 50px rgba(255, 215, 0, 0.5)',
                  },
                }}
              >
                Explore Rooms
              </Button>

              {!isAuthenticated && (
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => navigate('/register')}
                  sx={{
                    color: 'white',
                    borderColor: 'white',
                    borderWidth: 2,
                    px: 5,
                    py: 2,
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    borderRadius: 2,
                    textTransform: 'none',
                    backdropFilter: 'blur(10px)',
                    bgcolor: alpha('#fff', 0.1),
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      borderColor: 'white',
                      borderWidth: 2,
                      bgcolor: alpha('#fff', 0.2),
                      transform: 'translateY(-3px)',
                    },
                  }}
                >
                  Get Started
                </Button>
              )}
            </Stack>

            {/* Amenities Row */}
            <Box
              sx={{
                mt: 6,
                display: 'flex',
                flexWrap: 'wrap',
                gap: 2,
                alignItems: 'center',
              }}
            >
              {amenities.map((amenity, index) => (
                <Box
                  key={index}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    bgcolor: alpha('#fff', 0.15),
                    backdropFilter: 'blur(10px)',
                    px: 2,
                    py: 1,
                    borderRadius: 2,
                    border: '1px solid rgba(255,255,255,0.2)',
                  }}
                >
                  {amenity.icon}
                  <Typography sx={{ fontWeight: 500, fontSize: '0.95rem', whiteSpace: 'nowrap' }}>
                    {amenity.title}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Stats Section */}
      <Box sx={{ bgcolor: '#1a1a1a', color: 'white', py: 6 }}>
        <Container maxWidth="lg">
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: 'repeat(2, 1fr)',
                md: 'repeat(4, 1fr)',
              },
              gap: 4,
              textAlign: 'center',
            }}
          >
            {[
              { value: '15K+', label: 'Happy Guests' },
              { value: '800+', label: 'Premium Rooms' },
              { value: '95+', label: 'Global Cities' },
              { value: '4.9/5', label: 'Guest Rating' },
            ].map((stat, index) => (
              <Box key={index}>
                <Typography
                  variant="h2"
                  sx={{
                    fontWeight: 900,
                    fontSize: { xs: '2.5rem', md: '3.5rem' },
                    background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    mb: 1,
                  }}
                >
                  {stat.value}
                </Typography>
                <Typography variant="body1" sx={{ color: '#999', fontWeight: 500 }}>
                  {stat.label}
                </Typography>
              </Box>
            ))}
          </Box>
        </Container>
      </Box>

      {/* Features Section */}
      <Box
        sx={{
          position: 'relative',
          py: { xs: 8, md: 12 },
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: 'url(https://images.unsplash.com/photo-1631049307264-da0ec9d70304?q=80&w=2000)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: { xs: 'scroll', md: 'fixed' },
            opacity: 0.08,
            zIndex: 0,
          },
        }}
      >
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Stack spacing={2} alignItems="center" textAlign="center" sx={{ mb: 8 }}>
            <Typography
              variant="overline"
              sx={{
                color: '#FFA500',
                fontWeight: 700,
                fontSize: '1rem',
                letterSpacing: 2,
              }}
            >
              WHY CHOOSE US
            </Typography>
            <Typography
              variant="h2"
              sx={{
                fontWeight: 900,
                fontSize: { xs: '2.5rem', md: '4rem' },
                color: isDarkMode ? '#fff' : '#1a1a1a',
                mb: 2,
              }}
            >
              Exceptional Hospitality
            </Typography>
            <Typography
              variant="h6"
              sx={{
                color: isDarkMode ? 'rgba(255,255,255,0.7)' : '#666',
                maxWidth: '700px',
                fontWeight: 400,
                lineHeight: 1.8,
              }}
            >
              We go above and beyond to ensure your stay is nothing short of extraordinary
            </Typography>
          </Stack>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(4, 1fr)',
            },
            gap: { xs: 2, sm: 3, md: 4 },
          }}
        >
          {features.map((feature, index) => (
            <Card
              key={index}
              elevation={0}
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 3,
                border: isDarkMode ? '1px solid rgba(255,215,0,0.2)' : '1px solid #e0e0e0',
                bgcolor: isDarkMode ? 'rgba(26,26,26,0.8)' : 'white',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '4px',
                  background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                  transform: 'scaleX(0)',
                  transition: 'transform 0.4s ease',
                },
                '&:hover': {
                  transform: { xs: 'translateY(-8px)', md: 'translateY(-15px)' },
                  boxShadow: isDarkMode ? '0 25px 50px rgba(255,215,0,0.2)' : '0 25px 50px rgba(0,0,0,0.1)',
                  borderColor: '#FFD700',
                  '&::before': {
                    transform: 'scaleX(1)',
                  },
                },
              }}
            >
              <CardContent sx={{
                p: { xs: 3, md: 4 },
                textAlign: 'center',
                flexGrow: 1,
                display: 'flex',
                flexDirection: 'column'
              }}>
                <Box
                  sx={{
                    width: { xs: 70, sm: 80, md: 90 },
                    height: { xs: 70, sm: 80, md: 90 },
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: { xs: '0 auto 16px', md: '0 auto 24px' },
                    color: 'white',
                    boxShadow: '0 15px 35px rgba(255, 215, 0, 0.3)',
                    '& svg': {
                      fontSize: { xs: 40, sm: 45, md: 50 },
                    },
                  }}
                >
                  {feature.icon}
                </Box>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 700,
                    color: isDarkMode ? '#FFD700' : '#1a1a1a',
                    mb: { xs: 1.5, md: 2 },
                    fontSize: { xs: '1.25rem', sm: '1.4rem', md: '1.5rem' },
                  }}
                >
                  {feature.title}
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    color: isDarkMode ? 'rgba(255,255,255,0.7)' : '#666',
                    lineHeight: 1.8,
                    flexGrow: 1,
                    fontSize: { xs: '0.95rem', md: '1rem' },
                  }}
                >
                  {feature.description}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
        </Container>
      </Box>

      {/* Gallery Section */}
      <Box sx={{ bgcolor: '#f8f9fa', py: { xs: 8, md: 12 } }}>
        <Container maxWidth="lg">
          <Typography
            variant="h2"
            textAlign="center"
            sx={{
              fontWeight: 900,
              fontSize: { xs: '2.5rem', md: '4rem' },
              mb: { xs: 4, md: 8 },
              color: '#1a1a1a',
            }}
          >
            Our Spaces
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(4, 1fr)',
              },
              gap: { xs: 2, sm: 2.5, md: 3 },
            }}
          >
            {[
              { img: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=800', title: 'Luxury Rooms' },
              { img: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=800', title: 'Spa & Wellness' },
              { img: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?q=80&w=800', title: 'Fine Dining' },
              { img: 'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?q=80&w=800', title: 'Pool & Lounge' },
            ].map((item, index) => (
              <Box
                key={index}
                sx={{
                  position: 'relative',
                  height: { xs: 250, sm: 280, md: 300 },
                  width: '100%',
                  borderRadius: 3,
                  overflow: 'hidden',
                  cursor: 'pointer',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: { xs: 'translateY(-4px)', md: 'translateY(-8px)' },
                    boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
                  },
                  '&:hover img': {
                    transform: 'scale(1.1)',
                  },
                  '&:hover .overlay': {
                    opacity: 1,
                  },
                }}
              >
                <Box
                  component="img"
                  src={item.img}
                  alt={item.title}
                  sx={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transition: 'transform 0.5s ease',
                    display: 'block',
                  }}
                />
                <Box
                  className="overlay"
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.2) 100%)',
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'center',
                    pb: { xs: 2, md: 3 },
                    opacity: { xs: 1, md: 0 },
                    transition: 'opacity 0.3s ease',
                  }}
                >
                  <Typography
                    variant="h5"
                    sx={{
                      color: 'white',
                      fontWeight: 700,
                      fontSize: { xs: '1.25rem', sm: '1.4rem', md: '1.5rem' },
                    }}
                  >
                    {item.title}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Container>
      </Box>

      {/* Call to Action Section with Image */}
      <Box
        sx={{
          position: 'relative',
          height: '500px',
          backgroundImage: 'url(https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=2000)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: { xs: 'scroll', md: 'fixed' },
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(135deg, rgba(255,215,0,0.85) 0%, rgba(255,165,0,0.85) 100%)',
          },
        }}
      >
        <Container
          maxWidth="md"
          sx={{
            position: 'relative',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1,
          }}
        >
          <Stack spacing={4} alignItems="center" textAlign="center">
            <Typography
              variant="h2"
              sx={{
                fontWeight: 900,
                fontSize: { xs: '2.5rem', md: '4rem' },
                color: '#1a1a1a',
              }}
            >
              Ready for an Unforgettable Stay?
            </Typography>
            <Typography
              variant="h6"
              sx={{
                maxWidth: '600px',
                color: '#1a1a1a',
                fontWeight: 500,
                lineHeight: 1.8,
              }}
            >
              Book now and experience world-class luxury, impeccable service, and memories that last a lifetime.
            </Typography>
            <Stack direction="row" spacing={3} alignItems="center" flexWrap="wrap" justifyContent="center">
              <Stack direction="row" spacing={1} alignItems="center">
                <CheckCircle sx={{ color: '#1a1a1a' }} />
                <Typography sx={{ fontWeight: 600, color: '#1a1a1a' }}>Best Price Guarantee</Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <CheckCircle sx={{ color: '#1a1a1a' }} />
                <Typography sx={{ fontWeight: 600, color: '#1a1a1a' }}>24/7 Support</Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <CheckCircle sx={{ color: '#1a1a1a' }} />
                <Typography sx={{ fontWeight: 600, color: '#1a1a1a' }}>Free Cancellation</Typography>
              </Stack>
            </Stack>
            <Button
              variant="contained"
              size="large"
              endIcon={<ArrowForward />}
              onClick={() => navigate('/rooms')}
              sx={{
                bgcolor: '#1a1a1a',
                color: 'white',
                px: 7,
                py: 2.5,
                fontSize: '1.2rem',
                fontWeight: 700,
                borderRadius: 2,
                textTransform: 'none',
                boxShadow: '0 15px 40px rgba(0,0,0,0.3)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  bgcolor: '#000',
                  transform: 'translateY(-5px)',
                  boxShadow: '0 20px 50px rgba(0,0,0,0.4)',
                },
              }}
            >
              Book Your Room Now
            </Button>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
};

export default Home;
