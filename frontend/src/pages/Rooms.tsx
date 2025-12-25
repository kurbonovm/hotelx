import React, { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Button,
  TextField,
  MenuItem,
  CircularProgress,
  Alert,
  Chip,
  Stack,
  useTheme,
} from '@mui/material';
import { Hotel as HotelIcon, People as PeopleIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useGetRoomsQuery } from '../features/rooms/roomsApi';
import { useGetAllReservationsAdminQuery } from '../features/admin/adminApi';
import { Room, RoomType } from '../types';

/**
 * Rooms page component to browse available rooms
 */
const Rooms: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const [filters, setFilters] = useState<{
    type?: string;
    minPrice?: string;
    maxPrice?: string;
  }>({
    type: '',
    minPrice: '',
    maxPrice: '',
  });

  // Build query params, converting strings to numbers and filtering out empty values
  const queryParams = {
    ...(filters.type && { type: filters.type as RoomType }),
    ...(filters.minPrice && { minPrice: parseFloat(filters.minPrice) }),
    ...(filters.maxPrice && { maxPrice: parseFloat(filters.maxPrice) }),
  };

  const { data: rooms, isLoading, error } = useGetRoomsQuery(
    Object.keys(queryParams).length > 0 ? queryParams : undefined
  );

  const { data: reservations } = useGetAllReservationsAdminQuery();

  // Count how many reservations exist for each room type
  const roomOccupancyCount = new Map<string, number>();
  reservations
    ?.filter(r => r.status === 'CONFIRMED' || r.status === 'CHECKED_IN')
    .forEach(r => {
      const count = roomOccupancyCount.get(r.room.id) || 0;
      roomOccupancyCount.set(r.room.id, count + 1);
    });

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value,
    });
  };

  const roomTypes: { value: string; label: string }[] = [
    { value: 'STANDARD', label: 'Standard' },
    { value: 'DELUXE', label: 'Deluxe' },
    { value: 'SUITE', label: 'Suite' },
    { value: 'PRESIDENTIAL', label: 'Presidential' },
  ];

  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '60vh',
          bgcolor: 'background.default',
        }}
      >
        <CircularProgress sx={{ color: isDarkMode ? '#FFD700' : 'primary.main' }} size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Container sx={{ py: 4 }}>
        <Alert
          severity="error"
          sx={{
            backgroundColor: 'rgba(211,47,47,0.1)',
            color: '#ff6b6b',
            border: '1px solid rgba(211,47,47,0.3)',
          }}
        >
          Failed to load rooms. Please try again later.
        </Alert>
      </Container>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        py: { xs: 4, md: 6 },
      }}
    >
      <Container maxWidth="lg">
        <Box sx={{ mb: { xs: 4, md: 6 }, textAlign: 'center' }}>
          <Typography
            variant="h2"
            component="h1"
            gutterBottom
            sx={{
              background: isDarkMode ? 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)' : 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: 700,
              mb: 2,
              fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
            }}
          >
            Our Luxury Rooms
          </Typography>
          <Typography
            variant="h6"
            sx={{
              color: isDarkMode ? 'rgba(255,255,255,0.7)' : 'text.secondary',
              maxWidth: '800px',
              mx: 'auto',
              fontSize: { xs: '1rem', sm: '1.15rem', md: '1.25rem' },
              px: { xs: 2, sm: 0 },
            }}
          >
            Experience unparalleled comfort and elegance in our carefully curated selection of rooms
          </Typography>
        </Box>

        <Box
          sx={{
            mb: { xs: 4, md: 6 },
            p: { xs: 2.5, sm: 3, md: 4 },
            bgcolor: isDarkMode ? 'rgba(26,26,26,0.8)' : 'background.paper',
            borderRadius: 3,
            border: isDarkMode ? '1px solid rgba(255,215,0,0.2)' : '1px solid',
            borderColor: isDarkMode ? 'rgba(255,215,0,0.2)' : 'divider',
            backdropFilter: isDarkMode ? 'blur(10px)' : 'none',
            boxShadow: isDarkMode ? 'none' : 1,
          }}
        >
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              fullWidth
              select
              label="Room Type"
              name="type"
              value={filters.type || ''}
              onChange={handleFilterChange}
              InputLabelProps={{
                shrink: true,
              }}
              SelectProps={{
                displayEmpty: true,
                renderValue: (selected) => {
                  if (!selected || selected === '') {
                    return 'All Types';
                  }
                  const selectedType = roomTypes.find(t => t.value === selected);
                  return selectedType ? selectedType.label : selected;
                },
                MenuProps: {
                  PaperProps: {
                    sx: {
                      maxHeight: 300,
                      bgcolor: isDarkMode ? '#1a1a1a' : 'background.paper',
                      border: isDarkMode ? '1px solid rgba(255,215,0,0.2)' : 'none',
                      '& .MuiMenuItem-root': {
                        color: isDarkMode ? '#fff' : 'text.primary',
                        '&:hover': {
                          bgcolor: isDarkMode ? 'rgba(255,215,0,0.1)' : 'action.hover',
                        },
                        '&.Mui-selected': {
                          bgcolor: isDarkMode ? 'rgba(255,215,0,0.2)' : 'action.selected',
                          '&:hover': {
                            bgcolor: isDarkMode ? 'rgba(255,215,0,0.3)' : 'action.selected',
                          },
                        },
                      },
                    },
                  },
                },
              }}
            >
              <MenuItem value="">All Types</MenuItem>
              {roomTypes.map((type) => (
                <MenuItem key={type.value} value={type.value}>
                  {type.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              fullWidth
              type="number"
              label="Min Price"
              name="minPrice"
              value={filters.minPrice}
              onChange={handleFilterChange}
            />
            <TextField
              fullWidth
              type="number"
              label="Max Price"
              name="maxPrice"
              value={filters.maxPrice}
              onChange={handleFilterChange}
            />
          </Stack>
        </Box>

        {rooms && rooms.filter(room => room.available).length === 0 ? (
          <Alert
            severity="info"
            sx={{
              backgroundColor: 'rgba(2,136,209,0.1)',
              color: '#4fc3f7',
              border: '1px solid rgba(2,136,209,0.3)',
            }}
          >
            No available rooms found matching your criteria.
          </Alert>
        ) : (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(3, 1fr)',
              },
              gap: { xs: 2, sm: 2.5, md: 3 },
            }}
          >
            {rooms?.filter(room => room.available).map((room: Room) => {
              const occupiedCount = roomOccupancyCount.get(room.id) || 0;
              const availableCount = (room.totalRooms || 1) - occupiedCount;
              const isFullyOccupied = availableCount <= 0;
              return (
                <Card
                  key={room.id}
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    bgcolor: isDarkMode ? 'rgba(26,26,26,0.95)' : 'background.paper',
                    border: '1px solid',
                    borderColor: isDarkMode ? 'rgba(255,215,0,0.2)' : 'divider',
                    borderRadius: 2,
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    '&:hover': {
                      transform: { xs: 'translateY(-4px)', md: 'translateY(-8px)' },
                      boxShadow: isDarkMode ? '0 12px 40px rgba(255,215,0,0.3)' : '0 12px 40px rgba(25,118,210,0.3)',
                      borderColor: isDarkMode ? 'rgba(255,215,0,0.5)' : 'primary.main',
                    },
                  }}
                  onClick={() => navigate(`/rooms/${room.id}`)}
                >
                  <CardMedia
                    component="img"
                    height="140"
                    image={room.imageUrl || 'https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=800'}
                    alt={room.name}
                    sx={{
                      objectFit: 'cover',
                    }}
                  />
                  <CardContent sx={{
                    flexGrow: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    p: { xs: 1.5, md: 2 },
                  }}>
                    <Typography
                      gutterBottom
                      variant="h6"
                      component="h2"
                      sx={{
                        color: isDarkMode ? '#FFD700' : 'primary.main',
                        fontWeight: 600,
                        mb: 1,
                        fontSize: { xs: '1.1rem', sm: '1.15rem', md: '1.25rem' },
                      }}
                    >
                      {room.name}
                    </Typography>
                    <Stack direction="row" spacing={0.5} sx={{ mb: 1, flexWrap: 'wrap', gap: 0.5 }}>
                      <Chip
                        icon={<HotelIcon sx={{ color: isDarkMode ? '#FFD700 !important' : 'primary.main', fontSize: '1rem !important' }} />}
                        label={room.type.charAt(0) + room.type.slice(1).toLowerCase()}
                        sx={{
                          backgroundColor: isDarkMode ? 'rgba(255,215,0,0.1)' : 'rgba(25,118,210,0.1)',
                          color: isDarkMode ? '#FFD700' : 'primary.main',
                          border: isDarkMode ? '1px solid rgba(255,215,0,0.3)' : '1px solid rgba(25,118,210,0.3)',
                          borderRadius: '16px',
                          height: '28px',
                          fontSize: '0.8125rem',
                          fontWeight: 500,
                          '& .MuiChip-label': {
                            px: 1.5,
                          },
                          '& .MuiChip-icon': {
                            ml: 1,
                          },
                        }}
                        size="small"
                      />
                      <Chip
                        icon={<PeopleIcon sx={{ color: isDarkMode ? '#FFD700 !important' : 'primary.main', fontSize: '1rem !important' }} />}
                        label={`${room.capacity} Guests`}
                        sx={{
                          backgroundColor: isDarkMode ? 'rgba(255,215,0,0.1)' : 'rgba(25,118,210,0.1)',
                          color: isDarkMode ? '#FFD700' : 'primary.main',
                          border: isDarkMode ? '1px solid rgba(255,215,0,0.3)' : '1px solid rgba(25,118,210,0.3)',
                          borderRadius: '16px',
                          height: '28px',
                          fontSize: '0.8125rem',
                          fontWeight: 500,
                          '& .MuiChip-label': {
                            px: 1.5,
                          },
                          '& .MuiChip-icon': {
                            ml: 1,
                          },
                        }}
                        size="small"
                      />
                      <Chip
                        label={isFullyOccupied ? 'Fully Occupied' : `${availableCount} Available`}
                        color={isFullyOccupied ? 'error' : 'success'}
                        sx={{
                          borderRadius: '16px',
                          height: '28px',
                          fontSize: '0.8125rem',
                          fontWeight: 500,
                          '& .MuiChip-label': {
                            px: 1.5,
                          },
                        }}
                        size="small"
                      />
                    </Stack>
                    <Typography
                      variant="h6"
                      sx={{
                        color: isDarkMode ? '#FFD700' : 'primary.main',
                        fontWeight: 600,
                        fontSize: { xs: '1.2rem', md: '1.3rem' },
                      }}
                    >
                      ${room.pricePerNight}
                      <Typography component="span" variant="body2" sx={{ color: isDarkMode ? 'rgba(255,255,255,0.6)' : 'text.secondary' }}>
                        {' '}/ night
                      </Typography>
                    </Typography>
                  </CardContent>
                </Card>
              );
            })}
          </Box>
        )}
      </Container>
    </Box>
  );
};

export default Rooms;
