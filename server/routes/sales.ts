/**
 * 매출 통계 API 라우트
 */

import { Router, type Request, type Response } from 'express';
import type { XzyClient } from '../lib/xzyClient.js';

export function createSalesRoutes(xzy: XzyClient): Router {
  const router = Router();

  /** GET /api/sales/stats — 매출 통계 */
  router.get('/stats', async (req: Request, res: Response) => {
    try {
      const { statType, startDate, endDate, funId, deptId } = req.query;

      if (!statType || typeof statType !== 'string') {
        res.status(400).json({ success: false, error: 'statType is required (day|week|month|year|goods)' });
        return;
      }

      const data = await xzy.getSalesStats({
        statType,
        startDate: startDate as string | undefined,
        endDate: endDate as string | undefined,
        funId: funId ? Number(funId) : undefined,
        deptId: deptId ? Number(deptId) : undefined,
      });
      res.json({ success: true, data, timestamp: Date.now() });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      res.status(500).json({ success: false, error: message, timestamp: Date.now() });
    }
  });

  return router;
}
