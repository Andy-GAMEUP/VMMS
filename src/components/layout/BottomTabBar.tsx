import { useNavigate, useLocation } from 'react-router-dom';
import { clsx } from 'clsx';
import { useNotificationStore } from '@/store/notificationStore';
import { useT } from '@/i18n/useT';

interface Tab {
  path: string;
  labelKey: 'home' | 'machines' | 'messages' | 'my';
  icon: (active: boolean) => React.ReactNode;
}

const tabs: Tab[] = [
  {
    path: '/dashboard',
    labelKey: 'home',
    icon: (active) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}>
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    path: '/machines',
    labelKey: 'machines',
    icon: (active) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}>
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
    labelKey: 'messages',
    icon: (active) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}>
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
      </svg>
    ),
  },
  {
    path: '/my',
    labelKey: 'my',
    icon: (active) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}>
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
];

export function BottomTabBar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const t = useT();

  const isChatDetail = /^\/messages\/.+/.test(pathname);
  if (isChatDetail) return null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t lg:hidden"
      style={{ backgroundColor: 'var(--c-sf)', borderColor: 'var(--c-bd)', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex items-stretch h-16 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const isActive = pathname === tab.path || (tab.path !== '/dashboard' && pathname.startsWith(tab.path));
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={clsx(
                'flex-1 flex flex-col items-center justify-center gap-1 relative transition-colors',
              )}
              style={{ color: isActive ? 'var(--c-pri)' : 'var(--c-tx3)' }}
            >
              {isActive && (
                <span
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[3px] rounded-full"
                  style={{ backgroundColor: 'var(--c-pri)' }}
                />
              )}

              <div className="relative mt-0.5">
                {tab.icon(isActive)}
                {tab.path === '/messages' && unreadCount > 0 && (
                  <span
                    className="absolute -top-1 -right-1.5 w-2 h-2 rounded-full"
                    style={{ backgroundColor: 'var(--c-err)' }}
                  />
                )}
              </div>
              <span className={clsx(
                'text-[11px] leading-none',
                isActive ? 'font-bold' : 'font-medium',
              )}>
                {t.nav[tab.labelKey]}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
