import React, { useState } from 'react';
import {
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Box,
  TextField,
  InputAdornment,
  Grid,
  SelectChangeEvent,
} from '@mui/material';
import { Search, FilterList } from '@mui/icons-material';
import {
  useGetAllReservationsAdminQuery,
  useGetReservationStatisticsQuery,
  useUpdateReservationStatusMutation,
} from '../../features/admin/adminApi';
import AdminLayout from '../../layouts/AdminLayout';
import Loading from '../../components/Loading';
import { Reservation, ReservationStatus } from '../../types';

/**
 * Helper function to parse date string without timezone conversion
 */
const parseDate = (dateStr: string): Date => {
  if (!dateStr) return new Date();
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const AdminReservations: React.FC = () => {
  const { data: reservations, isLoading: reservationsLoading } = useGetAllReservationsAdminQuery();
  const { data: stats, isLoading: statsLoading } = useGetReservationStatisticsQuery();
  const [updateStatus] = useUpdateReservationStatusMutation();

  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState<boolean>(false);
  const [newStatus, setNewStatus] = useState<ReservationStatus>('PENDING');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  if (reservationsLoading || statsLoading) return <Loading message="Loading reservations..." />;

  const filteredReservations = reservations
    ?.filter((reservation: Reservation) => {
      const matchesSearch = searchTerm === '' ||
        reservation.user?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reservation.user?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reservation.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reservation.room?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reservation.id?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'ALL' || reservation.status === statusFilter;

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      // Sort by createdAt in descending order (most recent first)
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA;
    });

  const handleStatusChange = async () => {
    if (selectedReservation && newStatus) {
      try {
        await updateStatus({ id: selectedReservation.id, status: newStatus }).unwrap();
        setStatusDialogOpen(false);
        setSelectedReservation(null);
      } catch (err) {
        console.error('Failed to update status:', err);
      }
    }
  };

  const getStatusColor = (status: string | undefined): 'success' | 'warning' | 'error' | 'info' | 'default' => {
    switch (status) {
      case 'CONFIRMED':
        return 'success';
      case 'PENDING':
        return 'warning';
      case 'CANCELLED':
        return 'error';
      case 'CHECKED_IN':
        return 'info';
      case 'CHECKED_OUT':
        return 'default';
      default:
        return 'default';
    }
  };

  return (
    <AdminLayout>
      <Typography variant="h4" gutterBottom>
        Reservation Management
      </Typography>

      {stats && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="h6">Total Reservations</Typography>
              <Typography variant="h4">{stats.totalReservations}</Typography>
            </Box>
            <Box>
              <Typography variant="h6">Total Revenue</Typography>
              <Typography variant="h4" color="success.main">
                ${stats.totalRevenue?.toFixed(2)}
              </Typography>
            </Box>
          </Box>
        </Paper>
      )}

      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 8 }}>
            <TextField
              fullWidth
              placeholder="Search by guest name, email, room, or reservation ID..."
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <FormControl fullWidth>
              <InputLabel>Filter by Status</InputLabel>
              <Select
                value={statusFilter}
                label="Filter by Status"
                onChange={(e: SelectChangeEvent) => setStatusFilter(e.target.value)}
                startAdornment={
                  <InputAdornment position="start">
                    <FilterList />
                  </InputAdornment>
                }
              >
                <MenuItem value="ALL">All Statuses</MenuItem>
                <MenuItem value="PENDING">Pending</MenuItem>
                <MenuItem value="CONFIRMED">Confirmed</MenuItem>
                <MenuItem value="CHECKED_IN">Checked In</MenuItem>
                <MenuItem value="CHECKED_OUT">Checked Out</MenuItem>
                <MenuItem value="CANCELLED">Cancelled</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Guest</TableCell>
              <TableCell>Room</TableCell>
              <TableCell>Check-in</TableCell>
              <TableCell>Check-out</TableCell>
              <TableCell>Guests</TableCell>
              <TableCell>Total</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredReservations?.map((reservation: Reservation) => (
              <TableRow key={reservation.id}>
                <TableCell>
                  {reservation.user?.firstName} {reservation.user?.lastName}
                </TableCell>
                <TableCell>{reservation.room?.name}</TableCell>
                <TableCell>
                  <Box>
                    <Typography variant="body2">
                      {parseDate(reservation.checkInDate).toLocaleDateString()}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {reservation.checkInTime || '3:00 PM'}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box>
                    <Typography variant="body2">
                      {parseDate(reservation.checkOutDate).toLocaleDateString()}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {reservation.checkOutTime || '11:00 AM'}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>{reservation.numberOfGuests}</TableCell>
                <TableCell>${reservation.totalAmount?.toFixed(2)}</TableCell>
                <TableCell>
                  <Chip
                    label={reservation.status}
                    color={getStatusColor(reservation.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Button
                    size="small"
                    onClick={() => {
                      setSelectedReservation(reservation);
                      setNewStatus(reservation.status);
                      setStatusDialogOpen(true);
                    }}
                  >
                    Update
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={statusDialogOpen} onClose={() => setStatusDialogOpen(false)}>
        <DialogTitle>Update Reservation Status</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={newStatus}
              onChange={(e: SelectChangeEvent<ReservationStatus>) => setNewStatus(e.target.value as ReservationStatus)}
              label="Status"
            >
              <MenuItem value="PENDING">Pending</MenuItem>
              <MenuItem value="CONFIRMED">Confirmed</MenuItem>
              <MenuItem value="CHECKED_IN">Checked In</MenuItem>
              <MenuItem value="CHECKED_OUT">Checked Out</MenuItem>
              <MenuItem value="CANCELLED">Cancelled</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleStatusChange} variant="contained">
            Update
          </Button>
        </DialogActions>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminReservations;
