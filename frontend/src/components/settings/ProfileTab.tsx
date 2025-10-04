import { useState, useRef } from 'react';
import {
    Box,
    Paper,
    TextField,
    Button,
    Avatar,
    Typography,
    Grid,
    Alert,
    CircularProgress,
    IconButton,
    MenuItem,
} from '@mui/material';
import { PhotoCamera, Save } from '@mui/icons-material';
import { useAuthStore } from '../../store';
import { userAPI } from '../../services/api';

interface Department {
    id: string;
    name: string;
}

function ProfileTab() {
    const { user, updateUser } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        department: user?.department || '',
        avatar: user?.avatar_url || user?.avatar || '',
    });

    const [departments] = useState<Department[]>([
        { id: 'sales', name: 'Sales' },
        { id: 'marketing', name: 'Marketing' },
        { id: 'engineering', name: 'Engineering' },
        { id: 'hr', name: 'Human Resources' },
        { id: 'finance', name: 'Finance' },
        { id: 'operations', name: 'Operations' },
    ]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        // Validate file
        if (!file.type.startsWith('image/')) {
            setMessage({ type: 'error', text: 'Please upload an image file' });
            return;
        }

        if (file.size > 2 * 1024 * 1024) { // 2MB
            setMessage({ type: 'error', text: 'File size must be less than 2MB' });
            return;
        }

        try {
            setLoading(true);
            setMessage(null);

            console.log('📤 Uploading avatar:', file.name);

            // Create FormData for Cloudinary upload via backend
            const uploadData = new FormData();
            uploadData.append('avatar', file);

            // Get auth token
            const authStorage = localStorage.getItem('auth-storage');
            const token = authStorage ? JSON.parse(authStorage).state.token : '';

            // Get API URL from environment variable
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

            // Upload via backend API
            const response = await fetch(`${apiUrl}/users/upload-avatar`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: uploadData
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Upload failed' }));
                throw new Error(errorData.error || 'Failed to upload avatar');
            }

            const result = await response.json();
            console.log('✅ Avatar uploaded:', result.avatar_url);

            // Update form data with new avatar URL
            setFormData({ ...formData, avatar: result.avatar_url });

            // Update local user state immediately
            updateUser({
                ...user,
                avatar: result.avatar_url,
                avatar_url: result.avatar_url
            });

            setMessage({ type: 'success', text: 'Profile picture uploaded successfully!' });
        } catch (error: any) {
            console.error('❌ Avatar upload error:', error);
            setMessage({ type: 'error', text: error.message || 'Failed to upload profile picture' });
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        try {
            setLoading(true);
            setMessage(null);

            // Update user profile via backend API
            const response = await userAPI.updateProfile({
                name: formData.name,
                phone: formData.phone,
                avatar: formData.avatar,
            });

            // Update local state with response data
            updateUser({
                ...user,
                name: response.data.name,
                phone: response.data.phone,
                avatar: response.data.avatar_url || response.data.avatar,
                avatar_url: response.data.avatar_url || response.data.avatar,
            });

            setMessage({ type: 'success', text: 'Profile updated successfully!' });
        } catch (error: any) {
            console.error('Profile update error:', error);
            setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to update profile' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Paper className="odoo-card" sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
                Profile Information
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Update your personal information and profile picture
            </Typography>

            {message && (
                <Alert severity={message.type} sx={{ mb: 3 }} onClose={() => setMessage(null)}>
                    {message.text}
                </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit}>
                {/* Avatar Section */}
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
                    <Avatar
                        src={formData.avatar}
                        alt={formData.name}
                        sx={{ width: 100, height: 100, mr: 3 }}
                    />
                    <Box>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            Profile Picture
                        </Typography>
                        <Button
                            variant="outlined"
                            startIcon={<PhotoCamera />}
                            onClick={handleAvatarClick}
                            disabled={loading}
                        >
                            Change Photo
                        </Button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={handleAvatarUpload}
                        />
                        <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 1 }}>
                            JPG, PNG or GIF. Max 2MB
                        </Typography>
                    </Box>
                </Box>

                {/* Form Fields */}
                <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Full Name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Email"
                            name="email"
                            type="email"
                            value={formData.email}
                            disabled
                            helperText="Email cannot be changed"
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Phone Number"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder="+1 (555) 000-0000"
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            select
                            label="Department"
                            name="department"
                            value={formData.department}
                            onChange={handleChange}
                        >
                            {departments.map((dept) => (
                                <MenuItem key={dept.id} value={dept.id}>
                                    {dept.name}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            label="Role"
                            value={user?.role || 'N/A'}
                            disabled
                            helperText="Contact admin to change role"
                        />
                    </Grid>
                </Grid>

                {/* Submit Button */}
                <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
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
                        Save Changes
                    </Button>
                </Box>
            </Box>
        </Paper>
    );
}

export default ProfileTab;
