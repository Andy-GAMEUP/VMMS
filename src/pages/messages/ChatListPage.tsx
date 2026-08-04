import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { clsx } from 'clsx';
import { chatApi, type ChatRoomSummary } from '@/api/chat';
import { useState } from 'react';
import { useT } from '@/i18n/useT';

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

type FilterKey = 'all' | 'admin' | 'sub-admin' | 'manager';

export default function ChatListPage() {
  const t = useT();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<FilterKey>('all');

  const { data: rooms, isLoading } = useQuery({
    queryKey: ['chatRooms'],
    queryFn: chatApi.getRooms,
    refetchInterval: 10000,
  });

  const totalUnread = (rooms ?? []).reduce((sum, r) => sum + r.unread, 0);

  const filtered = (rooms ?? []).filter((room) => {
    if (filter === 'all') return true;
    return room.participants.some((p) => p.role === filter);
  });

  const FILTERS: { key: FilterKey; label: string }[] = [
    { key: 'all', label: t.common.all },
    { key: 'admin', label: t.messages.admin },
    { key: 'sub-admin', label: t.messages.subAdmin },
    { key: 'manager', label: t.messages.storeManager },
  ];

  return (
    <div className="pb-4">
      <div className="px-4 pt-3 pb-2 flex items-center justify-between">
        <div>
          <h2 className="text-[17px] font-bold" style={{ color: 'var(--c-tx1)' }}>{t.messages.dm}</h2>
          <p className="text-[12px] mt-0.5" style={{ color: 'var(--c-tx3)' }}>
            {t.messages.conversations((rooms ?? []).length)}{totalUnread > 0 && ` · ${t.messages.unread(totalUnread)}`}
          </p>
        </div>
      </div>

      <div className="flex gap-2 px-4 py-2 overflow-x-auto">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className="px-3 py-1.5 rounded-full text-[12px] font-medium border-[1.5px] transition-colors whitespace-nowrap"
            style={{
              backgroundColor: filter === f.key ? 'var(--c-pri)' : 'var(--c-sf)',
              color: filter === f.key ? '#fff' : 'var(--c-tx2)',
              borderColor: filter === f.key ? 'var(--c-pri)' : 'var(--c-bd)',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-2 px-4 mt-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-xl animate-pulse" style={{ backgroundColor: 'var(--c-bd2)' }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-3xl mb-3">💬</p>
          <p className="text-[14px] font-medium" style={{ color: 'var(--c-tx2)' }}>{t.messages.noChatHistory}</p>
          <p className="text-[12px] mt-1" style={{ color: 'var(--c-tx3)' }}>{t.messages.chatHint}</p>
        </div>
      ) : (
        <div className="mt-1">
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
      className="w-full flex items-center gap-3 px-4 py-3.5 transition-colors text-left"
      style={{ borderBottom: '1px solid var(--c-bd2)' }}
    >
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center text-[16px] font-bold shrink-0"
        style={{ backgroundColor: 'var(--c-pri-lt)', color: 'var(--c-pri)' }}
      >
        {other.name.charAt(0)}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className={clsx('text-[14px] font-semibold')} style={{ color: room.unread > 0 ? 'var(--c-tx1)' : 'var(--c-tx2)' }}>
            {other.name}
          </span>
          <span
            className="px-1.5 py-0.5 rounded text-[10px] font-semibold"
            style={{ backgroundColor: 'var(--c-bd2)', color: 'var(--c-tx3)' }}
          >
            {other.role === 'admin' ? t.messages.roleAdmin : other.role === 'sub-admin' ? t.messages.roleSubAdmin : t.messages.roleManager}
          </span>
        </div>
        <p className={clsx('text-[13px] truncate')} style={{ color: room.unread > 0 ? 'var(--c-tx1)' : 'var(--c-tx3)' }}>
          {room.lastMessage?.text ?? t.messages.startConversation}
        </p>
      </div>

      <div className="flex flex-col items-end gap-1.5 shrink-0">
        {room.lastMessage && (
          <span className="text-[11px]" style={{ color: 'var(--c-tx3)' }}>{formatTimeAgo(room.lastMessage.timestamp, t)}</span>
        )}
        {room.unread > 0 && (
          <span className="min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-bold flex items-center justify-center" style={{ backgroundColor: 'var(--c-pri)', color: '#fff' }}>
            {room.unread}
          </span>
        )}
      </div>
    </button>
  );
}
