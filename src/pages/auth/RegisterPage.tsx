/**
 * 회원가입 페이지
 * - 이메일, 비밀번호, 이름, 전화번호, 부서 선택
 * - 가입 후 pending 상태 → admin 승인 대기
 */

import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '@/api/auth';
import { apiGet } from '@/api/client';
import type { XzyDeptVO } from '@/types/auth';

interface DeptOption {
  deptId: number;
  deptName: string;
}

export default function RegisterPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: '',
    password: '',
    passwordConfirm: '',
    name: '',
    phone: '',
    deptId: '',
  });
  const [departments, setDepartments] = useState<DeptOption[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // 부서 목록 로드
  useEffect(() => {
    apiGet<XzyDeptVO[]>('/departments')
      .then((depts) => {
        setDepartments(
          depts
            .filter((d) => d.status === '0' && d.delFlag === '0')
            .map((d) => ({ deptId: d.deptId, deptName: d.deptName })),
        );
      })
      .catch(() => {
        // 부서 목록 로드 실패 시 수동 입력 가능
      });
  }, []);

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const validate = (): string | null => {
    if (!form.email || !form.password || !form.name || !form.phone) {
      return '모든 필수 항목을 입력해주세요.';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      return '올바른 이메일 형식을 입력해주세요.';
    }
    if (form.password.length < 6) {
      return '비밀번호는 6자 이상이어야 합니다.';
    }
    if (form.password !== form.passwordConfirm) {
      return '비밀번호가 일치하지 않습니다.';
    }
    if (!/^\d{10,11}$/.test(form.phone)) {
      return '전화번호는 10~11자리 숫자로 입력해주세요.';
    }
    if (!form.deptId) {
      return '소속 부서를 선택해주세요.';
    }
    return null;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) {
      setError(err);
      return;
    }

    setSubmitting(true);
    try {
      await register({
        email: form.email,
        password: form.password,
        name: form.name,
        phone: form.phone,
        deptId: Number(form.deptId),
      });
      navigate('/register/complete', { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : '회원가입에 실패했습니다.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* 헤더 */}
      <header className="h-[var(--header-h)] flex items-center px-sp-4 bg-white border-b border-gray-100">
        <Link to="/login" className="touch-target text-gray-500">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-lg font-semibold text-gray-900 ml-sp-2">회원가입</h1>
      </header>

      {/* 폼 */}
      <div className="flex-1 px-sp-4 py-sp-6">
        <form onSubmit={handleSubmit} className="space-y-sp-4">
          {/* 에러 */}
          {error && (
            <div className="bg-danger-50 border border-danger-200 rounded-input px-sp-4 py-sp-3 text-sm text-danger-700">
              {error}
            </div>
          )}

          {/* 이메일 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-sp-1">
              이메일 <span className="text-danger-500">*</span>
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => updateField('email', e.target.value)}
              placeholder="example@company.com"
              autoComplete="email"
              className="w-full h-12 px-sp-4 border border-gray-300 rounded-input text-body
                         focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                         placeholder:text-gray-400 outline-none transition-colors"
            />
          </div>

          {/* 이름 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-sp-1">
              이름 <span className="text-danger-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="홍길동"
              autoComplete="name"
              className="w-full h-12 px-sp-4 border border-gray-300 rounded-input text-body
                         focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                         placeholder:text-gray-400 outline-none transition-colors"
            />
          </div>

          {/* 전화번호 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-sp-1">
              전화번호 <span className="text-danger-500">*</span>
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => updateField('phone', e.target.value.replace(/\D/g, ''))}
              placeholder="01012345678"
              autoComplete="tel"
              maxLength={11}
              className="w-full h-12 px-sp-4 border border-gray-300 rounded-input text-body
                         focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                         placeholder:text-gray-400 outline-none transition-colors"
            />
          </div>

          {/* 비밀번호 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-sp-1">
              비밀번호 <span className="text-danger-500">*</span>
            </label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => updateField('password', e.target.value)}
              placeholder="6자 이상"
              autoComplete="new-password"
              className="w-full h-12 px-sp-4 border border-gray-300 rounded-input text-body
                         focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                         placeholder:text-gray-400 outline-none transition-colors"
            />
          </div>

          {/* 비밀번호 확인 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-sp-1">
              비밀번호 확인 <span className="text-danger-500">*</span>
            </label>
            <input
              type="password"
              value={form.passwordConfirm}
              onChange={(e) => updateField('passwordConfirm', e.target.value)}
              placeholder="비밀번호 재입력"
              autoComplete="new-password"
              className="w-full h-12 px-sp-4 border border-gray-300 rounded-input text-body
                         focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                         placeholder:text-gray-400 outline-none transition-colors"
            />
            {form.passwordConfirm && form.password !== form.passwordConfirm && (
              <p className="text-xs text-danger-500 mt-sp-1">비밀번호가 일치하지 않습니다.</p>
            )}
          </div>

          {/* 소속 부서 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-sp-1">
              소속 부서 <span className="text-danger-500">*</span>
            </label>
            {departments.length > 0 ? (
              <select
                value={form.deptId}
                onChange={(e) => updateField('deptId', e.target.value)}
                className="w-full h-12 px-sp-4 border border-gray-300 rounded-input text-body
                           focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                           bg-white outline-none transition-colors appearance-none"
              >
                <option value="">부서를 선택하세요</option>
                {departments.map((d) => (
                  <option key={d.deptId} value={d.deptId}>
                    {d.deptName}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="number"
                value={form.deptId}
                onChange={(e) => updateField('deptId', e.target.value)}
                placeholder="부서 ID 입력"
                className="w-full h-12 px-sp-4 border border-gray-300 rounded-input text-body
                           focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                           placeholder:text-gray-400 outline-none transition-colors"
              />
            )}
          </div>

          {/* 가입 버튼 */}
          <div className="pt-sp-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full h-12 bg-primary-500 text-white font-semibold rounded-button
                         hover:bg-primary-600 active:bg-primary-700
                         disabled:bg-gray-300 disabled:cursor-not-allowed
                         transition-colors flex items-center justify-center min-h-touch"
            >
              {submitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                '가입 신청'
              )}
            </button>
          </div>

          <p className="text-center text-sm text-gray-500">
            이미 계정이 있으신가요?{' '}
            <Link to="/login" className="text-primary-500 font-medium hover:text-primary-600">
              로그인
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
