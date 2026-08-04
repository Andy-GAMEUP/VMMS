/**
 * 사용자 & 부서 API 라우트
 */

import { Router, type Request, type Response } from 'express';
import type { XzyClient } from '../lib/xzyClient.js';

export function createUserRoutes(xzy: XzyClient): Router {
  const router = Router();

  /** GET /api/users — 사용자 조회 */
  router.get('/', async (req: Request, res: Response) => {
    try {
      const { userName, phone, deptId, status } = req.query;
      const data = await xzy.getUsers({
        userName: userName as string | undefined,
        phone: phone as string | undefined,
        deptId: deptId ? Number(deptId) : undefined,
        status: status !== undefined ? Number(status) : undefined,
      });
      res.json({ success: true, data, timestamp: Date.now() });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      res.status(500).json({ success: false, error: message, timestamp: Date.now() });
    }
  });

  /** POST /api/users — 사용자 추가 (배치) */
  router.post('/', async (req: Request, res: Response) => {
    try {
      const { users } = req.body;
      if (!Array.isArray(users) || users.length === 0) {
        res.status(400).json({ success: false, error: 'users array is required' });
        return;
      }
      const data = await xzy.addUsers(JSON.stringify(users));
      res.json({ success: true, data, timestamp: Date.now() });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      res.status(500).json({ success: false, error: message, timestamp: Date.now() });
    }
  });

  return router;
}

export function createDeptRoutes(xzy: XzyClient): Router {
  const router = Router();

  /** GET /api/departments — 부서 조회 */
  router.get('/', async (req: Request, res: Response) => {
    try {
      const deptId = req.query.deptId ? Number(req.query.deptId) : undefined;
      const data = await xzy.getDepartments({ deptId });
      res.json({ success: true, data, timestamp: Date.now() });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      res.status(500).json({ success: false, error: message, timestamp: Date.now() });
    }
  });

  /** POST /api/departments — 부서 추가 */
  router.post('/', async (req: Request, res: Response) => {
    try {
      const { deptName, parentId } = req.body;
      if (!deptName || parentId === undefined) {
        res.status(400).json({ success: false, error: 'deptName and parentId required' });
        return;
      }
      const data = await xzy.addDepartment(deptName, Number(parentId));
      res.json({ success: true, data, timestamp: Date.now() });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      res.status(500).json({ success: false, error: message, timestamp: Date.now() });
    }
  });

  return router;
}
