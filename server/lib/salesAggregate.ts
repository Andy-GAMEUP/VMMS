/**
 * 매출 통계 집계 — 鑫之源 countInfo 응답 가공
 *
 * countInfo는 기간만 지정하면 상품(goodsId)별 행을 배열로 돌려준다.
 * (API 문서 3.6 반환 예시 참고)
 * 같은 상품이 여러 행으로 쪼개져 올 수 있으므로 goodsId 기준으로 합산한다.
 */

import type { ProductInfo } from './productMap.js';

/** countInfo 응답 행 */
export interface RawSalesStat {
  goodsId?: number;
  fileUrl?: string;
  orderMoney?: number;
  totalOrderMoney?: number;
  decTotalOrderMoney?: number;
  totalOrderNumber?: number;
}

export interface TopProduct {
  goodsId: number;
  goodsName: string;
  fileUrl: string;
  /** 매출액 (원) */
  totalSales: number;
  /** 판매 건수 */
  totalOrders: number;
}

/** 상품명을 알 수 없을 때의 표시값 */
function fallbackName(goodsId: number): string {
  return `상품 #${goodsId}`;
}

/**
 * countInfo 응답을 상품별로 합산해 판매 건수 상위 N개를 돌려준다.
 *
 * - goodsId가 없는 행은 상품 단위가 아닌 기간 집계 행이므로 제외한다.
 * - 판매 건수 내림차순, 동수면 매출액 내림차순, 그래도 같으면 goodsId 오름차순.
 */
export function aggregateTopProducts(
  stats: RawSalesStat[] | null | undefined,
  productMap: Map<number, ProductInfo>,
  limit = 5,
): TopProduct[] {
  if (!Array.isArray(stats)) return [];

  const totals = new Map<number, { sales: number; orders: number; fileUrl: string }>();

  for (const row of stats) {
    const goodsId = row?.goodsId;
    if (!goodsId) continue;

    const acc = totals.get(goodsId) ?? { sales: 0, orders: 0, fileUrl: '' };
    acc.sales += row.decTotalOrderMoney ?? 0;
    acc.orders += row.totalOrderNumber ?? 0;
    if (!acc.fileUrl && row.fileUrl) acc.fileUrl = row.fileUrl;
    totals.set(goodsId, acc);
  }

  return [...totals.entries()]
    .map(([goodsId, acc]) => {
      const product = productMap.get(goodsId);
      return {
        goodsId,
        goodsName: product?.name || fallbackName(goodsId),
        // countInfo가 이미지 URL을 주면 그것을, 없으면 상품 목록의 이미지를 사용
        fileUrl: acc.fileUrl || product?.fileUrl || '',
        totalSales: acc.sales,
        totalOrders: acc.orders,
      };
    })
    .sort((a, b) =>
      b.totalOrders - a.totalOrders ||
      b.totalSales - a.totalSales ||
      a.goodsId - b.goodsId,
    )
    .slice(0, Math.max(0, limit));
}
