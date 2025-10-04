import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import DatabaseService from '../services/database.service';

const router = Router();

// Get all departments
router.get('/', authenticate, async (req, res) => {
    try {
        const departments = await DatabaseService.getAllDepartments();
        res.json(departments);
    } catch (error) {
        console.error('Get departments error:', error);
        res.status(500).json({ error: 'Failed to fetch departments' });
    }
});

// Get department by ID
router.get('/:id', authenticate, async (req, res) => {
    try {
        const department = await DatabaseService.getDepartmentById(req.params.id);
        
        if (!department) {
            return res.status(404).json({ error: 'Department not found' });
        }

        res.json(department);
    } catch (error) {
        console.error('Get department error:', error);
        res.status(500).json({ error: 'Failed to fetch department' });
    }
});

export default router;
