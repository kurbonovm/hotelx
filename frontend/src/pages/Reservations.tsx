import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Divider,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Cancel,
  CheckCircle,
  Schedule,
  EventAvailable,
  Close,
  History,
} from '@mui/icons-material';
import { useGetUserReservationsQuery, useCancelReservationMutation } from '../features/reservations/reservationsApi';
import { Reservation, ReservationStatus } from '../types';

/**
 * Helper function to parse date string without timezone conversion
 */
const parseDate = (dateStr: string): Date => {
  if (!dateStr) return new Date();
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

/**
 * Reservations page component to view user's reservations
 */
const Reservations: React.FC = () => {
  const { data: reservations, isLoading, error } = useGetUserReservationsQuery();
  const [cancelReservation, { isLoading: isCancelling }] = useCancelReservationMutation();
  const [cancelError, setCancelError] = useState<string>('');
  const [cancelSuccess, setCancelSuccess] = useState<string>('');
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [selectedReservationId, setSelectedReservationId] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState<number>(0);

  // Auto-dismiss success message after 3 seconds
  useEffect(() => {
    if (cancelSuccess) {
      const timer = setTimeout(() => {
        setCancelSuccess('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [cancelSuccess]);

  const handleOpenDialog = (reservationId: string) => {
    setSelectedReservationId(reservationId);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedReservationId(null);
  };

  const handleConfirmCancel = async () => {
    setCancelError('');
    setCancelSuccess('');

    try {
      await cancelReservation(selectedReservationId!).unwrap();
      setCancelSuccess('Reservation cancelled successfully!');
      handleCloseDialog();
    } catch (err: any) {
      setCancelError(err.data?.message || 'Failed to cancel reservation.');
      handleCloseDialog();
    }
  };

  const getStatusColor = (status: string | undefined): 'success' | 'warning' | 'error' | 'default' => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string | undefined): React.ReactNode => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
        return <CheckCircle />;
      case 'pending':
        return <Schedule />;
      case 'cancelled':
        return <Cancel />;
      default:
        return null;
    }
  };

  // Filter and categorize reservations
  const categorizeReservations = (): { active: Reservation[]; past: Reservation[]; cancelled: Reservation[] } => {
    if (!reservations) return { active: [], past: [], cancelled: [] };

    const now = new Date();
    const active: Reservation[] = [];
    const past: Reservation[] = [];
    const cancelled: Reservation[] = [];

    reservations.forEach((reservation) => {
      // Handle cancelled reservations
      if (reservation.status?.toLowerCase() === 'cancelled') {
        cancelled.push(reservation);
        return;
      }

      // Create checkout datetime by combining date and time
      const checkOutDate = parseDate(reservation.checkOutDate);
      // Set checkout time to 11:00 AM (default checkout time)
      const checkOutTime = reservation.checkOutTime || '11:00';
      const [hours, minutes] = checkOutTime.split(':');
      checkOutDate.setHours(parseInt(hours), parseInt(minutes || '0'), 0, 0);

      // Reservation is past if checkout datetime has passed and status is CHECKED_OUT
      if (reservation.status?.toUpperCase() === 'CHECKED_OUT' ||
          (checkOutDate < now &&
           (reservation.status?.toUpperCase() === 'CONFIRMED' ||
            reservation.status?.toUpperCase() === 'CHECKED_IN'))) {
        past.push(reservation);
      } else {
        // Otherwise it's active (PENDING, CONFIRMED, or CHECKED_IN with future checkout)
        active.push(reservation);
      }
    });

    // Sort by creation date (most recently created first)
    const sortByCreatedAt = (a: Reservation, b: Reservation) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA; // Descending order (newest first)
    };

    active.sort(sortByCreatedAt);
    past.sort(sortByCreatedAt);
    cancelled.sort(sortByCreatedAt);

    return { active, past, cancelled };
  };

  const { active, past, cancelled } = categorizeReservations();

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

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
        <Alert severity="error">Failed to load reservations. Please try again later.</Alert>
      </Container>
    );
  }

  const renderReservations = (reservationList: Reservation[]) => {
    if (reservationList.length === 0) {
      return (
        <Alert severity="info" sx={{ mt: 2 }}>
          No reservations found in this category.
        </Alert>
      );
    }

    return (
      <Grid container spacing={3} sx={{ mt: 1 }}>
        {reservationList.map((reservation) => (
            <Grid size={{ xs: 12 }} key={reservation.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, gap: 2, flexWrap: 'wrap' }}>
                    <Typography variant="h5" component="h2" sx={{ wordBreak: 'break-all', flexShrink: 1, minWidth: 0 }}>
                      Reservation #{reservation.id}
                    </Typography>
                    <Chip
                      icon={getStatusIcon(reservation.status)}
                      label={reservation.status}
                      color={getStatusColor(reservation.status)}
                      sx={{ fontWeight: 'bold', flexShrink: 0 }}
                    />
                  </Box>

                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant="body1" color="text.secondary">
                        <strong>Room:</strong> {reservation.room?.name}
                      </Typography>
                      <Typography variant="body1" color="text.secondary">
                        <strong>Room Type:</strong> {reservation.room?.type}
                      </Typography>
                      <Typography variant="body1" color="text.secondary">
                        <strong>Check-in:</strong>{' '}
                        {parseDate(reservation.checkInDate).toLocaleDateString()}
                      </Typography>
                      <Typography variant="body1" color="text.secondary">
                        <strong>Check-out:</strong>{' '}
                        {parseDate(reservation.checkOutDate).toLocaleDateString()}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant="body1" color="text.secondary">
                        <strong>Guests:</strong> {reservation.numberOfGuests}
                      </Typography>
                      <Typography variant="body1" color="text.secondary">
                        <strong>Total Amount:</strong> ${reservation.totalAmount}
                      </Typography>
                      <Typography variant="body1" color="text.secondary">
                        <strong>Booked on:</strong>{' '}
                        {new Date(reservation.createdAt).toLocaleDateString()}
                      </Typography>
                    </Grid>
                  </Grid>

                  <Divider sx={{ my: 2 }} />

                  {reservation.status?.toLowerCase() === 'confirmed' && (
                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                      <Button
                        variant="outlined"
                        color="error"
                        size="medium"
                        startIcon={<Close />}
                        onClick={() => handleOpenDialog(reservation.id)}
                        sx={{
                          borderWidth: 2,
                          '&:hover': {
                            borderWidth: 2,
                            backgroundColor: 'error.light',
                            color: 'white',
                          },
                        }}
                      >
                        Cancel Reservation
                      </Button>
                    </Box>
                  )}

                  {reservation.status?.toLowerCase() === 'pending' && (
                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                      <Alert severity="info" sx={{ flex: 1 }}>
                        Payment is being processed. Your reservation will be confirmed once payment is complete.
                      </Alert>
                    </Box>
                  )}

                  {reservation.status?.toLowerCase() === 'cancelled' && (
                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                      <Alert severity="error" sx={{ flex: 1 }}>
                        This reservation has been cancelled.
                      </Alert>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
      </Grid>
    );
  };

  return (
    <Container maxWidth="lg">
      <Typography variant="h3" component="h1" gutterBottom sx={{ mb: 3 }}>
        My Reservations
      </Typography>

      {cancelError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setCancelError('')}>
          {cancelError}
        </Alert>
      )}

      {cancelSuccess && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setCancelSuccess('')}>
          {cancelSuccess}
        </Alert>
      )}

      {reservations && reservations.length === 0 ? (
        <Alert severity="info">You don't have any reservations yet.</Alert>
      ) : (
        <>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs value={tabValue} onChange={handleTabChange} aria-label="reservation tabs">
              <Tab
                icon={<EventAvailable />}
                iconPosition="start"
                label={`Active (${active.length})`}
              />
              <Tab
                icon={<History />}
                iconPosition="start"
                label={`Past (${past.length})`}
              />
              <Tab
                icon={<Cancel />}
                iconPosition="start"
                label={`Cancelled (${cancelled.length})`}
              />
            </Tabs>
          </Box>

          {tabValue === 0 && renderReservations(active)}
          {tabValue === 1 && renderReservations(past)}
          {tabValue === 2 && renderReservations(cancelled)}
        </>
      )}

      {/* Cancel Confirmation Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        aria-labelledby="cancel-dialog-title"
        aria-describedby="cancel-dialog-description"
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle id="cancel-dialog-title" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Cancel color="error" />
          Cancel Reservation
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="cancel-dialog-description">
            Are you sure you want to cancel this reservation? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={handleCloseDialog}
            disabled={isCancelling}
            variant="outlined"
            size="large"
            startIcon={<EventAvailable />}
          >
            Keep Reservation
          </Button>
          <Button
            onClick={handleConfirmCancel}
            color="error"
            variant="contained"
            disabled={isCancelling}
            size="large"
            startIcon={isCancelling ? <CircularProgress size={20} color="inherit" /> : <Close />}
            autoFocus
          >
            {isCancelling ? 'Cancelling...' : 'Yes, Cancel'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Reservations;
