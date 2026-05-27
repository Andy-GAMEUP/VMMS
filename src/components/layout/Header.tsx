import { useNavigate, useLocation } from 'react-router-dom';
import { useNotificationStore } from '@/store/notificationStore';

const TITLES: Record<string, string> = {
  '/dashboard': 'VMMS',
  '/machines': '자판기 관리',
  '/messages': '메시지',
  '/my': 'MY',
  '/sales': '매출 현황',
};

export function Header() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const unreadCount = useNotificationStore((s) => s.unreadCount);

  const isSubPage = pathname.split('/').filter(Boolean).length > 1 && !TITLES[pathname];
  const title = TITLES[pathname] || '상세';

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-header bg-white border-b border-gray-200 flex items-center px-sp-4 gap-sp-3">
      {/* 뒤로가기 */}
      {isSubPage && (
        <button onClick={() => navigate(-1)} className="touch-target -ml-2" aria-label="뒤로">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
      )}

      {/* 타이틀 */}
      <h1 className="text-heading flex-1 truncate">{title}</h1>

      {/* 알림 아이콘 */}
      <button onClick={() => navigate('/messages')} className="touch-target relative" aria-label="알림">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 01-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-danger-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
    </header>
  );
}
