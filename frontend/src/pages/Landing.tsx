import { useEffect, useRef, useState } from 'react';
import {
    Box,
    Container,
    Typography,
    Button,
    Grid,
    Card,
    CardContent,
    IconButton,
    useTheme,
    alpha,
    Dialog,
    DialogContent,
    TextField,
    InputAdornment,
    CircularProgress,
    Alert,
    Tabs,
    Tab,
    MenuItem,
    Chip,
    Stack,
    Divider,
} from '@mui/material';
import {
    Login as LoginIcon,
    PersonAdd as SignupIcon,
    TrendingUp,
    Speed,
    Security,
    CloudDone,
    Email,
    Lock,
    Person,
    Business,
    Close,
    Visibility,
    VisibilityOff,
    Receipt,
    AccountBalance,
    BarChart,
    CheckCircle,
    ArrowForward,
    AutoAwesome,
    GitHub,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { authAPI, departmentAPI } from '../services/api';
import { useAuthStore } from '../store';
import { signInWithGoogle } from '../lib/firebase';

const Landing = () => {
    const navigate = useNavigate();
    const theme = useTheme();
    const { setAuth } = useAuthStore();

    // Dialog state
    const [dialogOpen, setDialogOpen] = useState(false);
    const [activeTab, setActiveTab] = useState(0); // 0 = Login, 1 = Signup
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // Login form
    const [loginForm, setLoginForm] = useState({
        email: '',
        password: '',
    });

    // Signup form
    const [signupForm, setSignupForm] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'EMPLOYEE',
        department_id: '',
    });

    const [departments, setDepartments] = useState<any[]>([]);

    // Load departments for signup
    useEffect(() => {
        if (dialogOpen && activeTab === 1) {
            loadDepartments();
        }
    }, [dialogOpen, activeTab]);

    const loadDepartments = async () => {
        try {
            const res = await departmentAPI.getAll();
            setDepartments(res.data);
        } catch (err) {
            console.error('Failed to load departments:', err);
        }
    };

    const openLoginDialog = () => {
        setActiveTab(0);
        setDialogOpen(true);
        setError('');
    };

    const openSignupDialog = () => {
        setActiveTab(1);
        setDialogOpen(true);
        setError('');
    };

    const closeDialog = () => {
        setDialogOpen(false);
        setError('');
        setSuccess('');
        setLoginForm({ email: '', password: '' });
        setSignupForm({
            name: '',
            email: '',
            password: '',
            confirmPassword: '',
            role: 'EMPLOYEE',
            department_id: '',
        });
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await authAPI.login(loginForm.email, loginForm.password);
            setAuth(response.data.user, response.data.token);
            closeDialog();
            navigate('/dashboard');
        } catch (err: any) {
            const errorData = err.response?.data;

            // Show specific message for unverified email
            if (errorData?.requiresVerification) {
                setError(errorData.error || 'Please verify your email address before logging in.');
            } else {
                setError(errorData?.error || 'Invalid credentials');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (signupForm.password !== signupForm.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);

        try {
            const response = await authAPI.register({
                name: signupForm.name,
                email: signupForm.email,
                password: signupForm.password,
                role: signupForm.role,
                department: signupForm.department_id || null,
            });

            // Check if email verification is required
            if (response.data.requiresVerification) {
                setSuccess(response.data.message || 'Registration successful! Please check your email to verify your account.');

                // Clear form and switch to login tab after delay
                setTimeout(() => {
                    closeDialog();
                    setSuccess('');
                    setActiveTab(0); // Switch to login tab
                }, 5000);
            } else {
                // Old flow - auto login (for backwards compatibility)
                setAuth(response.data.user, response.data.token);
                closeDialog();
                navigate('/dashboard');
            }
        } catch (err: any) {
            setError(err.response?.data?.error || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setError('');
        setLoading(true);

        try {
            const { user, token: googleToken } = await signInWithGoogle();

            const response = await authAPI.googleSignIn({
                idToken: googleToken,
                email: user.email || '',
                name: user.displayName || 'Google User',
                photoURL: user.photoURL || undefined,
            });

            setAuth(response.data.user, response.data.token);
            closeDialog();
            navigate('/dashboard');
        } catch (err: any) {
            console.error('Google Sign-In error:', err);
            setError(err.message || 'Google Sign-In failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const features = [
        {
            icon: <Receipt sx={{ fontSize: 40 }} />,
            title: 'Smart Expense Tracking',
            description: 'OCR-powered receipt scanning and automated expense categorization',
            color: '#714B67',
            gradient: 'linear-gradient(135deg, #714B67 0%, #8B5E83 100%)',
        },
        {
            icon: <Speed sx={{ fontSize: 40 }} />,
            title: 'Instant Approvals',
            description: 'Lightning-fast approval workflows with real-time notifications',
            color: '#00A09D',
            gradient: 'linear-gradient(135deg, #00A09D 0%, #00C4BF 100%)',
        },
        {
            icon: <BarChart sx={{ fontSize: 40 }} />,
            title: 'Advanced Analytics',
            description: 'Powerful insights and spending trends at your fingertips',
            color: '#875A7B',
            gradient: 'linear-gradient(135deg, #875A7B 0%, #A47497 100%)',
        },
        {
            icon: <Security sx={{ fontSize: 40 }} />,
            title: 'Enterprise Security',
            description: 'Bank-grade security with role-based access control',
            color: '#017E84',
            gradient: 'linear-gradient(135deg, #017E84 0%, #019EA5 100%)',
        },
    ];

    const stats = [
        { value: '10K+', label: 'Active Users' },
        { value: '99.9%', label: 'Uptime' },
        { value: '50M+', label: 'Expenses Tracked' },
        { value: '24/7', label: 'Support' },
    ];

    return (
        <Box
            sx={{
                minHeight: '100vh',
                background: `linear-gradient(135deg, 
                    ${alpha('#714B67', 0.05)} 0%, 
                    ${alpha('#875A7B', 0.08)} 50%, 
                    ${alpha('#00A09D', 0.05)} 100%)`,
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            {/* Background Pattern */}
            <Box
                sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundImage: `radial-gradient(${alpha(theme.palette.primary.main, 0.1)} 1px, transparent 1px)`,
                    backgroundSize: '50px 50px',
                    opacity: 0.3,
                    zIndex: 0,
                }}
            />

            {/* Floating Shapes */}
            <Box
                sx={{
                    position: 'absolute',
                    top: '10%',
                    right: '10%',
                    width: '300px',
                    height: '300px',
                    borderRadius: '50%',
                    background: `radial-gradient(circle, ${alpha('#714B67', 0.15)}, transparent 70%)`,
                    filter: 'blur(60px)',
                    animation: 'float 20s ease-in-out infinite',
                    '@keyframes float': {
                        '0%, 100%': { transform: 'translateY(0)' },
                        '50%': { transform: 'translateY(-50px)' },
                    },
                }}
            />

            {/* Navbar */}
            <Box
                sx={{
                    position: 'sticky',
                    top: 0,
                    zIndex: 100,
                    backdropFilter: 'blur(20px)',
                    backgroundColor: alpha(theme.palette.background.paper, 0.8),
                    borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    boxShadow: `0 4px 30px ${alpha('#000', 0.05)}`,
                }}
            >
                <Container maxWidth="lg">
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            py: 2,
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Box
                                sx={{
                                    width: 45,
                                    height: 45,
                                    borderRadius: 2,
                                    background: 'linear-gradient(135deg, #714B67 0%, #875A7B 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: `0 4px 12px ${alpha('#714B67', 0.3)}`,
                                }}
                            >
                                <Receipt sx={{ color: '#fff', fontSize: 28 }} />
                            </Box>
                            <Typography
                                variant="h5"
                                fontWeight={700}
                                sx={{
                                    background: 'linear-gradient(135deg, #714B67 0%, #875A7B 100%)',
                                    backgroundClip: 'text',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                }}
                            >
                                ExpenseFlow
                            </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                            <IconButton
                                component="a"
                                href="https://github.com/MohitSutharOfficial/odoo-expense-management.git"
                                target="_blank"
                                rel="noopener noreferrer"
                                sx={{
                                    color: '#714B67',
                                    transition: 'all 0.3s ease',
                                    '&:hover': {
                                        backgroundColor: alpha('#714B67', 0.1),
                                        transform: 'scale(1.1)',
                                    },
                                }}
                            >
                                <GitHub sx={{ fontSize: 28 }} />
                            </IconButton>
                            <Button
                                variant="outlined"
                                onClick={openLoginDialog}
                                startIcon={<LoginIcon />}
                                sx={{
                                    borderRadius: 2,
                                    px: 3,
                                    py: 1,
                                    borderColor: alpha('#714B67', 0.3),
                                    color: '#714B67',
                                    fontWeight: 600,
                                    '&:hover': {
                                        borderColor: '#714B67',
                                        backgroundColor: alpha('#714B67', 0.05),
                                    },
                                }}
                            >
                                Login
                            </Button>
                            <Button
                                variant="contained"
                                onClick={openSignupDialog}
                                startIcon={<SignupIcon />}
                                sx={{
                                    borderRadius: 2,
                                    px: 3,
                                    py: 1,
                                    background: 'linear-gradient(135deg, #714B67 0%, #875A7B 100%)',
                                    fontWeight: 600,
                                    boxShadow: `0 4px 12px ${alpha('#714B67', 0.3)}`,
                                    '&:hover': {
                                        background: 'linear-gradient(135deg, #5A3B52 0%, #714B67 100%)',
                                        boxShadow: `0 6px 20px ${alpha('#714B67', 0.4)}`,
                                    },
                                }}
                            >
                                Get Started
                            </Button>
                        </Box>
                    </Box>
                </Container>
            </Box>

            {/* Hero Section */}
            <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
                <Box
                    sx={{
                        pt: { xs: 8, md: 12 },
                        pb: { xs: 8, md: 10 },
                        textAlign: 'center',
                    }}
                >
                    <Chip
                        label="✨ New: AI-Powered Expense Analysis"
                        sx={{
                            mb: 3,
                            px: 2,
                            py: 2.5,
                            background: alpha('#714B67', 0.1),
                            border: `1px solid ${alpha('#714B67', 0.2)}`,
                            color: '#714B67',
                            fontWeight: 600,
                            fontSize: '0.9rem',
                            '& .MuiChip-label': {
                                px: 1,
                            },
                        }}
                        icon={<AutoAwesome sx={{ color: '#714B67 !important' }} />}
                    />

                    <Typography
                        variant="h1"
                        sx={{
                            fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4.5rem' },
                            fontWeight: 800,
                            lineHeight: 1.2,
                            mb: 2,
                            background: 'linear-gradient(135deg, #714B67 0%, #875A7B 50%, #00A09D 100%)',
                            backgroundClip: 'text',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                        }}
                    >
                        Expense Management
                        <br />
                        Made Beautiful
                    </Typography>

                    <Typography
                        variant="h5"
                        color="text.secondary"
                        sx={{
                            mb: 5,
                            maxWidth: 700,
                            mx: 'auto',
                            fontSize: { xs: '1.1rem', md: '1.3rem' },
                            fontWeight: 400,
                            lineHeight: 1.6,
                        }}
                    >
                        Streamline your expense workflows with intelligent automation,
                        real-time approvals, and powerful analytics
                    </Typography>

                    <Stack
                        direction={{ xs: 'column', sm: 'row' }}
                        spacing={2}
                        justifyContent="center"
                        sx={{ mb: 6 }}
                    >
                        <Button
                            variant="contained"
                            size="large"
                            onClick={openSignupDialog}
                            endIcon={<ArrowForward />}
                            sx={{
                                py: 2,
                                px: 5,
                                fontSize: '1.1rem',
                                fontWeight: 700,
                                borderRadius: 3,
                                background: 'linear-gradient(135deg, #714B67 0%, #875A7B 100%)',
                                boxShadow: `0 8px 24px ${alpha('#714B67', 0.35)}`,
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                    background: 'linear-gradient(135deg, #5A3B52 0%, #714B67 100%)',
                                    transform: 'translateY(-3px)',
                                    boxShadow: `0 12px 32px ${alpha('#714B67', 0.45)}`,
                                },
                            }}
                        >
                            Start Free Trial
                        </Button>
                        <Button
                            variant="outlined"
                            size="large"
                            onClick={openLoginDialog}
                            startIcon={<LoginIcon />}
                            sx={{
                                py: 2,
                                px: 5,
                                fontSize: '1.1rem',
                                fontWeight: 600,
                                borderRadius: 3,
                                borderWidth: 2,
                                borderColor: alpha('#714B67', 0.3),
                                color: '#714B67',
                                '&:hover': {
                                    borderWidth: 2,
                                    borderColor: '#714B67',
                                    backgroundColor: alpha('#714B67', 0.05),
                                },
                            }}
                        >
                            View Demo
                        </Button>
                    </Stack>

                    {/* Stats */}
                    <Grid container spacing={4} sx={{ mt: 4 }}>
                        {stats.map((stat, index) => (
                            <Grid item xs={6} sm={3} key={index}>
                                <Box>
                                    <Typography
                                        variant="h3"
                                        fontWeight={800}
                                        sx={{
                                            background: 'linear-gradient(135deg, #714B67 0%, #875A7B 100%)',
                                            backgroundClip: 'text',
                                            WebkitBackgroundClip: 'text',
                                            WebkitTextFillColor: 'transparent',
                                        }}
                                    >
                                        {stat.value}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" fontWeight={500}>
                                        {stat.label}
                                    </Typography>
                                </Box>
                            </Grid>
                        ))}
                    </Grid>
                </Box>

                {/* Features Section */}
                <Box sx={{ py: 8 }}>
                    <Box sx={{ textAlign: 'center', mb: 6 }}>
                        <Typography
                            variant="h2"
                            fontWeight={700}
                            sx={{
                                fontSize: { xs: '2rem', md: '2.75rem' },
                                mb: 2,
                                background: 'linear-gradient(135deg, #714B67 0%, #875A7B 100%)',
                                backgroundClip: 'text',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                            }}
                        >
                            Everything you need to manage expenses
                        </Typography>
                        <Typography variant="h6" color="text.secondary" fontWeight={400}>
                            Powerful features designed for modern teams
                        </Typography>
                    </Box>

                    <Grid container spacing={4}>
                        {features.map((feature, index) => (
                            <Grid item xs={12} sm={6} md={3} key={index}>
                                <Card
                                    sx={{
                                        height: '100%',
                                        borderRadius: 4,
                                        border: `2px solid ${alpha(feature.color, 0.1)}`,
                                        background: alpha(theme.palette.background.paper, 0.8),
                                        backdropFilter: 'blur(20px)',
                                        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                        position: 'relative',
                                        overflow: 'hidden',
                                        '&::before': {
                                            content: '""',
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            right: 0,
                                            height: '4px',
                                            background: feature.gradient,
                                            opacity: 0,
                                            transition: 'opacity 0.3s',
                                        },
                                        '&:hover': {
                                            transform: 'translateY(-12px)',
                                            boxShadow: `0 20px 40px ${alpha(feature.color, 0.25)}`,
                                            borderColor: alpha(feature.color, 0.3),
                                            '&::before': {
                                                opacity: 1,
                                            },
                                        },
                                    }}
                                >
                                    <CardContent sx={{ p: 4 }}>
                                        <Box
                                            sx={{
                                                width: 72,
                                                height: 72,
                                                borderRadius: 3,
                                                background: feature.gradient,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                mb: 3,
                                                color: '#fff',
                                                boxShadow: `0 8px 24px ${alpha(feature.color, 0.3)}`,
                                            }}
                                        >
                                            {feature.icon}
                                        </Box>
                                        <Typography
                                            variant="h6"
                                            fontWeight={700}
                                            gutterBottom
                                            sx={{ color: feature.color }}
                                        >
                                            {feature.title}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" lineHeight={1.7}>
                                            {feature.description}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </Box>

                {/* CTA Section */}
                <Box
                    sx={{
                        py: 10,
                        textAlign: 'center',
                        borderRadius: 6,
                        background: `linear-gradient(135deg, ${alpha('#714B67', 0.08)} 0%, ${alpha('#875A7B', 0.12)} 100%)`,
                        border: `2px solid ${alpha('#714B67', 0.15)}`,
                        my: 8,
                        position: 'relative',
                        overflow: 'hidden',
                    }}
                >
                    <Box
                        sx={{
                            position: 'absolute',
                            top: -50,
                            right: -50,
                            width: 200,
                            height: 200,
                            borderRadius: '50%',
                            background: `radial-gradient(circle, ${alpha('#875A7B', 0.2)}, transparent 70%)`,
                            filter: 'blur(60px)',
                        }}
                    />
                    <Typography
                        variant="h3"
                        fontWeight={700}
                        gutterBottom
                        sx={{
                            fontSize: { xs: '1.75rem', md: '2.5rem' },
                            background: 'linear-gradient(135deg, #714B67 0%, #875A7B 100%)',
                            backgroundClip: 'text',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                        }}
                    >
                        Ready to transform your expense management?
                    </Typography>
                    <Typography variant="h6" color="text.secondary" sx={{ mb: 4, maxWidth: 600, mx: 'auto' }}>
                        Join thousands of teams already using ExpenseFlow
                    </Typography>
                    <Button
                        variant="contained"
                        size="large"
                        onClick={openSignupDialog}
                        endIcon={<ArrowForward />}
                        sx={{
                            py: 2.5,
                            px: 6,
                            fontSize: '1.2rem',
                            fontWeight: 700,
                            borderRadius: 3,
                            background: 'linear-gradient(135deg, #714B67 0%, #875A7B 100%)',
                            boxShadow: `0 8px 24px ${alpha('#714B67', 0.4)}`,
                            '&:hover': {
                                background: 'linear-gradient(135deg, #5A3B52 0%, #714B67 100%)',
                                transform: 'translateY(-3px)',
                                boxShadow: `0 12px 32px ${alpha('#714B67', 0.5)}`,
                            },
                        }}
                    >
                        Get Started for Free
                    </Button>
                </Box>
            </Container>

            {/* Login/Signup Dialog */}
            <Dialog
                open={dialogOpen}
                onClose={closeDialog}
                maxWidth="sm"
                fullWidth
                scroll="body"
                PaperProps={{
                    sx: {
                        borderRadius: 4,
                        boxShadow: `0 24px 48px ${alpha('#000', 0.2)}`,
                        overflow: 'hidden',
                        maxHeight: '90vh',
                    },
                }}
                sx={{
                    '& .MuiBackdrop-root': {
                        backgroundColor: alpha('#000', 0.7),
                    },
                }}
            >
                <IconButton
                    onClick={closeDialog}
                    sx={{
                        position: 'absolute',
                        right: 12,
                        top: 12,
                        zIndex: 1,
                        backgroundColor: alpha(theme.palette.background.paper, 0.8),
                        '&:hover': {
                            backgroundColor: alpha(theme.palette.background.paper, 1),
                        },
                    }}
                >
                    <Close />
                </IconButton>

                <DialogContent
                    sx={{
                        p: 0,
                        overflow: 'auto',
                        maxHeight: 'calc(90vh - 80px)',
                        '&::-webkit-scrollbar': {
                            width: '8px',
                        },
                        '&::-webkit-scrollbar-track': {
                            backgroundColor: alpha('#000', 0.05),
                        },
                        '&::-webkit-scrollbar-thumb': {
                            backgroundColor: alpha('#714B67', 0.5),
                            borderRadius: '4px',
                            '&:hover': {
                                backgroundColor: alpha('#714B67', 0.7),
                            },
                        },
                    }}
                >
                    {/* Tab Header with Gradient */}
                    <Box
                        sx={{
                            background: 'linear-gradient(135deg, #714B67 0%, #875A7B 100%)',
                            pt: 3,
                            pb: 2,
                            position: 'sticky',
                            top: 0,
                            zIndex: 1,
                        }}
                    >
                        <Tabs
                            value={activeTab}
                            onChange={(_, newValue) => {
                                setActiveTab(newValue);
                                setError('');
                            }}
                            centered
                            sx={{
                                '& .MuiTab-root': {
                                    color: alpha('#fff', 0.7),
                                    fontWeight: 600,
                                    fontSize: '1rem',
                                    minWidth: 120,
                                    '&.Mui-selected': {
                                        color: '#fff',
                                    },
                                },
                                '& .MuiTabs-indicator': {
                                    backgroundColor: '#fff',
                                    height: 3,
                                    borderRadius: '3px 3px 0 0',
                                },
                            }}
                        >
                            <Tab label="Login" icon={<LoginIcon />} iconPosition="start" />
                            <Tab label="Sign Up" icon={<SignupIcon />} iconPosition="start" />
                        </Tabs>
                    </Box>

                    {/* Login Form */}
                    {activeTab === 0 && (
                        <Box component="form" onSubmit={handleLogin} sx={{ p: 3 }}>
                            <Typography
                                variant="h5"
                                fontWeight={700}
                                sx={{ mb: 0.5, textAlign: 'center', color: '#714B67' }}
                            >
                                Welcome Back! 👋
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5, textAlign: 'center' }}>
                                Sign in to continue to ExpenseFlow
                            </Typography>

                            {/* Demo Credentials */}
                            <Alert
                                severity="info"
                                sx={{
                                    mb: 2,
                                    py: 1,
                                    background: alpha('#714B67', 0.05),
                                    border: `1px solid ${alpha('#714B67', 0.2)}`,
                                    borderRadius: 2,
                                }}
                            >
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Box>
                                        <Typography variant="caption" fontWeight={600} display="block">
                                            🎭 Demo Admin Account
                                        </Typography>
                                        <Typography variant="caption" display="block" sx={{ mt: 0.3 }}>
                                            admin@expenseflow.com / admin123
                                        </Typography>
                                    </Box>
                                    <Button
                                        size="small"
                                        variant="contained"
                                        onClick={() =>
                                            setLoginForm({
                                                email: 'admin@expenseflow.com',
                                                password: 'admin123',
                                            })
                                        }
                                        sx={{
                                            fontSize: '0.7rem',
                                            py: 0.4,
                                            px: 1.2,
                                            borderRadius: 1,
                                            background: 'linear-gradient(135deg, #714B67 0%, #875A7B 100%)',
                                        }}
                                    >
                                        Quick Fill
                                    </Button>
                                </Box>
                            </Alert>

                            {error && (
                                <Alert severity="error" sx={{ mb: 2, borderRadius: 2, py: 0.5 }}>
                                    {error}
                                </Alert>
                            )}

                            {success && (
                                <Alert severity="success" sx={{ mb: 2, borderRadius: 2, py: 0.5 }}>
                                    {success}
                                </Alert>
                            )}

                            <TextField
                                fullWidth
                                label="Email Address"
                                type="email"
                                required
                                size="small"
                                value={loginForm.email}
                                onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                                sx={{
                                    mb: 2,
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 2,
                                    },
                                }}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Email sx={{ color: '#714B67' }} />
                                        </InputAdornment>
                                    ),
                                }}
                            />

                            <TextField
                                fullWidth
                                label="Password"
                                type={showPassword ? 'text' : 'password'}
                                required
                                size="small"
                                value={loginForm.password}
                                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                                sx={{
                                    mb: 2.5,
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 2,
                                    },
                                }}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Lock sx={{ color: '#714B67' }} />
                                        </InputAdornment>
                                    ),
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small">
                                                {showPassword ? <VisibilityOff /> : <Visibility />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                            />

                            <Button
                                fullWidth
                                type="submit"
                                variant="contained"
                                disabled={loading}
                                sx={{
                                    py: 1.5,
                                    borderRadius: 2,
                                    fontSize: '0.95rem',
                                    fontWeight: 700,
                                    background: 'linear-gradient(135deg, #714B67 0%, #875A7B 100%)',
                                    boxShadow: `0 4px 12px ${alpha('#714B67', 0.3)}`,
                                    '&:hover': {
                                        background: 'linear-gradient(135deg, #5A3B52 0%, #714B67 100%)',
                                        transform: 'translateY(-1px)',
                                        boxShadow: `0 6px 16px ${alpha('#714B67', 0.4)}`,
                                    },
                                }}
                            >
                                {loading ? <CircularProgress size={22} color="inherit" /> : 'Sign In'}
                            </Button>

                            <Divider sx={{ my: 2 }}>
                                <Chip label="OR" size="small" />
                            </Divider>

                            {/* Google Sign-In */}
                            <Button
                                fullWidth
                                variant="outlined"
                                onClick={handleGoogleSignIn}
                                disabled={loading}
                                startIcon={
                                    <img
                                        src="https://www.google.com/favicon.ico"
                                        alt="Google"
                                        style={{ width: 18, height: 18 }}
                                    />
                                }
                                sx={{
                                    py: 1.25,
                                    borderRadius: 2,
                                    fontSize: '0.9rem',
                                    fontWeight: 600,
                                    borderWidth: 1.5,
                                    borderColor: alpha(theme.palette.divider, 0.3),
                                    '&:hover': {
                                        borderWidth: 1.5,
                                        borderColor: '#4285F4',
                                        backgroundColor: alpha('#4285F4', 0.05),
                                    },
                                }}
                            >
                                Continue with Google
                            </Button>
                        </Box>
                    )}

                    {/* Signup Form */}
                    {activeTab === 1 && (
                        <Box component="form" onSubmit={handleSignup} sx={{ p: 3 }}>
                            <Typography
                                variant="h5"
                                fontWeight={700}
                                sx={{ mb: 0.5, textAlign: 'center', color: '#714B67' }}
                            >
                                Create Account 🚀
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5, textAlign: 'center' }}>
                                Start your free trial today
                            </Typography>

                            {error && (
                                <Alert severity="error" sx={{ mb: 2, borderRadius: 2, py: 0.5 }}>
                                    {error}
                                </Alert>
                            )}

                            {success && (
                                <Alert severity="success" sx={{ mb: 2, borderRadius: 2, py: 0.5 }}>
                                    {success}
                                </Alert>
                            )}

                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Full Name"
                                        required
                                        size="small"
                                        value={signupForm.name}
                                        onChange={(e) => setSignupForm({ ...signupForm, name: e.target.value })}
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <Person sx={{ color: '#714B67' }} />
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                </Grid>

                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Email Address"
                                        type="email"
                                        required
                                        size="small"
                                        value={signupForm.email}
                                        onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <Email sx={{ color: '#714B67' }} />
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                </Grid>

                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Password"
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        size="small"
                                        value={signupForm.password}
                                        onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <Lock sx={{ color: '#714B67' }} />
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Confirm Password"
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        size="small"
                                        value={signupForm.confirmPassword}
                                        onChange={(e) =>
                                            setSignupForm({ ...signupForm, confirmPassword: e.target.value })
                                        }
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                        InputProps={{
                                            endAdornment: (
                                                <InputAdornment position="end">
                                                    <IconButton
                                                        onClick={() => setShowPassword(!showPassword)}
                                                        edge="end"
                                                        size="small"
                                                    >
                                                        {showPassword ? <VisibilityOff /> : <Visibility />}
                                                    </IconButton>
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                </Grid>

                                <Grid item xs={12}>
                                    <TextField
                                        select
                                        fullWidth
                                        label="Department (Optional)"
                                        size="small"
                                        value={signupForm.department_id}
                                        onChange={(e) => setSignupForm({ ...signupForm, department_id: e.target.value })}
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <Business sx={{ color: '#714B67' }} />
                                                </InputAdornment>
                                            ),
                                        }}
                                    >
                                        <MenuItem value="">None</MenuItem>
                                        {departments.map((dept) => (
                                            <MenuItem key={dept.id} value={dept.id}>
                                                {dept.name}
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                </Grid>
                            </Grid>

                            <Button
                                fullWidth
                                type="submit"
                                variant="contained"
                                disabled={loading}
                                sx={{
                                    mt: 2.5,
                                    py: 1.5,
                                    borderRadius: 2,
                                    fontSize: '0.95rem',
                                    fontWeight: 700,
                                    background: 'linear-gradient(135deg, #714B67 0%, #875A7B 100%)',
                                    boxShadow: `0 4px 12px ${alpha('#714B67', 0.3)}`,
                                    '&:hover': {
                                        background: 'linear-gradient(135deg, #5A3B52 0%, #714B67 100%)',
                                        transform: 'translateY(-1px)',
                                        boxShadow: `0 6px 16px ${alpha('#714B67', 0.4)}`,
                                    },
                                }}
                            >
                                {loading ? <CircularProgress size={22} color="inherit" /> : 'Create Account'}
                            </Button>

                            <Divider sx={{ my: 2 }}>
                                <Chip label="OR" size="small" />
                            </Divider>

                            {/* Google Sign-In */}
                            <Button
                                fullWidth
                                variant="outlined"
                                onClick={handleGoogleSignIn}
                                disabled={loading}
                                startIcon={
                                    <img
                                        src="https://www.google.com/favicon.ico"
                                        alt="Google"
                                        style={{ width: 18, height: 18 }}
                                    />
                                }
                                sx={{
                                    py: 1.25,
                                    borderRadius: 2,
                                    fontSize: '0.9rem',
                                    fontWeight: 600,
                                    borderWidth: 1.5,
                                    borderColor: alpha(theme.palette.divider, 0.3),
                                    '&:hover': {
                                        borderWidth: 1.5,
                                        borderColor: '#4285F4',
                                        backgroundColor: alpha('#4285F4', 0.05),
                                    },
                                }}
                            >
                                Continue with Google
                            </Button>
                        </Box>
                    )}
                </DialogContent>
            </Dialog>

            {/* Footer */}
            <Box
                component="footer"
                sx={{
                    py: 3,
                    textAlign: 'center',
                    borderTop: `1px solid ${alpha('#714B67', 0.1)}`,
                    mt: 'auto',
                }}
            >
                <Container maxWidth="sm">
                    <Card
                        sx={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 1.5,
                            px: 2.5,
                            py: 1.5,
                            background: alpha('#714B67', 0.05),
                            border: `1px solid ${alpha('#714B67', 0.2)}`,
                            borderRadius: 3,
                            boxShadow: `0 2px 8px ${alpha('#714B67', 0.1)}`,
                            transition: 'all 0.3s ease',
                            '&:hover': {
                                transform: 'translateY(-2px)',
                                boxShadow: `0 4px 16px ${alpha('#714B67', 0.2)}`,
                                background: alpha('#714B67', 0.08),
                            },
                        }}
                    >
                        <IconButton
                            component="a"
                            href="https://github.com/MohitSutharOfficial"
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{
                                color: '#714B67',
                                '&:hover': {
                                    color: '#875A7B',
                                    transform: 'scale(1.1)',
                                },
                            }}
                        >
                            <GitHub />
                        </IconButton>
                        <Typography
                            variant="caption"
                            sx={{
                                fontWeight: 600,
                                color: '#714B67',
                                letterSpacing: 0.5,
                            }}
                        >
                            Built by MohitSutharOfficial
                        </Typography>
                    </Card>
                </Container>
            </Box>
        </Box>
    );
};

export default Landing;
