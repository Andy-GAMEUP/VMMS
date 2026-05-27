/**
 * VMMS 인증 API
 */

import api from './client';
import { setStoredTokens, clearStoredTokens } from './client';
import type { VmmsUser, LoginRequest, LoginResponse, RegisterRequest } from '@/types/auth';

/** 로그인 */
export async function login(req: LoginRequest): Promise<LoginResponse> {
  const { data } = await api.post<{ success: boolean; data: LoginResponse; error?: string }>(
    '/auth/login',
    req,
  );
  if (!data.success) throw new Error(data.error || '로그인 실패');

  // 토큰 저장
  setStoredTokens(data.data.accessToken, data.data.refreshToken);
  return data.data;
}

/** 회원가입 */
export async function register(
  req: RegisterRequest,
): Promise<{ user: VmmsUser; message: string }> {
  const { data } = await api.post<{
    success: boolean;
    data: VmmsUser;
    message: string;
    error?: string;
  }>('/auth/register', req);
  if (!data.success) throw new Error(data.error || '회원가입 실패');
  return { user: data.data, message: data.message };
}

/** 로그아웃 */
export async function logout(): Promise<void> {
  try {
    await api.post('/auth/logout');
  } catch {
    // 서버 오류 시에도 로컬 토큰은 삭제
  }
  clearStoredTokens();
}

/** 현재 사용자 정보 조회 */
export async function fetchMe(): Promise<VmmsUser> {
  const { data } = await api.get<{ success: boolean; data: VmmsUser; error?: string }>(
    '/auth/me',
  );
  if (!data.success) throw new Error(data.error || '사용자 정보 조회 실패');
  return data.data;
}
