/**
 * 매출 통계 타입 정의
 * 鑫之源 API: countInfo (V1.2)
 */

/** countInfo 통계 항목 */
export interface SalesStat {
  orderMoney: number; // 주문 금액 (분 단위, ÷100 필요)
  totalOrderMoney: number; // 총 성사 금액 (분 단위)
  decTotalOrderMoney: number; // 총 성사 금액 (원 단위, 변환 완료)
  totalOrderNumber: number; // 총 주문 건수
  goodsId?: number; // 상품별 통계 시
  goodsName?: string;
  fileUrl?: string; // 상품 이미지
  statDate?: string; // 통계 일자
}

/** countInfo 요청 파라미터 (statType 제거됨 — 鑫之源 2026-05-29 회신) */
export interface SalesQueryParams {
  appId: number;
  startTime: number; // 밀리초 타임스탬프
  endTime: number; // 밀리초 타임스탬프
  goodsId?: number;
}

/** 금액 분(分) → 원(元) 변환 */
export function fenToYuan(fen: number): number {
  return Math.round(fen) / 100;
}

/** 금액 포맷팅 (예: ₩8,420) */
export function formatMoney(amount: number): string {
  return `₩${amount.toLocaleString('ko-KR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}
