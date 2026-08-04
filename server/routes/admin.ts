/**
 * Admin 관리 라우트 (admin 전용)
 */

import { Router, type Request, type Response } from 'express';
import { requireRole } from '../lib/auth.js';
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

  router.get('/users', async (_req: Request, res: Response) => {
    try {
      const users = (await userStore.findAll()).map(toPublicUser);
      res.json({ success: true, data: users });
    } catch (err) {
      res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Unknown error' });
    }
  });

  router.get('/users/pending', async (_req: Request, res: Response) => {
    try {
      const users = (await userStore.findAll()).filter((u) => u.status === 'pending').map(toPublicUser);
      res.json({ success: true, data: users });
    } catch (err) {
      res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Unknown error' });
    }
  });

  router.put('/users/:id/approve', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const user = await userStore.findById(id);
      if (!user) { res.status(404).json({ success: false, error: '사용자를 찾을 수 없습니다.' }); return; }
      if (user.status !== 'pending') { res.status(400).json({ success: false, error: `현재 상태(${user.status})에서는 승인할 수 없습니다.` }); return; }

      const xzySync: { deptSync?: { success: boolean; error: string; newDeptId?: number }; userSync: { success: boolean; error: string } } = {
        userSync: { success: false, error: '' },
      };
      let finalDeptId = user.deptId;

      if (xzy) {
        if (user.accountType === 'business') {
          xzySync.deptSync = { success: false, error: '' };
          try {
            await xzy.addDepartment(user.businessName || user.name, user.parentDeptId ?? 0);
            xzySync.deptSync = { success: true, error: '' };
            try {
              const depts = await xzy.getDepartments({});
              const newDept = (depts as any[]).find((d: any) => d.deptName === (user.businessName || user.name) && d.status === '0');
              if (newDept) { finalDeptId = newDept.deptId; xzySync.deptSync.newDeptId = newDept.deptId; }
            } catch { /* ignore */ }
          } catch (err) {
            xzySync.deptSync = { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
          }
        }

        try {
          const userList = JSON.stringify([{
            UserName: user.email.split('@')[0], nickName: user.name, email: user.email,
            phone: user.phone, deptId: finalDeptId, sex: '0',
          }]);
          await xzy.addUsers(userList);
          xzySync.userSync = { success: true, error: '' };
        } catch (err) {
          xzySync.userSync = { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
        }
      }

      const updated = await userStore.update(id, {
        status: 'active', role: 'manager', deptId: finalDeptId,
        ...(finalDeptId !== user.deptId && user.accountType === 'business' ? { deptName: user.businessName || user.name } : {}),
      });
      res.json({ success: true, data: toPublicUser(updated!), xzySync });
    } catch (err) {
      res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Unknown error' });
    }
  });

  router.put('/users/:id/reject', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const user = await userStore.findById(id);
      if (!user) { res.status(404).json({ success: false, error: '사용자를 찾을 수 없습니다.' }); return; }
      if (user.status !== 'pending') { res.status(400).json({ success: false, error: `현재 상태(${user.status})에서는 거절할 수 없습니다.` }); return; }
      const updated = await userStore.update(id, { status: 'disabled' });
      res.json({ success: true, data: toPublicUser(updated!) });
    } catch (err) {
      res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Unknown error' });
    }
  });

  router.put('/users/:id/disable', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const user = await userStore.findById(id);
      if (!user) { res.status(404).json({ success: false, error: '사용자를 찾을 수 없습니다.' }); return; }
      if (user.role === 'admin') { res.status(403).json({ success: false, error: 'admin 계정은 비활성화할 수 없습니다.' }); return; }
      const updated = await userStore.update(id, { status: 'disabled' });
      res.json({ success: true, data: toPublicUser(updated!) });
    } catch (err) {
      res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Unknown error' });
    }
  });

  router.put('/users/:id/enable', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const user = await userStore.findById(id);
      if (!user) { res.status(404).json({ success: false, error: '사용자를 찾을 수 없습니다.' }); return; }
      const updated = await userStore.update(id, { status: 'active' });
      res.json({ success: true, data: toPublicUser(updated!) });
    } catch (err) {
      res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Unknown error' });
    }
  });

  router.get('/users/:id/machines', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const user = await userStore.findById(id);
      if (!user) { res.status(404).json({ success: false, error: '사용자를 찾을 수 없습니다.' }); return; }
      const funIds = await machineAssignStore.getByUser(id);
      res.json({ success: true, data: { userId: id, funIds } });
    } catch (err) {
      res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Unknown error' });
    }
  });

  router.put('/users/:id/machines', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { funIds } = req.body;
      const user = await userStore.findById(id);
      if (!user) { res.status(404).json({ success: false, error: '사용자를 찾을 수 없습니다.' }); return; }
      if (!Array.isArray(funIds)) { res.status(400).json({ success: false, error: 'funIds 배열이 필요합니다.' }); return; }
      await machineAssignStore.setForUser(id, funIds.map(Number));
      const updated = await machineAssignStore.getByUser(id);
      res.json({ success: true, data: { userId: id, funIds: updated } });
    } catch (err) {
      res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Unknown error' });
    }
  });

  return router;
}
