/**
 * 인증 관련 React Hook
 * - authStore 래퍼 (컴포넌트에서 편리하게 사용)
 */

import { useAuthStore } from '@/store/authStore';
import { ROLE_PERMISSIONS } from '@/types/auth';

/** 현재 로그인 사용자 정보 & 권한 체크 */
export function useAuth() {
  const { isAuthenticated, user, isLoading } = useAuthStore();

  const role = user?.role ?? 'viewer';
  const permissions = ROLE_PERMISSIONS[role];

  return {
    isAuthenticated,
    isLoading,
    user,
    role,
    permissions,
    /** admin 여부 */
    isAdmin: role === 'admin',
    /** 편집 가능 여부 (admin, manager) */
    canEdit: permissions.canEdit,
    /** 전체 부서 접근 가능 여부 */
    allDeptAccess: permissions.allDeptAccess,
    /** 데이터 접근 범위 deptId (admin=0 → 전체) */
    scopedDeptId: user?.deptId ?? 0,
  };
}
