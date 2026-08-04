import { apiGet } from './client';
import type { SalesStat } from '@/types';

export interface MachineSalesData {
  funId: number;
  funName: string;
  funStatus: number;
  lineStatus: number;
  totalSales: number;
  totalOrders: number;
}

export const salesApi = {
  /** 매출 통계 (statType 제거됨 — 鑫之源 2026-05-29 회신) */
  getStats: (params: {
    startTime: number;
    endTime: number;
    goodsId?: number;
    funId?: number;
  }) => apiGet<SalesStat[]>('/sales/stats', params),

  /** 자판기별 매출 집계 */
  getByMachine: (params: {
    startTime: number;
    endTime: number;
  }) => apiGet<MachineSalesData[]>('/sales/by-machine', params),
};
