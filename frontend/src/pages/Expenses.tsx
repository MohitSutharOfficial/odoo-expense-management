import { useEffect, useState } from 'react';
import {
    Box,
    Paper,
    Typography,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    IconButton,
    TextField,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    InputAdornment,
    Pagination,
    LinearProgress,
    Tooltip,
    Stack,
} from '@mui/material';
import {
    Add,
    Search,
    Visibility,
    Edit,
    Delete,
    FilterList,
    Receipt as ReceiptIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { expenseAPI, categoryAPI } from '../services/api';
import { Expense, Category } from '../types';
import { useAuthStore } from '../store';
import { usePermissions, useCanEditExpense } from '../hooks/usePermissions';
import { canEditExpense as checkCanEdit, canDeleteExpense as checkCanDelete } from '../utils/permissions';

function Expenses() {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const permissions = usePermissions();
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

    useEffect(() => {
        loadCategories();
    }, []);

    useEffect(() => {
        loadExpenses();
    }, [page, statusFilter, categoryFilter, searchQuery]);

    const loadCategories = async () => {
        try {
            const res = await categoryAPI.getAll();
            setCategories(res.data);
        } catch (error) {
            console.error('Failed to load categories:', error);
        }
    };

    const loadExpenses = async () => {
        setLoading(true);
        try {
            const params: any = {
                page,
                limit: 10,
            };

            if (statusFilter !== 'ALL') {
                params.status = statusFilter;
            }
            if (categoryFilter !== 'ALL') {
                params.categoryId = categoryFilter;
            }
            if (searchQuery) {
                params.search = searchQuery;
            }

            const res = await expenseAPI.getAll(params);
            setExpenses(res.data);
            // Calculate total pages (assuming API returns total count)
            setTotalPages(Math.ceil((res.data.length || 10) / 10));
        } catch (error) {
            console.error('Failed to load expenses:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this expense?')) {
            try {
                await expenseAPI.delete(id);
                loadExpenses();
            } catch (error) {
                console.error('Failed to delete expense:', error);
                alert('Failed to delete expense. It may already be submitted for approval.');
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

    const canEdit = (expense: Expense) => {
        if (!user?.role || !user?.id) return false;
        return checkCanEdit(user.role as any, user.id, expense.userId, expense.status);
    };

    const canDelete = (expense: Expense) => {
        if (!user?.role || !user?.id) return false;
        return checkCanDelete(user.role as any, user.id, expense.userId, expense.status);
    };

    return (
        <Box>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                    <Typography variant="h4" fontWeight={700} gutterBottom>
                        My Expenses
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Manage and track your expense reports
                    </Typography>
                </Box>
                {permissions.canCreateExpense && (
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => navigate('/expenses/new')}
                        sx={{
                            bgcolor: 'secondary.main',
                            '&:hover': { bgcolor: 'secondary.dark' },
                        }}
                    >
                        New Expense
                    </Button>
                )}
            </Box>

            {/* Filters */}
            <Paper className="odoo-card" sx={{ p: 2, mb: 3 }}>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
                    <TextField
                        placeholder="Search expenses..."
                        size="small"
                        fullWidth
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Search />
                                </InputAdornment>
                            ),
                        }}
                        sx={{ maxWidth: { md: 400 } }}
                    />

                    <FormControl size="small" sx={{ minWidth: 150 }}>
                        <InputLabel>Status</InputLabel>
                        <Select
                            value={statusFilter}
                            label="Status"
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <MenuItem value="ALL">All Status</MenuItem>
                            <MenuItem value="DRAFT">Draft</MenuItem>
                            <MenuItem value="PENDING">Pending</MenuItem>
                            <MenuItem value="APPROVED">Approved</MenuItem>
                            <MenuItem value="REJECTED">Rejected</MenuItem>
                            <MenuItem value="PAID">Paid</MenuItem>
                        </Select>
                    </FormControl>

                    <FormControl size="small" sx={{ minWidth: 180 }}>
                        <InputLabel>Category</InputLabel>
                        <Select
                            value={categoryFilter}
                            label="Category"
                            onChange={(e) => setCategoryFilter(e.target.value)}
                        >
                            <MenuItem value="ALL">All Categories</MenuItem>
                            {categories.map((cat) => (
                                <MenuItem key={cat.id} value={cat.id}>
                                    {cat.icon} {cat.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <Button
                        variant="outlined"
                        startIcon={<FilterList />}
                        onClick={() => {
                            setSearchQuery('');
                            setStatusFilter('ALL');
                            setCategoryFilter('ALL');
                        }}
                        sx={{ minWidth: 120 }}
                    >
                        Clear Filters
                    </Button>
                </Stack>
            </Paper>

            {/* Table */}
            <Paper className="odoo-card">
                {loading && <LinearProgress />}
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Title</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Amount</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Receipt</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {expenses.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                                        <Typography variant="body2" color="text.secondary">
                                            No expenses found. Create your first expense!
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                expenses.map((expense) => (
                                    <TableRow
                                        key={expense.id}
                                        hover
                                        sx={{ cursor: 'pointer' }}
                                        onClick={() => navigate(`/expenses/${expense.id}`)}
                                    >
                                        <TableCell>
                                            {new Date(expense.date).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric',
                                            })}
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight={600}>
                                                {expense.title}
                                            </Typography>
                                            {expense.description && (
                                                <Typography variant="caption" color="text.secondary" noWrap>
                                                    {expense.description.substring(0, 50)}
                                                    {expense.description.length > 50 ? '...' : ''}
                                                </Typography>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={expense.category.name}
                                                icon={<span>{expense.category.icon}</span>}
                                                size="small"
                                                sx={{
                                                    bgcolor: expense.category.color || '#f0f0f0',
                                                    color: '#fff',
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight={600}>
                                                ${expense.amount.toFixed(2)}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {expense.currency}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={expense.status}
                                                size="small"
                                                color={getStatusChipColor(expense.status)}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            {expense.receiptUrl ? (
                                                <Tooltip title="View Receipt">
                                                    <ReceiptIcon sx={{ fontSize: 20, color: 'success.main' }} />
                                                </Tooltip>
                                            ) : (
                                                <Tooltip title="No Receipt">
                                                    <ReceiptIcon sx={{ fontSize: 20, color: 'text.disabled' }} />
                                                </Tooltip>
                                            )}
                                        </TableCell>
                                        <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                                            <Tooltip title="View Details">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => navigate(`/expenses/${expense.id}`)}
                                                >
                                                    <Visibility fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            {canEdit(expense) && (
                                                <Tooltip title="Edit">
                                                    <IconButton
                                                        size="small"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            navigate(`/expenses/${expense.id}/edit`);
                                                        }}
                                                    >
                                                        <Edit fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            )}
                                            {canDelete(expense) && (
                                                <Tooltip title="Delete">
                                                    <IconButton
                                                        size="small"
                                                        color="error"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDelete(expense.id);
                                                        }}
                                                    >
                                                        <Delete fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* Pagination */}
                {expenses.length > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                        <Pagination
                            count={totalPages}
                            page={page}
                            onChange={(e, value) => setPage(value)}
                            color="primary"
                        />
                    </Box>
                )}
            </Paper>
        </Box>
    );
}

export default Expenses;
