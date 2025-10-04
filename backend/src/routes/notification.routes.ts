import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import DatabaseService from '../services/database.service';

const router = Router();

// Get user notifications
router.get('/', authenticate, async (req: AuthRequest, res) => {
    try {
        const user = req.user!;
        const notifications = await DatabaseService.getUserNotifications(user.id);
        res.json(notifications);
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
});

// Mark notification as read
router.patch('/:id/read', authenticate, async (req: AuthRequest, res) => {
    try {
        const notification = await DatabaseService.markNotificationAsRead(req.params.id);
        res.json(notification);
    } catch (error) {
        console.error('Mark notification error:', error);
        res.status(500).json({ error: 'Failed to mark notification as read' });
    }
});

// Mark all notifications as read
router.patch('/read-all', authenticate, async (req: AuthRequest, res) => {
    try {
        const user = req.user!;
        await DatabaseService.markAllNotificationsAsRead(user.id);
        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        console.error('Mark all notifications error:', error);
        res.status(500).json({ error: 'Failed to mark notifications as read' });
    }
});

export default router;
