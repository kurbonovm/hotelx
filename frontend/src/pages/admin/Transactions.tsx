import React, { useState } from 'react';
import {
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Divider,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Schedule,
  Search,
  Receipt,
  CreditCard,
  Person,
  CalendarToday,
  AttachMoney,
} from '@mui/icons-material';
import { useGetAllPaymentsQuery } from '../../features/payments/paymentsApi';
import AdminLayout from '../../layouts/AdminLayout';
import { Transaction } from '../../types';

// Extended transaction type for admin view with additional Stripe fields
interface ExtendedTransaction extends Transaction {
  cardBrand?: string;
  cardLast4?: string;
  receiptUrl?: string;
  stripeChargeId?: string;
  user?: {
    email?: string;
    firstName?: string;
    lastName?: string;
  };
  refundAmount?: number;
  refundedAt?: string;
  refundReason?: string;
}

/**
 * Admin Transactions page component
 * Shows all payment transactions with detailed Stripe information
 */
const AdminTransactions: React.FC = () => {
  const { data: payments, isLoading, error } = useGetAllPaymentsQuery();
  const [selectedPayment, setSelectedPayment] = useState<ExtendedTransaction | null>(null);
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');

  const handleViewDetails = (payment: ExtendedTransaction) => {
    setSelectedPayment(payment);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedPayment(null);
  };

  const getStatusColor = (status: string | undefined): 'success' | 'warning' | 'info' | 'error' | 'default' => {
    switch (status?.toLowerCase()) {
      case 'succeeded':
        return 'success';
      case 'pending':
        return 'warning';
      case 'processing':
        return 'info';
      case 'failed':
        return 'error';
      case 'refunded':
      case 'partially_refunded':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string | undefined): React.ReactNode => {
    switch (status?.toLowerCase()) {
      case 'succeeded':
        return <CheckCircle />;
      case 'pending':
      case 'processing':
        return <Schedule />;
      case 'failed':
      case 'refunded':
        return <Cancel />;
      default:
        return null;
    }
  };

  const filteredPayments = payments
    ?.filter((payment: ExtendedTransaction) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        payment.id?.toLowerCase().includes(searchLower) ||
        payment.user?.email?.toLowerCase().includes(searchLower) ||
        payment.stripePaymentIntentId?.toLowerCase().includes(searchLower) ||
        payment.reservation?.id?.toLowerCase().includes(searchLower)
      );
    })
    .sort((a, b) => {
      // Sort by createdAt in descending order (most recent first)
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA;
    });

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <Alert severity="error">Failed to load transactions. Please try again later.</Alert>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Typography variant="h3" component="h1" gutterBottom sx={{ mb: 3 }}>
        Payment Transactions
      </Typography>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AttachMoney color="primary" />
                <Typography variant="h6">Total Revenue</Typography>
              </Box>
              <Typography variant="h4" sx={{ mt: 1 }}>
                ${payments?.reduce((sum, p) => sum + (p.status === 'SUCCEEDED' ? Number(p.amount) : 0), 0).toFixed(2) || '0.00'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CheckCircle color="success" />
                <Typography variant="h6">Successful</Typography>
              </Box>
              <Typography variant="h4" sx={{ mt: 1 }}>
                {payments?.filter(p => p.status === 'SUCCEEDED').length || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Schedule color="warning" />
                <Typography variant="h6">Pending</Typography>
              </Box>
              <Typography variant="h4" sx={{ mt: 1 }}>
                {payments?.filter(p => p.status === 'PENDING' || p.status === 'PROCESSING').length || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Cancel color="error" />
                <Typography variant="h6">Failed/Refunded</Typography>
              </Box>
              <Typography variant="h4" sx={{ mt: 1 }}>
                {payments?.filter(p => p.status === 'FAILED' || p.status === 'REFUNDED').length || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search */}
      <TextField
        fullWidth
        placeholder="Search by payment ID, user email, Stripe ID, or reservation ID..."
        value={searchTerm}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
        sx={{ mb: 3 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search />
            </InputAdornment>
          ),
        }}
      />

      {/* Transactions Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>Payment ID</strong></TableCell>
              <TableCell><strong>User</strong></TableCell>
              <TableCell><strong>Amount</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
              <TableCell><strong>Payment Method</strong></TableCell>
              <TableCell><strong>Date</strong></TableCell>
              <TableCell><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredPayments && filteredPayments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Alert severity="info">No transactions found.</Alert>
                </TableCell>
              </TableRow>
            ) : (
              filteredPayments?.map((payment: ExtendedTransaction) => (
                <TableRow key={payment.id} hover>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                      {payment.id.substring(0, 8)}...
                    </Typography>
                  </TableCell>
                  <TableCell>{payment.user?.email || 'N/A'}</TableCell>
                  <TableCell>
                    <strong>${Number(payment.amount).toFixed(2)}</strong> {payment.currency}
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={getStatusIcon(payment.status)}
                      label={payment.status}
                      color={getStatusColor(payment.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {payment.cardBrand && payment.cardLast4 ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <CreditCard fontSize="small" />
                        {payment.cardBrand} ••{payment.cardLast4}
                      </Box>
                    ) : (
                      'N/A'
                    )}
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2">
                        {new Date(payment.createdAt).toLocaleDateString()}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(payment.createdAt).toLocaleTimeString()}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<Receipt />}
                      onClick={() => handleViewDetails(payment)}
                    >
                      Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Payment Details Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Receipt />
            Payment Transaction Details
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedPayment && (
            <Box>
              {/* Status */}
              <Box sx={{ mb: 3, textAlign: 'center' }}>
                <Chip
                  icon={getStatusIcon(selectedPayment.status)}
                  label={selectedPayment.status}
                  color={getStatusColor(selectedPayment.status)}
                  size="medium"
                  sx={{ fontSize: '1.1rem', py: 2.5 }}
                />
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Payment Information */}
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AttachMoney />
                Payment Information
              </Typography>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="body2" color="text.secondary">Payment ID</Typography>
                  <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>{selectedPayment.id}</Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="body2" color="text.secondary">Amount</Typography>
                  <Typography variant="body1">
                    <strong>${Number(selectedPayment.amount).toFixed(2)}</strong> {selectedPayment.currency}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="body2" color="text.secondary">Stripe Payment Intent</Typography>
                  <Typography variant="body1" sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                    {selectedPayment.stripePaymentIntentId}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="body2" color="text.secondary">Stripe Charge ID</Typography>
                  <Typography variant="body1" sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                    {selectedPayment.stripeChargeId || 'N/A'}
                  </Typography>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              {/* Customer Information */}
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Person />
                Customer Information
              </Typography>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="body2" color="text.secondary">Email</Typography>
                  <Typography variant="body1">{selectedPayment.user?.email || 'N/A'}</Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="body2" color="text.secondary">Name</Typography>
                  <Typography variant="body1">
                    {selectedPayment.user?.firstName} {selectedPayment.user?.lastName}
                  </Typography>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              {/* Payment Method */}
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CreditCard />
                Payment Method
              </Typography>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="body2" color="text.secondary">Card Brand</Typography>
                  <Typography variant="body1">{selectedPayment.cardBrand || 'N/A'}</Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="body2" color="text.secondary">Last 4 Digits</Typography>
                  <Typography variant="body1">••••{selectedPayment.cardLast4 || 'N/A'}</Typography>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              {/* Dates */}
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CalendarToday />
                Dates
              </Typography>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="body2" color="text.secondary">Created</Typography>
                  <Typography variant="body1">
                    {new Date(selectedPayment.createdAt).toLocaleString()}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="body2" color="text.secondary">Last Updated</Typography>
                  <Typography variant="body1">
                    {selectedPayment.updatedAt ? new Date(selectedPayment.updatedAt).toLocaleString() : 'N/A'}
                  </Typography>
                </Grid>
              </Grid>

              {/* Refund Information */}
              {selectedPayment.refundAmount && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    <Typography variant="h6" gutterBottom>Refund Information</Typography>
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 6 }}>
                        <Typography variant="body2" color="text.secondary">Refund Amount</Typography>
                        <Typography variant="body1">
                          <strong>${Number(selectedPayment.refundAmount).toFixed(2)}</strong>
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 6 }}>
                        <Typography variant="body2" color="text.secondary">Refund Date</Typography>
                        <Typography variant="body1">
                          {selectedPayment.refundedAt ? new Date(selectedPayment.refundedAt).toLocaleString() : 'N/A'}
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 12 }}>
                        <Typography variant="body2" color="text.secondary">Reason</Typography>
                        <Typography variant="body1">{selectedPayment.refundReason || 'N/A'}</Typography>
                      </Grid>
                    </Grid>
                  </Alert>
                </>
              )}

              {/* Receipt */}
              {selectedPayment.receiptUrl && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Button
                    variant="contained"
                    fullWidth
                    startIcon={<Receipt />}
                    href={selectedPayment.receiptUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View Stripe Receipt
                  </Button>
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Close</Button>
        </DialogActions>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminTransactions;
