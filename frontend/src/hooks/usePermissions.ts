import { useMemo } from 'react';
import { useAuthStore } from '../store';
import { Role, getPermissions, UserPermissions } from '../utils/permissions';

/**
 * React hook for accessing user permissions
 * Usage: const permissions = usePermissions();
 */
export function usePermissions(): UserPermissions {
    const user = useAuthStore((state) => state.user);

    return useMemo(() => {
        if (!user || !user.role) {
            // Default minimal permissions for unauthenticated users
            return {
                showDashboard: false,
                showExpenses: false,
                showApprovals: false,
                showBudgets: false,
                showUsers: false,
                showReports: false,
                showSettings: false,
                showAuditLogs: false,
                canCreateExpense: false,
                canApprove: false,
                canManageBudgets: false,
                canManageUsers: false,
                canExportData: false,
                canManageSystem: false,
                viewScope: 'OWN',
            };
        }

        return getPermissions(user.role as Role);
    }, [user]);
}

/**
 * Hook to check specific permission
 * Usage: const canApprove = useHasPermission('canApprove');
 */
export function useHasPermission(permission: keyof UserPermissions): boolean {
    const permissions = usePermissions();
    return permissions[permission] as boolean;
}

/**
 * Hook to get user role
 * Usage: const role = useUserRole();
 */
export function useUserRole(): Role | null {
    const user = useAuthStore((state) => state.user);
    return user?.role ? (user.role as Role) : null;
}

/**
 * Hook to check if user is specific role
 * Usage: const isAdmin = useIsRole('ADMIN');
 */
export function useIsRole(role: Role): boolean {
    const userRole = useUserRole();
    return userRole === role;
}

/**
 * Hook to check if user is admin
 * Usage: const isAdmin = useIsAdmin();
 */
export function useIsAdmin(): boolean {
    return useIsRole(Role.ADMIN);
}

/**
 * Hook to check if user is finance
 * Usage: const isFinance = useIsFinance();
 */
export function useIsFinance(): boolean {
    return useIsRole(Role.FINANCE);
}

/**
 * Hook to check if user is manager
 * Usage: const isManager = useIsManager();
 */
export function useIsManager(): boolean {
    return useIsRole(Role.MANAGER);
}

/**
 * Hook to check if user can view resource
 * Usage: const canView = useCanViewExpense(expenseOwnerId, expenseDepartment);
 */
export function useCanViewExpense(
    expenseOwnerId: string,
    expenseDepartment: string | undefined
): boolean {
    const user = useAuthStore((state) => state.user);
    const permissions = usePermissions();

    if (!user) return false;

    // Admin and Finance can view all
    if (permissions.viewScope === 'ALL') {
        return true;
    }

    // Manager can view department
    if (permissions.viewScope === 'DEPARTMENT') {
        return user.department === expenseDepartment;
    }

    // Employee can view own
    return user.id === expenseOwnerId;
}

/**
 * Hook to check if user can edit resource
 * Usage: const canEdit = useCanEditExpense(expenseOwnerId, expenseStatus);
 */
export function useCanEditExpense(
    expenseOwnerId: string,
    expenseStatus: string
): boolean {
    const user = useAuthStore((state) => state.user);
    const role = useUserRole();

    if (!user || !role) return false;

    // Admin and Finance can edit any
    if (role === Role.ADMIN || role === Role.FINANCE) {
        return true;
    }

    // Owner can edit only pending
    return user.id === expenseOwnerId && expenseStatus === 'PENDING';
}

export default {
    usePermissions,
    useHasPermission,
    useUserRole,
    useIsRole,
    useIsAdmin,
    useIsFinance,
    useIsManager,
    useCanViewExpense,
    useCanEditExpense,
};
