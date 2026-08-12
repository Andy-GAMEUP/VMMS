import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/api/dashboard';
import { salesApi } from '@/api/sales';
import { formatMoney } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { ROLE_PERMISSIONS } from '@/types/auth';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { CalendarPicker } from '@/components/modals/CalendarPicker';
import { startOfDay, endOfDay, startOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { useT } from '@/i18n/useT';
import { useLangStore } from '@/store/langStore';

type PeriodKey = 'week' | 'month' | 'custom';

export default function DashboardPage() {
  const t = useT();
  const lang = useLangStore((s) => s.lang);
  const user = useAuthStore((s) => s.user);
  const { isDesktop } = useBreakpoint();
  const [period, setPeriod] = useState<PeriodKey | null>(null);
  const [calOpen, setCalOpen] = useState(false);
  const [customRange, setCustomRange] = useState<{ start: Date; end: Date } | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: dashboardApi.getData,
  });

  const periodRange = (() => {
    const now = new Date();
    if (period === 'week') {
      const ws = startOfWeek(now, { weekStartsOn: 1 });
      return { startTime: startOfDay(ws).getTime(), endTime: endOfDay(now).getTime() };
    }
    if (period === 'month') {
      return { startTime: startOfMonth(now).getTime(), endTime: endOfMonth(now).getTime() };
    }
    if (period === 'custom' && customRange) {
      return { startTime: startOfDay(customRange.start).getTime(), endTime: endOfDay(customRange.end).getTime() };
    }
    return null;
  })();

  const { data: periodSales, isFetching: periodLoading } = useQuery({
    queryKey: ['periodSales', periodRange?.startTime, periodRange?.endTime],
    queryFn: () => salesApi.getStats({ startTime: periodRange!.startTime, endTime: periodRange!.endTime }),
    enabled: !!periodRange,
  });

  const periodTotal = periodSales?.reduce((s, v) => s + v.decTotalOrderMoney, 0) ?? 0;
  const periodOrders = periodSales?.reduce((s, v) => s + v.totalOrderNumber, 0) ?? 0;

  function selectPeriod(key: PeriodKey) {
    if (key === 'custom') { setCalOpen(true); return; }
    setPeriod((prev) => (prev === key ? null : key));
  }

  if (isLoading) {
    return (
      <div className="space-y-4 py-4">
        <div className="h-6 rounded w-40 animate-pulse" style={{ backgroundColor: 'var(--c-bd)' }} />
        <div className="h-40 rounded-2xl animate-pulse" style={{ backgroundColor: 'var(--c-bd2)' }} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <p className="text-sm" style={{ color: 'var(--c-tx3)' }}>{t.dashboard.loadFailed}</p>
        <button onClick={() => window.location.reload()} className="font-semibold text-sm" style={{ color: 'var(--c-pri)' }}>
          {t.common.retry}
        </button>
      </div>
    );
  }

  const todayDate = new Date().toLocaleDateString(lang === 'ko' ? 'ko-KR' : 'en-US', { year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short' });

  const machRanks = (data.machineSales ?? [])
    .slice(0, 5)
    .map((m, i) => ({ rank: i + 1, name: m.funName, sales: m.totalSales }));

  return (
    <div className="space-y-5 pb-4">
      {/* Greeting */}
      <div className="pt-1">
        <div className="text-lg font-bold" style={{ color: 'var(--c-tx1)' }}>
          {t.dashboard.greeting(user?.name ?? 'Admin')}
        </div>
        <div className="text-[12.5px] mt-1" style={{ color: 'var(--c-tx3)' }}>
          {user ? ROLE_PERMISSIONS[user.role].label : ''} · {todayDate}
        </div>
      </div>

      {/* Top grid: Sales hero + Period panel */}
      <div className="grid gap-3.5" style={{ gridTemplateColumns: isDesktop ? '1fr 1fr' : '1fr' }}>
        {/* Sales hero card */}
        <div className="rounded-[18px] p-[22px] text-white" style={{ background: 'linear-gradient(135deg, var(--c-pri), #1a4abf)' }}>
          <div className="text-xs opacity-80">{t.dashboard.todaySales}</div>
          <div className="text-[30px] font-extrabold mt-1" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {formatMoney(data.mtdSales)}
          </div>
          <div className="flex gap-2.5 mt-[18px]">
            <div className="flex-1 rounded-xl p-3" style={{ background: 'rgba(255,255,255,.14)' }}>
              <div className="text-[11px] opacity-80">{t.dashboard.orderCount}</div>
              <div className="text-[17px] font-bold mt-1">
                {data.mtdOrders}<span className="text-[11px] opacity-70 ml-0.5">{t.common.items}</span>
              </div>
              <span className="inline-block text-[11px] font-bold mt-1.5 px-1.5 py-0.5 rounded-[5px]" style={{ background: 'rgba(255,255,255,.2)' }}>
                ▲ 12.5%
              </span>
            </div>
            <div className="flex-1 rounded-xl p-3" style={{ background: 'rgba(255,255,255,.14)' }}>
              <div className="text-[11px] opacity-80">{t.dashboard.vsYesterday}</div>
              <div className="text-[17px] font-bold mt-1" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {formatMoney(Math.round(data.mtdSales * 0.968))}
              </div>
              <span className="inline-block text-[11px] font-bold mt-1.5 px-1.5 py-0.5 rounded-[5px]" style={{ background: 'rgba(255,255,255,.2)' }}>
                ▼ 3.2%
              </span>
            </div>
          </div>
        </div>

        {/* Period panel */}
        <div className="rounded-[18px] p-[18px] border" style={{ backgroundColor: 'var(--c-sf)', borderColor: 'var(--c-bd)' }}>
          <div className="flex gap-2 mb-3">
            {(['week', 'month', 'custom'] as PeriodKey[]).map((key) => {
              const labels: Record<PeriodKey, string> = { week: t.dashboard.week, month: t.dashboard.month, custom: t.dashboard.custom };
              const active = period === key;
              return (
                <button
                  key={key}
                  onClick={() => selectPeriod(key)}
                  className="flex-1 py-2.5 rounded-[9px] text-[12.5px] font-semibold cursor-pointer border-[1.5px]"
                  style={{
                    borderColor: active ? 'var(--c-pri)' : 'var(--c-bd)',
                    backgroundColor: active ? 'var(--c-pri)' : 'transparent',
                    color: active ? '#fff' : 'var(--c-tx2)',
                  }}
                >
                  {labels[key]}
                </button>
              );
            })}
          </div>

          {period && periodRange ? (
            periodLoading ? (
              <div className="flex items-center justify-center py-6">
                <div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--c-pri)', borderTopColor: 'transparent' }} />
              </div>
            ) : (
              <div className="flex gap-2.5">
                <div className="flex-1 text-center py-3 rounded-[10px]" style={{ backgroundColor: 'var(--c-pri-lt)' }}>
                  <div className="text-[10.5px]" style={{ color: 'var(--c-tx3)' }}>
                    {period === 'week' ? t.dashboard.weeklySales : period === 'month' ? t.dashboard.monthlySales : t.dashboard.periodSales}
                  </div>
                  <div className="text-base font-bold mt-1" style={{ color: 'var(--c-pri)', fontVariantNumeric: 'tabular-nums' }}>
                    {formatMoney(periodTotal)}
                  </div>
                </div>
                <div className="flex-1 text-center py-3 rounded-[10px]" style={{ backgroundColor: 'var(--c-page-bg)' }}>
                  <div className="text-[10.5px]" style={{ color: 'var(--c-tx3)' }}>{t.dashboard.salesCount}</div>
                  <div className="text-base font-bold mt-1" style={{ color: 'var(--c-tx1)', fontVariantNumeric: 'tabular-nums' }}>
                    {periodOrders}{t.common.items}
                  </div>
                </div>
              </div>
            )
          ) : (
            <div className="text-center py-5 text-xs" style={{ color: 'var(--c-tx3)' }}>
              {t.dashboard.selectPeriodHint}
            </div>
          )}
        </div>
      </div>

      {/* Rankings */}
      <div className="grid gap-[18px]" style={{ gridTemplateColumns: isDesktop ? '1fr 1fr' : '1fr' }}>
        <RankingSection
          title={t.dashboard.machineRanking}
          items={machRanks.map((r) => ({
            rank: r.rank,
            name: r.name,
            value: formatMoney(r.sales),
            sub: '',
          }))}
        />
        <RankingSection
          title={t.dashboard.productRanking}
          items={[
            { rank: 1, name: '코카콜라 제로 355ml', value: '2,847', sub: t.common.items },
            { rank: 2, name: '포카리스웨트 500ml', value: '2,156', sub: t.common.items },
            { rank: 3, name: '아메리카노 HOT', value: '1,933', sub: t.common.items },
            { rank: 4, name: '밀키스 250ml', value: '1,488', sub: t.common.items },
            { rank: 5, name: '허니버터칩', value: '1,205', sub: t.common.items },
          ]}
        />
      </div>

      {/* Calendar picker modal */}
      <CalendarPicker
        open={calOpen}
        onClose={() => setCalOpen(false)}
        onApply={(start, end) => {
          setCustomRange({ start, end });
          setPeriod('custom');
          setCalOpen(false);
        }}
      />
    </div>
  );
}

