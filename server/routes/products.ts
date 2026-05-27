/**
 * 상품 API 라우트
 */

import { Router, type Request, type Response } from 'express';
import type { XzyClient } from '../lib/xzyClient.js';

export function createProductRoutes(xzy: XzyClient): Router {
  const router = Router();

  /** GET /api/products — 상품 목록 (페이징) */
  router.get('/', async (req: Request, res: Response) => {
    try {
      const pageNum = Number(req.query.pageNum) || 1;
      const pageSize = Number(req.query.pageSize) || 20;
      const funId = req.query.funId ? Number(req.query.funId) : undefined;

      const data = await xzy.getProducts({ pageNum, pageSize, funId });
      res.json({ success: true, data, timestamp: Date.now() });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      res.status(500).json({ success: false, error: message, timestamp: Date.now() });
    }
  });

  return router;
}
