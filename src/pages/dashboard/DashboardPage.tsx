import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { dashboardApi } from '@/api/dashboard';
import { StatCard } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatMoney, type DeviceStatusType } from '@/types';
import { useNotificationStore } from '@/store/notificationStore';

export default function DashboardPage() {
  const navigate = useNavigate();
  const notifications = useNotificationStore((s) => s.notifications);

  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: dashboardApi.getData,
  });

  if (isLoading) {
    return (
      <div className="space-y-4 py-sp-4">
        <div className="h-6 bg-gray-200 rounded w-40 animate-pulse" />
        <div className="grid grid-cols-2 gap-sp-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card h-24 animate-pulse bg-gray-100" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-sp-3">
        <p className="text-body text-gray-500">데이터를 불러올 수 없습니다</p>
        <button
          onClick={() => window.location.reload()}
          className="text-primary-500 text-title"
        >
          다시 시도
        </button>
      </div>
    );
  }

  const recentAlerts = notifications.slice(0, 3);

  return (
    <div className="space-y-sp-6 py-sp-4">
      {/* 인사말 */}
      <div>
        <p className="text-caption text-gray-500">안녕하세요, 관리자님</p>
        <h2 className="text-heading-lg">오늘의 현황</h2>
      </div>

      {/* KPI 카드 */}
      <div className="grid grid-cols-2 gap-sp-3">
        <StatCard label="오늘 매출" value={formatMoney(data.todaySales)} highlight />
        <StatCard label="주문 건수" value={data.todayOrders} />
        <StatCard label="운영 설비" value={`${data.statusSummary.online}/${data.totalMachines}`} />
        <StatCard
          label="재고 부족"
          value={notifications.filter((n) => n.type === 'inventory' && !n.isRead).length}
          sub={notifications.length > 0 ? '확인 필요' : undefined}
        />
      </div>

      {/* 설비 상태 요약 */}
      <section>
        <div className="flex items-center justify-between mb-sp-3">
          <h3 className="text-heading">설비 현황</h3>
          <button onClick={() => navigate('/machines')} className="text-caption text-primary-500">
            전체 보기
          </button>
        </div>
        <div className="card flex items-center justify-around py-sp-4">
          {(Object.entries(data.statusSummary) as [DeviceStatusType, number][]).map(([status, count]) => (
            <div key={status} className="flex flex-col items-center gap-sp-1">
              <span className="text-heading-lg">{count}</span>
              <StatusBadge status={status} size="sm" />
            </div>
          ))}
        </div>
      </section>

      {/* 최근 알림 */}
      <section>
        <div className="flex items-center justify-between mb-sp-3">
          <h3 className="text-heading">최근 알림</h3>
          <button onClick={() => navigate('/messages')} className="text-caption text-primary-500">
            전체 보기
          </button>
        </div>
        {recentAlerts.length === 0 ? (
          <div className="card text-center py-sp-8 text-body text-gray-400">
            새로운 알림이 없습니다
          </div>
        ) : (
          <div className="space-y-sp-2">
            {recentAlerts.map((alert) => (
              <div key={alert.id} className="card flex items-start gap-sp-3">
                <span className="text-lg">
                  {alert.type === 'inventory' ? '⚠️' : alert.type === 'status' ? '⚡' : '✅'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-title truncate">{alert.title}</p>
                  <p className="text-caption text-gray-500 truncate">{alert.body}</p>
                  <p className="text-meta text-gray-400 mt-sp-1">
                    {new Date(alert.timestamp).toLocaleString('ko-KR')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
