import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Car, Lock, Mail, Phone, PlugZap, User } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { errorMessage } from '@/lib/api';
import { cn } from '@/lib/cn';
import type { Role } from '@/types';

const ROLES: { value: Role; label: string; blurb: string; icon: typeof Car }[] = [
  { value: 'driver', label: 'Driver', blurb: 'Find & book chargers', icon: Car },
  { value: 'host', label: 'Host', blurb: 'Share your charger', icon: PlugZap },
];

export default function Register() {
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [role, setRole] = useState<Role>('driver');
  const [submitting, setSubmitting] = useState(false);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const user = await register({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
        role,
      });
      toast.success('Account created', `Welcome to ChargeSense, ${user.name.split(' ')[0]}!`);
      navigate(user.role === 'host' ? '/host' : '/app', { replace: true });
    } catch (err) {
      toast.error('Sign up failed', errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-ink">Create your account</h1>
      <p className="mt-1 text-sm text-muted">Join ChargeSense in less than a minute.</p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <div>
          <span className="label-base">I want to…</span>
          <div className="grid grid-cols-2 gap-3">
            {ROLES.map(({ value, label, blurb, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setRole(value)}
                className={cn(
                  'flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition',
                  role === value
                    ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-500/40'
                    : 'border-line bg-white hover:border-brand-300',
                )}
              >
                <Icon className={cn('h-5 w-5', role === value ? 'text-brand-600' : 'text-muted')} />
                <span className="text-sm font-semibold text-ink">{label}</span>
                <span className="text-xs text-muted">{blurb}</span>
              </button>
            ))}
          </div>
        </div>

        <Input
          label="Full name"
          required
          leftIcon={<User className="h-4 w-4" />}
          placeholder="Asha Rao"
          value={form.name}
          onChange={set('name')}
        />
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          required
          leftIcon={<Mail className="h-4 w-4" />}
          placeholder="you@example.com"
          value={form.email}
          onChange={set('email')}
        />
        <Input
          label="Phone"
          type="tel"
          required
          leftIcon={<Phone className="h-4 w-4" />}
          placeholder="+91 98765 43210"
          value={form.phone}
          onChange={set('phone')}
        />
        <Input
          label="Password"
          type="password"
          autoComplete="new-password"
          required
          minLength={6}
          leftIcon={<Lock className="h-4 w-4" />}
          placeholder="At least 6 characters"
          hint="Use at least 6 characters."
          value={form.password}
          onChange={set('password')}
        />
        <Button type="submit" fullWidth size="lg" loading={submitting}>
          Create account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700">
          Sign in
        </Link>
      </p>
    </div>
  );
}
