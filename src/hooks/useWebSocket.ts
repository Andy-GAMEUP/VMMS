/**
 * SSE 실시간 알림 Hook
 * BFF /api/notifications/stream 연결
 * - 자동 재연결 (5초 후)
 * - 수신된 알림을 notificationStore에 추가
 */

import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useNotificationStore } from '@/store/notificationStore';
import { getStoredTokens } from '@/api/client';
import type { Notification } from '@/types';

export function useRealtimeAlerts() {
  const { isAuthenticated } = useAuthStore();
  const addNotification = useNotificationStore((s) => s.addNotification);
  const [isConnected, setIsConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      // 로그아웃 시 연결 해제
      disconnect();
      return;
    }

    connect();

    return () => {
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  function connect() {
    disconnect();

    const { accessToken } = getStoredTokens();
    if (!accessToken) return;

    // EventSource는 header를 커스텀할 수 없으므로 query param으로 토큰 전달
    // 또는 쿠키 기반 → 여기서는 fetch를 이용한 SSE polyfill 패턴 사용
    const url = `/api/notifications/stream`;

    // fetch-based SSE (Authorization header 지원)
    const abortController = new AbortController();

    fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: abortController.signal,
    })
      .then((response) => {
        if (!response.ok || !response.body) {
          throw new Error(`SSE connection failed: ${response.status}`);
        }

        setIsConnected(true);
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        function processStream(): Promise<void> {
          return reader.read().then(({ done, value }) => {
            if (done) {
              setIsConnected(false);
              scheduleReconnect();
              return;
            }

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            let currentEvent = '';
            let currentData = '';

            for (const line of lines) {
              if (line.startsWith('event: ')) {
                currentEvent = line.slice(7);
              } else if (line.startsWith('data: ')) {
                currentData = line.slice(6);
              } else if (line === '' && currentData) {
                // 완전한 이벤트 수신
                handleSSEEvent(currentEvent, currentData);
                currentEvent = '';
                currentData = '';
              }
            }

            return processStream();
          });
        }

        return processStream();
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          console.error('[SSE] Connection error:', err);
          setIsConnected(false);
          scheduleReconnect();
        }
      });

    // abort controller를 ref에 저장
    eventSourceRef.current = abortController as unknown as EventSource;
  }

  function handleSSEEvent(event: string, data: string) {
    if (event === 'alert') {
      try {
        const notification: Notification = JSON.parse(data);
        addNotification(notification);
      } catch (err) {
        console.error('[SSE] Parse error:', err);
      }
    }
    // 'connected' 이벤트는 상태 확인용으로 무시
  }

  function disconnect() {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    if (eventSourceRef.current) {
      // AbortController.abort()
      (eventSourceRef.current as unknown as AbortController).abort?.();
      eventSourceRef.current = null;
    }
    setIsConnected(false);
  }

  function scheduleReconnect() {
    if (reconnectTimerRef.current) return;
    reconnectTimerRef.current = setTimeout(() => {
      reconnectTimerRef.current = null;
      if (useAuthStore.getState().isAuthenticated) {
        connect();
      }
    }, 5000);
  }

  return { isConnected };
}
