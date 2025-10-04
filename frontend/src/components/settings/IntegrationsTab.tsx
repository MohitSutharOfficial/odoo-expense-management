import { useState } from 'react';
import {
    Box,
    Paper,
    Typography,
    Button,
    TextField,
    Alert,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    IconButton,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    InputAdornment,
} from '@mui/material';
import {
    Cloud,
    CheckCircle,
    Cancel,
    Refresh,
    ContentCopy,
    Visibility,
    VisibilityOff,
    FileDownload,
} from '@mui/icons-material';
import { usePermissions } from '../../hooks/usePermissions';

interface Service {
    id: string;
    name: string;
    description: string;
    status: 'connected' | 'disconnected';
    icon: React.ReactNode;
}

function IntegrationsTab() {
    const permissions = usePermissions();
    const [showApiKey, setShowApiKey] = useState(false);
    const [exportDialogOpen, setExportDialogOpen] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const [services] = useState<Service[]>([
        {
            id: 'supabase',
            name: 'Supabase',
            description: 'Database and authentication',
            status: 'connected',
            icon: <Cloud />,
        },
        {
            id: 'cloudinary',
            name: 'Cloudinary',
            description: 'Receipt image storage',
            status: 'connected',
            icon: <Cloud />,
        },
        {
            id: 'resend',
            name: 'Resend',
            description: 'Email notifications',
            status: 'connected',
            icon: <Cloud />,
        },
        {
            id: 'ocr',
            name: 'OCR.space',
            description: 'Receipt text extraction',
            status: 'connected',
            icon: <Cloud />,
        },
    ]);

    const apiKey = 'exp_sk_test_••••••••••••••••••••1234';

    const handleCopyApiKey = () => {
        navigator.clipboard.writeText(apiKey);
        setMessage({ type: 'success', text: 'API key copied to clipboard!' });
    };

    const handleRegenerateApiKey = () => {
        console.log('Regenerating API key...');
        setMessage({ type: 'success', text: 'New API key generated successfully!' });
    };

    const handleExportData = (format: string) => {
        console.log('Exporting data in format:', format);
        setMessage({ type: 'success', text: `Data export started! You'll receive an email when ready.` });
        setExportDialogOpen(false);
    };

    return (
        <Box>
            {message && (
                <Alert severity={message.type} sx={{ mb: 3 }} onClose={() => setMessage(null)}>
                    {message.text}
                </Alert>
            )}

            {/* Connected Services */}
            <Paper className="odoo-card" sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                    Connected Services
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Manage external service integrations
                </Typography>

                <List>
                    {services.map((service, index) => (
                        <ListItem
                            key={service.id}
                            sx={{
                                px: 0,
                                borderBottom: index < services.length - 1 ? '1px solid #e0e0e0' : 'none',
                            }}
                        >
                            <IconButton sx={{ mr: 2 }} disabled>
                                {service.icon}
                            </IconButton>
                            <ListItemText
                                primary={service.name}
                                secondary={service.description}
                            />
                            <ListItemSecondaryAction>
                                <Chip
                                    label={service.status === 'connected' ? 'Connected' : 'Disconnected'}
                                    size="small"
                                    color={service.status === 'connected' ? 'success' : 'default'}
                                    icon={service.status === 'connected' ? <CheckCircle /> : <Cancel />}
                                />
                            </ListItemSecondaryAction>
                        </ListItem>
                    ))}
                </List>
            </Paper>

            {/* API Keys (Admin Only) */}
            {permissions.canManageSystem && (
                <Paper className="odoo-card" sx={{ p: 3, mb: 3 }}>
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                        API Keys
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Manage API keys for programmatic access
                    </Typography>

                    <Alert severity="warning" sx={{ mb: 3 }}>
                        Keep your API keys secure. Never share them in public repositories or client-side code.
                    </Alert>

                    <TextField
                        fullWidth
                        label="API Key"
                        value={apiKey}
                        type={showApiKey ? 'text' : 'password'}
                        InputProps={{
                            readOnly: true,
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton onClick={() => setShowApiKey(!showApiKey)} edge="end">
                                        {showApiKey ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                    <IconButton onClick={handleCopyApiKey} edge="end">
                                        <ContentCopy />
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                        sx={{ mb: 2 }}
                    />

                    <Button
                        variant="outlined"
                        startIcon={<Refresh />}
                        onClick={handleRegenerateApiKey}
                        color="error"
                    >
                        Regenerate API Key
                    </Button>
                </Paper>
            )}

            {/* Export Data */}
            <Paper className="odoo-card" sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                    Export Data
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Download your expense data in various formats
                </Typography>

                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Button
                        variant="outlined"
                        startIcon={<FileDownload />}
                        onClick={() => setExportDialogOpen(true)}
                    >
                        Export All Data
                    </Button>
                </Box>
            </Paper>

            {/* Export Dialog */}
            <Dialog open={exportDialogOpen} onClose={() => setExportDialogOpen(false)}>
                <DialogTitle>Export Data</DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ mb: 3 }}>
                        Choose the format for your data export. You'll receive an email with a download link when the export is ready.
                    </DialogContentText>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Button variant="outlined" onClick={() => handleExportData('csv')}>
                            CSV (Comma-separated values)
                        </Button>
                        <Button variant="outlined" onClick={() => handleExportData('xlsx')}>
                            Excel (XLSX)
                        </Button>
                        <Button variant="outlined" onClick={() => handleExportData('json')}>
                            JSON (Machine-readable)
                        </Button>
                        <Button variant="outlined" onClick={() => handleExportData('pdf')}>
                            PDF Report
                        </Button>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setExportDialogOpen(false)}>Cancel</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export default IntegrationsTab;
