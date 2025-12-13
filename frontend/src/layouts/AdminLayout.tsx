import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../features/auth/authSlice';
import {
  Container,
  Box,
  Tabs,
  Tab,
  Paper,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Hotel as HotelIcon,
  CalendarMonth as CalendarIcon,
  Receipt as ReceiptIcon,
} from '@mui/icons-material';
import { Role } from '../types';

interface AdminLayoutProps {
  children: React.ReactNode;
}

interface TabConfig {
  label: string;
  path: string;
  icon: React.ReactNode;
  roles: Role[];
}

/**
 * AdminLayout component provides navigation for admin pages
 */
const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector(selectCurrentUser);

  const allTabs: TabConfig[] = [
    { label: 'Dashboard', path: '/admin/dashboard', icon: <DashboardIcon />, roles: ['ADMIN', 'MANAGER'] },
    { label: 'Users', path: '/admin/users', icon: <PeopleIcon />, roles: ['ADMIN'] },
    { label: 'Rooms', path: '/admin/rooms', icon: <HotelIcon />, roles: ['ADMIN', 'MANAGER'] },
    { label: 'Reservations', path: '/admin/reservations', icon: <CalendarIcon />, roles: ['ADMIN', 'MANAGER'] },
    { label: 'Transactions', path: '/admin/transactions', icon: <ReceiptIcon />, roles: ['ADMIN', 'MANAGER'] },
  ];

  // Filter tabs based on user role
  const tabs = allTabs.filter(tab =>
    tab.roles.some(role => user?.roles?.includes(role))
  );

  const currentTab = tabs.findIndex((tab) => location.pathname === tab.path);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    navigate(tabs[newValue].path);
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 3 }}>
        <Paper elevation={2}>
          <Tabs
            value={currentTab !== -1 ? currentTab : 0}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              borderBottom: 1,
              borderColor: 'divider',
            }}
          >
            {tabs.map((tab, index) => (
              <Tab
                key={tab.path}
                label={tab.label}
                icon={tab.icon}
                iconPosition="start"
                sx={{
                  minHeight: 64,
                  textTransform: 'none',
                  fontSize: '1rem',
                }}
              />
            ))}
          </Tabs>
        </Paper>
      </Box>
      <Box>{children}</Box>
    </Container>
  );
};

export default AdminLayout;
