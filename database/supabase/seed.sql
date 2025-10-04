-- ================================================
-- SAMPLE DATA FOR EXPENSE MANAGEMENT SYSTEM
-- ================================================
-- Run this after schema.sql to populate with demo data

-- ================================================
-- DEPARTMENTS
-- ================================================
INSERT INTO public.departments (id, name, description, budget_limit) VALUES
    ('d1111111-1111-1111-1111-111111111111', 'IT', 'Information Technology Department', 100000.00),
    ('d2222222-2222-2222-2222-222222222222', 'HR', 'Human Resources Department', 50000.00),
    ('d3333333-3333-3333-3333-333333333333', 'Sales', 'Sales and Marketing Department', 150000.00),
    ('d4444444-4444-4444-4444-444444444444', 'Marketing', 'Marketing Department', 75000.00),
    ('d5555555-5555-5555-5555-555555555555', 'Finance', 'Finance and Accounting Department', 60000.00)
ON CONFLICT (name) DO NOTHING;

-- ================================================
-- CATEGORIES
-- ================================================
INSERT INTO public.categories (id, name, description, is_active) VALUES
    ('c1111111-1111-1111-1111-111111111111', 'Travel', 'Business travel expenses', true),
    ('c2222222-2222-2222-2222-222222222222', 'Food & Dining', 'Meals and entertainment', true),
    ('c3333333-3333-3333-3333-333333333333', 'Office Supplies', 'Office equipment and supplies', true),
    ('c4444444-4444-4444-4444-444444444444', 'Transportation', 'Local transportation', true),
    ('c5555555-5555-5555-5555-555555555555', 'Accommodation', 'Hotel and lodging', true),
    ('c6666666-6666-6666-6666-666666666666', 'Software & Tools', 'Software licenses and tools', true),
    ('c7777777-7777-7777-7777-777777777777', 'Training', 'Professional development', true),
    ('c8888888-8888-8888-8888-888888888888', 'Marketing', 'Marketing and advertising', true),
    ('c9999999-9999-9999-9999-999999999999', 'Utilities', 'Internet, phone, electricity', true),
    ('ca111111-1111-1111-1111-111111111111', 'Miscellaneous', 'Other business expenses', true)
ON CONFLICT (name) DO NOTHING;

-- ================================================
-- NOTE: USER PROFILES
-- ================================================
-- Users should be created through Supabase Auth signup
-- Then user_profiles table will be populated automatically
-- For demo purposes, if you have existing auth.users, you can insert profiles:

-- Example (replace with actual user IDs from auth.users):
-- INSERT INTO public.user_profiles (id, email, name, role, department) VALUES
--     ('u1111111-1111-1111-1111-111111111111', 'admin@company.com', 'Admin User', 'ADMIN', 'IT'),
--     ('u2222222-2222-2222-2222-222222222222', 'finance@company.com', 'Finance Manager', 'FINANCE', 'Finance'),
--     ('u3333333-3333-3333-3333-333333333333', 'john.manager@company.com', 'John Manager', 'MANAGER', 'Sales'),
--     ('u4444444-4444-4444-4444-444444444444', 'alice@company.com', 'Alice Employee', 'EMPLOYEE', 'IT')
-- ON CONFLICT (email) DO NOTHING;

