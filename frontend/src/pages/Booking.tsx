import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Button,
  Divider,
  Alert,
  CircularProgress,
  Step,
  Stepper,
  StepLabel,
} from '@mui/material';
import { CalendarMonth, People, AttachMoney } from '@mui/icons-material';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe, StripeElementsOptions } from '@stripe/stripe-js';
import { useCreateReservationMutation } from '../features/reservations/reservationsApi';
import { useCreatePaymentIntentMutation, useConfirmPaymentMutation } from '../features/payments/paymentsApi';
import StripePaymentForm from '../components/StripePaymentForm';
import { Room } from '../types';
import { PaymentIntent } from '@stripe/stripe-js';

// Load Stripe
const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY as string;

if (!stripePublicKey || stripePublicKey === 'undefined') {
  console.error('VITE_STRIPE_PUBLIC_KEY is not defined in environment variables');
}

const stripePromise = stripePublicKey && stripePublicKey !== 'undefined'
  ? loadStripe(stripePublicKey)
  : null;

interface BookingLocationState {
  room: Room;
  checkInDate: string;
  checkOutDate: string;
  guests: number;
}

/**
 * Helper function to parse date string without timezone conversion
 */
const parseDate = (dateStr: string): Date => {
  if (!dateStr) return new Date();
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

/**
 * Booking page component for confirming and creating reservations
 */
const Booking: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Try to get booking data from location state first, then from sessionStorage
  const getBookingData = (): BookingLocationState | null => {
    if (location.state) {
      return location.state as BookingLocationState;
    }

    // Check sessionStorage for pending booking after login
    const pendingBooking = sessionStorage.getItem('pendingBooking');
    if (pendingBooking) {
      sessionStorage.removeItem('pendingBooking'); // Clear it after retrieving
      return JSON.parse(pendingBooking);
    }

    return null;
  };

  const bookingData = getBookingData();
  const { room, checkInDate, checkOutDate, guests } = bookingData || {};

  const [createReservation, { isLoading: isCreatingReservation }] = useCreateReservationMutation();
  const [createPaymentIntent, { isLoading: isCreatingPayment }] = useCreatePaymentIntentMutation();
  const [confirmPayment] = useConfirmPaymentMutation();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState<number>(0);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [reservationId, setReservationId] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);

  const steps = ['Review Booking', 'Payment'];

  // Redirect if no booking data
  if (!room || !checkInDate || !checkOutDate) {
    navigate('/rooms');
    return null;
  }

  // Calculate number of nights
  const calculateNights = (): number => {
    const start = parseDate(checkInDate);
    const end = parseDate(checkOutDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const nights = calculateNights();
  const totalAmount = nights * parseFloat(room.pricePerNight.toString());

  const handleProceedToPayment = async () => {
    try {
      setError(null);

      // Step 1: Create the reservation
      const reservationData = {
        roomId: room.id,
        checkInDate,
        checkOutDate,
        numberOfGuests: guests,
      };

      const reservation = await createReservation(reservationData).unwrap();
      setReservationId(reservation.id);

      // Step 2: Create payment intent
      const paymentIntent = await createPaymentIntent({
        reservationId: reservation.id,
      }).unwrap();

      setClientSecret(paymentIntent.clientSecret);
      setPaymentIntentId(paymentIntent.paymentIntentId);

      // Move to payment step
      setActiveStep(1);

    } catch (err: any) {
      console.error('Failed to create reservation or payment intent:', err);
      console.error('Error details:', err.data);
      setError(err.data?.message || err.message || 'Failed to create reservation. Please try again.');
    }
  };

  const handlePaymentSuccess = async (paymentIntent: PaymentIntent) => {
    try {
      // Confirm payment on backend
      await confirmPayment({
        paymentIntentId: paymentIntentId!,
      }).unwrap();

      setSuccess('Payment processed successfully! Redirecting...');

      setTimeout(() => {
        navigate('/reservations', {
          state: { message: 'Reservation created and payment completed successfully!' },
        });
      }, 2000);

    } catch (err: any) {
      console.error('Failed to confirm payment:', err);
      setError('Payment succeeded but confirmation failed. Please contact support.');
    }
  };

  const handlePaymentError = (error: Error) => {
    setError(error.message || 'Payment failed. Please try again.');
  };

  const stripeOptions: StripeElementsOptions = {
    clientSecret: clientSecret!,
    appearance: {
      theme: 'stripe',
    },
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" gutterBottom>
          Complete Your Booking
        </Typography>

        <Stepper activeStep={activeStep} sx={{ my: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {success}
          </Alert>
        )}

        <Grid container spacing={4}>
          <Grid size={{ xs: 12, md: 8 }}>
            {activeStep === 0 ? (
              <Card>
                <CardContent>
                <Typography variant="h6" gutterBottom>
                  Room Details
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                  <CardMedia
                    component="img"
                    sx={{ width: 200, height: 150, borderRadius: 1 }}
                    image={room.imageUrl || 'https://via.placeholder.com/200x150?text=Room'}
                    alt={room.name}
                  />
                  <Box>
                    <Typography variant="h6">{room.name}</Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {room.type}
                    </Typography>
                    <Typography variant="body2" paragraph>
                      {room.description}
                    </Typography>
                  </Box>
                </Box>

                <Divider sx={{ my: 3 }} />

                <Typography variant="h6" gutterBottom>
                  Booking Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CalendarMonth color="primary" />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Check-in
                        </Typography>
                        <Typography variant="body1">
                          {parseDate(checkInDate).toLocaleDateString()}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          After 3:00 PM
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CalendarMonth color="primary" />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Check-out
                        </Typography>
                        <Typography variant="body1">
                          {parseDate(checkOutDate).toLocaleDateString()}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Before 11:00 AM
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <People color="primary" />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Guests
                        </Typography>
                        <Typography variant="body1">{guests}</Typography>
                      </Box>
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CalendarMonth color="primary" />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Nights
                        </Typography>
                        <Typography variant="body1">{nights}</Typography>
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
            ) : (
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Payment Details
                  </Typography>
                  {clientSecret && (
                    <Elements stripe={stripePromise} options={stripeOptions}>
                      <StripePaymentForm
                        onSuccess={handlePaymentSuccess}
                        onError={handlePaymentError}
                      />
                    </Elements>
                  )}
                  {!clientSecret && (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <CircularProgress />
                      <Typography variant="body2" sx={{ mt: 2 }}>
                        Preparing payment form...
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            )}
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Price Summary
                </Typography>

                <Box sx={{ my: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">
                      ${room.pricePerNight} × {nights} night{nights > 1 ? 's' : ''}
                    </Typography>
                    <Typography variant="body2">${totalAmount.toFixed(2)}</Typography>
                  </Box>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                  <Typography variant="h6">Total</Typography>
                  <Typography variant="h6" color="primary">
                    ${totalAmount.toFixed(2)}
                  </Typography>
                </Box>

                {activeStep === 0 && (
                  <>
                    <Button
                      fullWidth
                      variant="contained"
                      size="large"
                      onClick={handleProceedToPayment}
                      disabled={isCreatingReservation || isCreatingPayment}
                      startIcon={(isCreatingReservation || isCreatingPayment) ? <CircularProgress size={20} /> : <AttachMoney />}
                    >
                      {(isCreatingReservation || isCreatingPayment) ? 'Processing...' : 'Proceed to Payment'}
                    </Button>

                    <Button
                      fullWidth
                      variant="outlined"
                      size="large"
                      onClick={() => navigate(-1)}
                      disabled={isCreatingReservation || isCreatingPayment}
                      sx={{ mt: 2 }}
                    >
                      Go Back
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default Booking;
