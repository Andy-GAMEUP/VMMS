import { useNavigate, useLocation } from 'react-router-dom';
import { useNotificationStore } from '@/store/notificationStore';
import { useThemeStore } from '@/store/themeStore';
import { useMachines } from '@/hooks/useMachines';
import { resolveDeviceStatus } from '@/types';
import { useT } from '@/i18n/useT';

export function Header() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const { theme, toggleTheme } = useThemeStore();
  const { data: machines } = useMachines();
  const t = useT();

  const TITLES: Record<string, string> = {
    '/dashboard': t.header.vmms,
    '/machines': t.header.machines,
    '/messages': t.header.messages,
    '/products': t.header.products,
    '/products/new': t.header.newProducts,
    '/my': t.header.my,
    '/sales': t.header.sales,
  };

  const isSubPage = pathname.split('/').filter(Boolean).length > 1 && !TITLES[pathname];
  const title = TITLES[pathname] || t.header.details;

  const devTotal = machines?.length ?? 0;
  const devCounts = (machines ?? []).reduce(
    (acc, m) => {
      const s = resolveDeviceStatus(m.funStatus, m.lineStatus);
      if (s === 'offline') acc.err++;
      else if (m.hasLowStock) acc.warn++;
      else acc.ok++;
      return acc;
    },
    { ok: 0, err: 0, warn: 0 },
  );

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 h-header flex items-center px-sp-4 gap-sp-3 border-b"
      style={{ backgroundColor: 'var(--c-sf)', borderColor: 'var(--c-bd)' }}
    >
      {isSubPage && (
        <button onClick={() => navigate(-1)} className="touch-target -ml-2" aria-label="Back">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
      )}

      <h1 className="text-heading flex-1 truncate" style={{ color: 'var(--c-tx1)' }}>{title}</h1>

      {devTotal > 0 && (
        <div className="flex items-center gap-2 text-[11px] font-semibold" style={{ color: 'var(--c-tx2)' }}>
          <span className="hidden sm:inline">{t.header.total} {devTotal}</span>
          <span className="flex items-center gap-1">
            <span className="w-[7px] h-[7px] rounded-full" style={{ backgroundColor: 'var(--c-ok)' }} />
            {devCounts.ok}
          </span>
          <span className="flex items-center gap-1">
            <span className="w-[7px] h-[7px] rounded-full" style={{ backgroundColor: 'var(--c-err)' }} />
            {devCounts.err}
          </span>
          <span className="flex items-center gap-1">
            <span className="w-[7px] h-[7px] rounded-full" style={{ backgroundColor: 'var(--c-warn)' }} />
            {devCounts.warn}
          </span>
        </div>
      )}

      <button onClick={toggleTheme} className="touch-target" aria-label="Theme">
        {theme === 'light' ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="5" />
            <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
          </svg>
        )}
      </button>

      <button onClick={() => navigate('/messages')} className="touch-target relative" aria-label="Notifications">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 01-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'var(--c-err)' }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
    </header>
  );
}
