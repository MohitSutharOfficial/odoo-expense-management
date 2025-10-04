-- ================================================
-- SUPABASE DATABASE VERIFICATION SCRIPT
-- ================================================
-- Run this in SQL Editor to verify your setup is complete

-- ================================================
-- 1. CHECK ALL TABLES EXIST
-- ================================================
SELECT 
    table_name,
    CASE 
        WHEN table_name IN ('user_profiles', 'departments', 'categories', 'budgets', 
                           'expenses', 'approvals', 'notifications', 'audit_logs') 
        THEN '✅'
        ELSE '❌'
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Expected: 8 tables with ✅ status


-- ================================================
-- 2. CHECK TABLE COUNTS (Should have sample data)
-- ================================================
SELECT 
    'user_profiles' as table_name,
    COUNT(*) as count,
    '0 (users created via signup)' as expected
FROM public.user_profiles
UNION ALL
SELECT 
    'departments',
    COUNT(*),
    '5 departments'
FROM public.departments
UNION ALL
SELECT 
    'categories',
    COUNT(*),
    '10 categories'
FROM public.categories
UNION ALL
SELECT 
    'budgets',
    COUNT(*),
    '11 budgets'
FROM public.budgets
UNION ALL
SELECT 
    'expenses',
    COUNT(*),
    '0 (will be created by users)'
FROM public.expenses
UNION ALL
SELECT 
    'approvals',
    COUNT(*),
    '0'
FROM public.approvals
UNION ALL
SELECT 
    'notifications',
    COUNT(*),
    '0'
FROM public.notifications
UNION ALL
SELECT 
    'audit_logs',
    COUNT(*),
    '0'
FROM public.audit_logs;


-- ================================================
-- 3. CHECK ROW LEVEL SECURITY IS ENABLED
-- ================================================
SELECT 
    schemaname,
    tablename,
    CASE 
        WHEN rowsecurity = true THEN '✅ RLS Enabled'
        ELSE '❌ RLS Disabled'
    END as security_status
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- Expected: All tables should show '✅ RLS Enabled'


-- ================================================
-- 4. CHECK POLICIES ARE CREATED
-- ================================================
SELECT 
    schemaname,
    tablename,
    COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY schemaname, tablename
ORDER BY tablename;

-- Expected: Each table should have multiple policies


-- ================================================
-- 5. CHECK STORAGE BUCKETS
-- ================================================
SELECT 
    id,
    name,
    public,
    file_size_limit,
    CASE 
        WHEN name = 'receipts' AND public = false AND file_size_limit = 5242880 THEN '✅'
        WHEN name = 'profile-pictures' AND public = true AND file_size_limit = 2097152 THEN '✅'
        WHEN name = 'exports' AND public = false AND file_size_limit = 52428800 THEN '✅'
        ELSE '⚠️'
    END as status
FROM storage.buckets
ORDER BY name;

-- Expected: 3 buckets with ✅ status


-- ================================================
-- 6. CHECK SAMPLE DATA - DEPARTMENTS
-- ================================================
SELECT 
    name,
    budget_limit,
    '✅' as status
FROM public.departments
ORDER BY name;

-- Expected: 5 departments (IT, HR, Sales, Marketing, Finance)


-- ================================================
-- 7. CHECK SAMPLE DATA - CATEGORIES
-- ================================================
SELECT 
    name,
    is_active,
    CASE 
        WHEN is_active = true THEN '✅ Active'
        ELSE '❌ Inactive'
    END as status
FROM public.categories
ORDER BY name;

-- Expected: 10 categories, all active


-- ================================================
-- 8. CHECK SAMPLE DATA - BUDGETS
-- ================================================
SELECT 
    d.name as department,
    c.name as category,
    b.amount,
    b.period,
    b.start_date,
    b.end_date
FROM public.budgets b
JOIN public.departments d ON b.department_id = d.id
JOIN public.categories c ON b.category_id = c.id
ORDER BY d.name, c.name;

-- Expected: 11 budget entries for Q1 2025


-- ================================================
-- 9. CHECK INDEXES ARE CREATED
-- ================================================
SELECT 
    schemaname,
    tablename,
    indexname,
    '✅' as status
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- Expected: Multiple indexes for performance


-- ================================================
-- 10. CHECK TRIGGERS ARE CREATED
-- ================================================
SELECT 
    trigger_schema,
    event_object_table as table_name,
    trigger_name,
    CASE 
        WHEN trigger_name LIKE '%updated_at%' THEN '✅ Auto-timestamp'
        ELSE '✅'
    END as status
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- Expected: updated_at triggers on most tables


-- ================================================
-- 11. FINAL HEALTH CHECK
-- ================================================
SELECT 
    '✅ Database Setup Complete!' as status,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public') as total_tables,
    (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public') as total_policies,
    (SELECT COUNT(*) FROM storage.buckets) as total_buckets,
    (SELECT COUNT(*) FROM public.departments) as departments,
    (SELECT COUNT(*) FROM public.categories) as categories,
    (SELECT COUNT(*) FROM public.budgets) as budgets;


-- ================================================
-- EXPECTED FINAL OUTPUT:
-- ================================================
-- status: ✅ Database Setup Complete!
-- total_tables: 8
-- total_policies: 40+
-- total_buckets: 3
-- departments: 5
-- categories: 10
-- budgets: 11
-- ================================================
