/**
 * Supabase Database Service
 * Centralized data access layer for all database operations
 */

import { supabaseAdmin } from './supabase.service';

export class DatabaseService {
    // ============================================
    // USER OPERATIONS
    // ============================================

    static async getAllUsers() {
        const { data, error } = await supabaseAdmin
            .from('user_profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    }

    static async getUserById(id: string) {
        const { data, error } = await supabaseAdmin
            .from('user_profiles')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    }

    static async updateUser(id: string, updates: any) {
        const { data, error } = await supabaseAdmin
            .from('user_profiles')
            .update({
                ...updates,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    // ============================================
    // EXPENSE OPERATIONS
    // ============================================

    static async getAllExpenses(filters: any = {}) {
        let query = supabaseAdmin
            .from('expenses')
            .select(`
                *,
                user:user_profiles(id, name, email),
                category:categories(id, name),
                department:departments(id, name)
            `)
            .order('created_at', { ascending: false });

        if (filters.status) query = query.eq('status', filters.status);
        if (filters.category_id) query = query.eq('category_id', filters.category_id);
        if (filters.user_id) query = query.eq('user_id', filters.user_id);
        if (filters.department_id) query = query.eq('department_id', filters.department_id);
        if (filters.start_date) query = query.gte('date', filters.start_date);
        if (filters.end_date) query = query.lte('date', filters.end_date);

        const { data, error } = await query;

        if (error) throw error;
        return data;
    }

    static async getExpenseById(id: string) {
        const { data, error } = await supabaseAdmin
            .from('expenses')
            .select(`
                *,
                user:user_profiles(id, name, email, role, department),
                category:categories(id, name),
                department:departments(id, name),
                approvals(id, approver_id, status, comments, created_at, approver:user_profiles(id, name, email))
            `)
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    }

    static async createExpense(expenseData: any) {
        const { data, error } = await supabaseAdmin
            .from('expenses')
            .insert(expenseData)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    static async updateExpense(id: string, updates: any) {
        const { data, error } = await supabaseAdmin
            .from('expenses')
            .update({
                ...updates,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    static async deleteExpense(id: string) {
        const { error } = await supabaseAdmin
            .from('expenses')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return true;
    }

    // ============================================
    // APPROVAL OPERATIONS
    // ============================================

    static async getPendingApprovals(approverId: string) {
        const { data, error } = await supabaseAdmin
            .from('approvals')
            .select(`
                *,
                expense:expenses(
                    *,
                    user:user_profiles(id, name, email),
                    category:categories(id, name)
                )
            `)
            .eq('approver_id', approverId)
            .eq('status', 'PENDING')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    }

    static async getApprovalById(id: string) {
        const { data, error } = await supabaseAdmin
            .from('approvals')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    }

    static async createApproval(approvalData: any) {
        const { data, error } = await supabaseAdmin
            .from('approvals')
            .insert(approvalData)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    static async updateApproval(id: string, updates: any) {
        const { data, error } = await supabaseAdmin
            .from('approvals')
            .update({
                ...updates,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    static async getApprovalsByExpense(expenseId: string) {
        const { data, error } = await supabaseAdmin
            .from('approvals')
            .select(`
                *,
                approver:user_profiles(id, name, email, role)
            `)
            .eq('expense_id', expenseId)
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data;
    }

    // ============================================
    // CATEGORY OPERATIONS
    // ============================================

    static async getAllCategories() {
        const { data, error } = await supabaseAdmin
            .from('categories')
            .select('*')
            .eq('is_active', true)
            .order('name', { ascending: true });

        if (error) throw error;
        return data;
    }

    static async getCategoryById(id: string) {
        const { data, error } = await supabaseAdmin
            .from('categories')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    }

    // ============================================
    // DEPARTMENT OPERATIONS
    // ============================================

    static async getAllDepartments() {
        const { data, error } = await supabaseAdmin
            .from('departments')
            .select('*')
            .order('name', { ascending: true });

        if (error) throw error;
        return data;
    }

    static async getDepartmentById(id: string) {
        const { data, error } = await supabaseAdmin
            .from('departments')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    }

    // ============================================
    // BUDGET OPERATIONS
    // ============================================

    static async getAllBudgets(filters: any = {}) {
        let query = supabaseAdmin
            .from('budgets')
            .select(`
                *,
                department:departments(id, name)
            `)
            .order('created_at', { ascending: false });

        if (filters.department_id) query = query.eq('department_id', filters.department_id);
        if (filters.period) query = query.eq('period', filters.period);

        const { data, error } = await query;

        if (error) throw error;
        return data;
    }

    static async getBudgetById(id: string) {
        const { data, error } = await supabaseAdmin
            .from('budgets')
            .select(`
                *,
                department:departments(id, name)
            `)
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    }

    // ============================================
    // NOTIFICATION OPERATIONS
    // ============================================

    static async getUserNotifications(userId: string) {
        const { data, error } = await supabaseAdmin
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) throw error;
        return data;
    }

    static async markNotificationAsRead(id: string) {
        const { data, error } = await supabaseAdmin
            .from('notifications')
            .update({ is_read: true })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    static async markAllNotificationsAsRead(userId: string) {
        const { error } = await supabaseAdmin
            .from('notifications')
            .update({ is_read: true })
            .eq('user_id', userId)
            .eq('is_read', false);

        if (error) throw error;
        return true;
    }

    static async createNotification(notificationData: any) {
        const { data, error } = await supabaseAdmin
            .from('notifications')
            .insert(notificationData)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    // ============================================
    // STATISTICS & AGGREGATIONS
    // ============================================

    static async getExpenseStats(userId: string, role: string) {
        // Get current month stats
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        let query = supabaseAdmin
            .from('expenses')
            .select('amount, status')
            .gte('date', startOfMonth.toISOString());

        // Filter by role
        if (role === 'EMPLOYEE') {
            query = query.eq('user_id', userId);
        }

        const { data, error } = await query;

        if (error) throw error;

        const total = data?.reduce((sum, exp) => sum + parseFloat(exp.amount), 0) || 0;
        const approved = data?.filter(exp => exp.status === 'APPROVED').length || 0;
        const pending = data?.filter(exp => exp.status === 'PENDING').length || 0;

        return { total, approved, pending, count: data?.length || 0 };
    }

    static async getMonthlyExpenseTrend(userId: string, role: string, months: number = 6) {
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - months);

        let query = supabaseAdmin
            .from('expenses')
            .select('date, amount, status')
            .gte('date', startDate.toISOString())
            .order('date', { ascending: true });

        if (role === 'EMPLOYEE') {
            query = query.eq('user_id', userId);
        }

        const { data, error } = await query;

        if (error) throw error;
        return data;
    }

    static async getCategoryBreakdown(userId: string, role: string) {
        let query = supabaseAdmin
            .from('expenses')
            .select(`
                amount,
                category:categories(id, name)
            `)
            .eq('status', 'APPROVED');

        if (role === 'EMPLOYEE') {
            query = query.eq('user_id', userId);
        }

        const { data, error } = await query;

        if (error) throw error;
        return data;
    }
}

export default DatabaseService;
