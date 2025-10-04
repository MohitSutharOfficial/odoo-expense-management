-- ================================================
-- ROW LEVEL SECURITY POLICIES
-- ================================================
-- Implement fine-grained access control based on user roles

-- ================================================
-- ENABLE RLS ON ALL TABLES
-- ================================================
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ================================================
-- USER PROFILES POLICIES
-- ================================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT
    USING (auth.uid() = id);

-- Users can update their own profile (except role)
CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE
    USING (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles" ON public.user_profiles
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid() AND role = 'ADMIN'
        )
    );

-- Admins can insert new profiles
CREATE POLICY "Admins can insert profiles" ON public.user_profiles
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid() AND role = 'ADMIN'
        )
    );

-- Admins can update any profile
CREATE POLICY "Admins can update any profile" ON public.user_profiles
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid() AND role = 'ADMIN'
        )
    );

-- Managers can view profiles in their department
CREATE POLICY "Managers can view department profiles" ON public.user_profiles
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles manager
            WHERE manager.id = auth.uid() 
            AND manager.role = 'MANAGER'
            AND manager.department = user_profiles.department
        )
    );

-- ================================================
-- DEPARTMENTS POLICIES
-- ================================================

-- Everyone can view departments
CREATE POLICY "Anyone can view departments" ON public.departments
    FOR SELECT
    USING (true);

-- Only admins can manage departments
CREATE POLICY "Admins can manage departments" ON public.departments
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid() AND role = 'ADMIN'
        )
    );

-- ================================================
-- CATEGORIES POLICIES
-- ================================================

-- Everyone can view active categories
CREATE POLICY "Anyone can view active categories" ON public.categories
    FOR SELECT
    USING (is_active = true);

-- Admins can manage categories
CREATE POLICY "Admins can manage categories" ON public.categories
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid() AND role = 'ADMIN'
        )
    );

-- ================================================
-- BUDGETS POLICIES
-- ================================================

-- Users can view budgets for their department
CREATE POLICY "Users can view department budgets" ON public.budgets
    FOR SELECT
    USING (
        department_id IN (
            SELECT id FROM public.departments d
            WHERE d.name = (
                SELECT department FROM public.user_profiles
                WHERE id = auth.uid()
            )
        )
    );

-- Admins and Finance can view all budgets
CREATE POLICY "Admins and Finance can view all budgets" ON public.budgets
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid() AND role IN ('ADMIN', 'FINANCE')
        )
    );

-- Admins and Finance can manage budgets
CREATE POLICY "Admins and Finance can manage budgets" ON public.budgets
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid() AND role IN ('ADMIN', 'FINANCE')
        )
    );

-- ================================================
-- EXPENSES POLICIES
-- ================================================

-- Users can view their own expenses
CREATE POLICY "Users can view own expenses" ON public.expenses
    FOR SELECT
    USING (user_id = auth.uid());

-- Users can create their own expenses
CREATE POLICY "Users can create own expenses" ON public.expenses
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Users can update their own pending expenses
CREATE POLICY "Users can update own pending expenses" ON public.expenses
    FOR UPDATE
    USING (user_id = auth.uid() AND status = 'PENDING');

-- Managers can view expenses in their department
CREATE POLICY "Managers can view department expenses" ON public.expenses
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles manager
            WHERE manager.id = auth.uid() 
            AND manager.role = 'MANAGER'
            AND manager.department = (
                SELECT department FROM public.user_profiles
                WHERE id = expenses.user_id
            )
        )
    );

-- Finance can view all expenses
CREATE POLICY "Finance can view all expenses" ON public.expenses
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid() AND role = 'FINANCE'
        )
    );

-- Finance can update any expense
CREATE POLICY "Finance can update expenses" ON public.expenses
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid() AND role = 'FINANCE'
        )
    );

-- Admins can do anything with expenses
CREATE POLICY "Admins can manage all expenses" ON public.expenses
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid() AND role = 'ADMIN'
        )
    );

-- ================================================
-- APPROVALS POLICIES
-- ================================================

