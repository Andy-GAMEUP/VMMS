import { test } from 'node:test';
import assert from 'node:assert/strict';
import { aggregateTopProducts, type RawSalesStat } from './salesAggregate.js';
import type { ProductInfo } from './productMap.js';

function productMap(entries: Record<number, string>): Map<number, ProductInfo> {
  return new Map(
    Object.entries(entries).map(([id, name]) => [
      Number(id),
      { name, price: 0, fileUrl: '' } satisfies ProductInfo,
    ]),
  );
}

test('판매 건수 내림차순으로 정렬한다', () => {
  const stats: RawSalesStat[] = [
    { goodsId: 1, totalOrderNumber: 10, decTotalOrderMoney: 10000 },
    { goodsId: 2, totalOrderNumber: 30, decTotalOrderMoney: 3000 },
    { goodsId: 3, totalOrderNumber: 20, decTotalOrderMoney: 5000 },
  ];
  const result = aggregateTopProducts(stats, productMap({ 1: '콜라', 2: '사이다', 3: '커피' }));

  assert.deepEqual(result.map((r) => r.goodsName), ['사이다', '커피', '콜라']);
  assert.deepEqual(result.map((r) => r.totalOrders), [30, 20, 10]);
});

test('같은 상품이 여러 행으로 오면 합산한다', () => {
  const stats: RawSalesStat[] = [
    { goodsId: 1, totalOrderNumber: 5, decTotalOrderMoney: 1000 },
    { goodsId: 1, totalOrderNumber: 7, decTotalOrderMoney: 1400 },
    { goodsId: 2, totalOrderNumber: 4, decTotalOrderMoney: 800 },
  ];
  const result = aggregateTopProducts(stats, productMap({ 1: '콜라', 2: '사이다' }));

  assert.equal(result.length, 2);
  assert.equal(result[0].goodsName, '콜라');
  assert.equal(result[0].totalOrders, 12);
  assert.equal(result[0].totalSales, 2400);
});

test('goodsId가 없는 기간 집계 행은 제외한다', () => {
  const stats: RawSalesStat[] = [
    { totalOrderNumber: 999, decTotalOrderMoney: 999999 }, // 상품 단위 아님
    { goodsId: 1, totalOrderNumber: 3, decTotalOrderMoney: 600 },
  ];
  const result = aggregateTopProducts(stats, productMap({ 1: '콜라' }));

  assert.equal(result.length, 1);
  assert.equal(result[0].goodsName, '콜라');
});

test('limit 개수만큼만 돌려준다', () => {
  const stats: RawSalesStat[] = Array.from({ length: 10 }, (_, i) => ({
    goodsId: i + 1,
    totalOrderNumber: i + 1,
    decTotalOrderMoney: 100,
  }));
  assert.equal(aggregateTopProducts(stats, new Map(), 5).length, 5);
  assert.equal(aggregateTopProducts(stats, new Map(), 3).length, 3);
  assert.equal(aggregateTopProducts(stats, new Map(), 100).length, 10);
});

test('상품명을 모르면 goodsId로 대체 표기한다', () => {
  const stats: RawSalesStat[] = [{ goodsId: 77, totalOrderNumber: 1, decTotalOrderMoney: 100 }];
  const result = aggregateTopProducts(stats, new Map());

  assert.equal(result[0].goodsName, '상품 #77');
});

test('판매 건수가 같으면 매출액 큰 쪽이 앞선다', () => {
  const stats: RawSalesStat[] = [
    { goodsId: 1, totalOrderNumber: 10, decTotalOrderMoney: 1000 },
    { goodsId: 2, totalOrderNumber: 10, decTotalOrderMoney: 5000 },
  ];
  const result = aggregateTopProducts(stats, productMap({ 1: '콜라', 2: '사이다' }));

  assert.deepEqual(result.map((r) => r.goodsName), ['사이다', '콜라']);
});

test('countInfo 이미지가 없으면 상품 목록 이미지를 쓴다', () => {
  const stats: RawSalesStat[] = [
    { goodsId: 1, totalOrderNumber: 1, decTotalOrderMoney: 100 },
    { goodsId: 2, totalOrderNumber: 1, decTotalOrderMoney: 100, fileUrl: 'http://from-countinfo/2.jpg' },
  ];
  const map = new Map<number, ProductInfo>([
    [1, { name: '콜라', price: 0, fileUrl: 'http://from-products/1.jpg' }],
    [2, { name: '사이다', price: 0, fileUrl: 'http://from-products/2.jpg' }],
  ]);
  const result = aggregateTopProducts(stats, map);

  const byId = new Map(result.map((r) => [r.goodsId, r.fileUrl]));
  assert.equal(byId.get(1), 'http://from-products/1.jpg');
  assert.equal(byId.get(2), 'http://from-countinfo/2.jpg');
});

test('누락 필드와 빈 응답을 안전하게 처리한다', () => {
  assert.deepEqual(aggregateTopProducts([], new Map()), []);
  assert.deepEqual(aggregateTopProducts(null, new Map()), []);
  assert.deepEqual(aggregateTopProducts(undefined, new Map()), []);
  // 문서와 달리 배열이 아닌 값이 와도 throw 하지 않아야 한다
  assert.deepEqual(aggregateTopProducts({} as never, new Map()), []);

  const partial = aggregateTopProducts([{ goodsId: 1 }], new Map());
  assert.equal(partial[0].totalOrders, 0);
  assert.equal(partial[0].totalSales, 0);
  assert.equal(partial[0].fileUrl, '');
});

test('API 문서 3.6 반환 예시를 그대로 처리한다', () => {
  // 자판기 API문서.pdf 3.6 countInfo 반환 예시
  const docExample: RawSalesStat[] = [
    {
      goodsId: 2001,
      fileUrl: 'https://example.com/image.jpg',
      orderMoney: 1500,
      totalOrderMoney: 150000,
      decTotalOrderMoney: 1500.0,
      totalOrderNumber: 100,
    },
  ];
  const result = aggregateTopProducts(docExample, productMap({ 2001: '코카콜라 제로 355ml' }));

  assert.equal(result.length, 1);
  assert.deepEqual(result[0], {
    goodsId: 2001,
    goodsName: '코카콜라 제로 355ml',
    fileUrl: 'https://example.com/image.jpg',
    totalSales: 1500.0,
    totalOrders: 100,
  });
});
