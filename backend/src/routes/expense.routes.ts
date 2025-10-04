import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { body, validationResult } from 'express-validator';
import { OCRService } from '../services/ocr.service';
import fs from 'fs';
import DatabaseService from '../services/database.service';
import { supabaseAdmin } from '../services/supabase.service';

const router = Router();
const upload = multer({ dest: 'uploads/' });

// Helper function to transform snake_case to camelCase for frontend
function transformExpenseForFrontend(expense: any) {
    if (!expense) return null;

    return {
        ...expense,
        userId: expense.user_id,
        categoryId: expense.category_id,
        departmentId: expense.department_id,
        receiptUrl: expense.receipt_url,
        merchantName: expense.merchant, // Add merchantName alias for backwards compatibility
        paymentMethod: expense.payment_method,
        createdAt: expense.created_at,
        updatedAt: expense.updated_at,
        approvals: expense.approvals?.map((approval: any) => ({
            ...approval,
            expenseId: approval.expense_id,
            approverId: approval.approver_id,
            approvedAt: approval.approved_at,
            createdAt: approval.created_at,
            updatedAt: approval.updated_at
        }))
    };
}

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Get all expenses (with filters)
router.get('/', authenticate, async (req: AuthRequest, res) => {
    try {
        const { status, category_id, start_date, end_date, user_id, department_id } = req.query;
        const user = req.user!;

        const filters: any = {};

        // Role-based filtering
        if (user.role === 'EMPLOYEE') {
            filters.user_id = user.id;
        } else if (user.role === 'MANAGER' && user.department) {
            // Managers see their department's expenses
            filters.department_id = user.department;
        }

        // Apply query filters
        if (status) filters.status = status;
        if (category_id) filters.category_id = category_id;
        if (user_id && user.role !== 'EMPLOYEE') filters.user_id = user_id;
        if (department_id && user.role !== 'EMPLOYEE') filters.department_id = department_id;
        if (start_date) filters.start_date = start_date;
        if (end_date) filters.end_date = end_date;

        const expenses = await DatabaseService.getAllExpenses(filters);

        // Transform to camelCase for frontend
        const transformedExpenses = expenses.map(transformExpenseForFrontend);

        res.json(transformedExpenses);
    } catch (error) {
        console.error('Get expenses error:', error);
        res.status(500).json({ error: 'Failed to fetch expenses' });
    }
});

// Get single expense
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
    try {
        const expense = await DatabaseService.getExpenseById(req.params.id);

        if (!expense) {
            return res.status(404).json({ error: 'Expense not found' });
        }

        // Check access permissions
        const user = req.user!;
        if (user.role === 'EMPLOYEE' && expense.user_id !== user.id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Transform to camelCase for frontend
        const transformedExpense = transformExpenseForFrontend(expense);

        res.json(transformedExpense);
    } catch (error) {
        console.error('Get expense error:', error);
        res.status(500).json({ error: 'Failed to fetch expense' });
    }
});

