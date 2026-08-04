import { useQuery } from '@tanstack/react-query';
import { salesApi } from '@/api/sales';

/** 매출 통계 (statType 제거됨 — 鑫之源 2026-05-29 회신) */
export function useSalesStats(params: {
  startTime: number;
  endTime: number;
  goodsId?: number;
}) {
  return useQuery({
    queryKey: ['sales', params],
    queryFn: () => salesApi.getStats(params),
    enabled: params.startTime > 0 && params.endTime > 0,
  });
}
