import { useNavigate, useLocation } from 'react-router-dom';
import { clsx } from 'clsx';
import { useThemeStore } from '@/store/themeStore';
import { useAuthStore } from '@/store/authStore';
import { useT } from '@/i18n/useT';

const NAV_ITEMS = [
  {
    path: '/dashboard',
    labelKey: 'home' as const,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    path: '/machines',
    labelKey: 'machines' as const,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="4" y="2" width="16" height="20" rx="2" />
        <rect x="8" y="6" width="3" height="3" rx="0.5" />
        <rect x="13" y="6" width="3" height="3" rx="0.5" />
        <rect x="8" y="11" width="3" height="3" rx="0.5" />
        <rect x="13" y="11" width="3" height="3" rx="0.5" />
        <rect x="8" y="17" width="8" height="2" rx="1" />
      </svg>
    ),
  },
  {
    path: '/messages',
    labelKey: 'messages' as const,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
      </svg>
    ),
  },
  {
    path: '/my',
    labelKey: 'my' as const,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
];

export function Sidebar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { theme, toggleTheme } = useThemeStore();
  const logout = useAuthStore((s) => s.logout);
  const t = useT();

  return (
    <aside className="fixed top-0 left-0 bottom-0 w-sidebar z-40 flex flex-col border-r"
      style={{ backgroundColor: 'var(--c-sf)', borderColor: 'var(--c-bd)' }}>
      <div className="h-header flex items-center px-6">
        <span className="text-xl font-extrabold tracking-tight" style={{ color: 'var(--c-pri)' }}>
          VMMS
        </span>
      </div>

      <nav className="flex-1 px-3 py-2 flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.path || (item.path !== '/dashboard' && pathname.startsWith(item.path));
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors w-full text-left',
                isActive
                  ? 'text-pri bg-pri-lt'
                  : 'text-tx2 hover:bg-[var(--c-bd2)]',
              )}
              style={isActive ? { color: 'var(--c-pri)', backgroundColor: 'var(--c-pri-lt)' } : { color: 'var(--c-tx2)' }}
            >
              {item.icon}
              {t.nav[item.labelKey]}
            </button>
          );
        })}
      </nav>

      <div className="px-3 py-4 flex flex-col gap-2 border-t" style={{ borderColor: 'var(--c-bd)' }}>
        <button
          onClick={toggleTheme}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors w-full text-left"
          style={{ color: 'var(--c-tx2)' }}
        >
          {theme === 'light' ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          )}
          {theme === 'light' ? t.common.darkMode : t.common.lightMode}
        </button>

        <button
          onClick={() => { logout(); navigate('/login'); }}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors w-full text-left"
          style={{ color: 'var(--c-err)' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          {t.common.logout}
        </button>
      </div>
    </aside>
  );
}
