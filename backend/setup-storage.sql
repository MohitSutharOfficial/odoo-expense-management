-- Ensure all necessary columns exist in user_profiles
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS phone VARCHAR(50),
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Ensure expenses table has receipt storage
ALTER TABLE expenses 
ADD COLUMN IF NOT EXISTS receipt_url TEXT,
ADD COLUMN IF NOT EXISTS receipt_data TEXT;

-- Create storage bucket for profile pictures (run in Supabase Dashboard -> Storage)
-- This is just documentation since storage buckets must be created via dashboard or API

/*
To create storage buckets in Supabase:

1. Go to Supabase Dashboard: https://app.supabase.com
2. Select your project
3. Go to Storage section
4. Create these buckets:
   - Name: profile-pictures
     Public: true
     File size limit: 2MB
     Allowed MIME types: image/jpeg, image/png, image/gif, image/webp

   - Name: receipts  
     Public: false
     File size limit: 5MB
     Allowed MIME types: image/*, application/pdf

5. Set RLS policies:
   
   For profile-pictures:
   - Allow authenticated users to upload their own profile pictures
   - Allow public read access
   
   For receipts:
   - Allow authenticated users to upload receipts
   - Allow users to read their own receipts
   - Allow managers/finance to read department receipts
*/

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_status ON expenses(status);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_department_id ON expenses(department_id);
CREATE INDEX IF NOT EXISTS idx_approvals_expense_id ON approvals(expense_id);
CREATE INDEX IF NOT EXISTS idx_approvals_approver_id ON approvals(approver_id);
CREATE INDEX IF NOT EXISTS idx_approvals_status ON approvals(status);
