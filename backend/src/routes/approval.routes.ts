import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { body, validationResult } from 'express-validator';
import DatabaseService from '../services/database.service';

const router = Router();

// Helper function to transform approval data to camelCase
function transformApprovalForFrontend(approval: any) {
    if (!approval) return null;

    const transformed: any = {
        ...approval,
        expenseId: approval.expense_id,
        approverId: approval.approver_id,
        approvedAt: approval.approved_at,
        createdAt: approval.created_at,
        updatedAt: approval.updated_at
    };

    // Transform nested expense if present
    if (approval.expense) {
        transformed.expense = {
            ...approval.expense,
            userId: approval.expense.user_id,
            categoryId: approval.expense.category_id,
            departmentId: approval.expense.department_id,
            receiptUrl: approval.expense.receipt_url,
            merchantName: approval.expense.merchant, // Add alias
            paymentMethod: approval.expense.payment_method,
            createdAt: approval.expense.created_at,
            updatedAt: approval.expense.updated_at
        };
    }

    return transformed;
}

// Get pending approvals
router.get('/pending', authenticate, async (req: AuthRequest, res) => {
    try {
        const user = req.user!;

        // Only managers, finance, and admins can approve
        if (!['MANAGER', 'FINANCE', 'ADMIN'].includes(user.role)) {
            return res.json([]);
        }

        const approvals = await DatabaseService.getPendingApprovals(user.id);

        // Transform to camelCase for frontend
        const transformedApprovals = approvals.map(transformApprovalForFrontend);

        res.json(transformedApprovals);
    } catch (error) {
        console.error('Get pending approvals error:', error);
        res.status(500).json({ error: 'Failed to fetch approvals' });
    }
});

// Make approval decision
router.post(
    '/:id/decision',
    authenticate,
    [
        body('status').isIn(['APPROVED', 'REJECTED']),
        body('comments').optional().isString()
    ],
    async (req: AuthRequest, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const user = req.user!;
            const { status, comments } = req.body;

            // Get approval
            const approval = await DatabaseService.getApprovalById(req.params.id);

            if (!approval) {
                return res.status(404).json({ error: 'Approval not found' });
            }

            // Check if user is the approver
            if (approval.approver_id !== user.id) {
                return res.status(403).json({ error: 'You are not authorized to approve this expense' });
            }

            // Check if already processed
            if (approval.status !== 'PENDING') {
                return res.status(400).json({ error: 'This approval has already been processed' });
            }

            // Update approval
            const updatedApproval = await DatabaseService.updateApproval(req.params.id, {
                status,
                comments,
                approved_at: new Date().toISOString()
            });

            // Get all approvals for this expense
            const allApprovals = await DatabaseService.getApprovalsByExpense(approval.expense_id);

            // Determine final expense status
            let expenseStatus = 'PENDING';

            if (status === 'REJECTED') {
                // If any approval is rejected, reject the expense
                expenseStatus = 'REJECTED';
            } else {
                // Check if all approvals are approved
                const allApproved = allApprovals.every(a => a.status === 'APPROVED');
                if (allApproved) {
                    expenseStatus = 'APPROVED';
                }
            }

            // Update expense status
            await DatabaseService.updateExpense(approval.expense_id, {
                status: expenseStatus
            });

            // Create notification for expense owner
            const expense = await DatabaseService.getExpenseById(approval.expense_id);
            if (expense) {
                await DatabaseService.createNotification({
                    user_id: expense.user_id,
                    type: status === 'APPROVED' ? 'EXPENSE_APPROVED' : 'EXPENSE_REJECTED',
                    title: `Expense ${status.toLowerCase()}`,
                    message: `Your expense "${expense.title}" has been ${status.toLowerCase()}${comments ? ': ' + comments : ''}`,
                    link: `/expenses/${expense.id}`
                });
            }

            res.json({
                approval: updatedApproval,
                expense_status: expenseStatus
            });
        } catch (error) {
            console.error('Approval decision error:', error);
            res.status(500).json({ error: 'Failed to process approval' });
        }
    }
);

export default router;
