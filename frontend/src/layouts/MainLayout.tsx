import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  AppBar,
  Box,
  Toolbar,
  IconButton,
  Typography,
  Menu,
  Container,
  Avatar,
  Button,
  Tooltip,
  MenuItem,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  useTheme,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Home as HomeIcon,
  Hotel as HotelIcon,
  EventNote as EventNoteIcon,
  AccountCircle as AccountCircleIcon,
  AdminPanelSettings as AdminIcon,
  Logout as LogoutIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
} from '@mui/icons-material';
import { selectCurrentUser, selectIsAuthenticated, logout } from '../features/auth/authSlice';
import { useThemeMode } from '../contexts/ThemeContext';

interface NavigationItem {
  text: string;
  icon: React.ReactNode;
  path: string;
}

/**
 * MainLayout component provides the main application layout with navigation
 */
const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const user = useSelector(selectCurrentUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const { mode, toggleTheme } = useThemeMode();

  const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);

  // Check if current route is an admin route
  const isAdminRoute = location.pathname.startsWith('/admin');

  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
    handleCloseUserMenu();
  };

  const toggleDrawer = (open: boolean) => (event: React.KeyboardEvent | React.MouseEvent) => {
    if (
      event.type === 'keydown' &&
      ((event as React.KeyboardEvent).key === 'Tab' ||
        (event as React.KeyboardEvent).key === 'Shift')
    ) {
      return;
    }
    setDrawerOpen(open);
  };

  // Show different navigation based on whether user is on admin routes
  const navigationItems: NavigationItem[] = isAdminRoute
    ? [
        // Admin navigation - just show option to return to main site
        { text: 'Back to Main Site', icon: <HomeIcon />, path: '/' },
      ]
    : [
        // Regular user navigation
        { text: 'Home', icon: <HomeIcon />, path: '/' },
        { text: 'Rooms', icon: <HotelIcon />, path: '/rooms' },
        ...(isAuthenticated
          ? [{ text: 'My Reservations', icon: <EventNoteIcon />, path: '/reservations' }]
          : []),
        ...(user?.roles?.includes('ADMIN') || user?.roles?.includes('MANAGER')
          ? [{ text: 'Management', icon: <AdminIcon />, path: '/admin' }]
          : []),
      ];

  const drawer = (
    <Box
      sx={{
        width: 250,
        background: isDarkMode ? 'linear-gradient(135deg, #1a1a1a 0%, #000 100%)' : 'linear-gradient(135deg, #ffffff 0%, #f5f5f5 100%)',
        height: '100%',
      }}
      role="presentation"
      onClick={toggleDrawer(false)}
      onKeyDown={toggleDrawer(false)}
    >
      <List>
        {navigationItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                onClick={() => navigate(item.path)}
                sx={{
                  borderLeft: isActive ? `3px solid ${isDarkMode ? '#FFD700' : '#1976d2'}` : '3px solid transparent',
                  backgroundColor: isActive ? (isDarkMode ? 'rgba(255,215,0,0.05)' : 'rgba(25,118,210,0.05)') : 'transparent',
                  '&:hover': {
                    backgroundColor: isDarkMode ? 'rgba(255,215,0,0.1)' : 'rgba(25,118,210,0.1)',
                  },
                }}
              >
                <ListItemIcon sx={{ color: isActive ? (isDarkMode ? '#FFD700' : '#1976d2') : (isDarkMode ? '#FFD700' : 'primary.main') }}>{item.icon}</ListItemIcon>
                <ListItemText
                  primary={item.text}
                  sx={{
                    color: isActive ? (isDarkMode ? '#FFD700' : '#1976d2') : (isDarkMode ? '#fff' : 'text.primary'),
                    fontWeight: isActive ? 600 : 400,
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar
        position="static"
        sx={{
          background: isDarkMode ? 'linear-gradient(135deg, #1a1a1a 0%, #000 100%)' : 'linear-gradient(135deg, #ffffff 0%, #f5f5f5 100%)',
          borderBottom: isDarkMode ? '1px solid rgba(255,215,0,0.2)' : '1px solid rgba(25,118,210,0.2)',
        }}
      >
        <Toolbar sx={{ px: { xs: 2, sm: 3 } }}>
            <IconButton
              size="large"
              edge="start"
              aria-label="menu"
              sx={{
                mr: 2,
                display: { xs: 'flex', md: 'none' },
                color: isDarkMode ? '#FFD700' : 'primary.main',
              }}
              onClick={toggleDrawer(true)}
            >
              <MenuIcon />
            </IconButton>

            <HotelIcon sx={{ display: { xs: 'none', md: 'flex' }, mr: 1, color: isDarkMode ? '#FFD700' : 'primary.main' }} />
            <Typography
              variant="h6"
              noWrap
              component="div"
              sx={{
                mr: 2,
                display: { xs: 'none', md: 'flex' },
                fontWeight: 700,
                cursor: 'pointer',
                background: isDarkMode ? 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)' : 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
              onClick={() => navigate('/')}
            >
              HotelX
            </Typography>

            <Typography
              variant="h6"
              noWrap
              component="div"
              sx={{
                flexGrow: 1,
                display: { xs: 'flex', md: 'none' },
                fontWeight: 700,
                cursor: 'pointer',
                background: isDarkMode ? 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)' : 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
              onClick={() => navigate('/')}
            >
              HotelX
            </Typography>

            <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' }, ml: 2 }}>
              {navigationItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Button
                    key={item.text}
                    onClick={() => navigate(item.path)}
                    sx={{
                      color: isDarkMode ? '#fff' : 'text.primary',
                      position: 'relative',
                      '&:hover': {
                        backgroundColor: isDarkMode ? 'rgba(255,215,0,0.1)' : 'rgba(25,118,210,0.1)',
                        color: isDarkMode ? '#FFD700' : 'primary.main',
                      },
                      '&::after': {
                        content: '""',
                        position: 'absolute',
                        bottom: 0,
                        left: '10%',
                        right: '10%',
                        height: '2px',
                        background: isDarkMode ? '#FFD700' : '#1976d2',
                        transform: isActive ? 'scaleX(1)' : 'scaleX(0)',
                        transition: 'transform 0.3s ease',
                      },
                      ...(isActive && {
                        color: isDarkMode ? '#FFD700' : 'primary.main',
                      }),
                    }}
                  >
                    {item.text}
                  </Button>
                );
              })}
            </Box>

            <Tooltip title={`Switch to ${mode === 'dark' ? 'light' : 'dark'} mode`}>
              <IconButton
                onClick={toggleTheme}
                sx={{
                  ml: 1,
                  color: isDarkMode ? '#FFD700' : 'primary.main',
                  '&:hover': {
                    backgroundColor: isDarkMode ? 'rgba(255,215,0,0.1)' : 'rgba(25,118,210,0.1)',
                  },
                }}
              >
                {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
              </IconButton>
            </Tooltip>

            {isAuthenticated ? (
              <Box sx={{ flexGrow: 0 }}>
                <Tooltip title="Open settings">
                  <IconButton
                    onClick={handleOpenUserMenu}
                    sx={{
                      p: 0,
                      border: isDarkMode ? '2px solid rgba(255,215,0,0.3)' : '2px solid rgba(25,118,210,0.3)',
                      '&:hover': {
                        borderColor: isDarkMode ? '#FFD700' : 'primary.main',
                      },
                    }}
                  >
                    <Avatar
                      alt={user?.firstName || 'User'}
                      src={user?.avatar}
                      sx={{
                        background: isDarkMode ? 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)' : 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
                      }}
                    />
                  </IconButton>
                </Tooltip>
                <Menu
                  sx={{
                    mt: '45px',
                    '& .MuiPaper-root': {
                      background: isDarkMode ? 'rgba(26,26,26,0.98)' : 'rgba(255,255,255,0.98)',
                      border: isDarkMode ? '1px solid rgba(255,215,0,0.2)' : '1px solid rgba(25,118,210,0.2)',
                    },
                  }}
                  id="menu-appbar"
                  anchorEl={anchorElUser}
                  anchorOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                  keepMounted
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                  open={Boolean(anchorElUser)}
                  onClose={handleCloseUserMenu}
                >
                  <MenuItem
                    onClick={() => { navigate('/profile'); handleCloseUserMenu(); }}
                    sx={{
                      '&:hover': {
                        backgroundColor: isDarkMode ? 'rgba(255,215,0,0.1)' : 'rgba(25,118,210,0.1)',
                      },
                    }}
                  >
                    <ListItemIcon>
                      <AccountCircleIcon fontSize="small" sx={{ color: isDarkMode ? '#FFD700' : 'primary.main' }} />
                    </ListItemIcon>
                    <Typography sx={{ color: isDarkMode ? '#fff' : 'text.primary' }}>Profile</Typography>
                  </MenuItem>
                  <Divider sx={{ borderColor: isDarkMode ? 'rgba(255,215,0,0.2)' : 'rgba(25,118,210,0.2)' }} />
                  <MenuItem
                    onClick={handleLogout}
                    sx={{
                      '&:hover': {
                        backgroundColor: isDarkMode ? 'rgba(255,215,0,0.1)' : 'rgba(25,118,210,0.1)',
                      },
                    }}
                  >
                    <ListItemIcon>
                      <LogoutIcon fontSize="small" sx={{ color: isDarkMode ? '#FFD700' : 'primary.main' }} />
                    </ListItemIcon>
                    <Typography sx={{ color: isDarkMode ? '#fff' : 'text.primary' }}>Logout</Typography>
                  </MenuItem>
                </Menu>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  onClick={() => navigate('/login')}
                  sx={{
                    color: isDarkMode ? '#fff' : 'text.primary',
                    borderColor: isDarkMode ? 'rgba(255,215,0,0.3)' : 'rgba(25,118,210,0.3)',
                    '&:hover': {
                      borderColor: isDarkMode ? '#FFD700' : 'primary.main',
                      backgroundColor: isDarkMode ? 'rgba(255,215,0,0.1)' : 'rgba(25,118,210,0.1)',
                      color: isDarkMode ? '#FFD700' : 'primary.main',
                    },
                  }}
                >
                  Login
                </Button>
                <Button
                  onClick={() => navigate('/register')}
                  sx={{
                    background: isDarkMode ? 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)' : 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
                    color: isDarkMode ? '#000' : '#fff',
                    fontWeight: 600,
                    '&:hover': {
                      background: isDarkMode ? 'linear-gradient(135deg, #FFA500 0%, #FFD700 100%)' : 'linear-gradient(135deg, #42a5f5 0%, #1976d2 100%)',
                    },
                  }}
                >
                  Register
                </Button>
              </Box>
            )}
          </Toolbar>
      </AppBar>

      <Drawer anchor="left" open={drawerOpen} onClose={toggleDrawer(false)}>
        {drawer}
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1 }}>
        <Outlet />
      </Box>

      <Box
        component="footer"
        sx={{
          py: 3,
          px: 2,
          mt: 'auto',
          background: isDarkMode ? 'linear-gradient(135deg, #1a1a1a 0%, #000 100%)' : 'linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%)',
          borderTop: isDarkMode ? '1px solid rgba(255,215,0,0.2)' : '1px solid rgba(25,118,210,0.2)',
        }}
      >
        <Container maxWidth="xl">
          <Typography variant="body2" align="center" sx={{ color: isDarkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)' }}>
            © 2025 HotelX. All rights reserved.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};

export default MainLayout;
