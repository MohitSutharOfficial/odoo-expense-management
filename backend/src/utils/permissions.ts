// ================================================
// ROLE-BASED ACCESS CONTROL (RBAC) SYSTEM
// ================================================
// Comprehensive permission management for expense system

export enum Role {
    ADMIN = 'ADMIN',
    FINANCE = 'FINANCE',
    MANAGER = 'MANAGER',
    EMPLOYEE = 'EMPLOYEE'
}

export enum Permission {
    // User Management
    VIEW_ALL_USERS = 'VIEW_ALL_USERS',
    CREATE_USER = 'CREATE_USER',
    UPDATE_USER = 'UPDATE_USER',
    DELETE_USER = 'DELETE_USER',
    UPDATE_USER_ROLE = 'UPDATE_USER_ROLE',

    // Expense Management
    VIEW_OWN_EXPENSES = 'VIEW_OWN_EXPENSES',
    VIEW_DEPARTMENT_EXPENSES = 'VIEW_DEPARTMENT_EXPENSES',
    VIEW_ALL_EXPENSES = 'VIEW_ALL_EXPENSES',
    CREATE_EXPENSE = 'CREATE_EXPENSE',
    UPDATE_OWN_EXPENSE = 'UPDATE_OWN_EXPENSE',
    UPDATE_ANY_EXPENSE = 'UPDATE_ANY_EXPENSE',
    DELETE_OWN_EXPENSE = 'DELETE_OWN_EXPENSE',
    DELETE_ANY_EXPENSE = 'DELETE_ANY_EXPENSE',

    // Approval Management
    APPROVE_DEPARTMENT_EXPENSES = 'APPROVE_DEPARTMENT_EXPENSES',
    APPROVE_ALL_EXPENSES = 'APPROVE_ALL_EXPENSES',
    REJECT_EXPENSES = 'REJECT_EXPENSES',

    // Budget Management
    VIEW_DEPARTMENT_BUDGET = 'VIEW_DEPARTMENT_BUDGET',
    VIEW_ALL_BUDGETS = 'VIEW_ALL_BUDGETS',
    CREATE_BUDGET = 'CREATE_BUDGET',
    UPDATE_BUDGET = 'UPDATE_BUDGET',
    DELETE_BUDGET = 'DELETE_BUDGET',

    // Department Management
    VIEW_DEPARTMENTS = 'VIEW_DEPARTMENTS',
    CREATE_DEPARTMENT = 'CREATE_DEPARTMENT',
    UPDATE_DEPARTMENT = 'UPDATE_DEPARTMENT',
    DELETE_DEPARTMENT = 'DELETE_DEPARTMENT',

    // Category Management
    VIEW_CATEGORIES = 'VIEW_CATEGORIES',
    CREATE_CATEGORY = 'CREATE_CATEGORY',
    UPDATE_CATEGORY = 'UPDATE_CATEGORY',
    DELETE_CATEGORY = 'DELETE_CATEGORY',

    // Notification Management
    VIEW_OWN_NOTIFICATIONS = 'VIEW_OWN_NOTIFICATIONS',
    CREATE_NOTIFICATION = 'CREATE_NOTIFICATION',
    DELETE_NOTIFICATION = 'DELETE_NOTIFICATION',

    // Audit & Reports
    VIEW_AUDIT_LOGS = 'VIEW_AUDIT_LOGS',
    GENERATE_REPORTS = 'GENERATE_REPORTS',
    EXPORT_DATA = 'EXPORT_DATA',

    // System Settings
    MANAGE_SYSTEM_SETTINGS = 'MANAGE_SYSTEM_SETTINGS',
}

// ================================================
// PERMISSION MATRIX
// ================================================
// Define what each role can do

