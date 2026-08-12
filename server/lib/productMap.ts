/**
 * 상품 룩업맵 — goodsId → 상품명/가격/이미지
 *
 * 鑫之源 countInfo(매출 통계)는 goodsId만 돌려주고 상품명을 포함하지 않으므로,
 * getGoodsById(상품 목록)로 이름을 보강해야 한다.
 */

import type { XzyClient } from './xzyClient.js';

export interface ProductInfo {
  name: string;
  price: number;
  fileUrl: string;
}

/** 페이지당 조회 건수 */
const PAGE_SIZE = 200;
/** 최대 조회 페이지 수 — 상품이 많아도 무한정 호출하지 않도록 상한 */
const MAX_PAGES = 5;

function collectRecords(rawData: any): any[] {
  if (Array.isArray(rawData)) return rawData;
  return rawData?.records ?? [];
}

function addRecords(map: Map<number, ProductInfo>, records: any[]): void {
  for (const p of records) {
    if (!p?.goodsId) continue;
    map.set(p.goodsId, {
      name: p.goodsName || '',
      price: p.oldGoodsPrice ?? 0,
      fileUrl: p.fileUrl || '',
    });
  }
}

/**
 * 상품 전체를 조회해 goodsId 룩업맵을 만든다.
 * 조회 실패 시 빈 맵을 돌려주며, 호출부는 이름 없이도 동작해야 한다.
 */
export async function buildProductMap(xzy: XzyClient): Promise<Map<number, ProductInfo>> {
  const map = new Map<number, ProductInfo>();

  let firstPage: any;
  try {
    firstPage = await xzy.getProducts({ current: 1, size: PAGE_SIZE });
  } catch {
    return map; // 상품 조회 실패 — 이름 보강 없이 진행
  }

  addRecords(map, collectRecords(firstPage));

  // 2페이지 이후는 병렬 조회 (일부 실패해도 무시)
  const totalPages = Math.min(Number(firstPage?.pages) || 1, MAX_PAGES);
  if (totalPages <= 1) return map;

  const rest = await Promise.allSettled(
    Array.from({ length: totalPages - 1 }, (_, i) =>
      xzy.getProducts({ current: i + 2, size: PAGE_SIZE }),
    ),
  );
  for (const result of rest) {
    if (result.status === 'fulfilled') addRecords(map, collectRecords(result.value));
  }

  return map;
}
