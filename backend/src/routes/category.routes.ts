import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import DatabaseService from '../services/database.service';

const router = Router();

// Get all categories
router.get('/', authenticate, async (req, res) => {
    try {
        const categories = await DatabaseService.getAllCategories();
        res.json(categories);
    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
});

// Get category by ID
router.get('/:id', authenticate, async (req, res) => {
    try {
        const category = await DatabaseService.getCategoryById(req.params.id);
        
        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }

        res.json(category);
    } catch (error) {
        console.error('Get category error:', error);
        res.status(500).json({ error: 'Failed to fetch category' });
    }
});

export default router;
