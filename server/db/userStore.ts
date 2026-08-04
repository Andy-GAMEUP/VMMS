/**
 * Supabase 기반 사용자 저장소
 */

import { supabase } from '../lib/supabase.js';

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
  businessName?: string;
  parentDeptId?: number;
}

interface DbRow {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  phone: string;
  role: string;
  account_type: string;
  dept_id: number;
  dept_name: string;
  status: string;
  created_at: number;
  last_login_at: number | null;
  refresh_token: string | null;
  business_name: string | null;
  parent_dept_id: number | null;
}

function rowToUser(r: DbRow): StoredUser {
  return {
    id: r.id,
    email: r.email,
    passwordHash: r.password_hash,
    name: r.name,
    phone: r.phone,
    role: r.role as StoredUser['role'],
    accountType: r.account_type as StoredUser['accountType'],
    deptId: r.dept_id,
    deptName: r.dept_name,
    status: r.status as StoredUser['status'],
    createdAt: r.created_at,
    lastLoginAt: r.last_login_at,
    refreshToken: r.refresh_token,
    ...(r.business_name ? { businessName: r.business_name } : {}),
    ...(r.parent_dept_id != null ? { parentDeptId: r.parent_dept_id } : {}),
  };
}

function userToRow(u: StoredUser): Omit<DbRow, 'last_login_at' | 'refresh_token'> & { last_login_at: number | null; refresh_token: string | null } {
  return {
    id: u.id,
    email: u.email,
    password_hash: u.passwordHash,
    name: u.name,
    phone: u.phone,
    role: u.role,
    account_type: u.accountType,
    dept_id: u.deptId,
    dept_name: u.deptName,
    status: u.status,
    created_at: u.createdAt,
    last_login_at: u.lastLoginAt,
    refresh_token: u.refreshToken,
    business_name: u.businessName ?? null,
    parent_dept_id: u.parentDeptId ?? null,
  };
}

export const userStore = {
  async findAll(): Promise<StoredUser[]> {
    const { data, error } = await supabase.from('users').select('*');
    if (error) throw error;
    return (data as DbRow[]).map(rowToUser);
  },

  async findById(id: string): Promise<StoredUser | undefined> {
    const { data, error } = await supabase.from('users').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data ? rowToUser(data as DbRow) : undefined;
  },

  async findByEmail(email: string): Promise<StoredUser | undefined> {
    const { data, error } = await supabase.from('users').select('*').ilike('email', email).maybeSingle();
    if (error) throw error;
    return data ? rowToUser(data as DbRow) : undefined;
  },

  async create(user: StoredUser): Promise<StoredUser> {
    const existing = await this.findByEmail(user.email);
    if (existing) throw new Error('이미 등록된 이메일입니다.');
    const { error } = await supabase.from('users').insert(userToRow(user));
    if (error) throw error;
    return user;
  },

  async update(id: string, patch: Partial<StoredUser>): Promise<StoredUser | undefined> {
    const dbPatch: Record<string, unknown> = {};
    if (patch.email !== undefined) dbPatch.email = patch.email;
    if (patch.passwordHash !== undefined) dbPatch.password_hash = patch.passwordHash;
    if (patch.name !== undefined) dbPatch.name = patch.name;
    if (patch.phone !== undefined) dbPatch.phone = patch.phone;
    if (patch.role !== undefined) dbPatch.role = patch.role;
    if (patch.accountType !== undefined) dbPatch.account_type = patch.accountType;
    if (patch.deptId !== undefined) dbPatch.dept_id = patch.deptId;
    if (patch.deptName !== undefined) dbPatch.dept_name = patch.deptName;
    if (patch.status !== undefined) dbPatch.status = patch.status;
    if (patch.lastLoginAt !== undefined) dbPatch.last_login_at = patch.lastLoginAt;
    if (patch.refreshToken !== undefined) dbPatch.refresh_token = patch.refreshToken;
    if (patch.businessName !== undefined) dbPatch.business_name = patch.businessName;
    if (patch.parentDeptId !== undefined) dbPatch.parent_dept_id = patch.parentDeptId;

    const { data, error } = await supabase.from('users').update(dbPatch).eq('id', id).select('*').maybeSingle();
    if (error) throw error;
    return data ? rowToUser(data as DbRow) : undefined;
  },

  async setRefreshToken(id: string, token: string | null): Promise<void> {
    await this.update(id, { refreshToken: token });
  },

  async findByRefreshToken(token: string): Promise<StoredUser | undefined> {
    const { data, error } = await supabase.from('users').select('*').eq('refresh_token', token).maybeSingle();
    if (error) throw error;
    return data ? rowToUser(data as DbRow) : undefined;
  },

  async seedAdmin(passwordHash: string): Promise<boolean> {
    const { data } = await supabase.from('users').select('id').eq('role', 'admin').limit(1);
    if (data && data.length > 0) return false;

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
    await this.create(admin);
    console.log('  [DB] Admin 계정 생성: admin@vmms.local');
    return true;
  },

  async seedTestUsers(passwordHash: string): Promise<number> {
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
      const existing = await this.findByEmail(acct.email);
      if (!existing) {
        await this.create({ ...acct, passwordHash });
        created++;
      }
    }
    return created;
  },
};
