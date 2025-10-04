import { createClient, AuthError, User, Session } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
    },
});

// Auth types
export interface SignUpData {
    email: string;
    password: string;
    name: string;
    role?: string;
    department?: string;
}

export interface SignInData {
    email: string;
    password: string;
}

export interface AuthResponse {
    user: User | null;
    session: Session | null;
    error: AuthError | null;
}

// Auth Helper Functions
export const authService = {
    // Sign up with email and password
    signUp: async (data: SignUpData): Promise<AuthResponse> => {
        try {
            const { data: authData, error } = await supabase.auth.signUp({
                email: data.email,
                password: data.password,
                options: {
                    data: {
                        name: data.name,
                        role: data.role || 'EMPLOYEE',
                        department: data.department || '',
                    },
                },
            });

            if (error) {
                return { user: null, session: null, error };
            }

            // Create user profile in database
            if (authData.user) {
                const { error: profileError } = await supabase
                    .from('user_profiles')
                    .insert({
                        id: authData.user.id,
                        email: data.email,
                        name: data.name,
                        role: data.role || 'EMPLOYEE',
                        department: data.department || '',
                    });

                if (profileError) {
                    console.error('Profile creation error:', profileError);
                }
            }

            return { user: authData.user, session: authData.session, error: null };
        } catch (error) {
            console.error('Sign up error:', error);
            return { user: null, session: null, error: error as AuthError };
        }
    },

    // Sign in with email and password
    signIn: async (data: SignInData): Promise<AuthResponse> => {
        try {
            const { data: authData, error } = await supabase.auth.signInWithPassword({
                email: data.email,
                password: data.password,
            });

            if (error) {
                return { user: null, session: null, error };
            }

            return { user: authData.user, session: authData.session, error: null };
        } catch (error) {
            console.error('Sign in error:', error);
            return { user: null, session: null, error: error as AuthError };
        }
    },

    // Sign out
    signOut: async (): Promise<{ error: AuthError | null }> => {
        try {
            const { error } = await supabase.auth.signOut();
            return { error };
        } catch (error) {
            console.error('Sign out error:', error);
            return { error: error as AuthError };
        }
    },

    // Get current user
    getCurrentUser: async (): Promise<User | null> => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            return user;
        } catch (error) {
            console.error('Get current user error:', error);
            return null;
        }
    },

    // Get current session
    getCurrentSession: async (): Promise<Session | null> => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            return session;
        } catch (error) {
            console.error('Get current session error:', error);
            return null;
        }
    },

    // Reset password
    resetPassword: async (email: string): Promise<{ error: AuthError | null }> => {
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
            });
            return { error };
        } catch (error) {
            console.error('Reset password error:', error);
            return { error: error as AuthError };
        }
    },

    // Update password
    updatePassword: async (newPassword: string): Promise<{ error: AuthError | null }> => {
        try {
            const { error } = await supabase.auth.updateUser({
                password: newPassword,
            });
            return { error };
        } catch (error) {
            console.error('Update password error:', error);
            return { error: error as AuthError };
        }
    },

    // Update user metadata
    updateUserMetadata: async (metadata: Record<string, any>): Promise<{ error: AuthError | null }> => {
        try {
            const { error } = await supabase.auth.updateUser({
                data: metadata,
            });
            return { error };
        } catch (error) {
            console.error('Update user metadata error:', error);
            return { error: error as AuthError };
        }
    },

    // Listen to auth state changes
    onAuthStateChange: (callback: (user: User | null, session: Session | null) => void) => {
        return supabase.auth.onAuthStateChange((event, session) => {
            callback(session?.user ?? null, session);
        });
    },
};