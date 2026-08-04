/**
 * 사용자/인증 타입 정의
 *
 * 鑫之源 API: getUserInfo / addUserInfo (V1.2)
 * - 鑫之源은 로그인/비밀번호/역할 API를 제공하지 않음
 * - admin이 수동 등록 후 개통하는 방식
 * - VMMS는 자체 로그인 시스템 운영
 */

// ===== 鑫之源 플랫폼 타입 (API 원문 기준) =====

/** getUserInfo 응답 — 鑫之源 UserVO */
export interface XzyUserVO {
  userid: number;
  username: string; // 로그인 계정명
  nickName: string;
  email: string;
  phonenumber: string;
  sex: string; // "0"=남, "1"=여
  status: string; // "0"=정상, "1"=停用
  delFlag: string; // "0"=존재, "2"=삭제
  deptId: number;
  loginDate: number; // 최종 로그인 시각 (ms)
}

/** addUserInfo 요청 — userList 항목 */
export interface XzyUserCreateDTO {
  UserName: string; // 계정명 (필수, 4-20자)
  nickName?: string;
  email?: string;
  phone: string; // 전화번호 (필수, 11자리)
  deptId: number; // 소속 부서 ID (필수)
  sex?: string; // "0" 또는 "1"
}

/** getDeptInfo 응답 — 鑫之源 DeptVO */
export interface XzyDeptVO {
  deptId: number;
  deptName: string;
  parentId: number; // 0=루트
  parentName: string;
  orderNum: number; // 표시 순서
  phone: string;
  email: string;
  status: string; // "0"=정상, "1"=停用
  delFlag: string; // "0"=존재, "2"=삭제
  deptLevel: number; // 하위 부서 추가 가능 수량 한도
}

/** addDeptInfo 요청 */
export interface XzyDeptCreateDTO {
  deptName: string; // 1-50자
  parentId: number; // 0=루트 하위에 생성
  orderNum?: number; // 기본 0
  phone?: string;
  email?: string;
}

// ===== VMMS 자체 인증 타입 =====

/** VMMS 사용자 역할 */
export type UserRole = 'admin' | 'manager';

/** 계정 유형: sub_admin(조직 내 관리자), business(가맹점/사업자) */
export type AccountType = 'sub_admin' | 'business';

/** VMMS 자체 사용자 (BFF DB 저장) */
export interface VmmsUser {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: UserRole;
  accountType: AccountType;
  deptId: number; // 鑫之源 부서 ID → 데이터 접근 범위
  deptName: string; // 표시용 (getDeptInfo에서 조회)
  status: 'active' | 'pending' | 'disabled';
  createdAt: number;
  lastLoginAt: number | null;
  // 사업자(business) 전용 필드
  businessName?: string; // 가맹점/매장명 → addDeptInfo의 deptName
  parentDeptId?: number; // 상위 부서 ID → addDeptInfo의 parentId
}

/** 로그인 요청 */
export interface LoginRequest {
  email: string;
  password: string;
}

/** 로그인 응답 */
export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: VmmsUser;
}

/** 회원가입 요청 (공통) */
export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  phone: string;
  accountType: AccountType;
  deptId?: number; // sub_admin 전용: 기존 부서 선택
  businessName?: string; // business 전용: 가맹점/매장명
  parentDeptId?: number; // business 전용: 상위 부서 ID
}

/** JWT Payload */
export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
  deptId: number;
  iat?: number;
  exp?: number;
}

/** 앱 내 인증 상태 */
export interface AuthState {
  isAuthenticated: boolean;
  user: VmmsUser | null;
  accessToken: string | null;
}

/** 역할별 권한 */
export const ROLE_PERMISSIONS: Record<UserRole, { label: string; canManageUsers: boolean; allDeptAccess: boolean; canEdit: boolean }> = {
  admin: { label: '통합관리자', canManageUsers: true, allDeptAccess: true, canEdit: true },
  manager: { label: '매장관리자', canManageUsers: false, allDeptAccess: false, canEdit: true },
};
