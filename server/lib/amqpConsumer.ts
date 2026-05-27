/**
 * AMQP 메시지 큐 소비자
 * 鑫之源 RabbitMQ 3개 큐 구독:
 *   - ko_fun_inventory_queue  → 재고 부족 알림
 *   - ko_fun_queue            → 설비 상태 변경
 *   - ko_fun_stock            → 보충 완료 통지
 *
 * 수신된 메시지를 EventEmitter로 내부 전파 → SSE로 클라이언트에 전달
 */

import amqplib, { type Connection, type Channel } from 'amqplib';
import { EventEmitter } from 'events';

export interface AmqpConfig {
  url: string;
  inventoryQueue: string;
  statusQueue: string;
  stockQueue: string;
}

export type AlertType = 'inventory' | 'status' | 'stock';

export interface AlertMessage {
  id: string;
  type: AlertType;
  payload: unknown;
  timestamp: number;
}

/**
 * AMQP Consumer — 鑫之源 MQ 구독 & 이벤트 방출
 * events: 'alert' (AlertMessage)
 */
export class AmqpConsumer extends EventEmitter {
  private config: AmqpConfig;
  private connection: Connection | null = null;
  private channel: Channel | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private isShuttingDown = false;
  private messageCount = 0;

  constructor(config: AmqpConfig) {
    super();
    this.config = config;
  }

  /** 연결 시작 (자동 재연결 포함) */
  async start(): Promise<void> {
    try {
      this.connection = await amqplib.connect(this.config.url);
      this.connection.on('error', (err) => {
        console.error('  [AMQP] Connection error:', err.message);
      });
      this.connection.on('close', () => {
        if (!this.isShuttingDown) {
          console.warn('  [AMQP] Connection closed, reconnecting in 5s...');
          this.scheduleReconnect();
        }
      });

      this.channel = await this.connection.createChannel();
      await this.channel.prefetch(10);

      // 3개 큐 구독
      await this.consumeQueue(this.config.inventoryQueue, 'inventory');
      await this.consumeQueue(this.config.statusQueue, 'status');
      await this.consumeQueue(this.config.stockQueue, 'stock');

      console.log('  [AMQP] Connected & consuming 3 queues');
      this.emit('connected');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  [AMQP] Connect failed: ${msg}`);
      this.scheduleReconnect();
    }
  }

  /** 개별 큐 구독 */
  private async consumeQueue(queue: string, type: AlertType): Promise<void> {
    if (!this.channel) return;

    // 큐가 존재하는지 확인 (assertQueue으로 선언하지 않고 checkQueue 사용)
    try {
      await this.channel.checkQueue(queue);
    } catch {
      console.warn(`  [AMQP] Queue not found: ${queue} — skipping`);
      return;
    }

    await this.channel.consume(
      queue,
      (msg) => {
        if (!msg) return;

        try {
          const content = msg.content.toString('utf8');
          const payload = JSON.parse(content);

          this.messageCount++;
          const alert: AlertMessage = {
            id: `${type}-${Date.now()}-${this.messageCount}`,
            type,
            payload,
            timestamp: Date.now(),
          };

          this.emit('alert', alert);
          this.channel?.ack(msg);
        } catch (parseErr) {
          console.error(`  [AMQP] Parse error (${queue}):`, parseErr);
          // 파싱 실패 메시지는 nack (requeue=false로 Dead Letter로 보냄)
          this.channel?.nack(msg, false, false);
        }
      },
      { noAck: false },
    );
  }

  /** 재연결 스케줄 */
  private scheduleReconnect(): void {
    if (this.reconnectTimer || this.isShuttingDown) return;
    this.reconnectTimer = setTimeout(async () => {
      this.reconnectTimer = null;
      await this.cleanup();
      await this.start();
    }, 5000);
  }

  /** 연결 정리 */
  private async cleanup(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close().catch(() => {});
        this.channel = null;
      }
      if (this.connection) {
        await this.connection.close().catch(() => {});
        this.connection = null;
      }
    } catch {
      // 정리 중 오류 무시
    }
  }

  /** 종료 */
  async stop(): Promise<void> {
    this.isShuttingDown = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    await this.cleanup();
    console.log('  [AMQP] Disconnected');
  }

  /** 상태 조회 */
  getStatus() {
    return {
      connected: !!this.connection && !!this.channel,
      messageCount: this.messageCount,
    };
  }
}
