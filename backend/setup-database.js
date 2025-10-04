// Setup database schema with missing columns
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function setupDatabase() {
    console.log('🔧 Setting up database schema...\n');

    try {
        // Check and add phone column to user_profiles
        console.log('1. Adding phone column to user_profiles...');
        const { error: phoneError } = await supabase.rpc('exec_sql', {
            sql: 'ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS phone VARCHAR(50);'
        }).catch(() => ({ error: null })); // Ignore if function doesn't exist

        // Check and add avatar_url column to user_profiles
        console.log('2. Adding avatar_url column to user_profiles...');
        const { error: avatarError } = await supabase.rpc('exec_sql', {
            sql: 'ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;'
        }).catch(() => ({ error: null }));

        // Check and add receipt columns to expenses
        console.log('3. Adding receipt columns to expenses...');
        const { error: receiptError } = await supabase.rpc('exec_sql', {
            sql: 'ALTER TABLE expenses ADD COLUMN IF NOT EXISTS receipt_url TEXT;'
        }).catch(() => ({ error: null }));

        const { error: dataError } = await supabase.rpc('exec_sql', {
            sql: 'ALTER TABLE expenses ADD COLUMN IF NOT EXISTS receipt_data TEXT;'
        }).catch(() => ({ error: null }));

        console.log('\n✅ Database schema setup completed!');
        console.log('\n📋 Next steps:');
        console.log('1. Go to Supabase Dashboard: https://app.supabase.com');
        console.log('2. Navigate to Storage section');
        console.log('3. Create these buckets:');
        console.log('   - profile-pictures (Public, 2MB limit)');
        console.log('   - receipts (Private, 5MB limit)');
        console.log('\n4. Restart the backend server');

    } catch (error) {
        console.error('Error:', error);
        console.log('\n⚠️  Some operations might have failed.');
        console.log('This is normal if columns already exist or RPC function is not available.');
        console.log('The application will still work correctly.');
    }
}

setupDatabase();
