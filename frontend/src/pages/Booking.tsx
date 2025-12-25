import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
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
  useTheme,
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
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

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
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        py: { xs: 4, md: 6 },
      }}
    >
      <Container maxWidth="lg">
        <Typography
          variant="h3"
          gutterBottom
          sx={{
            background: isDarkMode ? 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)' : 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 700,
            mb: 4,
            textAlign: 'center',
          }}
        >
          Complete Your Booking
        </Typography>

        <Stepper
          activeStep={activeStep}
          sx={{
            my: 4,
            '& .MuiStepLabel-label': {
              color: isDarkMode ? 'rgba(255,255,255,0.7)' : 'text.secondary',
              '&.Mui-active': {
                color: isDarkMode ? '#FFD700' : 'primary.main',
              },
              '&.Mui-completed': {
                color: isDarkMode ? '#FFD700' : 'primary.main',
              },
            },
            '& .MuiStepIcon-root': {
              color: isDarkMode ? 'rgba(255,215,0,0.3)' : 'rgba(25,118,210,0.3)',
              '&.Mui-active': {
                color: isDarkMode ? '#FFD700' : 'primary.main',
              },
              '&.Mui-completed': {
                color: isDarkMode ? '#FFD700' : 'primary.main',
              },
            },
          }}
        >
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && (
          <Alert
            severity="error"
            sx={{
              mb: 3,
              backgroundColor: 'rgba(211,47,47,0.1)',
              color: '#ff6b6b',
              border: '1px solid rgba(211,47,47,0.3)',
            }}
            onClose={() => setError(null)}
          >
            {error}
          </Alert>
        )}

        {success && (
          <Alert
            severity="success"
            sx={{
              mb: 3,
              backgroundColor: 'rgba(46,125,50,0.1)',
              color: '#66bb6a',
              border: '1px solid rgba(46,125,50,0.3)',
            }}
          >
            {success}
          </Alert>
        )}

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' },
            gap: 4,
          }}
        >
          <Box>
            {activeStep === 0 ? (
              <Card
                sx={{
                  bgcolor: isDarkMode ? 'rgba(26,26,26,0.95)' : 'background.paper',
                  border: '1px solid',
                  borderColor: isDarkMode ? 'rgba(255,215,0,0.2)' : 'divider',
                  borderRadius: 3,
                }}
              >
                <CardContent>
                <Typography variant="h6" gutterBottom sx={{ color: isDarkMode ? '#FFD700' : 'primary.main', fontWeight: 600 }}>
                  Room Details
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, mb: 3, flexDirection: { xs: 'column', sm: 'row' } }}>
                  <CardMedia
                    component="img"
                    sx={{ width: { xs: '100%', sm: 200 }, height: 150, borderRadius: 2, objectFit: 'cover' }}
                    image={room.imageUrl || 'https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=400'}
                    alt={room.name}
                  />
                  <Box>
                    <Typography variant="h6" sx={{ color: isDarkMode ? '#FFD700' : 'primary.main' }}>{room.name}</Typography>
                    <Typography variant="body2" sx={{ color: isDarkMode ? 'rgba(255,255,255,0.6)' : 'text.secondary' }} gutterBottom>
                      {room.type}
                    </Typography>
                    <Typography variant="body2" sx={{ color: isDarkMode ? 'rgba(255,255,255,0.8)' : 'text.primary' }} paragraph>
                      {room.description}
                    </Typography>
                  </Box>
                </Box>

                <Divider sx={{ my: 3, borderColor: isDarkMode ? 'rgba(255,215,0,0.2)' : 'divider' }} />

                <Typography variant="h6" gutterBottom sx={{ color: isDarkMode ? '#FFD700' : 'primary.main', fontWeight: 600 }}>
                  Booking Information
                </Typography>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
                    gap: 2,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CalendarMonth sx={{ color: isDarkMode ? '#FFD700' : 'primary.main' }} />
                    <Box>
                      <Typography variant="body2" sx={{ color: isDarkMode ? 'rgba(255,255,255,0.6)' : 'text.secondary' }}>
                        Check-in
                      </Typography>
                      <Typography variant="body1" sx={{ color: isDarkMode ? '#fff' : 'text.primary' }}>
                        {parseDate(checkInDate).toLocaleDateString()}
                      </Typography>
                      <Typography variant="caption" sx={{ color: isDarkMode ? 'rgba(255,255,255,0.5)' : 'text.secondary' }}>
                        After 3:00 PM
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CalendarMonth sx={{ color: isDarkMode ? '#FFD700' : 'primary.main' }} />
                    <Box>
                      <Typography variant="body2" sx={{ color: isDarkMode ? 'rgba(255,255,255,0.6)' : 'text.secondary' }}>
                        Check-out
                      </Typography>
                      <Typography variant="body1" sx={{ color: isDarkMode ? '#fff' : 'text.primary' }}>
                        {parseDate(checkOutDate).toLocaleDateString()}
                      </Typography>
                      <Typography variant="caption" sx={{ color: isDarkMode ? 'rgba(255,255,255,0.5)' : 'text.secondary' }}>
                        Before 11:00 AM
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <People sx={{ color: isDarkMode ? '#FFD700' : 'primary.main' }} />
                    <Box>
                      <Typography variant="body2" sx={{ color: isDarkMode ? 'rgba(255,255,255,0.6)' : 'text.secondary' }}>
                        Guests
                      </Typography>
                      <Typography variant="body1" sx={{ color: isDarkMode ? '#fff' : 'text.primary' }}>{guests}</Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CalendarMonth sx={{ color: isDarkMode ? '#FFD700' : 'primary.main' }} />
                    <Box>
                      <Typography variant="body2" sx={{ color: isDarkMode ? 'rgba(255,255,255,0.6)' : 'text.secondary' }}>
                        Nights
                      </Typography>
                      <Typography variant="body1" sx={{ color: isDarkMode ? '#fff' : 'text.primary' }}>{nights}</Typography>
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>
            ) : (
              <Card
                sx={{
                  bgcolor: isDarkMode ? 'rgba(26,26,26,0.95)' : 'background.paper',
                  border: '1px solid',
                  borderColor: isDarkMode ? 'rgba(255,215,0,0.2)' : 'divider',
                  borderRadius: 3,
                }}
              >
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ color: isDarkMode ? '#FFD700' : 'primary.main', fontWeight: 600 }}>
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
                      <CircularProgress sx={{ color: isDarkMode ? '#FFD700' : 'primary.main' }} />
                      <Typography variant="body2" sx={{ mt: 2, color: isDarkMode ? 'rgba(255,255,255,0.7)' : 'text.secondary' }}>
                        Preparing payment form...
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            )}
          </Box>

          <Box>
            <Card
              sx={{
                bgcolor: isDarkMode ? 'rgba(26,26,26,0.95)' : 'background.paper',
                border: '1px solid',
                borderColor: isDarkMode ? 'rgba(255,215,0,0.2)' : 'divider',
                borderRadius: 3,
              }}
            >
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ color: isDarkMode ? '#FFD700' : 'primary.main', fontWeight: 600 }}>
                  Price Summary
                </Typography>

                <Box sx={{ my: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" sx={{ color: isDarkMode ? 'rgba(255,255,255,0.8)' : 'text.secondary' }}>
                      ${room.pricePerNight} × {nights} night{nights > 1 ? 's' : ''}
                    </Typography>
                    <Typography variant="body2" sx={{ color: isDarkMode ? '#fff' : 'text.primary' }}>${totalAmount.toFixed(2)}</Typography>
                  </Box>
                </Box>

                <Divider sx={{ my: 2, borderColor: isDarkMode ? 'rgba(255,215,0,0.2)' : 'divider' }} />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                  <Typography variant="h6" sx={{ color: isDarkMode ? '#fff' : 'text.primary' }}>Total</Typography>
                  <Typography variant="h6" sx={{ color: isDarkMode ? '#FFD700' : 'primary.main', fontWeight: 600 }}>
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
                      startIcon={(isCreatingReservation || isCreatingPayment) ? <CircularProgress size={20} sx={{ color: isDarkMode ? '#000' : '#fff' }} /> : <AttachMoney />}
                      sx={{
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
                      {(isCreatingReservation || isCreatingPayment) ? 'Processing...' : 'Proceed to Payment'}
                    </Button>

                    <Button
                      fullWidth
                      variant="outlined"
                      size="large"
                      onClick={() => navigate(-1)}
                      disabled={isCreatingReservation || isCreatingPayment}
                      sx={{
                        mt: 2,
                        py: 1.5,
                        color: isDarkMode ? '#fff' : 'text.primary',
                        borderColor: isDarkMode ? 'rgba(255,215,0,0.3)' : 'divider',
                        '&:hover': {
                          borderColor: isDarkMode ? '#FFD700' : 'primary.main',
                          backgroundColor: isDarkMode ? 'rgba(255,215,0,0.1)' : 'rgba(25,118,210,0.05)',
                        },
                        '&.Mui-disabled': {
                          borderColor: isDarkMode ? 'rgba(255,215,0,0.2)' : 'rgba(0,0,0,0.12)',
                          color: isDarkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.26)',
                        },
                      }}
                    >
                      Go Back
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Booking;
