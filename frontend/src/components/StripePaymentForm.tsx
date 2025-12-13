import React, { useState } from 'react';
import {
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { Button, Box, Alert, CircularProgress } from '@mui/material';
import { AttachMoney } from '@mui/icons-material';
import { PaymentIntent, StripeError } from '@stripe/stripe-js';

interface StripePaymentFormProps {
  onSuccess?: (paymentIntent: PaymentIntent) => void;
  onError?: (error: StripeError) => void;
}

/**
 * Stripe payment form component
 */
const StripePaymentForm: React.FC<StripePaymentFormProps> = ({ onSuccess, onError }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setMessage(null);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/payment-success`,
      },
      redirect: 'if_required',
    });

    if (error) {
      setMessage(error.message || 'An error occurred');
      setIsProcessing(false);
      if (onError) onError(error);
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      setMessage('Payment succeeded!');
      setIsProcessing(false);
      if (onSuccess) onSuccess(paymentIntent);
    } else {
      setMessage('Payment processing...');
      setIsProcessing(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <PaymentElement />

      {message && (
        <Alert severity={message.includes('succeeded') ? 'success' : 'error'} sx={{ mt: 2 }}>
          {message}
        </Alert>
      )}

      <Button
        type="submit"
        fullWidth
        variant="contained"
        size="large"
        disabled={!stripe || isProcessing}
        startIcon={isProcessing ? <CircularProgress size={20} /> : <AttachMoney />}
        sx={{ mt: 3 }}
      >
        {isProcessing ? 'Processing...' : 'Pay Now'}
      </Button>

      <Box sx={{ mt: 2, textAlign: 'center' }}>
        <Alert severity="info" sx={{ textAlign: 'left' }}>
          <strong>Test Card Numbers:</strong><br />
          • Success: 4242 4242 4242 4242<br />
          • Requires Auth: 4000 0025 0000 3155<br />
          • Declined: 4000 0000 0000 9995<br />
          Use any future expiry date, any 3-digit CVC, and any ZIP code.
        </Alert>
      </Box>
    </Box>
  );
};

export default StripePaymentForm;
