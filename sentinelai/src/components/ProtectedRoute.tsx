import { Navigate, Outlet } from 'react-router-dom';
import { getAuthToken } from '@/services/authApi';

export default function ProtectedRoute() {
  const token = getAuthToken();

  if (!token) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
