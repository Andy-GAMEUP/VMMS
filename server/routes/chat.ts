/**
 * 채팅 API 라우트
 * GET    /api/chat/rooms          — 내 채팅방 목록
 * POST   /api/chat/rooms          — 채팅방 생성 (1:1 DM)
 * GET    /api/chat/rooms/:roomId  — 채팅방 메시지 조회
 * POST   /api/chat/rooms/:roomId  — 메시지 전송
 * POST   /api/chat/rooms/:roomId/read — 읽음 처리
 * GET    /api/chat/stream         — SSE 실시간 메시지 스트림
 */

import { Router, type Request, type Response } from 'express';
import type { AuthenticatedRequest } from '../lib/auth.js';
import { chatStore, type ChatMessage } from '../db/chatStore.js';
import { userStore } from '../db/userStore.js';

export function createChatRoutes(): Router {
  const router = Router();

  // SSE 클라이언트 관리: userId → Response[]
  const sseClients = new Map<string, Set<Response>>();

  /** 특정 사용자에게 SSE 이벤트 전송 */
  function sendToUser(userId: string, event: string, data: unknown) {
    const clients = sseClients.get(userId);
    if (!clients) return;
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const res of clients) {
      res.write(payload);
    }
  }

  /** 채팅방의 모든 참여자에게 이벤트 전송 */
  function broadcastToRoom(roomId: string, event: string, data: unknown, excludeUserId?: string) {
    const room = chatStore.findRoomById(roomId);
    if (!room) return;
    for (const uid of room.participants) {
      if (uid !== excludeUserId) {
        sendToUser(uid, event, data);
      }
    }
  }

  // ─── GET /rooms — 내 채팅방 목록 ─────────────────
  router.get('/rooms', (req: Request, res: Response) => {
    try {
      const user = (req as AuthenticatedRequest).user;
      const rooms = chatStore.findRoomsByUser(user.userId);
      const allUsers = userStore.findAll();

      const result = rooms.map((room) => {
        const lastMsg = chatStore.getLastMessage(room.id);
        const unread = chatStore.countUnread(room.id, user.userId);

        // 상대방 정보 조합
        const otherIds = room.participants.filter((p) => p !== user.userId);
        const others = otherIds.map((id) => {
          const u = allUsers.find((u) => u.id === id);
          return u
            ? { id: u.id, name: u.name, role: u.role, email: u.email }
            : { id, name: '알 수 없는 사용자', role: 'unknown', email: '' };
        });

        return {
          id: room.id,
          participants: others,
          lastMessage: lastMsg
            ? { text: lastMsg.text, senderName: lastMsg.senderName, timestamp: lastMsg.timestamp }
            : null,
          unread,
          updatedAt: room.updatedAt,
        };
      });

      // 최신 업데이트 순 정렬
      result.sort((a, b) => b.updatedAt - a.updatedAt);

      res.json({ success: true, data: result });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      res.status(500).json({ success: false, error: message });
    }
  });

  // ─── POST /rooms — 채팅방 생성 ───────────────────
  router.post('/rooms', (req: Request, res: Response) => {
    try {
      const user = (req as AuthenticatedRequest).user;
      const { targetUserId } = req.body as { targetUserId: string };

      if (!targetUserId) {
        res.status(400).json({ success: false, error: 'targetUserId가 필요합니다.' });
        return;
      }

      // 이미 있는 1:1 채팅방 확인
      const existing = chatStore.findDirectRoom(user.userId, targetUserId);
      if (existing) {
        res.json({ success: true, data: existing, message: '기존 채팅방' });
        return;
      }

      // 대상 사용자 확인
      const target = userStore.findById(targetUserId);
      if (!target) {
        res.status(404).json({ success: false, error: '대상 사용자를 찾을 수 없습니다.' });
        return;
      }

      const room = chatStore.createRoom([user.userId, targetUserId]);
      console.log(`  [CHAT] 새 채팅방: ${user.email} ↔ ${target.email}`);
      res.status(201).json({ success: true, data: room });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      res.status(500).json({ success: false, error: message });
    }
  });

  // ─── GET /rooms/:roomId — 메시지 조회 ────────────
  router.get('/rooms/:roomId', (req: Request, res: Response) => {
    try {
      const user = (req as AuthenticatedRequest).user;
      const { roomId } = req.params;
      const limit = Number(req.query.limit) || 50;
      const before = req.query.before ? Number(req.query.before) : undefined;

      const room = chatStore.findRoomById(roomId);
      if (!room) {
        res.status(404).json({ success: false, error: '채팅방을 찾을 수 없습니다.' });
        return;
      }
      if (!room.participants.includes(user.userId)) {
        res.status(403).json({ success: false, error: '이 채팅방에 접근할 수 없습니다.' });
        return;
      }

      // 상대방 정보
      const allUsers = userStore.findAll();
      const others = room.participants
        .filter((p) => p !== user.userId)
        .map((id) => {
          const u = allUsers.find((u) => u.id === id);
          return u
            ? { id: u.id, name: u.name, role: u.role }
            : { id, name: '알 수 없는 사용자', role: 'unknown' };
        });

      const messages = chatStore.findMessagesByRoom(roomId, limit, before);

      // 읽음 처리
      chatStore.markAsRead(roomId, user.userId);

      res.json({
        success: true,
        data: {
          room: { id: room.id, participants: others },
          messages,
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      res.status(500).json({ success: false, error: message });
    }
  });

  // ─── POST /rooms/:roomId — 메시지 전송 ───────────
  router.post('/rooms/:roomId', (req: Request, res: Response) => {
    try {
      const user = (req as AuthenticatedRequest).user;
      const { roomId } = req.params;
      const { text } = req.body as { text: string };

      if (!text || !text.trim()) {
        res.status(400).json({ success: false, error: '메시지 내용이 필요합니다.' });
        return;
      }

      const room = chatStore.findRoomById(roomId);
      if (!room) {
        res.status(404).json({ success: false, error: '채팅방을 찾을 수 없습니다.' });
        return;
      }
      if (!room.participants.includes(user.userId)) {
        res.status(403).json({ success: false, error: '이 채팅방에 메시지를 보낼 수 없습니다.' });
        return;
      }

      // 사용자 정보 조회
      const sender = userStore.findById(user.userId);
      const senderName = sender?.name ?? '알 수 없음';
      const senderRole = sender?.role ?? user.role;

      const msg = chatStore.addMessage({
        roomId,
        senderId: user.userId,
        senderName,
        senderRole,
        text: text.trim(),
        timestamp: Date.now(),
        readBy: [user.userId], // 보낸 사람은 이미 읽음
      });

      // SSE로 채팅방 참여자에게 실시간 전송
      broadcastToRoom(roomId, 'chat:message', msg, user.userId);

      console.log(`  [CHAT] ${senderName} → room ${roomId}: ${text.slice(0, 30)}...`);
      res.status(201).json({ success: true, data: msg });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      res.status(500).json({ success: false, error: message });
    }
  });

  // ─── POST /rooms/:roomId/read — 읽음 처리 ───────
  router.post('/rooms/:roomId/read', (req: Request, res: Response) => {
    try {
      const user = (req as AuthenticatedRequest).user;
      const { roomId } = req.params;
      const count = chatStore.markAsRead(roomId, user.userId);
      res.json({ success: true, data: { markedCount: count } });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      res.status(500).json({ success: false, error: message });
    }
  });

  // ─── GET /stream — SSE 실시간 채팅 스트림 ────────
  router.get('/stream', (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    res.write(`event: connected\ndata: ${JSON.stringify({ userId: user.userId })}\n\n`);

    // 클라이언트 등록
    if (!sseClients.has(user.userId)) {
      sseClients.set(user.userId, new Set());
    }
    sseClients.get(user.userId)!.add(res);
    console.log(`  [CHAT SSE] ${user.email} 연결 (total: ${sseClients.size}명)`);

    // 30초 keepalive
    const keepalive = setInterval(() => {
      res.write(`:keepalive ${Date.now()}\n\n`);
    }, 30000);

    req.on('close', () => {
      clearInterval(keepalive);
      sseClients.get(user.userId)?.delete(res);
      if (sseClients.get(user.userId)?.size === 0) {
        sseClients.delete(user.userId);
      }
      console.log(`  [CHAT SSE] ${user.email} 연결 해제`);
    });
  });

  return router;
}
