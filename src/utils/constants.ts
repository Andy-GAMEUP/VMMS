/**
 * VMMS 상수 정의
 */

/** 화면 이름 */
export const ROUTES = {
  DASHBOARD: '/dashboard',
  MACHINES: '/machines',
  MACHINE_DETAIL: '/machines/:id',
  MESSAGES: '/messages',
  MY: '/my',
  SALES: '/sales',
} as const;

/** 재고 예경 기본값 */
export const DEFAULT_STOCK_WARNING = 3;

/** API 재시도 설정 */
export const API_CONFIG = {
  RETRY_COUNT: 2,
  STALE_TIME: 2 * 60 * 1000, // 2분
  REFETCH_INTERVAL: 5 * 60 * 1000, // 5분
} as const;
