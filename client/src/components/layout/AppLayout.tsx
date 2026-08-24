import { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  CalendarCheck,
  CalendarRange,
  LayoutDashboard,
  MapPin,
  PlugZap,
  User as UserIcon,
} from 'lucide-react';
import { Sidebar, type NavItem } from './Sidebar';
import { Topbar } from './Topbar';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/cn';

const DRIVER_NAV: NavItem[] = [
  { to: '/app', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/app/chargers', label: 'Find chargers', icon: MapPin },
  { to: '/app/bookings', label: 'My bookings', icon: CalendarCheck },
  { to: '/app/profile', label: 'Profile', icon: UserIcon },
];

const HOST_NAV: NavItem[] = [
  { to: '/host', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/host/chargers', label: 'My chargers', icon: PlugZap },
  { to: '/host/bookings', label: 'Bookings', icon: CalendarRange },
  { to: '/host/profile', label: 'Profile', icon: UserIcon },
];

export function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const isHost = user?.role === 'host';
  const items = isHost ? HOST_NAV : DRIVER_NAV;
  const homeHref = isHost ? '/host' : '/app';
  const roleLabel = isHost ? 'Host account' : 'Driver account';

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-surface">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-line lg:block">
        <Sidebar
          items={items}
          homeHref={homeHref}
          user={user}
          roleLabel={roleLabel}
          onLogout={handleLogout}
        />
      </aside>

      {/* Mobile drawer */}
      <div className={cn('lg:hidden', drawerOpen ? 'pointer-events-auto' : 'pointer-events-none')}>
        <div
          className={cn(
            'fixed inset-0 z-40 bg-ink/40 transition-opacity',
            drawerOpen ? 'opacity-100' : 'opacity-0',
          )}
          onClick={() => setDrawerOpen(false)}
        />
        <aside
          className={cn(
            'fixed inset-y-0 left-0 z-50 w-72 max-w-[80%] shadow-panel transition-transform duration-200',
            drawerOpen ? 'translate-x-0' : '-translate-x-full',
          )}
        >
          <Sidebar
            items={items}
            homeHref={homeHref}
            user={user}
            roleLabel={roleLabel}
            onLogout={handleLogout}
            onNavigate={() => setDrawerOpen(false)}
          />
        </aside>
      </div>

      <div className="lg:pl-64">
        <Topbar onOpenSidebar={() => setDrawerOpen(true)} user={user} homeHref={homeHref} />
        <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
