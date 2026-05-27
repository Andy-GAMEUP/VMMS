/**
 * 자판기(설비) 타입 정의
 * 鑫之源 API: getFunByDept (V1.1) / getFunById (V1.1)
 */

/** getFunByDept 응답 — 설비 리스트 항목 */
export interface Machine {
  funId: number;
  funCode: string;
  funName: string;
  funStatus: number; // REST: 0=정상, 1=고장
  lineStatus: number; // 0=온라인, 1=오프라인
  address: string;
  deptId: number;
  deptName: string;
  funWaring: number; // 재고 예경값
  temperature: number;
  goodsRoadCount: number;
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

/** REST API funStatus + lineStatus → VMMS 상태 */
export function resolveDeviceStatus(funStatus: number, lineStatus: number): DeviceStatusType {
  if (funStatus === 1) return 'fault';
  if (lineStatus === 1) return 'offline';
  return 'online';
}

/** 상태별 표시 정보 */
export const DEVICE_STATUS_MAP: Record<DeviceStatusType, { label: string; color: string; dotClass: string }> = {
  online: { label: '정상 운영', color: 'success', dotClass: 'status-dot--online' },
  offline: { label: '네트워크 이상', color: 'warning', dotClass: 'status-dot--offline' },
  fault: { label: '설비 고장', color: 'danger', dotClass: 'status-dot--fault' },
  stopped: { label: '운영 정지', color: 'gray', dotClass: 'status-dot--stopped' },
};
