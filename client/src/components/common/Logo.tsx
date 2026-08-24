import { Link } from 'react-router-dom';
import { Zap } from 'lucide-react';
import { cn } from '@/lib/cn';

interface LogoProps {
  to?: string;
  withText?: boolean;
  className?: string;
  size?: 'sm' | 'md';
}

export function Logo({ to = '/', withText = true, className, size = 'md' }: LogoProps) {
  const box = size === 'sm' ? 'h-8 w-8' : 'h-9 w-9';
  const icon = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';
  const content = (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <span
        className={cn(
          'flex items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm',
          box,
        )}
      >
        <Zap className={cn('fill-white', icon)} />
      </span>
      {withText && (
        <span className="text-lg font-bold tracking-tight text-ink">
          Charge<span className="text-brand-600">Sense</span>
        </span>
      )}
    </span>
  );
  return to ? (
    <Link to={to} className="inline-flex focus-visible:outline-none">
      {content}
    </Link>
  ) : (
    content
  );
}
