/**
 * 알림 페이지
 * - SSE로 수신된 실시간 알림 표시
 * - 서버 히스토리에서 초기 로드
 * - 타입별 필터링
 */

import { useEffect, useState } from 'react';
import { useNotificationStore } from '@/store/notificationStore';
import { apiGet } from '@/api/client';
import { clsx } from 'clsx';
import type { Notification } from '@/types';

type FilterType = 'all' | 'inventory' | 'status' | 'stock';

const FILTER_OPTIONS: { key: FilterType; label: string; icon: string }[] = [
  { key: 'all', label: '전체', icon: '📋' },
  { key: 'inventory', label: '재고부족', icon: '⚠️' },
  { key: 'status', label: '상태변경', icon: '⚡' },
  { key: 'stock', label: '보충완료', icon: '✅' },
];

export default function NoticesPage() {
  const { notifications, addNotification, markAsRead, markAllAsRead, unreadCount } =
    useNotificationStore();
  const [filter, setFilter] = useState<FilterType>('all');
  const [historyLoaded, setHistoryLoaded] = useState(false);

  // 서버 히스토리 초기 로드 (최초 1회)
  useEffect(() => {
    if (historyLoaded) return;
    apiGet<Notification[]>('/notifications/history', { limit: 50 })
      .then((history) => {
        // 이미 store에 있는 ID는 건너뜀
        const existingIds = new Set(notifications.map((n) => n.id));
        for (const n of history) {
          if (!existingIds.has(n.id)) {
            addNotification(n);
          }
        }
        setHistoryLoaded(true);
      })
      .catch(() => {
        setHistoryLoaded(true); // 실패해도 진행
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered =
    filter === 'all' ? notifications : notifications.filter((n) => n.type === filter);

  return (
    <div className="space-y-sp-4 py-sp-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h2 className="text-heading">
          알림
          {unreadCount > 0 && (
            <span className="ml-sp-2 inline-flex items-center justify-center w-5 h-5 text-xs bg-danger-500 text-white rounded-full">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </h2>
        {notifications.length > 0 && (
          <button onClick={markAllAsRead} className="text-caption text-primary-500 touch-target">
            모두 읽음
          </button>
        )}
      </div>

      {/* 필터 탭 */}
      <div className="flex gap-sp-2 overflow-x-auto pb-sp-1 -mx-sp-4 px-sp-4 scrollbar-none">
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.key}
            onClick={() => setFilter(opt.key)}
            className={clsx(
              'flex items-center gap-1 px-sp-3 py-sp-2 rounded-full text-sm whitespace-nowrap transition-colors',
              filter === opt.key
                ? 'bg-primary-500 text-white'
                : 'bg-white text-gray-600 border border-gray-200',
            )}
          >
            <span>{opt.icon}</span>
            <span>{opt.label}</span>
          </button>
        ))}
      </div>

      {/* 알림 목록 */}
      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-4xl mb-sp-3">🔔</p>
          <p className="text-body text-gray-400">
            {filter === 'all' ? '새로운 알림이 없습니다' : '해당 유형의 알림이 없습니다'}
          </p>
          <p className="text-caption text-gray-300 mt-sp-1">
            자판기 상태 변경 시 실시간으로 알림을 받게 됩니다
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
                !n.isRead && 'border-l-3 border-l-primary-500 bg-primary-50/30',
              )}
            >
              <span className="text-lg mt-0.5 shrink-0">
                {n.type === 'inventory' ? '⚠️' : n.type === 'status' ? '⚡' : '✅'}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-sp-2">
                  <p className={clsx('text-title truncate', !n.isRead && 'font-bold')}>
                    {n.title}
                  </p>
                  <span className="text-meta text-gray-400 shrink-0">
                    {formatTimeAgo(n.timestamp)}
                  </span>
                </div>
                <p className="text-caption text-gray-500 mt-0.5 line-clamp-2">{n.body}</p>
                <p className="text-meta text-gray-400 mt-sp-1">{n.funName}</p>
              </div>
              {!n.isRead && <span className="w-2 h-2 rounded-full bg-primary-500 mt-2 shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** 시간 ago 표시 */
function formatTimeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60000);
  if (min < 1) return '방금';
  if (min < 60) return `${min}분 전`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}시간 전`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}일 전`;
  return new Date(ts).toLocaleDateString('ko-KR');
}