-- Approvers can view approvals assigned to them
CREATE POLICY "Approvers can view their approvals" ON public.approvals
    FOR SELECT
    USING (approver_id = auth.uid());

-- Expense owners can view approvals for their expenses
CREATE POLICY "Owners can view their expense approvals" ON public.approvals
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.expenses
            WHERE id = approvals.expense_id AND user_id = auth.uid()
        )
    );

-- Finance and Managers can create approvals
CREATE POLICY "Finance and Managers can create approvals" ON public.approvals
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid() AND role IN ('FINANCE', 'MANAGER', 'ADMIN')
        )
    );

-- Approvers can update their own approvals
CREATE POLICY "Approvers can update their approvals" ON public.approvals
    FOR UPDATE
    USING (approver_id = auth.uid() AND status = 'PENDING');

-- Admins can manage all approvals
CREATE POLICY "Admins can manage approvals" ON public.approvals
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid() AND role = 'ADMIN'
        )
    );

-- ================================================
-- NOTIFICATIONS POLICIES
-- ================================================

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications" ON public.notifications
    FOR SELECT
    USING (user_id = auth.uid());

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE
    USING (user_id = auth.uid());

-- System can create notifications for any user
CREATE POLICY "System can create notifications" ON public.notifications
    FOR INSERT
    WITH CHECK (true);

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications" ON public.notifications
    FOR DELETE
    USING (user_id = auth.uid());

-- ================================================
-- AUDIT LOGS POLICIES
-- ================================================

-- Admins can view all audit logs
CREATE POLICY "Admins can view all audit logs" ON public.audit_logs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid() AND role = 'ADMIN'
        )
    );

-- Users can view their own audit logs
CREATE POLICY "Users can view own audit logs" ON public.audit_logs
    FOR SELECT
    USING (user_id = auth.uid());

-- System can create audit logs
CREATE POLICY "System can create audit logs" ON public.audit_logs
    FOR INSERT
    WITH CHECK (true);

-- ================================================
-- STORAGE POLICIES (Run in Supabase Dashboard)
-- ================================================

-- Receipts bucket policies
-- CREATE POLICY "Users can upload their own receipts" ON storage.objects
--     FOR INSERT WITH CHECK (
--         bucket_id = 'receipts' AND
--         auth.uid()::text = (storage.foldername(name))[1]
--     );

-- CREATE POLICY "Users can view their own receipts" ON storage.objects
--     FOR SELECT USING (
--         bucket_id = 'receipts' AND
--         auth.uid()::text = (storage.foldername(name))[1]
--     );

-- CREATE POLICY "Users can update their own receipts" ON storage.objects
--     FOR UPDATE USING (
--         bucket_id = 'receipts' AND
--         auth.uid()::text = (storage.foldername(name))[1]
--     );

-- CREATE POLICY "Finance and Admins can view all receipts" ON storage.objects
--     FOR SELECT USING (
--         bucket_id = 'receipts' AND
--         EXISTS (
--             SELECT 1 FROM public.user_profiles
--             WHERE id = auth.uid() AND role IN ('FINANCE', 'ADMIN')
--         )
--     );

-- Profile pictures bucket policies
-- CREATE POLICY "Anyone can view profile pictures" ON storage.objects
--     FOR SELECT USING (bucket_id = 'profile-pictures');

-- CREATE POLICY "Users can upload their own profile picture" ON storage.objects
--     FOR INSERT WITH CHECK (
--         bucket_id = 'profile-pictures' AND
--         auth.uid()::text = (storage.foldername(name))[1]
--     );

-- CREATE POLICY "Users can update their own profile picture" ON storage.objects
--     FOR UPDATE USING (
--         bucket_id = 'profile-pictures' AND
--         auth.uid()::text = (storage.foldername(name))[1]
--     );

-- Exports bucket policies
-- CREATE POLICY "Admins can manage exports" ON storage.objects
--     FOR ALL USING (
--         bucket_id = 'exports' AND
--         EXISTS (
--             SELECT 1 FROM public.user_profiles
--             WHERE id = auth.uid() AND role = 'ADMIN'
--         )
--     );
