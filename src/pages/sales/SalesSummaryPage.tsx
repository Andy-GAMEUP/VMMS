import { useState } from 'react';
import { clsx } from 'clsx';
import { useSalesStats } from '@/hooks/useSales';
import { formatMoney, type SalesStatType } from '@/types';

const PERIOD_OPTIONS: { key: SalesStatType; label: string }[] = [
  { key: 'day', label: '오늘' },
  { key: 'week', label: '이번주' },
  { key: 'month', label: '이번달' },
  { key: 'year', label: '올해' },
];

export default function SalesSummaryPage() {
  const [period, setPeriod] = useState<SalesStatType>('day');
  const { data: stats, isLoading } = useSalesStats({ statType: period });

  const totalSales = stats?.reduce((sum, s) => sum + s.decTotalOrderMoney, 0) ?? 0;
  const totalOrders = stats?.reduce((sum, s) => sum + s.totalOrderNumber, 0) ?? 0;

  return (
    <div className="space-y-sp-4 py-sp-4">
      <h2 className="text-heading">매출 현황</h2>

      {/* 기간 선택 */}
      <div className="flex gap-sp-2">
        {PERIOD_OPTIONS.map((opt) => (
          <button
            key={opt.key}
            onClick={() => setPeriod(opt.key)}
            className={clsx(
              'px-4 py-2 rounded-badge text-caption flex-1 touch-target',
              period === opt.key ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-600',
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="card h-40 animate-pulse bg-gray-100" />
      ) : (
        <>
          {/* 요약 */}
          <div className="card">
            <p className="text-meta text-gray-500 mb-sp-1">총 매출</p>
            <p className="font-money text-3xl text-gray-900">{formatMoney(totalSales)}</p>
            <p className="text-caption text-gray-400 mt-sp-1">주문 {totalOrders}건</p>
          </div>

          {/* 상품별 (goods 통계일 때) */}
          {stats && stats.length > 0 && stats[0].goodsName && (
            <div className="card">
              <h3 className="text-title mb-sp-3">상품별 매출</h3>
              <div className="space-y-sp-3">
                {stats
                  .sort((a, b) => b.decTotalOrderMoney - a.decTotalOrderMoney)
                  .map((s, i) => (
                    <div key={s.goodsId ?? i} className="flex items-center gap-sp-3">
                      <span className="text-meta text-gray-400 w-5">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-body truncate">{s.goodsName}</p>
                        <p className="text-meta text-gray-400">{s.totalOrderNumber}건</p>
                      </div>
                      <span className="text-title font-tabular">{formatMoney(s.decTotalOrderMoney)}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
