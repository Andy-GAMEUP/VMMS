/**
 * REST API 폴링 기반 알림 생성기
 * AMQP 없이 XZY REST API를 주기적으로 호출하여
 * 설비 상태 변경 / 재고 부족 / 보충 완료를 감지하고
 * 기존 SSE 파이프라인으로 알림을 전달한다.
 */

import type { XzyClient } from './xzyClient.js';
import type { AmqpConsumer, AlertMessage, AlertType } from './amqpConsumer.js';

interface MachineSnapshot {
  funId: number;
  funNumber: string;
  funName: string;
  funStatus: number;
  lineStatus: number;
  funWaring: number;
}

interface RoadSnapshot {
  roadId: number;
  roadRow: number;
  roadColumn: number;
  roadStock: number;
  roadLoad: number;
  goodsId: number;
  roadName?: string;
}

export class StatusPoller {
  private xzy: XzyClient;
  private emitter: AmqpConsumer;
  private intervalMs: number;
  private timer: ReturnType<typeof setInterval> | null = null;
  private prevMachines = new Map<number, MachineSnapshot>();
  private prevRoads = new Map<string, RoadSnapshot>();
  private alertCount = 0;
  private firstPollDone = false;
  private lastPollAt = 0;
  private pollErrors = 0;

  constructor(xzy: XzyClient, emitter: AmqpConsumer, intervalMinutes = 5) {
    this.xzy = xzy;
    this.emitter = emitter;
    this.intervalMs = intervalMinutes * 60 * 1000;
  }

  start() {
    this.poll().catch((err) =>
      console.error('  [Poller] Initial poll failed:', err.message),
    );
    this.timer = setInterval(() => {
      this.poll().catch((err) =>
        console.error('  [Poller] Poll failed:', err.message),
      );
    }, this.intervalMs);
    console.log(`  [Poller] Started (interval: ${this.intervalMs / 60000}min)`);
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    console.log('  [Poller] Stopped');
  }

  private async poll() {
    try {
      const machines = (await this.xzy.getMachines()) as MachineSnapshot[];
      if (!Array.isArray(machines) || machines.length === 0) return;

      for (const m of machines) {
        const prev = this.prevMachines.get(m.funId);

        if (this.firstPollDone && prev) {
          if (prev.funStatus !== m.funStatus || prev.lineStatus !== m.lineStatus) {
            this.emit('status', {
              funId: m.funId,
              funCode: m.funNumber,
              funName: m.funName,
              funStatus: m.funStatus,
              lineStatus: m.lineStatus,
            });
          }
        }

        await this.pollRoads(m, prev);
        this.prevMachines.set(m.funId, m);
      }

      this.firstPollDone = true;
      this.lastPollAt = Date.now();
      this.pollErrors = 0;
    } catch (err) {
      this.pollErrors++;
      throw err;
    }
  }

  private async pollRoads(machine: MachineSnapshot, prevMachine: MachineSnapshot | undefined) {
    let roads: RoadSnapshot[];
    try {
      roads = (await this.xzy.getRoads(machine.funId)) as RoadSnapshot[];
      if (!Array.isArray(roads)) return;
    } catch {
      return;
    }

    for (const road of roads) {
      const key = `${machine.funId}-${road.roadId}`;
      const prevRoad = this.prevRoads.get(key);
      const roadCode = `${road.roadRow}-${road.roadColumn}`;

      if (this.firstPollDone && prevRoad) {
        if (
          machine.funWaring > 0 &&
          road.roadStock <= machine.funWaring &&
          prevRoad.roadStock > machine.funWaring
        ) {
          this.emit('inventory', {
            funId: machine.funId,
            funCode: machine.funNumber,
            funName: machine.funName,
            roadCode,
            goodsName: road.roadName ?? '상품',
            stockCurr: road.roadStock,
            funWaring: machine.funWaring,
            roadLoad: road.roadLoad,
          });
        }

        if (road.roadStock > prevRoad.roadStock) {
          this.emit('stock', {
            funId: machine.funId,
            funCode: machine.funNumber,
            funName: machine.funName,
            roadCode,
            goodsName: road.roadName ?? '상품',
            stockBefore: prevRoad.roadStock,
            stockAfter: road.roadStock,
          });
        }
      }

      this.prevRoads.set(key, road);
    }
  }

  private emit(type: AlertType, payload: Record<string, unknown>) {
    this.alertCount++;
    const alert: AlertMessage = {
      id: `poll-${type}-${Date.now()}-${this.alertCount}`,
      type,
      payload,
      timestamp: Date.now(),
    };
    this.emitter.emit('alert', alert);
    console.log(`  [Poller] Alert: ${type} — ${payload.funName ?? payload.funCode}`);
  }

  getStatus() {
    return {
      running: !!this.timer,
      machineCount: this.prevMachines.size,
      roadCount: this.prevRoads.size,
      alertCount: this.alertCount,
      lastPollAt: this.lastPollAt,
      pollErrors: this.pollErrors,
      intervalMinutes: this.intervalMs / 60000,
    };
  }
}
