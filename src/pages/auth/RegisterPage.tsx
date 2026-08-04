import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '@/api/auth';
import { apiGet } from '@/api/client';
import type { XzyDeptVO, AccountType } from '@/types/auth';
import { useT } from '@/i18n/useT';

interface DeptOption {
  deptId: number;
  deptName: string;
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const t = useT();

  const [accountType, setAccountType] = useState<AccountType | ''>('');
  const [form, setForm] = useState({
    email: '',
    password: '',
    passwordConfirm: '',
    name: '',
    phone: '',
    deptId: '',
    businessName: '',
    parentDeptId: '',
  });
  const [departments, setDepartments] = useState<DeptOption[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    apiGet<XzyDeptVO[]>('/public/departments')
      .then((depts) => {
        setDepartments(
          depts
            .filter((d) => d.status === '0' && d.delFlag === '0')
            .map((d) => ({ deptId: d.deptId, deptName: d.deptName })),
        );
      })
      .catch(() => {});
  }, []);

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const validate = (): string | null => {
    if (!accountType) return t.auth.selectAccountType;
    if (!form.email || !form.password || !form.name || !form.phone) {
      return t.auth.fillRequired;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      return t.auth.invalidEmail;
    }
    if (form.password.length < 6) {
      return t.auth.passwordTooShort;
    }
    if (form.password !== form.passwordConfirm) {
      return t.auth.passwordMismatch;
    }
    if (!/^\d{10,11}$/.test(form.phone)) {
      return t.auth.invalidPhone;
    }
    if (accountType === 'sub_admin' && !form.deptId) {
      return t.auth.selectDepartment;
    }
    if (accountType === 'business' && !form.businessName) {
      return t.auth.enterBusinessName;
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
        accountType: accountType as AccountType,
        ...(accountType === 'sub_admin'
          ? { deptId: Number(form.deptId) }
          : {
              businessName: form.businessName,
              parentDeptId: form.parentDeptId ? Number(form.parentDeptId) : 0,
            }),
      });
      navigate('/register/complete', { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : t.auth.registerFailed;
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle = {
    borderColor: 'var(--c-bd)',
    backgroundColor: 'var(--c-bg)',
    color: 'var(--c-tx1)',
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--c-bg)' }}>
      <header className="h-[var(--header-h)] flex items-center px-sp-4" style={{ backgroundColor: 'var(--c-sf)', borderBottom: '1px solid var(--c-bd)' }}>
        <Link to="/login" className="touch-target" style={{ color: 'var(--c-tx3)' }}>
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-lg font-semibold ml-sp-2" style={{ color: 'var(--c-tx1)' }}>{t.auth.register}</h1>
      </header>

      <div className="flex-1 px-sp-4 py-sp-6">
        <form onSubmit={handleSubmit} className="space-y-sp-4">
          {error && (
            <div className="rounded-input px-sp-4 py-sp-3 text-sm" style={{ backgroundColor: 'color-mix(in srgb, var(--c-err) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--c-err) 25%, transparent)', color: 'var(--c-err)' }}>
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-sp-2" style={{ color: 'var(--c-tx2)' }}>
              {t.auth.accountType} <span style={{ color: 'var(--c-err)' }}>*</span>
            </label>
            <div className="grid grid-cols-2 gap-sp-3">
              <button
                type="button"
                onClick={() => { setAccountType('sub_admin'); setError(null); }}
                className="p-sp-4 rounded-lg border-2 text-left transition-all"
                style={{
                  borderColor: accountType === 'sub_admin' ? 'var(--c-pri)' : 'var(--c-bd)',
                  backgroundColor: accountType === 'sub_admin' ? 'var(--c-pri-lt)' : 'var(--c-sf)',
                }}
              >
                <div className="flex items-center gap-sp-2 mb-sp-1">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: accountType === 'sub_admin' ? 'var(--c-pri)' : 'var(--c-tx3)' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="text-sm font-semibold" style={{ color: accountType === 'sub_admin' ? 'var(--c-pri)' : 'var(--c-tx1)' }}>
                    Sub Admin
                  </span>
                </div>
                <p className="text-xs" style={{ color: 'var(--c-tx3)' }}>{t.auth.subAdminDesc}</p>
              </button>
              <button
                type="button"
                onClick={() => { setAccountType('business'); setError(null); }}
                className="p-sp-4 rounded-lg border-2 text-left transition-all"
                style={{
                  borderColor: accountType === 'business' ? 'var(--c-pri)' : 'var(--c-bd)',
                  backgroundColor: accountType === 'business' ? 'var(--c-pri-lt)' : 'var(--c-sf)',
                }}
              >
                <div className="flex items-center gap-sp-2 mb-sp-1">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: accountType === 'business' ? 'var(--c-pri)' : 'var(--c-tx3)' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <span className="text-sm font-semibold" style={{ color: accountType === 'business' ? 'var(--c-pri)' : 'var(--c-tx1)' }}>
                    {t.auth.businessAccount}
                  </span>
                </div>
                <p className="text-xs" style={{ color: 'var(--c-tx3)' }}>{t.auth.businessDesc}</p>
              </button>
            </div>
          </div>

          {accountType && (
            <>
              <div>
                <label className="block text-sm font-medium mb-sp-1" style={{ color: 'var(--c-tx2)' }}>
                  {t.auth.email} <span style={{ color: 'var(--c-err)' }}>*</span>
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  placeholder="example@company.com"
                  autoComplete="email"
                  className="w-full h-12 px-sp-4 border rounded-input text-body outline-none transition-colors"
                  style={inputStyle}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-sp-1" style={{ color: 'var(--c-tx2)' }}>
                  {t.auth.name} <span style={{ color: 'var(--c-err)' }}>*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  placeholder={t.auth.namePlaceholder}
                  autoComplete="name"
                  className="w-full h-12 px-sp-4 border rounded-input text-body outline-none transition-colors"
                  style={inputStyle}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-sp-1" style={{ color: 'var(--c-tx2)' }}>
                  {t.auth.phone} <span style={{ color: 'var(--c-err)' }}>*</span>
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => updateField('phone', e.target.value.replace(/\D/g, ''))}
                  placeholder={t.auth.phonePlaceholder}
                  autoComplete="tel"
                  maxLength={11}
                  className="w-full h-12 px-sp-4 border rounded-input text-body outline-none transition-colors"
                  style={inputStyle}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-sp-1" style={{ color: 'var(--c-tx2)' }}>
                  {t.auth.password} <span style={{ color: 'var(--c-err)' }}>*</span>
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => updateField('password', e.target.value)}
                  placeholder={t.auth.passwordMinLength}
                  autoComplete="new-password"
                  className="w-full h-12 px-sp-4 border rounded-input text-body outline-none transition-colors"
                  style={inputStyle}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-sp-1" style={{ color: 'var(--c-tx2)' }}>
                  {t.auth.passwordConfirm} <span style={{ color: 'var(--c-err)' }}>*</span>
                </label>
                <input
                  type="password"
                  value={form.passwordConfirm}
                  onChange={(e) => updateField('passwordConfirm', e.target.value)}
                  placeholder={t.auth.passwordConfirmPlaceholder}
                  autoComplete="new-password"
                  className="w-full h-12 px-sp-4 border rounded-input text-body outline-none transition-colors"
                  style={inputStyle}
                />
                {form.passwordConfirm && form.password !== form.passwordConfirm && (
                  <p className="text-xs mt-sp-1" style={{ color: 'var(--c-err)' }}>{t.auth.passwordMismatch}</p>
                )}
              </div>

              {accountType === 'sub_admin' && (
                <div>
                  <label className="block text-sm font-medium mb-sp-1" style={{ color: 'var(--c-tx2)' }}>
                    {t.auth.department} <span style={{ color: 'var(--c-err)' }}>*</span>
                  </label>
                  {departments.length > 0 ? (
                    <select
                      value={form.deptId}
                      onChange={(e) => updateField('deptId', e.target.value)}
                      className="w-full h-12 px-sp-4 border rounded-input text-body outline-none transition-colors appearance-none"
                      style={inputStyle}
                    >
                      <option value="">{t.auth.departmentPlaceholder}</option>
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
                      placeholder={t.auth.deptIdPlaceholder}
                      className="w-full h-12 px-sp-4 border rounded-input text-body outline-none transition-colors"
                      style={inputStyle}
                    />
                  )}
                </div>
              )}

              {accountType === 'business' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-sp-1" style={{ color: 'var(--c-tx2)' }}>
                      {t.auth.businessName} <span style={{ color: 'var(--c-err)' }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={form.businessName}
                      onChange={(e) => updateField('businessName', e.target.value)}
                      placeholder={t.auth.businessNamePlaceholder}
                      className="w-full h-12 px-sp-4 border rounded-input text-body outline-none transition-colors"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-sp-1" style={{ color: 'var(--c-tx2)' }}>
                      {t.auth.parentDept}
                    </label>
                    {departments.length > 0 ? (
                      <select
                        value={form.parentDeptId}
                        onChange={(e) => updateField('parentDeptId', e.target.value)}
                        className="w-full h-12 px-sp-4 border rounded-input text-body outline-none transition-colors appearance-none"
                        style={inputStyle}
                      >
                        <option value="">{t.auth.parentDeptTopLevel}</option>
                        {departments.map((d) => (
                          <option key={d.deptId} value={d.deptId}>
                            {d.deptName}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="number"
                        value={form.parentDeptId}
                        onChange={(e) => updateField('parentDeptId', e.target.value)}
                        placeholder={t.auth.parentDeptIdPlaceholder}
                        className="w-full h-12 px-sp-4 border rounded-input text-body outline-none transition-colors"
                        style={inputStyle}
                      />
                    )}
                  </div>
                </>
              )}

              <div className="pt-sp-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full h-12 font-semibold rounded-button
                             disabled:opacity-40 disabled:cursor-not-allowed
                             transition-colors flex items-center justify-center min-h-touch"
                  style={{ backgroundColor: 'var(--c-pri)', color: '#fff' }}
                >
                  {submitting ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    t.auth.register
                  )}
                </button>
              </div>
            </>
          )}

          <p className="text-center text-sm" style={{ color: 'var(--c-tx3)' }}>
            {t.auth.alreadyHaveAccount}{' '}
            <Link to="/login" className="font-medium hover:underline" style={{ color: 'var(--c-pri)' }}>
              {t.auth.goToLogin}
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
