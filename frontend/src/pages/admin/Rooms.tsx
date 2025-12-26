import React, { useState } from 'react';
import {
  Typography,
  Chip,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Button,
  Avatar,
  Stack,
  useTheme,
  Tooltip,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  TextField,
} from '@mui/material';
import {
  Edit as EditIcon,
  Add as AddIcon,
  People as PeopleIcon,
  AttachMoney as MoneyIcon,
  MeetingRoom as RoomIcon,
  Bed as BedIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import {
  useGetAllRoomsAdminQuery,
  useGetRoomStatisticsQuery,
  useGetAllReservationsAdminQuery,
} from '../../features/admin/adminApi';
import { useDeleteRoomMutation } from '../../features/rooms/roomsApi';
import AdminLayout from '../../layouts/AdminLayout';
import Loading from '../../components/Loading';
import RoomDialog from '../../components/admin/RoomDialog';
import RoomDetailsDialog from '../../components/admin/RoomDetailsDialog';
import { Room } from '../../types';

const AdminRooms: React.FC = () => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  const [roomDialogOpen, setRoomDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState<Room | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');

  const { data: roomsData, isLoading: roomsLoading } = useGetAllRoomsAdminQuery();
  const { data: stats, isLoading: statsLoading } = useGetRoomStatisticsQuery();
  const { data: reservations, isLoading: reservationsLoading } = useGetAllReservationsAdminQuery();
  const [deleteRoom, { isLoading: isDeleting }] = useDeleteRoomMutation();

  if (roomsLoading || statsLoading || reservationsLoading) return <Loading message="Loading rooms..." />;

  // Sort rooms by updatedAt or createdAt to show newest first
  const rooms = roomsData ? [...roomsData].sort((a, b) => {
    const dateA = new Date(a.updatedAt || a.createdAt || 0);
    const dateB = new Date(b.updatedAt || b.createdAt || 0);
    return dateB.getTime() - dateA.getTime();
  }) : [];

  // Count how many reservations exist for each room type
  const roomOccupancyCount = new Map<string, number>();
  reservations
    ?.filter(r => r.status === 'CONFIRMED' || r.status === 'CHECKED_IN')
    .forEach(r => {
      const count = roomOccupancyCount.get(r.room.id) || 0;
      roomOccupancyCount.set(r.room.id, count + 1);
    });

  const handleAddRoom = () => {
    setSelectedRoom(null);
    setDialogMode('add');
    setRoomDialogOpen(true);
  };

  const handleEditRoom = (room: Room) => {
    setSelectedRoom(room);
    setDialogMode('edit');
    setRoomDialogOpen(true);
  };

  const handleViewDetails = (room: Room) => {
    setSelectedRoom(room);
    setDetailsDialogOpen(true);
  };

  const handleCloseRoomDialog = () => {
    setRoomDialogOpen(false);
    setSelectedRoom(null);
  };

  const handleCloseDetailsDialog = () => {
    setDetailsDialogOpen(false);
    setSelectedRoom(null);
  };

  const handleDeleteClick = (room: Room) => {
    setRoomToDelete(room);
    setDeleteDialogOpen(true);
    setDeleteConfirmation('');
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setRoomToDelete(null);
    setDeleteConfirmation('');
  };

  const handleConfirmDelete = async () => {
    if (!roomToDelete || deleteConfirmation !== 'DELETE') {
      return;
    }

    try {
      await deleteRoom(roomToDelete.id).unwrap();
      handleCloseDeleteDialog();
    } catch (error) {
      console.error('Failed to delete room:', error);
    }
  };

  return (
    <AdminLayout>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: isDarkMode ? '#fff' : '#1a1a1a' }}>
          Room Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddRoom}
          sx={{
            background: isDarkMode ? 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)' : 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
            color: isDarkMode ? '#000' : '#fff',
            fontWeight: 600,
            '&:hover': {
              background: isDarkMode ? 'linear-gradient(135deg, #FFA500 0%, #FFD700 100%)' : 'linear-gradient(135deg, #42a5f5 0%, #1976d2 100%)',
            },
          }}
        >
          Add New Room
        </Button>
      </Box>

      {/* Statistics Cards */}
      {stats && (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 3, mb: 4 }}>
          <Card
            sx={{
              background: isDarkMode ? 'linear-gradient(135deg, rgba(33,150,243,0.1) 0%, rgba(33,150,243,0.05) 100%)' : 'linear-gradient(135deg, rgba(33,150,243,0.1) 0%, rgba(33,150,243,0.05) 100%)',
              border: '1px solid',
              borderColor: isDarkMode ? 'rgba(33,150,243,0.3)' : 'rgba(33,150,243,0.2)',
            }}
          >
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <RoomIcon sx={{ color: '#fff', fontSize: 28 }} />
                </Box>
                <Box>
                  <Typography variant="body2" sx={{ color: isDarkMode ? 'rgba(255,255,255,0.7)' : 'text.secondary', mb: 0.5 }}>
                    Total Rooms
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: isDarkMode ? '#fff' : '#1a1a1a' }}>
                    {stats.totalRooms}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>

          <Card
            sx={{
              background: isDarkMode ? 'linear-gradient(135deg, rgba(76,175,80,0.1) 0%, rgba(76,175,80,0.05) 100%)' : 'linear-gradient(135deg, rgba(76,175,80,0.1) 0%, rgba(76,175,80,0.05) 100%)',
              border: '1px solid',
              borderColor: isDarkMode ? 'rgba(76,175,80,0.3)' : 'rgba(76,175,80,0.2)',
            }}
          >
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, #4caf50 0%, #388e3c 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <BedIcon sx={{ color: '#fff', fontSize: 28 }} />
                </Box>
                <Box>
                  <Typography variant="body2" sx={{ color: isDarkMode ? 'rgba(255,255,255,0.7)' : 'text.secondary', mb: 0.5 }}>
                    Available
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: '#4caf50' }}>
                    {stats.availableRooms}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>

          <Card
            sx={{
              background: isDarkMode ? 'linear-gradient(135deg, rgba(255,152,0,0.1) 0%, rgba(255,152,0,0.05) 100%)' : 'linear-gradient(135deg, rgba(255,152,0,0.1) 0%, rgba(255,152,0,0.05) 100%)',
              border: '1px solid',
              borderColor: isDarkMode ? 'rgba(255,152,0,0.3)' : 'rgba(255,152,0,0.2)',
            }}
          >
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <PeopleIcon sx={{ color: '#fff', fontSize: 28 }} />
                </Box>
                <Box>
                  <Typography variant="body2" sx={{ color: isDarkMode ? 'rgba(255,255,255,0.7)' : 'text.secondary', mb: 0.5 }}>
                    Occupied
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: '#ff9800' }}>
                    {stats.occupiedRooms}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Rooms Table */}
      <TableContainer
        component={Paper}
        sx={{
          bgcolor: isDarkMode ? 'rgba(26,26,26,0.95)' : 'background.paper',
          border: '1px solid',
          borderColor: isDarkMode ? 'rgba(255,215,0,0.2)' : 'divider',
        }}
      >
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: isDarkMode ? 'rgba(255,215,0,0.05)' : 'rgba(25,118,210,0.05)' }}>
              <TableCell sx={{ fontWeight: 700, color: isDarkMode ? '#FFD700' : 'primary.main' }}>Room</TableCell>
              <TableCell sx={{ fontWeight: 700, color: isDarkMode ? '#FFD700' : 'primary.main' }}>Type</TableCell>
              <TableCell sx={{ fontWeight: 700, color: isDarkMode ? '#FFD700' : 'primary.main' }}>Price/Night</TableCell>
              <TableCell sx={{ fontWeight: 700, color: isDarkMode ? '#FFD700' : 'primary.main' }}>Capacity</TableCell>
              <TableCell sx={{ fontWeight: 700, color: isDarkMode ? '#FFD700' : 'primary.main' }}>Floor</TableCell>
              <TableCell sx={{ fontWeight: 700, color: isDarkMode ? '#FFD700' : 'primary.main' }}>Total/Occupied</TableCell>
              <TableCell sx={{ fontWeight: 700, color: isDarkMode ? '#FFD700' : 'primary.main' }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 700, color: isDarkMode ? '#FFD700' : 'primary.main' }} align="right">
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rooms?.map((room: Room) => {
              const occupiedCount = roomOccupancyCount.get(room.id) || 0;
              const totalRooms = room.totalRooms || 1;
              const availableCount = totalRooms - occupiedCount;
              const isFullyOccupied = availableCount <= 0;

              return (
                <TableRow
                  key={room.id}
                  onClick={() => handleViewDetails(room)}
                  sx={{
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor: isDarkMode ? 'rgba(255,215,0,0.05)' : 'rgba(25,118,210,0.05)',
                    },
                  }}
                >
                  <TableCell>
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Avatar
                        src={room.imageUrl || 'https://via.placeholder.com/48'}
                        variant="rounded"
                        sx={{ width: 48, height: 48 }}
                      />
                      <Box>
                        <Typography variant="body1" sx={{ fontWeight: 600, color: isDarkMode ? '#fff' : '#1a1a1a' }}>
                          {room.name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: isDarkMode ? 'rgba(255,255,255,0.6)' : 'text.secondary' }}>
                          ID: {room.id.substring(0, 8)}...
                        </Typography>
                      </Box>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={room.type}
                      size="small"
                      sx={{
                        backgroundColor: isDarkMode ? 'rgba(255,215,0,0.1)' : 'rgba(25,118,210,0.1)',
                        color: isDarkMode ? '#FFD700' : 'primary.main',
                        fontWeight: 500,
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <MoneyIcon sx={{ fontSize: 16, color: isDarkMode ? '#FFD700' : 'primary.main' }} />
                      <Typography variant="body2" sx={{ fontWeight: 600, color: isDarkMode ? '#fff' : '#1a1a1a' }}>
                        ${room.pricePerNight}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ color: isDarkMode ? 'rgba(255,255,255,0.8)' : 'text.primary' }}>
                      {room.capacity} guests
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ color: isDarkMode ? 'rgba(255,255,255,0.8)' : 'text.primary' }}>
                      {room.floorNumber}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ color: isDarkMode ? 'rgba(255,255,255,0.8)' : 'text.primary' }}>
                      {totalRooms} / {occupiedCount}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={isFullyOccupied ? 'Fully Occupied' : `${availableCount} Available`}
                      size="small"
                      sx={{
                        backgroundColor: isFullyOccupied ? 'rgba(211,47,47,0.1)' : 'rgba(46,125,50,0.1)',
                        color: isFullyOccupied ? '#f44336' : '#4caf50',
                        border: '1px solid',
                        borderColor: isFullyOccupied ? 'rgba(211,47,47,0.3)' : 'rgba(46,125,50,0.3)',
                        fontWeight: 600,
                      }}
                    />
                  </TableCell>
                  <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <Tooltip title="Edit Room">
                        <IconButton
                          size="small"
                          onClick={() => handleEditRoom(room)}
                          sx={{
                            color: isDarkMode ? '#FFD700' : 'primary.main',
                            '&:hover': {
                              bgcolor: isDarkMode ? 'rgba(255,215,0,0.1)' : 'rgba(25,118,210,0.1)',
                            },
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Room">
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteClick(room)}
                          sx={{
                            color: '#f44336',
                            '&:hover': {
                              bgcolor: 'rgba(244,67,54,0.1)',
                            },
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialogs */}
      <RoomDialog
        open={roomDialogOpen}
        onClose={handleCloseRoomDialog}
        room={selectedRoom}
        mode={dialogMode}
        onSuccess={() => {
          // The room list will automatically refresh due to cache invalidation
          setSelectedRoom(null);
        }}
      />

      <RoomDetailsDialog
        open={detailsDialogOpen}
        onClose={handleCloseDetailsDialog}
        room={selectedRoom}
        occupiedCount={selectedRoom ? roomOccupancyCount.get(selectedRoom.id) || 0 : 0}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: isDarkMode ? 'rgba(26,26,26,0.98)' : 'background.paper',
            border: '2px solid',
            borderColor: '#f44336',
          },
        }}
      >
        <DialogTitle
          sx={{
            background: 'linear-gradient(135deg, rgba(244,67,54,0.1) 0%, rgba(211,47,47,0.05) 100%)',
            borderBottom: '1px solid',
            borderColor: 'rgba(244,67,54,0.3)',
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            <DeleteIcon sx={{ color: '#f44336' }} />
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#f44336' }}>
              Delete Room - Confirmation Required
            </Typography>
          </Stack>
        </DialogTitle>

        <DialogContent sx={{ pt: 3 }}>
          <DialogContentText sx={{ mb: 2, color: isDarkMode ? 'rgba(255,255,255,0.8)' : 'text.primary' }}>
            You are about to permanently delete the following room:
          </DialogContentText>

          {roomToDelete && (
            <Box
              sx={{
                p: 2,
                mb: 3,
                bgcolor: isDarkMode ? 'rgba(255,215,0,0.05)' : 'rgba(25,118,210,0.05)',
                border: '1px solid',
                borderColor: isDarkMode ? 'rgba(255,215,0,0.2)' : 'divider',
                borderRadius: 1,
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>
                {roomToDelete.name}
              </Typography>
              <Typography variant="body2" sx={{ color: isDarkMode ? 'rgba(255,255,255,0.6)' : 'text.secondary' }}>
                Type: {roomToDelete.type} • ID: {roomToDelete.id}
              </Typography>
            </Box>
          )}

          <DialogContentText sx={{ mb: 2, fontWeight: 600, color: '#f44336' }}>
            ⚠️ This action cannot be undone!
          </DialogContentText>

          <DialogContentText sx={{ mb: 2, color: isDarkMode ? 'rgba(255,255,255,0.8)' : 'text.primary' }}>
            To confirm deletion, please type <strong>DELETE</strong> in the box below:
          </DialogContentText>

          <TextField
            fullWidth
            value={deleteConfirmation}
            onChange={(e) => setDeleteConfirmation(e.target.value)}
            placeholder="Type DELETE to confirm"
            variant="outlined"
            autoComplete="off"
            sx={{
              '& .MuiOutlinedInput-root': {
                '&.Mui-focused fieldset': {
                  borderColor: deleteConfirmation === 'DELETE' ? '#4caf50' : '#f44336',
                },
              },
            }}
          />
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            py: 2,
            borderTop: '1px solid',
            borderColor: 'rgba(244,67,54,0.3)',
          }}
        >
          <Button
            onClick={handleCloseDeleteDialog}
            disabled={isDeleting}
            sx={{
              color: isDarkMode ? 'rgba(255,255,255,0.7)' : 'text.secondary',
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDelete}
            variant="contained"
            disabled={deleteConfirmation !== 'DELETE' || isDeleting}
            sx={{
              background: 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)',
              color: '#fff',
              fontWeight: 600,
              '&:hover': {
                background: 'linear-gradient(135deg, #d32f2f 0%, #f44336 100%)',
              },
              '&:disabled': {
                background: 'rgba(0,0,0,0.12)',
                color: 'rgba(0,0,0,0.26)',
              },
            }}
          >
            {isDeleting ? 'Deleting...' : 'Delete Room'}
          </Button>
        </DialogActions>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminRooms;
