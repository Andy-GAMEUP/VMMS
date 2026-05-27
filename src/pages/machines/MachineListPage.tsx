import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { useMachines } from '@/hooks/useMachines';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { resolveDeviceStatus, type DeviceStatusType } from '@/types';

const FILTER_OPTIONS: { key: DeviceStatusType | 'all'; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'online', label: '정상' },
  { key: 'offline', label: '오프라인' },
  { key: 'fault', label: '고장' },
  { key: 'stopped', label: '정지' },
];

export default function MachineListPage() {
  const navigate = useNavigate();
  const { data: machines, isLoading } = useMachines();
  const [filter, setFilter] = useState<DeviceStatusType | 'all'>('all');
  const [search, setSearch] = useState('');

  const filtered = (machines || []).filter((m) => {
    const status = resolveDeviceStatus(m.funStatus, m.lineStatus);
    if (filter !== 'all' && status !== filter) return false;
    if (search && !m.funName.includes(search) && !m.address.includes(search)) return false;
    return true;
  });

  const counts = (machines || []).reduce(
    (acc, m) => {
      const s = resolveDeviceStatus(m.funStatus, m.lineStatus);
      acc[s] = (acc[s] || 0) + 1;
      acc.all = (acc.all || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <div className="space-y-sp-4 py-sp-4">
      <h2 className="text-heading">자판기 관리</h2>

      {/* 검색 */}
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
        <input
          type="text"
          placeholder="자판기명 또는 주소 검색"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 h-11 rounded-input border border-gray-200 bg-white text-body focus:border-primary-500 focus:outline-none"
        />
      </div>

      {/* 필터 칩 */}
      <div className="flex gap-sp-2 overflow-x-auto pb-1 -mx-sp-4 px-sp-4">
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.key}
            onClick={() => setFilter(opt.key)}
            className={clsx(
              'px-3 py-1.5 rounded-badge text-caption whitespace-nowrap transition-colors touch-target',
              filter === opt.key
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 text-gray-600',
            )}
          >
            {opt.label} {counts[opt.key] ?? 0}
          </button>
        ))}
      </div>

      {/* 목록 */}
      {isLoading ? (
        <div className="space-y-sp-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card h-20 animate-pulse bg-gray-100" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-body text-gray-400">
          조건에 맞는 자판기가 없습니다
        </div>
      ) : (
        <div className="space-y-sp-2">
          {filtered.map((m) => {
            const status = resolveDeviceStatus(m.funStatus, m.lineStatus);
            return (
              <button
                key={m.funId}
                onClick={() => navigate(`/machines/${m.funId}`)}
                className="card w-full flex items-center gap-sp-3 text-left active:shadow-card-hover"
              >
                {/* 상태 원 */}
                <div
                  className={clsx(
                    'w-10 h-10 rounded-full flex items-center justify-center',
                    status === 'online' && 'bg-success-50',
                    status === 'offline' && 'bg-warning-50',
                    status === 'fault' && 'bg-danger-50',
                    status === 'stopped' && 'bg-gray-100',
                  )}
                >
                  <span className={clsx('status-dot', `status-dot--${status}`)} />
                </div>
                {/* 정보 */}
                <div className="flex-1 min-w-0">
                  <p className="text-title truncate">{m.funName}</p>
                  <p className="text-caption text-gray-500 truncate">
                    {m.address} · {m.goodsRoadCount}슬롯
                  </p>
                </div>
                {/* 뱃지 */}
                <StatusBadge status={status} size="sm" />
                {/* 화살표 */}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
