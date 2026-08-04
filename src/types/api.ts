/**
 * 鑫之源 API 공통 응답 래퍼
 */

/** 鑫之源 REST API 표준 응답 */
export interface XzyResponse<T = unknown> {
  code: string; // "00000" 또는 "200" = 성공
  msg: string;
  data: T;
}

/** 페이징 응답 래퍼 (鑫之源 API 형식) */
export interface PageResult<T> {
  records: T[];
  total: number;
  current: number;
  size: number;
  pages: number;
}

/** BFF API 표준 응답 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  error?: string;
  timestamp: number;
}
