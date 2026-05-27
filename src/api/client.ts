/**
 * BFF API 클라이언트
 * 프론트엔드 → BFF (localhost:4000/api)
 * - JWT Access Token 자동 주입
 * - 401 응답 시 Refresh Token으로 자동 갱신
 */

import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import type { ApiResponse } from '@/types/api';

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ===== 토큰 관리 헬퍼 =====
const TOKEN_KEY = 'vmms_access_token';
const REFRESH_KEY = 'vmms_refresh_token';
const REMEMBER_KEY = 'vmms_remember_me';

/** 자동로그인 설정 여부 확인 */
export function isRememberMe(): boolean {
  return localStorage.getItem(REMEMBER_KEY) === 'true';
}

/** 자동로그인 설정 저장 */
export function setRememberMe(remember: boolean) {
  if (remember) {
    localStorage.setItem(REMEMBER_KEY, 'true');
  } else {
    localStorage.removeItem(REMEMBER_KEY);
  }
}

/** 현재 사용할 storage 결정 (자동로그인 ON → localStorage, OFF → sessionStorage) */
function getStorage(): Storage {
  return isRememberMe() ? localStorage : sessionStorage;
}

export function getStoredTokens() {
  // 양쪽 storage 모두 확인 (자동로그인 전환 시 호환성)
  const accessToken = localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
  const refreshToken = localStorage.getItem(REFRESH_KEY) || sessionStorage.getItem(REFRESH_KEY);
  return { accessToken, refreshToken };
}

export function setStoredTokens(access: string, refresh: string) {
  const storage = getStorage();
  storage.setItem(TOKEN_KEY, access);
  storage.setItem(REFRESH_KEY, refresh);

  // 반대쪽 storage에 혹시 남아있는 토큰 제거
  const otherStorage = isRememberMe() ? sessionStorage : localStorage;
  otherStorage.removeItem(TOKEN_KEY);
  otherStorage.removeItem(REFRESH_KEY);
}

export function clearStoredTokens() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(REFRESH_KEY);
}

// ===== 요청 인터셉터 — Access Token 자동 주입 =====
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const { accessToken } = getStoredTokens();
  if (accessToken && config.headers) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// ===== 응답 인터셉터 — 401 시 자동 갱신 =====
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach((p) => {
    if (error) {
      p.reject(error);
    } else {
      p.resolve(token!);
    }
  });
  failedQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // 401이고, 로그인/리프레시 요청이 아니고, 아직 재시도 안 했으면
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/login') &&
      !originalRequest.url?.includes('/auth/refresh')
    ) {
      if (isRefreshing) {
        // 이미 갱신 중이면 대기열에 추가
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(api(originalRequest));
            },
            reject,
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const { refreshToken } = getStoredTokens();
      if (!refreshToken) {
        isRefreshing = false;
        clearStoredTokens();
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post('/api/auth/refresh', { refreshToken });
        const { accessToken: newAccess, refreshToken: newRefresh } = data.data;
        setStoredTokens(newAccess, newRefresh);

        originalRequest.headers.Authorization = `Bearer ${newAccess}`;
        processQueue(null, newAccess);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearStoredTokens();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    if (error.response) {
      console.error(`[API] ${error.response.status}: ${(error.response.data as Record<string, string>)?.error || error.message}`);
    } else {
      console.error(`[API] Network error: ${error.message}`);
    }
    return Promise.reject(error);
  },
);

/** 타입 안전한 GET */
export async function apiGet<T>(url: string, params?: Record<string, unknown>): Promise<T> {
  const { data } = await api.get<ApiResponse<T>>(url, { params });
  if (!data.success) throw new Error(data.error || 'API Error');
  return data.data;
}

/** 타입 안전한 POST */
export async function apiPost<T>(url: string, body?: unknown): Promise<T> {
  const { data } = await api.post<ApiResponse<T>>(url, body);
  if (!data.success) throw new Error(data.error || 'API Error');
  return data.data;
}

export default api;
