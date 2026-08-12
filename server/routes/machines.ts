/**
 * 설비(자판기) API 라우트
 * BFF → 鑫之源 프록시 + 데이터 변환
 * admin: 전체 설비 조회
 * manager: 할당된 설비만 조회
 */

import { Router, type Request, type Response } from 'express';
import type { XzyClient } from '../lib/xzyClient.js';
import type { AuthenticatedRequest } from '../lib/auth.js';
import { machineAssignStore } from '../db/machineAssignStore.js';
import { isLcdDevice } from '../lib/deviceFilter.js';

/** 鑫之源 설비 목록 항목 → VMMS Machine 변환 */
function toMachine(raw: any) {
  return {
    funId: raw.funId,
    funCode: raw.funNumber || '',
    funName: raw.funName || '',
    funStatus: raw.funStatus ?? 0,
    lineStatus: raw.lineStatus ?? 0,
    address: raw.funAddress || '',
    deptId: raw.deptId ?? 0,
    deptName: raw.deptName || '',
    funWaring: raw.funWaring ?? 5,
    temperature: raw.funTemperature ?? null,
    goodsRoadCount: raw.goodsRoadCount ?? 0,
  };
}

/** 鑫之源 설비 상세 → VMMS MachineDetail 변환 */
function toMachineDetail(raw: any) {
  return {
    ...toMachine(raw),
    imei: raw.funImei || '',
    ip: raw.funIp || '',
    gpsX: raw.deliveryLongitude ?? 0,
    gpsY: raw.deliveryLatitude ?? 0,
    version: raw.funVersion || '',
    lockType: raw.isLock ?? 0,
    outGoodsType: raw.sellType ?? 0,
    refundType: raw.isRefund ?? 0,
    createTime: raw.createTime ?? 0,
    updateTime: raw.updateTime ?? 0,
    dataBalance: raw.dataBalance ?? 0,
    dataTrafficAmount: raw.dataTrafficAmount ?? 0,
  };
}

/** 鑫之源 화도(슬롯) → VMMS Road 변환 (상품 룩업맵으로 이름/가격 보강) */
function toRoad(raw: any, productMap?: Map<number, { name: string; price: number }>) {
  const goodsId = raw.goodsId ?? null;
  const product = goodsId ? productMap?.get(goodsId) : undefined;
  return {
    roadId: raw.roadId,
    roadCode: raw.roadName || `${raw.roadRow}-${raw.roadColumn}`,
    funId: raw.funId,
    goodsId,
    goodsName: product?.name || '',
    goodsPrice: product?.price ?? 0,
    stockCurr: raw.roadStock ?? 0,
    stockMax: raw.roadLoad ?? 0,
    roadRow: raw.roadRow ?? 0,
    roadColumn: raw.roadColumn ?? 0,
    isSale: goodsId ? 1 : 0,
    shelfDate: raw.shelfDate ?? null,
  };
}

/** 상품 목록에서 goodsId → {name, price} 룩업맵 생성 */
async function buildProductMap(xzy: XzyClient): Promise<Map<number, { name: string; price: number }>> {
  const map = new Map<number, { name: string; price: number }>();
  try {
    const rawData = await xzy.getProducts({ current: 1, size: 200 }) as any;
    const records = Array.isArray(rawData) ? rawData : (rawData?.records ?? []);
    for (const p of records) {
      if (p.goodsId) {
        map.set(p.goodsId, {
          name: p.goodsName || '',
          price: p.oldGoodsPrice ?? 0,
        });
      }
    }
  } catch {
    // 상품 조회 실패해도 슬롯 데이터는 반환
  }
  return map;
}

/** 자판기별 재고부족 여부 판정 (슬롯 중 하나라도 roadStock <= funWaring이면 true) */
async function checkLowStock(xzy: XzyClient, funId: number, funWaring: number): Promise<boolean> {
  try {
    const rawRoads = await xzy.getRoads(funId) as any[];
    return (rawRoads || []).some(
      (r) => r.goodsId && (r.roadStock ?? 0) <= funWaring,
    );
  } catch {
    return false;
  }
}

export function createMachineRoutes(xzy: XzyClient): Router {
  const router = Router();

  /** GET /api/machines — 설비 목록 (역할 기반 필터링, hasLowStock 포함) */
  router.get('/', async (req: Request, res: Response) => {
    try {
      const user = (req as AuthenticatedRequest).user;
      const rawData = await xzy.getMachines() as any;

      const rawList = Array.isArray(rawData) ? rawData : (rawData?.records ?? []);
      let machines = rawList.map(toMachine);

      // 자판기 LCD(디스플레이 전용 장비)는 자판기 목록에서 제외
      machines = machines.filter((m) => !isLcdDevice(m.funName, m.funCode));

      if (user.role !== 'admin') {
        const assignedIds = await machineAssignStore.getByUser(user.userId);
        machines = machines.filter((m) => assignedIds.includes(m.funId));
      }

      const lowStockResults = await Promise.allSettled(
        machines.map((m) => checkLowStock(xzy, m.funId, m.funWaring)),
      );
      const enriched = machines.map((m, i) => ({
        ...m,
        hasLowStock: lowStockResults[i].status === 'fulfilled' && lowStockResults[i].value,
      }));

      res.json({ success: true, data: enriched, timestamp: Date.now() });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      res.status(500).json({ success: false, error: message, timestamp: Date.now() });
    }
  });

  /** GET /api/machines/:funId — 설비 상세 (권한 확인) */
  router.get('/:funId', async (req: Request, res: Response) => {
    try {
      const user = (req as AuthenticatedRequest).user;
      const funId = Number(req.params.funId);
      if (isNaN(funId)) {
        res.status(400).json({ success: false, error: 'Invalid funId' });
        return;
      }

      if (user.role !== 'admin') {
        const assignedIds = await machineAssignStore.getByUser(user.userId);
        if (!assignedIds.includes(funId)) {
          res.status(403).json({ success: false, error: '접근 권한이 없는 자판기입니다.' });
          return;
        }
      }

      const raw = await xzy.getMachineById(funId);
      res.json({ success: true, data: toMachineDetail(raw), timestamp: Date.now() });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      res.status(500).json({ success: false, error: message, timestamp: Date.now() });
    }
  });

  /** GET /api/machines/:funId/roads — 화도(슬롯) 조회 (권한 확인) */
  router.get('/:funId/roads', async (req: Request, res: Response) => {
    try {
      const user = (req as AuthenticatedRequest).user;
      const funId = Number(req.params.funId);
      if (isNaN(funId)) {
        res.status(400).json({ success: false, error: 'Invalid funId' });
        return;
      }

      if (user.role !== 'admin') {
        const assignedIds = await machineAssignStore.getByUser(user.userId);
        if (!assignedIds.includes(funId)) {
          res.status(403).json({ success: false, error: '접근 권한이 없는 자판기입니다.' });
          return;
        }
      }

      const [rawRoads, productMap] = await Promise.all([
        xzy.getRoads(funId) as Promise<any[]>,
        buildProductMap(xzy),
      ]);
      const roads = (rawRoads || []).map((r) => toRoad(r, productMap));
      res.json({ success: true, data: roads, timestamp: Date.now() });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      res.status(500).json({ success: false, error: message, timestamp: Date.now() });
    }
  });

  return router;
}
