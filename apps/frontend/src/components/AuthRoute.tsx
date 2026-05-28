import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

export function AuthRoute() {
  const { accessToken, isAuthLoading } = useAuthStore();

  if (isAuthLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (accessToken) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
