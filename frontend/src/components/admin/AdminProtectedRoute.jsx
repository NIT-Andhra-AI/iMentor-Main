// frontend/src/components/admin/AdminProtectedRoute.jsx
import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAppState } from '../../contexts/AppStateContext.jsx';
import { useAuth } from '../../hooks/useAuth.jsx';
import toast from 'react-hot-toast';

function AdminProtectedRoute({ children }) {
    const { isAdminSessionActive } = useAppState();
    const { user } = useAuth();
    const location = useLocation();

    if (!isAdminSessionActive && !user?.isAdmin) {
        toast.error("Admin access required. Please log in as admin.");
        return <Navigate to="/" state={{ from: location }} replace />;
    }

    return children ? children : <Outlet />;
}

export default AdminProtectedRoute;
