import { useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useMachineDetail } from '@/hooks/useMachines';
import { useSlots } from '@/hooks/useSlots';
import { resolveDeviceStatus, formatMoney } from '@/types';
import { SlotGrid } from '@/components/machines/SlotGrid';
import { useT } from '@/i18n/useT';

type DetailTab = 'info' | 'stock';

export default function MachineDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const funId = id ? Number(id) : undefined;
  const initialTab = searchParams.get('tab') === 'stock' ? 'stock' : 'info';
  const [activeTab, setActiveTab] = useState<DetailTab>(initialTab);
  const t = useT();

  const { data: machine, isLoading: machineLoading } = useMachineDetail(funId);
  const { data: roads, isLoading: roadsLoading } = useSlots(funId);

  if (machineLoading) {
    return (
      <div className="space-y-4 py-4">
        <div className="h-28 rounded-[18px] animate-pulse" style={{ backgroundColor: 'var(--c-bd2)' }} />
        <div className="h-64 rounded-xl animate-pulse" style={{ backgroundColor: 'var(--c-bd2)' }} />
      </div>
    );
  }

  if (!machine) {
    return (
      <div className="text-center py-20 text-sm" style={{ color: 'var(--c-tx3)' }}>
        {t.machineDetail.notFound}
      </div>
    );
  }

  const status = resolveDeviceStatus(machine.funStatus, machine.lineStatus);
  const statusLabel: Record<string, string> = {
    online: t.machines.statusOnline,
    offline: t.machines.statusOffline,
    fault: t.machines.statusFault,
    stopped: t.machines.statusStopped,
  };
  const dotColor: Record<string, string> = { online: '#34D399', offline: '#9AA0AC', fault: '#F87171', stopped: '#6B7280' };

  const stocked = (roads || []).filter((r) => r.goodsId != null);
  const totalStock = stocked.reduce((s, r) => s + r.stockCurr, 0);
  const totalCap = stocked.reduce((s, r) => s + r.stockMax, 0);

  const slots = (roads || []).map((r) => ({
    row: r.roadRow - 1,
    col: r.roadColumn - 1,
    productName: r.goodsName ?? r.roadCode,
    stock: r.stockCurr,
    capacity: r.stockMax,
  }));

  const tabLabels: Record<DetailTab, string> = {
    info: t.machineDetail.detailView,
    stock: t.machineDetail.stockCheck,
  };

  return (
    <div className="pb-4">
      {/* Blue hero card */}
      <div className="rounded-[18px] p-5 text-white mb-4" style={{ background: 'linear-gradient(135deg, var(--c-pri), #1a4abf)' }}>
        <div className="flex items-center gap-3 mb-3.5">
          <div className="w-[46px] h-[46px] rounded-[13px] flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,255,255,.18)' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="#fff">
              <path d="M4 3h16a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1V4a1 1 0 011-1zm0 7h7a1 1 0 011 1v9a1 1 0 01-1 1H4a1 1 0 01-1-1v-9a1 1 0 011-1zm10 2h6a1 1 0 011 1v7a1 1 0 01-1 1h-6a1 1 0 01-1-1v-7a1 1 0 011-1z" />
            </svg>
          </div>
          <div>
            <div className="text-base font-bold">{machine.funName}</div>
            <div className="text-[11.5px] opacity-80 mt-0.5">{machine.funCode} · {machine.deptName || '-'}</div>
          </div>
        </div>
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-[7px]" style={{ background: 'rgba(255,255,255,.18)' }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: dotColor[status] ?? '#9AA0AC' }} />
          {statusLabel[status] ?? status}
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-2 mb-4">
        {(['info', 'stock'] as DetailTab[]).map((key) => {
          const active = activeTab === key;
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className="flex-1 py-2.5 text-[13px] font-semibold rounded-[9px] border-[1.5px] cursor-pointer"
              style={{
                borderColor: active ? 'var(--c-pri)' : 'var(--c-bd)',
                backgroundColor: active ? 'var(--c-pri)' : 'transparent',
                color: active ? '#fff' : 'var(--c-tx2)',
              }}
            >
              {tabLabels[key]}
            </button>
          );
        })}
      </div>

      {activeTab === 'info' ? (
        <InfoContent machine={machine} />
      ) : (
        <StockContent
          totalStock={totalStock}
          totalCap={totalCap}
          slots={slots}
          loading={roadsLoading}
        />
      )}
    </div>
  );
}

