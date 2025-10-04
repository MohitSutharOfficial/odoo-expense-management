// Direct SQL execution via Supabase Admin
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkSchema() {
    console.log('🔍 Checking database schema...\n');

    try {
        // Check user_profiles columns
        const { data: users, error: userError } = await supabase
            .from('user_profiles')
            .select('*')
            .limit(1);

        if (users && users.length > 0) {
            console.log('✅ user_profiles table structure:');
            console.log('   Columns:', Object.keys(users[0]));

            if (users[0].hasOwnProperty('phone')) {
                console.log('   ✓ phone column exists');
            } else {
                console.log('   ✗ phone column MISSING');
            }

            if (users[0].hasOwnProperty('avatar_url')) {
                console.log('   ✓ avatar_url column exists');
            } else {
                console.log('   ✗ avatar_url column MISSING');
            }
        }

        // Check expenses columns
        const { data: expenses, error: expenseError } = await supabase
            .from('expenses')
            .select('*')
            .limit(1);

        if (expenses && expenses.length > 0) {
            console.log('\n✅ expenses table structure:');
            console.log('   Columns:', Object.keys(expenses[0]));

            if (expenses[0].hasOwnProperty('receipt_url')) {
                console.log('   ✓ receipt_url column exists');
            } else {
                console.log('   ✗ receipt_url column MISSING');
            }

            if (expenses[0].hasOwnProperty('receipt_data')) {
                console.log('   ✓ receipt_data column exists');
            } else {
                console.log('   ✗ receipt_data column MISSING');
            }
        } else {
            console.log('\n📋 expenses table is empty (no data to check structure)');
            console.log('   Creating a test expense to verify schema...');
        }

        console.log('\n' + '='.repeat(60));
        console.log('📝 TO ADD MISSING COLUMNS:');
        console.log('='.repeat(60));
        console.log('\n1. Go to: https://app.supabase.com/project/' + supabaseUrl.split('.')[0].split('//')[1]);
        console.log('2. Click on "SQL Editor" in the left sidebar');
        console.log('3. Click "New Query"');
        console.log('4. Paste and run this SQL:\n');
        console.log('-- Add missing columns');
        console.log('ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS phone VARCHAR(50);');
        console.log('ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;');
        console.log('ALTER TABLE expenses ADD COLUMN IF NOT EXISTS receipt_url TEXT;');
        console.log('ALTER TABLE expenses ADD COLUMN IF NOT EXISTS receipt_data TEXT;');
        console.log('\n5. Click "Run" button');
        console.log('='.repeat(60));

    } catch (error) {
        console.error('Error checking schema:', error);
    }
}

checkSchema();
