import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type BadgeTone = 'green' | 'blue' | 'amber' | 'red' | 'slate' | 'violet';

const TONES: Record<BadgeTone, string> = {
  green: 'bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-600/20',
  blue: 'bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-600/20',
  amber: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20',
  red: 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20',
  slate: 'bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-500/20',
  violet: 'bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-600/20',
};

interface BadgeProps {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
  icon?: ReactNode;
}

export function Badge({ tone = 'slate', children, className, icon }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
        TONES[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}
