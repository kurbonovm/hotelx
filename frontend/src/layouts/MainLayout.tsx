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
        background: 'linear-gradient(135deg, #1a1a1a 0%, #000 100%)',
        height: '100%',
      }}
      role="presentation"
      onClick={toggleDrawer(false)}
      onKeyDown={toggleDrawer(false)}
    >
      <List>
        {navigationItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              onClick={() => navigate(item.path)}
              sx={{
                '&:hover': {
                  backgroundColor: 'rgba(255,215,0,0.1)',
                },
              }}
            >
              <ListItemIcon sx={{ color: '#FFD700' }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} sx={{ color: '#fff' }} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar
        position="static"
        sx={{
          background: 'linear-gradient(135deg, #1a1a1a 0%, #000 100%)',
          borderBottom: '1px solid rgba(255,215,0,0.2)',
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
                color: '#FFD700',
              }}
              onClick={toggleDrawer(true)}
            >
              <MenuIcon />
            </IconButton>

            <HotelIcon sx={{ display: { xs: 'none', md: 'flex' }, mr: 1, color: '#FFD700' }} />
            <Typography
              variant="h6"
              noWrap
              component="div"
              sx={{
                mr: 2,
                display: { xs: 'none', md: 'flex' },
                fontWeight: 700,
                cursor: 'pointer',
                background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
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
                background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
              onClick={() => navigate('/')}
            >
              HotelX
            </Typography>

            <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' }, ml: 2 }}>
              {navigationItems.map((item) => (
                <Button
                  key={item.text}
                  onClick={() => navigate(item.path)}
                  sx={{
                    color: '#fff',
                    '&:hover': {
                      backgroundColor: 'rgba(255,215,0,0.1)',
                      color: '#FFD700',
                    },
                  }}
                >
                  {item.text}
                </Button>
              ))}
            </Box>

            <Tooltip title={`Switch to ${mode === 'dark' ? 'light' : 'dark'} mode`}>
              <IconButton
                onClick={toggleTheme}
                sx={{
                  ml: 1,
                  color: '#FFD700',
                  '&:hover': {
                    backgroundColor: 'rgba(255,215,0,0.1)',
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
                      border: '2px solid rgba(255,215,0,0.3)',
                      '&:hover': {
                        borderColor: '#FFD700',
                      },
                    }}
                  >
                    <Avatar
                      alt={user?.firstName || 'User'}
                      src={user?.avatar}
                      sx={{
                        background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                      }}
                    />
                  </IconButton>
                </Tooltip>
                <Menu
                  sx={{
                    mt: '45px',
                    '& .MuiPaper-root': {
                      background: 'rgba(26,26,26,0.98)',
                      border: '1px solid rgba(255,215,0,0.2)',
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
                        backgroundColor: 'rgba(255,215,0,0.1)',
                      },
                    }}
                  >
                    <ListItemIcon>
                      <AccountCircleIcon fontSize="small" sx={{ color: '#FFD700' }} />
                    </ListItemIcon>
                    <Typography sx={{ color: '#fff' }}>Profile</Typography>
                  </MenuItem>
                  <Divider sx={{ borderColor: 'rgba(255,215,0,0.2)' }} />
                  <MenuItem
                    onClick={handleLogout}
                    sx={{
                      '&:hover': {
                        backgroundColor: 'rgba(255,215,0,0.1)',
                      },
                    }}
                  >
                    <ListItemIcon>
                      <LogoutIcon fontSize="small" sx={{ color: '#FFD700' }} />
                    </ListItemIcon>
                    <Typography sx={{ color: '#fff' }}>Logout</Typography>
                  </MenuItem>
                </Menu>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  onClick={() => navigate('/login')}
                  sx={{
                    color: '#fff',
                    borderColor: 'rgba(255,215,0,0.3)',
                    '&:hover': {
                      borderColor: '#FFD700',
                      backgroundColor: 'rgba(255,215,0,0.1)',
                      color: '#FFD700',
                    },
                  }}
                >
                  Login
                </Button>
                <Button
                  onClick={() => navigate('/register')}
                  sx={{
                    background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                    color: '#000',
                    fontWeight: 600,
                    '&:hover': {
                      background: 'linear-gradient(135deg, #FFA500 0%, #FFD700 100%)',
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
          background: 'linear-gradient(135deg, #1a1a1a 0%, #000 100%)',
          borderTop: '1px solid rgba(255,215,0,0.2)',
        }}
      >
        <Container maxWidth="xl">
          <Typography variant="body2" align="center" sx={{ color: 'rgba(255,255,255,0.7)' }}>
            © 2025 HotelX. All rights reserved.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};

export default MainLayout;
