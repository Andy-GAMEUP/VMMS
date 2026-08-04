import { machineApi } from './machines';
import { salesApi } from './sales';
import { apiGet } from './client';
import { resolveDeviceStatus } from '@/types';
import type { Machine, DeviceStatusType } from '@/types';
import { startOfMonth, endOfDay } from 'date-fns';

export interface DashboardSummary {
  totalMachines: number;
  online: number;
  fault: number;
  offline: number;
  lowStockCount: number;
}

export interface DashboardData {
  mtdSales: number;
  mtdOrders: number;
  machines: Machine[];
  statusSummary: Record<DeviceStatusType, number>;
  totalMachines: number;
  lowStockCount: number;
}

export const dashboardApi = {
  /** 대시보드 데이터 조합 (MTD 매출 + 장비 요약) */
  getData: async (): Promise<DashboardData> => {
    const now = new Date();
    const [machines, salesStats, summary] = await Promise.all([
      machineApi.getAll(),
      salesApi.getStats({
        startTime: startOfMonth(now).getTime(),
        endTime: endOfDay(now).getTime(),
      }),
      apiGet<DashboardSummary>('/dashboard/summary'),
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
      statusSummary,
      totalMachines: machines.length,
      lowStockCount: summary.lowStockCount,
    };
  },
};
