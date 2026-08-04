import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { clsx } from 'clsx';
import { useNotificationStore } from '@/store/notificationStore';
import { apiGet } from '@/api/client';
import { chatApi, type ChatRoomSummary } from '@/api/chat';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { FAB } from '@/components/ui/FAB';
import { DMComposeModal } from '@/components/modals/DMComposeModal';
import { useT } from '@/i18n/useT';
import type { Notification } from '@/types';

type MainTab = 'alerts' | 'dm';
type AlertFilter = 'all' | 'inventory' | 'status' | 'stock';

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
  return new Date(ts).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
}

export default function MessagesPage() {
  const t = useT();
  const [mainTab, setMainTab] = useState<MainTab>('alerts');
  const [dmComposeOpen, setDmComposeOpen] = useState(false);
  const notifUnread = useNotificationStore((s) => s.unreadCount);
  const { data: chatRooms } = useQuery({
    queryKey: ['chatRooms'],
    queryFn: chatApi.getRooms,
    refetchInterval: 10000,
  });
  const dmUnread = (chatRooms ?? []).reduce((sum, r) => sum + r.unread, 0);

  return (
    <div className="pb-4">
      {/* Segment tabs with unread badges */}
      <div className="flex border-b-2 px-4" style={{ borderColor: 'var(--c-bd)', backgroundColor: 'var(--c-sf)' }}>
        {([
          { key: 'alerts' as MainTab, label: t.messages.alerts, unread: notifUnread },
          { key: 'dm' as MainTab, label: 'DM', unread: dmUnread },
        ]).map(({ key, label, unread }) => {
          const active = mainTab === key;
          return (
            <button
              key={key}
              onClick={() => setMainTab(key)}
              className="flex-1 py-3 text-sm font-semibold border-b-2 -mb-[2px] transition-colors flex items-center justify-center gap-1.5"
              style={{
                color: active ? 'var(--c-pri)' : 'var(--c-tx3)',
                borderColor: active ? 'var(--c-pri)' : 'transparent',
              }}
            >
              {label}
              {unread > 0 && (
                <span
                  className="min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center text-white"
                  style={{ backgroundColor: 'var(--c-err)' }}
                >
                  {unread > 99 ? '99+' : unread}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {mainTab === 'alerts' ? <AlertsTab /> : <DMTab />}

      {/* DM compose FAB — only on DM tab */}
      {mainTab === 'dm' && (
        <FAB
          onClick={() => setDmComposeOpen(true)}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              <line x1="9" y1="10" x2="15" y2="10" />
            </svg>
          }
        />
      )}

      <DMComposeModal open={dmComposeOpen} onClose={() => setDmComposeOpen(false)} />
    </div>
  );
}

function AlertsTab() {
  const t = useT();
  const { notifications, addNotification, markAsRead, markAllAsRead, unreadCount } = useNotificationStore();
  const { isDesktop } = useBreakpoint();
  const [filter, setFilter] = useState<AlertFilter>('all');
  const [historyLoaded, setHistoryLoaded] = useState(false);

  const ALERT_FILTERS: { key: AlertFilter; label: string }[] = [
    { key: 'all', label: t.common.all },
    { key: 'inventory', label: t.messages.lowStock },
    { key: 'status', label: t.messages.statusChange },
    { key: 'stock', label: t.messages.restocked },
  ];

  useEffect(() => {
    if (historyLoaded) return;
    apiGet<Notification[]>('/notifications/history', { limit: 50 })
      .then((history) => {
        const existingIds = new Set(notifications.map((n) => n.id));
        for (const n of history) {
          if (!existingIds.has(n.id)) addNotification(n);
        }
        setHistoryLoaded(true);
      })
      .catch(() => setHistoryLoaded(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = filter === 'all' ? notifications : notifications.filter((n) => n.type === filter);

  return (
    <div className="px-4 pt-3 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm" style={{ color: 'var(--c-tx2)' }}>
          {unreadCount > 0 && <span className="font-bold mr-1" style={{ color: 'var(--c-pri)' }}>{unreadCount}</span>}
          {t.messages.unreadAlerts}
        </span>
        {notifications.length > 0 && (
          <button onClick={markAllAsRead} className="text-[13px] font-semibold" style={{ color: 'var(--c-pri)' }}>
            {t.messages.markAllRead}
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {ALERT_FILTERS.map((opt) => {
          const active = filter === opt.key;
          return (
            <button
              key={opt.key}
              onClick={() => setFilter(opt.key)}
              className="px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border-[1.5px] transition-colors"
              style={{
                borderColor: active ? 'var(--c-pri)' : 'var(--c-bd)',
                backgroundColor: active ? 'var(--c-pri)' : 'transparent',
                color: active ? '#fff' : 'var(--c-tx2)',
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* Notifications */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--c-tx3)" strokeWidth="1.5" className="mx-auto mb-2">
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 01-3.46 0" />
          </svg>
          <p className="text-sm" style={{ color: 'var(--c-tx3)' }}>{t.messages.noNewAlerts}</p>
          <p className="text-xs mt-1" style={{ color: 'var(--c-tx3)', opacity: 0.7 }}>{t.messages.alertHint}</p>
        </div>
      ) : (
        <div className={clsx(isDesktop ? 'grid grid-cols-2 gap-2' : 'space-y-2')}>
          {filtered.map((n) => (
            <button
              key={n.id}
              onClick={() => markAsRead(n.id)}
              className="w-full rounded-xl border p-4 flex items-start gap-3 text-left transition-all"
              style={{
                backgroundColor: n.isRead ? 'var(--c-sf)' : 'var(--c-pri-lt)',
                borderColor: 'var(--c-bd)',
                borderLeftWidth: n.isRead ? '1px' : '3px',
                borderLeftColor: n.isRead ? 'var(--c-bd)' : 'var(--c-pri)',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="mt-0.5 shrink-0"
                stroke={n.type === 'inventory' ? 'var(--c-warn)' : n.type === 'status' ? 'var(--c-pri)' : 'var(--c-ok)'}
                strokeWidth="2">
                {n.type === 'inventory' ? (
                  <><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></>
                ) : n.type === 'status' ? (
                  <><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></>
                ) : (
                  <><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></>
                )}
              </svg>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={clsx('text-sm truncate', !n.isRead ? 'font-bold' : '')} style={{ color: 'var(--c-tx1)' }}>
                    {n.title}
                  </p>
                  <span className="text-[11px] shrink-0" style={{ color: 'var(--c-tx3)' }}>{formatTimeAgo(n.timestamp, t)}</span>
                </div>
                <p className="text-[13px] mt-0.5 line-clamp-2" style={{ color: 'var(--c-tx2)' }}>{n.body}</p>
                <p className="text-[11px] mt-1" style={{ color: 'var(--c-tx3)' }}>{n.funName}</p>
              </div>
              {!n.isRead && <span className="w-2 h-2 rounded-full mt-2 shrink-0" style={{ backgroundColor: 'var(--c-pri)' }} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

type DMFilter = 'all' | 'admin' | 'sub-admin' | 'manager';

function DMTab() {
  const t = useT();
  const navigate = useNavigate();
  const { isDesktop } = useBreakpoint();
  const [dmFilter, setDmFilter] = useState<DMFilter>('all');
  const { data: rooms, isLoading } = useQuery({
    queryKey: ['chatRooms'],
    queryFn: chatApi.getRooms,
    refetchInterval: 10000,
  });

  const DM_FILTERS: { key: DMFilter; label: string }[] = [
    { key: 'all', label: t.common.all },
    { key: 'admin', label: t.messages.admin },
    { key: 'sub-admin', label: t.messages.subAdmin },
    { key: 'manager', label: t.messages.storeManager },
  ];

  const totalUnread = (rooms ?? []).reduce((sum, r) => sum + r.unread, 0);

  const filtered = (rooms ?? []).filter((room) => {
    if (dmFilter === 'all') return true;
    return room.participants.some((p) => p.role === dmFilter);
  });

  return (
    <div className="pt-3">
      <div className="px-4 pb-2">
        <p className="text-xs" style={{ color: 'var(--c-tx3)' }}>
          {t.messages.conversations((rooms ?? []).length)}{totalUnread > 0 && ` · ${t.messages.unread(totalUnread)}`}
        </p>
      </div>

      {/* Role filter chips */}
      <div className="flex gap-2 px-4 pb-3 overflow-x-auto">
        {DM_FILTERS.map((f) => {
          const active = dmFilter === f.key;
          return (
            <button
              key={f.key}
              onClick={() => setDmFilter(f.key)}
              className="px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border-[1.5px] transition-colors"
              style={{
                borderColor: active ? 'var(--c-pri)' : 'var(--c-bd)',
                backgroundColor: active ? 'var(--c-pri)' : 'transparent',
                color: active ? '#fff' : 'var(--c-tx2)',
              }}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="space-y-2 px-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-20 rounded-xl animate-pulse" style={{ backgroundColor: 'var(--c-bd2)' }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--c-tx3)" strokeWidth="1.5" className="mx-auto mb-2">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          </svg>
          <p className="text-sm font-medium" style={{ color: 'var(--c-tx2)' }}>{t.messages.noChatHistory}</p>
          <p className="text-xs mt-1" style={{ color: 'var(--c-tx3)' }}>{t.messages.chatHint}</p>
        </div>
      ) : (
        <div className={clsx(isDesktop ? 'grid grid-cols-2 gap-2 px-4' : '')}>
          {filtered.map((room) => (
            <ChatRoomItem key={room.id} room={room} onClick={() => navigate(`/messages/${room.id}`)} t={t} />
          ))}
        </div>
      )}
    </div>
  );
}

function ChatRoomItem({ room, onClick, t }: { room: ChatRoomSummary; onClick: () => void; t: Translations }) {
  const other = room.participants[0];
  if (!other) return null;

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3.5 border-b text-left transition-colors"
      style={{ borderColor: 'var(--c-bd2)' }}
    >
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center text-base font-bold shrink-0"
        style={{ backgroundColor: 'var(--c-pri-lt)', color: 'var(--c-pri)' }}
      >
        {other.name.charAt(0)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-sm font-semibold" style={{ color: room.unread > 0 ? 'var(--c-tx1)' : 'var(--c-tx2)' }}>
            {other.name}
          </span>
          <span
            className="px-1.5 py-0.5 rounded text-[10px] font-semibold"
            style={{ backgroundColor: 'var(--c-bd2)', color: 'var(--c-tx3)' }}
          >
            {other.role === 'admin' ? t.messages.roleAdmin : other.role === 'sub-admin' ? t.messages.roleSubAdmin : t.messages.roleManager}
          </span>
        </div>
        <p className="text-[13px] truncate" style={{ color: room.unread > 0 ? 'var(--c-tx1)' : 'var(--c-tx3)', fontWeight: room.unread > 0 ? 500 : 400 }}>
          {room.lastMessage?.text ?? t.messages.startConversation}
        </p>
      </div>
      <div className="flex flex-col items-end gap-1.5 shrink-0">
        {room.lastMessage && (
          <span className="text-[11px]" style={{ color: 'var(--c-tx3)' }}>{formatTimeAgo(room.lastMessage.timestamp, t)}</span>
        )}
        {room.unread > 0 && (
          <span className="min-w-[20px] h-5 px-1.5 rounded-full text-white text-[11px] font-bold flex items-center justify-center" style={{ backgroundColor: 'var(--c-pri)' }}>
            {room.unread}
          </span>
        )}
      </div>
    </button>
  );
}
