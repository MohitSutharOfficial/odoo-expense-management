import { useEffect, useState } from 'react';
import {
    Box,
    Paper,
    Typography,
    Button,
    Card,
    CardContent,
    Chip,
    Grid,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Alert,
    LinearProgress,
    CircularProgress,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Divider,
    Stack,
    Badge,
} from '@mui/material';
import {
    CheckCircle,
    Cancel,
    ExpandMore,
    Receipt as ReceiptIcon,
    Person,
    CalendarToday,
    AttachMoney,
    Category as CategoryIcon,
    Store,
    Visibility,
    HourglassEmpty,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { approvalAPI } from '../services/api';
import { Approval } from '../types';
import { useAuthStore } from '../store';

function Approvals() {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [approvals, setApprovals] = useState<Approval[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [selectedApproval, setSelectedApproval] = useState<Approval | null>(null);
    const [actionType, setActionType] = useState<'APPROVED' | 'REJECTED' | null>(null);
    const [comments, setComments] = useState('');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);
    const [selectedReceipt, setSelectedReceipt] = useState<string>('');

    useEffect(() => {
        loadApprovals();
    }, []);

    const loadApprovals = async () => {
        setLoading(true);
        try {
            const res = await approvalAPI.getPending();
            setApprovals(res.data);
        } catch (error) {
            console.error('Failed to load approvals:', error);
            setError('Failed to load pending approvals');
        } finally {
            setLoading(false);
        }
    };

    const handleAction = (approval: Approval, action: 'APPROVED' | 'REJECTED') => {
        setSelectedApproval(approval);
        setActionType(action);
        setComments('');
        setDialogOpen(true);
        setError(''); // Clear any previous errors
        setSuccess(''); // Clear any previous success messages
    };

    const confirmAction = async () => {
        if (!selectedApproval || !actionType) return;

        if (actionType === 'REJECTED' && !comments.trim()) {
            setError('Please provide a reason for rejection');
            return;
        }

        setActionLoading(true);
        setError(''); // Clear any previous errors

        try {
            const response = await approvalAPI.makeDecision(
                selectedApproval.id,
                actionType,
                comments.trim() || undefined
            );

            // Only show success if the API call succeeded
            if (response.status === 200 || response.data) {
                setSuccess(
                    actionType === 'APPROVED'
                        ? 'Expense approved successfully!'
                        : 'Expense rejected successfully!'
                );

                // Reload approvals and close dialog
                setTimeout(() => {
                    loadApprovals();
                    setDialogOpen(false);
                    setSuccess('');
                    setError(''); // Clear errors on close
                }, 1500);
            }
        } catch (err: any) {
            console.error('Failed to process approval:', err);
            // Only show error if it's a real failure
            const errorMessage = err.response?.data?.error || err.response?.data?.message || 'Failed to process approval. Please try again.';
            setError(errorMessage);
            setSuccess(''); // Clear success message on error
        } finally {
            setActionLoading(false);
        }
    };

    const handleViewReceipt = (receiptUrl: string) => {
        setSelectedReceipt(receiptUrl);
        setReceiptDialogOpen(true);
    };

    const getStatusChipColor = (status: string) => {
        const colors: any = {
            DRAFT: 'default',
            PENDING: 'warning',
            APPROVED: 'success',
            REJECTED: 'error',
            PAID: 'secondary',
        };
        return colors[status] || 'default';
    };

    if (loading) {
        return (
            <Box>
                <LinearProgress />
                <Box sx={{ textAlign: 'center', mt: 4 }}>
                    <Typography>Loading pending approvals...</Typography>
                </Box>
            </Box>
        );
    }

    return (
        <Box>
            {/* Header */}
            <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Badge badgeContent={approvals.length} color="error">
                        <HourglassEmpty sx={{ fontSize: 32, color: 'text.secondary' }} />
                    </Badge>
                    <Box>
                        <Typography variant="h4" fontWeight={700}>
                            Pending Approvals
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Review and approve expense requests
                        </Typography>
                    </Box>
                </Box>
            </Box>

            {/* Success Alert */}
            {success && (
                <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
                    {success}
                </Alert>
            )}

            {/* Empty State */}
            {approvals.length === 0 ? (
                <Paper className="odoo-card" sx={{ p: 6, textAlign: 'center' }}>
                    <CheckCircle sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
                    <Typography variant="h6" gutterBottom>
                        All caught up!
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        No pending approvals at the moment. You'll see new requests here when team members submit expenses.
                    </Typography>
                </Paper>
            ) : (
                <Box>
                    <Alert severity="info" sx={{ mb: 3 }}>
                        You have <strong>{approvals.length}</strong> expense
                        {approvals.length === 1 ? '' : 's'} waiting for your approval
                    </Alert>

                    {/* Approvals List */}
                    {approvals.map((approval) => (
                        <Accordion
                            key={approval.id}
                            className="odoo-card"
                            sx={{ mb: 2, '&:before': { display: 'none' } }}
                        >
                            <AccordionSummary
                                expandIcon={<ExpandMore />}
                                sx={{
                                    '&:hover': { bgcolor: '#f9f9f9' },
                                }}
                            >
                                <Grid container spacing={2} alignItems="center">
                                    <Grid item xs={12} sm={5}>
                                        <Typography variant="body1" fontWeight={600}>
                                            {approval.expense?.title}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            by {approval.expense?.user.name}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={6} sm={2}>
                                        <Typography variant="h6" fontWeight={700} color="primary.main">
                                            ${approval.expense?.amount.toFixed(2)}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={6} sm={2}>
                                        <Chip
                                            label={approval.expense?.category.name}
                                            size="small"
                                            icon={<span>{approval.expense?.category.icon}</span>}
                                        />
                                    </Grid>
                                    <Grid item xs={6} sm={1}>
                                        <Typography variant="caption" color="text.secondary">
                                            {new Date(approval.expense?.date || '').toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                            })}
                                        </Typography>
                                    </Grid>
                                </Grid>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Divider sx={{ mb: 3 }} />

                                <Grid container spacing={3}>
                                    {/* Left Column - Details */}
                                    <Grid item xs={12} md={8}>
                                        <Card variant="outlined">
                                            <CardContent>
                                                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                                                    Expense Information
                                                </Typography>

                                                <Grid container spacing={2} sx={{ mt: 1 }}>
                                                    <Grid item xs={6}>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            <Person sx={{ fontSize: 20, color: 'text.secondary' }} />
                                                            <Box>
                                                                <Typography variant="caption" color="text.secondary">
                                                                    Submitted By
                                                                </Typography>
                                                                <Typography variant="body2" fontWeight={600}>
                                                                    {approval.expense?.user.name}
                                                                </Typography>
                                                                <Typography variant="caption" color="text.secondary">
                                                                    {approval.expense?.user.email}
                                                                </Typography>
                                                            </Box>
                                                        </Box>
                                                    </Grid>

                                                    <Grid item xs={6}>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            <CalendarToday sx={{ fontSize: 20, color: 'text.secondary' }} />
                                                            <Box>
                                                                <Typography variant="caption" color="text.secondary">
                                                                    Date
                                                                </Typography>
                                                                <Typography variant="body2" fontWeight={600}>
                                                                    {new Date(approval.expense?.date || '').toLocaleDateString()}
                                                                </Typography>
                                                            </Box>
                                                        </Box>
                                                    </Grid>

                                                    <Grid item xs={6}>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            <AttachMoney sx={{ fontSize: 20, color: 'text.secondary' }} />
                                                            <Box>
                                                                <Typography variant="caption" color="text.secondary">
                                                                    Amount
                                                                </Typography>
                                                                <Typography variant="body2" fontWeight={600}>
                                                                    ${approval.expense?.amount.toFixed(2)} {approval.expense?.currency}
                                                                </Typography>
                                                            </Box>
                                                        </Box>
                                                    </Grid>

                                                    <Grid item xs={6}>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            <CategoryIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                                                            <Box>
                                                                <Typography variant="caption" color="text.secondary">
                                                                    Category
                                                                </Typography>
                                                                <Typography variant="body2" fontWeight={600}>
                                                                    {approval.expense?.category.icon} {approval.expense?.category.name}
                                                                </Typography>
                                                            </Box>
                                                        </Box>
                                                    </Grid>

                                                    {(approval.expense?.merchant || approval.expense?.merchantName) && (
                                                        <Grid item xs={6}>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                <Store sx={{ fontSize: 20, color: 'text.secondary' }} />
                                                                <Box>
                                                                    <Typography variant="caption" color="text.secondary">
                                                                        Merchant
                                                                    </Typography>
                                                                    <Typography variant="body2" fontWeight={600}>
                                                                        {approval.expense?.merchant || approval.expense?.merchantName}
                                                                    </Typography>
                                                                </Box>
                                                            </Box>
                                                        </Grid>
                                                    )}

                                                    {approval.expense?.paymentMethod && (
                                                        <Grid item xs={6}>
                                                            <Box>
                                                                <Typography variant="caption" color="text.secondary">
                                                                    Payment Method
                                                                </Typography>
                                                                <Typography variant="body2" fontWeight={600}>
                                                                    {approval.expense?.paymentMethod}
                                                                </Typography>
                                                            </Box>
                                                        </Grid>
                                                    )}
                                                </Grid>

                                                {approval.expense?.description && (
                                                    <>
                                                        <Divider sx={{ my: 2 }} />
                                                        <Box>
                                                            <Typography variant="caption" color="text.secondary">
                                                                Description
                                                            </Typography>
                                                            <Typography variant="body2">
                                                                {approval.expense?.description}
                                                            </Typography>
                                                        </Box>
                                                    </>
                                                )}
                                            </CardContent>
                                        </Card>

                                        {/* Receipt */}
                                        {approval.expense?.receiptUrl && (
                                            <Card variant="outlined" sx={{ mt: 2 }}>
                                                <CardContent>
                                                    <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                                                        Receipt
                                                    </Typography>
                                                    <Box
                                                        component="img"
                                                        src={approval.expense?.receiptUrl}
                                                        alt="Receipt"
                                                        sx={{
                                                            width: '100%',
                                                            maxHeight: 200,
                                                            objectFit: 'contain',
                                                            borderRadius: 1,
                                                            cursor: 'pointer',
                                                            '&:hover': { opacity: 0.8 },
                                                        }}
                                                        onClick={() => handleViewReceipt(approval.expense?.receiptUrl || '')}
                                                    />
                                                    <Typography variant="caption" color="text.secondary">
                                                        Click to view full size
                                                    </Typography>
                                                </CardContent>
                                            </Card>
                                        )}
                                    </Grid>

                                    {/* Right Column - Actions */}
                                    <Grid item xs={12} md={4}>
                                        <Card variant="outlined" sx={{ bgcolor: '#f9f9f9' }}>
                                            <CardContent>
                                                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                                                    Actions
                                                </Typography>

                                                <Stack spacing={2} sx={{ mt: 2 }}>
                                                    <Button
                                                        variant="contained"
                                                        fullWidth
                                                        startIcon={<CheckCircle />}
                                                        onClick={() => handleAction(approval, 'APPROVED')}
                                                        sx={{
                                                            bgcolor: 'success.main',
                                                            '&:hover': { bgcolor: 'success.dark' },
                                                        }}
                                                    >
                                                        Approve
                                                    </Button>

                                                    <Button
                                                        variant="outlined"
                                                        fullWidth
                                                        color="error"
                                                        startIcon={<Cancel />}
                                                        onClick={() => handleAction(approval, 'REJECTED')}
                                                    >
                                                        Reject
                                                    </Button>

                                                    <Divider />

                                                    <Button
                                                        variant="text"
                                                        fullWidth
                                                        startIcon={<Visibility />}
                                                        onClick={() => navigate(`/expenses/${approval.expense?.id}`)}
                                                    >
                                                        View Full Details
                                                    </Button>
                                                </Stack>

                                                <Box sx={{ mt: 3, p: 2, bgcolor: 'white', borderRadius: 1 }}>
                                                    <Typography variant="caption" color="text.secondary">
                                                        <strong>Status:</strong>{' '}
                                                        <Chip
                                                            label={approval.expense?.status}
                                                            size="small"
                                                            color={getStatusChipColor(approval.expense?.status || '')}
                                                            sx={{ height: 18, fontSize: '0.65rem' }}
                                                        />
                                                    </Typography>
                                                </Box>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                </Grid>
                            </AccordionDetails>
                        </Accordion>
                    ))}
                </Box>
            )}

            {/* Decision Dialog */}
            <Dialog
                open={dialogOpen}
                onClose={() => {
                    if (!actionLoading) {
                        setDialogOpen(false);
                        setError('');
                        setSuccess('');
                    }
                }}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    {actionType === 'APPROVED' ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CheckCircle color="success" />
                            <Typography>Approve Expense</Typography>
                        </Box>
                    ) : (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Cancel color="error" />
                            <Typography>Reject Expense</Typography>
                        </Box>
                    )}
                </DialogTitle>
                <DialogContent>
                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                            {error}
                        </Alert>
                    )}
                    {success && (
                        <Alert severity="success" sx={{ mb: 2 }}>
                            {success}
                        </Alert>
                    )}

                    <Typography variant="body2" gutterBottom>
                        <strong>Expense:</strong> {selectedApproval?.expense?.title}
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                        <strong>Amount:</strong> ${selectedApproval?.expense?.amount.toFixed(2)}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 3 }}>
                        <strong>Submitted by:</strong> {selectedApproval?.expense?.user.name}
                    </Typography>

                    <TextField
                        fullWidth
                        multiline
                        rows={4}
                        label={actionType === 'REJECTED' ? 'Reason for Rejection *' : 'Comments (Optional)'}
                        value={comments}
                        onChange={(e) => setComments(e.target.value)}
                        placeholder={
                            actionType === 'REJECTED'
                                ? 'Please provide a reason for rejecting this expense...'
                                : 'Add any comments or notes...'
                        }
                        disabled={actionLoading}
                        error={actionType === 'REJECTED' && !comments.trim() && error !== ''}
                    />
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setDialogOpen(false)} disabled={actionLoading}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={confirmAction}
                        disabled={actionLoading}
                        color={actionType === 'APPROVED' ? 'success' : 'error'}
                        startIcon={actionLoading && <CircularProgress size={20} />}
                    >
                        {actionLoading ? 'Processing...' : `Confirm ${actionType === 'APPROVED' ? 'Approval' : 'Rejection'}`}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Receipt Dialog */}
            <Dialog
                open={receiptDialogOpen}
                onClose={() => setReceiptDialogOpen(false)}
                maxWidth="lg"
                fullWidth
            >
                <DialogTitle>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <ReceiptIcon />
                            <Typography variant="h6">Receipt</Typography>
                        </Box>
                        <IconButton onClick={() => setReceiptDialogOpen(false)}>
                            <Cancel />
                        </IconButton>
                    </Box>
                </DialogTitle>
                <DialogContent>
                    {selectedReceipt && (
                        <Box
                            component="img"
                            src={selectedReceipt}
                            alt="Receipt"
                            sx={{
                                width: '100%',
                                height: 'auto',
                                maxHeight: '80vh',
                                objectFit: 'contain',
                            }}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </Box>
    );
}

export default Approvals;
