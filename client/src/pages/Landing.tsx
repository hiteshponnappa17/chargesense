import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BatteryCharging,
  CalendarClock,
  Gauge,
  MapPin,
  ShieldCheck,
  Wallet,
  Zap,
} from 'lucide-react';
import { Logo } from '@/components/common/Logo';
import { buttonClasses } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/cn';

const FEATURES = [
  {
    icon: MapPin,
    title: 'Discover nearby chargers',
    body: 'Browse a live map and rich cards of hosted chargers around you, filtered by connector, speed and price.',
  },
  {
    icon: CalendarClock,
    title: 'Fair FCFS booking',
    body: 'Slots are confirmed strictly first-come, first-served. No double-booking, ever — with clear conflict handling.',
  },
  {
    icon: Gauge,
    title: 'Know before you go',
    body: 'Transparent estimates for energy, charging time and cost based on your EV and battery target.',
  },
  {
    icon: Wallet,
    title: 'Hosts earn effortlessly',
    body: 'List your charger, set your price and availability, and track bookings and earnings on a clean dashboard.',
  },
];

const STEPS = [
  { n: '01', title: 'Find a charger', body: 'Search the map for a charger that fits your car and route.' },
  { n: '02', title: 'Estimate & reserve', body: 'Pick your battery target, review the estimate, and grab a slot.' },
  { n: '03', title: 'Charge & go', body: 'Arrive at your confirmed time and plug in. That’s it.' },
];

export default function Landing() {
  const { isAuthenticated, user } = useAuth();
  const home = user?.role === 'host' ? '/host' : '/app';

  return (
    <div className="min-h-screen bg-surface">
      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-line bg-surface/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Logo to="/" />
          <nav className="flex items-center gap-2">
            {isAuthenticated ? (
              <Link to={home} className={buttonClasses({ variant: 'primary', size: 'sm' })}>
                Go to dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" className={buttonClasses({ variant: 'ghost', size: 'sm' })}>
                  Log in
                </Link>
                <Link to="/register" className={buttonClasses({ variant: 'primary', size: 'sm' })}>
                  Get started
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(800px 400px at 15% -10%, rgba(22,163,74,0.12), transparent 60%), radial-gradient(700px 400px at 100% 0%, rgba(14,165,233,0.10), transparent 55%)',
          }}
        />
        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-3 py-1 text-xs font-medium text-muted shadow-sm">
              <span className="flex h-2 w-2 rounded-full bg-brand-500" />
              Peer-to-peer EV charging · Mysuru
            </span>
            <h1 className="mt-6 text-4xl font-bold tracking-tight text-ink sm:text-6xl">
              Charging that’s
              <span className="text-brand-600"> shared, </span>
              simple and fair.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted">
              ChargeSense connects EV drivers with people who share their chargers. Find a spot,
              see the real cost up front, and book a slot that’s yours — guaranteed.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/register"
                className={cn(buttonClasses({ variant: 'primary', size: 'lg' }), 'gap-2')}
              >
                Start charging <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/login" className={buttonClasses({ variant: 'outline', size: 'lg' })}>
                I have an account
              </Link>
            </div>
            <p className="mt-4 text-xs text-muted">
              Try the demo — driver@example.com / host@example.com · password123
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 pb-8 sm:px-6 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-2xl border border-line bg-white p-6 shadow-card">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-base font-semibold text-ink">{title}</h3>
              <p className="mt-1.5 text-sm text-muted">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-ink">Three steps to a full battery</h2>
          <p className="mx-auto mt-3 max-w-xl text-muted">
            No apps to juggle, no guessing games. Just find, book and charge.
          </p>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.n} className="relative rounded-2xl border border-line bg-white p-6 shadow-card">
              <span className="text-sm font-bold text-brand-600">{s.n}</span>
              <h3 className="mt-2 text-lg font-semibold text-ink">{s.title}</h3>
              <p className="mt-1.5 text-sm text-muted">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-ink px-8 py-14 text-center text-white">
          <div
            className="pointer-events-none absolute inset-0 opacity-80"
            style={{
              background:
                'radial-gradient(600px 300px at 20% 20%, rgba(22,163,74,0.4), transparent 60%), radial-gradient(500px 300px at 90% 90%, rgba(16,185,129,0.25), transparent 55%)',
            }}
          />
          <div className="relative">
            <BatteryCharging className="mx-auto h-10 w-10 text-brand-400" />
            <h2 className="mt-4 text-3xl font-bold">Ready to plug in?</h2>
            <p className="mx-auto mt-3 max-w-lg text-white/70">
              Join ChargeSense today — whether you’re driving electric or sharing your charger.
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/register"
                className={cn(buttonClasses({ variant: 'primary', size: 'lg' }), 'gap-2')}
              >
                Create your account <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-white/60">
              <span className="inline-flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" /> No double-booking
              </span>
              <span className="inline-flex items-center gap-2">
                <Zap className="h-4 w-4" /> Transparent pricing
              </span>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-line py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 sm:flex-row sm:px-6 lg:px-8">
          <Logo to="/" size="sm" />
          <p className="text-xs text-muted">© 2026 ChargeSense · Built for EV drivers in Mysuru, India</p>
        </div>
      </footer>
    </div>
  );
}
