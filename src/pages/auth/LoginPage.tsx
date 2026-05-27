/**
 * 로그인 페이지
 * - 이메일 + 비밀번호 입력
 * - 모바일 최적화 (375px base)
 */

import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

export default function LoginPage() {
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* 상단 브랜딩 영역 */}
      <div className="flex-1 flex flex-col items-center justify-center px-sp-4 pt-sp-10 pb-sp-6">
        <div className="w-16 h-16 bg-primary-500 rounded-2xl flex items-center justify-center mb-sp-4 shadow-elevated">
          <svg className="w-9 h-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>
        <h1 className="text-heading text-gray-900 font-bold">VMMS</h1>
        <p className="text-body text-gray-500 mt-sp-1">자판기 관리 시스템</p>
      </div>

      {/* 로그인 폼 */}
      <div className="px-sp-4 pb-sp-10">
        <form onSubmit={handleSubmit} className="space-y-sp-4">
          {/* 에러 메시지 */}
          {error && (
            <div className="bg-danger-50 border border-danger-200 rounded-input px-sp-4 py-sp-3 text-sm text-danger-700">
              {error}
              <button
                type="button"
                onClick={clearError}
                className="float-right text-danger-400 hover:text-danger-600"
              >
                ✕
              </button>
            </div>
          )}

          {/* 이메일 */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-sp-1">
              이메일
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@company.com"
              autoComplete="email"
              required
              className="w-full h-12 px-sp-4 border border-gray-300 rounded-input text-body
                         focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                         placeholder:text-gray-400 outline-none transition-colors"
            />
          </div>

          {/* 비밀번호 */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-sp-1">
              비밀번호
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호 입력"
              autoComplete="current-password"
              required
              className="w-full h-12 px-sp-4 border border-gray-300 rounded-input text-body
                         focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                         placeholder:text-gray-400 outline-none transition-colors"
            />
          </div>

          {/* 자동로그인 */}
          <label className="flex items-center gap-sp-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-[18px] h-[18px] rounded border-gray-300 text-primary-500
                         focus:ring-primary-500 focus:ring-offset-0 cursor-pointer"
            />
            <span className="text-sm text-gray-600">자동로그인</span>
          </label>

          {/* 로그인 버튼 */}
          <button
            type="submit"
            disabled={submitting || !email || !password}
            className="w-full h-12 bg-primary-500 text-white font-semibold rounded-button
                       hover:bg-primary-600 active:bg-primary-700
                       disabled:bg-gray-300 disabled:cursor-not-allowed
                       transition-colors flex items-center justify-center min-h-touch"
          >
            {submitting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              '로그인'
            )}
          </button>

          {/* 회원가입 링크 */}
          <p className="text-center text-sm text-gray-500 pt-sp-2">
            계정이 없으신가요?{' '}
            <Link to="/register" className="text-primary-500 font-medium hover:text-primary-600">
              회원가입
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