// Create expense
router.post(
    '/',
    authenticate,
    upload.single('receipt'),
    [
        body('title').trim().notEmpty().withMessage('Title is required'),
        body('amount').isNumeric().withMessage('Amount must be a number'),
        body('category_id').notEmpty().withMessage('Category is required'),
        body('date').notEmpty().withMessage('Date is required')
    ],
    async (req: AuthRequest, res) => {
        try {
            console.log('📨 Received expense data:', {
                body: req.body,
                file: req.file ? { filename: req.file.filename, mimetype: req.file.mimetype } : null
            });

            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                console.error('❌ Validation errors:', errors.array());
                return res.status(400).json({
                    error: 'Validation failed',
                    errors: errors.array(),
                    message: errors.array()[0]?.msg || 'Invalid input'
                });
            }

            const user = req.user!;
            let receiptUrl = null;
            let receiptData = null;

            // Handle receipt upload
            if (req.file) {
                try {
                    // Upload to Cloudinary
                    const result = await cloudinary.uploader.upload(req.file.path, {
                        folder: 'expense-receipts',
                        resource_type: 'auto'
                    });
                    receiptUrl = result.secure_url;

                    // Try OCR if it's an image
                    if (req.file.mimetype.startsWith('image/')) {
                        try {
                            console.log('Starting OCR processing...');
                            const ocrResult = await OCRService.processReceipt(req.file.path);
                            if (ocrResult && ocrResult.text) {
                                receiptData = JSON.stringify(ocrResult);
                                console.log('OCR completed successfully');
                            }
                        } catch (ocrError) {
                            console.error('OCR processing error:', ocrError);
                            // Continue without OCR data
                        }
                    }

                    // Clean up local file
                    fs.unlinkSync(req.file.path);
                } catch (uploadError) {
                    console.error('Upload error:', uploadError);
                    // Continue without receipt
                }
            }

            // Validate and normalize payment method
            const validPaymentMethods = ['CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'BANK_TRANSFER', 'OTHER'];
            let paymentMethod = req.body.payment_method?.toUpperCase() || null;
            if (paymentMethod && !validPaymentMethods.includes(paymentMethod)) {
                // Map common values
                if (paymentMethod.includes('CREDIT')) paymentMethod = 'CREDIT_CARD';
                else if (paymentMethod.includes('DEBIT')) paymentMethod = 'DEBIT_CARD';
                else if (paymentMethod.includes('CASH')) paymentMethod = 'CASH';
                else if (paymentMethod.includes('BANK') || paymentMethod.includes('TRANSFER')) paymentMethod = 'BANK_TRANSFER';
                else if (paymentMethod.includes('ONLINE')) paymentMethod = 'CREDIT_CARD';
                else paymentMethod = 'OTHER';
            }

            // Create expense (only include fields that exist in schema)
            const expenseData = {
                user_id: user.id,
                category_id: req.body.category_id,
                department_id: req.body.department_id || null,
                title: req.body.title,
                description: req.body.description || null,
                amount: parseFloat(req.body.amount),
                date: req.body.date,
                status: req.body.status || 'PENDING',
                receipt_url: receiptUrl,
                merchant: req.body.merchant || null,
                payment_method: paymentMethod,
                notes: req.body.notes || null
            };

            console.log('📝 Creating expense with data:', JSON.stringify(expenseData, null, 2));

            const expense = await DatabaseService.createExpense(expenseData);

            console.log('✅ Expense created successfully:', expense.id);

            // Create approval workflow
            // Find managers/approvers based on role hierarchy
            const { data: managers } = await supabaseAdmin
                .from('user_profiles')
                .select('id, role, name')
                .in('role', ['MANAGER', 'FINANCE', 'ADMIN'])
                .eq('is_active', true);

            if (managers && managers.length > 0) {
                // Create approval records (schema only has: expense_id, approver_id, status)
                const approvals = [];

                // Add Manager approval
                const manager = managers.find(m => m.role === 'MANAGER');
                if (manager) {
                    approvals.push({
                        expense_id: expense.id,
                        approver_id: manager.id,
                        status: 'PENDING'
                    });
                    console.log('📋 Added Manager approval:', manager.name);
                }

                // Add Finance approval for amounts > $1000
                const finance = managers.find(m => m.role === 'FINANCE');
                if (finance && parseFloat(req.body.amount) > 1000) {
                    approvals.push({
                        expense_id: expense.id,
                        approver_id: finance.id,
                        status: 'PENDING'
                    });
                    console.log('📋 Added Finance approval for high amount:', finance.name);
                }

                if (approvals.length > 0) {
                    const { error: approvalError } = await supabaseAdmin
                        .from('approvals')
                        .insert(approvals);

                    if (approvalError) {
                        console.error('⚠️ Approval creation error:', approvalError);
                        // Don't fail the expense creation, just log the error
                    } else {
                        console.log('✅ Approvals created:', approvals.length);

                        // Create notifications for approvers
                        const notifications = approvals.map(approval => ({
                            user_id: approval.approver_id,
                            title: 'New Expense Approval Required',
                            message: `${user.email} submitted "${expenseData.title}" for $${expenseData.amount}. Please review and approve.`,
                            type: 'APPROVAL',
                            is_read: false
                        }));

                        const { error: notifError } = await supabaseAdmin
                            .from('notifications')
                            .insert(notifications);

                        if (notifError) {
                            console.error('⚠️ Notification creation error:', notifError);
                        } else {
                            console.log('✅ Notifications sent to approvers:', notifications.length);
                        }
                    }
                } else {
                    console.log('⚠️ No approvers found for expense');
                }
            } else {
                console.log('⚠️ No managers/approvers available in system');
            }

            // Create notification for expense creator
            const creatorNotification = {
                user_id: user.id,
                title: 'Expense Submitted Successfully',
                message: `Your expense "${expenseData.title}" for $${expenseData.amount} has been submitted for approval.`,
                type: 'EXPENSE',
                is_read: false
            };

            const { error: creatorNotifError } = await supabaseAdmin
                .from('notifications')
                .insert(creatorNotification);

            if (creatorNotifError) {
                console.error('⚠️ Creator notification error:', creatorNotifError);
            } else {
                console.log('✅ Creator notification sent');
            }

            // Fetch complete expense data with relations
            const completeExpense = await DatabaseService.getExpenseById(expense.id);

            // Transform to camelCase for frontend
            const transformedExpense = transformExpenseForFrontend(completeExpense);

            console.log('🎉 Expense creation completed successfully');
            res.status(201).json(transformedExpense);
        } catch (error: any) {
            console.error('❌ Create expense error:', error);
            console.error('Error details:', {
                message: error.message,
                code: error.code,
                details: error.details,
                hint: error.hint
            });

            res.status(500).json({
                error: 'Failed to create expense',
                message: error.message || 'Unknown error',
                details: error.details || null
            });
        }
    }
);

