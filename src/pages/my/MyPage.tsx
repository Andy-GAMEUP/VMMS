import { useAuthStore } from '@/store/authStore';
import { useNavigate } from 'react-router-dom';
import { ROLE_PERMISSIONS } from '@/types/auth';

export default function MyPage() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const roleLabel = user?.role ? ROLE_PERMISSIONS[user.role]?.label : '';

  return (
    <div className="space-y-sp-4 py-sp-4">
      {/* 프로필 */}
      <div className="card flex items-center gap-sp-4">
        <div className="w-14 h-14 rounded-full bg-primary-100 flex items-center justify-center">
          <span className="text-heading-lg text-primary-500">
            {user?.name?.charAt(0) || '?'}
          </span>
        </div>
        <div>
          <p className="text-heading">{user?.name || '사용자'}</p>
          <p className="text-caption text-gray-500">
            {user?.deptName || '부서 미지정'}
            {roleLabel && <span className="ml-sp-2 text-primary-500">({roleLabel})</span>}
          </p>
          <p className="text-meta text-gray-400 mt-0.5">{user?.email}</p>
        </div>
      </div>

      {/* 메뉴 */}
      <div className="card divide-y divide-gray-100">
        {[
          { icon: '👤', label: '내 정보 수정' },
          { icon: '🔔', label: '알림 설정' },
          { icon: '🌐', label: '언어 설정' },
          { icon: 'ℹ️', label: '앱 정보', sub: 'v0.1.0' },
        ].map((item) => (
          <button
            key={item.label}
            className="flex items-center gap-sp-3 py-sp-3 w-full text-left touch-target"
          >
            <span className="text-lg">{item.icon}</span>
            <span className="text-body flex-1">{item.label}</span>
            {item.sub && <span className="text-meta text-gray-400">{item.sub}</span>}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        ))}
      </div>

      {/* 로그아웃 */}
      <button
        onClick={handleLogout}
        className="w-full py-sp-3 text-center text-danger-500 text-title card"
      >
        로그아웃
      </button>
    </div>
  );
}
