# VMMS 배포 아키텍처 및 현황

> 마지막 업데이트: 2026-08-04

## 배포 구조

```
┌─────────────────────────────────────────────────────────┐
│                     사용자 브라우저                         │
│               (모바일 / 태블릿 / 데스크탑)                   │
└─────────┬───────────────────────────────────┬───────────┘
          │ HTTPS                             │ HTTPS
          ▼                                   ▼
┌─────────────────────┐          ┌──────────────────────────┐
│   Vercel (Frontend)  │          │   Railway (BFF Server)    │
│                     │  REST    │                          │
│  React + Vite SPA   │ ──────► │  Express + tsx Runtime    │
│  Static Hosting     │  API    │  Node 22                  │
│                     │ ◄────── │                          │
│  vmms-app-beta      │  JSON   │  vmms-production          │
│  .vercel.app        │         │  .up.railway.app          │
└─────────────────────┘          └────────┬──────┬──────────┘
                                          │      │
                            ┌─────────────┘      └──────────────┐
                            │ REST API                          │ PostgreSQL
                            ▼                                   ▼
                 ┌─────────────────────┐          ┌──────────────────────┐
                 │   鑫之源 (XZY)       │          │    Supabase           │
                 │   Cloud Platform    │          │    PostgreSQL         │
                 │                     │          │                      │
                 │  V1.1 remotingData  │          │  users               │
                 │  V1.2 remotingCust  │          │  chat_rooms          │
                 │  AMQP (미연결)       │          │  chat_messages       │
                 └─────────────────────┘          │  machine_assignments │
                                                  └──────────────────────┘
```

## 서비스별 상세

### 1. Frontend — Vercel

| 항목 | 값 |
|------|-----|
| URL | `https://vmms-app-beta.vercel.app` |
| 프레임워크 | React 18 + Vite 6 + TypeScript |
| 스타일링 | Tailwind CSS 3 + CSS 변수 (다크모드) |
| 상태관리 | Zustand 5 + TanStack React Query 5 |
| 라우팅 | React Router DOM 6 |
| 차트 | Recharts 2 |
| 빌드 명령 | `tsc --noEmit && vite build` |
| 출력 디렉터리 | `dist` |
| 빌드 환경변수 | `VITE_API_URL=https://vmms-production.up.railway.app` |

**프론트엔드 주요 페이지:**

| 페이지 | 경로 | 설명 |
|--------|------|------|
| 로그인 | `/login` | JWT 인증 |
| 회원가입 | `/register` | 부서 선택 + 승인 대기 |
| 대시보드 | `/` | 매출 요약, 장비 현황, 순위 |
| 자판기 관리 | `/machines` | 자판기/매출/상품 탭 |
| 자판기 상세 | `/machines/:funId` | 상세보기/재고확인 탭 |
| 메시지 | `/messages` | 알림 + DM 채팅 |
| DM 채팅 | `/messages/dm/:roomId` | 실시간 1:1 채팅 |
| MY | `/my` | 프로필, 설정, Admin 메뉴 |
| 사용자 관리 | `/admin/users` | Admin 전용 — 승인/거절 |

### 2. BFF Server — Railway

| 항목 | 값 |
|------|-----|
| URL | `https://vmms-production.up.railway.app` |
| Health | `https://vmms-production.up.railway.app/api/health` |
| 런타임 | Node 22 (Docker: `node:22-slim`) |
| 프레임워크 | Express 4 + tsx (TypeScript 직접 실행) |
| 배포 방식 | Dockerfile (main 브랜치 자동 배포) |
| 인증 | JWT (Access + Refresh Token) |
| 외부 API | 鑫之源 REST API (MD5 서명) |
| 실시간 | SSE (Server-Sent Events) |
| 폴링 | StatusPoller (5분 간격) |

**Railway 환경변수:**

