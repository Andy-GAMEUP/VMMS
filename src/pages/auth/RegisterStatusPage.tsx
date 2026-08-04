import { Link } from 'react-router-dom';
import { useT } from '@/i18n/useT';

export default function RegisterStatusPage() {
  const t = useT();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-sp-4" style={{ backgroundColor: 'var(--c-bg)' }}>
      <div className="w-20 h-20 rounded-full flex items-center justify-center mb-sp-6" style={{ backgroundColor: 'var(--c-ok)', opacity: 0.12 }}>
        <svg className="w-10 h-10" style={{ color: 'var(--c-ok)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <h1 className="text-xl font-bold mb-sp-2" style={{ color: 'var(--c-tx1)' }}>{t.auth.registerComplete}</h1>
      <p className="text-body text-center max-w-[280px] mb-sp-8 leading-relaxed whitespace-pre-line" style={{ color: 'var(--c-tx2)' }}>
        {t.auth.registerCompleteMessage}
      </p>

      <Link
        to="/login"
        className="w-full max-w-[320px] h-12 font-semibold rounded-button
                   transition-colors flex items-center justify-center min-h-touch"
        style={{ backgroundColor: 'var(--c-pri)', color: '#fff' }}
      >
        {t.auth.goToLogin}
      </Link>
    </div>
  );
}
