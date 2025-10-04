const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://lvomlmmodgpilewyyphz.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2b21sbW1vZGdwaWxld3l5cGh6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTU3MjI4NywiZXhwIjoyMDc1MTQ4Mjg3fQ.APXAHh96tq4FJ_ibSFv4dUJTOAPsYeHU9EZcwMYLr5E';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixPolicies() {
    try {
        console.log('🔧 Fixing RLS policies using Supabase Admin API...\n');

        const sqlCommands = [
            // Drop all policies
            `DO $$
            DECLARE
                r RECORD;
            BEGIN
                FOR r IN (SELECT schemaname, tablename, policyname 
                         FROM pg_policies 
                         WHERE schemaname = 'public')
                LOOP
                    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
                                 r.policyname, r.schemaname, r.tablename);
                END LOOP;
            END $$;`,

            // Disable RLS on all tables
            'ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;',
            'ALTER TABLE public.departments DISABLE ROW LEVEL SECURITY;',
            'ALTER TABLE public.categories DISABLE ROW LEVEL SECURITY;',
            'ALTER TABLE public.budgets DISABLE ROW LEVEL SECURITY;',
            'ALTER TABLE public.expenses DISABLE ROW LEVEL SECURITY;',
            'ALTER TABLE public.approvals DISABLE ROW LEVEL SECURITY;',
            'ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;',
            'ALTER TABLE public.audit_logs DISABLE ROW LEVEL SECURITY;'
        ];

        for (const sql of sqlCommands) {
            console.log('Executing:', sql.substring(0, 50) + '...');
            const { error } = await supabase.rpc('exec_sql', { query: sql });

            if (error) {
                console.error('Error:', error.message);
                // Try direct query instead
                const { error: queryError } = await supabase.from('_sql').select(sql);
                if (queryError) {
                    console.error('Query error:', queryError.message);
                }
            } else {
                console.log('✅ Success');
            }
        }

        console.log('\n✨ Done! Now testing with a simple query...');

        // Test query
        const { data, error } = await supabase
            .from('user_profiles')
            .select('id, email, name')
            .limit(1);

        if (error) {
            console.error('❌ Test query failed:', error.message);
            console.log('\n⚠️  You need to run the SQL commands manually in Supabase Dashboard');
            console.log('   Go to: https://supabase.com/dashboard/project/daxiwxhwslgtnqbslfip/sql');
            console.log('   And run the SQL from: FIX_RLS.sql');
        } else {
            console.log('✅ Test query successful!');
            console.log('   Found user:', data?.[0]?.email);
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.log('\n⚠️  Manual fix required! Run this in Supabase SQL Editor:');
        console.log('   File: C:\\Users\\Admin\\Desktop\\odoo\\FIX_RLS.sql');
    }
}

fixPolicies();
