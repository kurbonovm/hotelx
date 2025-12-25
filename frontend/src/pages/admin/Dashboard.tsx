import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
} from '@mui/material';
import {
  Hotel,
  People,
  CalendarMonth,
  AttachMoney,
} from '@mui/icons-material';
import { useGetDashboardOverviewQuery } from '../../features/admin/adminApi';
import AdminLayout from '../../layouts/AdminLayout';
import Loading from '../../components/Loading';
import { DashboardOverview } from '../../types';

interface StatCard {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
}

/**
 * Admin Dashboard page
 */
const AdminDashboard: React.FC = () => {
  const { data: overview, isLoading, error } = useGetDashboardOverviewQuery();

  if (isLoading) return <Loading message="Loading dashboard..." />;

  if (error || !overview) {
    return (
      <AdminLayout>
        <Typography color="error">Failed to load dashboard data</Typography>
      </AdminLayout>
    );
  }

  const stats: StatCard[] = [
    {
      title: 'Total Rooms',
      value: overview.totalRooms,
      icon: <Hotel sx={{ fontSize: 40 }} />,
      color: 'primary.main',
    },
    {
      title: 'Available Rooms',
      value: overview.availableRooms,
      icon: <Hotel sx={{ fontSize: 40 }} />,
      color: 'success.main',
    },
    {
      title: 'Occupancy Rate',
      value: `${overview.occupancyRate.toFixed(1)}%`,
      icon: <CalendarMonth sx={{ fontSize: 40 }} />,
      color: 'info.main',
    },
    {
      title: 'Active Reservations',
      value: overview.activeReservations,
      icon: <CalendarMonth sx={{ fontSize: 40 }} />,
      color: 'warning.main',
    },
    {
      title: 'Total Users',
      value: overview.totalUsers,
      icon: <People sx={{ fontSize: 40 }} />,
      color: 'secondary.main',
    },
    {
      title: 'Monthly Revenue',
      value: `$${overview.monthlyRevenue.toFixed(2)}`,
      icon: <AttachMoney sx={{ fontSize: 40 }} />,
      color: 'success.main',
    },
  ];

  return (
    <AdminLayout>
      <Typography variant="h4" gutterBottom>
        Admin Dashboard
      </Typography>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 3 }}>
        {stats.map((stat, index) => (
          <Box key={index}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ color: stat.color, mr: 2 }}>
                    {stat.icon}
                  </Box>
                  <Box>
                    <Typography color="textSecondary" variant="body2">
                      {stat.title}
                    </Typography>
                    <Typography variant="h4">{stat.value}</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Box>
        ))}
      </Box>
    </AdminLayout>
  );
};

export default AdminDashboard;
