/**
 * 메시지 큐(AMQP) 수신 타입 정의
 * 鑫之源 MQ: ko_fun_inventory_queue / ko_fun_queue / ko_fun_stock
 *
 * 주의: MQ의 funStatus 값(1:정상, 2:고장, 3:정지)은
 *       REST API의 funStatus(0:정상, 1:고장)와 다름
 */

/** 재고 부족 알림 — ko_fun_inventory_queue */
export interface InventoryAlert {
  funId: number;
  funCode: string;
  funName: string;
  roadCode: string; // 화도 코드
  goodsName: string;
  stockCurr: number; // 현재 재고
  funWaring: number; // 예경값
  timestamp: number; // Unix ms
}

/** 설비 상태 변경 — ko_fun_queue */
export interface DeviceStatusMessage {
  funId: number;
  funCode: string;
  funName: string;
  funStatus: number; // MQ: 1=정상, 2=고장, 3=정지
  lineStatus: number; // 0=온라인, 1=오프라인
  timestamp: number;
}

/** 보충 완료 통지 — ko_fun_stock */
export interface StockUpdateMessage {
  funId: number;
  funCode: string;
  roadCode: string;
  goodsName: string;
  stockBefore: number;
  stockAfter: number;
  timestamp: number;
}

/** MQ funStatus → VMMS 상태 매핑 (REST API와 다름!) */
export function resolveMqDeviceStatus(mqFunStatus: number): 'online' | 'fault' | 'stopped' {
  switch (mqFunStatus) {
    case 1: return 'online';
    case 2: return 'fault';
    case 3: return 'stopped';
    default: return 'online';
  }
}

/** 앱 내 알림 통합 타입 */
export interface Notification {
  id: string;
  type: 'inventory' | 'status' | 'stock';
  title: string;
  body: string;
  funId: number;
  funName: string;
  timestamp: number;
  isRead: boolean;
}
