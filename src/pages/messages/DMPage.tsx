import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { clsx } from 'clsx';
import { chatApi, type ChatMessage } from '@/api/chat';
import { useAuthStore } from '@/store/authStore';
import { getStoredTokens } from '@/api/client';
import { useT } from '@/i18n/useT';

export default function DMPage() {
  const t = useT();
  const { roomId } = useParams<{ roomId: string }>();
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const [input, setInput] = useState('');
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([]);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const ROLE_LABELS: Record<string, string> = {
    admin: t.messages.roleAdmin,
    'sub-admin': t.messages.roleSubAdmin,
    manager: t.messages.roleManager,
  };

  const { data, isLoading } = useQuery({
    queryKey: ['chatMessages', roomId],
    queryFn: () => chatApi.getMessages(roomId!),
    enabled: !!roomId,
  });

  const room = data?.room;
  const serverMessages = data?.messages ?? [];
  const other = room?.participants?.[0];

  useEffect(() => {
    if (serverMessages.length > 0) {
      setLocalMessages(serverMessages);
    }
  }, [serverMessages]);

  useEffect(() => {
    if (!roomId) return;
    const { accessToken } = getStoredTokens();
    if (!accessToken) return;

    const es = new EventSource(`/api/chat/stream?token=${accessToken}`);

    es.addEventListener('chat:message', (e) => {
      const msg: ChatMessage = JSON.parse(e.data);
      if (msg.roomId === roomId) {
        setLocalMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        chatApi.markAsRead(roomId);
        queryClient.invalidateQueries({ queryKey: ['chatRooms'] });
      }
    });

    es.onerror = () => {
      es.close();
    };

    return () => es.close();
  }, [roomId, queryClient]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [localMessages]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || !roomId || sending) return;
    const text = input.trim();
    setInput('');
    setSending(true);

    try {
      const msg = await chatApi.sendMessage(roomId, text);
      setLocalMessages((prev) => [...prev, msg]);
      queryClient.invalidateQueries({ queryKey: ['chatRooms'] });
    } catch (err) {
      console.error('메시지 전송 실패:', err);
      setInput(text);
    } finally {
      setSending(false);
    }
  }, [input, roomId, sending, queryClient]);

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-8 h-8 border-3 rounded-full animate-spin" style={{ borderColor: 'var(--c-pri)', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-56px-64px)]">
      {other && (
        <div className="flex items-center gap-3 px-4 py-3" style={{ backgroundColor: 'var(--c-sf)', borderBottom: '1px solid var(--c-bd)' }}>
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-[15px] font-bold"
            style={{ backgroundColor: 'var(--c-pri-lt)', color: 'var(--c-pri)' }}
          >
            {other.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[14px] font-semibold" style={{ color: 'var(--c-tx1)' }}>{other.name}</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold" style={{ backgroundColor: 'var(--c-bd2)', color: 'var(--c-tx3)' }}>
                {ROLE_LABELS[other.role] ?? other.role}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3" style={{ backgroundColor: 'var(--c-bg)' }}>
        {localMessages.length === 0 && (
          <div className="text-center py-12 text-[13px]" style={{ color: 'var(--c-tx3)' }}>
            {t.messages.startConversation}
          </div>
        )}
        {localMessages.map((msg) => {
          const isMe = msg.senderId === user?.id;
          return (
            <div key={msg.id} className={clsx('flex', isMe ? 'justify-end' : 'justify-start')}>
              <div className="max-w-[75%]">
                {!isMe && (
                  <div className="text-[11px] mb-1 px-1" style={{ color: 'var(--c-tx3)' }}>{msg.senderName}</div>
                )}
                <div
                  className={clsx(
                    'px-3.5 py-2.5 rounded-2xl text-[14px] leading-relaxed',
                    isMe ? 'rounded-br-md' : 'rounded-bl-md',
                  )}
                  style={isMe
                    ? { backgroundColor: 'var(--c-pri)', color: '#fff' }
                    : { backgroundColor: 'var(--c-sf)', color: 'var(--c-tx1)', border: '1px solid var(--c-bd)' }
                  }
                >
                  {msg.text}
                </div>
                <div className={clsx('text-[10px] mt-1 px-1', isMe ? 'text-right' : 'text-left')} style={{ color: 'var(--c-tx3)' }}>
                  {formatTime(msg.timestamp)}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="flex items-center gap-2 px-4 py-3" style={{ backgroundColor: 'var(--c-sf)', borderTop: '1px solid var(--c-bd)' }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.nativeEvent.isComposing && handleSend()}
          placeholder={t.messages.typeMessage}
          className="flex-1 h-10 px-4 border-[1.5px] rounded-full text-[14px] outline-none transition-all"
          style={{
            borderColor: 'var(--c-bd)',
            backgroundColor: 'var(--c-bg)',
            color: 'var(--c-tx1)',
          }}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || sending}
          className="w-10 h-10 rounded-full flex items-center justify-center
                     disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
          style={{ backgroundColor: 'var(--c-pri)', color: '#fff' }}
        >
          {sending ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
