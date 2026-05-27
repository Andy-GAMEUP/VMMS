import { useNavigate, useLocation } from 'react-router-dom';
import { clsx } from 'clsx';
import { useNotificationStore } from '@/store/notificationStore';

interface Tab {
  path: string;
  label: string;
  icon: (active: boolean) => React.ReactNode;
}

const tabs: Tab[] = [
  {
    path: '/dashboard',
    label: '홈',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    path: '/machines',
    label: '자판기',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
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
    label: '메시지',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
      </svg>
    ),
  },
  {
    path: '/my',
    label: 'MY',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
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

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 h-bottom-nav bg-white border-t border-gray-200 shadow-bottom-nav safe-bottom">
      <div className="flex items-center justify-around h-full max-w-lg mx-auto">
        {tabs.map((tab) => {
          const isActive = pathname === tab.path || (tab.path !== '/dashboard' && pathname.startsWith(tab.path));
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={clsx(
                'flex flex-col items-center justify-center gap-0.5 touch-target flex-1',
                isActive ? 'text-primary-500' : 'text-gray-400',
              )}
            >
              <div className="relative">
                {tab.icon(isActive)}
                {tab.path === '/messages' && unreadCount > 0 && (
                  <span className="absolute -top-1 -right-2 bg-danger-500 text-white text-[9px] font-bold min-w-[14px] h-3.5 rounded-full flex items-center justify-center px-0.5">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
