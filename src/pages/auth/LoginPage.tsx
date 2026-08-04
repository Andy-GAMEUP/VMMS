import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useT } from '@/i18n/useT';

export default function LoginPage() {
  const t = useT();
  const navigate = useNavigate();
  const { login, error, clearError, isLoading, rememberMe: savedRememberMe } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(savedRememberMe);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setSubmitting(true);
    try {
      await login({ email, password, rememberMe });
      navigate('/dashboard', { replace: true });
    } catch {
      // error는 store에서 관리
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--c-bg)' }}>
        <div className="w-8 h-8 border-3 rounded-full animate-spin" style={{ borderColor: 'var(--c-pri)', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(180deg, var(--c-pri) 0%, #1a4abf 100%)' }}>
      <div className="flex-none flex flex-col items-center justify-center pt-20 pb-10">
        <div className="w-20 h-20 bg-white/20 backdrop-blur rounded-3xl flex items-center justify-center mb-4 shadow-lg">
          <svg className="w-11 h-11 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-wider">VMMS</h1>
        <p className="text-sm text-white/80 mt-1">{t.auth.subtitle}</p>
      </div>

      <div className="flex-1 rounded-t-3xl px-6 pt-8 pb-10 shadow-xl" style={{ backgroundColor: 'var(--c-sf)' }}>
        <h2 className="text-xl font-bold mb-6" style={{ color: 'var(--c-tx1)' }}>{t.auth.login}</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg px-4 py-3 text-sm flex items-center justify-between" style={{ backgroundColor: 'color-mix(in srgb, var(--c-err) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--c-err) 25%, transparent)', color: 'var(--c-err)' }}>
              <span>{error}</span>
              <button type="button" onClick={clearError} className="ml-2 opacity-60 hover:opacity-100">
                ✕
              </button>
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-[13px] font-semibold mb-1" style={{ color: 'var(--c-tx2)' }}>
              {t.auth.email}
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              autoComplete="email"
              required
              className="w-full h-12 px-4 border-[1.5px] rounded-lg text-[14px] outline-none transition-all"
              style={{
                borderColor: 'var(--c-bd)',
                backgroundColor: 'var(--c-bg)',
                color: 'var(--c-tx1)',
              }}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-[13px] font-semibold mb-1" style={{ color: 'var(--c-tx2)' }}>
              {t.auth.password}
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호 입력"
              autoComplete="current-password"
              required
              className="w-full h-12 px-4 border-[1.5px] rounded-lg text-[14px] outline-none transition-all"
              style={{
                borderColor: 'var(--c-bd)',
                backgroundColor: 'var(--c-bg)',
                color: 'var(--c-tx1)',
              }}
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-[18px] h-[18px] rounded cursor-pointer"
              style={{ accentColor: 'var(--c-pri)' }}
            />
            <span className="text-[13px]" style={{ color: 'var(--c-tx2)' }}>{t.auth.rememberMe}</span>
          </label>

          <button
            type="submit"
            disabled={submitting || !email || !password}
            className="w-full h-12 rounded-lg font-semibold text-[15px] transition-all
                       flex items-center justify-center
                       disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ marginTop: '8px', backgroundColor: 'var(--c-pri)', color: '#fff' }}
          >
            {submitting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              t.auth.login
            )}
          </button>

          <p className="text-center text-[13px] pt-4" style={{ color: 'var(--c-tx3)' }}>
            {t.auth.noAccount}{' '}
            <Link to="/register" className="font-semibold hover:underline" style={{ color: 'var(--c-pri)' }}>
              {t.auth.signUp}
            </Link>
          </p>
        </form>

        {import.meta.env.DEV && (
          <div className="mt-6 pt-4" style={{ borderTop: '1px dashed var(--c-bd)' }}>
            <p className="text-[11px] text-center mb-3" style={{ color: 'var(--c-tx3)' }}>DEV — 테스트 계정 빠른 로그인</p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={submitting}
                onClick={() => { setEmail('admin@vmms.local'); setPassword('admin123'); }}
                className="flex-1 h-9 rounded-lg text-[12px] font-medium transition-all"
                style={{ border: '1px solid var(--c-bd)', backgroundColor: 'var(--c-bg)', color: 'var(--c-tx2)' }}
              >
                Admin
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => { setEmail('test@vmms.local'); setPassword('test1234'); }}
                className="flex-1 h-9 rounded-lg text-[12px] font-medium transition-all"
                style={{ border: '1px solid var(--c-bd)', backgroundColor: 'var(--c-bg)', color: 'var(--c-tx2)' }}
              >
                Manager
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
