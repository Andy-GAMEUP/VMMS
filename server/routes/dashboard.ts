import { Router, type Request, type Response } from 'express';
import type { XzyClient } from '../lib/xzyClient.js';
import type { AuthenticatedRequest } from '../lib/auth.js';
import { machineAssignStore } from '../db/machineAssignStore.js';

export function createDashboardRoutes(xzy: XzyClient): Router {
  const router = Router();

  /** GET /api/dashboard/summary — 대시보드 종합 데이터 (MTD 매출 + 장비 요약 + lowStock) */
  router.get('/summary', async (req: Request, res: Response) => {
    try {
      const user = (req as AuthenticatedRequest).user;

      const rawData = await xzy.getMachines() as any;
      const rawList = Array.isArray(rawData) ? rawData : (rawData?.records ?? []);
      let machines = rawList.map((raw: any) => ({
        funId: raw.funId,
        funName: raw.funName || '',
        funStatus: raw.funStatus ?? 0,
        lineStatus: raw.lineStatus ?? 0,
        funWaring: raw.funWaring ?? 5,
      }));

      if (user.role !== 'admin') {
        const assignedIds = await machineAssignStore.getByUser(user.userId);
        machines = machines.filter((m: any) => assignedIds.includes(m.funId));
      }

      // 장비 상태 집계
      let online = 0, fault = 0, offline = 0;
      for (const m of machines) {
        if (m.funStatus === 1) fault++;
        else if (m.lineStatus === 1) offline++;
        else online++;
      }

      // 재고부족 자판기 카운트 (병렬)
      const lowStockChecks = await Promise.allSettled(
        machines.map(async (m: any) => {
          try {
            const roads = await xzy.getRoads(m.funId) as any[];
            return (roads || []).some(
              (r: any) => r.goodsId && (r.roadStock ?? 0) < m.funWaring,
            );
          } catch {
            return false;
          }
        }),
      );
      const lowStockCount = lowStockChecks.filter(
        (r) => r.status === 'fulfilled' && r.value,
      ).length;

      res.json({
        success: true,
        data: {
          totalMachines: machines.length,
          online,
          fault,
          offline,
          lowStockCount,
        },
        timestamp: Date.now(),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      res.status(500).json({ success: false, error: message, timestamp: Date.now() });
    }
  });

  return router;
}
