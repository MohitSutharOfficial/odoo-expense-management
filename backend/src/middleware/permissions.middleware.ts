import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import { Permission, hasPermission, hasAnyPermission, Role } from '../utils/permissions';

/**
 * Middleware to check if user has required permission
 */
export const requirePermission = (permission: Permission) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const userRole = req.user.role as Role;

        if (!hasPermission(userRole, permission)) {
            return res.status(403).json({ 
                error: 'Insufficient permissions',
                required: permission,
                userRole: userRole
            });
        }

        next();
    };
};

/**
 * Middleware to check if user has any of the required permissions
 */
export const requireAnyPermission = (permissions: Permission[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const userRole = req.user.role as Role;

        if (!hasAnyPermission(userRole, permissions)) {
            return res.status(403).json({ 
                error: 'Insufficient permissions',
                required: `Any of: ${permissions.join(', ')}`,
                userRole: userRole
            });
        }

        next();
    };
};

/**
 * Middleware to check resource ownership
 */
export const requireOwnership = (getResourceOwnerId: (req: AuthRequest) => string | Promise<string>) => {
    return async (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        try {
            const resourceOwnerId = await getResourceOwnerId(req);
            
            // Admin can access anything
            if (req.user.role === 'ADMIN') {
                return next();
            }

            // Check ownership
            if (req.user.id !== resourceOwnerId) {
                return res.status(403).json({ 
                    error: 'Access denied',
                    message: 'You can only access your own resources'
                });
            }

            next();
        } catch (error) {
            console.error('Ownership check error:', error);
            return res.status(500).json({ error: 'Failed to verify ownership' });
        }
    };
};

/**
 * Middleware to check department access
 */
export const requireDepartmentAccess = (getResourceDepartment: (req: AuthRequest) => string | Promise<string>) => {
    return async (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        // Admin and Finance can access all departments
        if (req.user.role === 'ADMIN' || req.user.role === 'FINANCE') {
            return next();
        }

        try {
            const resourceDepartment = await getResourceDepartment(req);

            // Manager can only access own department
            if (req.user.role === 'MANAGER') {
                if (req.user.department !== resourceDepartment) {
                    return res.status(403).json({ 
                        error: 'Access denied',
                        message: 'You can only access resources from your department'
                    });
                }
                return next();
            }

            // Employees restricted to own resources (handled by ownership check)
            return res.status(403).json({ error: 'Access denied' });

        } catch (error) {
            console.error('Department access check error:', error);
            return res.status(500).json({ error: 'Failed to verify department access' });
        }
    };
};

/**
 * Combined ownership or permission check
 */
export const requireOwnershipOrPermission = (
    getResourceOwnerId: (req: AuthRequest) => string | Promise<string>,
    permission: Permission
) => {
    return async (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const userRole = req.user.role as Role;

        // Check if user has the permission
        if (hasPermission(userRole, permission)) {
            return next();
        }

        // Otherwise check ownership
        try {
            const resourceOwnerId = await getResourceOwnerId(req);
            
            if (req.user.id === resourceOwnerId) {
                return next();
            }

            return res.status(403).json({ 
                error: 'Access denied',
                message: 'You need appropriate permissions or resource ownership'
            });

        } catch (error) {
            console.error('Ownership or permission check error:', error);
            return res.status(500).json({ error: 'Failed to verify access' });
        }
    };
};

export default {
    requirePermission,
    requireAnyPermission,
    requireOwnership,
    requireDepartmentAccess,
    requireOwnershipOrPermission,
};
