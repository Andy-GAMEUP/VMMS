import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isLcdDevice } from './deviceFilter.js';

test('실제 등록 장비명 — 인치 표기가 붙은 쪽만 LCD로 판별한다', () => {
  // 운영 환경에 등록된 실제 장비명 (동일 자판기가 LCD/자판기 두 건으로 등록됨)
  assert.equal(isLcdDevice('자판기1_65인치_20250993', ''), true);
  assert.equal(isLcdDevice('자판기2_65인치_20250989', ''), true);
  assert.equal(isLcdDevice('자판기4_65인치_20250996', ''), true);
  assert.equal(isLcdDevice('자판기1_20250994', ''), false);
  assert.equal(isLcdDevice('자판기2_20250992', ''), false);
});

test('인치 표기 변형을 인식한다', () => {
  assert.equal(isLcdDevice('자판기3_43인치_1234', ''), true);
  assert.equal(isLcdDevice('자판기3_55 인치_1234', ''), true);
  assert.equal(isLcdDevice('VM 65" display', ''), true);
  assert.equal(isLcdDevice('VM 55inch', ''), true);
  assert.equal(isLcdDevice('VM 32-INCH', ''), true);
});

test('LCD 키워드를 대소문자 무관하게 인식한다', () => {
  assert.equal(isLcdDevice('로비 LCD 광고판', ''), true);
  assert.equal(isLcdDevice('lcd panel', ''), true);
  assert.equal(isLcdDevice('자판기1', 'LCD-002'), true, '코드 필드로도 판별되어야 한다');
});

test('일반 자판기는 제외하지 않는다', () => {
  assert.equal(isLcdDevice('자판기1', ''), false);
  assert.equal(isLcdDevice('음료 자판기 A동', 'VM-002'), false);
  assert.equal(isLcdDevice('', ''), false);
  assert.equal(isLcdDevice(undefined, undefined), false);
});

test('숫자 없는 "인치"만으로는 LCD로 보지 않는다', () => {
  // 정규식이 숫자를 요구하므로 오탐이 없어야 한다
  assert.equal(isLcdDevice('인치과학 자판기', ''), false);
});

test('LCD_KEYWORDS 환경변수로 키워드를 재정의할 수 있다', () => {
  const original = process.env.LCD_KEYWORDS;
  try {
    process.env.LCD_KEYWORDS = '광고판,디스플레이';
    assert.equal(isLcdDevice('로비 광고판', ''), true);
    assert.equal(isLcdDevice('안내 디스플레이', ''), true);
    // 인치 표기는 환경변수와 무관하게 항상 적용된다
    assert.equal(isLcdDevice('자판기1_65인치_20250993', ''), true);
  } finally {
    if (original === undefined) delete process.env.LCD_KEYWORDS;
    else process.env.LCD_KEYWORDS = original;
  }
});
