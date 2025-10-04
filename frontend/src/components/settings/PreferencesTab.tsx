import { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Switch,
    FormGroup,
    FormControlLabel,
    Divider,
    Button,
    Alert,
    MenuItem,
    TextField,
    CircularProgress,
} from '@mui/material';
import { Save } from '@mui/icons-material';
import { useAuthStore } from '../../store';
import { userAPI } from '../../services/api';

function PreferencesTab() {
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [loadingPreferences, setLoadingPreferences] = useState(true);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const [preferences, setPreferences] = useState({
        // Notification Preferences
        emailNotifications: true,
        pushNotifications: false,
        expenseSubmitted: true,
        expenseApproved: true,
        expenseRejected: true,
        budgetAlert: true,
        weeklyDigest: true,

        // Email Settings
        emailFrequency: 'instant',
        digestDay: 'monday',

        // Display Preferences
        theme: 'light',
        language: 'en',
        currency: 'USD',
        dateFormat: 'MM/DD/YYYY',
        timeFormat: '12h',
    });

    useEffect(() => {
        loadPreferences();
    }, []);

    const loadPreferences = async () => {
        try {
            const response = await userAPI.getPreferences();
            setPreferences({ ...preferences, ...response.data });
        } catch (error) {
            console.error('Failed to load preferences:', error);
        } finally {
            setLoadingPreferences(false);
        }
    };

    const handleToggle = (name: keyof typeof preferences) => {
        setPreferences({ ...preferences, [name]: !preferences[name] });
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPreferences({ ...preferences, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
            setMessage(null);

            // Save preferences to backend
            await userAPI.updatePreferences(preferences);

            setMessage({ type: 'success', text: 'Preferences saved successfully!' });
        } catch (error: any) {
            console.error('Preferences save error:', error);
            setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to save preferences' });
        } finally {
            setLoading(false);
        }
    };

    if (loadingPreferences) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box component="form" onSubmit={handleSubmit}>
            {message && (
                <Alert severity={message.type} sx={{ mb: 3 }} onClose={() => setMessage(null)}>
                    {message.text}
                </Alert>
            )}

            {/* Notification Preferences */}
            <Paper className="odoo-card" sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                    Notification Preferences
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Manage how you receive notifications
                </Typography>

                <FormGroup>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={preferences.emailNotifications}
                                onChange={() => handleToggle('emailNotifications')}
                                color="primary"
                            />
                        }
                        label="Email Notifications"
                    />
                    <FormControlLabel
                        control={
                            <Switch
                                checked={preferences.pushNotifications}
                                onChange={() => handleToggle('pushNotifications')}
                                color="primary"
                            />
                        }
                        label="Push Notifications"
                    />
                </FormGroup>

                <Divider sx={{ my: 3 }} />

                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                    Notify me when:
                </Typography>
                <FormGroup>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={preferences.expenseSubmitted}
                                onChange={() => handleToggle('expenseSubmitted')}
                                color="primary"
                            />
                        }
                        label="An expense is submitted (Managers only)"
                    />
                    <FormControlLabel
                        control={
                            <Switch
                                checked={preferences.expenseApproved}
                                onChange={() => handleToggle('expenseApproved')}
                                color="primary"
                            />
                        }
                        label="My expense is approved"
                    />
                    <FormControlLabel
                        control={
                            <Switch
                                checked={preferences.expenseRejected}
                                onChange={() => handleToggle('expenseRejected')}
                                color="primary"
                            />
                        }
                        label="My expense is rejected"
                    />
                    <FormControlLabel
                        control={
                            <Switch
                                checked={preferences.budgetAlert}
                                onChange={() => handleToggle('budgetAlert')}
                                color="primary"
                            />
                        }
                        label="Budget threshold is reached"
                    />
                    <FormControlLabel
                        control={
                            <Switch
                                checked={preferences.weeklyDigest}
                                onChange={() => handleToggle('weeklyDigest')}
                                color="primary"
                            />
                        }
                        label="Send weekly expense digest"
                    />
                </FormGroup>
            </Paper>

            {/* Email Settings */}
            <Paper className="odoo-card" sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                    Email Settings
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Configure email delivery preferences
                </Typography>

                <TextField
                    select
                    fullWidth
                    label="Email Frequency"
                    name="emailFrequency"
                    value={preferences.emailFrequency}
                    onChange={handleChange}
                    sx={{ mb: 2 }}
                >
                    <MenuItem value="instant">Instant (Receive immediately)</MenuItem>
                    <MenuItem value="daily">Daily Digest (Once per day)</MenuItem>
                    <MenuItem value="weekly">Weekly Digest (Once per week)</MenuItem>
                </TextField>

                {preferences.emailFrequency === 'weekly' && (
                    <TextField
                        select
                        fullWidth
                        label="Weekly Digest Day"
                        name="digestDay"
                        value={preferences.digestDay}
                        onChange={handleChange}
                    >
                        <MenuItem value="monday">Monday</MenuItem>
                        <MenuItem value="tuesday">Tuesday</MenuItem>
                        <MenuItem value="wednesday">Wednesday</MenuItem>
                        <MenuItem value="thursday">Thursday</MenuItem>
                        <MenuItem value="friday">Friday</MenuItem>
                    </TextField>
                )}
            </Paper>

            {/* Display Preferences */}
            <Paper className="odoo-card" sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                    Display Preferences
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Customize how information is displayed
                </Typography>

                <Box sx={{ display: 'grid', gap: 2 }}>
                    <TextField
                        select
                        fullWidth
                        label="Theme"
                        name="theme"
                        value={preferences.theme}
                        onChange={handleChange}
                    >
                        <MenuItem value="light">Light</MenuItem>
                        <MenuItem value="dark">Dark</MenuItem>
                        <MenuItem value="auto">Auto (System)</MenuItem>
                    </TextField>

                    <TextField
                        select
                        fullWidth
                        label="Language"
                        name="language"
                        value={preferences.language}
                        onChange={handleChange}
                    >
                        <MenuItem value="en">English</MenuItem>
                        <MenuItem value="es">Español</MenuItem>
                        <MenuItem value="fr">Français</MenuItem>
                        <MenuItem value="de">Deutsch</MenuItem>
                    </TextField>

                    <TextField
                        select
                        fullWidth
                        label="Currency"
                        name="currency"
                        value={preferences.currency}
                        onChange={handleChange}
                    >
                        <MenuItem value="USD">USD - US Dollar</MenuItem>
                        <MenuItem value="EUR">EUR - Euro</MenuItem>
                        <MenuItem value="GBP">GBP - British Pound</MenuItem>
                        <MenuItem value="INR">INR - Indian Rupee</MenuItem>
                    </TextField>

                    <TextField
                        select
                        fullWidth
                        label="Date Format"
                        name="dateFormat"
                        value={preferences.dateFormat}
                        onChange={handleChange}
                    >
                        <MenuItem value="MM/DD/YYYY">MM/DD/YYYY</MenuItem>
                        <MenuItem value="DD/MM/YYYY">DD/MM/YYYY</MenuItem>
                        <MenuItem value="YYYY-MM-DD">YYYY-MM-DD</MenuItem>
                    </TextField>

                    <TextField
                        select
                        fullWidth
                        label="Time Format"
                        name="timeFormat"
                        value={preferences.timeFormat}
                        onChange={handleChange}
                    >
                        <MenuItem value="12h">12-hour (3:00 PM)</MenuItem>
                        <MenuItem value="24h">24-hour (15:00)</MenuItem>
                    </TextField>
                </Box>
            </Paper>

            {/* Save Button */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                    type="submit"
                    variant="contained"
                    startIcon={<Save />}
                    disabled={loading}
                    sx={{
                        bgcolor: 'secondary.main',
                        '&:hover': { bgcolor: 'secondary.dark' },
                    }}
                >
                    Save Preferences
                </Button>
            </Box>
        </Box>
    );
}

export default PreferencesTab;
