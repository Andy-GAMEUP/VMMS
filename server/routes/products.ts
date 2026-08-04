/**
 * 상품 API 라우트
 * BFF → 鑫之源 프록시 + 데이터 변환
 */

import { Router, type Request, type Response } from 'express';
import type { XzyClient } from '../lib/xzyClient.js';

/** 鑫之源 상품 → VMMS Product 변환 */
function toProduct(raw: any) {
  return {
    goodsId: raw.goodsId,
    goodsName: raw.goodsName || '',
    goodsTypeName: raw.goodsTypeName || '',
    skuCode: raw.skuCode || '',
    skuName: raw.skuName || '',
    oldBuyingPrice: raw.oldBuyingPrice ?? 0,
    oldGoodsPrice: raw.oldGoodsPrice ?? 0,
    fileUrl: raw.fileUrl || '',
    fileCopyUrl: raw.fileCopyUrl || '',
    isList: raw.isList ?? 0,
    createTime: raw.createTime ?? 0,
    shelfTime: raw.shelfTime ?? 0,
    goodsPresent: raw.goodsPresent || '',
    goodsTypeUrl: raw.goodsTypeUrl || '',
  };
}

export function createProductRoutes(xzy: XzyClient): Router {
  const router = Router();

  /** GET /api/products — 상품 목록 (페이징) */
  router.get('/', async (req: Request, res: Response) => {
    try {
      const current = Number(req.query.current) || 1;
      const size = Number(req.query.size) || 20;
      const funId = req.query.funId ? Number(req.query.funId) : undefined;

      const rawData = await xzy.getProducts({ current, size, funId }) as any;

      // 鑫之源 응답: { records: [...], total, size, current, pages } 형태
      const records = (rawData?.records ?? []).map(toProduct);
      const data = {
        records,
        total: rawData?.total ?? records.length,
        current: rawData?.current ?? current,
        size: rawData?.size ?? size,
        pages: rawData?.pages ?? 1,
      };

      res.json({ success: true, data, timestamp: Date.now() });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      res.status(500).json({ success: false, error: message, timestamp: Date.now() });
    }
  });

  /** GET /api/products/selling-ids — 현재 자판기에 배정된 상품 ID 목록 */
  router.get('/selling-ids', async (_req: Request, res: Response) => {
    try {
      const rawData = await xzy.getMachines() as any;
      const rawList = Array.isArray(rawData) ? rawData : (rawData?.records ?? []);

      const roadResults = await Promise.allSettled(
        rawList.map((m: any) => xzy.getRoads(m.funId) as Promise<any[]>),
      );

      const ids = new Set<number>();
      for (const result of roadResults) {
        if (result.status === 'fulfilled') {
          for (const road of result.value || []) {
            if (road.goodsId) ids.add(road.goodsId);
          }
        }
      }

      res.json({ success: true, data: [...ids], timestamp: Date.now() });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      res.status(500).json({ success: false, error: message, timestamp: Date.now() });
    }
  });

  return router;
}
