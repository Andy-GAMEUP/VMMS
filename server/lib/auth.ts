/**
 * VMMS 자체 인증 모듈
 * - JWT 토큰 발급/검증
 * - bcrypt 비밀번호 해시
 */

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import type { Request, Response, NextFunction } from 'express';

// ===== JWT =====

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'vmms-access-secret-dev';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'vmms-refresh-secret-dev';
const ACCESS_EXPIRES = '15m';
const REFRESH_EXPIRES = '7d';

export interface TokenPayload {
  userId: string;
  email: string;
  role: 'admin' | 'manager' | 'viewer';
  deptId: number;
}

/** Access Token 생성 */
export function createAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRES });
}

/** Refresh Token 생성 */
export function createRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES });
}

/** Access Token 검증 */
export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, ACCESS_SECRET) as TokenPayload;
}

/** Refresh Token 검증 */
export function verifyRefreshToken(token: string): TokenPayload {
  return jwt.verify(token, REFRESH_SECRET) as TokenPayload;
}

// ===== bcrypt =====

const SALT_ROUNDS = 10;

/** 비밀번호 해시 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/** 비밀번호 검증 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ===== Express 미들웨어 =====

/** 인증 미들웨어 — JWT 검증 후 req.user에 payload 주입 */
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: '인증이 필요합니다.' });
    return;
  }

  try {
    const token = header.slice(7);
    const payload = verifyAccessToken(token);
    (req as AuthenticatedRequest).user = payload;
    next();
  } catch {
    res.status(401).json({ success: false, error: '토큰이 만료되었거나 유효하지 않습니다.' });
  }
}

/** 역할 기반 접근 제어 */
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as AuthenticatedRequest).user;
    if (!user || !roles.includes(user.role)) {
      res.status(403).json({ success: false, error: '접근 권한이 없습니다.' });
      return;
    }
    next();
  };
}

/** 인증된 요청 타입 */
export interface AuthenticatedRequest extends Request {
  user: TokenPayload;
}
