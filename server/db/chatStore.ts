/**
 * JSON 파일 기반 채팅 저장소
 * - 채팅방 목록 + 메시지 관리
 * - 프로덕션 시 SQLite/PostgreSQL 전환 가능
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

/** 채팅방 */
export interface ChatRoom {
  id: string;
  participants: string[]; // userId 배열
  createdAt: number;
  updatedAt: number;
}

/** 채팅 메시지 */
export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  text: string;
  timestamp: number;
  readBy: string[]; // 읽은 userId 배열
}

// ===== 채팅방 저장소 =====
const ROOMS_PATH = join(import.meta.dirname, 'chatRooms.json');
const MESSAGES_PATH = join(import.meta.dirname, 'chatMessages.json');

function readRooms(): ChatRoom[] {
  if (!existsSync(ROOMS_PATH)) {
    writeFileSync(ROOMS_PATH, '[]', 'utf8');
    return [];
  }
  return JSON.parse(readFileSync(ROOMS_PATH, 'utf8')) as ChatRoom[];
}

function writeRooms(rooms: ChatRoom[]): void {
  writeFileSync(ROOMS_PATH, JSON.stringify(rooms, null, 2), 'utf8');
}

function readMessages(): ChatMessage[] {
  if (!existsSync(MESSAGES_PATH)) {
    writeFileSync(MESSAGES_PATH, '[]', 'utf8');
    return [];
  }
  return JSON.parse(readFileSync(MESSAGES_PATH, 'utf8')) as ChatMessage[];
}

function writeMessages(messages: ChatMessage[]): void {
  writeFileSync(MESSAGES_PATH, JSON.stringify(messages, null, 2), 'utf8');
}

export const chatStore = {
  // ===== 채팅방 =====

  /** 전체 채팅방 조회 */
  findAllRooms(): ChatRoom[] {
    return readRooms();
  },

  /** 사용자가 참여한 채팅방 조회 */
  findRoomsByUser(userId: string): ChatRoom[] {
    return readRooms().filter((r) => r.participants.includes(userId));
  },

  /** 채팅방 ID로 조회 */
  findRoomById(roomId: string): ChatRoom | undefined {
    return readRooms().find((r) => r.id === roomId);
  },

  /** 두 사용자 간 1:1 채팅방 찾기 (없으면 undefined) */
  findDirectRoom(userId1: string, userId2: string): ChatRoom | undefined {
    return readRooms().find(
      (r) =>
        r.participants.length === 2 &&
        r.participants.includes(userId1) &&
        r.participants.includes(userId2),
    );
  },

  /** 채팅방 생성 */
  createRoom(participants: string[]): ChatRoom {
    const rooms = readRooms();
    const room: ChatRoom = {
      id: `room-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      participants,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    rooms.push(room);
    writeRooms(rooms);
    return room;
  },

  /** 채팅방 업데이트 시간 갱신 */
  touchRoom(roomId: string): void {
    const rooms = readRooms();
    const idx = rooms.findIndex((r) => r.id === roomId);
    if (idx !== -1) {
      rooms[idx].updatedAt = Date.now();
      writeRooms(rooms);
    }
  },

  // ===== 메시지 =====

  /** 채팅방의 메시지 조회 (최신순, 페이징) */
  findMessagesByRoom(roomId: string, limit = 50, before?: number): ChatMessage[] {
    let messages = readMessages().filter((m) => m.roomId === roomId);
    if (before) {
      messages = messages.filter((m) => m.timestamp < before);
    }
    // 시간순 정렬 후 최근 N개
    messages.sort((a, b) => a.timestamp - b.timestamp);
    return messages.slice(-limit);
  },

  /** 메시지 추가 */
  addMessage(msg: Omit<ChatMessage, 'id'>): ChatMessage {
    const messages = readMessages();
    const newMsg: ChatMessage = {
      ...msg,
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    };
    messages.push(newMsg);
    writeMessages(messages);
    // 채팅방 업데이트 시간 갱신
    this.touchRoom(msg.roomId);
    return newMsg;
  },

  /** 메시지 읽음 처리 */
  markAsRead(roomId: string, userId: string): number {
    const messages = readMessages();
    let count = 0;
    for (const msg of messages) {
      if (msg.roomId === roomId && !msg.readBy.includes(userId)) {
        msg.readBy.push(userId);
        count++;
      }
    }
    if (count > 0) writeMessages(messages);
    return count;
  },

  /** 특정 사용자의 특정 채팅방 읽지 않은 메시지 수 */
  countUnread(roomId: string, userId: string): number {
    return readMessages().filter(
      (m) => m.roomId === roomId && m.senderId !== userId && !m.readBy.includes(userId),
    ).length;
  },

  /** 채팅방의 마지막 메시지 조회 */
  getLastMessage(roomId: string): ChatMessage | undefined {
    const messages = readMessages().filter((m) => m.roomId === roomId);
    messages.sort((a, b) => b.timestamp - a.timestamp);
    return messages[0];
  },

  /** 초기 시드 데이터 생성 */
  seed(adminId: string, users: Array<{ id: string; name: string; role: string }>): void {
    const rooms = readRooms();
    if (rooms.length > 0) return; // 이미 시드됨

    // admin과 각 사용자 간 1:1 채팅방 생성
    for (const user of users) {
      if (user.id === adminId) continue;
      const room = this.createRoom([adminId, user.id]);

      // 시드 메시지
      this.addMessage({
        roomId: room.id,
        senderId: adminId,
        senderName: '시스템 관리자',
        senderRole: 'admin',
        text: `안녕하세요, ${user.name}님! VMMS 관리자입니다. 자판기 관련 문의사항이 있으시면 편하게 말씀해주세요.`,
        timestamp: Date.now() - 3600000,
        readBy: [adminId],
      });
    }

    console.log(`  [CHAT] ${users.length - 1}개 채팅방 시드 완료`);
  },
};
