import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import DatabaseService from '../services/database.service';

const router = Router();

// Get all budgets
router.get('/', authenticate, async (req: AuthRequest, res) => {
    try {
        const { department_id, period } = req.query;
        const user = req.user!;

        const filters: any = {};
        
        // Role-based filtering
        if (user.role === 'MANAGER' && user.department) {
            filters.department_id = user.department;
        } else if (department_id) {
            filters.department_id = department_id;
        }

        if (period) filters.period = period;

        const budgets = await DatabaseService.getAllBudgets(filters);
        res.json(budgets);
    } catch (error) {
        console.error('Get budgets error:', error);
        res.status(500).json({ error: 'Failed to fetch budgets' });
    }
});

// Get budget by ID
router.get('/:id', authenticate, async (req, res) => {
    try {
        const budget = await DatabaseService.getBudgetById(req.params.id);
        
        if (!budget) {
            return res.status(404).json({ error: 'Budget not found' });
        }

        res.json(budget);
    } catch (error) {
        console.error('Get budget error:', error);
        res.status(500).json({ error: 'Failed to fetch budget' });
    }
});

export default router;
