import { machineApi } from './machines';
import { salesApi } from './sales';
import { resolveDeviceStatus } from '@/types';
import type { Machine, DeviceStatusType } from '@/types';

export interface DashboardData {
  todaySales: number; // 원(元) 단위
  todayOrders: number;
  machines: Machine[];
  statusSummary: Record<DeviceStatusType, number>;
  totalMachines: number;
}

export const dashboardApi = {
  /** 대시보드 데이터 조합 */
  getData: async (): Promise<DashboardData> => {
    const [machines, salesStats] = await Promise.all([
      machineApi.getAll(),
      salesApi.getStats({ statType: 'day' }),
    ]);

    // 설비 상태 집계
    const statusSummary: Record<DeviceStatusType, number> = { online: 0, offline: 0, fault: 0, stopped: 0 };
    for (const m of machines) {
      const status = resolveDeviceStatus(m.funStatus, m.lineStatus);
      statusSummary[status]++;
    }

    // 오늘 매출 합산
    const todaySales = salesStats.reduce((sum, s) => sum + s.decTotalOrderMoney, 0);
    const todayOrders = salesStats.reduce((sum, s) => sum + s.totalOrderNumber, 0);

    return {
      todaySales,
      todayOrders,
      machines,
      statusSummary,
      totalMachines: machines.length,
    };
  },
};
