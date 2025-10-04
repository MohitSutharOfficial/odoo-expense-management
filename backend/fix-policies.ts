import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://daxiwxhwslgtnqbslfip.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRheGl3eGh3c2xndG5xYnNsZmlwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyNzkyMDQwNCwiZXhwIjoyMDQzNDk2NDA0fQ.vHNbAd97eM2MH-8v4ZHRFBo7gT3CkwjGdMlXO04cAyA';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function fixPolicies() {
    try {
        console.log('🔧 Disabling RLS on all tables...\n');

        const tables = [
            'user_profiles',
            'departments',
            'categories',
            'budgets',
            'expenses',
            'approvals',
            'notifications',
            'audit_logs'
        ];

        for (const table of tables) {
            console.log(`Disabling RLS on ${table}...`);
            const { error } = await supabase.rpc('exec_sql', {
                query: `ALTER TABLE public.${table} DISABLE ROW LEVEL SECURITY;`
            });

            if (error) {
                console.error(`Error on ${table}:`, error.message);
            } else {
                console.log(`✅ ${table} - RLS disabled`);
            }
        }

        console.log('\n✨ All done! RLS has been disabled.');
        console.log('⚠️  Authentication is now handled at the application layer only.');

    } catch (error) {
        console.error('❌ Error:', error);
    }
}

fixPolicies();
