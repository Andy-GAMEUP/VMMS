import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { clsx } from 'clsx';
import { useMachines } from '@/hooks/useMachines';
import { resolveDeviceStatus, formatMoney, type DeviceStatusType } from '@/types';
import { salesApi, type MachineSalesData } from '@/api/sales';
import { productApi } from '@/api/products';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { CalendarPicker } from '@/components/modals/CalendarPicker';
import { ProductDetailModal } from '@/components/modals/ProductDetailModal';
import { OrderModal } from '@/components/modals/OrderModal';
import { FAB } from '@/components/ui/FAB';
import { startOfDay, endOfDay, startOfMonth, startOfWeek } from 'date-fns';
import type { Machine } from '@/types';
import { useT } from '@/i18n/useT';

type TabKey = 'manage' | 'sales' | 'products';

export default function MachineListPage() {
  const [searchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as TabKey) || 'manage';
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);
  const t = useT();

  const TABS: { key: TabKey; label: string }[] = [
    { key: 'manage', label: t.machines.tabManage },
    { key: 'sales', label: t.machines.tabSales },
    { key: 'products', label: t.machines.tabProducts },
  ];

  return (
    <div className="pb-4">
      <div className="flex border-b-2 sticky top-[var(--header-h)] lg:top-0 z-10" style={{ borderColor: 'var(--c-bd)', backgroundColor: 'var(--c-sf)' }}>
        {TABS.map((tab) => {
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="flex-1 py-3 text-[13.5px] font-semibold border-b-2 -mb-[2px] transition-colors"
              style={{
                color: active ? 'var(--c-pri)' : 'var(--c-tx3)',
                borderColor: active ? 'var(--c-pri)' : 'transparent',
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'manage' && <ManageTab />}
      {activeTab === 'sales' && <SalesTab />}
      {activeTab === 'products' && <ProductsTab />}
    </div>
  );
}

function getMachineDisplayStatus(m: Machine): string {
  if (m.hasLowStock) return 'lowstock';
  return resolveDeviceStatus(m.funStatus, m.lineStatus);
}

type FilterKey = DeviceStatusType | 'lowstock' | 'all';

function ManageTab() {
  const navigate = useNavigate();
  const { isDesktop } = useBreakpoint();
  const [searchParams] = useSearchParams();
  const { data: machines, isLoading } = useMachines();
  const initialFilter = (searchParams.get('status') as FilterKey) || 'all';
  const [filter, setFilter] = useState<FilterKey>(initialFilter);
  const [search, setSearch] = useState('');
  const t = useT();

  const STATUS_MAP: Record<string, { color: string; label: string }> = {
    online: { color: 'var(--c-ok)', label: t.machines.statusOnline },
    offline: { color: 'var(--c-off)', label: t.machines.statusOffline },
    fault: { color: 'var(--c-err)', label: t.machines.statusFault },
    stopped: { color: 'var(--c-off)', label: t.machines.statusStopped },
    lowstock: { color: 'var(--c-warn)', label: t.machines.statusLowStock },
  };

  const FILTER_OPTIONS: { key: FilterKey; label: string }[] = [
    { key: 'all', label: t.common.all },
    { key: 'online', label: t.machines.statusOnline },
    { key: 'offline', label: t.machines.statusOffline },
    { key: 'fault', label: t.machines.statusFault },
    { key: 'lowstock', label: t.machines.statusLowStock },
  ];

  const todayRange = {
    startTime: startOfDay(new Date()).getTime(),
    endTime: endOfDay(new Date()).getTime(),
  };
  const { data: todaySales } = useQuery({
    queryKey: ['todayMachineSales', todayRange.startTime],
    queryFn: () => salesApi.getByMachine(todayRange),
  });
  const salesMap = new Map<number, MachineSalesData>();
  if (todaySales) todaySales.forEach((s) => salesMap.set(s.funId, s));

  useEffect(() => {
    const urlStatus = searchParams.get('status') as FilterKey;
    if (urlStatus && FILTER_OPTIONS.some((o) => o.key === urlStatus)) setFilter(urlStatus);
  }, [searchParams]);

  const filtered = (machines || []).filter((m) => {
    const deviceStatus = resolveDeviceStatus(m.funStatus, m.lineStatus);
    if (filter === 'lowstock' && !m.hasLowStock) return false;
    if (filter !== 'all' && filter !== 'lowstock' && deviceStatus !== filter) return false;
    if (search && !m.funName.includes(search) && !m.address.includes(search)) return false;
    return true;
  });

  const counts = (machines || []).reduce((acc, m) => {
    const s = resolveDeviceStatus(m.funStatus, m.lineStatus);
    acc[s] = (acc[s] || 0) + 1;
    acc.all = (acc.all || 0) + 1;
    if (m.hasLowStock) acc.lowstock = (acc.lowstock || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <>
      <div className="flex gap-2 px-4 py-3 overflow-x-auto">
        {FILTER_OPTIONS.map((opt) => {
          const active = filter === opt.key;
          return (
            <button
              key={opt.key}
              onClick={() => setFilter(opt.key)}
              className="px-4 py-1.5 rounded-full text-[13px] font-medium whitespace-nowrap border-[1.5px] transition-colors"
              style={{
                borderColor: active ? 'var(--c-pri)' : 'var(--c-bd)',
                backgroundColor: active ? 'var(--c-pri)' : 'transparent',
                color: active ? '#fff' : 'var(--c-tx2)',
              }}
            >
              {opt.label} ({counts[opt.key] ?? 0})
            </button>
          );
        })}
      </div>

      <div className="mx-4 mb-3 flex items-center gap-2 px-3.5 h-11 rounded-lg border-[1.5px]"
        style={{ backgroundColor: 'var(--c-inp-bg)', borderColor: 'var(--c-bd)' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--c-tx3)" strokeWidth="2">
          <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
        </svg>
        <input
          type="text" placeholder={t.machines.searchPlaceholder} value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-transparent outline-none text-sm"
          style={{ color: 'var(--c-tx1)' }}
        />
      </div>

      {isLoading ? (
        <div className="space-y-2 px-4">{[1, 2, 3].map((i) => <div key={i} className="h-24 rounded-xl animate-pulse" style={{ backgroundColor: 'var(--c-bd2)' }} />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-sm" style={{ color: 'var(--c-tx3)' }}>{t.machines.noMachinesFound}</div>
      ) : (
        <div className={clsx('px-4', isDesktop ? 'grid grid-cols-2 gap-3' : 'space-y-2')}>
          {filtered.map((m) => {
            const displayStatus = getMachineDisplayStatus(m);
            const st = STATUS_MAP[displayStatus] || STATUS_MAP.offline;
            const ms = salesMap.get(m.funId);
            return (
              <div key={m.funId} className="rounded-xl border overflow-hidden" style={{ backgroundColor: 'var(--c-sf)', borderColor: 'var(--c-bd)' }}>
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ background: st.color }} />
                    <span className="text-[15px] font-bold flex-1 truncate" style={{ color: 'var(--c-tx1)' }}>{m.funName}</span>
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full" style={{ color: st.color, background: `color-mix(in srgb, ${st.color} 15%, transparent)` }}>
                      {st.label}
                    </span>
                  </div>
                  <div className="text-[12px] pl-5 mb-3" style={{ color: 'var(--c-tx3)' }}>{m.address || t.common.noLocation}</div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-lg p-2 text-center" style={{ backgroundColor: 'var(--c-page-bg)' }}>
                      <div className="text-[9px] font-medium" style={{ color: 'var(--c-tx3)' }}>{t.machines.todaySalesLabel}</div>
                      <div className="text-[13px] font-bold mt-0.5" style={{ color: 'var(--c-pri)', fontVariantNumeric: 'tabular-nums' }}>
                        {ms ? formatMoney(ms.totalSales) : '₩0'}
                      </div>
                    </div>
                    <div className="rounded-lg p-2 text-center" style={{ backgroundColor: 'var(--c-page-bg)' }}>
                      <div className="text-[9px] font-medium" style={{ color: 'var(--c-tx3)' }}>{t.machines.stock}</div>
                      <div className="text-[13px] font-bold mt-0.5" style={{ color: m.hasLowStock ? 'var(--c-warn)' : 'var(--c-tx1)', fontVariantNumeric: 'tabular-nums' }}>
                        {m.goodsRoadCount}{t.common.slots}
                      </div>
                    </div>
                    <div className="rounded-lg p-2 text-center" style={{ backgroundColor: 'var(--c-page-bg)' }}>
                      <div className="text-[9px] font-medium" style={{ color: 'var(--c-tx3)' }}>{t.machines.sales}</div>
                      <div className="text-[13px] font-bold mt-0.5" style={{ color: 'var(--c-tx1)', fontVariantNumeric: 'tabular-nums' }}>
                        {ms ? `${ms.totalOrders}${t.common.items}` : `0${t.common.items}`}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex border-t" style={{ borderColor: 'var(--c-bd2)' }}>
                  <button
                    onClick={() => navigate(`/machines/${m.funId}`)}
                    className="flex-1 py-2.5 text-[12px] font-semibold text-center"
                    style={{ color: 'var(--c-pri)' }}
                  >
                    {t.machines.details}
                  </button>
                  <div className="w-px" style={{ backgroundColor: 'var(--c-bd2)' }} />
                  <button
                    onClick={() => navigate(`/machines/${m.funId}?tab=stock`)}
                    className="flex-1 py-2.5 text-[12px] font-semibold text-center"
                    style={{ color: 'var(--c-tx2)' }}
                  >
                    {t.machines.checkStock}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

type SalesPeriod = 'today' | 'week' | 'month' | 'custom';

function SalesTab() {
  const [period, setPeriod] = useState<SalesPeriod>('month');
  const [calOpen, setCalOpen] = useState(false);
  const [customRange, setCustomRange] = useState<{ start: Date; end: Date } | null>(null);
  const t = useT();

  const range = (() => {
    const now = new Date();
    if (period === 'today') return { startTime: startOfDay(now).getTime(), endTime: endOfDay(now).getTime() };
    if (period === 'week') return { startTime: startOfWeek(now, { weekStartsOn: 1 }).getTime(), endTime: endOfDay(now).getTime() };
    if (period === 'custom' && customRange) return { startTime: startOfDay(customRange.start).getTime(), endTime: endOfDay(customRange.end).getTime() };
    return { startTime: startOfMonth(now).getTime(), endTime: endOfDay(now).getTime() };
  })();

  const enabled = period !== 'custom' || !!customRange;

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['salesStats', range.startTime, range.endTime],
    queryFn: () => salesApi.getStats(range),
    enabled,
  });

  const { data: machineStats, isLoading: machineLoading } = useQuery({
    queryKey: ['salesByMachine', range.startTime, range.endTime],
    queryFn: () => salesApi.getByMachine(range),
    enabled,
  });

  const totalSales = stats?.reduce((s, v) => s + v.decTotalOrderMoney, 0) ?? 0;
  const totalOrders = stats?.reduce((s, v) => s + v.totalOrderNumber, 0) ?? 0;
  const isLoading = statsLoading || machineLoading;

  const periodButtons: { key: SalesPeriod; label: string }[] = [
    { key: 'today', label: t.machines.today },
    { key: 'week', label: t.dashboard.week },
    { key: 'month', label: t.sales.monthly },
    { key: 'custom', label: t.dashboard.custom },
  ];

  function selectPeriod(key: SalesPeriod) {
    if (key === 'custom') { setCalOpen(true); return; }
    setPeriod(key);
  }

  return (
    <div className="px-4 pt-4 space-y-4">
      <div className="flex gap-2">
        {periodButtons.map(({ key, label }) => {
          const active = period === key;
          return (
            <button
              key={key}
              onClick={() => selectPeriod(key)}
              className="flex-1 py-2.5 rounded-[9px] text-[12.5px] font-semibold border-[1.5px] cursor-pointer"
              style={{
                borderColor: active ? 'var(--c-pri)' : 'var(--c-bd)',
                backgroundColor: active ? 'var(--c-pri)' : 'transparent',
                color: active ? '#fff' : 'var(--c-tx2)',
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="h-28 rounded-xl animate-pulse" style={{ backgroundColor: 'var(--c-bd2)' }} />
      ) : (
        <div className="rounded-xl p-5 text-white" style={{ background: 'linear-gradient(135deg, var(--c-pri), #1a4abf)' }}>
          <div className="text-[13px] text-white/80 mb-1">{t.machines.totalSales}</div>
          <div className="text-[28px] font-bold" style={{ fontVariantNumeric: 'tabular-nums' }}>{formatMoney(totalSales)}</div>
          <div className="flex gap-4 mt-3 text-[13px] text-white/90">
            <span>{t.machines.orderCountLabel} <b className="text-white">{totalOrders}{t.common.items}</b></span>
            <span>{t.machines.activeMachines} <b className="text-white">{machineStats?.length ?? 0}{t.common.units}</b></span>
          </div>
        </div>
      )}

      {!isLoading && machineStats && machineStats.length > 0 && (
        <div>
          <h3 className="text-[14px] font-bold mb-2" style={{ color: 'var(--c-tx1)' }}>{t.machines.salesByMachine}</h3>
          <div className="space-y-2">
            {machineStats.map((ms) => (
              <MachineSalesCard key={ms.funId} data={ms} />
            ))}
          </div>
        </div>
      )}

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

function MachineSalesCard({ data }: { data: MachineSalesData }) {
  const t = useT();
  const status = resolveDeviceStatus(data.funStatus, data.lineStatus);
  const STATUS_MAP: Record<string, { color: string }> = {
    online: { color: 'var(--c-ok)' },
    offline: { color: 'var(--c-off)' },
    fault: { color: 'var(--c-err)' },
    stopped: { color: 'var(--c-off)' },
  };
  const st = STATUS_MAP[status] || STATUS_MAP.offline;

  return (
    <div className="rounded-xl border p-4 overflow-hidden" style={{ backgroundColor: 'var(--c-sf)', borderColor: 'var(--c-bd)' }}>
      <div className="flex items-center gap-2 mb-2">
        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: st.color }} />
        <span className="text-sm font-bold flex-1 truncate" style={{ color: 'var(--c-tx1)' }}>{data.funName}</span>
      </div>
      <div className="flex gap-4 pl-[18px]">
        <div>
          <span className="text-[11px]" style={{ color: 'var(--c-tx3)' }}>{t.machines.revenue}</span>
          <div className="text-base font-bold" style={{ color: 'var(--c-pri)', fontVariantNumeric: 'tabular-nums' }}>{formatMoney(data.totalSales)}</div>
        </div>
        <div>
          <span className="text-[11px]" style={{ color: 'var(--c-tx3)' }}>{t.machines.orderCountLabel}</span>
          <div className="text-base font-bold" style={{ color: 'var(--c-tx1)', fontVariantNumeric: 'tabular-nums' }}>{data.totalOrders}{t.common.items}</div>
        </div>
      </div>
    </div>
  );
}

function ProductsTab() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [detailProduct, setDetailProduct] = useState<any>(null);
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const t = useT();

  const { data: allProducts, isLoading: productsLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => productApi.getAll({ size: 200 }),
  });

  const { data: sellingIds, isLoading: sellingLoading } = useQuery({
    queryKey: ['sellingIds'],
    queryFn: () => productApi.getSellingIds(),
  });

  const range = { startTime: startOfMonth(new Date()).getTime(), endTime: endOfDay(new Date()).getTime() };
  const { data: salesStats } = useQuery({
    queryKey: ['productSalesRank', range.startTime, range.endTime],
    queryFn: () => salesApi.getStats(range),
  });

  const isLoading = productsLoading || sellingLoading;
  const products = allProducts?.records ?? [];
  const sellingSet = new Set(sellingIds ?? []);
  const sellingProducts = products.filter((p) => sellingSet.has(p.goodsId));
  const unstockedProducts = products
    .filter((p) => !sellingSet.has(p.goodsId))
    .map((p) => ({
      id: String(p.goodsId),
      name: p.goodsName,
      type: p.goodsTypeName,
      sub: p.skuName ?? '',
      price: p.oldGoodsPrice,
    }));

  const categories = Array.from(new Set(sellingProducts.map((p) => p.goodsTypeName).filter(Boolean)));

  const filteredSelling = selectedCategory === 'all'
    ? sellingProducts
    : sellingProducts.filter((p) => p.goodsTypeName === selectedCategory);

  const salesMap = new Map<number, { sales: number; orders: number }>();
  if (salesStats) {
    for (const s of salesStats) {
      if (s.goodsId) salesMap.set(s.goodsId, { sales: s.decTotalOrderMoney, orders: s.totalOrderNumber });
    }
  }

  const ranked = [...filteredSelling].sort((a, b) => {
    const sa = salesMap.get(a.goodsId)?.sales ?? 0;
    const sb = salesMap.get(b.goodsId)?.sales ?? 0;
    return sb - sa;
  });

  if (isLoading) {
    return <div className="space-y-3 py-4 px-4">{[1, 2, 3].map((i) => <div key={i} className="h-24 rounded-xl animate-pulse" style={{ backgroundColor: 'var(--c-bd2)' }} />)}</div>;
  }

  return (
    <div className="pt-3 space-y-3">
      <div className="flex items-center gap-2 px-4 overflow-x-auto">
        <button
          onClick={() => setSelectedCategory('all')}
          className="px-3.5 py-1.5 rounded-full text-[13px] font-medium whitespace-nowrap border-[1.5px]"
          style={{
            borderColor: selectedCategory === 'all' ? 'var(--c-pri)' : 'var(--c-bd)',
            backgroundColor: selectedCategory === 'all' ? 'var(--c-pri)' : 'transparent',
            color: selectedCategory === 'all' ? '#fff' : 'var(--c-tx2)',
          }}
        >
          {t.common.all} ({sellingProducts.length})
        </button>
        {categories.map((cat) => {
          const active = selectedCategory === cat;
          const count = sellingProducts.filter((p) => p.goodsTypeName === cat).length;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className="px-3.5 py-1.5 rounded-full text-[13px] font-medium whitespace-nowrap border-[1.5px]"
              style={{
                borderColor: active ? 'var(--c-pri)' : 'var(--c-bd)',
                backgroundColor: active ? 'var(--c-pri)' : 'transparent',
                color: active ? '#fff' : 'var(--c-tx2)',
              }}
            >
              {cat} ({count})
            </button>
          );
        })}
      </div>

      {ranked.length === 0 ? (
        <div className="text-center py-16 text-sm" style={{ color: 'var(--c-tx3)' }}>{t.machines.noProductsOnSale}</div>
      ) : (
        <div className="px-4 space-y-2">
          {ranked.map((product, idx) => {
            const stat = salesMap.get(product.goodsId);
            const isLowStock = product.isList === 0;
            return (
              <div key={product.goodsId} className="rounded-xl border p-4" style={{ backgroundColor: 'var(--c-sf)', borderColor: 'var(--c-bd)' }}>
                <div className="flex gap-3">
                  <div
                    className="w-7 h-7 rounded-md flex items-center justify-center text-[13px] font-bold shrink-0"
                    style={{
                      backgroundColor: idx < 3 ? 'var(--c-pri-lt)' : 'var(--c-page-bg)',
                      color: idx < 3 ? 'var(--c-pri)' : 'var(--c-tx3)',
                    }}
                  >
                    {idx + 1}
                  </div>
                  <div className="w-14 h-14 rounded-lg shrink-0 overflow-hidden flex items-center justify-center" style={{ backgroundColor: 'var(--c-page-bg)' }}>
                    {product.fileUrl ? (
                      <img src={product.fileUrl} alt={product.goodsName} className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    ) : <span className="text-lg" style={{ color: 'var(--c-tx3)' }}>📦</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold truncate" style={{ color: 'var(--c-tx1)' }}>{product.goodsName}</span>
                      <span className="flex items-center gap-1 shrink-0">
                        <span className="w-[6px] h-[6px] rounded-full" style={{ backgroundColor: isLowStock ? 'var(--c-warn)' : 'var(--c-ok)' }} />
                        <span className="text-[10px] font-medium" style={{ color: isLowStock ? 'var(--c-warn)' : 'var(--c-ok)' }}>
                          {isLowStock ? t.machines.statusLowStock : t.machines.selling}
                        </span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] px-1.5 py-0.5 rounded" style={{ color: 'var(--c-tx3)', backgroundColor: 'var(--c-page-bg)' }}>
                        {product.goodsTypeName}
                      </span>
                      <span className="text-[12px] font-semibold" style={{ color: 'var(--c-tx2)' }}>
                        ₩{product.oldGoodsPrice.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-3 mt-1.5">
                      <div>
                        <span className="text-[11px]" style={{ color: 'var(--c-tx3)' }}>{t.machines.revenueLabel} </span>
                        <span className="text-[15px] font-bold" style={{ color: 'var(--c-pri)', fontVariantNumeric: 'tabular-nums' }}>{formatMoney(stat?.sales ?? 0)}</span>
                      </div>
                      <div>
                        <span className="text-[11px]" style={{ color: 'var(--c-tx3)' }}>{t.machines.salesLabel} </span>
                        <span className="text-sm font-medium" style={{ color: 'var(--c-tx1)' }}>{stat?.orders ?? 0}{t.common.items}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setDetailProduct({
                        name: product.goodsName,
                        type: product.goodsTypeName,
                        sub: product.skuName ?? '',
                        price: product.oldGoodsPrice,
                        code: product.skuCode || String(product.goodsId),
                        desc: product.goodsPresent ?? '',
                        stocked: true,
                        monthSales: formatMoney(stat?.sales ?? 0),
                        monthCnt: `${stat?.orders ?? 0}${t.common.items}`,
                      })}
                      className="text-[9px] font-semibold cursor-pointer mt-1 px-1.5 py-0.5 border rounded"
                      style={{ color: 'var(--c-pri)', borderColor: 'var(--c-pri)' }}
                    >
                      {t.machines.detailInfo}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {unstockedProducts.length > 0 && !orderModalOpen && (
        <FAB
          onClick={() => setOrderModalOpen(true)}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          }
        />
      )}

      <ProductDetailModal
        open={!!detailProduct}
        onClose={() => setDetailProduct(null)}
        product={detailProduct}
      />

      <OrderModal
        open={orderModalOpen}
        onClose={() => setOrderModalOpen(false)}
        products={unstockedProducts}
      />
    </div>
  );
}
