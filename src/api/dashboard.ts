import { machineApi } from './machines';
import { salesApi, type MachineSalesData, type TopProductData } from './sales';
import { apiGet } from './client';
import { resolveDeviceStatus } from '@/types';
import type { Machine, DeviceStatusType } from '@/types';
import { startOfMonth, endOfDay } from 'date-fns';

export interface DashboardSummary {
  totalMachines: number;
  online: number;
  offline: number;
  fault: number;
  stopped: number;
  lowStockCount: number;
}

export interface DashboardData {
  mtdSales: number;
  mtdOrders: number;
  machines: Machine[];
  /** 자판기별 당월 매출 — 매출 내림차순 정렬 */
  machineSales: MachineSalesData[];
  /** 당월 인기 상품 — 판매 건수 내림차순 (서버 집계) */
  topProducts: TopProductData[];
  statusSummary: Record<DeviceStatusType, number>;
  totalMachines: number;
  lowStockCount: number;
}

export const dashboardApi = {
  /** 대시보드 데이터 조합 (MTD 매출 + 장비 요약) */
  getData: async (): Promise<DashboardData> => {
    const now = new Date();
    const mtdRange = {
      startTime: startOfMonth(now).getTime(),
      endTime: endOfDay(now).getTime(),
    };
    const [machines, salesStats, summary, machineSales, topProducts] = await Promise.all([
      machineApi.getAll(),
      salesApi.getStats(mtdRange),
      apiGet<DashboardSummary>('/dashboard/summary'),
      salesApi.getByMachine(mtdRange),
      salesApi.getTopProducts({ ...mtdRange, limit: 5 }),
    ]);

    const statusSummary: Record<DeviceStatusType, number> = { online: 0, offline: 0, fault: 0, stopped: 0 };
    for (const m of machines) {
      const status = resolveDeviceStatus(m.funStatus, m.lineStatus);
      statusSummary[status]++;
    }

    const mtdSales = salesStats.reduce((sum, s) => sum + s.decTotalOrderMoney, 0);
    const mtdOrders = salesStats.reduce((sum, s) => sum + s.totalOrderNumber, 0);

    return {
      mtdSales,
      mtdOrders,
      machines,
      machineSales: [...machineSales].sort((a, b) => b.totalSales - a.totalSales),
      topProducts,
      statusSummary,
      totalMachines: machines.length,
      lowStockCount: summary.lowStockCount,
    };
  },
};
