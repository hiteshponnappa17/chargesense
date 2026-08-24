import { Outlet } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { Logo } from '@/components/common/Logo';

const HIGHLIGHTS = [
  'Find nearby EV chargers on a live map',
  'Fair, first-come-first-served slot booking',
  'Transparent energy, time & cost estimates',
  'Hosts earn by sharing their charger',
];

export function AuthLayout() {
  return (
    <div className="flex min-h-screen bg-surface">
      {/* Brand panel */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-ink p-12 text-white lg:flex">
        <div
          className="absolute inset-0 opacity-90"
          style={{
            background:
              'radial-gradient(1200px 600px at 20% 10%, rgba(22,163,74,0.35), transparent 60%), radial-gradient(900px 500px at 90% 90%, rgba(16,185,129,0.25), transparent 55%)',
          }}
        />
        <div className="relative">
          <Logo to="/" withText className="text-white [&_span]:text-white" />
        </div>
        <div className="relative">
          <h2 className="max-w-md text-4xl font-bold leading-tight">
            Charge anywhere.
            <br />
            Share everywhere.
          </h2>
          <p className="mt-4 max-w-md text-white/70">
            ChargeSense connects EV drivers with hosts who share their chargers — booked fairly,
            priced transparently.
          </p>
          <ul className="mt-8 space-y-3">
            {HIGHLIGHTS.map((h) => (
              <li key={h} className="flex items-center gap-3 text-sm text-white/90">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-brand-400" />
                {h}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-white/50">© 2026 ChargeSense · Mysuru, India</p>
      </div>

      {/* Form area */}
      <div className="flex w-full flex-col items-center justify-center px-4 py-10 lg:w-1/2 sm:px-8">
        <div className="mb-8 lg:hidden">
          <Logo to="/" />
        </div>
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
