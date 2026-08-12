/**
 * 장비 상태 판정 — src/types/machine.ts 의 resolveDeviceStatus 와 동일 규칙
 * (server/ 와 src/ 는 tsconfig가 분리되어 있어 코드를 공유하지 않는다.
 *  한쪽을 바꾸면 반드시 다른 쪽도 함께 바꿀 것)
 *
 * 두 벤더 문서가 funStatus를 다르게 정의한다:
 *   REST 문서 3.1.1 : 0=온라인, 1=오프라인
 *   MQ   문서 3.2   : 1=정상, 2=고장, 3=정지
 * lineStatus는 양쪽 문서가 0=온라인, 1=오프라인으로 동일하다.
 *
 * 접속 여부는 정의가 일치하는 lineStatus로만 판정하고,
 * funStatus는 MQ 문서에만 있는 2(고장)/3(정지)일 때만 사용한다.
 */

export type DeviceStatus = 'online' | 'offline' | 'fault' | 'stopped';

export function resolveDeviceStatus(funStatus: number, lineStatus: number): DeviceStatus {
  if (funStatus === 2) return 'fault';
  if (funStatus === 3) return 'stopped';
  return lineStatus === 1 ? 'offline' : 'online';
}

export interface StatusCounts {
  online: number;
  offline: number;
  fault: number;
  stopped: number;
}

export function countByStatus(
  machines: Array<{ funStatus?: number; lineStatus?: number }>,
): StatusCounts {
  const counts: StatusCounts = { online: 0, offline: 0, fault: 0, stopped: 0 };
  for (const m of machines) {
    counts[resolveDeviceStatus(m.funStatus ?? 0, m.lineStatus ?? 0)]++;
  }
  return counts;
}
