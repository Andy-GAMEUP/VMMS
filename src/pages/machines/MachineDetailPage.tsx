import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { clsx } from 'clsx';
import { useMachineDetail } from '@/hooks/useMachines';
import { useSlots } from '@/hooks/useSlots';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Tabs } from '@/components/ui/Tabs';
import { resolveDeviceStatus, resolveStockLevel, STOCK_LEVEL_MAP } from '@/types';

const DETAIL_TABS = [
  { key: 'info', label: '정보' },
  { key: 'slots', label: '슬롯' },
  { key: 'inventory', label: '재고' },
];

export default function MachineDetailPage() {
  const { id } = useParams<{ id: string }>();
  const funId = id ? Number(id) : undefined;
  const [activeTab, setActiveTab] = useState('info');

  const { data: machine, isLoading: machineLoading } = useMachineDetail(funId);
  const { data: roads, isLoading: roadsLoading } = useSlots(funId);

  if (machineLoading) {
    return (
      <div className="space-y-4 py-sp-4">
        <div className="card h-32 animate-pulse bg-gray-100" />
        <div className="card h-64 animate-pulse bg-gray-100" />
      </div>
    );
  }

  if (!machine) {
    return (
      <div className="text-center py-20 text-body text-gray-400">
        설비 정보를 찾을 수 없습니다
      </div>
    );
  }

  const status = resolveDeviceStatus(machine.funStatus, machine.lineStatus);

  return (
    <div className="space-y-sp-4 py-sp-4">
      {/* 기기 헤더 */}
      <div className="card">
        <div className="flex items-start justify-between mb-sp-3">
          <div>
            <h2 className="text-heading">{machine.funName}</h2>
            <p className="text-caption text-gray-500">{machine.funCode}</p>
          </div>
          <StatusBadge status={status} />
        </div>
        <div className="grid grid-cols-2 gap-sp-3 text-body">
          <div>
            <span className="text-meta text-gray-400 block">설치 위치</span>
            <span>{machine.address}</span>
          </div>
          <div>
            <span className="text-meta text-gray-400 block">담당 부서</span>
            <span>{machine.deptName}</span>
          </div>
          <div>
            <span className="text-meta text-gray-400 block">온도</span>
            <span>{machine.temperature}°C</span>
          </div>
          <div>
            <span className="text-meta text-gray-400 block">재고 예경</span>
            <span>{machine.funWaring}개 이하</span>
          </div>
        </div>
      </div>

      {/* 탭 */}
      <Tabs
        tabs={DETAIL_TABS.map((t) => ({
          ...t,
          count: t.key === 'slots' ? machine.goodsRoadCount : undefined,
        }))}
        activeKey={activeTab}
        onChange={setActiveTab}
      />

      {/* 탭 콘텐츠 */}
      {activeTab === 'info' && <InfoTab machine={machine} />}
      {activeTab === 'slots' && <SlotsTab roads={roads || []} loading={roadsLoading} />}
      {activeTab === 'inventory' && <InventoryTab roads={roads || []} loading={roadsLoading} />}
    </div>
  );
}

/** 기본정보 탭 */
function InfoTab({ machine }: { machine: NonNullable<ReturnType<typeof useMachineDetail>['data']> }) {
  const rows = [
    ['IMEI', machine.imei || '-'],
    ['IP', machine.ip || '-'],
    ['GPS', machine.gpsX && machine.gpsY ? `${machine.gpsY}, ${machine.gpsX}` : '-'],
    ['펌웨어', machine.version || '-'],
    ['등록일', machine.createTime ? new Date(machine.createTime).toLocaleDateString('ko-KR') : '-'],
  ];

  return (
    <div className="card divide-y divide-gray-100">
      {rows.map(([label, value]) => (
        <div key={label} className="flex items-center justify-between py-sp-3">
          <span className="text-caption text-gray-500">{label}</span>
          <span className="text-body font-medium">{value}</span>
        </div>
      ))}
    </div>
  );
}

