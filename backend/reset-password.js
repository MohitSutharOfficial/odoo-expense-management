// Script to list all users and reset password
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

async function main() {
    const email = 'kingmohitsuthar@gmail.com';
    const newPassword = '12345678';

    console.log('Listing all users...\n');

    // List all users
    const { data: listData, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
        console.error('Error listing users:', listError);
        return;
    }

    console.log(`Found ${listData.users.length} users:`);
    listData.users.forEach(user => {
        console.log(`- ${user.email} (ID: ${user.id})`);
    });

    // Find the specific user
    const targetUser = listData.users.find(u => u.email === email);

    if (!targetUser) {
        console.error(`\n❌ User ${email} not found!`);
        return;
    }

    console.log(`\n✅ Found user: ${targetUser.email}`);
    console.log(`   ID: ${targetUser.id}`);
    console.log(`\nResetting password to: ${newPassword}`);

    // Update password
    const { data, error } = await supabase.auth.admin.updateUserById(
        targetUser.id,
        { password: newPassword }
    );

    if (error) {
        console.error('❌ Error resetting password:', error);
    } else {
        console.log('\n✅ Password reset successfully!');
        console.log('You can now login with:');
        console.log(`   Email: ${email}`);
        console.log(`   Password: ${newPassword}`);
    }
}

main().catch(console.error);
