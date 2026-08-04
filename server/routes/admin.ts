/**
 * Admin 관리 라우트 (admin 전용)
 * - 사용자 목록 조회 / 승인 / 거절 / 역할 변경 / 비활성화
 * - 매장관리자별 자판기 할당 관리
 */

import { Router, type Request, type Response } from 'express';
import { requireRole, type AuthenticatedRequest } from '../lib/auth.js';
import { userStore } from '../db/userStore.js';
import { machineAssignStore } from '../db/machineAssignStore.js';
import type { XzyClient } from '../lib/xzyClient.js';

function toPublicUser(u: { passwordHash?: string; refreshToken?: string | null; [k: string]: unknown }) {
  const { passwordHash, refreshToken, ...pub } = u;
  return pub;
}

export function createAdminRoutes(xzy?: XzyClient): Router {
  const router = Router();

  router.use(requireRole('admin'));

  /** GET /api/admin/users — 전체 사용자 목록 */
  router.get('/users', (_req: Request, res: Response) => {
    try {
      const users = userStore.findAll().map(toPublicUser);
      res.json({ success: true, data: users });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      res.status(500).json({ success: false, error: message });
    }
  });

  /** GET /api/admin/users/pending — 승인 대기 목록 */
  router.get('/users/pending', (_req: Request, res: Response) => {
    try {
      const users = userStore
        .findAll()
        .filter((u) => u.status === 'pending')
        .map(toPublicUser);
      res.json({ success: true, data: users });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      res.status(500).json({ success: false, error: message });
    }
  });

  /** PUT /api/admin/users/:id/approve — 가입 승인 + 鑫之源 연동 */
  router.put('/users/:id/approve', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const user = userStore.findById(id);
      if (!user) {
        res.status(404).json({ success: false, error: '사용자를 찾을 수 없습니다.' });
        return;
      }
      if (user.status !== 'pending') {
        res.status(400).json({ success: false, error: `현재 상태(${user.status})에서는 승인할 수 없습니다.` });
        return;
      }

      const xzySync: { deptSync?: { success: boolean; error: string; newDeptId?: number }; userSync: { success: boolean; error: string } } = {
        userSync: { success: false, error: '' },
      };

      let finalDeptId = user.deptId;

      if (xzy) {
        // ── 사업자: addDeptInfo → 새 부서 생성 후 addUserInfo ──
        if (user.accountType === 'business') {
          xzySync.deptSync = { success: false, error: '' };
          try {
            const deptResult = await xzy.addDepartment(
              user.businessName || user.name,
              user.parentDeptId ?? 0,
            );
            xzySync.deptSync = { success: true, error: '' };
            // addDeptInfo 응답에서 새 deptId 추출 (API는 boolean 반환 — getDeptInfo로 재조회)
            try {
              const depts = await xzy.getDepartments({});
              const newDept = (depts as any[]).find(
                (d: any) => d.deptName === (user.businessName || user.name) && d.status === '0',
              );
              if (newDept) {
                finalDeptId = newDept.deptId;
                xzySync.deptSync.newDeptId = newDept.deptId;
              }
            } catch {
              // 부서 재조회 실패 시 deptId 0으로 유지
            }
            console.log(`  [ADMIN] 鑫之源 부서 등록 성공: ${user.businessName} (deptId=${finalDeptId})`);
          } catch (err) {
            const msg = err instanceof Error ? err.message : 'Unknown error';
            xzySync.deptSync = { success: false, error: msg };
            console.warn(`  [ADMIN] 鑫之源 부서 등록 실패: ${msg}`);
          }
        }

        // ── 공통: addUserInfo ──
        try {
          const userList = JSON.stringify([{
            UserName: user.email.split('@')[0],
            nickName: user.name,
            email: user.email,
            phone: user.phone,
            deptId: finalDeptId,
            sex: '0',
          }]);
          await xzy.addUsers(userList);
          xzySync.userSync = { success: true, error: '' };
          console.log(`  [ADMIN] 鑫之源 사용자 등록 성공: ${user.email} (deptId=${finalDeptId})`);
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Unknown error';
          xzySync.userSync = { success: false, error: msg };
          console.warn(`  [ADMIN] 鑫之源 사용자 등록 실패 (VMMS 승인은 유지): ${msg}`);
        }
      }

      // VMMS 로컬 DB 승인 (deptId 갱신 포함)
      const updated = userStore.update(id, {
        status: 'active',
        role: 'manager',
        deptId: finalDeptId,
        ...(finalDeptId !== user.deptId && user.accountType === 'business'
          ? { deptName: user.businessName || user.name }
          : {}),
      });

      const typeLabel = user.accountType === 'sub_admin' ? 'Sub Admin' : '사업자';
      console.log(`  [ADMIN] 승인: ${user.email} [${typeLabel}] → active/manager (deptId=${finalDeptId})`);

      res.json({
        success: true,
        data: toPublicUser(updated!),
        xzySync,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      res.status(500).json({ success: false, error: message });
    }
  });

  /** PUT /api/admin/users/:id/reject — 가입 거절 */
  router.put('/users/:id/reject', (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const user = userStore.findById(id);
      if (!user) {
        res.status(404).json({ success: false, error: '사용자를 찾을 수 없습니다.' });
        return;
      }
      if (user.status !== 'pending') {
        res.status(400).json({ success: false, error: `현재 상태(${user.status})에서는 거절할 수 없습니다.` });
        return;
      }

      const updated = userStore.update(id, { status: 'disabled' });
      console.log(`  [ADMIN] 거절: ${user.email} (사유: ${reason || '없음'})`);
      res.json({ success: true, data: toPublicUser(updated!) });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      res.status(500).json({ success: false, error: message });
    }
  });

  /** PUT /api/admin/users/:id/disable — 계정 비활성화 */
  router.put('/users/:id/disable', (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const user = userStore.findById(id);
      if (!user) {
        res.status(404).json({ success: false, error: '사용자를 찾을 수 없습니다.' });
        return;
      }
      if (user.role === 'admin') {
        res.status(403).json({ success: false, error: 'admin 계정은 비활성화할 수 없습니다.' });
        return;
      }

      const updated = userStore.update(id, { status: 'disabled' });
      console.log(`  [ADMIN] 비활성화: ${user.email}`);
      res.json({ success: true, data: toPublicUser(updated!) });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      res.status(500).json({ success: false, error: message });
    }
  });

  /** PUT /api/admin/users/:id/enable — 계정 재활성화 */
  router.put('/users/:id/enable', (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const user = userStore.findById(id);
      if (!user) {
        res.status(404).json({ success: false, error: '사용자를 찾을 수 없습니다.' });
        return;
      }

      const updated = userStore.update(id, { status: 'active' });
      console.log(`  [ADMIN] 재활성화: ${user.email}`);
      res.json({ success: true, data: toPublicUser(updated!) });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      res.status(500).json({ success: false, error: message });
    }
  });

  /** GET /api/admin/users/:id/machines — 할당된 자판기 조회 */
  router.get('/users/:id/machines', (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const user = userStore.findById(id);
      if (!user) {
        res.status(404).json({ success: false, error: '사용자를 찾을 수 없습니다.' });
        return;
      }
      const funIds = machineAssignStore.getByUser(id);
      res.json({ success: true, data: { userId: id, funIds } });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      res.status(500).json({ success: false, error: message });
    }
  });

  /** PUT /api/admin/users/:id/machines — 자판기 할당 (전체 교체) */
  router.put('/users/:id/machines', (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { funIds } = req.body;

      const user = userStore.findById(id);
      if (!user) {
        res.status(404).json({ success: false, error: '사용자를 찾을 수 없습니다.' });
        return;
      }
      if (!Array.isArray(funIds)) {
        res.status(400).json({ success: false, error: 'funIds 배열이 필요합니다.' });
        return;
      }

      machineAssignStore.setForUser(id, funIds.map(Number));
      console.log(`  [ADMIN] 자판기 할당: ${user.email} → [${funIds.join(',')}]`);
      res.json({ success: true, data: { userId: id, funIds: machineAssignStore.getByUser(id) } });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      res.status(500).json({ success: false, error: message });
    }
  });

  return router;
}
