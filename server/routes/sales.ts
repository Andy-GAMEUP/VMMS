/**
 * 매출 통계 API 라우트
 */

import { Router, type Request, type Response } from 'express';
import type { XzyClient } from '../lib/xzyClient.js';
import type { AuthenticatedRequest } from '../lib/auth.js';
import { machineAssignStore } from '../db/machineAssignStore.js';
import { isLcdDevice } from '../lib/deviceFilter.js';

export function createSalesRoutes(xzy: XzyClient): Router {
  const router = Router();

  /** GET /api/sales/stats — 매출 통계 */
  router.get('/stats', async (req: Request, res: Response) => {
    try {
      const { startTime, endTime, goodsId, funId } = req.query;

      if (!startTime || !endTime) {
        res.status(400).json({ success: false, error: 'startTime and endTime are required (millisecond timestamps)' });
        return;
      }

      const params: { startTime: number; endTime: number; goodsId?: number; funId?: number } = {
        startTime: Number(startTime),
        endTime: Number(endTime),
      };
      if (goodsId) params.goodsId = Number(goodsId);
      if (funId) params.funId = Number(funId);

      const data = await xzy.getSalesStats(params);
      res.json({ success: true, data, timestamp: Date.now() });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      res.status(500).json({ success: false, error: message, timestamp: Date.now() });
    }
  });

  /** GET /api/sales/by-machine — 자판기별 매출 집계 */
  router.get('/by-machine', async (req: Request, res: Response) => {
    try {
      const user = (req as AuthenticatedRequest).user;
      const { startTime, endTime } = req.query;

      if (!startTime || !endTime) {
        res.status(400).json({ success: false, error: 'startTime and endTime are required' });
        return;
      }

      const rawData = await xzy.getMachines() as any;
      const rawList = Array.isArray(rawData) ? rawData : (rawData?.records ?? []);
      let machines = rawList.map((m: any) => ({
        funId: m.funId as number,
        funCode: (m.funNumber || '') as string,
        funName: (m.funName || '') as string,
        funStatus: (m.funStatus ?? 0) as number,
        lineStatus: (m.lineStatus ?? 0) as number,
      }));

      // 자판기 LCD(디스플레이 전용 장비)는 매출정보 대상에서 제외
      machines = machines.filter((m) => !isLcdDevice(m.funName, m.funCode));

      if (user.role !== 'admin') {
        const assignedIds = await machineAssignStore.getByUser(user.userId);
        machines = machines.filter((m) => assignedIds.includes(m.funId));
      }

      const st = Number(startTime);
      const et = Number(endTime);

      const results = await Promise.allSettled(
        machines.map((m) => xzy.getSalesStats({ startTime: st, endTime: et, funId: m.funId })),
      );

      const data = machines.map((m, i) => {
        let totalSales = 0;
        let totalOrders = 0;
        const result = results[i];
        if (result.status === 'fulfilled') {
          const statsList = Array.isArray(result.value) ? result.value : [];
          totalSales = statsList.reduce((s: number, v: any) => s + (v.decTotalOrderMoney ?? 0), 0);
          totalOrders = statsList.reduce((s: number, v: any) => s + (v.totalOrderNumber ?? 0), 0);
        }
        return {
          funId: m.funId,
          funName: m.funName,
          funStatus: m.funStatus,
          lineStatus: m.lineStatus,
          totalSales,
          totalOrders,
        };
      });

      res.json({ success: true, data, timestamp: Date.now() });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      res.status(500).json({ success: false, error: message, timestamp: Date.now() });
    }
  });

  return router;
}