| 변수 | 설명 |
|------|------|
| `SUPABASE_URL` | Supabase 프로젝트 URL |
| `SUPABASE_SERVICE_KEY` | Supabase 서비스 키 |
| `JWT_ACCESS_SECRET` | JWT Access 토큰 서명 키 |
| `JWT_REFRESH_SECRET` | JWT Refresh 토큰 서명 키 |
| `XZY_APP_ID` | 鑫之源 앱 ID |
| `XZY_API_KEY` | 鑫之源 API 키 |
| `XZY_API_BASE_V11` | 鑫之源 V1.1 엔드포인트 (remotingData) |
| `XZY_API_BASE_V12` | 鑫之源 V1.2 엔드포인트 (remotingCust) |
| `NODE_ENV` | `production` |
| `CORS_ORIGIN` | `https://vmms-app-beta.vercel.app` |
| `PORT` | Railway 자동 할당 |

**BFF API 엔드포인트:**

| Method | 경로 | 인증 | 설명 |
|--------|------|------|------|
| POST | `/api/auth/login` | - | 로그인 |
| POST | `/api/auth/register` | - | 회원가입 |
| POST | `/api/auth/refresh` | - | 토큰 갱신 |
| GET | `/api/public/departments` | - | 부서 목록 (회원가입용) |
| GET | `/api/health` | - | 헬스 체크 |
| GET | `/api/dashboard/summary` | JWT | 대시보드 요약 |
| GET | `/api/machines` | JWT | 자판기 목록 |
| GET | `/api/machines/:funId` | JWT | 자판기 상세 |
| GET | `/api/machines/:funId/roads` | JWT | 슬롯 재고 |
| GET | `/api/products` | JWT | 상품 목록 |
| GET | `/api/products/selling-ids` | JWT | 판매중 상품 ID |
| GET | `/api/sales/stats` | JWT | 매출 통계 |
| GET | `/api/sales/by-machine` | JWT | 자판기별 매출 |
| GET | `/api/users` | JWT | 사용자 목록 |
| POST | `/api/users` | JWT | 사용자 등록 (XZY 동기화) |
| GET | `/api/departments` | JWT | 부서 목록 |
| POST | `/api/departments` | JWT | 부서 등록 (XZY 동기화) |
| GET | `/api/notifications/stream` | JWT | SSE 알림 스트림 |
| GET | `/api/chat/rooms` | JWT | 채팅방 목록 |
| POST | `/api/chat/rooms` | JWT | 채팅방 생성 |
| GET | `/api/chat/rooms/:roomId/messages` | JWT | 메시지 조회 |
| POST | `/api/chat/rooms/:roomId/messages` | JWT | 메시지 전송 |
| PUT | `/api/chat/rooms/:roomId/read` | JWT | 읽음 처리 |
| GET | `/api/chat/stream` | JWT | 채팅 SSE 스트림 |
| GET | `/api/admin/pending-users` | JWT | 대기 사용자 목록 |
| POST | `/api/admin/approve/:userId` | JWT | 사용자 승인 |
| POST | `/api/admin/reject/:userId` | JWT | 사용자 거절 |
| GET | `/api/admin/machine-assignments` | JWT | 자판기 배정 목록 |
| POST | `/api/admin/machine-assignments` | JWT | 자판기 배정 |
| DELETE | `/api/admin/machine-assignments/:id` | JWT | 자판기 배정 해제 |

### 3. Database — Supabase

| 항목 | 값 |
|------|-----|
| 프로젝트 | `dwbfmmszpfjdreoopmxv` |
| 리전 | ap-northeast-2 (서울) |
| 엔진 | PostgreSQL 15 |

**테이블:**

| 테이블 | 설명 | 주요 컬럼 |
|--------|------|-----------|
| `users` | 사용자 계정 | id, email, name, role, status, deptId, passwordHash |
| `chat_rooms` | 채팅방 | id, participants, lastMessage, updatedAt |
| `chat_messages` | 채팅 메시지 | id, roomId, senderId, text, timestamp |
| `machine_assignments` | 자판기-사용자 배정 | id, userId, funId, assignedBy |

### 4. 외부 API — 鑫之源 (XZY)

| API 버전 | 베이스 URL | 용도 |
|----------|-----------|------|
| V1.1 | `http://api.xzyvend.com/remotingData` | 설비, 상품, 화도 (조회 전용) |
| V1.2 | `http://api.xzyvend.com/remotingCust` | 사용자, 부서, 매출 (양방향) |

**연동 API (9개):**

