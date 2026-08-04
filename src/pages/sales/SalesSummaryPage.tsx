import { useState, useMemo } from 'react';
import { useSalesStats } from '@/hooks/useSales';
import { formatMoney } from '@/types';
import { useT } from '@/i18n/useT';
import {
  startOfDay,
  startOfWeek,
  startOfMonth,
  startOfYear,
  endOfDay,
} from 'date-fns';

type PeriodKey = 'day' | 'week' | 'month' | 'year';

function periodToRange(key: PeriodKey): { startTime: number; endTime: number } {
  const now = new Date();
  const end = endOfDay(now).getTime();
  switch (key) {
    case 'day':
      return { startTime: startOfDay(now).getTime(), endTime: end };
    case 'week':
      return { startTime: startOfWeek(now, { weekStartsOn: 1 }).getTime(), endTime: end };
    case 'month':
      return { startTime: startOfMonth(now).getTime(), endTime: end };
    case 'year':
      return { startTime: startOfYear(now).getTime(), endTime: end };
  }
}

export default function SalesSummaryPage() {
  const t = useT();
  const [period, setPeriod] = useState<PeriodKey>('day');
  const range = useMemo(() => periodToRange(period), [period]);
  const { data: stats, isLoading } = useSalesStats(range);

  const periodOptions: { key: PeriodKey; label: string }[] = [
    { key: 'day', label: t.sales.daily },
    { key: 'week', label: t.sales.weekly },
    { key: 'month', label: t.sales.monthly },
    { key: 'year', label: t.sales.yearly },
  ];

  const totalSales = stats?.reduce((sum, s) => sum + s.decTotalOrderMoney, 0) ?? 0;
  const totalOrders = stats?.reduce((sum, s) => sum + s.totalOrderNumber, 0) ?? 0;

  return (
    <div className="pb-4">
      <div className="flex gap-2 px-4 py-3">
        {periodOptions.map((opt) => (
          <button
            key={opt.key}
            onClick={() => setPeriod(opt.key)}
            className="px-4 py-1.5 rounded-full text-[13px] font-medium border-[1.5px] transition-colors"
            style={{
              backgroundColor: period === opt.key ? 'var(--c-pri)' : 'var(--c-sf)',
              color: period === opt.key ? '#fff' : 'var(--c-tx2)',
              borderColor: period === opt.key ? 'var(--c-pri)' : 'var(--c-bd)',
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="mx-4 h-[200px] rounded-xl border-2 border-dashed flex flex-col items-center justify-center mb-3" style={{ backgroundColor: 'var(--c-bg)', borderColor: 'var(--c-bd)', color: 'var(--c-tx3)' }}>
        <span className="text-3xl mb-2">📊</span>
        <span className="text-[14px]">{t.sales.chartTitle}</span>
        <span className="text-[12px] mt-1">{t.sales.chartHint}</span>
      </div>

      <div className="flex gap-2 px-4 mb-4">
        <div className="flex-1 p-4 rounded-xl text-center" style={{ backgroundColor: 'var(--c-pri-lt)' }}>
          <div className="text-[11px] mb-1" style={{ color: 'var(--c-tx3)' }}>{t.sales.totalSales}</div>
          <div className="text-[22px] font-bold" style={{ color: 'var(--c-pri)', fontVariantNumeric: 'tabular-nums' }}>{formatMoney(totalSales)}</div>
        </div>
        <div className="flex-1 p-4 rounded-xl text-center" style={{ backgroundColor: 'var(--c-bg)' }}>
          <div className="text-[11px] mb-1" style={{ color: 'var(--c-tx3)' }}>{t.sales.orderCount}</div>
          <div className="text-[22px] font-bold" style={{ color: 'var(--c-tx1)', fontVariantNumeric: 'tabular-nums' }}>{totalOrders}{t.common.items}</div>
        </div>
      </div>

      {isLoading ? (
        <div className="mx-4 h-32 rounded-xl animate-pulse" style={{ backgroundColor: 'var(--c-bd2)' }} />
      ) : (
        <>
          {stats && stats.length > 0 && stats[0].goodsName ? (
            <div className="mx-4 rounded-xl overflow-hidden" style={{ backgroundColor: 'var(--c-sf)', border: '1px solid var(--c-bd)' }}>
              <h3 className="text-[15px] font-bold px-4 pt-4 pb-2" style={{ color: 'var(--c-tx1)' }}>{t.sales.byProduct}</h3>
              <div>
                {stats
                  .sort((a, b) => b.decTotalOrderMoney - a.decTotalOrderMoney)
                  .map((s, i) => (
                    <div key={s.goodsId ?? i} className="px-4 py-3 flex items-center gap-3" style={{ borderTop: '1px solid var(--c-bd2)' }}>
                      <span
                        className="w-7 h-7 rounded-full flex items-center justify-center text-[13px] font-bold"
                        style={{
                          backgroundColor: i < 3 ? 'var(--c-pri-lt)' : 'var(--c-bg)',
                          color: i < 3 ? 'var(--c-pri)' : 'var(--c-tx3)',
                        }}
                      >
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-semibold truncate" style={{ color: 'var(--c-tx1)' }}>{s.goodsName}</p>
                        <p className="text-[12px]" style={{ color: 'var(--c-tx3)' }}>{s.totalOrderNumber}{t.common.items}</p>
                      </div>
                      <span className="text-[14px] font-bold" style={{ color: 'var(--c-tx1)', fontVariantNumeric: 'tabular-nums' }}>{formatMoney(s.decTotalOrderMoney)}</span>
                    </div>
                  ))}
              </div>
            </div>
          ) : (
            <div className="mx-4 rounded-xl p-8 text-center" style={{ backgroundColor: 'var(--c-sf)', border: '1px solid var(--c-bd)' }}>
              <div className="text-3xl mb-3">💰</div>
              <p className="text-[14px] font-semibold mb-1" style={{ color: 'var(--c-tx2)' }}>{t.sales.noData}</p>
              <p className="text-[12px]" style={{ color: 'var(--c-tx3)' }}>{t.sales.dataHint}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
