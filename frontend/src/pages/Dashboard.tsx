import { useEffect, useState } from 'react';
import {
    Box,
    Grid,
    Paper,
    Typography,
    Card,
    CardContent,
    Button,
    Chip,
    LinearProgress,
} from '@mui/material';
import {
    TrendingUp,
    TrendingDown,
    AttachMoney,
    Receipt,
    CheckCircle,
    PendingActions,
} from '@mui/icons-material';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useAuthStore } from '../store';
import { statsAPI, budgetAPI, expenseAPI } from '../services/api';
import { DashboardStats, Budget, Expense } from '../types';
import { useNavigate } from 'react-router-dom';

function Dashboard() {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [budgets, setBudgets] = useState<Budget[]>([]);
    const [recentExpenses, setRecentExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            const [statsRes, budgetsRes, expensesRes] = await Promise.all([
                statsAPI.getDashboard().catch(err => {
                    console.error('Stats API error:', err);
                    return {
                        data: {
                            stats: {
                                totalExpenses: 0,
                                totalAmount: '0.00',
                                approvedCount: 0,
                                pendingCount: 0,
                                rejectedCount: 0,
                                pendingApprovals: 0
                            },
                            monthlyTrend: [],
                            categoryBreakdown: [],
                            recentExpenses: []
                        }
                    };
                }),
                budgetAPI.getAll().catch(err => {
                    console.error('Budgets API error:', err);
                    return { data: [] };
                }),
                expenseAPI.getAll({ limit: 5 }).catch(err => {
                    console.error('Expenses API error:', err);
                    return { data: [] };
                }),
            ]);

            console.log('Dashboard data loaded:', { stats: statsRes.data, budgets: budgetsRes.data, expenses: expensesRes.data });

            // The API returns { stats, monthlyTrend, categoryBreakdown, recentExpenses }
            const apiData = statsRes.data || {};
            const statsData = apiData.stats || {};

            setStats({
                totalExpenses: statsData.totalExpenses || 0,
                totalAmount: statsData.totalAmount || '0.00',
                approvedCount: statsData.approvedCount || 0,
                pendingCount: statsData.pendingCount || 0,
                rejectedCount: statsData.rejectedCount || 0,
                pendingApprovals: statsData.pendingApprovals || 0,
                monthlyTrend: apiData.monthlyTrend || [],
                categoryBreakdown: apiData.categoryBreakdown || [],
                recentExpenses: apiData.recentExpenses || []
            });
            setBudgets(budgetsRes.data || []);
            setRecentExpenses(apiData.recentExpenses || expensesRes.data || []);
        } catch (error: any) {
            console.error('Failed to load dashboard:', error);
            // Set default values on error
            setStats({
                totalExpenses: 0,
                totalAmount: '0.00',
                approvedCount: 0,
                pendingCount: 0,
                rejectedCount: 0,
                pendingApprovals: 0,
                categoryBreakdown: [],
                monthlyTrend: [],
                recentExpenses: []
            });
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <Box sx={{ width: '100%', mt: 2 }}><LinearProgress /></Box>;
    }

    // Ensure stats has default values to prevent crashes
    const safeStats = stats || {
        totalExpenses: 0,
        totalAmount: '0.00',
        approvedCount: 0,
        pendingCount: 0,
        rejectedCount: 0,
        pendingApprovals: 0,
        categoryBreakdown: [],
        monthlyTrend: [],
        recentExpenses: []
    };

    const COLORS = ['#714B67', '#00A09D', '#f0ad4e', '#28a745', '#dc3545'];

    const StatCard = ({ title, value, subtitle, icon, trend }: any) => (
        <Card className="odoo-card" sx={{ height: '100%' }}>
            <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                    <Box>
                        <Typography variant="body2" color="text.secondary" gutterBottom fontWeight={500}>
                            {title}
                        </Typography>
                        <Typography variant="h4" fontWeight={700} sx={{ mb: 0.5 }}>
                            {value}
                        </Typography>
                        {subtitle && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                {trend !== undefined && (
                                    trend >= 0 ? (
                                        <TrendingUp sx={{ fontSize: 16, color: 'success.main' }} />
                                    ) : (
                                        <TrendingDown sx={{ fontSize: 16, color: 'error.main' }} />
                                    )
                                )}
                                <Typography variant="caption" color={trend >= 0 ? 'success.main' : 'error.main'} fontWeight={600}>
                                    {subtitle}
                                </Typography>
                            </Box>
                        )}
                    </Box>
                    <Box
                        sx={{
                            p: 1.5,
                            borderRadius: 2,
                            bgcolor: 'primary.main',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        {icon}
                    </Box>
                </Box>
            </CardContent>
        </Card>
    );

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

    return (
        <Box>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" fontWeight={700} gutterBottom>
                    Welcome back, {user?.name}! 👋
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Here's an overview of your expenses
                </Typography>
            </Box>

            {/* KPI Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="This Month Spent"
                        value={`$${safeStats.totalAmount}`}
                        subtitle="This month"
                        icon={<AttachMoney />}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Total Expenses"
                        value={safeStats.totalExpenses}
                        subtitle="This month"
                        icon={<Receipt />}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Pending Approvals"
                        value={safeStats.pendingCount}
                        subtitle="Requires action"
                        icon={<PendingActions />}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Approved"
                        value={safeStats.approvedCount}
                        subtitle="All time"
                        icon={<CheckCircle />}
                    />
                </Grid>
            </Grid>

            {/* Charts Row */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                {/* Category Breakdown */}
                <Grid item xs={12} md={6}>
                    <Paper className="odoo-card" sx={{ p: 3, height: '100%' }}>
                        <Typography variant="h6" fontWeight={600} gutterBottom>
                            Spending by Category
                        </Typography>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={safeStats.categoryBreakdown}
                                    dataKey="amount"
                                    nameKey="category"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={100}
                                    label
                                >
                                    {safeStats.categoryBreakdown.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>

                {/* Monthly Trend */}
                <Grid item xs={12} md={6}>
                    <Paper className="odoo-card" sx={{ p: 3, height: '100%' }}>
                        <Typography variant="h6" fontWeight={600} gutterBottom>
                            Monthly Trend
                        </Typography>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={safeStats.monthlyTrend}>
                                <XAxis dataKey="month" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="total" fill="#714B67" radius={[8, 8, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>
            </Grid>

            {/* Budget Status & Recent Expenses */}
            <Grid container spacing={3}>
                {/* Budget Status */}
                <Grid item xs={12} md={6}>
                    <Paper className="odoo-card" sx={{ p: 3 }}>
                        <Typography variant="h6" fontWeight={600} gutterBottom>
                            Budget Status
                        </Typography>
                        {budgets.length === 0 ? (
                            <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                                No budgets configured
                            </Typography>
                        ) : (
                            budgets.map((budget: any) => {
                                // Backend returns 'amount' and 'spent', not 'allocatedAmount' and 'spentAmount'
                                const allocatedAmount = budget.amount || budget.allocatedAmount || 0;
                                const spentAmount = budget.spent || budget.spentAmount || 0;
                                const alertThreshold = budget.alert_threshold || budget.alertThreshold || 80;

                                const percentage = allocatedAmount > 0 ? (spentAmount / allocatedAmount) * 100 : 0;
                                const isOverBudget = percentage > 100;
                                const isNearLimit = percentage > alertThreshold;

                                return (
                                    <Box key={budget.id} sx={{ mb: 3 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                            <Typography variant="body2" fontWeight={600}>
                                                {budget.department?.name || 'Unknown'}
                                            </Typography>
                                            <Typography variant="body2" fontWeight={600}>
                                                ${spentAmount.toFixed(0)} / ${allocatedAmount.toFixed(0)}
                                            </Typography>
                                        </Box>
                                        <LinearProgress
                                            variant="determinate"
                                            value={Math.min(percentage, 100)}
                                            sx={{
                                                height: 8,
                                                borderRadius: 1,
                                                backgroundColor: '#e0e0e0',
                                                '& .MuiLinearProgress-bar': {
                                                    bgcolor: isOverBudget ? 'error.main' : isNearLimit ? 'warning.main' : 'success.main',
                                                },
                                            }}
                                        />
                                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                                            {percentage.toFixed(1)}% used
                                        </Typography>
                                    </Box>
                                );
                            })
                        )}
                    </Paper>
                </Grid>

                {/* Recent Expenses */}
                <Grid item xs={12} md={6}>
                    <Paper className="odoo-card" sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6" fontWeight={600}>
                                Recent Expenses
                            </Typography>
                            <Button size="small" onClick={() => navigate('/expenses')}>
                                View All
                            </Button>
                        </Box>
                        {recentExpenses.length === 0 ? (
                            <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                                No expenses yet
                            </Typography>
                        ) : (
                            recentExpenses.map((expense) => (
                                <Box
                                    key={expense.id}
                                    sx={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        py: 1.5,
                                        borderBottom: '1px solid #f0f0f0',
                                        cursor: 'pointer',
                                        '&:hover': { bgcolor: '#f9f9f9' },
                                    }}
                                    onClick={() => navigate(`/expenses/${expense.id}`)}
                                >
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="body2" fontWeight={600}>
                                            {expense.title || 'Untitled'}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {expense.category?.name || 'Unknown'} • {new Date(expense.date).toLocaleDateString()}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ textAlign: 'right' }}>
                                        <Typography variant="body2" fontWeight={600}>
                                            ${(expense.amount || 0).toFixed(2)}
                                        </Typography>
                                        <Chip
                                            label={expense.status}
                                            size="small"
                                            color={getStatusChipColor(expense.status)}
                                            sx={{ height: 20, fontSize: '0.7rem', mt: 0.5 }}
                                        />
                                    </Box>
                                </Box>
                            ))
                        )}
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
}

export default Dashboard;
