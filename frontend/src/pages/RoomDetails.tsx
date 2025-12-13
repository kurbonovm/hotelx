import React, { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Grid,
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
} from '@mui/material';
import { CheckCircle, People, AspectRatio, Stairs } from '@mui/icons-material';
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
      // Redirect to login with the current page as the return destination
      navigate('/login', {
        state: { from: location },
      });
      // Store booking data in sessionStorage to preserve it across login
      sessionStorage.setItem('pendingBooking', JSON.stringify(bookingState));
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
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Grid container spacing={4}>
          <Grid size={{ xs: 12, md: 7 }}>
            <CardMedia
              component="img"
              height="400"
              image={
                selectedImage ||
                room.imageUrl ||
                'https://via.placeholder.com/600x400?text=Room+Image'
              }
              alt={room.name}
              sx={{ borderRadius: 2, mb: 2, objectFit: 'cover' }}
            />

            <Grid container spacing={1}>
              {/* Main image thumbnail */}
              <Grid size={{ xs: 4 }}>
                <CardMedia
                  component="img"
                  height="120"
                  image={room.imageUrl || 'https://via.placeholder.com/200x120?text=Room'}
                  alt={room.name}
                  sx={{
                    borderRadius: 1,
                    cursor: 'pointer',
                    border:
                      !selectedImage || selectedImage === room.imageUrl
                        ? '3px solid #1976d2'
                        : '3px solid transparent',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      opacity: 0.8,
                      transform: 'scale(1.05)',
                    },
                    objectFit: 'cover',
                  }}
                  onClick={() => setSelectedImage(room.imageUrl || '')}
                />
              </Grid>

              {/* Additional images thumbnails */}
              {room.additionalImages &&
                room.additionalImages.map((img, index) => (
                  <Grid size={{ xs: 4 }} key={index}>
                    <CardMedia
                      component="img"
                      height="120"
                      image={img}
                      alt={`${room.name} ${index + 1}`}
                      sx={{
                        borderRadius: 1,
                        cursor: 'pointer',
                        border:
                          selectedImage === img ? '3px solid #1976d2' : '3px solid transparent',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          opacity: 0.8,
                          transform: 'scale(1.05)',
                        },
                        objectFit: 'cover',
                      }}
                      onClick={() => setSelectedImage(img)}
                    />
                  </Grid>
                ))}
            </Grid>
          </Grid>

          <Grid size={{ xs: 12, md: 5 }}>
            <Card sx={{ p: 3 }}>
              <Typography variant="h4" gutterBottom>
                {room.name}
              </Typography>

              <Box sx={{ mb: 2 }}>
                <Chip label={room.type} color="primary" sx={{ mr: 1 }} />
                {room.available ? (
                  <Chip label="Available" color="success" />
                ) : (
                  <Chip label="Not Available" color="error" />
                )}
              </Box>

              <Typography variant="h5" color="primary" gutterBottom>
                ${room.pricePerNight} / night
              </Typography>

              <Typography variant="body1" color="text.secondary" paragraph>
                {room.description}
              </Typography>

              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <People />
                  </ListItemIcon>
                  <ListItemText primary={`Capacity: ${room.capacity} guests`} />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <AspectRatio />
                  </ListItemIcon>
                  <ListItemText primary={`Size: ${room.size} sq ft`} />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Stairs />
                  </ListItemIcon>
                  <ListItemText primary={`Floor: ${room.floorNumber}`} />
                </ListItem>
              </List>

              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Amenities
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
                {room.amenities?.map((amenity, index) => (
                  <Chip
                    key={index}
                    icon={<CheckCircle />}
                    label={amenity}
                    variant="outlined"
                    size="small"
                  />
                ))}
              </Box>

              <Box component="form" sx={{ mt: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Select Your Stay
                </Typography>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <DatePicker
                        label="Check-in Date"
                        value={checkInDate}
                        onChange={(newValue) => setCheckInDate(newValue)}
                        minDate={new Date()}
                        format="MM/dd/yyyy"
                        slotProps={{
                          textField: {
                            fullWidth: true,
                          },
                        }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <DatePicker
                        label="Check-out Date"
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
                          },
                        }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Number of Guests"
                        value={guests}
                        onChange={(e) => setGuests(parseInt(e.target.value))}
                        inputProps={{ min: 1, max: room.capacity }}
                      />
                    </Grid>
                  </Grid>
                </LocalizationProvider>

                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={handleBookNow}
                  disabled={!room.available || !checkInDate || !checkOutDate}
                >
                  {isAuthenticated ? 'Book Now' : 'Login to Book'}
                </Button>
              </Box>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default RoomDetails;
