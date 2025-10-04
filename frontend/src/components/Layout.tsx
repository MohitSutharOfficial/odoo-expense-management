import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
    Box,
    Drawer,
    AppBar,
    Toolbar,
    List,
    Typography,
    Divider,
    IconButton,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Avatar,
    Badge,
    Menu,
    MenuItem,
    Tooltip,
    CircularProgress,
    Snackbar,
    Alert,
} from '@mui/material';
import {
    Dashboard as DashboardIcon,
    Receipt,
    CheckCircle,
    Settings,
    Logout,
    Notifications,
    AccountBalanceWallet,
    Add,
    GitHub,
} from '@mui/icons-material';
import { useAuthStore, useNotificationStore } from '../store';
import { notificationAPI } from '../services/api';

const drawerWidth = 260;

const menuItems = [
    { title: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { title: 'My Expenses', icon: <Receipt />, path: '/expenses' },
    { title: 'Approvals', icon: <CheckCircle />, path: '/approvals', roles: ['MANAGER', 'FINANCE', 'ADMIN'] },
    { title: 'Settings', icon: <Settings />, path: '/settings' },
];

function Layout() {
    const navigate = useNavigate();
    const location = useLocation();
    const user = useAuthStore((state) => state.user);
    const logout = useAuthStore((state) => state.logout);
    const notifications = useNotificationStore((state) => state.notifications);
    const unreadCount = useNotificationStore((state) => state.unreadCount);
    const setNotifications = useNotificationStore((state) => state.setNotifications);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [notifAnchor, setNotifAnchor] = useState<null | HTMLElement>(null);
    const [notificationsLoaded, setNotificationsLoaded] = useState(false);
    const [logoutLoading, setLogoutLoading] = useState(false);
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({
        open: false,
        message: '',
        severity: 'info'
    });

    useEffect(() => {
        if (!notificationsLoaded) {
            loadNotifications();
        }
    }, [notificationsLoaded]);

    const loadNotifications = async () => {
        try {
            const response = await notificationAPI.getAll();
            setNotifications(response.data);
            setNotificationsLoaded(true);
        } catch (error) {
            console.error('Failed to load notifications:', error);
        }
    };

    const handleLogout = async () => {
        setLogoutLoading(true);
        try {
            // Close menu first
            setAnchorEl(null);

            // Show logout message
            setSnackbar({
                open: true,
                message: 'Logging out...',
                severity: 'info'
            });

            // Add a small delay for UX
            await new Promise(resolve => setTimeout(resolve, 500));

            // Perform logout
            logout();

            // Navigate to home
            navigate('/');
        } catch (error) {
            console.error('Logout error:', error);
            setSnackbar({
                open: true,
                message: 'Logout failed. Please try again.',
                severity: 'error'
            });
        } finally {
            setLogoutLoading(false);
        }
    };

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    const filteredMenuItems = menuItems.filter(
        (item) => !item.roles || (user && item.roles.includes(user.role))
    );

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f0f0f1' }}>
            {/* Top AppBar */}
            <AppBar
                position="fixed"
                elevation={0}
                sx={{
                    zIndex: (theme) => theme.zIndex.drawer + 1,
                    backgroundColor: '#714B67',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                }}
            >
                <Toolbar>
                    <AccountBalanceWallet sx={{ mr: 2, fontSize: 32 }} />
                    <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, fontWeight: 700 }}>
                        Expense Manager
                    </Typography>

                    {/* GitHub Link */}
                    <Tooltip title="View on GitHub">
                        <IconButton
                            color="inherit"
                            component="a"
                            href="https://github.com/MohitSutharOfficial/odoo-expense-management.git"
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{ mr: 1 }}
                        >
                            <GitHub />
                        </IconButton>
                    </Tooltip>

                    {/* Notifications */}
                    <Tooltip title="Notifications">
                        <IconButton
                            color="inherit"
                            onClick={(e) => setNotifAnchor(e.currentTarget)}
                            sx={{ mr: 1 }}
                        >
                            <Badge badgeContent={unreadCount} color="error">
                                <Notifications />
                            </Badge>
                        </IconButton>
                    </Tooltip>

                    {/* User Menu */}
                    <Tooltip title="Account">
                        <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} sx={{ p: 0 }}>
                            <Avatar
                                src={user?.avatar || undefined}
                                sx={{ bgcolor: 'secondary.main', width: 36, height: 36 }}
                            >
                                {user?.name.charAt(0).toUpperCase()}
                            </Avatar>
                        </IconButton>
                    </Tooltip>

                    <Menu
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl)}
                        onClose={() => setAnchorEl(null)}
                        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                    >
                        <Box sx={{ px: 2, py: 1.5, minWidth: 220 }}>
                            <Typography variant="subtitle2" fontWeight={600}>
                                {user?.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {user?.email}
                            </Typography>
                            <Typography
                                variant="caption"
                                sx={{
                                    display: 'block',
                                    mt: 0.5,
                                    px: 1,
                                    py: 0.3,
                                    bgcolor: 'primary.main',
                                    color: 'white',
                                    borderRadius: 1,
                                    width: 'fit-content',
                                    fontSize: '0.7rem',
                                    fontWeight: 600,
                                }}
                            >
                                {user?.role}
                            </Typography>
                        </Box>
                        <Divider />
                        <MenuItem onClick={() => { setAnchorEl(null); navigate('/settings'); }}>
                            <ListItemIcon><Settings fontSize="small" /></ListItemIcon>
                            Settings
                        </MenuItem>
                        <MenuItem onClick={handleLogout} disabled={logoutLoading}>
                            <ListItemIcon>
                                {logoutLoading ? <CircularProgress size={20} /> : <Logout fontSize="small" />}
                            </ListItemIcon>
                            {logoutLoading ? 'Logging out...' : 'Logout'}
                        </MenuItem>
                    </Menu>

                    {/* Notifications Menu */}
                    <Menu
                        anchorEl={notifAnchor}
                        open={Boolean(notifAnchor)}
                        onClose={() => setNotifAnchor(null)}
                        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                        PaperProps={{ sx: { width: 360, maxHeight: 480 } }}
                    >
                        <Box sx={{ px: 2, py: 1.5 }}>
                            <Typography variant="h6" fontWeight={600}>
                                Notifications
                            </Typography>
                        </Box>
                        <Divider />
                        {notifications.length === 0 ? (
                            <Box sx={{ p: 3, textAlign: 'center' }}>
                                <Typography variant="body2" color="text.secondary">
                                    No notifications
                                </Typography>
                            </Box>
                        ) : (
                            notifications.slice(0, 5).map((notif) => (
                                <MenuItem
                                    key={notif.id}
                                    onClick={() => {
                                        if (notif.link) navigate(notif.link);
                                        setNotifAnchor(null);
                                    }}
                                    sx={{ borderLeft: notif.isRead ? 'none' : '3px solid', borderColor: 'primary.main' }}
                                >
                                    <Box>
                                        <Typography variant="body2" fontWeight={notif.isRead ? 400 : 600}>
                                            {notif.title}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {notif.message}
                                        </Typography>
                                    </Box>
                                </MenuItem>
                            ))
                        )}
                    </Menu>
                </Toolbar>
            </AppBar>

            {/* Sidebar Drawer */}
            <Drawer
                variant="permanent"
                sx={{
                    width: drawerWidth,
                    flexShrink: 0,
                    '& .MuiDrawer-paper': {
                        width: drawerWidth,
                        boxSizing: 'border-box',
                        borderRight: '1px solid #e0e0e0',
                        backgroundColor: 'white',
                    },
                }}
            >
                <Toolbar />
                <Box sx={{ overflow: 'auto', p: 2 }}>
                    <List>
                        {filteredMenuItems.map((item) => {
                            const isActive = location.pathname.startsWith(item.path);
                            return (
                                <ListItem key={item.title} disablePadding sx={{ mb: 0.5 }}>
                                    <ListItemButton
                                        onClick={() => navigate(item.path)}
                                        selected={isActive}
                                        sx={{
                                            borderRadius: 2,
                                            '&.Mui-selected': {
                                                backgroundColor: 'primary.main',
                                                color: 'white',
                                                '&:hover': {
                                                    backgroundColor: 'primary.dark',
                                                },
                                                '& .MuiListItemIcon-root': {
                                                    color: 'white',
                                                },
                                            },
                                        }}
                                    >
                                        <ListItemIcon sx={{ color: isActive ? 'white' : 'inherit' }}>
                                            {item.icon}
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={item.title}
                                            primaryTypographyProps={{ fontWeight: isActive ? 600 : 500 }}
                                        />
                                    </ListItemButton>
                                </ListItem>
                            );
                        })}
                    </List>

                    <Divider sx={{ my: 2 }} />

                    {/* Quick Action Button */}
                    <ListItem disablePadding>
                        <ListItemButton
                            onClick={() => navigate('/expenses/new')}
                            sx={{
                                borderRadius: 2,
                                backgroundColor: 'secondary.main',
                                color: 'white',
                                '&:hover': {
                                    backgroundColor: 'secondary.dark',
                                },
                            }}
                        >
                            <ListItemIcon sx={{ color: 'white' }}>
                                <Add />
                            </ListItemIcon>
                            <ListItemText
                                primary="New Expense"
                                primaryTypographyProps={{ fontWeight: 600 }}
                            />
                        </ListItemButton>
                    </ListItem>
                </Box>
            </Drawer>

            {/* Main Content */}
            <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
                <Toolbar />
                <Outlet />
            </Box>

            {/* Snackbar for notifications */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={3000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}

export default Layout;
