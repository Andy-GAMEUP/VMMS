import { apiGet } from './client';
import type { SalesStat, SalesStatType } from '@/types';

export const salesApi = {
  /** 매출 통계 */
  getStats: (params: {
    statType: SalesStatType;
    startDate?: string;
    endDate?: string;
    funId?: number;
    deptId?: number;
  }) => apiGet<SalesStat[]>('/sales/stats', params),
};
