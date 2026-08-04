-- VMMS Supabase Schema Migration
-- Run this in Supabase SQL Editor after creating a new project

-- ===== Users =====
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'manager' CHECK (role IN ('admin', 'manager')),
  account_type TEXT NOT NULL DEFAULT 'sub_admin' CHECK (account_type IN ('sub_admin', 'business')),
  dept_id INTEGER NOT NULL DEFAULT 0,
  dept_name TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('active', 'pending', 'disabled')),
  created_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
  last_login_at BIGINT,
  refresh_token TEXT,
  business_name TEXT,
  parent_dept_id INTEGER
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users (LOWER(email));
CREATE INDEX IF NOT EXISTS idx_users_refresh_token ON users (refresh_token) WHERE refresh_token IS NOT NULL;

-- ===== Chat Rooms =====
CREATE TABLE IF NOT EXISTS chat_rooms (
  id TEXT PRIMARY KEY,
  participants TEXT[] NOT NULL DEFAULT '{}',
  created_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
  updated_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
);

CREATE INDEX IF NOT EXISTS idx_chat_rooms_participants ON chat_rooms USING GIN (participants);

-- ===== Chat Messages =====
CREATE TABLE IF NOT EXISTS chat_messages (
  id TEXT PRIMARY KEY,
  room_id TEXT NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  sender_role TEXT NOT NULL DEFAULT '',
  text TEXT NOT NULL,
  timestamp BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
  read_by TEXT[] NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_room ON chat_messages (room_id, timestamp);

-- ===== Machine Assignments =====
CREATE TABLE IF NOT EXISTS machine_assignments (
  user_id TEXT NOT NULL,
  fun_id INTEGER NOT NULL,
  PRIMARY KEY (user_id, fun_id)
);

CREATE INDEX IF NOT EXISTS idx_machine_assignments_user ON machine_assignments (user_id);

-- ===== Row Level Security (optional, recommended) =====
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE machine_assignments ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS, so BFF server access is unaffected
-- If you want to add RLS policies for direct client access, add them here
