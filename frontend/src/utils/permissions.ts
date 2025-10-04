// ================================================
// FRONTEND PERMISSION UTILITIES
// ================================================
// UI-side permission checking and role-based rendering

export enum Role {
    ADMIN = 'ADMIN',
    FINANCE = 'FINANCE',
    MANAGER = 'MANAGER',
    EMPLOYEE = 'EMPLOYEE'
}

export interface UserPermissions {
    // Navigation visibility
    showDashboard: boolean;
    showExpenses: boolean;
    showApprovals: boolean;
    showBudgets: boolean;
    showUsers: boolean;
    showReports: boolean;
    showSettings: boolean;
    showAuditLogs: boolean;

    // Action visibility
    canCreateExpense: boolean;
    canApprove: boolean;
    canManageBudgets: boolean;
    canManageUsers: boolean;
    canExportData: boolean;
    canManageSystem: boolean;

    // View scope
    viewScope: 'ALL' | 'DEPARTMENT' | 'OWN';
}

/**
 * Get UI permissions based on user role
 */
export function getPermissions(role: Role): UserPermissions {
    switch (role) {
        case Role.ADMIN:
            return {
                showDashboard: true,
                showExpenses: true,
                showApprovals: true,
                showBudgets: true,
                showUsers: true,
                showReports: true,
                showSettings: true,
                showAuditLogs: true,
                canCreateExpense: true,
                canApprove: true,
                canManageBudgets: true,
                canManageUsers: true,
                canExportData: true,
                canManageSystem: true,
                viewScope: 'ALL',
            };

        case Role.FINANCE:
            return {
                showDashboard: true,
                showExpenses: true,
                showApprovals: true,
                showBudgets: true,
                showUsers: true,
                showReports: true,
                showSettings: true,
                showAuditLogs: false,
                canCreateExpense: true,
                canApprove: true,
                canManageBudgets: true,
                canManageUsers: false,
                canExportData: true,
                canManageSystem: false,
                viewScope: 'ALL',
            };

        case Role.MANAGER:
            return {
                showDashboard: true,
                showExpenses: true,
                showApprovals: true,
                showBudgets: true,
                showUsers: false,
                showReports: true,
                showSettings: true,
                showAuditLogs: false,
                canCreateExpense: true,
                canApprove: true,
                canManageBudgets: false,
                canManageUsers: false,
                canExportData: false,
                canManageSystem: false,
                viewScope: 'DEPARTMENT',
            };

        case Role.EMPLOYEE:
        default:
            return {
                showDashboard: true,
                showExpenses: true,
                showApprovals: false,
                showBudgets: false,
                showUsers: false,
                showReports: false,
                showSettings: true,
                showAuditLogs: false,
                canCreateExpense: true,
                canApprove: false,
                canManageBudgets: false,
                canManageUsers: false,
                canExportData: false,
                canManageSystem: false,
                viewScope: 'OWN',
            };
    }
}

/**
 * Check if user can view an expense
 */
export function canViewExpense(
    userRole: Role,
    userId: string,
    userDepartment: string | undefined,
    expenseOwnerId: string,
    expenseDepartment: string | undefined
): boolean {
    // Admin and Finance can view all
    if (userRole === Role.ADMIN || userRole === Role.FINANCE) {
        return true;
    }

    // Manager can view department expenses
    if (userRole === Role.MANAGER) {
        return userDepartment === expenseDepartment;
    }

    // Employee can view own expenses
    return userId === expenseOwnerId;
}

/**
 * Check if user can edit an expense
 */
export function canEditExpense(
    userRole: Role,
    userId: string,
    expenseOwnerId: string,
    expenseStatus: string
): boolean {
    // Admin and Finance can edit any
    if (userRole === Role.ADMIN || userRole === Role.FINANCE) {
        return true;
    }

    // Owner can edit only pending expenses
    if (userId === expenseOwnerId && expenseStatus === 'PENDING') {
        return true;
    }

    return false;
}

/**
 * Check if user can approve an expense
 */
export function canApproveExpense(
    userRole: Role,
    userId: string,
    userDepartment: string | undefined,
    expenseOwnerId: string,
    expenseDepartment: string | undefined
): boolean {
    // Cannot approve own expense
    if (userId === expenseOwnerId) {
        return false;
    }

    // Admin and Finance can approve all
    if (userRole === Role.ADMIN || userRole === Role.FINANCE) {
        return true;
    }

    // Manager can approve department expenses
    if (userRole === Role.MANAGER) {
        return userDepartment === expenseDepartment;
    }

    return false;
}

/**
 * Check if user can delete an expense
 */
export function canDeleteExpense(
    userRole: Role,
    userId: string,
    expenseOwnerId: string,
    expenseStatus: string
): boolean {
    // Admin can delete any
    if (userRole === Role.ADMIN) {
        return true;
    }

    // Owner can delete only pending expenses
    if (userId === expenseOwnerId && expenseStatus === 'PENDING') {
        return true;
    }

    return false;
}

/**
 * Get role display name
 */
export function getRoleDisplayName(role: Role): string {
    switch (role) {
        case Role.ADMIN:
            return 'Administrator';
        case Role.FINANCE:
            return 'Finance Manager';
        case Role.MANAGER:
            return 'Department Manager';
        case Role.EMPLOYEE:
            return 'Employee';
        default:
            return role;
    }
}

/**
 * Get role color for UI badges
 */
export function getRoleColor(role: Role): string {
    switch (role) {
        case Role.ADMIN:
            return '#714B67';
        case Role.FINANCE:
            return '#00A09D';
        case Role.MANAGER:
            return '#f0ad4e';
        case Role.EMPLOYEE:
            return '#28a745';
        default:
            return '#6c757d';
    }
}

export default {
    Role,
    getPermissions,
    canViewExpense,
    canEditExpense,
    canApproveExpense,
    canDeleteExpense,
    getRoleDisplayName,
    getRoleColor,
};