| API | 방향 | 구현 상태 |
|-----|------|-----------|
| `getFunByDept` | 조회 | 완료 |
| `getFunById` | 조회 | 완료 |
| `getRoodById` | 조회 | 완료 |
| `getGoodsById` | 조회 | 완료 |
| `getUserInfo` | 조회 | 완료 |
| `addUserInfo` | 등록 | 완료 |
| `getDeptInfo` | 조회 | 완료 |
| `addDeptInfo` | 등록 | 완료 |
| `countInfo` | 조회 | 완료 |

## 실시간 알림 구조

```
鑫之源 REST API
      │
      │ (5분 폴링)
      ▼
┌─────────────┐     EventEmitter      ┌───────────┐     SSE      ┌──────────┐
│ StatusPoller │ ──── 'alert' ────►   │ SSE Route │ ──────────► │ Frontend │
└─────────────┘                       └───────────┘              └──────────┘
                                            ▲
┌─────────────┐     EventEmitter            │
│ AmqpConsumer│ ──── 'alert' ────────────────┘
└─────────────┘  (AMQP 미연결 — 향후 활성화)
```

**감지 항목:**

| 유형 | 감지 조건 | AMQP 큐 |
|------|-----------|---------|
| 설비 상태 변경 | `funStatus` 또는 `lineStatus` 변경 | `ko_fun_queue` |
| 재고 부족 | `roadStock ≤ funWaring` 임계값 도달 | `ko_fun_inventory_queue` |
| 보충 완료 | `roadStock` 증가 감지 | `ko_fun_stock` |

## 테스트 계정

| 역할 | 이메일 | 비밀번호 |
|------|--------|----------|
| Admin | `admin@vmms.local` | `admin1234` |
| Manager | `test@vmms.local` | `test1234` |

## 프로젝트 디렉터리 구조

```
VMMS/
├── Dockerfile                 # Railway 배포용
├── vercel.json                # Vercel 배포 설정
├── package.json               # 통합 의존성
├── tsconfig.json              # 프론트엔드 TS 설정
├── vite.config.ts             # Vite 빌드 설정
├── server/                    # BFF Express 서버
│   ├── index.ts               # 엔트리포인트
│   ├── db/                    # Supabase 데이터 스토어
│   │   ├── chatStore.ts
│   │   ├── machineAssignStore.ts
│   │   └── userStore.ts
│   ├── lib/                   # 핵심 라이브러리
│   │   ├── amqpConsumer.ts    # AMQP 메시지 소비자
│   │   ├── auth.ts            # JWT 인증
│   │   ├── sign.ts            # MD5 서명 생성
│   │   ├── statusPoller.ts    # REST API 폴링
│   │   ├── supabase.ts        # Supabase 클라이언트
│   │   └── xzyClient.ts       # 鑫之源 API 클라이언트
│   └── routes/                # API 라우트
│       ├── admin.ts
│       ├── auth.ts
│       ├── chat.ts
│       ├── dashboard.ts
│       ├── machines.ts
│       ├── notifications.ts
│       ├── products.ts
│       ├── sales.ts
│       └── users.ts
└── src/                       # React 프론트엔드
    ├── api/                   # API 클라이언트
    ├── components/            # 공통 컴포넌트
    ├── hooks/                 # 커스텀 훅
    ├── i18n/                  # 다국어 (ko/en)
    ├── pages/                 # 페이지 컴포넌트
    ├── store/                 # Zustand 스토어
    ├── types/                 # TypeScript 타입
    └── utils/                 # 유틸리티
```

## 배포 이력

| 날짜 | 커밋 | 내용 |
|------|------|------|
| 2026-08-04 | `658cfcd` | 자판기별 매출 데이터 실제 조회 (countInfo funId) |
| 2026-08-04 | `b724b5a` | REST API 폴링 기반 알림 (StatusPoller) |
| 2026-08-04 | `757c274` | DM 채팅 SSE fetch 기반 전환 |
| 2026-08-04 | `a4efbf7` | 디버그 로그 제거, SSE URL 크로스오리진 수정 |
| 2026-08-04 | `1e57e91` | Railway Dockerfile 전환 |
| 2026-08-03 | `78f2025` | Supabase PostgreSQL 마이그레이션 + 배포 설정 |
| 2026-08-03 | `0231234` | 전면 리뉴얼 (반응형, 다크모드, i18n, 관리자) |
