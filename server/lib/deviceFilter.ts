/**
 * 자판기(실제 판매 설비)와 자판기 LCD(디스플레이 전용 장비)를 구분한다.
 *
 * 鑫之源 API는 장비 타입 필드를 제공하지 않으므로 장비명/코드로 판별한다.
 * 실제 등록된 장비는 동일 자판기가 두 건으로 등록되어 있고
 * LCD 쪽에만 인치 표기가 붙는다:
 *   자판기1_65인치_20250993  → LCD (판매 대상 아님)
 *   자판기1_20250994         → 자판기
 *
 * 기본 판별 규칙: 이름/코드에 인치 표기(`65인치`, `65"`, `65 inch`) 또는 `LCD` 포함.
 * 운영 중 장비 명명 규칙이 바뀌면 LCD_KEYWORDS 환경변수로 키워드를
 * 콤마 구분해 덮어쓸 수 있다 (예: `LCD_KEYWORDS=인치,LCD,광고판`).
 */

/** 숫자 + 인치 표기 (65인치 / 65 인치 / 65" / 65inch / 65-inch) */
const INCH_PATTERN = /\d+\s*(인치|"|″|inch)/i;

const DEFAULT_KEYWORDS = ['LCD'];

function configuredKeywords(): string[] {
  const raw = process.env.LCD_KEYWORDS;
  if (!raw) return DEFAULT_KEYWORDS;
  const parsed = raw.split(',').map((k) => k.trim()).filter(Boolean);
  return parsed.length > 0 ? parsed : DEFAULT_KEYWORDS;
}

/** 자판기 LCD(디스플레이 전용 장비)인지 판별 — true면 매출/재고 대상에서 제외 */
export function isLcdDevice(funName?: string, funCode?: string): boolean {
  const haystack = `${funName ?? ''} ${funCode ?? ''}`;
  if (INCH_PATTERN.test(haystack)) return true;

  const upper = haystack.toUpperCase();
  return configuredKeywords().some((k) => upper.includes(k.toUpperCase()));
}