-- ================================================
-- BUDGETS
-- ================================================
-- Sample budgets for Q1 2025
INSERT INTO public.budgets (department_id, category_id, amount, period, start_date, end_date) VALUES
    -- IT Department
    ('d1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 25000.00, 'QUARTERLY', '2025-01-01', '2025-03-31'),
    ('d1111111-1111-1111-1111-111111111111', 'c6666666-6666-6666-6666-666666666666', 30000.00, 'QUARTERLY', '2025-01-01', '2025-03-31'),
    
    -- HR Department
    ('d2222222-2222-2222-2222-222222222222', 'c7777777-7777-7777-7777-777777777777', 15000.00, 'QUARTERLY', '2025-01-01', '2025-03-31'),
    ('d2222222-2222-2222-2222-222222222222', 'c2222222-2222-2222-2222-222222222222', 10000.00, 'QUARTERLY', '2025-01-01', '2025-03-31'),
    
    -- Sales Department
    ('d3333333-3333-3333-3333-333333333333', 'c1111111-1111-1111-1111-111111111111', 40000.00, 'QUARTERLY', '2025-01-01', '2025-03-31'),
    ('d3333333-3333-3333-3333-333333333333', 'c2222222-2222-2222-2222-222222222222', 20000.00, 'QUARTERLY', '2025-01-01', '2025-03-31'),
    ('d3333333-3333-3333-3333-333333333333', 'c5555555-5555-5555-5555-555555555555', 35000.00, 'QUARTERLY', '2025-01-01', '2025-03-31'),
    
    -- Marketing Department
    ('d4444444-4444-4444-4444-444444444444', 'c8888888-8888-8888-8888-888888888888', 50000.00, 'QUARTERLY', '2025-01-01', '2025-03-31'),
    ('d4444444-4444-4444-4444-444444444444', 'c2222222-2222-2222-2222-222222222222', 15000.00, 'QUARTERLY', '2025-01-01', '2025-03-31'),
    
    -- Finance Department
    ('d5555555-5555-5555-5555-555555555555', 'c3333333-3333-3333-3333-333333333333', 10000.00, 'QUARTERLY', '2025-01-01', '2025-03-31'),
    ('d5555555-5555-5555-5555-555555555555', 'c6666666-6666-6666-6666-666666666666', 15000.00, 'QUARTERLY', '2025-01-01', '2025-03-31')
ON CONFLICT ON CONSTRAINT unique_budget DO NOTHING;

-- ================================================
-- SAMPLE EXPENSES
-- ================================================
-- Note: Replace user_ids with actual user IDs from your auth.users table
-- These are examples showing different statuses and scenarios

-- Example format (uncomment and update with real user IDs):
/*
INSERT INTO public.expenses (user_id, category_id, department_id, title, description, amount, date, status, merchant, payment_method) VALUES
    -- Approved expenses
    ('u4444444-4444-4444-4444-444444444444', 'c1111111-1111-1111-1111-111111111111', 'd1111111-1111-1111-1111-111111111111', 
     'Flight to Client Meeting', 'Round trip ticket to NYC for client presentation', 450.00, '2025-01-15', 
     'APPROVED', 'United Airlines', 'CREDIT_CARD'),
    
    ('u4444444-4444-4444-4444-444444444444', 'c2222222-2222-2222-2222-222222222222', 'd1111111-1111-1111-1111-111111111111',
     'Team Lunch', 'Monthly team building lunch', 125.50, '2025-01-20',
     'APPROVED', 'Olive Garden', 'CREDIT_CARD'),
    
    ('u4444444-4444-4444-4444-444444444444', 'c3333333-3333-3333-3333-333333333333', 'd1111111-1111-1111-1111-111111111111',
     'Office Supplies', 'Pens, notebooks, and desk organizers', 75.00, '2025-01-25',
     'APPROVED', 'Staples', 'DEBIT_CARD'),
    
    -- Pending expenses
    ('u4444444-4444-4444-4444-444444444444', 'c6666666-6666-6666-6666-666666666666', 'd1111111-1111-1111-1111-111111111111',
     'GitHub Copilot License', 'Annual subscription for development', 100.00, '2025-02-01',
     'PENDING', 'GitHub', 'CREDIT_CARD'),
    
    ('u4444444-4444-4444-4444-444444444444', 'c4444444-4444-4444-4444-444444444444', 'd1111111-1111-1111-1111-111111111111',
     'Uber to Airport', 'Transportation for business trip', 45.00, '2025-02-05',
     'PENDING', 'Uber', 'CREDIT_CARD'),
    
    ('u3333333-3333-3333-3333-333333333333', 'c1111111-1111-1111-1111-111111111111', 'd3333333-3333-3333-3333-333333333333',
     'Sales Conference', 'Registration and travel to annual sales conference', 1200.00, '2025-02-10',
     'PENDING', 'Conference Inc', 'CREDIT_CARD'),
    
    ('u3333333-3333-3333-3333-333333333333', 'c5555555-5555-5555-5555-555555555555', 'd3333333-3333-3333-3333-333333333333',
     'Hotel Stay - Sales Trip', '3 nights at conference hotel', 600.00, '2025-02-11',
     'PENDING', 'Marriott', 'CREDIT_CARD'),
    
    -- Rejected expenses
    ('u4444444-4444-4444-4444-444444444444', 'c2222222-2222-2222-2222-222222222222', 'd1111111-1111-1111-1111-111111111111',
     'Personal Dinner', 'Dinner with friends', 150.00, '2025-01-18',
     'REJECTED', 'Fancy Restaurant', 'CASH'),
    
    -- More approved expenses
    ('u3333333-3333-3333-3333-333333333333', 'c2222222-2222-2222-2222-222222222222', 'd3333333-3333-3333-3333-333333333333',
     'Client Dinner', 'Dinner with potential client', 250.00, '2025-01-22',
     'APPROVED', 'Steakhouse', 'CREDIT_CARD'),
    
    ('u3333333-3333-3333-3333-333333333333', 'c4444444-4444-4444-4444-444444444444', 'd3333333-3333-3333-3333-333333333333',
     'Taxi to Client Office', 'Transportation to client meeting', 30.00, '2025-01-28',
     'APPROVED', 'Local Taxi', 'CASH')
ON CONFLICT DO NOTHING;
*/

-- ================================================
-- SAMPLE APPROVALS
-- ================================================
-- Note: Create approvals for pending expenses
-- Replace IDs with actual expense and user IDs

/*
INSERT INTO public.approvals (expense_id, approver_id, status, comments) VALUES
    -- Approved by manager
    ('expense_id_1', 'u3333333-3333-3333-3333-333333333333', 'APPROVED', 'Approved - Valid business expense'),
    ('expense_id_2', 'u3333333-3333-3333-3333-333333333333', 'APPROVED', 'Team building approved'),
    
    -- Rejected
    ('expense_id_8', 'u3333333-3333-3333-3333-333333333333', 'REJECTED', 'Personal expense - not reimbursable'),
    
    -- Pending approvals
    ('expense_id_4', 'u3333333-3333-3333-3333-333333333333', 'PENDING', NULL),
    ('expense_id_5', 'u3333333-3333-3333-3333-333333333333', 'PENDING', NULL),
    ('expense_id_6', 'u2222222-2222-2222-2222-222222222222', 'PENDING', NULL)
ON CONFLICT ON CONSTRAINT unique_approval DO NOTHING;
*/

-- ================================================
-- SAMPLE NOTIFICATIONS
-- ================================================
-- Note: Create notifications for users
-- Replace user_ids with actual IDs

/*
INSERT INTO public.notifications (user_id, title, message, type, is_read) VALUES
    ('u4444444-4444-4444-4444-444444444444', 'Expense Approved', 'Your expense "Flight to Client Meeting" has been approved', 'SUCCESS', false),
    ('u4444444-4444-4444-4444-444444444444', 'Expense Rejected', 'Your expense "Personal Dinner" has been rejected', 'ERROR', false),
    ('u3333333-3333-3333-3333-333333333333', 'New Expense to Approve', 'Alice submitted an expense for review', 'INFO', false),
    ('u4444444-4444-4444-4444-444444444444', 'Budget Alert', 'Your department is at 75% of quarterly budget', 'WARNING', true)
ON CONFLICT DO NOTHING;
*/

-- ================================================
-- FUNCTIONS FOR DEMO DATA GENERATION
-- ================================================

-- Function to get random expense status
CREATE OR REPLACE FUNCTION random_status()
RETURNS TEXT AS $$
BEGIN
    RETURN (ARRAY['PENDING', 'APPROVED', 'REJECTED', 'PROCESSING'])[floor(random() * 4 + 1)];
END;
$$ LANGUAGE plpgsql;

-- Function to get random payment method
CREATE OR REPLACE FUNCTION random_payment_method()
RETURNS TEXT AS $$
BEGIN
    RETURN (ARRAY['CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'BANK_TRANSFER'])[floor(random() * 4 + 1)];
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- VERIFICATION QUERIES
-- ================================================
-- Run these to verify the data was inserted correctly

-- Check departments
-- SELECT COUNT(*) as department_count FROM public.departments;

-- Check categories
-- SELECT COUNT(*) as category_count FROM public.categories;

-- Check budgets
-- SELECT COUNT(*) as budget_count FROM public.budgets;

-- Check expenses
-- SELECT COUNT(*) as expense_count FROM public.expenses;

-- Show budget utilization
-- SELECT 
--     d.name as department,
--     c.name as category,
--     b.amount as budget,
--     b.spent as spent,
--     ROUND((b.spent / b.amount * 100), 2) as utilization_percent
-- FROM public.budgets b
-- JOIN public.departments d ON b.department_id = d.id
-- JOIN public.categories c ON b.category_id = c.id
-- ORDER BY d.name, c.name;
