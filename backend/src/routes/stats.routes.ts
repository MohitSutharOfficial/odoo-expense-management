import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import DatabaseService from '../services/database.service';
import { supabaseAdmin } from '../services/supabase.service';

const router = Router();

// Get dashboard stats
router.get('/dashboard', authenticate, async (req: AuthRequest, res) => {
    try {
        const user = req.user!;

        // Build base query for user's accessible expenses
        let query = supabaseAdmin.from('expenses').select('*, category:categories(name)');

        if (user.role === 'EMPLOYEE') {
            query = query.eq('user_id', user.id);
        } else if (user.role === 'MANAGER' && user.department) {
            query = query.eq('department_id', user.department);
        }

        const { data: allExpenses, error } = await query;

        if (error) throw error;

        const expenses = allExpenses || [];

        // Calculate stats
        const totalAmount = expenses.reduce((sum, e) => sum + parseFloat(e.amount || '0'), 0);
        const approvedCount = expenses.filter(e => e.status === 'APPROVED').length;
        const pendingCount = expenses.filter(e => e.status === 'PENDING').length;
        const rejectedCount = expenses.filter(e => e.status === 'REJECTED').length;

        // Monthly trend (last 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const monthlyTrend = expenses
            .filter(e => new Date(e.date) >= sixMonthsAgo)
            .reduce((acc: any[], expense) => {
                const month = new Date(expense.date).toLocaleDateString('en-US', { month: 'short' });
                const existing = acc.find(item => item.month === month);

                if (existing) {
                    existing.total += parseFloat(expense.amount || '0');
                } else {
                    acc.push({ month, total: parseFloat(expense.amount || '0') });
                }

                return acc;
            }, []);

        // Category breakdown with colors
        const COLORS = ['#714B67', '#00A09D', '#f0ad4e', '#28a745', '#dc3545', '#6f42c1', '#20c997', '#fd7e14'];
        const categoryBreakdown = expenses.reduce((acc: any[], expense) => {
            if (!expense.category) return acc;

            const existing = acc.find(item => item.category === expense.category.name);

            if (existing) {
                existing.amount += parseFloat(expense.amount || '0');
            } else {
                acc.push({
                    category: expense.category.name,
                    amount: parseFloat(expense.amount || '0'),
                    color: COLORS[acc.length % COLORS.length]
                });
            }

            return acc;
        }, []);

        // Recent expenses
        const recentExpenses = expenses
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 5);

        // Pending approvals (for managers/finance/admin)
        let pendingApprovals = 0;
        if (['MANAGER', 'FINANCE', 'ADMIN'].includes(user.role)) {
            const approvals = await DatabaseService.getPendingApprovals(user.id);
            pendingApprovals = approvals?.length || 0;
        }

        const response = {
            stats: {
                totalExpenses: expenses.length,
                totalAmount: totalAmount.toFixed(2),
                approvedCount,
                pendingCount,
                rejectedCount,
                pendingApprovals
            },
            monthlyTrend,
            categoryBreakdown: categoryBreakdown.sort((a, b) => b.amount - a.amount),
            recentExpenses
        };

        console.log('Dashboard stats response:', {
            totalExpenses: expenses.length,
            monthlyTrendLength: monthlyTrend.length,
            categoryBreakdownLength: categoryBreakdown.length,
            monthlyTrend,
            categoryBreakdown
        });

        res.json(response);
    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
});

export default router;
