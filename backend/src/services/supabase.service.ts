import { createClient, SupabaseClient, User } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

console.log('🔧 Supabase Configuration Check:');
console.log('SUPABASE_URL exists:', !!supabaseUrl);
console.log('SUPABASE_SERVICE_ROLE_KEY exists:', !!supabaseServiceKey);
console.log('SUPABASE_ANON_KEY exists:', !!supabaseAnonKey);

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase environment variables!');
    console.error('Available env vars:', Object.keys(process.env).filter(key => key.includes('SUPABASE')));
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in environment variables');
}

// Create Supabase admin client (bypasses RLS)
export const supabaseAdmin: SupabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});

// Create Supabase client (respects RLS)
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

export class SupabaseService {
    // Verify JWT token from Supabase
    static async verifyToken(token: string): Promise<User | null> {
        try {
            const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

            if (error || !user) {
                console.error('Token verification failed:', error);
                return null;
            }

            return user;
        } catch (error) {
            console.error('Token verification error:', error);
            return null;
        }
    }

    // Get user profile with role information
    static async getUserProfile(userId: string) {
        try {
            const { data, error } = await supabaseAdmin
                .from('user_profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) {
                console.error('Get user profile error:', error);
                return null;
            }

            return data;
        } catch (error) {
            console.error('Get user profile error:', error);
            return null;
        }
    }

    // Create user profile
    static async createUserProfile(userId: string, data: {
        email: string;
        name: string;
        role: string;
        department: string;
        avatar_url?: string | null;
    }) {
        try {
            const { data: profile, error } = await supabaseAdmin
                .from('user_profiles')
                .insert({
                    id: userId,
                    email: data.email,
                    name: data.name,
                    role: data.role,
                    department: data.department,
                    avatar_url: data.avatar_url,
                })
                .select()
                .single();

            if (error) {
                console.error('Create user profile error:', error);
                return null;
            }

            return profile;
        } catch (error) {
            console.error('Create user profile error:', error);
            return null;
        }
    }

    // Update user profile
    static async updateUserProfile(userId: string, updates: Partial<{
        name: string;
        department: string;
        role: string;
        avatar_url: string;
    }>) {
        try {
            const { data, error } = await supabaseAdmin
                .from('user_profiles')
                .update(updates)
                .eq('id', userId)
                .select()
                .single();

            if (error) {
                console.error('Update user profile error:', error);
                return null;
            }

            return data;
        } catch (error) {
            console.error('Update user profile error:', error);
            return null;
        }
    }

    // Delete user (admin only)
    static async deleteUser(userId: string) {
        try {
            const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

            if (error) {
                console.error('Delete user error:', error);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Delete user error:', error);
            return false;
        }
    }

    // List all users (admin only)
    static async listUsers(page: number = 1, perPage: number = 50) {
        try {
            const { data, error } = await supabaseAdmin.auth.admin.listUsers({
                page,
                perPage,
            });

            if (error) {
                console.error('List users error:', error);
                return { users: [], total: 0 };
            }

            return {
                users: data.users,
                total: data.users.length,
            };
        } catch (error) {
            console.error('List users error:', error);
            return { users: [], total: 0 };
        }
    }

    // Update user email (admin only)
    static async updateUserEmail(userId: string, newEmail: string) {
        try {
            const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
                email: newEmail,
            });

            if (error) {
                console.error('Update user email error:', error);
                return null;
            }

            return data.user;
        } catch (error) {
            console.error('Update user email error:', error);
            return null;
        }
    }

    // Invite user by email (admin only)
    static async inviteUserByEmail(email: string, metadata?: Record<string, any>) {
        try {
            const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
                data: metadata,
                redirectTo: `${process.env.FRONTEND_URL}/accept-invite`,
            });

            if (error) {
                console.error('Invite user error:', error);
                return null;
            }

            return data.user;
        } catch (error) {
            console.error('Invite user error:', error);
            return null;
        }
    }
}

export default SupabaseService;
