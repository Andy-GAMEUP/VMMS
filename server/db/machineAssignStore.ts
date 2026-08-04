/**
 * Supabase 기반 자판기 할당 저장소
 */

import { supabase } from '../lib/supabase.js';

export const machineAssignStore = {
  async getByUser(userId: string): Promise<number[]> {
    const { data, error } = await supabase.from('machine_assignments').select('fun_id').eq('user_id', userId);
    if (error) throw error;
    return (data ?? []).map(r => r.fun_id);
  },

  async setForUser(userId: string, funIds: number[]): Promise<void> {
    await supabase.from('machine_assignments').delete().eq('user_id', userId);
    if (funIds.length === 0) return;
    const rows = [...new Set(funIds)].map(fun_id => ({ user_id: userId, fun_id }));
    const { error } = await supabase.from('machine_assignments').insert(rows);
    if (error) throw error;
  },

  async addForUser(userId: string, funIds: number[]): Promise<void> {
    const existing = await this.getByUser(userId);
    const newIds = funIds.filter(id => !existing.includes(id));
    if (newIds.length === 0) return;
    const rows = newIds.map(fun_id => ({ user_id: userId, fun_id }));
    const { error } = await supabase.from('machine_assignments').insert(rows);
    if (error) throw error;
  },

  async removeForUser(userId: string, funIds: number[]): Promise<void> {
    const { error } = await supabase.from('machine_assignments').delete()
      .eq('user_id', userId).in('fun_id', funIds);
    if (error) throw error;
  },

  async removeUser(userId: string): Promise<void> {
    await supabase.from('machine_assignments').delete().eq('user_id', userId);
  },

  async getAll(): Promise<Record<string, number[]>> {
    const { data, error } = await supabase.from('machine_assignments').select('*');
    if (error) throw error;
    const result: Record<string, number[]> = {};
    for (const row of data ?? []) {
      if (!result[row.user_id]) result[row.user_id] = [];
      result[row.user_id].push(row.fun_id);
    }
    return result;
  },
};
