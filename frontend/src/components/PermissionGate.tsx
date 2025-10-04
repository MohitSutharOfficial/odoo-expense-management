import { ReactNode } from 'react';
import { usePermissions, useUserRole } from '../hooks/usePermissions';
import { Role, UserPermissions } from '../utils/permissions';

// ================================================
// PERMISSION-BASED COMPONENTS
// ================================================

interface RestrictedProps {
    children: ReactNode;
    fallback?: ReactNode;
}

/**
 * Show content only to Admin users
 */
export function AdminOnly({ children, fallback = null }: RestrictedProps) {
    const role = useUserRole();
    return role === Role.ADMIN ? <>{children}</> : <>{fallback}</>;
}

/**
 * Show content only to Finance users
 */
export function FinanceOnly({ children, fallback = null }: RestrictedProps) {
    const role = useUserRole();
    return role === Role.FINANCE ? <>{children}</> : <>{fallback}</>;
}

/**
 * Show content only to Manager users
 */
export function ManagerOnly({ children, fallback = null }: RestrictedProps) {
    const role = useUserRole();
    return role === Role.MANAGER ? <>{children}</> : <>{fallback}</>;
}

/**
 * Show content only to Employee users
 */
export function EmployeeOnly({ children, fallback = null }: RestrictedProps) {
    const role = useUserRole();
    return role === Role.EMPLOYEE ? <>{children}</> : <>{fallback}</>;
}

/**
 * Show content to users with specific roles
 */
interface RoleBasedProps extends RestrictedProps {
    roles: Role[];
}

export function RoleBased({ roles, children, fallback = null }: RoleBasedProps) {
    const role = useUserRole();
    return role && roles.includes(role) ? <>{children}</> : <>{fallback}</>;
}

/**
 * Show content based on permission
 */
interface PermissionBasedProps extends RestrictedProps {
    permission: keyof UserPermissions;
}

export function PermissionBased({ permission, children, fallback = null }: PermissionBasedProps) {
    const permissions = usePermissions();
    const hasPermission = permissions[permission];

    // Handle boolean permissions
    if (typeof hasPermission === 'boolean') {
        return hasPermission ? <>{children}</> : <>{fallback}</>;
    }

    return <>{fallback}</>;
}

/**
 * Show content if user has any of the specified permissions
 */
interface AnyPermissionProps extends RestrictedProps {
    permissions: Array<keyof UserPermissions>;
}

export function AnyPermission({ permissions: perms, children, fallback = null }: AnyPermissionProps) {
    const permissions = usePermissions();
    const hasAnyPermission = perms.some(perm => {
        const value = permissions[perm];
        return typeof value === 'boolean' ? value : false;
    });

    return hasAnyPermission ? <>{children}</> : <>{fallback}</>;
}

/**
 * Show content if user has all of the specified permissions
 */
export function AllPermissions({ permissions: perms, children, fallback = null }: AnyPermissionProps) {
    const permissions = usePermissions();
    const hasAllPermissions = perms.every(perm => {
        const value = permissions[perm];
        return typeof value === 'boolean' ? value : false;
    });

    return hasAllPermissions ? <>{children}</> : <>{fallback}</>;
}

/**
 * Render different content based on user role
 */
interface RenderByRoleProps {
    admin?: ReactNode;
    finance?: ReactNode;
    manager?: ReactNode;
    employee?: ReactNode;
    fallback?: ReactNode;
}

export function RenderByRole({ admin, finance, manager, employee, fallback = null }: RenderByRoleProps) {
    const role = useUserRole();

    switch (role) {
        case Role.ADMIN:
            return <>{admin || fallback}</>;
        case Role.FINANCE:
            return <>{finance || fallback}</>;
        case Role.MANAGER:
            return <>{manager || fallback}</>;
        case Role.EMPLOYEE:
            return <>{employee || fallback}</>;
        default:
            return <>{fallback}</>;
    }
}

/**
 * Higher-order component to restrict access
 */
export function withRoleRestriction<P extends object>(
    Component: React.ComponentType<P>,
    allowedRoles: Role[],
    FallbackComponent?: React.ComponentType
) {
    return function RestrictedComponent(props: P) {
        const role = useUserRole();

        if (!role || !allowedRoles.includes(role)) {
            return FallbackComponent ? <FallbackComponent /> : null;
        }

        return <Component {...props} />;
    };
}

/**
 * Higher-order component to require permission
 */
export function withPermission<P extends object>(
    Component: React.ComponentType<P>,
    requiredPermission: keyof UserPermissions,
    FallbackComponent?: React.ComponentType
) {
    return function PermissionRestrictedComponent(props: P) {
        const permissions = usePermissions();
        const hasPermission = permissions[requiredPermission];

        if (typeof hasPermission === 'boolean' && !hasPermission) {
            return FallbackComponent ? <FallbackComponent /> : null;
        }

        return <Component {...props} />;
    };
}

// ================================================
// EXPORT ALL
// ================================================

export default {
    AdminOnly,
    FinanceOnly,
    ManagerOnly,
    EmployeeOnly,
    RoleBased,
    PermissionBased,
    AnyPermission,
    AllPermissions,
    RenderByRole,
    withRoleRestriction,
    withPermission,
};
