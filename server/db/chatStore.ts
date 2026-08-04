/**
 * Supabase 기반 채팅 저장소
 */

import { supabase } from '../lib/supabase.js';

export interface ChatRoom {
  id: string;
  participants: string[];
  createdAt: number;
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

interface RoomRow {
  id: string;
  participants: string[];
  created_at: number;
  updated_at: number;
}

interface MsgRow {
  id: string;
  room_id: string;
  sender_id: string;
  sender_name: string;
  sender_role: string;
  text: string;
  timestamp: number;
  read_by: string[];
}

function rowToRoom(r: RoomRow): ChatRoom {
  return { id: r.id, participants: r.participants, createdAt: r.created_at, updatedAt: r.updated_at };
}

function rowToMsg(r: MsgRow): ChatMessage {
  return {
    id: r.id, roomId: r.room_id, senderId: r.sender_id, senderName: r.sender_name,
    senderRole: r.sender_role, text: r.text, timestamp: r.timestamp, readBy: r.read_by,
  };
}

export const chatStore = {
  async findAllRooms(): Promise<ChatRoom[]> {
    const { data, error } = await supabase.from('chat_rooms').select('*').order('updated_at', { ascending: false });
    if (error) throw error;
    return (data as RoomRow[]).map(rowToRoom);
  },

  async findRoomsByUser(userId: string): Promise<ChatRoom[]> {
    const { data, error } = await supabase.from('chat_rooms').select('*').contains('participants', [userId]).order('updated_at', { ascending: false });
    if (error) throw error;
    return (data as RoomRow[]).map(rowToRoom);
  },

  async findRoomById(roomId: string): Promise<ChatRoom | undefined> {
    const { data, error } = await supabase.from('chat_rooms').select('*').eq('id', roomId).maybeSingle();
    if (error) throw error;
    return data ? rowToRoom(data as RoomRow) : undefined;
  },

  async findDirectRoom(userId1: string, userId2: string): Promise<ChatRoom | undefined> {
    const { data, error } = await supabase.from('chat_rooms').select('*')
      .contains('participants', [userId1, userId2]);
    if (error) throw error;
    const match = (data as RoomRow[]).find(r => r.participants.length === 2);
    return match ? rowToRoom(match) : undefined;
  },

  async createRoom(participants: string[]): Promise<ChatRoom> {
    const now = Date.now();
    const room: RoomRow = {
      id: `room-${now}-${Math.random().toString(36).slice(2, 6)}`,
      participants,
      created_at: now,
      updated_at: now,
    };
    const { error } = await supabase.from('chat_rooms').insert(room);
    if (error) throw error;
    return rowToRoom(room);
  },

  async touchRoom(roomId: string): Promise<void> {
    await supabase.from('chat_rooms').update({ updated_at: Date.now() }).eq('id', roomId);
  },

  async findMessagesByRoom(roomId: string, limit = 50, before?: number): Promise<ChatMessage[]> {
    let query = supabase.from('chat_messages').select('*').eq('room_id', roomId);
    if (before) query = query.lt('timestamp', before);
    const { data, error } = await query.order('timestamp', { ascending: true }).limit(limit);
    if (error) throw error;
    return (data as MsgRow[]).map(rowToMsg);
  },

  async addMessage(msg: Omit<ChatMessage, 'id'>): Promise<ChatMessage> {
    const id = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const row: MsgRow = {
      id,
      room_id: msg.roomId,
      sender_id: msg.senderId,
      sender_name: msg.senderName,
      sender_role: msg.senderRole,
      text: msg.text,
      timestamp: msg.timestamp,
      read_by: msg.readBy,
    };
    const { error } = await supabase.from('chat_messages').insert(row);
    if (error) throw error;
    await this.touchRoom(msg.roomId);
    return { ...msg, id };
  },

  async markAsRead(roomId: string, userId: string): Promise<number> {
    const { data, error } = await supabase.from('chat_messages').select('id, read_by')
      .eq('room_id', roomId).not('sender_id', 'eq', userId);
    if (error) throw error;

    let count = 0;
    for (const row of data as { id: string; read_by: string[] }[]) {
      if (!row.read_by.includes(userId)) {
        const updated = [...row.read_by, userId];
        await supabase.from('chat_messages').update({ read_by: updated }).eq('id', row.id);
        count++;
      }
    }
    return count;
  },

  async countUnread(roomId: string, userId: string): Promise<number> {
    const { data, error } = await supabase.from('chat_messages').select('id, sender_id, read_by')
      .eq('room_id', roomId).neq('sender_id', userId);
    if (error) throw error;
    return (data as { id: string; sender_id: string; read_by: string[] }[])
      .filter(m => !m.read_by.includes(userId)).length;
  },

  async getLastMessage(roomId: string): Promise<ChatMessage | undefined> {
    const { data, error } = await supabase.from('chat_messages').select('*')
      .eq('room_id', roomId).order('timestamp', { ascending: false }).limit(1).maybeSingle();
    if (error) throw error;
    return data ? rowToMsg(data as MsgRow) : undefined;
  },

  async seed(adminId: string, users: Array<{ id: string; name: string; role: string }>): Promise<void> {
    const { data: existing } = await supabase.from('chat_rooms').select('id').limit(1);
    if (existing && existing.length > 0) return;

    for (const user of users) {
      if (user.id === adminId) continue;
      const room = await this.createRoom([adminId, user.id]);
      await this.addMessage({
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
