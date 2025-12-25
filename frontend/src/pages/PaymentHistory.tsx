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
  Box,
  useTheme,
} from '@mui/material';
import { useGetPaymentHistoryQuery } from '../features/payments/paymentsApi';
import Loading from '../components/Loading';
import { Transaction, PaymentStatus } from '../types';

const PaymentHistory: React.FC = () => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const { data: payments, isLoading, error } = useGetPaymentHistoryQuery();

  if (isLoading) return <Loading message="Loading payment history..." />;

  if (error) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          bgcolor: 'background.default',
          py: { xs: 4, md: 6 },
        }}
      >
        <Container>
          <Alert
            severity="error"
            sx={{
              backgroundColor: 'rgba(211,47,47,0.1)',
              color: '#ff6b6b',
              border: '1px solid rgba(211,47,47,0.3)',
            }}
          >
            Failed to load payment history
          </Alert>
        </Container>
      </Box>
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
          Payment History
        </Typography>

        <TableContainer
          component={Paper}
          sx={{
            bgcolor: isDarkMode ? 'rgba(26,26,26,0.95)' : 'background.paper',
            border: '1px solid',
            borderColor: isDarkMode ? 'rgba(255,215,0,0.2)' : 'divider',
            borderRadius: 3,
          }}
        >
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ color: isDarkMode ? '#FFD700' : 'primary.main', fontWeight: 600, borderBottom: isDarkMode ? '1px solid rgba(255,215,0,0.2)' : '1px solid rgba(0,0,0,0.12)' }}>
                  Date
                </TableCell>
                <TableCell sx={{ color: isDarkMode ? '#FFD700' : 'primary.main', fontWeight: 600, borderBottom: isDarkMode ? '1px solid rgba(255,215,0,0.2)' : '1px solid rgba(0,0,0,0.12)' }}>
                  Reservation
                </TableCell>
                <TableCell sx={{ color: isDarkMode ? '#FFD700' : 'primary.main', fontWeight: 600, borderBottom: isDarkMode ? '1px solid rgba(255,215,0,0.2)' : '1px solid rgba(0,0,0,0.12)' }}>
                  Amount
                </TableCell>
                <TableCell sx={{ color: isDarkMode ? '#FFD700' : 'primary.main', fontWeight: 600, borderBottom: isDarkMode ? '1px solid rgba(255,215,0,0.2)' : '1px solid rgba(0,0,0,0.12)' }}>
                  Payment Method
                </TableCell>
                <TableCell sx={{ color: isDarkMode ? '#FFD700' : 'primary.main', fontWeight: 600, borderBottom: isDarkMode ? '1px solid rgba(255,215,0,0.2)' : '1px solid rgba(0,0,0,0.12)' }}>
                  Status
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {payments?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4, borderBottom: 'none' }}>
                    <Typography sx={{ color: isDarkMode ? 'rgba(255,255,255,0.6)' : 'text.secondary' }}>No payments found</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                payments?.map((payment: Transaction) => (
                  <TableRow
                    key={payment.id}
                    sx={{
                      '&:hover': {
                        backgroundColor: isDarkMode ? 'rgba(255,215,0,0.05)' : 'rgba(25,118,210,0.05)',
                      },
                    }}
                  >
                    <TableCell sx={{ color: isDarkMode ? 'rgba(255,255,255,0.9)' : 'text.primary', borderBottom: isDarkMode ? '1px solid rgba(255,215,0,0.1)' : '1px solid rgba(0,0,0,0.12)' }}>
                      {new Date(payment.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell sx={{ color: isDarkMode ? 'rgba(255,255,255,0.9)' : 'text.primary', borderBottom: isDarkMode ? '1px solid rgba(255,215,0,0.1)' : '1px solid rgba(0,0,0,0.12)' }}>
                      {payment.reservation?.id || 'N/A'}
                    </TableCell>
                    <TableCell sx={{ color: isDarkMode ? '#FFD700' : 'primary.main', fontWeight: 600, borderBottom: isDarkMode ? '1px solid rgba(255,215,0,0.1)' : '1px solid rgba(0,0,0,0.12)' }}>
                      ${payment.amount?.toFixed(2)}
                    </TableCell>
                    <TableCell sx={{ color: isDarkMode ? 'rgba(255,255,255,0.9)' : 'text.primary', borderBottom: isDarkMode ? '1px solid rgba(255,215,0,0.1)' : '1px solid rgba(0,0,0,0.12)' }}>
                      {payment.paymentMethod || 'Stripe'}
                    </TableCell>
                    <TableCell sx={{ borderBottom: isDarkMode ? '1px solid rgba(255,215,0,0.1)' : '1px solid rgba(0,0,0,0.12)' }}>
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
    </Box>
  );
};

export default PaymentHistory;
