import { useQuery } from '@tanstack/react-query';
import { salesApi } from '@/api/sales';
import type { SalesStatType } from '@/types';

/** 매출 통계 */
export function useSalesStats(params: {
  statType: SalesStatType;
  startDate?: string;
  endDate?: string;
  funId?: number;
}) {
  return useQuery({
    queryKey: ['sales', params],
    queryFn: () => salesApi.getStats(params),
  });
}
