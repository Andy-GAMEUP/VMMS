/**
 * 鑫之源 API MD5 서명 생성 모듈
 *
 * 서명 규칙:
 * 1. 비어있지 않은 파라미터를 ASCII 오름차순 정렬
 * 2. key1=value1&key2=value2 형태로 연결 → stringA
 * 3. stringA + "&key={플랫폼 할당 키}" → stringSignTemp
 * 4. MD5(stringSignTemp).toUpperCase() → signValue
 *
 * - sign 파라미터 자체는 서명 계산에 포함하지 않음
 * - null/빈 문자열 파라미터는 서명에 포함하지 않음
 * - 파라미터명은 대소문자 구분
 */

import { createHash } from 'crypto';

export interface SignParams {
  [key: string]: string | number | undefined | null;
}

/**
 * MD5 서명 생성
 * @param params - API 요청 파라미터 (sign 제외)
 * @param apiKey - 鑫之源 플랫폼 할당 키
 * @returns 대문자 MD5 해시값
 */
export function generateSign(params: SignParams, apiKey: string): string {
  // 1. sign 제외, null/빈 문자열 제거
  const filtered = Object.entries(params).filter(
    ([key, value]) => key !== 'sign' && value !== undefined && value !== null && value !== '',
  );

  // 2. 파라미터명 ASCII 오름차순 정렬
  filtered.sort(([a], [b]) => a.localeCompare(b, 'en'));

  // 3. key=value 형태로 연결
  const stringA = filtered.map(([key, value]) => `${key}=${value}`).join('&');

  // 4. API Key 추가
  const stringSignTemp = `${stringA}&key=${apiKey}`;

  // 5. MD5 해시 → 대문자
  return createHash('md5').update(stringSignTemp, 'utf8').digest('hex').toUpperCase();
}

/**
 * 서명 포함된 전체 파라미터 반환
 */
export function signParams(params: SignParams, apiKey: string): Record<string, string | number> {
  const sign = generateSign(params, apiKey);
  const result: Record<string, string | number> = {};

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      result[key] = value;
    }
  }
  result.sign = sign;

  return result;
}
