import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { Logo } from '@/components/common/Logo';
import { buttonClasses } from '@/components/ui/Button';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface px-4 text-center">
      <Logo to="/" />
      <div className="mt-10 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
        <Compass className="h-8 w-8" />
      </div>
      <h1 className="mt-6 text-3xl font-bold text-ink">Page not found</h1>
      <p className="mt-2 max-w-sm text-muted">
        The page you’re looking for doesn’t exist or may have moved.
      </p>
      <Link to="/" className={buttonClasses({ variant: 'primary' })}>
        Back to home
      </Link>
    </div>
  );
}
