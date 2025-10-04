import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { supabaseAdmin, SupabaseService } from '../services/supabase.service';

const router = Router();

// Register
router.post(
    '/register',
    [
        body('email').isEmail().normalizeEmail(),
        body('password').isLength({ min: 6 }),
        body('name').trim().notEmpty()
    ],
    async (req: AuthRequest, res: any) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { email, password, name, role, department } = req.body;

            // For development/demo: Create user with email already confirmed
            // In production, you should set email_confirm: false and configure email service
            const isDevelopment = process.env.NODE_ENV !== 'production';

            // Create user in Supabase Auth
            const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
                email,
                password,
                email_confirm: isDevelopment, // Auto-confirm in development, require verification in production
                user_metadata: {
                    name,
                    role: role || 'EMPLOYEE',
                    department: department || null
                }
            });

            if (authError || !authData.user) {
                console.error('Supabase auth error:', authError);
                return res.status(400).json({ error: authError?.message || 'Registration failed' });
            }

            // Create user profile
            console.log('Creating user profile for:', authData.user.id, { email, name, role: role || 'EMPLOYEE', department });
            const profile = await SupabaseService.createUserProfile(authData.user.id, {
                email,
                name,
                role: role || 'EMPLOYEE',
                department: department || null
            });

            if (!profile) {
                console.error('Profile creation failed for user:', authData.user.id);
                console.log('User created in auth but profile creation failed. Continuing...');
            }

            if (isDevelopment) {
                // Development mode - auto login
                const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.signInWithPassword({
                    email,
                    password
                });

                if (sessionError || !sessionData.session) {
                    return res.status(500).json({ error: 'Failed to create session' });
                }

                return res.status(201).json({
                    user: { ...profile, id: authData.user.id },
                    token: sessionData.session.access_token
                });
            } else {
                // Production mode - require email verification
                // Send verification email manually
                try {
                    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
                        type: 'signup',
                        email: email,
                        password: password,
                    });

                    if (linkError) {
                        console.error('Failed to generate verification link:', linkError);
                    } else {
                        console.log('Verification link generated for:', email);
                        // In production, you would send this link via your email service
                        console.log('Verification link:', linkData.properties?.action_link);
                    }
                } catch (linkErr) {
                    console.error('Error generating link:', linkErr);
                }

                return res.status(201).json({
                    message: 'Registration successful! Please check your email to verify your account.',
                    email: email,
                    requiresVerification: true
                });
            }
        } catch (error) {
            console.error('Register error:', error);
            res.status(500).json({ error: 'Registration failed' });
        }
    }
);

// Login
router.post(
    '/login',
    [
        body('email').isEmail().normalizeEmail(),
        body('password').notEmpty()
    ],
    async (req: AuthRequest, res: any) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { email, password } = req.body;

            // Sign in with Supabase
            const { data, error } = await supabaseAdmin.auth.signInWithPassword({
                email,
                password
            });

            if (error) {
                console.error('Login error:', error);
                // Check if it's an email verification error
                if (error.message.includes('Email not confirmed') || error.message.includes('email_not_confirmed')) {
                    return res.status(403).json({
                        error: 'Please verify your email address before logging in. Check your inbox for the verification link.',
                        requiresVerification: true
                    });
                }
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            if (!data.user || !data.session) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            // Check if email is confirmed (only in production)
            const isDevelopment = process.env.NODE_ENV !== 'production';
            if (!isDevelopment && !data.user.email_confirmed_at) {
                return res.status(403).json({
                    error: 'Please verify your email address before logging in. Check your inbox for the verification link.',
                    requiresVerification: true
                });
            }

            // Get user profile
            let profile = await SupabaseService.getUserProfile(data.user.id);

            // If profile doesn't exist, create it from user metadata
            if (!profile) {
                console.log('Profile not found, creating from user metadata...');
                const metadata = data.user.user_metadata || {};
                profile = await SupabaseService.createUserProfile(data.user.id, {
                    email: data.user.email || email,
                    name: metadata.name || 'User',
                    role: metadata.role || 'EMPLOYEE',
                    department: metadata.department || null
                });

                if (!profile) {
                    // Still failed, use basic profile from auth data
                    console.error('Could not create profile, using basic auth data');
                    return res.json({
                        user: {
                            id: data.user.id,
                            email: data.user.email || email,
                            name: metadata.name || 'User',
                            role: metadata.role || 'EMPLOYEE',
                            department: metadata.department || null,
                            isActive: true
                        },
                        token: data.session.access_token
                    });
                }
            }

            // Check if user is active
            if (profile.is_active === false) {
                return res.status(401).json({ error: 'Account is inactive' });
            }

            res.json({
                user: {
                    id: data.user.id,
                    email: profile.email,
                    name: profile.name,
                    role: profile.role,
                    department: profile.department,
                    avatar: profile.avatar_url,
                    isActive: profile.is_active !== false
                },
                token: data.session.access_token
            });
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ error: 'Login failed' });
        }
    }
);

