/**
 * 자판기(설비) 타입 정의
 * 鑫之源 API: getFunByDept (V1.1) / getFunById (V1.1)
 */

/** getFunByDept 응답 — 설비 리스트 항목 */
export interface Machine {
  funId: number;
  funCode: string;
  funName: string;
  funStatus: number; // 0=온라인, 1=오프라인
  lineStatus: number; // 0=온라인, 1=오프라인
  address: string;
  deptId: number;
  deptName: string;
  funWaring: number; // 재고 예경값
  temperature: number;
  goodsRoadCount: number;
  hasLowStock?: boolean;
}

/** getFunById 응답 — 설비 상세 */
export interface MachineDetail extends Machine {
  imei: string;
  ip: string;
  gpsX: string;
  gpsY: string;
  version: string;
  lockType: number;
  outGoodsType: number;
  refundType: number;
  createTime: number; // Unix ms
  updateTime: number; // Unix ms
}

/** VMMS 내부 설비 상태 */
export type DeviceStatusType = 'online' | 'offline' | 'fault' | 'stopped';

/**
 * funStatus + lineStatus → VMMS 상태
 *
 * 두 벤더 문서가 funStatus를 다르게 정의한다:
 *   REST 문서 3.1.1 : 0=온라인, 1=오프라인
 *   MQ   문서 3.2   : 1=정상, 2=고장, 3=정지
 * 반면 lineStatus는 양쪽 문서가 0=온라인, 1=오프라인으로 동일하게 정의한다.
 *
 * 따라서 접속 여부는 정의가 일치하는 lineStatus로만 판정하고,
 * funStatus는 MQ 문서에만 존재하는 2(고장)/3(정지)일 때만 사용한다.
 * REST 해석이 맞더라도 2/3은 내려오지 않으므로 어느 쪽이든 오판이 없다.
 *
 * 운영 확인(2026-08): 자판기 4대 모두 funStatus=1, lineStatus=1 →
 * MQ 문서의 "설비 정상이나 오프라인(네트워크 문제)" 조합.
 */
export function resolveDeviceStatus(funStatus: number, lineStatus: number): DeviceStatusType {
  if (funStatus === 2) return 'fault';   // 설비 고장 — 접속 여부보다 우선 표시
  if (funStatus === 3) return 'stopped'; // 인위적 운영 정지
  return lineStatus === 1 ? 'offline' : 'online';
}

/** 상태별 표시 정보 */
export const DEVICE_STATUS_MAP: Record<DeviceStatusType, { label: string; color: string; dotClass: string }> = {
  online: { label: '정상 운영', color: 'success', dotClass: 'status-dot--online' },
  offline: { label: '네트워크 이상', color: 'warning', dotClass: 'status-dot--offline' },
  fault: { label: '설비 고장', color: 'danger', dotClass: 'status-dot--fault' },
  stopped: { label: '운영 정지', color: 'gray', dotClass: 'status-dot--stopped' },
};
