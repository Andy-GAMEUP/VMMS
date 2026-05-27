/**
 * 실시간 알림 라우트
 * GET  /api/notifications/stream  — SSE 스트림 (실시간 알림 수신)
 * GET  /api/notifications/history — 최근 알림 목록
 * GET  /api/notifications/status  — AMQP 연결 상태
 */

import { Router, type Request, type Response } from 'express';
import type { AmqpConsumer, AlertMessage, AlertType } from '../lib/amqpConsumer.js';
import type { AuthenticatedRequest } from '../lib/auth.js';

/** 알림 메시지 → 클라이언트용 Notification 변환 */
function formatAlert(alert: AlertMessage) {
  const { type, payload, id, timestamp } = alert;
  const p = payload as Record<string, unknown>;

  let title = '';
  let body = '';
  const funId = (p.funId as number) ?? 0;
  const funName = (p.funName as string) ?? `설비 ${funId}`;

  switch (type) {
    case 'inventory':
      title = '재고 부족';
      body = `${funName} [${p.roadCode ?? ''}] ${p.goodsName ?? '상품'} — 현재 ${p.stockCurr ?? 0}개 (경고: ${p.funWaring ?? 0}개 이하)`;
      break;
    case 'status': {
      const statusMap: Record<number, string> = { 1: '정상', 2: '고장', 3: '정지' };
      const lineMap: Record<number, string> = { 0: '온라인', 1: '오프라인' };
      const funStatus = statusMap[(p.funStatus as number) ?? 1] ?? '알 수 없음';
      const lineStatus = lineMap[(p.lineStatus as number) ?? 0] ?? '알 수 없음';
      title = '설비 상태 변경';
      body = `${funName} — ${funStatus} / ${lineStatus}`;
      break;
    }
    case 'stock':
      title = '보충 완료';
      body = `${funName} [${p.roadCode ?? ''}] ${p.goodsName ?? '상품'} — ${p.stockBefore ?? 0} → ${p.stockAfter ?? 0}개`;
      break;
  }

  return { id, type, title, body, funId, funName, timestamp, isRead: false };
}

// 최근 알림 히스토리 (메모리 버퍼, 최대 200개)
const alertHistory: ReturnType<typeof formatAlert>[] = [];
const MAX_HISTORY = 200;

export function createNotificationRoutes(amqpConsumer: AmqpConsumer): Router {
  const router = Router();

  // SSE 연결 클라이언트 관리
  const clients = new Set<Response>();

  // AMQP 알림 수신 → SSE 브로드캐스트
  amqpConsumer.on('alert', (alert: AlertMessage) => {
    const formatted = formatAlert(alert);

    // 히스토리에 추가
    alertHistory.unshift(formatted);
    if (alertHistory.length > MAX_HISTORY) alertHistory.length = MAX_HISTORY;

    // 모든 SSE 클라이언트에 전송
    const data = JSON.stringify(formatted);
    for (const client of clients) {
      client.write(`event: alert\ndata: ${data}\n\n`);
    }
  });

  // ─── GET /stream — SSE 실시간 스트림 ───────────────
  router.get('/stream', (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;

    // SSE 헤더 설정
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no', // nginx proxy 용
    });

    // 연결 확인 메시지
    res.write(`event: connected\ndata: ${JSON.stringify({ userId: user?.userId, timestamp: Date.now() })}\n\n`);

    clients.add(res);
    console.log(`  [SSE] Client connected (total: ${clients.size})`);

    // 30초마다 keepalive ping
    const keepalive = setInterval(() => {
      res.write(`:keepalive ${Date.now()}\n\n`);
    }, 30000);

    // 연결 종료 처리
    req.on('close', () => {
      clearInterval(keepalive);
      clients.delete(res);
      console.log(`  [SSE] Client disconnected (total: ${clients.size})`);
    });
  });

  // ─── GET /history — 최근 알림 조회 ─────────────────
  router.get('/history', (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const limit = Math.min(Number(req.query.limit) || 50, MAX_HISTORY);
    const typeFilter = req.query.type as AlertType | undefined;

    let results = alertHistory;

    // 부서 필터링 (admin이 아니면 자기 부서 설비만)
    // TODO: deptId → funId 매핑 (Phase 2 고도화)

    // 타입 필터
    if (typeFilter) {
      results = results.filter((n) => n.type === typeFilter);
    }

    res.json({
      success: true,
      data: results.slice(0, limit),
      meta: { total: results.length, deptId: user?.deptId },
    });
  });

  // ─── GET /status — AMQP 연결 상태 ─────────────────
  router.get('/status', (_req: Request, res: Response) => {
    const status = amqpConsumer.getStatus();
    res.json({
      success: true,
      data: {
        ...status,
        sseClients: clients.size,
        historySize: alertHistory.length,
      },
    });
  });

  // ─── POST /test — 테스트 알림 발송 (개발용) ─────────
  if (process.env.NODE_ENV !== 'production') {
    router.post('/test', (req: Request, res: Response) => {
      const { type = 'inventory' } = req.body as { type?: AlertType };

      const testPayloads: Record<AlertType, Record<string, unknown>> = {
        inventory: {
          funId: 1001,
          funCode: 'VM-001',
          funName: '강남역 1번출구',
          roadCode: 'A-03',
          goodsName: '코카콜라 350ml',
          stockCurr: 2,
          funWaring: 5,
        },
        status: {
          funId: 1001,
          funCode: 'VM-001',
          funName: '강남역 1번출구',
          funStatus: 2, // 고장
          lineStatus: 0, // 온라인
        },
        stock: {
          funId: 1001,
          funCode: 'VM-001',
          funName: '강남역 1번출구',
          roadCode: 'A-03',
          goodsName: '코카콜라 350ml',
          stockBefore: 2,
          stockAfter: 10,
        },
      };

      const alert: AlertMessage = {
        id: `test-${type}-${Date.now()}`,
        type,
        payload: testPayloads[type],
        timestamp: Date.now(),
      };

      // AMQP 수신과 동일한 경로로 처리
      amqpConsumer.emit('alert', alert);

      res.json({ success: true, message: `테스트 알림 발송 (${type})`, data: alert });
    });
  }

  return router;
}
