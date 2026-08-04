/**
 * VMMS 자체 인증 라우트
 * POST /api/auth/register   — 회원가입 (admin 승인 전까지 pending)
 * POST /api/auth/login      — 로그인 → accessToken + refreshToken
 * POST /api/auth/refresh    — 토큰 갱신
 * POST /api/auth/logout     — 로그아웃 (refreshToken 폐기)
 * GET  /api/auth/me         — 현재 사용자 정보
 */

import { Router, type Request, type Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import {
  createAccessToken,
  createRefreshToken,
  verifyRefreshToken,
  hashPassword,
  comparePassword,
  authMiddleware,
  type TokenPayload,
  type AuthenticatedRequest,
} from '../lib/auth.js';
import { userStore, type StoredUser } from '../db/userStore.js';
import type { XzyClient } from '../lib/xzyClient.js';

/** StoredUser → 클라이언트 전송용 (passwordHash, refreshToken 제거) */
function toPublicUser(u: StoredUser) {
  const { passwordHash, refreshToken, ...pub } = u;
  return pub;
}

export function createAuthRoutes(xzy: XzyClient): Router {
  const router = Router();

  // ─── POST /register ────────────────────────────────────
  router.post('/register', async (req: Request, res: Response) => {
    try {
      const { email, password, name, phone, accountType, deptId, businessName, parentDeptId } = req.body;

      // 공통 필수 항목 검증
      if (!email || !password || !name || !phone || !accountType) {
        res.status(400).json({
          success: false,
          error: '필수 항목을 모두 입력해주세요. (email, password, name, phone, accountType)',
        });
        return;
      }

      if (!['sub_admin', 'business'].includes(accountType)) {
        res.status(400).json({ success: false, error: '유효하지 않은 계정 유형입니다.' });
        return;
      }

      if (password.length < 6) {
        res.status(400).json({ success: false, error: '비밀번호는 6자 이상이어야 합니다.' });
        return;
      }

      // 유형별 필수 항목 검증
      if (accountType === 'sub_admin' && !deptId) {
        res.status(400).json({ success: false, error: '소속 부서를 선택해주세요.' });
        return;
      }
      if (accountType === 'business' && !businessName) {
        res.status(400).json({ success: false, error: '가맹점/매장명을 입력해주세요.' });
        return;
      }

      // 이메일 중복 확인
      if (userStore.findByEmail(email)) {
        res.status(409).json({ success: false, error: '이미 등록된 이메일입니다.' });
        return;
      }

      // 부서명 조회 (sub_admin: 기존 부서 / business: 상위 부서 또는 미지정)
      let deptName = '미지정';
      const resolvedDeptId = accountType === 'sub_admin' ? Number(deptId) : 0;
      if (accountType === 'sub_admin' && deptId) {
        try {
          const depts = await xzy.getDepartments({ deptId: Number(deptId) });
          if (Array.isArray(depts) && depts.length > 0) {
            deptName = depts[0].deptName || '미지정';
          }
        } catch {
          // 부서 조회 실패 시 기본값 사용
        }
      } else if (accountType === 'business') {
        deptName = businessName; // 승인 전까지 가맹점명을 표시
      }

      const passwordHash = await hashPassword(password);

      const newUser: StoredUser = {
        id: uuidv4(),
        email: email.toLowerCase().trim(),
        passwordHash,
        name,
        phone,
        role: 'manager',
        accountType,
        deptId: resolvedDeptId,
        deptName,
        status: 'pending',
        createdAt: Date.now(),
        lastLoginAt: null,
        refreshToken: null,
        ...(accountType === 'business' && {
          businessName,
          parentDeptId: parentDeptId ? Number(parentDeptId) : 0,
        }),
      };

      userStore.create(newUser);

      const typeLabel = accountType === 'sub_admin' ? 'Sub Admin' : '사업자';
      console.log(`  [AUTH] 신규 가입: ${email} (${name}) [${typeLabel}] → pending`);

      res.status(201).json({
        success: true,
        data: toPublicUser(newUser),
        message: '가입이 완료되었습니다. 관리자 승인 후 로그인이 가능합니다.',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      res.status(500).json({ success: false, error: message });
    }
  });

  // ─── POST /login ────────────────────────────────────────
  router.post('/login', async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ success: false, error: '이메일과 비밀번호를 입력해주세요.' });
        return;
      }

      const user = userStore.findByEmail(email);
      if (!user) {
        res.status(401).json({ success: false, error: '이메일 또는 비밀번호가 올바르지 않습니다.' });
        return;
      }

      // 계정 상태 확인
      if (user.status === 'pending') {
        res.status(403).json({ success: false, error: '관리자 승인 대기 중입니다. 승인 후 로그인이 가능합니다.' });
        return;
      }
      if (user.status === 'disabled') {
        res.status(403).json({ success: false, error: '비활성화된 계정입니다. 관리자에게 문의하세요.' });
        return;
      }

      // 비밀번호 검증
      const valid = await comparePassword(password, user.passwordHash);
      if (!valid) {
        res.status(401).json({ success: false, error: '이메일 또는 비밀번호가 올바르지 않습니다.' });
        return;
      }

      // 토큰 생성
      const payload: TokenPayload = {
        userId: user.id,
        email: user.email,
        role: user.role,
        deptId: user.deptId,
      };

      const accessToken = createAccessToken(payload);
      const refreshToken = createRefreshToken(payload);

      // refreshToken 저장 & 로그인 시각 갱신
      userStore.update(user.id, {
        refreshToken,
        lastLoginAt: Date.now(),
      });

      console.log(`  [AUTH] 로그인: ${user.email} (${user.role})`);

      res.json({
        success: true,
        data: {
          accessToken,
          refreshToken,
          user: toPublicUser({ ...user, lastLoginAt: Date.now() }),
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      res.status(500).json({ success: false, error: message });
    }
  });

  // ─── POST /refresh ──────────────────────────────────────
  router.post('/refresh', (req: Request, res: Response) => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        res.status(400).json({ success: false, error: 'refreshToken이 필요합니다.' });
        return;
      }

      // DB에서 refreshToken 검증
      const user = userStore.findByRefreshToken(refreshToken);
      if (!user) {
        res.status(401).json({ success: false, error: '유효하지 않은 refreshToken입니다.' });
        return;
      }

      // JWT 서명 검증
      let decoded: TokenPayload;
      try {
        decoded = verifyRefreshToken(refreshToken);
      } catch {
        // 만료된 refreshToken → DB에서 제거
        userStore.setRefreshToken(user.id, null);
        res.status(401).json({ success: false, error: 'refreshToken이 만료되었습니다. 다시 로그인해주세요.' });
        return;
      }

      // 새 토큰 발급
      const payload: TokenPayload = {
        userId: decoded.userId,
        email: decoded.email,
        role: user.role, // DB 기준 최신 역할
        deptId: user.deptId,
      };

      const newAccessToken = createAccessToken(payload);
      const newRefreshToken = createRefreshToken(payload);

      // 기존 refreshToken 교체 (rotation)
      userStore.setRefreshToken(user.id, newRefreshToken);

      res.json({
        success: true,
        data: {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      res.status(500).json({ success: false, error: message });
    }
  });

  // ─── POST /logout ───────────────────────────────────────
  router.post('/logout', authMiddleware, (req: Request, res: Response) => {
    try {
      const user = (req as AuthenticatedRequest).user;
      userStore.setRefreshToken(user.userId, null);

      console.log(`  [AUTH] 로그아웃: ${user.email}`);

      res.json({ success: true, message: '로그아웃되었습니다.' });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      res.status(500).json({ success: false, error: message });
    }
  });

  // ─── GET /me ────────────────────────────────────────────
  router.get('/me', authMiddleware, (req: Request, res: Response) => {
    try {
      const tokenUser = (req as AuthenticatedRequest).user;
      const user = userStore.findById(tokenUser.userId);

      if (!user) {
        res.status(404).json({ success: false, error: '사용자를 찾을 수 없습니다.' });
        return;
      }

      res.json({ success: true, data: toPublicUser(user) });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      res.status(500).json({ success: false, error: message });
    }
  });

  return router;
}
