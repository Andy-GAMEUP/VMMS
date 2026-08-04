import { useEffect, useState } from 'react';
import { useNotificationStore } from '@/store/notificationStore';
import { apiGet } from '@/api/client';
import { clsx } from 'clsx';
import { useT } from '@/i18n/useT';
import type { Notification } from '@/types';

type FilterType = 'all' | 'inventory' | 'status' | 'stock';

export default function NoticesPage() {
  const t = useT();
  const { notifications, addNotification, markAsRead, markAllAsRead, unreadCount } =
    useNotificationStore();
  const [filter, setFilter] = useState<FilterType>('all');
  const [historyLoaded, setHistoryLoaded] = useState(false);

  const FILTER_OPTIONS: { key: FilterType; label: string; icon: string }[] = [
    { key: 'all', label: t.common.all, icon: '📋' },
    { key: 'inventory', label: t.messages.lowStock, icon: '⚠️' },
    { key: 'status', label: t.messages.statusChange, icon: '⚡' },
    { key: 'stock', label: t.messages.restocked, icon: '✅' },
  ];

  useEffect(() => {
    if (historyLoaded) return;
    apiGet<Notification[]>('/notifications/history', { limit: 50 })
      .then((history) => {
        const existingIds = new Set(notifications.map((n) => n.id));
        for (const n of history) {
          if (!existingIds.has(n.id)) {
            addNotification(n);
          }
        }
        setHistoryLoaded(true);
      })
      .catch(() => {
        setHistoryLoaded(true);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered =
    filter === 'all' ? notifications : notifications.filter((n) => n.type === filter);

  return (
    <div className="space-y-sp-4 py-sp-4">
      <div className="flex items-center justify-between">
        <h2 className="text-heading" style={{ color: 'var(--c-tx1)' }}>
          {t.messages.alerts}
          {unreadCount > 0 && (
            <span className="ml-sp-2 inline-flex items-center justify-center w-5 h-5 text-xs text-white rounded-full" style={{ backgroundColor: 'var(--c-err)' }}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </h2>
        {notifications.length > 0 && (
          <button onClick={markAllAsRead} className="text-caption touch-target" style={{ color: 'var(--c-pri)' }}>
            {t.messages.markAllRead}
          </button>
        )}
      </div>

      <div className="flex gap-sp-2 overflow-x-auto pb-sp-1 -mx-sp-4 px-sp-4 pr-sp-8 scrollbar-none">
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.key}
            onClick={() => setFilter(opt.key)}
            className="flex items-center gap-1 px-sp-3 py-sp-2 rounded-full text-sm whitespace-nowrap transition-colors"
            style={{
              backgroundColor: filter === opt.key ? 'var(--c-pri)' : 'var(--c-sf)',
              color: filter === opt.key ? '#fff' : 'var(--c-tx2)',
              border: filter === opt.key ? 'none' : '1px solid var(--c-bd)',
            }}
          >
            <span>{opt.icon}</span>
            <span>{opt.label}</span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-4xl mb-sp-3">🔔</p>
          <p className="text-body" style={{ color: 'var(--c-tx3)' }}>
            {filter === 'all' ? t.messages.noNewAlerts : t.messages.noAlertType}
          </p>
          <p className="text-caption mt-sp-1" style={{ color: 'var(--c-tx3)', opacity: 0.7 }}>
            {t.messages.alertHint}
          </p>
        </div>
      ) : (
        <div className="space-y-sp-2">
          {filtered.map((n) => (
            <button
              key={n.id}
              onClick={() => markAsRead(n.id)}
              className={clsx(
                'card w-full flex items-start gap-sp-3 text-left transition-all',
                !n.isRead && 'border-l-3',
              )}
              style={!n.isRead ? { borderLeftColor: 'var(--c-pri)', backgroundColor: 'var(--c-pri-lt)' } : undefined}
            >
              <span className="text-lg mt-0.5 shrink-0">
                {n.type === 'inventory' ? '⚠️' : n.type === 'status' ? '⚡' : '✅'}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-sp-2">
                  <p className={clsx('text-title truncate', !n.isRead && 'font-bold')} style={{ color: 'var(--c-tx1)' }}>
                    {n.title}
                  </p>
                  <span className="text-meta shrink-0" style={{ color: 'var(--c-tx3)' }}>
                    {formatTimeAgo(n.timestamp, t)}
                  </span>
                </div>
                <p className="text-caption mt-0.5 line-clamp-2" style={{ color: 'var(--c-tx2)' }}>{n.body}</p>
                <p className="text-meta mt-sp-1" style={{ color: 'var(--c-tx3)' }}>{n.funName}</p>
              </div>
              {!n.isRead && <span className="w-2 h-2 rounded-full mt-2 shrink-0" style={{ backgroundColor: 'var(--c-pri)' }} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

type Translations = ReturnType<typeof useT>;

function formatTimeAgo(ts: number, t: Translations): string {
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60000);
  if (min < 1) return t.common.justNow;
  if (min < 60) return t.common.minAgo(min);
  const hr = Math.floor(min / 60);
  if (hr < 24) return t.common.hrAgo(hr);
  const day = Math.floor(hr / 24);
  if (day < 7) return t.common.dayAgo(day);
  return new Date(ts).toLocaleDateString('ko-KR');
}
