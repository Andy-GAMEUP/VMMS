/**
 * 설비(자판기) API 라우트
 * BFF → 鑫之源 프록시
 */

import { Router, type Request, type Response } from 'express';
import type { XzyClient } from '../lib/xzyClient.js';

export function createMachineRoutes(xzy: XzyClient): Router {
  const router = Router();

  /** GET /api/machines — 전체 설비 목록 */
  router.get('/', async (_req: Request, res: Response) => {
    try {
      const data = await xzy.getMachines();
      res.json({ success: true, data, timestamp: Date.now() });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      res.status(500).json({ success: false, error: message, timestamp: Date.now() });
    }
  });

  /** GET /api/machines/:funId — 설비 상세 */
  router.get('/:funId', async (req: Request, res: Response) => {
    try {
      const funId = Number(req.params.funId);
      if (isNaN(funId)) {
        res.status(400).json({ success: false, error: 'Invalid funId' });
        return;
      }
      const data = await xzy.getMachineById(funId);
      res.json({ success: true, data, timestamp: Date.now() });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      res.status(500).json({ success: false, error: message, timestamp: Date.now() });
    }
  });

  /** GET /api/machines/:funId/roads — 화도(슬롯) 조회 */
  router.get('/:funId/roads', async (req: Request, res: Response) => {
    try {
      const funId = Number(req.params.funId);
      if (isNaN(funId)) {
        res.status(400).json({ success: false, error: 'Invalid funId' });
        return;
      }
      const data = await xzy.getRoads(funId);
      res.json({ success: true, data, timestamp: Date.now() });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      res.status(500).json({ success: false, error: message, timestamp: Date.now() });
    }
  });

  return router;
}
