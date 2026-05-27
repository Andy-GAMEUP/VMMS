import { useQuery } from '@tanstack/react-query';
import { machineApi } from '@/api/machines';

/** 전체 설비 목록 */
export function useMachines() {
  return useQuery({
    queryKey: ['machines'],
    queryFn: machineApi.getAll,
  });
}

/** 설비 상세 */
export function useMachineDetail(funId: number | undefined) {
  return useQuery({
    queryKey: ['machine', funId],
    queryFn: () => machineApi.getById(funId!),
    enabled: !!funId,
  });
}
