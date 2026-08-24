import type { LucideIcon } from 'lucide-react';
import { LogOut } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { Logo } from '@/components/common/Logo';
import { cn } from '@/lib/cn';
import { initials } from '@/lib/format';
import type { User } from '@/types';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

interface SidebarProps {
  items: NavItem[];
  homeHref: string;
  user: User | null;
  roleLabel: string;
  onLogout: () => void;
  onNavigate?: () => void;
}

export function Sidebar({ items, homeHref, user, roleLabel, onLogout, onNavigate }: SidebarProps) {
  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex h-16 items-center border-b border-line px-6">
        <Logo to={homeHref} />
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {items.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
                isActive
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-muted hover:bg-slate-50 hover:text-ink',
              )
            }
          >
            <Icon className="h-5 w-5 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-line p-4">
        <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-white">
            {initials(user?.name ?? '?')}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-ink">{user?.name}</p>
            <p className="truncate text-xs text-muted">{roleLabel}</p>
          </div>
          <button
            type="button"
            onClick={onLogout}
            title="Sign out"
            className="rounded-lg p-2 text-muted transition hover:bg-white hover:text-red-600"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
