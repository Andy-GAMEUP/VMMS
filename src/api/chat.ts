/**
 * 채팅 API 클라이언트
 */
import { apiGet, apiPost } from './client';

export interface ChatParticipant {
  id: string;
  name: string;
  role: string;
  email?: string;
}

export interface ChatRoomSummary {
  id: string;
  participants: ChatParticipant[];
  lastMessage: { text: string; senderName: string; timestamp: number } | null;
  unread: number;
  updatedAt: number;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  text: string;
  timestamp: number;
  readBy: string[];
}

export interface ChatRoomDetail {
  room: { id: string; participants: ChatParticipant[] };
  messages: ChatMessage[];
}

export const chatApi = {
  /** 내 채팅방 목록 */
  getRooms: () => apiGet<ChatRoomSummary[]>('/chat/rooms'),

  /** 채팅방 생성 (1:1 DM) */
  createRoom: (targetUserId: string) =>
    apiPost<{ id: string }>('/chat/rooms', { targetUserId }),

  /** 채팅방 메시지 조회 */
  getMessages: (roomId: string, limit = 50) =>
    apiGet<ChatRoomDetail>(`/chat/rooms/${roomId}`, { limit }),

  /** 메시지 전송 */
  sendMessage: (roomId: string, text: string) =>
    apiPost<ChatMessage>(`/chat/rooms/${roomId}`, { text }),

  /** 읽음 처리 */
  markAsRead: (roomId: string) =>
    apiPost<{ markedCount: number }>(`/chat/rooms/${roomId}/read`),
};
