/**
 * 인증 상태 관리 (Zustand)
 * - JWT 토큰 기반 인증
 * - localStorage 연동
 * - 앱 시작 시 토큰 검증 & 사용자 복원
 */

import { create } from 'zustand';
import type { VmmsUser } from '@/types/auth';
import { getStoredTokens, clearStoredTokens, setRememberMe, isRememberMe } from '@/api/client';
import { fetchMe, login as apiLogin, logout as apiLogout } from '@/api/auth';
import type { LoginRequest } from '@/types/auth';

interface LoginOptions extends LoginRequest {
  rememberMe?: boolean;
}

interface AuthStore {
  // 상태
  isAuthenticated: boolean;
  user: VmmsUser | null;
  isLoading: boolean; // 앱 초기화 중
  error: string | null;
  rememberMe: boolean; // 자동로그인 설정 상태

  // 액션
  initialize: () => Promise<void>;
  login: (req: LoginOptions) => Promise<VmmsUser>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  isAuthenticated: false,
  user: null,
  isLoading: true, // 앱 시작 시 토큰 검증 전까지 true
  error: null,
  rememberMe: isRememberMe(), // 저장된 설정 복원

  /** 앱 초기화 — 저장된 토큰으로 사용자 복원 */
  initialize: async () => {
    const { accessToken } = getStoredTokens();
    if (!accessToken) {
      set({ isLoading: false, isAuthenticated: false, user: null });
      return;
    }

    try {
      const user = await fetchMe();
      set({ isAuthenticated: true, user, isLoading: false });
    } catch {
      // 토큰 만료/무효 → 클리어
      clearStoredTokens();
      set({ isAuthenticated: false, user: null, isLoading: false });
    }
  },

  /** 로그인 */
  login: async ({ rememberMe, ...req }: LoginOptions) => {
    set({ error: null });

    // 자동로그인 설정 먼저 저장 (토큰 저장 위치 결정에 필요)
    const remember = rememberMe ?? false;
    setRememberMe(remember);
    set({ rememberMe: remember });

    try {
      const result = await apiLogin(req);
      set({ isAuthenticated: true, user: result.user, error: null });
      return result.user;
    } catch (err) {
      const message = err instanceof Error ? err.message : '로그인에 실패했습니다.';
      set({ error: message });
      throw err;
    }
  },

  /** 로그아웃 */
  logout: async () => {
    await apiLogout();
    setRememberMe(false);
    set({ isAuthenticated: false, user: null, error: null, rememberMe: false });
  },

  /** 에러 클리어 */
  clearError: () => set({ error: null }),
}));
