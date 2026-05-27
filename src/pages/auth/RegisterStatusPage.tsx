/**
 * 회원가입 완료 (승인 대기) 페이지
 */

import { Link } from 'react-router-dom';

export default function RegisterStatusPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-sp-4">
      {/* 성공 아이콘 */}
      <div className="w-20 h-20 bg-success-50 rounded-full flex items-center justify-center mb-sp-6">
        <svg className="w-10 h-10 text-success-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <h1 className="text-xl font-bold text-gray-900 mb-sp-2">가입 신청 완료</h1>
      <p className="text-body text-gray-500 text-center max-w-[280px] mb-sp-8 leading-relaxed">
        관리자 승인 후 로그인이 가능합니다.
        <br />
        승인 완료 시 이메일로 안내드리겠습니다.
      </p>

      <Link
        to="/login"
        className="w-full max-w-[320px] h-12 bg-primary-500 text-white font-semibold rounded-button
                   hover:bg-primary-600 active:bg-primary-700
                   transition-colors flex items-center justify-center min-h-touch"
      >
        로그인 페이지로 이동
      </Link>
    </div>
  );
}
