/**
 * /api/sales 라우트 통합 테스트
 * 鑫之源 API는 스텁으로 대체하고 BFF의 변환/필터/집계 동작만 검증한다.
 */

import '../testSetup.js'; // supabase 모듈 로드 전에 환경변수를 채운다 (import 순서 유지)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import type { AddressInfo } from 'node:net';
import type { XzyClient } from '../lib/xzyClient.js';
import { createSalesRoutes } from './sales.js';

/** countInfo 응답 — 상품별 행 (API 문서 3.6 구조) */
const SALES_ROWS = [
  { goodsId: 2001, fileUrl: 'http://img/2001.jpg', decTotalOrderMoney: 1500, totalOrderNumber: 100 },
  { goodsId: 2002, fileUrl: '', decTotalOrderMoney: 9000, totalOrderNumber: 40 },
  { goodsId: 2003, fileUrl: '', decTotalOrderMoney: 300, totalOrderNumber: 250 },
];

/** getFunByDept 응답 — LCD 3대 + 자판기 2대 */
const MACHINES = [
  { funId: 1, funNumber: 'F1', funName: '자판기1_65인치_20250993', funStatus: 0, lineStatus: 0 },
  { funId: 2, funNumber: 'F2', funName: '자판기1_20250994', funStatus: 0, lineStatus: 0 },
  { funId: 3, funNumber: 'F3', funName: '자판기2_65인치_20250989', funStatus: 0, lineStatus: 1 },
  { funId: 4, funNumber: 'F4', funName: '자판기2_20250992', funStatus: 0, lineStatus: 0 },
  { funId: 5, funNumber: 'F5', funName: '자판기4_65인치_20250996', funStatus: 0, lineStatus: 0 },
];

const PRODUCTS = {
  records: [
    { goodsId: 2001, goodsName: '코카콜라 제로 355ml', oldGoodsPrice: 1500, fileUrl: '' },
    { goodsId: 2002, goodsName: '아메리카노 HOT', oldGoodsPrice: 2000, fileUrl: 'http://img/2002.jpg' },
    // 2003은 상품 목록에 없음 → 대체 표기 확인용
  ],
  pages: 1,
};

interface StubCalls { salesArgs: any[] }

function makeApp(): { app: express.Express; calls: StubCalls } {
  const calls: StubCalls = { salesArgs: [] };

  const xzy = {
    getSalesStats: async (params: any) => {
      calls.salesArgs.push(params);
      // funId 지정 시 자판기별 매출, 미지정 시 전체 상품별 매출
      if (params.funId) {
        return [{ goodsId: 2001, decTotalOrderMoney: params.funId * 100, totalOrderNumber: params.funId }];
      }
      return SALES_ROWS;
    },
    getMachines: async () => MACHINES,
    getProducts: async () => PRODUCTS,
  } as unknown as XzyClient;

  const app = express();
  // authMiddleware 대체 — admin 사용자로 고정
  app.use((req, _res, next) => {
    (req as any).user = { userId: 'admin-001', role: 'admin' };
    next();
  });
  app.use('/api/sales', createSalesRoutes(xzy));
  return { app, calls };
}

async function request(app: express.Express, path: string) {
  const server = app.listen(0);
  try {
    const { port } = server.address() as AddressInfo;
    const res = await fetch(`http://127.0.0.1:${port}${path}`);
    return { status: res.status, body: await res.json() as any };
  } finally {
    server.close();
  }
}

const RANGE = 'startTime=1754006400000&endTime=1755302400000';

test('GET /top-products — 판매 건수 상위 순으로 상품명과 함께 돌려준다', async () => {
  const { app } = makeApp();
  const { status, body } = await request(app, `/api/sales/top-products?${RANGE}`);

  assert.equal(status, 200);
  assert.equal(body.success, true);
  assert.deepEqual(
    body.data.map((p: any) => [p.goodsName, p.totalOrders]),
    [
      ['상품 #2003', 250],           // 상품 목록에 없어 대체 표기
      ['코카콜라 제로 355ml', 100],
      ['아메리카노 HOT', 40],
    ],
  );
});

test('GET /top-products — limit을 적용하고 상한을 넘지 않는다', async () => {
  const { app } = makeApp();

  const limited = await request(app, `/api/sales/top-products?${RANGE}&limit=2`);
  assert.equal(limited.body.data.length, 2);

  // limit=999 → 상한 50으로 클램프되며 에러 없이 응답
  const huge = await request(app, `/api/sales/top-products?${RANGE}&limit=999`);
  assert.equal(huge.status, 200);
  assert.equal(huge.body.data.length, 3);
});

test('GET /top-products — 기간 파라미터가 없으면 400', async () => {
  const { app } = makeApp();
  const { status, body } = await request(app, '/api/sales/top-products');

  assert.equal(status, 400);
  assert.equal(body.success, false);
});

test('GET /top-products — 鑫之源 조회 실패 시 500으로 응답한다', async () => {
  const xzy = {
    getSalesStats: async () => { throw new Error('签名验证失败'); },
    getProducts: async () => PRODUCTS,
  } as unknown as XzyClient;

  const app = express();
  app.use('/api/sales', createSalesRoutes(xzy));
  const { status, body } = await request(app, `/api/sales/top-products?${RANGE}`);

  assert.equal(status, 500);
  assert.equal(body.success, false);
  assert.match(body.error, /签名验证失败/);
});

test('GET /by-machine — LCD 장비를 매출 집계에서 제외한다', async () => {
  const { app, calls } = makeApp();
  const { status, body } = await request(app, `/api/sales/by-machine?${RANGE}`);

  assert.equal(status, 200);
  assert.deepEqual(
    body.data.map((m: any) => m.funName),
    ['자판기1_20250994', '자판기2_20250992'],
    'LCD(_65인치_) 장비는 응답에 없어야 한다',
  );

  // LCD에 대해서는 countInfo를 호출조차 하지 않아야 한다
  const queriedFunIds = calls.salesArgs.filter((a) => a.funId).map((a) => a.funId).sort();
  assert.deepEqual(queriedFunIds, [2, 4]);
});
