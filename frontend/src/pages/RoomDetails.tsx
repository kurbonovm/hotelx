import React, { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Card,
  CardMedia,
  Button,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  TextField,
  Alert,
  useTheme,
} from '@mui/material';
import { CheckCircle, People, AspectRatio, Stairs, ArrowBack } from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useGetRoomByIdQuery } from '../features/rooms/roomsApi';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated } from '../features/auth/authSlice';
import Loading from '../components/Loading';

/**
 * Room details page component
 */
const RoomDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const isAuthenticated = useSelector(selectIsAuthenticated);

  const { data: room, isLoading, error } = useGetRoomByIdQuery(id!);

  const [checkInDate, setCheckInDate] = useState<Date | null>(null);
  const [checkOutDate, setCheckOutDate] = useState<Date | null>(null);
  const [guests, setGuests] = useState<number>(1);
  const [selectedImage, setSelectedImage] = useState<string>('');

  const handleBookNow = () => {
    // Format dates to ISO string for backend (timezone-neutral)
    const formatDate = (date: Date | null): string => {
      if (!date) return '';
      // Use toISOString and extract just the date part to avoid timezone issues
      const d = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
      return d.toISOString().split('T')[0];
    };

    const bookingState = {
      room,
      checkInDate: formatDate(checkInDate),
      checkOutDate: formatDate(checkOutDate),
      guests,
    };

    if (!isAuthenticated) {
      // Store booking data in sessionStorage to preserve it across login
      sessionStorage.setItem('pendingBooking', JSON.stringify(bookingState));
      console.log('Saved pending booking to sessionStorage:', bookingState);

      // Redirect to login with the current page as the return destination
      navigate('/login', {
        state: { from: location },
      });
      return;
    }

    navigate('/booking', {
      state: bookingState,
    });
  };

  if (isLoading) return <Loading message="Loading room details..." />;

  if (error) {
    return (
      <Container>
        <Alert severity="error">Failed to load room details. Please try again.</Alert>
      </Container>
    );
  }

  if (!room) {
    return (
      <Container>
        <Alert severity="error">Room not found.</Alert>
      </Container>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        py: { xs: 2, md: 3 },
      }}
    >
      <Container maxWidth="lg">
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/rooms')}
          sx={{
            mb: 2,
            color: isDarkMode ? '#FFD700' : 'primary.main',
            '&:hover': {
              backgroundColor: isDarkMode ? 'rgba(255,215,0,0.1)' : 'rgba(25,118,210,0.1)',
            },
          }}
        >
          Back to Rooms
        </Button>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1.3fr 1fr' }, gap: 3 }}>
          <Box>
            <Box
              sx={{
                borderRadius: 2,
                overflow: 'hidden',
                border: isDarkMode ? '1px solid rgba(255,215,0,0.2)' : '1px solid',
                borderColor: isDarkMode ? 'rgba(255,215,0,0.2)' : 'divider',
                mb: 1.5,
              }}
            >
              <CardMedia
                component="img"
                height="360"
                image={
                  selectedImage ||
                  room.imageUrl ||
                  'https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=1200'
                }
                alt={room.name}
                sx={{ objectFit: 'cover' }}
              />
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1 }}>
              {/* Main image thumbnail */}
              <Box>
                <CardMedia
                  component="img"
                  height="90"
                  image={room.imageUrl || 'https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=400'}
                  alt={room.name}
                  sx={{
                    borderRadius: 1.5,
                    cursor: 'pointer',
                    border:
                      !selectedImage || selectedImage === room.imageUrl
                        ? '2px solid #FFD700'
                        : '2px solid rgba(255,215,0,0.2)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      opacity: 0.8,
                      transform: 'scale(1.05)',
                      borderColor: '#FFD700',
                    },
                    objectFit: 'cover',
                  }}
                  onClick={() => setSelectedImage(room.imageUrl || '')}
                />
              </Box>

              {/* Additional images thumbnails */}
              {room.additionalImages &&
                room.additionalImages.map((img, index) => (
                  <Box key={index}>
                    <CardMedia
                      component="img"
                      height="90"
                      image={img}
                      alt={`${room.name} ${index + 1}`}
                      sx={{
                        borderRadius: 1.5,
                        cursor: 'pointer',
                        border:
                          selectedImage === img ? '2px solid #FFD700' : '2px solid rgba(255,215,0,0.2)',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          opacity: 0.8,
                          transform: 'scale(1.05)',
                          borderColor: '#FFD700',
                        },
                        objectFit: 'cover',
                      }}
                      onClick={() => setSelectedImage(img)}
                    />
                  </Box>
                ))}
            </Box>
          </Box>

          <Box>
            <Card
              sx={{
                p: 2.5,
                bgcolor: isDarkMode ? 'rgba(26,26,26,0.95)' : 'background.paper',
                border: '1px solid',
                borderColor: isDarkMode ? 'rgba(255,215,0,0.2)' : 'divider',
                borderRadius: 2,
                backdropFilter: isDarkMode ? 'blur(10px)' : 'none',
                boxShadow: isDarkMode ? 'none' : 2,
              }}
            >
              <Typography
                variant="h4"
                sx={{
                  color: isDarkMode ? '#FFD700' : 'primary.main',
                  fontWeight: 700,
                  mb: 1.5,
                }}
              >
                {room.name}
              </Typography>

              <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip
                  label={room.type}
                  sx={{
                    backgroundColor: isDarkMode ? 'rgba(255,215,0,0.1)' : 'rgba(25,118,210,0.1)',
                    color: isDarkMode ? '#FFD700' : 'primary.main',
                    border: isDarkMode ? '1px solid rgba(255,215,0,0.3)' : '1px solid rgba(25,118,210,0.3)',
                    borderRadius: '16px',
                    height: '26px',
                    fontSize: '0.8rem',
                    fontWeight: 500,
                  }}
                />
                {room.available ? (
                  <Chip label="Available" color="success" sx={{ borderRadius: '16px', height: '26px', fontSize: '0.8rem' }} />
                ) : (
                  <Chip label="Not Available" color="error" sx={{ borderRadius: '16px', height: '26px', fontSize: '0.8rem' }} />
                )}
              </Box>

              <Typography
                variant="h5"
                sx={{
                  color: isDarkMode ? '#FFD700' : 'primary.main',
                  fontWeight: 600,
                  mb: 2,
                }}
              >
                ${room.pricePerNight}
                <Typography component="span" variant="body2" sx={{ color: isDarkMode ? 'rgba(255,255,255,0.6)' : 'text.secondary' }}>
                  {' '}/ night
                </Typography>
              </Typography>

              <Typography
                variant="body2"
                sx={{
                  color: isDarkMode ? 'rgba(255,255,255,0.8)' : 'text.primary',
                  mb: 2,
                  lineHeight: 1.4,
                }}
              >
                {room.description}
              </Typography>

              <Box sx={{ mb: 2, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <People sx={{ color: isDarkMode ? '#FFD700' : 'primary.main', fontSize: '1.1rem' }} />
                  <Typography variant="caption" sx={{ color: isDarkMode ? 'rgba(255,255,255,0.9)' : 'text.primary' }}>
                    {room.capacity} guests
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <AspectRatio sx={{ color: isDarkMode ? '#FFD700' : 'primary.main', fontSize: '1.1rem' }} />
                  <Typography variant="caption" sx={{ color: isDarkMode ? 'rgba(255,255,255,0.9)' : 'text.primary' }}>
                    {room.size} sq ft
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Stairs sx={{ color: isDarkMode ? '#FFD700' : 'primary.main', fontSize: '1.1rem' }} />
                  <Typography variant="caption" sx={{ color: isDarkMode ? 'rgba(255,255,255,0.9)' : 'text.primary' }}>
                    Floor {room.floorNumber}
                  </Typography>
                </Box>
              </Box>

              <Typography variant="subtitle2" sx={{ color: isDarkMode ? '#FFD700' : 'primary.main', fontWeight: 600, mb: 1 }}>
                Amenities
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 2.5 }}>
                {room.amenities?.map((amenity, index) => (
                  <Chip
                    key={index}
                    icon={<CheckCircle sx={{ color: isDarkMode ? '#FFD700 !important' : 'primary.main', fontSize: '0.9rem !important' }} />}
                    label={amenity}
                    sx={{
                      backgroundColor: isDarkMode ? 'rgba(255,215,0,0.1)' : 'rgba(25,118,210,0.1)',
                      color: isDarkMode ? 'rgba(255,255,255,0.9)' : 'text.primary',
                      border: isDarkMode ? '1px solid rgba(255,215,0,0.3)' : '1px solid rgba(25,118,210,0.3)',
                      borderRadius: '12px',
                      height: '24px',
                      fontSize: '0.75rem',
                      fontWeight: 500,
                    }}
                    size="small"
                  />
                ))}
              </Box>

              <Box component="form" sx={{ mt: 2 }}>
                <Typography variant="subtitle2" sx={{ color: isDarkMode ? '#FFD700' : 'primary.main', fontWeight: 600, mb: 1.5 }}>
                  Select Your Stay
                </Typography>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 1.5, mb: 2 }}>
                    <Box>
                      <DatePicker
                        label="Check-in"
                        value={checkInDate}
                        onChange={(newValue) => setCheckInDate(newValue)}
                        minDate={new Date()}
                        format="MM/dd/yyyy"
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            InputProps: {
                              style: { color: isDarkMode ? '#fff' : undefined },
                            },
                            inputProps: {
                              style: { color: isDarkMode ? '#fff' : undefined },
                            },
                            sx: isDarkMode ? {
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
                              '& input': {
                                color: '#fff !important',
                              },
                              '& .MuiInputLabel-root': {
                                color: 'rgba(255,255,255,0.7)',
                                '&.Mui-focused': {
                                  color: '#FFD700',
                                },
                              },
                              '& .MuiIconButton-root': {
                                color: '#FFD700',
                              },
                            } : {},
                          },
                          popper: {
                            sx: isDarkMode ? {
                              '& .MuiPaper-root': {
                                bgcolor: '#1a1a1a',
                                border: '1px solid rgba(255,215,0,0.2)',
                                color: '#fff',
                              },
                              '& .MuiPickersDay-root': {
                                color: '#fff',
                                '&:hover': {
                                  bgcolor: 'rgba(255,215,0,0.1)',
                                },
                                '&.Mui-selected': {
                                  bgcolor: '#FFD700 !important',
                                  color: '#000',
                                  '&:hover': {
                                    bgcolor: '#FFA500 !important',
                                  },
                                },
                                '&.Mui-disabled': {
                                  color: 'rgba(255,255,255,0.3)',
                                },
                              },
                              '& .MuiPickersCalendarHeader-label': {
                                color: '#FFD700',
                              },
                              '& .MuiPickersArrowSwitcher-button': {
                                color: '#FFD700',
                              },
                              '& .MuiDayCalendar-weekDayLabel': {
                                color: 'rgba(255,255,255,0.7)',
                              },
                            } : {},
                          },
                        }}
                      />
                    </Box>
                    <Box>
                      <DatePicker
                        label="Check-out"
                        value={checkOutDate}
                        onChange={(newValue) => setCheckOutDate(newValue)}
                        minDate={
                          checkInDate ? new Date(checkInDate.getTime() + 86400000) : new Date()
                        }
                        disabled={!checkInDate}
                        format="MM/dd/yyyy"
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            InputProps: {
                              style: { color: isDarkMode ? '#fff' : undefined },
                            },
                            inputProps: {
                              style: { color: isDarkMode ? '#fff' : undefined },
                            },
                            sx: isDarkMode ? {
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
                                '&.Mui-disabled': {
                                  '& fieldset': {
                                    borderColor: 'rgba(255,215,0,0.2)',
                                  },
                                },
                              },
                              '& input': {
                                color: '#fff !important',
                              },
                              '& .MuiInputLabel-root': {
                                color: 'rgba(255,255,255,0.7)',
                                '&.Mui-focused': {
                                  color: '#FFD700',
                                },
                                '&.Mui-disabled': {
                                  color: 'rgba(255,255,255,0.4)',
                                },
                              },
                              '& .MuiIconButton-root': {
                                color: '#FFD700',
                              },
                            } : {},
                          },
                          popper: {
                            sx: isDarkMode ? {
                              '& .MuiPaper-root': {
                                bgcolor: '#1a1a1a',
                                border: '1px solid rgba(255,215,0,0.2)',
                                color: '#fff',
                              },
                              '& .MuiPickersDay-root': {
                                color: '#fff',
                                '&:hover': {
                                  bgcolor: 'rgba(255,215,0,0.1)',
                                },
                                '&.Mui-selected': {
                                  bgcolor: '#FFD700 !important',
                                  color: '#000',
                                  '&:hover': {
                                    bgcolor: '#FFA500 !important',
                                  },
                                },
                                '&.Mui-disabled': {
                                  color: 'rgba(255,255,255,0.3)',
                                },
                              },
                              '& .MuiPickersCalendarHeader-label': {
                                color: '#FFD700',
                              },
                              '& .MuiPickersArrowSwitcher-button': {
                                color: '#FFD700',
                              },
                              '& .MuiDayCalendar-weekDayLabel': {
                                color: 'rgba(255,255,255,0.7)',
                              },
                            } : {},
                          },
                        }}
                      />
                    </Box>
                    <Box>
                      <TextField
                        fullWidth
                        type="number"
                        label="Guests"
                        value={guests}
                        onChange={(e) => setGuests(parseInt(e.target.value))}
                        inputProps={{ min: 1, max: room.capacity }}
                        size="small"
                      />
                    </Box>
                  </Box>
                </LocalizationProvider>

                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleBookNow}
                  disabled={!room.available || !checkInDate || !checkOutDate}
                  sx={{
                    py: 1.25,
                    background: isDarkMode ? 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)' : 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
                    color: isDarkMode ? '#000' : '#fff',
                    fontWeight: 600,
                    fontSize: '1rem',
                    '&:hover': {
                      background: isDarkMode ? 'linear-gradient(135deg, #FFA500 0%, #FFD700 100%)' : 'linear-gradient(135deg, #42a5f5 0%, #1976d2 100%)',
                      transform: 'translateY(-2px)',
                      boxShadow: isDarkMode ? '0 6px 16px rgba(255,215,0,0.3)' : '0 6px 16px rgba(25,118,210,0.3)',
                    },
                    transition: 'all 0.3s ease',
                    '&.Mui-disabled': {
                      background: isDarkMode ? 'rgba(255,215,0,0.3)' : 'rgba(25,118,210,0.3)',
                      color: 'rgba(0,0,0,0.5)',
                    },
                  }}
                >
                  {isAuthenticated ? 'Book Now' : 'Login to Book'}
                </Button>
              </Box>
            </Card>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default RoomDetails;