function InfoContent({ machine }: { machine: any }) {
  const t = useT();

  const rows = [
    { label: t.machineDetail.machineNo, value: machine.funCode || '-' },
    { label: t.machineDetail.machineName, value: machine.funName || '-' },
    { label: t.machineDetail.imei, value: machine.imei || '-' },
    { label: t.machineDetail.operator, value: machine.deptName || '-' },
    { label: t.machineDetail.manager, value: machine.adminName || '-' },
    { label: t.machineDetail.contact, value: machine.adminPhone || '-' },
    { label: t.machineDetail.installDate, value: machine.createTime ? new Date(machine.createTime).toLocaleDateString('ko-KR') : '-' },
    { label: t.machineDetail.address, value: machine.address || '-' },
    { label: t.machineDetail.lastConnection, value: machine.lastOnlineTime || '-' },
  ];

  return (
    <>
      <div className="grid grid-cols-2 gap-2.5 mb-3.5">
        <div className="rounded-xl p-3 border" style={{ backgroundColor: 'var(--c-sf)', borderColor: 'var(--c-bd)' }}>
          <div className="text-[9.5px] uppercase tracking-wider" style={{ color: 'var(--c-tx3)' }}>{t.machineDetail.todayRevenue}</div>
          <div className="text-[15px] font-bold mt-1" style={{ color: 'var(--c-pri)', fontVariantNumeric: 'tabular-nums' }}>
            {formatMoney(0)}
          </div>
        </div>
        <div className="rounded-xl p-3 border" style={{ backgroundColor: 'var(--c-sf)', borderColor: 'var(--c-bd)' }}>
          <div className="text-[9.5px] uppercase tracking-wider" style={{ color: 'var(--c-tx3)' }}>{t.machineDetail.todaySales}</div>
          <div className="text-[15px] font-bold mt-1" style={{ color: 'var(--c-tx1)', fontVariantNumeric: 'tabular-nums' }}>
            0{t.common.items}
          </div>
        </div>
      </div>

      <div className="rounded-[14px] px-4 border" style={{ backgroundColor: 'var(--c-sf)', borderColor: 'var(--c-bd)' }}>
        {rows.map((row, i) => (
          <div
            key={row.label}
            className="flex py-3"
            style={i < rows.length - 1 ? { borderBottom: '1px solid var(--c-bd2)' } : undefined}
          >
            <span className="w-[110px] text-xs font-medium flex-shrink-0" style={{ color: 'var(--c-tx3)' }}>{row.label}</span>
            <span className="flex-1 text-[12.5px] font-medium" style={{ color: 'var(--c-tx1)' }}>{row.value}</span>
          </div>
        ))}
      </div>
    </>
  );
}

function StockContent({ totalStock, totalCap, slots, loading }: {
  totalStock: number;
  totalCap: number;
  slots: { row: number; col: number; productName?: string; stock: number; capacity: number }[];
  loading: boolean;
}) {
  const t = useT();

  if (loading) {
    return <div className="h-64 rounded-xl animate-pulse" style={{ backgroundColor: 'var(--c-bd2)' }} />;
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-2.5 mb-4">
        <div className="rounded-xl p-3 border" style={{ backgroundColor: 'var(--c-sf)', borderColor: 'var(--c-bd)' }}>
          <div className="text-[9.5px] uppercase tracking-wider" style={{ color: 'var(--c-tx3)' }}>{t.machineDetail.totalSlots}</div>
          <div className="text-[15px] font-bold mt-1" style={{ color: 'var(--c-tx1)' }}>56 (7×8)</div>
        </div>
        <div className="rounded-xl p-3 border" style={{ backgroundColor: 'var(--c-sf)', borderColor: 'var(--c-bd)' }}>
          <div className="text-[9.5px] uppercase tracking-wider" style={{ color: 'var(--c-tx3)' }}>{t.machineDetail.currentStock}</div>
          <div className="text-[15px] font-bold mt-1" style={{ color: 'var(--c-ok)', fontVariantNumeric: 'tabular-nums' }}>
            {totalStock}/{totalCap}
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center mb-2.5">
        <div className="text-[13.5px] font-bold" style={{ color: 'var(--c-tx1)' }}>{t.machineDetail.slotStatus(7, 8)}</div>
      </div>

      <SlotGrid slots={slots} rows={8} cols={7} />
    </>
  );
}