function RankingSection({ title, items }: {
  title: string;
  items: { rank: number; name: string; value: string; sub: string }[];
}) {
  const t = useT();
  const rankBg = (r: number) => r <= 3 ? 'var(--c-pri-lt)' : 'var(--c-page-bg)';
  const rankColor = (r: number) => r <= 3 ? 'var(--c-pri)' : 'var(--c-tx3)';

  return (
    <div>
      <div className="flex justify-between items-center mb-2.5">
        <div className="text-[14.5px] font-bold" style={{ color: 'var(--c-tx1)' }}>{title}</div>
        <div className="text-[10.5px] px-2 py-0.5 rounded-[5px]" style={{ color: 'var(--c-tx3)', backgroundColor: 'var(--c-page-bg)' }}>
          {t.calendar.yearMonth(new Date().getFullYear(), new Date().getMonth() + 1)}
        </div>
      </div>
      {items.map((it) => (
        <div
          key={it.rank}
          className="flex items-center gap-2.5 px-3 py-2.5 rounded-[11px] mb-1.5 border"
          style={{ backgroundColor: 'var(--c-sf)', borderColor: 'var(--c-bd)' }}
        >
          <div
            className="w-[22px] h-[22px] rounded-md text-[10.5px] font-bold flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: rankBg(it.rank), color: rankColor(it.rank) }}
          >
            {it.rank}
          </div>
          <div className="flex-1 text-[12.5px] font-medium truncate" style={{ color: 'var(--c-tx1)' }}>
            {it.name}
          </div>
          <div className="text-[12.5px] font-bold flex-shrink-0" style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--c-tx1)' }}>
            {it.value}
            {it.sub && <span className="text-[10px] font-medium ml-0.5" style={{ color: 'var(--c-tx3)' }}>{it.sub}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}