/** 슬롯 그리드 탭 */
function SlotsTab({ roads, loading }: { roads: Array<{ roadCode: string; stockCurr: number; stockMax: number; goodsName: string; roadRow: number; roadColumn: number }>; loading: boolean }) {
  if (loading) return <div className="card h-64 animate-pulse bg-gray-100" />;
  if (roads.length === 0) return <div className="card text-center py-sp-8 text-body text-gray-400">화도 정보가 없습니다</div>;

  const maxRow = Math.max(...roads.map((r) => r.roadRow), 0);
  const maxCol = Math.max(...roads.map((r) => r.roadColumn), 0);

  const grid: (typeof roads[0] | null)[][] = Array.from({ length: maxRow }, () =>
    Array.from({ length: maxCol }, () => null),
  );
  for (const road of roads) {
    if (road.roadRow > 0 && road.roadColumn > 0) {
      grid[road.roadRow - 1][road.roadColumn - 1] = road;
    }
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-sp-3">
        <h3 className="text-title">화도 현황</h3>
        <span className="text-meta text-gray-400">{maxCol}열 x {maxRow}행 = {roads.length}슬롯</span>
      </div>

      <div className="flex flex-col gap-sp-2">
        {grid.map((row, ri) => (
          <div key={ri} className="flex gap-sp-2 justify-center">
            {row.map((cell, ci) => {
              if (!cell) {
                return <div key={ci} className="slot-cell slot-cell--none">-</div>;
              }
              const level = resolveStockLevel(cell.stockCurr, cell.stockMax);
              const { cellClass } = STOCK_LEVEL_MAP[level];
              return (
                <div key={ci} className={clsx('slot-cell', cellClass)} title={cell.goodsName}>
                  <span className="text-[10px]">{cell.roadCode}</span>
                  <span className="font-bold">{cell.stockCurr}</span>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* 범례 */}
      <div className="flex flex-wrap gap-sp-3 mt-sp-4 text-meta text-gray-500">
        {Object.entries(STOCK_LEVEL_MAP).map(([, { label, cellClass }]) => (
          <span key={label} className="flex items-center gap-1">
            <span className={clsx('w-3 h-3 rounded', cellClass.replace('slot-cell--', 'border-2 '))} />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

/** 재고현황 탭 */
function InventoryTab({ roads, loading }: { roads: Array<{ roadCode: string; stockCurr: number; stockMax: number; goodsName: string }>; loading: boolean }) {
  if (loading) return <div className="card h-64 animate-pulse bg-gray-100" />;
  if (roads.length === 0) return <div className="card text-center py-sp-8 text-body text-gray-400">재고 정보가 없습니다</div>;

  const totalStock = roads.reduce((s, r) => s + r.stockCurr, 0);
  const totalCapacity = roads.reduce((s, r) => s + r.stockMax, 0);
  const stockRate = totalCapacity > 0 ? Math.round((totalStock / totalCapacity) * 100) : 0;

  const sorted = [...roads].sort((a, b) => {
    const rateA = a.stockMax > 0 ? a.stockCurr / a.stockMax : 1;
    const rateB = b.stockMax > 0 ? b.stockCurr / b.stockMax : 1;
    return rateA - rateB;
  });

  return (
    <div className="space-y-sp-3">
      {/* 전체 재고율 */}
      <div className="card">
        <div className="flex items-center justify-between mb-sp-2">
          <span className="text-title">총 재고율</span>
          <span className={clsx('font-money text-xl', stockRate < 30 ? 'text-danger-500' : 'text-success-500')}>
            {stockRate}%
          </span>
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={clsx('h-full rounded-full', stockRate < 30 ? 'bg-danger-500' : stockRate < 60 ? 'bg-warning-500' : 'bg-success-500')}
            style={{ width: `${stockRate}%` }}
          />
        </div>
        <p className="text-meta text-gray-400 mt-sp-1">총 {totalStock}/{totalCapacity}</p>
      </div>

      {/* 화도별 재고 바 */}
      <div className="card space-y-sp-3">
        {sorted.map((road) => {
          const rate = road.stockMax > 0 ? Math.round((road.stockCurr / road.stockMax) * 100) : 0;
          return (
            <div key={road.roadCode}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-caption">
                  {road.roadCode} <span className="text-gray-400">{road.goodsName}</span>
                </span>
                <span className="text-meta font-tabular">{rate}%</span>
              </div>
              <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={clsx('h-full rounded-full', rate < 20 ? 'bg-danger-500' : rate < 50 ? 'bg-warning-500' : 'bg-success-500')}
                  style={{ width: `${rate}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
