export interface Expense {
    id: string;
    userId: string;
    categoryId: string;
    departmentId?: string;
    title: string;
    description?: string;
    amount: number;
    currency: string;
    date: string;
    receiptUrl?: string;
    status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAID';
    merchant?: string;
    merchantName?: string; // Alias for merchant for backwards compatibility
    paymentMethod?: string;
    notes?: string;
    createdAt: string;
    updatedAt: string;
    user: {
        id: string;
        name: string;
        email: string;
        avatar?: string;
    };
    category: Category;
    department?: {
        id: string;
        name: string;
    };
    approvals?: Approval[];
}

export interface Category {
    id: string;
    name: string;
    description?: string;
    icon?: string;
    color?: string;
    isActive: boolean;
}

export interface Department {
    id: string;
    name: string;
    description?: string;
    managerId?: string;
    _count?: {
        members: number;
    };
}

export interface Approval {
    id: string;
    expenseId: string;
    approverId: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    comments?: string;
    approvedAt?: string;
    createdAt: string;
    updatedAt?: string;
    approver: {
        id: string;
        name: string;
        email: string;
        avatar?: string;
        role?: string;
    };
    expense?: Expense;
}

export interface Budget {
    id: string;
    department_id: string;
    category_id?: string;
    // Database columns (snake_case)
    amount: number;
    spent: number;
    period: string;
    start_date: string;
    end_date: string;
    alert_threshold?: number;
    created_at: string;
    updated_at: string;
    // Legacy aliases (camelCase) for backwards compatibility
    departmentId?: string;
    allocatedAmount?: number;
    spentAmount?: number;
    startDate?: string;
    endDate?: string;
    alertThreshold?: number;
    isActive?: boolean;
    name?: string;
    department: {
        id: string;
        name: string;
    };
    category?: {
        id: string;
        name: string;
    };
}

export interface DashboardStats {
    totalExpenses: number;
    totalAmount: string;
    approvedCount: number;
    pendingCount: number;
    rejectedCount: number;
    pendingApprovals: number;
    categoryBreakdown: Array<{
        category: string;
        color?: string;
        icon?: string;
        amount: number;
        count: number;
    }>;
    monthlyTrend: Array<{
        month: string;
        total: number;
        count: number;
    }>;
    recentExpenses: Expense[];
}
