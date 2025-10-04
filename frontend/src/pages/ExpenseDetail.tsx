import { useEffect, useState } from 'react';
import {
    Box,
    Paper,
    Typography,
    Button,
    Chip,
    Grid,
    Card,
    CardContent,
    IconButton,
    Dialog,
    DialogContent,
    DialogTitle,
    Divider,
    Alert,
    LinearProgress,
    Stack,
} from '@mui/material';
import {
    Timeline,
    TimelineItem,
    TimelineSeparator,
    TimelineConnector,
    TimelineContent,
    TimelineDot,
    TimelineOppositeContent,
} from '@mui/lab';
import {
    ArrowBack,
    Edit,
    Delete,
    Receipt as ReceiptIcon,
    Close,
    CheckCircle,
    Cancel,
    HourglassEmpty,
    Paid,
    Person,
    CalendarToday,
    Category as CategoryIcon,
    AttachMoney,
    Store,
    CreditCard,
    Description,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { expenseAPI } from '../services/api';
import { Expense } from '../types';
import { useAuthStore } from '../store';

function ExpenseDetail() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const { user } = useAuthStore();
    const [expense, setExpense] = useState<Expense | null>(null);
    const [loading, setLoading] = useState(true);
    const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        if (id) {
            loadExpense();
        }
    }, [id]);

    const loadExpense = async () => {
        try {
            const res = await expenseAPI.getById(id!);
            setExpense(res.data);
        } catch (error) {
            console.error('Failed to load expense:', error);
            alert('Failed to load expense details');
            navigate('/expenses');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this expense? This action cannot be undone.')) {
            setDeleting(true);
            try {
                await expenseAPI.delete(id!);
                alert('Expense deleted successfully');
                navigate('/expenses');
            } catch (error) {
                console.error('Failed to delete expense:', error);
                alert('Failed to delete expense. It may already be submitted for approval.');
                setDeleting(false);
            }
        }
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

    const getStatusIcon = (status: string) => {
        const icons: any = {
            DRAFT: <Description />,
            PENDING: <HourglassEmpty />,
            APPROVED: <CheckCircle />,
            REJECTED: <Cancel />,
            PAID: <Paid />,
        };
        return icons[status] || <Description />;
    };

    const getApprovalStatusIcon = (status: string) => {
        const icons: any = {
            PENDING: <HourglassEmpty sx={{ color: 'warning.main' }} />,
            APPROVED: <CheckCircle sx={{ color: 'success.main' }} />,
            REJECTED: <Cancel sx={{ color: 'error.main' }} />,
        };
        return icons[status] || <HourglassEmpty />;
    };

    const canEdit = expense?.status === 'DRAFT' && expense?.userId === user?.id;
    const canDelete = expense?.status === 'DRAFT' && expense?.userId === user?.id;

    if (loading) {
        return (
            <Box>
                <LinearProgress />
                <Box sx={{ textAlign: 'center', mt: 4 }}>
                    <Typography>Loading expense details...</Typography>
                </Box>
            </Box>
        );
    }

    if (!expense) {
        return (
            <Box sx={{ textAlign: 'center', mt: 4 }}>
                <Typography>Expense not found</Typography>
                <Button onClick={() => navigate('/expenses')} sx={{ mt: 2 }}>
                    Back to Expenses
                </Button>
            </Box>
        );
    }

    return (
        <Box>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <IconButton onClick={() => navigate('/expenses')}>
                        <ArrowBack />
                    </IconButton>
                    <Box>
                        <Typography variant="h4" fontWeight={700}>
                            {expense.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Expense ID: {expense.id.substring(0, 8)}...
                        </Typography>
                    </Box>
                </Box>
                <Stack direction="row" spacing={1}>
                    {canEdit && (
                        <Button
                            variant="outlined"
                            startIcon={<Edit />}
                            onClick={() => navigate(`/expenses/${id}/edit`)}
                        >
                            Edit
                        </Button>
                    )}
                    {canDelete && (
                        <Button
                            variant="outlined"
                            color="error"
                            startIcon={<Delete />}
                            onClick={handleDelete}
                            disabled={deleting}
                        >
                            {deleting ? 'Deleting...' : 'Delete'}
                        </Button>
                    )}
                </Stack>
            </Box>

            {/* Status Alert */}
            {expense.status === 'REJECTED' && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    <Typography variant="body2" fontWeight={600}>
                        This expense was rejected
                    </Typography>
                    {expense.approvals?.find((a) => a.status === 'REJECTED')?.comments && (
                        <Typography variant="caption">
                            Reason: {expense.approvals.find((a) => a.status === 'REJECTED')?.comments}
                        </Typography>
                    )}
                </Alert>
            )}

            {expense.status === 'DRAFT' && (
                <Alert severity="info" sx={{ mb: 3 }}>
                    This expense is saved as a draft. Submit it for approval to get reimbursed.
                </Alert>
            )}

            <Grid container spacing={3}>
                {/* Left Column - Main Details */}
                <Grid item xs={12} md={8}>
                    {/* Expense Details */}
                    <Paper className="odoo-card" sx={{ p: 3, mb: 3 }}>
                        <Typography variant="h6" fontWeight={600} gutterBottom>
                            Expense Details
                        </Typography>

                        <Box sx={{ mt: 3 }}>
                            <Grid container spacing={3}>
                                <Grid item xs={6}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                        <AttachMoney sx={{ color: 'text.secondary' }} />
                                        <Box>
                                            <Typography variant="caption" color="text.secondary">
                                                Amount
                                            </Typography>
                                            <Typography variant="h5" fontWeight={700}>
                                                ${expense.amount.toFixed(2)}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {expense.currency}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Grid>

                                <Grid item xs={6}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                        <Box
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 1,
                                            }}
                                        >
                                            {getStatusIcon(expense.status)}
                                            <Box>
                                                <Typography variant="caption" color="text.secondary">
                                                    Status
                                                </Typography>
                                                <Box>
                                                    <Chip
                                                        label={expense.status}
                                                        color={getStatusChipColor(expense.status)}
                                                        size="small"
                                                    />
                                                </Box>
                                            </Box>
                                        </Box>
                                    </Box>
                                </Grid>

                                <Grid item xs={6}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <CategoryIcon sx={{ color: 'text.secondary' }} />
                                        <Box>
                                            <Typography variant="caption" color="text.secondary">
                                                Category
                                            </Typography>
                                            <Typography variant="body2" fontWeight={600}>
                                                {expense.category.icon} {expense.category.name}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Grid>

                                <Grid item xs={6}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <CalendarToday sx={{ color: 'text.secondary' }} />
                                        <Box>
                                            <Typography variant="caption" color="text.secondary">
                                                Date
                                            </Typography>
                                            <Typography variant="body2" fontWeight={600}>
                                                {new Date(expense.date).toLocaleDateString('en-US', {
                                                    month: 'long',
                                                    day: 'numeric',
                                                    year: 'numeric',
                                                })}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Grid>

                                {(expense.merchant || expense.merchantName) && (
                                    <Grid item xs={6}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Store sx={{ color: 'text.secondary' }} />
                                            <Box>
                                                <Typography variant="caption" color="text.secondary">
                                                    Merchant
                                                </Typography>
                                                <Typography variant="body2" fontWeight={600}>
                                                    {expense.merchant || expense.merchantName}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Grid>
                                )}

                                {expense.paymentMethod && (
                                    <Grid item xs={6}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <CreditCard sx={{ color: 'text.secondary' }} />
                                            <Box>
                                                <Typography variant="caption" color="text.secondary">
                                                    Payment Method
                                                </Typography>
                                                <Typography variant="body2" fontWeight={600}>
                                                    {expense.paymentMethod}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Grid>
                                )}

                                <Grid item xs={6}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Person sx={{ color: 'text.secondary' }} />
                                        <Box>
                                            <Typography variant="caption" color="text.secondary">
                                                Submitted By
                                            </Typography>
                                            <Typography variant="body2" fontWeight={600}>
                                                {expense.user.name}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {expense.user.email}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Grid>

                                {expense.department && (
                                    <Grid item xs={6}>
                                        <Box>
                                            <Typography variant="caption" color="text.secondary">
                                                Department
                                            </Typography>
                                            <Typography variant="body2" fontWeight={600}>
                                                {expense.department.name}
                                            </Typography>
                                        </Box>
                                    </Grid>
                                )}
                            </Grid>
                        </Box>

                        {expense.description && (
                            <>
                                <Divider sx={{ my: 3 }} />
                                <Box>
                                    <Typography variant="subtitle2" gutterBottom fontWeight={600}>
                                        Description
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {expense.description}
                                    </Typography>
                                </Box>
                            </>
                        )}
                    </Paper>

                    {/* Receipt */}
                    {expense.receiptUrl && (
                        <Paper className="odoo-card" sx={{ p: 3 }}>
                            <Typography variant="h6" fontWeight={600} gutterBottom>
                                Receipt
                            </Typography>
                            <Card
                                sx={{
                                    cursor: 'pointer',
                                    '&:hover': { boxShadow: 4 },
                                    transition: 'box-shadow 0.3s',
                                }}
                                onClick={() => setReceiptDialogOpen(true)}
                            >
                                <Box
                                    component="img"
                                    src={expense.receiptUrl}
                                    alt="Receipt"
                                    sx={{
                                        width: '100%',
                                        maxHeight: 400,
                                        objectFit: 'contain',
                                        bgcolor: '#f9f9f9',
                                    }}
                                />
                            </Card>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                                Click to view full size
                            </Typography>
                        </Paper>
                    )}
                </Grid>

                {/* Right Column - Approval Timeline */}
                <Grid item xs={12} md={4}>
                    <Paper className="odoo-card" sx={{ p: 3, position: 'sticky', top: 80 }}>
                        <Typography variant="h6" fontWeight={600} gutterBottom>
                            Approval Timeline
                        </Typography>

                        {!expense.approvals || expense.approvals.length === 0 ? (
                            <Box sx={{ textAlign: 'center', py: 4 }}>
                                <HourglassEmpty sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                                <Typography variant="body2" color="text.secondary">
                                    No approvals yet
                                </Typography>
                            </Box>
                        ) : (
                            <Timeline position="right" sx={{ p: 0, m: 0 }}>
                                {expense.approvals.map((approval, index) => (
                                    <TimelineItem key={approval.id}>
                                        <TimelineOppositeContent sx={{ flex: 0.2, py: 0 }}>
                                            <Typography variant="caption" color="text.secondary">
                                                Step {index + 1}
                                            </Typography>
                                        </TimelineOppositeContent>
                                        <TimelineSeparator>
                                            <TimelineDot
                                                color={
                                                    approval.status === 'APPROVED'
                                                        ? 'success'
                                                        : approval.status === 'REJECTED'
                                                            ? 'error'
                                                            : 'warning'
                                                }
                                            >
                                                {getApprovalStatusIcon(approval.status)}
                                            </TimelineDot>
                                            {index < expense.approvals!.length - 1 && <TimelineConnector />}
                                        </TimelineSeparator>
                                        <TimelineContent>
                                            <Card variant="outlined" sx={{ mb: 2 }}>
                                                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                                                    <Typography variant="subtitle2" fontWeight={600}>
                                                        {approval.approver.name}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {approval.approver.role || 'Approver'}
                                                    </Typography>
                                                    <Box sx={{ mt: 1 }}>
                                                        <Chip
                                                            label={approval.status}
                                                            size="small"
                                                            color={getStatusChipColor(approval.status)}
                                                        />
                                                    </Box>
                                                    {approval.comments && (
                                                        <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
                                                            "{approval.comments}"
                                                        </Typography>
                                                    )}
                                                    {approval.approvedAt && (
                                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                                                            {new Date(approval.approvedAt).toLocaleDateString()}
                                                        </Typography>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        </TimelineContent>
                                    </TimelineItem>
                                ))}
                            </Timeline>
                        )}
                    </Paper>
                </Grid>
            </Grid>

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
                            <Close />
                        </IconButton>
                    </Box>
                </DialogTitle>
                <DialogContent>
                    {expense.receiptUrl && (
                        <Box
                            component="img"
                            src={expense.receiptUrl}
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

export default ExpenseDetail;
