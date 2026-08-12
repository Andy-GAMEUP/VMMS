/**
 * 자판기(실제 판매 설비)와 자판기 LCD(디스플레이 전용 장비)를 구분한다.
 * 鑫之源 API는 별도 장비 타입 필드를 제공하지 않으므로,
 * 장비명/코드에 "LCD" 문자열이 포함되어 있으면 자판기 LCD로 간주한다.
 */
const LCD_KEYWORD = 'LCD';

export function isLcdDevice(funName: string | undefined, funCode: string | undefined): boolean {
  const name = (funName ?? '').toUpperCase();
  const code = (funCode ?? '').toUpperCase();
  return name.includes(LCD_KEYWORD) || code.includes(LCD_KEYWORD);
}
