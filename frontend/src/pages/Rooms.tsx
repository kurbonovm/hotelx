import React, { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Grid,
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
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useGetRoomsQuery } from '../features/rooms/roomsApi';
import { useGetAllReservationsAdminQuery } from '../features/admin/adminApi';
import { Room, RoomType } from '../types';

/**
 * Rooms page component to browse available rooms
 */
const Rooms: React.FC = () => {
  const navigate = useNavigate();
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
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container>
        <Alert severity="error">Failed to load rooms. Please try again later.</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Typography variant="h3" component="h1" gutterBottom>
        Browse Rooms
      </Typography>

      <Box sx={{ mb: 4 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 4 }}>
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
                    style: {
                      maxHeight: 300,
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
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              fullWidth
              type="number"
              label="Min Price"
              name="minPrice"
              value={filters.minPrice}
              onChange={handleFilterChange}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              fullWidth
              type="number"
              label="Max Price"
              name="maxPrice"
              value={filters.maxPrice}
              onChange={handleFilterChange}
            />
          </Grid>
        </Grid>
      </Box>

      {rooms && rooms.filter(room => room.available).length === 0 ? (
        <Alert severity="info">No available rooms found matching your criteria.</Alert>
      ) : (
        <Grid container spacing={3}>
          {rooms?.filter(room => room.available).map((room: Room) => {
            const occupiedCount = roomOccupancyCount.get(room.id) || 0;
            const availableCount = (room.totalRooms || 1) - occupiedCount;
            const isFullyOccupied = availableCount <= 0;
            return (
              <Grid
                size={{ xs: 12, sm: 6, md: 4 }}
                key={room.id}
                sx={{
                  display: 'flex !important',
                  flexBasis: 'auto !important',
                  flexGrow: 0,
                  flexShrink: 0,
                  maxWidth: {
                    xs: '100%',
                    sm: 'calc(50% - 12px)',
                    md: 'calc(33.333% - 16px)'
                  }
                }}
              >
                <Card sx={{
                  height: '100%',
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  <CardMedia
                    component="img"
                    height="200"
                    image={room.imageUrl || 'https://via.placeholder.com/300x200?text=Room+Image'}
                    alt={room.name}
                  />
                  <CardContent sx={{ flexGrow: 1, overflow: 'hidden' }}>
                    <Typography gutterBottom variant="h5" component="h2">
                      {room.name}
                    </Typography>
                    <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Chip
                        label={room.type.charAt(0) + room.type.slice(1).toLowerCase()}
                        color="primary"
                        size="small"
                      />
                      <Chip label={`${room.capacity} Guests`} size="small" />
                      <Chip
                        label={isFullyOccupied ? 'Fully Occupied' : `${availableCount} Available`}
                        color={isFullyOccupied ? 'error' : 'success'}
                        size="small"
                      />
                  </Box>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {room.description}
                  </Typography>
                  <Typography variant="h6" color="primary">
                    ${room.pricePerNight} / night
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Amenities: {room.amenities?.join(', ') || 'N/A'}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button
                    size="small"
                    variant="contained"
                    fullWidth
                    onClick={() => navigate(`/rooms/${room.id}`)}
                  >
                    View Details
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          );
        })}
        </Grid>
      )}
    </Container>
  );
};

export default Rooms;
