import { apiGet } from './client';
import type { Machine, MachineDetail } from '@/types';
import type { Road } from '@/types';

export const machineApi = {
  /** 전체 설비 목록 */
  getAll: () => apiGet<Machine[]>('/machines'),

  /** 설비 상세 */
  getById: (funId: number) => apiGet<MachineDetail>(`/machines/${funId}`),

  /** 화도(슬롯) 조회 */
  getRoads: (funId: number) => apiGet<Road[]>(`/machines/${funId}/roads`),
};
