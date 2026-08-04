/**
 * VMMS BFF 서버
 * - 鑫之源 REST API 프록시 (MD5 서명 자동 생성)
 * - AMQP 메시지 큐 소비자 (실시간 알림)
 * - SSE 스트림 (클라이언트 실시간 전달)
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { XzyClient } from './lib/xzyClient.js';
import { AmqpConsumer } from './lib/amqpConsumer.js';
import { createMachineRoutes } from './routes/machines.js';
import { createProductRoutes } from './routes/products.js';
import { createSalesRoutes } from './routes/sales.js';
import { createUserRoutes, createDeptRoutes } from './routes/users.js';
import { createAuthRoutes } from './routes/auth.js';
import { createAdminRoutes } from './routes/admin.js';
import { createNotificationRoutes } from './routes/notifications.js';
import { createChatRoutes } from './routes/chat.js';
import { createDashboardRoutes } from './routes/dashboard.js';
import { authMiddleware } from './lib/auth.js';
import { hashPassword } from './lib/auth.js';
import { StatusPoller } from './lib/statusPoller.js';
import { userStore } from './db/userStore.js';
import { chatStore } from './db/chatStore.js';

// ===== 환경 변수 검증 =====
const requiredEnvs = ['XZY_APP_ID', 'XZY_API_KEY', 'XZY_API_BASE_V11', 'XZY_API_BASE_V12'] as const;
for (const key of requiredEnvs) {
  if (!process.env[key]) {
    console.error(`[ERROR] Missing env: ${key}`);
    process.exit(1);
  }
}

// ===== 鑫之源 클라이언트 초기화 =====
const xzy = new XzyClient({
  appId: Number(process.env.XZY_APP_ID),
  apiKey: process.env.XZY_API_KEY!,
  baseV11: process.env.XZY_API_BASE_V11!,
  baseV12: process.env.XZY_API_BASE_V12!,
});

// ===== AMQP Consumer 초기화 =====
const amqpConsumer = new AmqpConsumer({
  url: process.env.XZY_AMQP_URL || '',
  inventoryQueue: process.env.XZY_AMQP_INVENTORY_QUEUE || 'ko_fun_inventory_queue',
  statusQueue: process.env.XZY_AMQP_STATUS_QUEUE || 'ko_fun_queue',
  stockQueue: process.env.XZY_AMQP_STOCK_QUEUE || 'ko_fun_stock',
});

// ===== Express 앱 =====
const app = express();
const PORT = Number(process.env.PORT) || Number(process.env.BFF_PORT) || 4000;

// 미들웨어
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  ...(process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : []),
];
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 요청 로깅
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ===== API 라우트 =====

// 인증 라우트 (공개)
app.use('/api/auth', createAuthRoutes(xzy));

// 회원가입 시 부서 목록 조회 (공개 — 인증 불필요)
app.get('/api/public/departments', async (_req, res) => {
  try {
    const depts = await xzy.getDepartments();
    res.json({ success: true, data: depts });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ success: false, error: message });
  }
});

// Admin 전용 라우트
app.use('/api/admin', authMiddleware, createAdminRoutes(xzy));

// 대시보드 요약 (인증 필요)
app.use('/api/dashboard', authMiddleware, createDashboardRoutes(xzy));

// 보호된 라우트 (JWT 인증 필요)
app.use('/api/machines', authMiddleware, createMachineRoutes(xzy));
app.use('/api/products', authMiddleware, createProductRoutes(xzy));
app.use('/api/sales', authMiddleware, createSalesRoutes(xzy));
app.use('/api/users', authMiddleware, createUserRoutes(xzy));
app.use('/api/departments', authMiddleware, createDeptRoutes(xzy));
app.use('/api/notifications', authMiddleware, createNotificationRoutes(amqpConsumer));
app.use('/api/chat', authMiddleware, createChatRoutes());

// 헬스 체크
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    version: '0.1.0',
    timestamp: Date.now(),
    env: process.env.NODE_ENV || 'development',
  });
});

// ===== Admin 시드 & 서버 시작 =====
async function bootstrap() {
  // 초기 admin 계정 시드
  const adminHash = await hashPassword('admin1234');
  const seeded = await userStore.seedAdmin(adminHash);
  if (seeded) {
    console.log('  [BOOT] 초기 admin 계정 생성 완료 (admin@vmms.local / admin1234)');
  }

  // 테스트용 매니저 계정 시드
  const testHash = await hashPassword('test1234');
  const testCreated = await userStore.seedTestUsers(testHash);
  if (testCreated > 0) {
    console.log(`  [BOOT] 테스트 계정 ${testCreated}개 생성 완료 (test@vmms.local / test1234)`);
  }

  // 채팅 시드 데이터
  const allUsers = await userStore.findAll();
  await chatStore.seed('admin-001', allUsers.map((u) => ({ id: u.id, name: u.name, role: u.role })));

  // AMQP 연결 시작 (실패해도 서버는 기동)
  if (process.env.XZY_AMQP_URL) {
    amqpConsumer.start().catch((err) => {
      console.error('  [BOOT] AMQP 초기 연결 실패 (백그라운드 재연결 시도):', err);
    });
  } else {
    console.warn('  [BOOT] XZY_AMQP_URL 미설정 → AMQP 비활성');
  }

  // REST API 폴링 알림 (AMQP 보완/대체)
  const pollerInterval = Number(process.env.POLLER_INTERVAL_MIN) || 5;
  const poller = new StatusPoller(xzy, amqpConsumer, pollerInterval);
  poller.start();
  pollerRef = poller;

  app.listen(PORT, () => {
    console.log(`\n  VMMS BFF Server`);
    console.log(`  ─────────────────────────────`);
    console.log(`  Local:   http://localhost:${PORT}`);
    console.log(`  Health:  http://localhost:${PORT}/api/health`);
    console.log(`  Auth:    http://localhost:${PORT}/api/auth/login`);
    console.log(`  SSE:     http://localhost:${PORT}/api/notifications/stream`);
    console.log(`  鑫之源:  appId=${process.env.XZY_APP_ID}`);
    console.log(`  AMQP:    ${process.env.XZY_AMQP_URL ? '연결 시도 중' : '비활성'}`);
    console.log(`  Poller:  ${pollerInterval}분 간격`);
    console.log(`  ─────────────────────────────\n`);
  });
}

// Graceful shutdown — poller 참조를 위해 모듈 스코프 변수 사용
let pollerRef: StatusPoller | null = null;

process.on('SIGINT', async () => {
  console.log('\n  [SHUTDOWN] Graceful shutdown...');
  pollerRef?.stop();
  await amqpConsumer.stop();
  process.exit(0);
});

bootstrap().catch((err) => {
  console.error('[FATAL] 서버 시작 실패:', err);
  process.exit(1);
});

export default app;
