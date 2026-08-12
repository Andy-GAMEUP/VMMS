import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildReport, renderReport, readAsRest, readAsMq,
  type RawMachine, type SlotInfo,
} from './deviceStatusReport.js';

const MACHINES: RawMachine[] = [
  { funId: 1, funNumber: 'F1', funName: '자판기1_65인치_20250993', funStatus: 1, lineStatus: 0, funWaring: 5 },
  { funId: 2, funNumber: 'F2', funName: '자판기1_20250994', funStatus: 1, lineStatus: 0, funWaring: 5 },
  { funId: 3, funNumber: 'F3', funName: '자판기2_20250992', funStatus: 2, lineStatus: 1, funWaring: 5 },
];

const SLOTS = new Map<number, SlotInfo>([
  [1, { lowStock: false, slotCount: 10 }],
  [2, { lowStock: true, slotCount: 12 }],
  // funId 3은 조회 실패 케이스
]);

test('REST 문서 해석 — 0=온라인, 1=오프라인', () => {
  assert.equal(readAsRest(0, 0), '온라인');
  assert.equal(readAsRest(1, 0), '오프라인');
  assert.equal(readAsRest(0, 1), '오프라인');
  assert.equal(readAsRest(null, null), '알 수 없음');
});

test('MQ 문서 해석 — 1=정상, 2=고장, 3=정지', () => {
  assert.equal(readAsMq(1, 0), '정상/온라인');
  assert.equal(readAsMq(2, 0), '고장/온라인');
  assert.equal(readAsMq(3, 1), '정지/오프라인');
  assert.equal(readAsMq(1, 1), '정상/오프라인');
});

test('두 해석을 나란히 담고 LCD를 구분한다', () => {
  const rows = buildReport(MACHINES, SLOTS);

  assert.equal(rows.length, 3);
  assert.equal(rows[0].isLcd, true, '_65인치_ 는 LCD');
  assert.equal(rows[1].isLcd, false);

  // 같은 원본 값이 두 해석에서 정반대로 읽히는 것을 확인
  assert.equal(rows[1].funStatus, 1);
  assert.equal(rows[1].restReading, '오프라인');
  assert.equal(rows[1].mqReading, '정상/온라인');
});

test('슬롯 조회 실패를 null로 구분한다', () => {
  const rows = buildReport(MACHINES, SLOTS);
  assert.equal(rows[0].lowStock, false);
  assert.equal(rows[1].lowStock, true);
  assert.equal(rows[2].lowStock, null, '조회 실패는 "재고 정상"과 구분되어야 한다');
});

test('원본 값이 없어도 처리한다', () => {
  const rows = buildReport([{ funId: 9 }], new Map());
  assert.equal(rows[0].funStatus, null);
  assert.equal(rows[0].lineStatus, null);
  assert.equal(rows[0].lowStock, null);
});

test('리포트에 원본 값 분포와 판단 근거가 포함된다', () => {
  const output = renderReport(buildReport(MACHINES, SLOTS));

  assert.match(output, /원본 값 분포/);
  assert.match(output, /funStatus=1, lineStatus=0\s+→\s+2대/);
  assert.match(output, /funStatus=2, lineStatus=1\s+→\s+1대/);
  assert.match(output, /전체 3대 — 자판기 2대, LCD 1대/);
  assert.match(output, /해석 판단 근거/);
  assert.match(output, /조회실패/);
});
