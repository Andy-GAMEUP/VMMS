/**
 * 화도(슬롯) 타입 정의
 * 鑫之源 API: getRoodById (V1.1)
 */

/** 화도 단일 항목 */
export interface Road {
  roadId: number;
  roadCode: string; // 화도 코드 (예: A1, B3)
  funId: number;
  goodsId: number;
  goodsName: string;
  goodsPrice: number; // 판매가
  stockCurr: number; // 현재 재고
  stockMax: number; // 최대 용량
  roadRow: number; // 행 번호
  roadColumn: number; // 열 번호
  isSale: number; // 0=판매중지, 1=판매중
}

/** getRoodById 전체 응답 */
export interface RoadInfo {
  funId: number;
  roads: Road[];
  totalRoads: number;
  totalStock: number;
  totalCapacity: number;
}

/** 재고 수준 분류 */
export type StockLevel = 'full' | 'mid' | 'low' | 'empty' | 'none';

/** 재고율 기반 수준 판단 */
export function resolveStockLevel(curr: number, max: number): StockLevel {
  if (max === 0) return 'none';
  const ratio = curr / max;
  if (ratio >= 0.7) return 'full';
  if (ratio >= 0.4) return 'mid';
  if (ratio >= 0.1) return 'low';
  return 'empty';
}

/** 수준별 표시 정보 */
export const STOCK_LEVEL_MAP: Record<StockLevel, { label: string; cellClass: string }> = {
  full: { label: '충분', cellClass: 'slot-cell--full' },
  mid: { label: '보통', cellClass: 'slot-cell--mid' },
  low: { label: '부족', cellClass: 'slot-cell--low' },
  empty: { label: '소진', cellClass: 'slot-cell--empty' },
  none: { label: '미설정', cellClass: 'slot-cell--none' },
};
