/**
 * JSON 파일 기반 사용자 저장소
 * 경량 운영용 — 프로덕션 시 SQLite/PostgreSQL 전환 가능
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

export interface StoredUser {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  phone: string;
  role: 'admin' | 'manager';
  accountType: 'sub_admin' | 'business';
  deptId: number;
  deptName: string;
  status: 'active' | 'pending' | 'disabled';
  createdAt: number;
  lastLoginAt: number | null;
  refreshToken: string | null;
  // business 전용
  businessName?: string;
  parentDeptId?: number;
}

const DB_PATH = join(import.meta.dirname, 'users.json');

function readDB(): StoredUser[] {
  if (!existsSync(DB_PATH)) {
    writeFileSync(DB_PATH, '[]', 'utf8');
    return [];
  }
  const raw = readFileSync(DB_PATH, 'utf8');
  return JSON.parse(raw) as StoredUser[];
}

function writeDB(users: StoredUser[]): void {
  writeFileSync(DB_PATH, JSON.stringify(users, null, 2), 'utf8');
}

export const userStore = {
  /** 전체 사용자 조회 */
  findAll(): StoredUser[] {
    return readDB();
  },

  /** ID로 조회 */
  findById(id: string): StoredUser | undefined {
    return readDB().find((u) => u.id === id);
  },

  /** 이메일로 조회 */
  findByEmail(email: string): StoredUser | undefined {
    return readDB().find((u) => u.email.toLowerCase() === email.toLowerCase());
  },

  /** 사용자 추가 */
  create(user: StoredUser): StoredUser {
    const users = readDB();
    if (users.some((u) => u.email.toLowerCase() === user.email.toLowerCase())) {
      throw new Error('이미 등록된 이메일입니다.');
    }
    users.push(user);
    writeDB(users);
    return user;
  },

  /** 사용자 업데이트 */
  update(id: string, patch: Partial<StoredUser>): StoredUser | undefined {
    const users = readDB();
    const idx = users.findIndex((u) => u.id === id);
    if (idx === -1) return undefined;
    users[idx] = { ...users[idx], ...patch };
    writeDB(users);
    return users[idx];
  },

  /** Refresh 토큰 저장 */
  setRefreshToken(id: string, token: string | null): void {
    this.update(id, { refreshToken: token });
  },

  /** Refresh 토큰으로 조회 */
  findByRefreshToken(token: string): StoredUser | undefined {
    return readDB().find((u) => u.refreshToken === token);
  },

  /** 초기 admin 계정 생성 (최초 1회) */
  async seedAdmin(passwordHash: string): Promise<boolean> {
    const users = readDB();
    if (users.some((u) => u.role === 'admin')) return false;

    const admin: StoredUser = {
      id: 'admin-001',
      email: 'admin@vmms.local',
      passwordHash,
      name: '시스템 관리자',
      phone: '01000000000',
      role: 'admin',
      accountType: 'sub_admin',
      deptId: 0,
      deptName: '전체',
      status: 'active',
      createdAt: Date.now(),
      lastLoginAt: null,
      refreshToken: null,
    };
    users.push(admin);
    writeDB(users);
    console.log('  [DB] Admin 계정 생성: admin@vmms.local');
    return true;
  },

  async seedTestUsers(passwordHash: string): Promise<number> {
    const users = readDB();
    const testAccounts: Omit<StoredUser, 'passwordHash'>[] = [
      {
        id: 'test-manager-001',
        email: 'test@vmms.local',
        name: '테스트 매니저',
        phone: '01011112222',
        role: 'manager',
        accountType: 'sub_admin',
        deptId: 245,
        deptName: '서울 1지점',
        status: 'active',
        createdAt: Date.now(),
        lastLoginAt: null,
        refreshToken: null,
      },
    ];

    let created = 0;
    for (const acct of testAccounts) {
      if (!users.some((u) => u.email === acct.email)) {
        users.push({ ...acct, passwordHash });
        created++;
      }
    }

    if (created > 0) {
      writeDB(users);
    }
    return created;
  },
};
