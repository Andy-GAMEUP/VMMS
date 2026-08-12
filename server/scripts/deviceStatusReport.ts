/**
 * 장비 상태 진단 리포트
 *
 * 鑫之源 getFunByDept / getRoodById 를 호출해 장비별 상태를 표로 출력한다.
 *
 * 실행: npm run check:devices
 * (.env 의 XZY_APP_ID / XZY_API_KEY / XZY_API_BASE_V11 / XZY_API_BASE_V12 필요)
 *
 * ── funStatus 해석 주의 ───────────────────────────────────────────────
 * 두 벤더 문서가 같은 필드를 다르게 정의한다:
 *   REST 문서 3.1.1 : funStatus 0=온라인, 1=오프라인
 *   MQ   문서 3.2   : funStatus 1=정상,   2=고장, 3=정지
 * 어느 쪽이 실제인지 원본 값을 봐야 확정할 수 있으므로,
 * 이 리포트는 raw 값과 두 해석을 나란히 출력한다.
 * ─────────────────────────────────────────────────────────────────────
 */

import { isLcdDevice } from '../lib/deviceFilter.js';

export interface RawMachine {
  funId: number;
  funNumber?: string;
  funName?: string;
  funStatus?: number;
  lineStatus?: number;
  funWaring?: number;
}

export interface DeviceStatusRow {
  funId: number;
  funCode: string;
  funName: string;
  isLcd: boolean;
  funStatus: number | null;
  lineStatus: number | null;
  /** REST 문서 기준 해석 (0=온라인, 1=오프라인) */
  restReading: string;
  /** MQ 문서 기준 해석 (1=정상, 2=고장, 3=정지) */
  mqReading: string;
  /** 슬롯 조회 결과 — 조회 실패 시 null */
  lowStock: boolean | null;
  slotCount: number | null;
}

/** REST 문서 기준 funStatus/lineStatus 해석 */
export function readAsRest(funStatus: number | null, lineStatus: number | null): string {
  if (funStatus === 1 || lineStatus === 1) return '오프라인';
  if (funStatus === 0 || lineStatus === 0) return '온라인';
  return '알 수 없음';
}

/** MQ 문서 기준 funStatus 해석 (lineStatus는 양쪽 문서가 동일: 0=온라인, 1=오프라인) */
export function readAsMq(funStatus: number | null, lineStatus: number | null): string {
  const health =
    funStatus === 1 ? '정상' :
    funStatus === 2 ? '고장' :
    funStatus === 3 ? '정지' : `알 수 없음(${funStatus})`;
  const line = lineStatus === 0 ? '온라인' : lineStatus === 1 ? '오프라인' : '회선 불명';
  return `${health}/${line}`;
}

export interface SlotInfo {
  lowStock: boolean | null;
  slotCount: number | null;
}

/** 장비 목록 + 슬롯 조회 결과 → 리포트 행 */
export function buildReport(
  machines: RawMachine[],
  slots: Map<number, SlotInfo>,
): DeviceStatusRow[] {
  return machines.map((m) => {
    const funStatus = m.funStatus ?? null;
    const lineStatus = m.lineStatus ?? null;
    const slot = slots.get(m.funId) ?? { lowStock: null, slotCount: null };
    return {
      funId: m.funId,
      funCode: m.funNumber ?? '',
      funName: m.funName ?? '',
      isLcd: isLcdDevice(m.funName, m.funNumber),
      funStatus,
      lineStatus,
      restReading: readAsRest(funStatus, lineStatus),
      mqReading: readAsMq(funStatus, lineStatus),
      lowStock: slot.lowStock,
      slotCount: slot.slotCount,
    };
  });
}

