import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, roles }) => {
    const { user, role, loading } = useAuth();

    if (loading) return null;

    if (!user) {
        return <Navigate to="/login" />;
    }

    if (roles && !roles.includes(role)) {
        return <Navigate to="/" />;
    }

    return children;
};

export default ProtectedRoute;
