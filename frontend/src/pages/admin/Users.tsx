import React, { useState, useMemo } from 'react';
import {
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  TextField,
  Box,
  IconButton,
  Tooltip,
  DialogContentText,
  CircularProgress,
  InputAdornment,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Search as SearchIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import {
  useGetAllUsersQuery,
  useUpdateUserStatusMutation,
  useDeleteUserMutation,
} from '../../features/admin/adminApi';
import AdminLayout from '../../layouts/AdminLayout';
import Loading from '../../components/Loading';
import Notification from '../../components/Notification';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../features/auth/authSlice';
import { User } from '../../types';

interface NotificationState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'info' | 'warning';
}

const AdminUsers: React.FC = () => {
  const { data: users, isLoading, error } = useGetAllUsersQuery();
  const [updateUserStatus, { isLoading: isUpdatingStatus }] = useUpdateUserStatusMutation();
  const [deleteUser, { isLoading: isDeleting }] = useDeleteUserMutation();

  const currentUser = useSelector(selectCurrentUser);

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [notification, setNotification] = useState<NotificationState>({
    open: false,
    message: '',
    severity: 'info',
  });

  // Filter users based on search term
  const filteredUsers = useMemo(() => {
    if (!users) return [];
    if (!searchTerm) return users;

    const lowerSearch = searchTerm.toLowerCase();
    return users.filter(
      (user) =>
        user.firstName.toLowerCase().includes(lowerSearch) ||
        user.lastName.toLowerCase().includes(lowerSearch) ||
        user.email.toLowerCase().includes(lowerSearch) ||
        user.phoneNumber?.toLowerCase().includes(lowerSearch)
    );
  }, [users, searchTerm]);

  const showNotification = (message: string, severity: NotificationState['severity']) => {
    setNotification({ open: true, message, severity });
  };

  const closeNotification = () => {
    setNotification((prev) => ({ ...prev, open: false }));
  };

  // Check if user is trying to modify themselves
  const isSelfModification = (userId: string): boolean => {
    return currentUser?.id === userId;
  };

  const handleStatusToggle = async (user: User) => {
    // Prevent self-modification
    if (isSelfModification(user.id)) {
      showNotification('You cannot disable your own account', 'warning');
      return;
    }

    try {
      await updateUserStatus({ id: user.id, enabled: !user.enabled }).unwrap();
      showNotification(
        `User ${user.enabled ? 'disabled' : 'enabled'} successfully`,
        'success'
      );
    } catch (err: any) {
      console.error('Failed to update status:', err);
      showNotification(
        err?.data?.message || 'Failed to update user status. Please try again.',
        'error'
      );
    }
  };

  const handleOpenDeleteDialog = (user: User) => {
    // Prevent self-deletion
    if (isSelfModification(user.id)) {
      showNotification('You cannot delete your own account', 'warning');
      return;
    }

    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      await deleteUser(selectedUser.id).unwrap();
      showNotification('User deleted successfully', 'success');
      setDeleteDialogOpen(false);
      setSelectedUser(null);
    } catch (err: any) {
      console.error('Failed to delete user:', err);
      showNotification(
        err?.data?.message || 'Failed to delete user. Please try again.',
        'error'
      );
    }
  };

  if (isLoading) return <Loading message="Loading users..." />;

  if (error) {
    return (
      <AdminLayout>
        <Alert severity="error">Failed to load users. Please try again later.</Alert>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          User Management
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Manage user accounts, roles, and permissions
        </Typography>
      </Box>

      {/* Search Box */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search by name, email, or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {/* User Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Roles</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                    {searchTerm ? 'No users found matching your search' : 'No users available'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user: User) => {
                const isCurrentUser = isSelfModification(user.id);
                return (
                  <TableRow
                    key={user.id}
                    sx={{
                      backgroundColor: isCurrentUser ? 'action.hover' : 'inherit',
                    }}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {user.firstName} {user.lastName}
                        {isCurrentUser && (
                          <Chip label="You" size="small" color="primary" variant="outlined" />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.phoneNumber || '-'}</TableCell>
                    <TableCell>
                      {user.roles.map((role) => (
                        <Chip
                          key={role}
                          label={role}
                          size="small"
                          color={role === 'ADMIN' ? 'error' : role === 'MANAGER' ? 'warning' : 'default'}
                          sx={{ mr: 0.5 }}
                        />
                      ))}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={user.enabled ? 'Active' : 'Disabled'}
                        color={user.enabled ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                        <Tooltip
                          title={
                            isCurrentUser
                              ? 'Cannot disable your own account'
                              : user.enabled
                              ? 'Disable User'
                              : 'Enable User'
                          }
                        >
                          <span>
                            <Button
                              size="small"
                              onClick={() => handleStatusToggle(user)}
                              disabled={isCurrentUser || isUpdatingStatus}
                              variant="outlined"
                              color={user.enabled ? 'warning' : 'success'}
                            >
                              {isUpdatingStatus ? (
                                <CircularProgress size={20} />
                              ) : user.enabled ? (
                                'Disable'
                              ) : (
                                'Enable'
                              )}
                            </Button>
                          </span>
                        </Tooltip>
                        <Tooltip
                          title={isCurrentUser ? 'Cannot delete your own account' : 'Delete User'}
                        >
                          <span>
                            <IconButton
                              size="small"
                              onClick={() => handleOpenDeleteDialog(user)}
                              disabled={isCurrentUser || isDeleting}
                              color="error"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningIcon color="error" />
          Confirm Delete
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete user <strong>{selectedUser?.firstName} {selectedUser?.lastName}</strong>?
            <br />
            <br />
            This action cannot be undone. All associated data including reservations will be affected.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={isDeleting}>
            Cancel
          </Button>
          <Button onClick={handleDeleteUser} color="error" variant="contained" disabled={isDeleting}>
            {isDeleting ? <CircularProgress size={24} /> : 'Delete User'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notification */}
      <Notification
        open={notification.open}
        onClose={closeNotification}
        message={notification.message}
        severity={notification.severity}
      />
    </AdminLayout>
  );
};

export default AdminUsers;