// Google Sign-In (Firebase)
router.post('/google', async (req, res) => {
    try {
        const { idToken, email, name, photoURL } = req.body;

        if (!email || !name) {
            return res.status(400).json({ error: 'Email and name are required' });
        }

        console.log('Google Sign-In attempt for:', email);

        // Check if user exists in Supabase Auth first
        const { data: authUsers, error: authListError } = await supabaseAdmin.auth.admin.listUsers();

        const existingAuthUser = authUsers?.users?.find((u: any) => u.email === email);

        // Check if user profile exists in database
        const { data: existingProfile, error: searchError } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        let userId: string;
        let profile: any;

        // Generate a consistent password for this Google user
        const googlePassword = `GOOGLE_${email}_${process.env.JWT_SECRET || 'default-secret'}`.substring(0, 32);

        if (existingAuthUser) {
            // User exists in Auth
            userId = existingAuthUser.id;
            console.log('Found existing auth user:', userId);

            // Get or create profile
            if (existingProfile) {
                profile = existingProfile;
                console.log('Found existing profile');

                // Check if user is active
                if (profile.is_active === false) {
                    return res.status(401).json({ error: 'Account is inactive' });
                }
            } else {
                // Create missing profile
                console.log('Creating missing profile for existing auth user');
                profile = await SupabaseService.createUserProfile(userId, {
                    email,
                    name,
                    role: 'EMPLOYEE',
                    department: null as any,
                    avatar_url: photoURL || undefined
                });

                if (!profile) {
                    profile = {
                        id: userId,
                        email,
                        name,
                        role: 'EMPLOYEE',
                        department: null,
                        avatar_url: photoURL || null,
                        is_active: true
                    };
                }
            }

            // Update the user's password to ensure consistent sign-in
            try {
                await supabaseAdmin.auth.admin.updateUserById(userId, {
                    password: googlePassword,
                    email_confirm: true
                });
                console.log('Updated user password');
            } catch (updateError) {
                console.error('Error updating password:', updateError);
                // Continue anyway - user might already have this password
            }
        } else {
            // Create new user with the Google password
            console.log('Creating new user');
            const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
                email,
                password: googlePassword,
                email_confirm: true,
                user_metadata: {
                    name,
                    role: 'EMPLOYEE',
                    department: null,
                    avatar_url: photoURL || null,
                    auth_provider: 'google'
                }
            });

            if (authError || !authData.user) {
                console.error('Supabase auth error:', authError);
                return res.status(400).json({ error: authError?.message || 'Registration failed' });
            }

            userId = authData.user.id;
            console.log('Created new user:', userId);

            // Create user profile
            profile = await SupabaseService.createUserProfile(userId, {
                email,
                name,
                role: 'EMPLOYEE',
                department: null as any,
                avatar_url: photoURL || undefined
            });

            if (!profile) {
                console.error('Profile creation failed for user:', userId);
                profile = {
                    id: userId,
                    email,
                    name,
                    role: 'EMPLOYEE',
                    department: null,
                    avatar_url: photoURL || null,
                    is_active: true
                };
            }
        }

        // Now sign in with the Google password to get a proper Supabase session token
        console.log('Attempting to sign in with password...');
        const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.signInWithPassword({
            email,
            password: googlePassword
        });

        if (sessionError || !sessionData.session) {
            console.error('Failed to create session:', sessionError);

            // Try one more time by resetting the password
            try {
                console.log('Retrying with password update...');
                await supabaseAdmin.auth.admin.updateUserById(userId, {
                    password: googlePassword,
                    email_confirm: true
                });

                // Try signing in again
                const { data: retrySession, error: retryError } = await supabaseAdmin.auth.signInWithPassword({
                    email,
                    password: googlePassword
                });

                if (retryError || !retrySession?.session) {
                    console.error('Retry failed:', retryError);
                    return res.status(500).json({ error: 'Failed to create session' });
                }

                const accessToken = retrySession.session.access_token;

                return res.json({
                    user: {
                        id: userId,
                        email: profile.email,
                        name: profile.name,
                        role: profile.role,
                        department: profile.department,
                        avatar: profile.avatar_url || photoURL,
                        isActive: profile.is_active !== false
                    },
                    token: accessToken
                });
            } catch (retryErr) {
                console.error('Retry error:', retryErr);
                return res.status(500).json({ error: 'Failed to create session' });
            }
        }

        const accessToken = sessionData.session.access_token;
        console.log('Successfully created session');

        res.json({
            user: {
                id: userId,
                email: profile.email,
                name: profile.name,
                role: profile.role,
                department: profile.department,
                avatar: profile.avatar_url || photoURL,
                isActive: profile.is_active !== false
            },
            token: accessToken
        });
    } catch (error) {
        console.error('Google Sign-In error:', error);
        res.status(500).json({ error: 'Google Sign-In failed' });
    }
});

// Get current user
router.get('/me', authenticate, async (req: AuthRequest, res) => {
    try {
        const userId = req.user!.id;

        // Get user profile from Supabase
        const profile = await SupabaseService.getUserProfile(userId);

        if (!profile) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            id: userId,
            email: profile.email,
            name: profile.name,
            role: profile.role,
            department: profile.department,
            avatar: profile.avatar_url,
            isActive: profile.is_active,
            createdAt: profile.created_at
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Failed to fetch user data' });
    }
});

export default router;
