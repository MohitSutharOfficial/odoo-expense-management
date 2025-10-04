# Supabase Database Setup

This directory contains SQL scripts to set up the complete database schema for the Expense Management System with Row Level Security (RLS) policies.

## Files

1. **schema.sql** - Creates all tables, indexes, and triggers
2. **policies.sql** - Implements Row Level Security policies
3. **seed.sql** - Populates database with sample data

## Setup Instructions

### IMPORTANT: Run in Order! ⚠️

You can run all files in the **SAME SQL Editor tab** (one after another) OR in separate tabs. Both work!

---

### Method 1: Single SQL Editor Tab (EASIEST) ✅

**Step 1: Run schema.sql**
1. Open Supabase Dashboard → SQL Editor (you're already there!)
2. Copy **ALL** contents of `database/supabase/schema.sql`
3. Paste in the editor (replace the placeholder text)
4. Click green **"Run"** button (bottom right)
5. ✅ Wait for: "Success. No rows returned"

This creates:
- ✅ user_profiles (extends auth.users)
- ✅ departments
- ✅ categories
- ✅ budgets
- ✅ expenses
- ✅ approvals
- ✅ notifications
- ✅ audit_logs

**Step 2: Run policies.sql**
1. **Clear the editor** or select all text (Ctrl+A) and delete
2. Copy **ALL** contents of `database/supabase/policies.sql`
3. Paste in the same editor
4. Click **"Run"** button again
5. ✅ Wait for: "Success. No rows returned"

This implements:
- 🔒 User can only see their own data
- 🔒 Managers see their department's data
- 🔒 Finance sees all expenses
- 🔒 Admins have full access

**Step 3: Run seed.sql**
1. **Clear the editor** again
2. Copy **ALL** contents of `database/supabase/seed.sql`
3. Paste in the same editor
4. Click **"Run"** button
5. ✅ Wait for: "Success" message

This adds:
- ✅ 5 departments (IT, HR, Sales, Marketing, Finance)
- ✅ 10 expense categories
- ✅ Sample budgets for Q1 2025

---

### Method 2: Multiple SQL Editor Tabs (ALTERNATIVE)

If you prefer separate tabs:

1. Click **"+ New"** button (top of SQL Editor) → Paste schema.sql → Run
2. Click **"+ New"** again → Paste policies.sql → Run
3. Click **"+ New"** again → Paste seed.sql → Run

**Result is identical!** Use whichever you prefer.

---

### ⚠️ Order Matters!

**Always run in this order:**
1. schema.sql FIRST (creates tables)
2. policies.sql SECOND (adds security)
3. seed.sql LAST (adds data)

**Why?** 
- policies.sql needs tables to exist (from schema.sql)
- seed.sql needs tables to exist (from schema.sql)

### 3. Create Storage Buckets

In Supabase Dashboard → Storage, create these buckets:

#### Receipts (Private)
- Name: `receipts`
- Public: ❌ No
- File size limit: 5MB
- Allowed MIME types: image/*, application/pdf

#### Profile Pictures (Public)
- Name: `profile-pictures`
- Public: ✅ Yes
- File size limit: 2MB
- Allowed MIME types: image/*

#### Exports (Private - Admin only)
- Name: `exports`
- Public: ❌ No
- File size limit: 50MB
- Allowed MIME types: text/csv, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet

### 4. Configure Storage Policies

Run these in SQL Editor:

```sql
-- Receipts: Users can upload their own
CREATE POLICY "Users upload own receipts"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'receipts' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

-- Receipts: Users view their own
CREATE POLICY "Users view own receipts"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'receipts' AND
    (auth.uid()::text = (storage.foldername(name))[1] OR
     EXISTS (
         SELECT 1 FROM public.user_profiles
         WHERE id = auth.uid() AND role IN ('FINANCE', 'ADMIN')
     ))
);

-- Profile pictures: Anyone can view
CREATE POLICY "Anyone views profile pictures"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile-pictures');

-- Profile pictures: Users upload own
CREATE POLICY "Users upload own profile pic"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'profile-pictures' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

-- Exports: Admin only
CREATE POLICY "Admins manage exports"
ON storage.objects FOR ALL
USING (
    bucket_id = 'exports' AND
    EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid() AND role = 'ADMIN'
    )
);
```

### 5. Populate Sample Data

Run seed.sql after creating user accounts through Supabase Auth:

```bash
# Copy and paste the contents of seed.sql
# Update user IDs in the commented sections with actual auth.users IDs
```

## Database Schema Overview

### Tables

```
auth.users (Supabase managed)
    ↓
user_profiles
    ├── departments → budgets
    ├── expenses → approvals
    ├── notifications
    └── audit_logs
    
categories → budgets, expenses
```

### Roles & Permissions

#### EMPLOYEE
- ✅ Create/view own expenses
- ✅ View notifications
- ✅ Update own profile
- ❌ Cannot approve expenses

#### MANAGER
- ✅ All EMPLOYEE permissions
- ✅ View department expenses
- ✅ Approve department expenses
- ❌ Cannot view other departments

#### FINANCE
- ✅ View all expenses
- ✅ Approve all expenses
- ✅ Manage budgets
- ✅ Generate reports
- ❌ Cannot manage users

#### ADMIN
- ✅ Full access to everything
- ✅ Manage users & roles
- ✅ View audit logs
- ✅ System configuration

## Verification Queries

After setup, verify everything is working:

```sql
-- Check table counts
SELECT 
    (SELECT COUNT(*) FROM public.user_profiles) as users,
    (SELECT COUNT(*) FROM public.departments) as departments,
    (SELECT COUNT(*) FROM public.categories) as categories,
    (SELECT COUNT(*) FROM public.budgets) as budgets,
    (SELECT COUNT(*) FROM public.expenses) as expenses;

-- Test RLS policies (run as different users)
SELECT * FROM public.expenses; -- Should only show your expenses (unless ADMIN/FINANCE)

-- Check storage buckets
SELECT * FROM storage.buckets;
```

## Environment Variables

Make sure your backend .env has:

```env
SUPABASE_URL=https://lvomlmmodgpilewyyphz.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

## Migration Notes

If migrating from existing PostgreSQL database:

1. Export existing data
2. Run schema.sql
3. Run policies.sql
4. Import data using Supabase client
5. Verify RLS policies work correctly

## Troubleshooting

### Issue: "permission denied for table X"
**Solution**: Check that RLS is enabled and policies are created

### Issue: "new row violates row-level security policy"
**Solution**: Verify you're authenticated and have the correct role

### Issue: "foreign key constraint violation"
**Solution**: Create parent records (departments, categories) before child records (expenses)

## Support

For issues or questions:
- Check Supabase documentation: https://supabase.com/docs
- Review RLS policy examples: https://supabase.com/docs/guides/auth/row-level-security

---

© 2025 ExpenseFlow - Database Schema v1.0
