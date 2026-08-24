import { Menu } from 'lucide-react';
import { Logo } from '@/components/common/Logo';
import { initials } from '@/lib/format';
import type { User } from '@/types';

interface TopbarProps {
  onOpenSidebar: () => void;
  user: User | null;
  homeHref: string;
}

/** Mobile-only top bar with the drawer toggle. */
export function Topbar({ onOpenSidebar, user, homeHref }: TopbarProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-line bg-white/90 px-4 backdrop-blur lg:hidden">
      <button
        type="button"
        onClick={onOpenSidebar}
        className="rounded-lg p-2 text-muted transition hover:bg-slate-100 hover:text-ink"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>
      <Logo to={homeHref} />
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-xs font-semibold text-white">
        {initials(user?.name ?? '?')}
      </span>
    </header>
  );
}
