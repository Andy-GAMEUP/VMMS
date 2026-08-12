/**
 * 테스트 환경 초기화
 *
 * server/lib/supabase.ts 는 모듈 로드 시점에 환경변수가 없으면
 * process.exit(1) 하므로, 라우트를 import 하기 전에 더미 값을 채워둔다.
 * (테스트는 Supabase에 실제로 접속하지 않는다)
 *
 * 반드시 테스트 파일의 첫 import 로 두어야 한다.
 */

process.env.SUPABASE_URL ??= 'http://localhost:54321';
process.env.SUPABASE_SERVICE_KEY ??= 'test-service-key';
process.env.JWT_ACCESS_SECRET ??= 'test-access-secret';
process.env.JWT_REFRESH_SECRET ??= 'test-refresh-secret';
