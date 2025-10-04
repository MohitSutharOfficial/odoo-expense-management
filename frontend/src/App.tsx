import { Routes, Route, Navigate } from 'react-router-dom';
import { PublicRoute, ProtectedRoute } from './components/ProtectedRoute';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Expenses from './pages/Expenses';
import ExpenseDetail from './pages/ExpenseDetail';
import NewExpense from './pages/NewExpense';
import Approvals from './pages/Approvals';
import Settings from './pages/Settings';
import Layout from './components/Layout';

function App() {
    return (
        <Routes>
            {/* Public routes */}
            <Route path="/" element={<PublicRoute><Landing /></PublicRoute>} />

            {/* Redirect old login/signup routes to landing page */}
            <Route path="/login" element={<Navigate to="/" replace />} />
            <Route path="/signup" element={<Navigate to="/" replace />} />

            {/* Protected routes */}
            <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="expenses" element={<Expenses />} />
                <Route path="expenses/new" element={<NewExpense />} />
                <Route path="expenses/:id" element={<ExpenseDetail />} />
                <Route path="approvals" element={<Approvals />} />
                <Route path="settings" element={<Settings />} />
            </Route>

            {/* Catch all - redirect to landing page */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

export default App;