/** 콘솔 출력용 표 문자열 */
export function renderReport(rows: DeviceStatusRow[]): string {
  const lines: string[] = [];
  const pad = (s: string, n: number) => {
        // 한글 폭 보정 (한글/전각 2칸)
    const width = [...s].reduce((w, ch) => w + (/[ᄀ-ᇿ　-鿿가-힯＀-｠]/.test(ch) ? 2 : 1), 0);
    return s + ' '.repeat(Math.max(0, n - width));
  };

  lines.push('');
  lines.push('  장비 상태 리포트');
  lines.push('  ' + '─'.repeat(96));
  lines.push(
    '  ' +
      pad('funId', 7) + pad('장비명', 28) + pad('종류', 8) +
      pad('funStatus', 11) + pad('lineStatus', 12) +
      pad('REST해석', 12) + pad('MQ해석', 18) + '재고',
  );
  lines.push('  ' + '─'.repeat(96));

  for (const r of rows) {
    const kind = r.isLcd ? 'LCD' : '자판기';
    const stock =
      r.lowStock === null ? '조회실패' :
      r.lowStock ? `부족 (슬롯 ${r.slotCount})` : `정상 (슬롯 ${r.slotCount})`;
    lines.push(
      '  ' +
        pad(String(r.funId), 7) +
        pad(r.funName || '(이름없음)', 28) +
        pad(kind, 8) +
        pad(String(r.funStatus ?? '-'), 11) +
        pad(String(r.lineStatus ?? '-'), 12) +
        pad(r.restReading, 12) +
        pad(r.mqReading, 18) +
        stock,
    );
  }

  lines.push('  ' + '─'.repeat(96));

  const vending = rows.filter((r) => !r.isLcd);
  const lcd = rows.filter((r) => r.isLcd);
  lines.push(`  전체 ${rows.length}대 — 자판기 ${vending.length}대, LCD ${lcd.length}대`);

  // funStatus 분포 — 어느 문서 해석이 맞는지 판단 근거
  const dist = new Map<string, number>();
  for (const r of rows) {
    const key = `funStatus=${r.funStatus ?? '-'}, lineStatus=${r.lineStatus ?? '-'}`;
    dist.set(key, (dist.get(key) ?? 0) + 1);
  }
  lines.push('');
  lines.push('  원본 값 분포:');
  for (const [key, count] of [...dist.entries()].sort((a, b) => b[1] - a[1])) {
    lines.push(`    ${key}  →  ${count}대`);
  }

  lines.push('');
  lines.push('  해석 판단 근거:');
  lines.push('    · funStatus 가 0/1 만 나오면 → REST 문서 해석(0=온라인, 1=오프라인)이 맞을 가능성');
  lines.push('    · funStatus 에 2 또는 3 이 섞여 나오면 → MQ 문서 해석(1=정상, 2=고장, 3=정지)이 맞음');
  lines.push('    · 전 장비가 funStatus=1 이고 실제로는 정상 가동 중이라면 → MQ 해석이 맞음 (1=정상)');
  lines.push('');

  return lines.join('\n');
}

/** 실제 API를 호출해 리포트를 출력한다 */
async function main(): Promise<void> {
  const [{ XzyClient }, { config }] = await Promise.all([
    import('../lib/xzyClient.js'),
    import('dotenv'),
  ]);
  config();

  const required = ['XZY_APP_ID', 'XZY_API_KEY', 'XZY_API_BASE_V11', 'XZY_API_BASE_V12'];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    console.error(`[ERROR] 환경변수 누락: ${missing.join(', ')}`);
    console.error('        .env 파일을 확인하거나 Railway 환경에서 실행하세요.');
    process.exit(1);
  }

  const xzy = new XzyClient({
    appId: Number(process.env.XZY_APP_ID),
    apiKey: process.env.XZY_API_KEY!,
    baseV11: process.env.XZY_API_BASE_V11!,
    baseV12: process.env.XZY_API_BASE_V12!,
  });

  console.log('  鑫之源 getFunByDept 호출 중...');
  const raw = (await xzy.getMachines()) as any;
  const machines: RawMachine[] = Array.isArray(raw) ? raw : (raw?.records ?? []);
  console.log(`  장비 ${machines.length}대 수신. 슬롯 조회 중...`);

  const slotResults = await Promise.allSettled(
    machines.map(async (m) => {
      const roads = (await xzy.getRoads(m.funId)) as any[];
      const list = roads ?? [];
      const waring = m.funWaring ?? 5;
      return {
        funId: m.funId,
        slotCount: list.length,
        lowStock: list.some((r) => r.goodsId && (r.roadStock ?? 0) <= waring),
      };
    }),
  );

  const slots = new Map<number, SlotInfo>();
  slotResults.forEach((result, i) => {
    const funId = machines[i].funId;
    if (result.status === 'fulfilled') {
      slots.set(funId, { lowStock: result.value.lowStock, slotCount: result.value.slotCount });
    } else {
      slots.set(funId, { lowStock: null, slotCount: null });
    }
  });

  console.log(renderReport(buildReport(machines, slots)));
}

// 이 파일이 진입점일 때만 API를 호출한다.
// (deviceStatusReport.test.ts 가 진입점인 경우는 제외되어야 하므로 파일명을 정확히 비교한다)
const entryFile = (process.argv[1] ?? '').split(/[/\\]/).pop() ?? '';
if (entryFile === 'deviceStatusReport.ts' || entryFile === 'deviceStatusReport.js') {
  main().catch((err) => {
    console.error('[FATAL] 리포트 생성 실패:', err instanceof Error ? err.message : err);
    process.exit(1);
  });
}
