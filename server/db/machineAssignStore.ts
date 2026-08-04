/**
 * 매장관리자(manager)별 자판기 할당 저장소
 * userId → funId[] 매핑
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

interface MachineAssignment {
  [userId: string]: number[];
}

const DB_PATH = join(import.meta.dirname, 'machineAssignments.json');

function readDB(): MachineAssignment {
  if (!existsSync(DB_PATH)) {
    writeFileSync(DB_PATH, '{}', 'utf8');
    return {};
  }
  return JSON.parse(readFileSync(DB_PATH, 'utf8'));
}

function writeDB(data: MachineAssignment): void {
  writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
}

export const machineAssignStore = {
  getByUser(userId: string): number[] {
    return readDB()[userId] || [];
  },

  setForUser(userId: string, funIds: number[]): void {
    const db = readDB();
    db[userId] = [...new Set(funIds)];
    writeDB(db);
  },

  addForUser(userId: string, funIds: number[]): void {
    const db = readDB();
    const existing = db[userId] || [];
    db[userId] = [...new Set([...existing, ...funIds])];
    writeDB(db);
  },

  removeForUser(userId: string, funIds: number[]): void {
    const db = readDB();
    const existing = db[userId] || [];
    db[userId] = existing.filter((id) => !funIds.includes(id));
    writeDB(db);
  },

  removeUser(userId: string): void {
    const db = readDB();
    delete db[userId];
    writeDB(db);
  },

  getAll(): MachineAssignment {
    return readDB();
  },
};
