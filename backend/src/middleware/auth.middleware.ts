import { Request, Response, NextFunction } from 'express';
import { SupabaseService } from '../services/supabase.service';

export interface AuthRequest extends Request {
    user?: {
        id: string;
        email: string;
        role: string;
        department?: string;
    };
    body: any;
    params: any;
    query: any;
    headers: any;
    file?: any;
}

// Helper to determine if token is Supabase or JWT
const isSupabaseToken = (token: string): boolean => {
    // Supabase tokens typically start with "eyJ" and are much longer
    // They also decode to have specific Supabase claims
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return false;

        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
        // Supabase tokens have 'aud', 'role', 'iss' with Supabase-specific values
        return payload.aud === 'authenticated' && payload.iss?.includes('supabase');
    } catch {
        return false;
    }
};

export const authenticate = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        // Check if it's a Supabase token
        if (isSupabaseToken(token)) {
            // Verify Supabase token
            const supabaseUser = await SupabaseService.verifyToken(token);

            if (!supabaseUser) {
                return res.status(401).json({ error: 'Invalid or expired token' });
            }

            // Get user profile with role information
            const profile = await SupabaseService.getUserProfile(supabaseUser.id);

            if (!profile) {
                return res.status(401).json({ error: 'User profile not found' });
            }

            req.user = {
                id: supabaseUser.id,
                email: supabaseUser.email || profile.email,
                role: profile.role || 'EMPLOYEE',
                department: profile.department_id || undefined,
            };

            next();
        } else {
            // Invalid token format
            return res.status(401).json({ error: 'Invalid token format' });
        }
    } catch (error) {
        console.error('Authentication error:', error);
        res.status(401).json({ error: 'Invalid or expired token' });
    }
};

export const authorize = (...allowedRoles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }

        next();
    };
};
