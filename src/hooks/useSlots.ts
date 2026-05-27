import { useQuery } from '@tanstack/react-query';
import { machineApi } from '@/api/machines';

/** 설비별 화도(슬롯) 조회 */
export function useSlots(funId: number | undefined) {
  return useQuery({
    queryKey: ['roads', funId],
    queryFn: () => machineApi.getRoads(funId!),
    enabled: !!funId,
  });
}
