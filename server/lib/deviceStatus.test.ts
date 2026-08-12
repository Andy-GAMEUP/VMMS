import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveDeviceStatus, countByStatus } from './deviceStatus.js';

test('운영 실측값 — funStatus=1, lineStatus=1 은 오프라인', () => {
  // 2026-08 운영 확인: 자판기 4대 모두 이 조합
  // MQ 문서: "funStatus=1, lineStatus=1 → 설비 정상이나 오프라인(네트워크 문제)"
  assert.equal(resolveDeviceStatus(1, 1), 'offline');
});

test('접속 여부는 lineStatus로만 판정한다 (양쪽 문서 정의 일치)', () => {
  assert.equal(resolveDeviceStatus(0, 0), 'online');
  assert.equal(resolveDeviceStatus(1, 0), 'online', 'funStatus=1은 MQ 기준 정상이므로 회선이 살아있으면 온라인');
  assert.equal(resolveDeviceStatus(0, 1), 'offline');
});

test('고장/정지는 오프라인보다 우선 표시한다', () => {
  // 기존 로직은 funStatus=2 를 "1이 아니다"라는 이유로 온라인 처리했다
  assert.equal(resolveDeviceStatus(2, 0), 'fault');
  assert.equal(resolveDeviceStatus(2, 1), 'fault', '고장이면 회선 상태와 무관하게 고장');
  assert.equal(resolveDeviceStatus(3, 0), 'stopped');
  assert.equal(resolveDeviceStatus(3, 1), 'stopped');
});

test('알 수 없는 값은 회선 상태로 판정한다', () => {
  assert.equal(resolveDeviceStatus(99, 0), 'online');
  assert.equal(resolveDeviceStatus(99, 1), 'offline');
});

test('상태별 집계 — 실측 데이터', () => {
  // 실제 /api/machines 응답 (자판기 4대)
  const machines = [
    { funId: 1003, funStatus: 1, lineStatus: 1 },
    { funId: 1005, funStatus: 1, lineStatus: 1 },
    { funId: 1007, funStatus: 1, lineStatus: 1 },
    { funId: 1024, funStatus: 1, lineStatus: 1 },
  ];
  assert.deepEqual(countByStatus(machines), {
    online: 0, offline: 4, fault: 0, stopped: 0,
  });
});

test('상태별 집계 — 혼합 및 필드 누락', () => {
  const machines = [
    { funStatus: 1, lineStatus: 0 }, // 정상 온라인
    { funStatus: 1, lineStatus: 1 }, // 정상 오프라인
    { funStatus: 2, lineStatus: 0 }, // 고장
    { funStatus: 3, lineStatus: 1 }, // 정지
    {},                              // 필드 누락 → 0,0 으로 간주
  ];
  assert.deepEqual(countByStatus(machines), {
    online: 2, offline: 1, fault: 1, stopped: 1,
  });
});
