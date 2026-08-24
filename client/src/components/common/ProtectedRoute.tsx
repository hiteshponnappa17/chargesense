import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Spinner } from '@/components/ui/Spinner';
import type { Role } from '@/types';

function FullScreenLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface">
      <div className="flex flex-col items-center gap-3 text-muted">
        <Spinner className="h-6 w-6 text-brand-600" />
        <p className="text-sm">Loading ChargeSense…</p>
      </div>
    </div>
  );
}

/** Requires an authenticated session. Optionally restricts to a role. */
export function ProtectedRoute({ role }: { role?: Role }) {
  const { isAuthenticated, initializing, user } = useAuth();
  const location = useLocation();

  if (initializing) return <FullScreenLoader />;
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;

  if (role && user?.role !== role) {
    // Signed in but wrong role — send them to their own home.
    const home = user?.role === 'host' ? '/host' : '/app';
    return <Navigate to={home} replace />;
  }

  return <Outlet />;
}