// Define base employee permissions
const EMPLOYEE_PERMISSIONS: Permission[] = [
    // Own data management
    Permission.VIEW_OWN_EXPENSES,
    Permission.CREATE_EXPENSE,
    Permission.UPDATE_OWN_EXPENSE,
    Permission.DELETE_OWN_EXPENSE,

    // Limited viewing
    Permission.VIEW_DEPARTMENTS,
    Permission.VIEW_CATEGORIES,
    Permission.VIEW_DEPARTMENT_BUDGET,
    Permission.VIEW_OWN_NOTIFICATIONS,
    Permission.DELETE_NOTIFICATION,
];

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
    [Role.EMPLOYEE]: EMPLOYEE_PERMISSIONS,

    [Role.MANAGER]: [
        // All employee permissions
        ...EMPLOYEE_PERMISSIONS,

        // Department management
        Permission.VIEW_DEPARTMENT_EXPENSES,
        Permission.APPROVE_DEPARTMENT_EXPENSES,
        Permission.REJECT_EXPENSES,

        // Reports
        Permission.GENERATE_REPORTS,
    ],

    [Role.FINANCE]: [
        // Expense management
        Permission.VIEW_ALL_EXPENSES,
        Permission.VIEW_DEPARTMENT_EXPENSES,
        Permission.VIEW_OWN_EXPENSES,
        Permission.CREATE_EXPENSE,
        Permission.UPDATE_ANY_EXPENSE,

        // Approval
        Permission.APPROVE_ALL_EXPENSES,
        Permission.APPROVE_DEPARTMENT_EXPENSES,
        Permission.REJECT_EXPENSES,

        // Budget management
        Permission.VIEW_ALL_BUDGETS,
        Permission.VIEW_DEPARTMENT_BUDGET,
        Permission.CREATE_BUDGET,
        Permission.UPDATE_BUDGET,
        Permission.DELETE_BUDGET,

        // Viewing
        Permission.VIEW_DEPARTMENTS,
        Permission.VIEW_CATEGORIES,
        Permission.VIEW_ALL_USERS,

        // Reports
        Permission.GENERATE_REPORTS,
        Permission.EXPORT_DATA,

        // Notifications
        Permission.VIEW_OWN_NOTIFICATIONS,
        Permission.CREATE_NOTIFICATION,
        Permission.DELETE_NOTIFICATION,
    ],

    [Role.ADMIN]: [
        // All permissions
        ...Object.values(Permission),
    ],
};

// ================================================
// PERMISSION CHECKING FUNCTIONS
// ================================================

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: Role, permission: Permission): boolean {
    return ROLE_PERMISSIONS[role]?.includes(permission) || false;
}

/**
 * Check if a role has any of the specified permissions
 */
export function hasAnyPermission(role: Role, permissions: Permission[]): boolean {
    return permissions.some(permission => hasPermission(role, permission));
}

/**
 * Check if a role has all of the specified permissions
 */
export function hasAllPermissions(role: Role, permissions: Permission[]): boolean {
    return permissions.every(permission => hasPermission(role, permission));
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: Role): Permission[] {
    return ROLE_PERMISSIONS[role] || [];
}

/**
 * Check if user owns a resource
 */
export function isResourceOwner(userId: string, resourceOwnerId: string): boolean {
    return userId === resourceOwnerId;
}

/**
 * Check if user is in the same department as resource
 */
export function isSameDepartment(userDept: string, resourceDept: string): boolean {
    return userDept === resourceDept;
}

// ================================================
// AUTHORIZATION RULES
// ================================================

export interface AuthorizationContext {
    userId: string;
    role: Role;
    department?: string;
    resourceOwnerId?: string;
    resourceDepartment?: string;
}

/**
 * Check if user can view an expense
 */
export function canViewExpense(context: AuthorizationContext): boolean {
    const { role, userId, resourceOwnerId, department, resourceDepartment } = context;

    // Admin and Finance can view all
    if (hasPermission(role, Permission.VIEW_ALL_EXPENSES)) {
        return true;
    }

    // Manager can view department expenses
    if (hasPermission(role, Permission.VIEW_DEPARTMENT_EXPENSES)) {
        return department !== undefined &&
            resourceDepartment !== undefined &&
            isSameDepartment(department, resourceDepartment);
    }

    // Employee can view own expenses
    if (hasPermission(role, Permission.VIEW_OWN_EXPENSES)) {
        return resourceOwnerId !== undefined && isResourceOwner(userId, resourceOwnerId);
    }

    return false;
}

/**
 * Check if user can update an expense
 */
export function canUpdateExpense(context: AuthorizationContext): boolean {
    const { role, userId, resourceOwnerId } = context;

    // Admin and Finance can update any
    if (hasPermission(role, Permission.UPDATE_ANY_EXPENSE)) {
        return true;
    }

    // Employee can update own pending expenses
    if (hasPermission(role, Permission.UPDATE_OWN_EXPENSE)) {
        return resourceOwnerId !== undefined && isResourceOwner(userId, resourceOwnerId);
    }

    return false;
}

