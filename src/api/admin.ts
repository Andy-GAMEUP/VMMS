/**
 * Admin 관리 API
 */

import api from './client';
import type { VmmsUser } from '@/types/auth';

export interface AdminUser extends VmmsUser {
  // VmmsUser already includes lastLoginAt as number | null
}

export interface MachineAssignment {
  userId: string;
  funIds: number[];
}

/** 전체 사용자 목록 */
export async function fetchAllUsers(): Promise<AdminUser[]> {
  const { data } = await api.get<{ success: boolean; data: AdminUser[] }>('/admin/users');
  if (!data.success) throw new Error('사용자 목록 조회 실패');
  return data.data;
}

/** 승인 대기 사용자 목록 */
export async function fetchPendingUsers(): Promise<AdminUser[]> {
  const { data } = await api.get<{ success: boolean; data: AdminUser[] }>('/admin/users/pending');
  if (!data.success) throw new Error('대기 목록 조회 실패');
  return data.data;
}

/** 가입 승인 */
export async function approveUser(userId: string): Promise<AdminUser> {
  const { data } = await api.put<{ success: boolean; data: AdminUser }>(`/admin/users/${userId}/approve`);
  if (!data.success) throw new Error('승인 실패');
  return data.data;
}

/** 가입 거절 */
export async function rejectUser(userId: string, reason?: string): Promise<AdminUser> {
  const { data } = await api.put<{ success: boolean; data: AdminUser }>(`/admin/users/${userId}/reject`, { reason });
  if (!data.success) throw new Error('거절 실패');
  return data.data;
}

/** 계정 비활성화 */
export async function disableUser(userId: string): Promise<AdminUser> {
  const { data } = await api.put<{ success: boolean; data: AdminUser }>(`/admin/users/${userId}/disable`);
  if (!data.success) throw new Error('비활성화 실패');
  return data.data;
}

/** 계정 재활성화 */
export async function enableUser(userId: string): Promise<AdminUser> {
  const { data } = await api.put<{ success: boolean; data: AdminUser }>(`/admin/users/${userId}/enable`);
  if (!data.success) throw new Error('재활성화 실패');
  return data.data;
}

/** 할당된 자판기 조회 */
export async function fetchUserMachines(userId: string): Promise<number[]> {
  const { data } = await api.get<{ success: boolean; data: MachineAssignment }>(`/admin/users/${userId}/machines`);
  if (!data.success) throw new Error('자판기 할당 조회 실패');
  return data.data.funIds;
}

/** 자판기 할당 설정 */
export async function setUserMachines(userId: string, funIds: number[]): Promise<number[]> {
  const { data } = await api.put<{ success: boolean; data: MachineAssignment }>(`/admin/users/${userId}/machines`, { funIds });
  if (!data.success) throw new Error('자판기 할당 실패');
  return data.data.funIds;
}