// Update expense
router.put(
    '/:id',
    authenticate,
    [
        body('title').optional().trim().notEmpty(),
        body('amount').optional().isNumeric(),
        body('category_id').optional().notEmpty(),
        body('date').optional().isISO8601()
    ],
    async (req: AuthRequest, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const user = req.user!;
            const expense = await DatabaseService.getExpenseById(req.params.id);

            if (!expense) {
                return res.status(404).json({ error: 'Expense not found' });
            }

            // Check ownership
            if (expense.user_id !== user.id && !['ADMIN', 'FINANCE'].includes(user.role)) {
                return res.status(403).json({ error: 'Access denied' });
            }

            // Can't update approved/rejected expenses
            if (['APPROVED', 'REJECTED'].includes(expense.status) && user.role === 'EMPLOYEE') {
                return res.status(400).json({ error: 'Cannot update approved or rejected expenses' });
            }

            const updates: any = {};
            if (req.body.title) updates.title = req.body.title;
            if (req.body.description !== undefined) updates.description = req.body.description;
            if (req.body.amount) updates.amount = parseFloat(req.body.amount);
            if (req.body.category_id) updates.category_id = req.body.category_id;
            if (req.body.date) updates.date = req.body.date;
            if (req.body.merchant !== undefined) updates.merchant = req.body.merchant;
            if (req.body.payment_method) updates.payment_method = req.body.payment_method;
            if (req.body.notes !== undefined) updates.notes = req.body.notes;

            const updatedExpense = await DatabaseService.updateExpense(req.params.id, updates);

            // Transform to camelCase for frontend
            const transformedExpense = transformExpenseForFrontend(updatedExpense);

            res.json(transformedExpense);
        } catch (error) {
            console.error('Update expense error:', error);
            res.status(500).json({ error: 'Failed to update expense' });
        }
    }
);

// Delete expense
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
    try {
        const user = req.user!;
        const expense = await DatabaseService.getExpenseById(req.params.id);

        if (!expense) {
            return res.status(404).json({ error: 'Expense not found' });
        }

        // Check ownership or admin
        if (expense.user_id !== user.id && user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Can't delete approved expenses
        if (expense.status === 'APPROVED' && user.role !== 'ADMIN') {
            return res.status(400).json({ error: 'Cannot delete approved expenses' });
        }

        await DatabaseService.deleteExpense(req.params.id);

        res.json({ message: 'Expense deleted successfully' });
    } catch (error) {
        console.error('Delete expense error:', error);
        res.status(500).json({ error: 'Failed to delete expense' });
    }
});

// OCR endpoint for receipt processing
router.post('/ocr', authenticate, upload.single('receipt'), async (req: AuthRequest, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'No receipt file uploaded'
            });
        }

        console.log('📸 Processing receipt OCR:', req.file.originalname);

        // Check if it's an image file first
        if (!OCRService.isImageFile(req.file.originalname)) {
            fs.unlinkSync(req.file.path);
            return res.status(400).json({
                success: false,
                error: 'Invalid file type. Please upload an image file (JPG, PNG, GIF, WEBP)'
            });
        }

        // Check if it's a supported OCR format
        if (!OCRService.isValidImageFile(req.file.originalname)) {
            fs.unlinkSync(req.file.path);
            return res.status(400).json({
                success: false,
                error: 'Unsupported format for Groq Vision API. Please use JPG, PNG, GIF, or WEBP format.'
            });
        }

        // Process OCR
        const ocrResult = await OCRService.processReceipt(req.file.path);

        // Clean up uploaded file
        try {
            fs.unlinkSync(req.file.path);
        } catch (cleanupError) {
            console.error('File cleanup error:', cleanupError);
        }

        if (ocrResult.success) {
            console.log('✅ OCR successful:', {
                amount: ocrResult.amount,
                merchant: ocrResult.merchant,
                date: ocrResult.date
            });

            res.json({
                success: true,
                data: {
                    amount: ocrResult.amount || null,
                    merchant: ocrResult.merchant || null,
                    date: ocrResult.date || null,
                    text: ocrResult.text || ''
                }
            });
        } else {
            console.log('❌ OCR failed:', ocrResult.error);

            // Return partial success with error message
            // This allows frontend to continue with manual entry
            res.json({
                success: false,
                error: ocrResult.error || 'Could not extract data from receipt. Please enter details manually.',
                data: {
                    amount: null,
                    merchant: null,
                    date: null,
                    text: ''
                }
            });
        }
    } catch (error: any) {
        console.error('OCR endpoint error:', error);

        // Clean up file if it exists
        if (req.file) {
            try {
                fs.unlinkSync(req.file.path);
            } catch (cleanupError) {
                console.error('File cleanup error:', cleanupError);
            }
        }

        res.status(500).json({
            success: false,
            error: error.message || 'Failed to process receipt'
        });
    }
});

export default router;
