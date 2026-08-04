/**
 * 채팅 API 라우트
 */

import { Router, type Request, type Response } from 'express';
import type { AuthenticatedRequest } from '../lib/auth.js';
import { chatStore } from '../db/chatStore.js';
import { userStore } from '../db/userStore.js';

export function createChatRoutes(): Router {
  const router = Router();
  const sseClients = new Map<string, Set<Response>>();

  function sendToUser(userId: string, event: string, data: unknown) {
    const clients = sseClients.get(userId);
    if (!clients) return;
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const res of clients) { res.write(payload); }
  }

  async function broadcastToRoom(roomId: string, event: string, data: unknown, excludeUserId?: string) {
    const room = await chatStore.findRoomById(roomId);
    if (!room) return;
    for (const uid of room.participants) {
      if (uid !== excludeUserId) sendToUser(uid, event, data);
    }
  }

  router.get('/rooms', async (req: Request, res: Response) => {
    try {
      const user = (req as AuthenticatedRequest).user;
      const rooms = await chatStore.findRoomsByUser(user.userId);
      const allUsers = await userStore.findAll();

      const result = await Promise.all(rooms.map(async (room) => {
        const lastMsg = await chatStore.getLastMessage(room.id);
        const unread = await chatStore.countUnread(room.id, user.userId);
        const otherIds = room.participants.filter((p) => p !== user.userId);
        const others = otherIds.map((id) => {
          const u = allUsers.find((u) => u.id === id);
          return u ? { id: u.id, name: u.name, role: u.role, email: u.email }
            : { id, name: '알 수 없는 사용자', role: 'unknown', email: '' };
        });
        return {
          id: room.id, participants: others,
          lastMessage: lastMsg ? { text: lastMsg.text, senderName: lastMsg.senderName, timestamp: lastMsg.timestamp } : null,
          unread, updatedAt: room.updatedAt,
        };
      }));
      result.sort((a, b) => b.updatedAt - a.updatedAt);
      res.json({ success: true, data: result });
    } catch (err) {
      res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Unknown error' });
    }
  });

  router.post('/rooms', async (req: Request, res: Response) => {
    try {
      const user = (req as AuthenticatedRequest).user;
      const { targetUserId } = req.body as { targetUserId: string };
      if (!targetUserId) { res.status(400).json({ success: false, error: 'targetUserId가 필요합니다.' }); return; }

      const existing = await chatStore.findDirectRoom(user.userId, targetUserId);
      if (existing) { res.json({ success: true, data: existing, message: '기존 채팅방' }); return; }

      const target = await userStore.findById(targetUserId);
      if (!target) { res.status(404).json({ success: false, error: '대상 사용자를 찾을 수 없습니다.' }); return; }

      const room = await chatStore.createRoom([user.userId, targetUserId]);
      res.status(201).json({ success: true, data: room });
    } catch (err) {
      res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Unknown error' });
    }
  });

  router.get('/rooms/:roomId', async (req: Request, res: Response) => {
    try {
      const user = (req as AuthenticatedRequest).user;
      const { roomId } = req.params;
      const limit = Number(req.query.limit) || 50;
      const before = req.query.before ? Number(req.query.before) : undefined;

      const room = await chatStore.findRoomById(roomId);
      if (!room) { res.status(404).json({ success: false, error: '채팅방을 찾을 수 없습니다.' }); return; }
      if (!room.participants.includes(user.userId)) { res.status(403).json({ success: false, error: '이 채팅방에 접근할 수 없습니다.' }); return; }

      const allUsers = await userStore.findAll();
      const others = room.participants.filter((p) => p !== user.userId).map((id) => {
        const u = allUsers.find((u) => u.id === id);
        return u ? { id: u.id, name: u.name, role: u.role } : { id, name: '알 수 없는 사용자', role: 'unknown' };
      });

      const messages = await chatStore.findMessagesByRoom(roomId, limit, before);
      await chatStore.markAsRead(roomId, user.userId);

      res.json({ success: true, data: { room: { id: room.id, participants: others }, messages } });
    } catch (err) {
      res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Unknown error' });
    }
  });

  router.post('/rooms/:roomId', async (req: Request, res: Response) => {
    try {
      const user = (req as AuthenticatedRequest).user;
      const { roomId } = req.params;
      const { text } = req.body as { text: string };
      if (!text || !text.trim()) { res.status(400).json({ success: false, error: '메시지 내용이 필요합니다.' }); return; }

      const room = await chatStore.findRoomById(roomId);
      if (!room) { res.status(404).json({ success: false, error: '채팅방을 찾을 수 없습니다.' }); return; }
      if (!room.participants.includes(user.userId)) { res.status(403).json({ success: false, error: '이 채팅방에 메시지를 보낼 수 없습니다.' }); return; }

      const sender = await userStore.findById(user.userId);
      const msg = await chatStore.addMessage({
        roomId, senderId: user.userId, senderName: sender?.name ?? '알 수 없음',
        senderRole: sender?.role ?? user.role, text: text.trim(), timestamp: Date.now(), readBy: [user.userId],
      });

      await broadcastToRoom(roomId, 'chat:message', msg, user.userId);
      res.status(201).json({ success: true, data: msg });
    } catch (err) {
      res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Unknown error' });
    }
  });

  router.post('/rooms/:roomId/read', async (req: Request, res: Response) => {
    try {
      const user = (req as AuthenticatedRequest).user;
      const { roomId } = req.params;
      const count = await chatStore.markAsRead(roomId, user.userId);
      res.json({ success: true, data: { markedCount: count } });
    } catch (err) {
      res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Unknown error' });
    }
  });

  router.get('/stream', (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
    res.write(`event: connected\ndata: ${JSON.stringify({ userId: user.userId })}\n\n`);
    if (!sseClients.has(user.userId)) sseClients.set(user.userId, new Set());
    sseClients.get(user.userId)!.add(res);
    const keepalive = setInterval(() => { res.write(`:keepalive ${Date.now()}\n\n`); }, 30000);
    req.on('close', () => {
      clearInterval(keepalive);
      sseClients.get(user.userId)?.delete(res);
      if (sseClients.get(user.userId)?.size === 0) sseClients.delete(user.userId);
    });
  });

  return router;
}
