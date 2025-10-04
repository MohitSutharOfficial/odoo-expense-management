import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { body, validationResult } from 'express-validator';
import DatabaseService from '../services/database.service';
import { SupabaseService } from '../services/supabase.service';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import * as fs from 'fs';

const router = Router();

// Configure multer for avatar uploads
const upload = multer({
    dest: 'uploads/',
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'));
        }
    }
});

// Get all users (Admin/Finance only)
router.get('/', authenticate, async (req: AuthRequest, res) => {
    try {
        const user = req.user!;

        if (!['ADMIN', 'FINANCE'].includes(user.role)) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const users = await DatabaseService.getAllUsers();

        res.json(users);
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// Get user profile
router.get('/profile', authenticate, async (req: AuthRequest, res) => {
    try {
        const user = req.user!;
        const profile = await DatabaseService.getUserById(user.id);

        if (!profile) {
            return res.status(404).json({ error: 'Profile not found' });
        }

        res.json(profile);
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

// Update user profile
router.put(
    '/profile',
    authenticate,
    [
        body('name').optional().trim().notEmpty(),
        body('phone').optional().trim(),
        body('department').optional().isString(),
        body('avatar').optional().isString()
    ],
    async (req: AuthRequest, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const user = req.user!;
            const updates: any = {};

            if (req.body.name) updates.name = req.body.name;
            if (req.body.phone !== undefined) updates.phone = req.body.phone;
            if (req.body.department !== undefined) updates.department = req.body.department;
            if (req.body.avatar !== undefined) updates.avatar_url = req.body.avatar;

            const updatedProfile = await DatabaseService.updateUser(user.id, updates);

            res.json(updatedProfile);
        } catch (error) {
            console.error('Update profile error:', error);
            res.status(500).json({ error: 'Failed to update profile' });
        }
    }
);

// Get user by ID (Admin/Finance/Manager only)
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
    try {
        const user = req.user!;

        if (!['ADMIN', 'FINANCE', 'MANAGER'].includes(user.role)) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const profile = await DatabaseService.getUserById(req.params.id);

        if (!profile) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(profile);
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});

// Update user (Admin only)
router.put(
    '/:id',
    authenticate,
    [
        body('name').optional().trim().notEmpty(),
        body('role').optional().isIn(['EMPLOYEE', 'MANAGER', 'FINANCE', 'ADMIN']),
        body('department').optional().isString(),
        body('is_active').optional().isBoolean()
    ],
    async (req: AuthRequest, res) => {
        try {
            const user = req.user!;

            if (user.role !== 'ADMIN') {
                return res.status(403).json({ error: 'Access denied' });
            }

            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const updates: any = {};

            if (req.body.name) updates.name = req.body.name;
            if (req.body.role) updates.role = req.body.role;
            if (req.body.department !== undefined) updates.department = req.body.department;
            if (req.body.is_active !== undefined) updates.is_active = req.body.is_active;

            const updatedUser = await DatabaseService.updateUser(req.params.id, updates);

            res.json(updatedUser);
        } catch (error) {
            console.error('Update user error:', error);
            res.status(500).json({ error: 'Failed to update user' });
        }
    }
);

// Get user preferences
router.get('/preferences', authenticate, async (req: AuthRequest, res) => {
    try {
        const user = req.user!;

        const { supabaseAdmin } = await import('../services/supabase.service');
        const { data, error } = await supabaseAdmin
            .from('user_preferences')
            .select('*')
            .eq('user_id', user.id)
            .single(); if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
                throw error;
            }

        // Return default preferences if none exist
        if (!data) {
            return res.json({
                emailNotifications: true,
                pushNotifications: false,
                expenseSubmitted: true,
                expenseApproved: true,
                expenseRejected: true,
                budgetAlert: true,
                weeklyDigest: true,
                emailFrequency: 'instant',
                digestDay: 'monday',
                theme: 'light',
                language: 'en',
                currency: 'USD',
                dateFormat: 'MM/DD/YYYY',
                timeFormat: '12h'
            });
        }

        res.json(data.preferences || {});
    } catch (error) {
        console.error('Get preferences error:', error);
        res.status(500).json({ error: 'Failed to fetch preferences' });
    }
});

// Update user preferences
router.put('/preferences', authenticate, async (req: AuthRequest, res) => {
    try {
        const user = req.user!;
        const preferences = req.body;

        console.log('📝 Updating preferences for user:', user.id);

        const { supabaseAdmin } = await import('../services/supabase.service');

        // Check if preferences exist
        const { data: existing } = await supabaseAdmin
            .from('user_preferences')
            .select('*')
            .eq('user_id', user.id)
            .single();

        let result;
        if (existing) {
            // Update existing preferences
            const { data, error } = await supabaseAdmin
                .from('user_preferences')
                .update({ preferences, updated_at: new Date().toISOString() })
                .eq('user_id', user.id)
                .select()
                .single();

            if (error) throw error;
            result = data;
        } else {
            // Insert new preferences
            const { data, error } = await supabaseAdmin
                .from('user_preferences')
                .insert({
                    user_id: user.id,
                    preferences,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .select()
                .single();

            if (error) throw error;
            result = data;
        }

        console.log('✅ Preferences updated successfully');
        res.json({ success: true, preferences: result.preferences });
    } catch (error: any) {
        console.error('❌ Update preferences error:', error);
        res.status(500).json({ error: error.message || 'Failed to update preferences' });
    }
});

// Upload avatar to Cloudinary
router.post('/upload-avatar', authenticate, upload.single('avatar'), async (req: AuthRequest, res) => {
    try {
        const user = req.user!;

        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'No file uploaded'
            });
        }

        console.log('📤 Uploading avatar to Cloudinary for user:', user.id);

        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload(req.file.path, {
            folder: 'avatars',
            public_id: `avatar_${user.id}_${Date.now()}`,
            overwrite: true,
            resource_type: 'image',
            transformation: [
                { width: 200, height: 200, crop: 'fill', gravity: 'face' },
                { quality: 'auto', fetch_format: 'auto' }
            ]
        });

        // Clean up temporary file
        fs.unlinkSync(req.file.path);

        console.log('✅ Avatar uploaded successfully:', result.secure_url);

        // Update user avatar in database
        const updatedUser = await DatabaseService.updateUser(user.id, {
            avatar_url: result.secure_url
        });

        res.json({
            success: true,
            avatar_url: result.secure_url,
            user: updatedUser
        });
    } catch (error: any) {
        console.error('❌ Avatar upload error:', error);

        // Clean up file if it exists
        if (req.file?.path && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        res.status(500).json({
            success: false,
            error: error.message || 'Failed to upload avatar'
        });
    }
});

export default router;
