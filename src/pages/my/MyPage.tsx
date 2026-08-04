import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useNavigate } from 'react-router-dom';
import { ROLE_PERMISSIONS } from '@/types/auth';
import { useThemeStore } from '@/store/themeStore';
import { useLangStore, type Lang } from '@/store/langStore';
import { useT } from '@/i18n/useT';

const LANG_OPTIONS: { value: Lang; label: string }[] = [
  { value: 'ko', label: '한국어' },
  { value: 'en', label: 'English' },
];

export default function MyPage() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const { theme, toggleTheme } = useThemeStore();
  const { lang, setLang } = useLangStore();
  const t = useT();
  const [langOpen, setLangOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const roleLabel = user?.role ? ROLE_PERMISSIONS[user.role]?.label : '';
  const isAdmin = user?.role === 'admin';

  const menuItems = [
    {
      label: t.my.editProfile,
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>,
    },
    {
      label: t.my.notificationSettings,
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 01-3.46 0" /></svg>,
    },
    {
      label: theme === 'light' ? t.common.darkMode : t.common.lightMode,
      icon: theme === 'light' ? (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" /></svg>
      ) : (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></svg>
      ),
      onClick: toggleTheme,
    },
    {
      label: t.my.language,
      sub: t.langLabel[lang],
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" /></svg>,
      onClick: () => setLangOpen(true),
    },
    {
      label: t.my.appInfo,
      sub: 'v0.1.0',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>,
    },
  ];

  return (
    <div className="space-y-sp-4 py-sp-4 max-w-[480px] lg:mx-auto">
      {/* Profile */}
      <div className="card flex items-center gap-sp-4">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center"
          style={{ backgroundColor: 'var(--c-pri-lt)', color: 'var(--c-pri)' }}
        >
          <span className="text-heading-lg">{user?.name?.charAt(0) || '?'}</span>
        </div>
        <div>
          <p className="text-heading" style={{ color: 'var(--c-tx1)' }}>{user?.name || t.my.user}</p>
          <p className="text-caption" style={{ color: 'var(--c-tx2)' }}>
            {user?.deptName || t.my.noDepartment}
            {roleLabel && <span className="ml-sp-2" style={{ color: 'var(--c-pri)' }}>({roleLabel})</span>}
          </p>
          <p className="text-meta mt-0.5" style={{ color: 'var(--c-tx3)' }}>{user?.email}</p>
        </div>
      </div>

      {/* Admin menu */}
      {isAdmin && (
        <div className="card">
          <button
            onClick={() => navigate('/admin/users')}
            className="flex items-center gap-sp-3 py-sp-3 w-full text-left touch-target"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--c-pri)" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
            </svg>
            <span className="text-body flex-1 font-semibold" style={{ color: 'var(--c-pri)' }}>{t.my.userManagement}</span>
            <span className="text-meta" style={{ color: 'var(--c-tx3)' }}>{t.my.adminOnly}</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--c-pri)" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
          </button>
        </div>
      )}

      {/* General menu */}
      <div className="card" style={{ borderColor: 'var(--c-bd2)' }}>
        {menuItems.map((item, i) => (
          <button
            key={i}
            onClick={item.onClick}
            className="flex items-center gap-sp-3 py-sp-3 w-full text-left touch-target"
            style={i < menuItems.length - 1 ? { borderBottom: '1px solid var(--c-bd2)' } : undefined}
          >
            <span style={{ color: 'var(--c-tx2)' }}>{item.icon}</span>
            <span className="text-body flex-1" style={{ color: 'var(--c-tx1)' }}>{item.label}</span>
            {item.sub && <span className="text-meta" style={{ color: 'var(--c-tx3)' }}>{item.sub}</span>}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--c-tx3)" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
          </button>
        ))}
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full py-sp-3 text-center text-title card"
        style={{ color: 'var(--c-err)' }}
      >
        {t.common.logout}
      </button>

      {/* Language picker modal */}
      {langOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center" onClick={() => setLangOpen(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative rounded-2xl p-sp-5 w-[300px] space-y-sp-3"
            style={{ backgroundColor: 'var(--c-sf)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-heading text-center" style={{ color: 'var(--c-tx1)' }}>{t.my.language}</h3>
            <div className="space-y-sp-2">
              {LANG_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => { setLang(opt.value); setLangOpen(false); }}
                  className="flex items-center gap-sp-3 w-full px-sp-4 py-sp-3 rounded-xl transition-colors"
                  style={{
                    backgroundColor: lang === opt.value ? 'var(--c-pri-lt)' : 'transparent',
                    color: lang === opt.value ? 'var(--c-pri)' : 'var(--c-tx1)',
                  }}
                >
                  <span className="flex-1 text-left font-medium">{opt.label}</span>
                  {lang === opt.value && (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--c-pri)" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
            <button
              onClick={() => setLangOpen(false)}
              className="w-full py-sp-2 text-center text-body rounded-xl"
              style={{ color: 'var(--c-tx2)', backgroundColor: 'var(--c-page-bg)' }}
            >
              {t.common.cancel}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
