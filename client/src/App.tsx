import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { useAuth } from '@/hooks/useAuth';

import Landing from '@/pages/Landing';
import Login from '@/pages/auth/Login';
import Register from '@/pages/auth/Register';
import Profile from '@/pages/Profile';
import NotFound from '@/pages/NotFound';

import Dashboard from '@/pages/driver/Dashboard';
import Chargers from '@/pages/driver/Chargers';
import ChargerDetail from '@/pages/driver/ChargerDetail';
import MyBookings from '@/pages/driver/MyBookings';
import BookingDetail from '@/pages/driver/BookingDetail';
import BookingConfirmation from '@/pages/driver/BookingConfirmation';

import HostDashboard from '@/pages/host/HostDashboard';
import HostChargers from '@/pages/host/HostChargers';
import ChargerForm from '@/pages/host/ChargerForm';
import HostBookings from '@/pages/host/HostBookings';

/** Keeps signed-in users out of the login/register screens. */
function GuestRoute() {
  const { isAuthenticated, initializing, user } = useAuth();
  if (initializing) return null;
  if (isAuthenticated) return <Navigate to={user?.role === 'host' ? '/host' : '/app'} replace />;
  return <Outlet />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />

      {/* Public auth screens */}
      <Route element={<GuestRoute />}>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>
      </Route>

      {/* Driver area */}
      <Route element={<ProtectedRoute role="driver" />}>
        <Route element={<AppLayout />}>
          <Route path="/app" element={<Dashboard />} />
          <Route path="/app/chargers" element={<Chargers />} />
          <Route path="/app/chargers/:id" element={<ChargerDetail />} />
          <Route path="/app/bookings" element={<MyBookings />} />
          <Route path="/app/bookings/:id" element={<BookingDetail />} />
          <Route path="/app/confirmation/:id" element={<BookingConfirmation />} />
          <Route path="/app/profile" element={<Profile />} />
        </Route>
      </Route>

      {/* Host area */}
      <Route element={<ProtectedRoute role="host" />}>
        <Route element={<AppLayout />}>
          <Route path="/host" element={<HostDashboard />} />
          <Route path="/host/chargers" element={<HostChargers />} />
          <Route path="/host/chargers/new" element={<ChargerForm />} />
          <Route path="/host/chargers/:id/edit" element={<ChargerForm />} />
          <Route path="/host/bookings" element={<HostBookings />} />
          <Route path="/host/profile" element={<Profile />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
