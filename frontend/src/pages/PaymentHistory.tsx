import React from 'react';
import {
  Container,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Alert,
} from '@mui/material';
import { useGetPaymentHistoryQuery } from '../features/payments/paymentsApi';
import Loading from '../components/Loading';
import { Transaction, PaymentStatus } from '../types';

const PaymentHistory: React.FC = () => {
  const { data: payments, isLoading, error } = useGetPaymentHistoryQuery();

  if (isLoading) return <Loading message="Loading payment history..." />;

  if (error) {
    return (
      <Container>
        <Alert severity="error">Failed to load payment history</Alert>
      </Container>
    );
  }

  const getStatusColor = (status: string | undefined): 'success' | 'warning' | 'error' | 'info' | 'default' => {
    switch (status) {
      case 'COMPLETED':
      case 'SUCCEEDED':
        return 'success';
      case 'PENDING':
        return 'warning';
      case 'FAILED':
        return 'error';
      case 'REFUNDED':
        return 'info';
      default:
        return 'default';
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Payment History
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Reservation</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Payment Method</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {payments?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <Typography color="textSecondary">No payments found</Typography>
                </TableCell>
              </TableRow>
            ) : (
              payments?.map((payment: Transaction) => (
                <TableRow key={payment.id}>
                  <TableCell>
                    {new Date(payment.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{payment.reservation?.id || 'N/A'}</TableCell>
                  <TableCell>${payment.amount?.toFixed(2)}</TableCell>
                  <TableCell>{payment.paymentMethod || 'Stripe'}</TableCell>
                  <TableCell>
                    <Chip
                      label={payment.status || 'COMPLETED'}
                      color={getStatusColor(payment.status)}
                      size="small"
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
};

export default PaymentHistory;
