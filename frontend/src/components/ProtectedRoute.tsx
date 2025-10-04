import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store';
import { ReactNode } from 'react';

interface ProtectedRouteProps {
    children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const hasHydrated = useAuthStore((state) => state._hasHydrated);
    const location = useLocation();

    // Wait for hydration before making routing decisions
    if (!hasHydrated) {
        return null; // Return null to prevent flashing
    }

    if (!isAuthenticated) {
        return <Navigate to="/" state={{ from: location }} replace />;
    }

    return <>{children}</>;
}

export function PublicRoute({ children }: ProtectedRouteProps) {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const hasHydrated = useAuthStore((state) => state._hasHydrated);

    // Wait for hydration before making routing decisions
    if (!hasHydrated) {
        return null; // Return null to prevent flashing
    }

    if (isAuthenticated) {
        return <Navigate to="/dashboard" replace />;
    }

    return <>{children}</>;
}
