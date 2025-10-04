import { useState } from 'react';
import {
    Box,
    Paper,
    TextField,
    Button,
    Typography,
    Alert,
    CircularProgress,
    Divider,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    IconButton,
    Chip,
} from '@mui/material';
import { Save, DeleteOutline, Computer, Smartphone } from '@mui/icons-material';
import { supabase } from '../../lib/supabase';

interface Session {
    id: string;
    device: string;
    location: string;
    lastActive: string;
    current: boolean;
}

function SecurityTab() {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    const [sessions] = useState<Session[]>([
        {
            id: '1',
            device: 'Chrome on Windows',
            location: 'New York, USA',
            lastActive: '2 minutes ago',
            current: true,
        },
        {
            id: '2',
            device: 'Safari on iPhone',
            location: 'New York, USA',
            lastActive: '2 hours ago',
            current: false,
        },
    ]);

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
    };

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setMessage({ type: 'error', text: 'New passwords do not match' });
            return;
        }

        if (passwordData.newPassword.length < 8) {
            setMessage({ type: 'error', text: 'Password must be at least 8 characters' });
            return;
        }

        try {
            setLoading(true);

            // Update password using Supabase Auth
            const { error } = await supabase.auth.updateUser({
                password: passwordData.newPassword,
            });

            if (error) throw error;

            setMessage({ type: 'success', text: 'Password updated successfully!' });
            setPasswordData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: '',
            });
        } catch (error: any) {
            console.error('Password update error:', error);
            setMessage({ type: 'error', text: error.message || 'Failed to update password' });
        } finally {
            setLoading(false);
        }
    };

    const handleRevokeSession = (sessionId: string) => {
        console.log('Revoking session:', sessionId);
        // Implement session revocation logic
    };

    return (
        <Box>
            {/* Change Password Section */}
            <Paper className="odoo-card" sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                    Change Password
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Ensure your account is using a strong password
                </Typography>

                {message && (
                    <Alert severity={message.type} sx={{ mb: 3 }} onClose={() => setMessage(null)}>
                        {message.text}
                    </Alert>
                )}

                <Box component="form" onSubmit={handlePasswordSubmit}>
                    <TextField
                        fullWidth
                        type="password"
                        label="Current Password"
                        name="currentPassword"
                        value={passwordData.currentPassword}
                        onChange={handlePasswordChange}
                        required
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        fullWidth
                        type="password"
                        label="New Password"
                        name="newPassword"
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                        required
                        helperText="Must be at least 8 characters"
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        fullWidth
                        type="password"
                        label="Confirm New Password"
                        name="confirmPassword"
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordChange}
                        required
                        sx={{ mb: 3 }}
                    />
                    <Button
                        type="submit"
                        variant="contained"
                        startIcon={loading ? <CircularProgress size={20} /> : <Save />}
                        disabled={loading}
                        sx={{
                            bgcolor: 'secondary.main',
                            '&:hover': { bgcolor: 'secondary.dark' },
                        }}
                    >
                        Update Password
                    </Button>
                </Box>
            </Paper>

            {/* Active Sessions Section */}
            <Paper className="odoo-card" sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                    Active Sessions
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Manage devices where you're currently logged in
                </Typography>

                <List>
                    {sessions.map((session, index) => (
                        <Box key={session.id}>
                            <ListItem sx={{ px: 0 }}>
                                <IconButton sx={{ mr: 2 }}>
                                    {session.device.includes('iPhone') ? <Smartphone /> : <Computer />}
                                </IconButton>
                                <ListItemText
                                    primary={
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Typography variant="body1">{session.device}</Typography>
                                            {session.current && (
                                                <Chip label="Current" size="small" color="primary" />
                                            )}
                                        </Box>
                                    }
                                    secondary={
                                        <>
                                            {session.location} • Last active {session.lastActive}
                                        </>
                                    }
                                />
                                {!session.current && (
                                    <ListItemSecondaryAction>
                                        <IconButton
                                            edge="end"
                                            onClick={() => handleRevokeSession(session.id)}
                                            color="error"
                                        >
                                            <DeleteOutline />
                                        </IconButton>
                                    </ListItemSecondaryAction>
                                )}
                            </ListItem>
                            {index < sessions.length - 1 && <Divider />}
                        </Box>
                    ))}
                </List>
            </Paper>

            {/* Two-Factor Authentication Section */}
            <Paper className="odoo-card" sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                    Two-Factor Authentication
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Add an extra layer of security to your account
                </Typography>

                <Alert severity="info" sx={{ mb: 2 }}>
                    Two-factor authentication is not yet configured for your account.
                </Alert>

                <Button variant="outlined" disabled>
                    Enable 2FA (Coming Soon)
                </Button>
            </Paper>
        </Box>
    );
}

export default SecurityTab;