/**
 * Check if user can approve an expense
 */
export function canApproveExpense(context: AuthorizationContext): boolean {
    const { role, department, resourceDepartment, userId, resourceOwnerId } = context;

    // Cannot approve own expense
    if (resourceOwnerId && isResourceOwner(userId, resourceOwnerId)) {
        return false;
    }

    // Admin and Finance can approve all
    if (hasPermission(role, Permission.APPROVE_ALL_EXPENSES)) {
        return true;
    }

    // Manager can approve department expenses
    if (hasPermission(role, Permission.APPROVE_DEPARTMENT_EXPENSES)) {
        return department !== undefined &&
            resourceDepartment !== undefined &&
            isSameDepartment(department, resourceDepartment);
    }

    return false;
}

/**
 * Check if user can delete an expense
 */
export function canDeleteExpense(context: AuthorizationContext): boolean {
    const { role, userId, resourceOwnerId } = context;

    // Admin can delete any
    if (hasPermission(role, Permission.DELETE_ANY_EXPENSE)) {
        return true;
    }

    // Employee can delete own pending expenses
    if (hasPermission(role, Permission.DELETE_OWN_EXPENSE)) {
        return resourceOwnerId !== undefined && isResourceOwner(userId, resourceOwnerId);
    }

    return false;
}

/**
 * Check if user can manage budgets
 */
export function canManageBudget(role: Role): boolean {
    return hasAnyPermission(role, [
        Permission.CREATE_BUDGET,
        Permission.UPDATE_BUDGET,
        Permission.DELETE_BUDGET,
    ]);
}

/**
 * Check if user can manage users
 */
export function canManageUsers(role: Role): boolean {
    return hasAnyPermission(role, [
        Permission.CREATE_USER,
        Permission.UPDATE_USER,
        Permission.DELETE_USER,
        Permission.UPDATE_USER_ROLE,
    ]);
}

/**
 * Check if user can view audit logs
 */
export function canViewAuditLogs(role: Role): boolean {
    return hasPermission(role, Permission.VIEW_AUDIT_LOGS);
}

/**
 * Get filtered permissions for UI rendering
 */
export function getUIPermissions(role: Role) {
    return {
        // Navigation visibility
        showDashboard: true,
        showExpenses: true,
        showApprovals: hasAnyPermission(role, [
            Permission.APPROVE_DEPARTMENT_EXPENSES,
            Permission.APPROVE_ALL_EXPENSES,
        ]),
        showBudgets: hasAnyPermission(role, [
            Permission.VIEW_DEPARTMENT_BUDGET,
            Permission.VIEW_ALL_BUDGETS,
        ]),
        showUsers: hasPermission(role, Permission.VIEW_ALL_USERS),
        showReports: hasPermission(role, Permission.GENERATE_REPORTS),
        showSettings: true,
        showAuditLogs: hasPermission(role, Permission.VIEW_AUDIT_LOGS),

        // Action visibility
        canCreateExpense: hasPermission(role, Permission.CREATE_EXPENSE),
        canApprove: hasAnyPermission(role, [
            Permission.APPROVE_DEPARTMENT_EXPENSES,
            Permission.APPROVE_ALL_EXPENSES,
        ]),
        canManageBudgets: canManageBudget(role),
        canManageUsers: canManageUsers(role),
        canExportData: hasPermission(role, Permission.EXPORT_DATA),
        canManageSystem: hasPermission(role, Permission.MANAGE_SYSTEM_SETTINGS),

        // View scope
        viewScope: hasPermission(role, Permission.VIEW_ALL_EXPENSES)
            ? 'ALL'
            : hasPermission(role, Permission.VIEW_DEPARTMENT_EXPENSES)
                ? 'DEPARTMENT'
                : 'OWN',
    };
}

// ================================================
// EXPORT ALL
// ================================================

export default {
    Role,
    Permission,
    ROLE_PERMISSIONS,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    getRolePermissions,
    isResourceOwner,
    isSameDepartment,
    canViewExpense,
    canUpdateExpense,
    canApproveExpense,
    canDeleteExpense,
    canManageBudget,
    canManageUsers,
    canViewAuditLogs,
    getUIPermissions,
};
