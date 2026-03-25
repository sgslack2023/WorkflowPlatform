import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const ProtectedRoute = () => {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const location = useLocation();

    if (!isAuthenticated) {
        // Redirect them to the /login page, but save the current location they were
        // trying to go to when they were redirected. This allows us to send them
        // along to that page after they login, which is a nicer user experience.
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
