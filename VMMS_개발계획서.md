# VMMS (Vending Machine Management System) 개발계획서
## 스마트 자판기 매장관리자용 반응형 모바일 웹

---

## 1. 프로젝트 개요

| 항목 | 내용 |
|------|------|
| 프로젝트명 | VMMS - 스마트 자판기 관리 솔루션 |
| 플랫폼 | 반응형 모바일 웹 (Mobile-First) |
| 대상 사용자 | 매장관리자 (자판기 운영/관리 담당자) |
| 주요 목적 | 자판기 상태 모니터링, 재고/매출 관리, 광고 LED 관리, 프로모션/증정 관리, 알림/메시지 처리 |

---

## 2. 기술 스택

| 구분 | 기술 |
|------|------|
| **Frontend** | React 18+ / TypeScript / Vite |
| **UI Framework** | Tailwind CSS + Headless UI |
| **상태관리** | Zustand |
| **데이터 페칭** | TanStack Query (React Query) |
| **차트** | Recharts |
| **라우팅** | React Router v6 |
| **인증** | API Key + Role 기반 인증 (기기 측 권한 제어 연동) |
| **실시간 통신** | WebSocket / Webhook 콜백 (재고 부족 알림, 상태 변경 푸시) |
| **빌드/배포** | Vite + Docker + Nginx |

---

## 3. 시스템 아키텍처

### 3.1 전체 구조

```
┌──────────────┐     ┌───────────────────┐     ┌──────────────────┐
│  VMMS 프론트   │────▶│  VMMS 백엔드(BFF)   │────▶│  기기 측 시스템 API  │
│  (React SPA)  │◀────│  (고객 백엔드)       │◀────│  (자판기 하드웨어)   │
└──────────────┘     └───────────────────┘     └──────────────────┘
                            │                          │
                            │  - 인증/권한 관리           │  - 자판기 CRUD
                            │  - 역할별 필드 제어          │  - SKU/슬롯 관리
                            │  - 매입가 노출 제어          │  - 판매 데이터
                            │  - 알림/DM 관리             │  - 광고 LED 관리
                            │  - 상품 라이브러리 동기화       │  - 증정 규칙 관리
                            │                          │  - 상태 콜백 푸시
```

### 3.2 API 계층 분리

기능정의서를 분석한 결과, API는 두 계층으로 분리됩니다:

| 계층 | 설명 | 담당 |
|------|------|------|
| **기기 측 API** (Device API) | 자판기 하드웨어 시스템이 제공하는 API | 자판기 등록/수정, SKU 관리, 슬롯 설정, 판매 데이터, 광고 LED, 증정 규칙 |
| **고객 백엔드 API** (BFF) | VMMS가 자체 구축하는 중간 서버 | 인증/로그인, 권한 관리, 매입가 제어, 알림/DM, 대시보드 집계, 상품 라이브러리 동기화 |

---

## 4. 사이트맵 & 화면 구조

```
VMMS
├── 인증 영역 (Public)
│   ├── /login                        - 로그인
│   ├── /register                     - 매장관리자 신청
│   └── /register/status              - 승인 대기 상태 확인
│
├── 메인 영역 (Protected)
│   ├── /dashboard                    - 대시보드 (홈)
│   │
│   ├── /machines                     - 자판기 관리
│   │   ├── /machines                 - 자판기 리스트 & 장비 현황
│   │   ├── /machines/new             - 신규 자판기 등록
│   │   └── /machines/:id             - 자판기 상세
│   │       ├── 기본정보 탭 (수정 가능)
│   │       ├── 슬롯 설정 탭
│   │       ├── 재고현황 탭
│   │       └── 매출현황 탭
│   │
│   ├── /products                     - 상품 SKU 관리
│   │   ├── /products                 - 상품 목록
│   │   ├── /products/new             - 신규 SKU 등록
│   │   ├── /products/:id             - SKU 상세/수정
│   │   └── /products/categories      - 카테고리 관리
│   │
│   ├── /inventory                    - 재고 관리
│   │   ├── /inventory                - 전체 재고 현황
│   │   └── /inventory/low-stock      - 재고 부족 목록
│   │
│   ├── /sales                        - 매출 현황
│   │   ├── /sales                    - 매출 요약 & 통계
│   │   ├── /sales/detail             - 판매 내역 조회
│   │   └── /sales/ranking            - 매출 순위
│   │
│   ├── /ads                          - 광고 LED 관리
│   │   ├── /ads                      - 광고 목록
│   │   ├── /ads/new                  - 광고 영상 업로드 & 등록
│   │   ├── /ads/:id                  - 광고 상세/수정
│   │   └── /ads/schedule/:machineId  - 자판기별 재생 계획 설정
│   │
│   ├── /promotions                   - 증정/프로모션 관리
│   │   ├── /promotions               - 증정 규칙 목록
│   │   └── /promotions/new           - 신규 규칙 생성
│   │
│   ├── /orders                       - 주문 조회
│   │   └── /orders                   - 주문 내역 (픽업코드 포함)
│   │
│   ├── /messages                     - 메시지
│   │   ├── /messages/notices         - 알림 메시지 수신함
│   │   └── /messages/dm              - 관리자 DM
│   │
│   └── /my                           - 마이페이지
│       ├── /my                       - 내 정보
│       └── /my/settings              - 설정
│
└── 하단 탭 네비게이션
    ├── 홈 (대시보드)
    ├── 자판기
    ├── 메시지
    └── MY
```

---

## 5. 핵심 기능 상세 설계

### 5.1 인증 & 계정 관리 (고객 백엔드 자체 구현)

| 기능 | 설명 | 비고 |
|------|------|------|
| 매장관리자 신청 | 사업자 정보, 담당자 정보 입력 후 승인 요청 | |
| 승인 상태 확인 | 대기/승인/반려 상태 확인 | |
| 로그인 | ID/PW → JWT 발급 | |
| 역할 기반 접근 | API Key + Role로 기기 측 호출 시 필드 제어 | 매입가는 슈퍼관리자만 노출 |

### 5.2 자판기 관리 (기기 측 API 연동)

| 기능 | 연동 API | 설명 |
|------|----------|------|
| 자판기 등록 | 신규 자판기 등록 API | 고정 ID, 명칭, 설치 장소, 주소, GPS, 네트워크 주소 |
| 자판기 수정 | 자판기 정보 업데이트 API | 명칭, 장소, 주소, GPS, 상태(정상/오프라인/점검 중) |
| 자판기 삭제/정지 | 자판기 삭제/정지 API | 논리적 삭제 또는 영구 삭제 |
| 확장 정보 조회 | 기기 정보 확장 API | 등록일, 무선 네트워크 주소 포함 |
| 상태 실시간 수신 | 상태 능동 푸시 (콜백) | 상태 변경 시 기기 측에서 자동 통지 |

### 5.3 상품 SKU 관리 (기기 측 API 연동)

| 기능 | 연동 API | 설명 |
|------|----------|------|
| SKU 생성 | 상품 SKU 생성 API | 명칭, 카테고리(증정품 포함), 매입가, 판매가, 바코드 생성 |
| SKU 수정 | 상품 SKU 업데이트 API | |
| SKU 삭제 | 상품 SKU 삭제 API | 자판기 참조 여부 체크 |
| 카테고리 조회 | 카테고리 목록 조회 API | 사용자 정의 카테고리 추가 필요 |
| 상품 목록 확장 | 상품 목록 확장 API | 자판기 ID별 필터링, 매입가 권한별 노출 |

### 5.4 슬롯 & 재고 관리 (기기 측 API 연동)

| 기능 | 연동 API | 설명 |
|------|----------|------|
| 슬롯 상품 설정 | 슬롯 상품 설정 API | 슬롯에 SKU 바인딩, 초기/최소 재고 설정 |
| 슬롯 일괄 설정 | 슬롯 일괄 설정 API | 여러 슬롯 동시 설정 (보충 효율) |
| 슬롯 비우기 | 슬롯 비우기 API | 특정/전체 슬롯 초기화 |
| 재고 부족 알림 | 재고 부족 알림 등록 API | 콜백 URL 등록 → 임계값 미달 시 통지 |

### 5.5 판매 데이터 & 매출 (기기 측 API 연동)

| 기능 | 연동 API | 설명 |
|------|----------|------|
| 판매 내역 조회 | 판매 내역 조회 API | 시간범위, 자판기, SKU별 상세 필터링 |
| 매출 통계 | 판매 요약 통계 API (선택) | 일/주/월 단위, 자판기/상품/매장별 그룹화 |
| 대시보드 집계 | 고객 백엔드에서 자체 집계 | 기기 측 미제공 시 판매 내역 기반 계산 |

### 5.6 광고 LED 관리 (기기 측 API 연동 - 신규 모듈)

| 기능 | 연동 API | 설명 |
|------|----------|------|
| 영상 업로드 | 광고 영상 업로드 API | MP4 파일 업로드 → 광고 ID, URL 반환 |
| 광고 항목 CRUD | 광고 생성/수정/삭제 API | 명칭, 파일유형, URL, 재생시간, 상태 |
| 재생 계획 설정 | 자판기 광고 재생 계획 설정 API | 재생 목록, 순서, 시간대, 공휴일 설정 |
| 업데이트 트리거 | 자판기 광고 업데이트 트리거 API | 최신 계획/영상 즉시 다운로드 명령 |
| 업데이트 상태 확인 | 자판기 광고 업데이트 상태 조회 API | 성공/실패/진행 중, 최종 업데이트 시간 |

### 5.7 증정/프로모션 관리 (기기 측 API 연동)

| 기능 | 연동 API | 설명 |
|------|----------|------|
| 증정 규칙 생성 | 증정 규칙 생성 API | "A 구매 시 B 자동 증정" (1+1 등) |
| 증정 규칙 조회 | 증정 규칙 조회 API | SKU/규칙 ID로 조회 |
| 증정 규칙 삭제 | 증정 규칙 삭제 API | |
| 주문 증정 자동 적용 | 주문 생성 인터페이스 확장 | 기기 측 내부에서 자동 처리 (추가 파라미터 불필요) |

### 5.8 알림 & 메시지 (고객 백엔드 자체 구현 + 기기 측 콜백)

| 기능 | 설명 |
|------|------|
| 재고 부족 알림 수신 | 기기 측 Webhook 콜백으로 수신 → 알림 저장 |
| 자판기 상태 변경 알림 | 기기 측 상태 능동 푸시로 수신 → 알림 저장 |
| 시스템/관리자 알림 | 고객 백엔드에서 자체 발송 |
| DM 메시지 | 관리자(운영팀)와 1:1 메시지 |
| 실시간 수신 | WebSocket으로 프론트에 즉시 전달 |

---

## 6. API 연동 정의서

### 6.1 기기 측 API (Device API) - 연동 대상

#### 6.1.1 자판기 관리 세팅 API

| # | Method | Endpoint (예상) | 인터페이스 명칭 | 우선순위 | 필수 입력 | 기대 출력 |
|---|--------|----------------|---------------|---------|----------|----------|
| 1 | POST | `/device/machines` | 신규 자판기 등록 | 높음 | 자판기 고정 ID, 명칭, 설치 장소, 상세 주소, GPS 좌표, 무선 네트워크 주소(선택), 최초 등록일 | 자판기 ID, 등록 결과 |
| 2 | PUT | `/device/machines/:id` | 자판기 정보 업데이트 | 높음 | 자판기 ID, 업데이트 대상 필드(명칭, 장소, 주소, GPS, 상태) | 업데이트 결과 |
| 3 | DELETE | `/device/machines/:id` | 자판기 삭제/정지 | 중간 | 자판기 ID, 작업 유형(정지/삭제) | 작업 결과 |
| 4 | GET | `/device/machines/:id/extended` | 기기 정보 확장 인터페이스 | 높음 | 자판기 ID | 등록일, 무선 네트워크 주소 포함 전체 정보 |

> **주의**: 현재 기기 측은 조회 인터페이스만 존재하며, 등록(POST) API는 추가 개발 필요. 확장 인터페이스도 기존 수정 불가 시 독립 제공 예정.

#### 6.1.2 상품 SKU 관리/보충 API

| # | Method | Endpoint (예상) | 인터페이스 명칭 | 우선순위 | 필수 입력 | 기대 출력 |
|---|--------|----------------|---------------|---------|----------|----------|
| 1 | POST | `/device/products` | 상품 SKU 생성 | 높음 | SKU 명칭, 카테고리(무료 증정품 포함), 매입가(관리자 전용), 판매가, 상태, 바코드 | SKU 코드, 바코드 URL, 생성 결과 |
| 2 | PUT | `/device/products/:skuCode` | 상품 SKU 업데이트 | 높음 | SKU 코드, 업데이트 대상 필드 | 업데이트 결과 |
| 3 | DELETE | `/device/products/:skuCode` | 상품 SKU 삭제 | 중간 | SKU 코드 | 작업 결과 |
| 4 | GET | `/device/categories` | 카테고리 목록 조회 | 높음 | 없음 | 카테고리 구조 |
| 5 | GET | `/device/products` | 상품 목록 확장 | 높음 | 자판기 ID, 페이징 파라미터 | 상품 목록 (권한별 매입가 노출 제어) |

> **주의**: 고객 백엔드에서 상품 라이브러리 동기화 필요. 사용자 정의 카테고리 추가 인터페이스 필요.

#### 6.1.3 슬롯/재고 설정 API

| # | Method | Endpoint (예상) | 인터페이스 명칭 | 우선순위 | 필수 입력 | 기대 출력 |
|---|--------|----------------|---------------|---------|----------|----------|
| 1 | PUT | `/device/machines/:id/slots/:slotNo` | 슬롯 상품 설정 | 높음 | 자판기 ID, 슬롯 번호, SKU 코드, 초기 재고, 최소 재고 임계값 | 성공/실패 |
| 2 | PUT | `/device/machines/:id/slots/batch` | 슬롯 일괄 설정 | 높음 | 자판기 ID, 슬롯 설정 배열 | 일괄 작업 결과 |
| 3 | DELETE | `/device/machines/:id/slots` | 슬롯 비우기 | 중간 | 자판기 ID, 슬롯 목록(선택) | 작업 결과 |
| 4 | POST | `/device/webhooks/low-stock` | 재고 부족 알림 등록 | 높음 | 콜백 URL, 이벤트 유형, 자판기 ID | 등록 성공/실패 |

> **주의**: 기존 슬롯 목록은 읽기 전용이므로 쓰기 API 추가 개발 필요.

#### 6.1.4 판매 데이터 API

| # | Method | Endpoint (예상) | 인터페이스 명칭 | 우선순위 | 필수 입력 | 기대 출력 |
|---|--------|----------------|---------------|---------|----------|----------|
| 1 | GET | `/device/sales` | 판매 내역 조회 | 높음 | 시작 시간, 종료 시간, 자판기 ID(선택), SKU(선택), 페이징 파라미터 | 판매 기록 목록 (판매 시간, 자판기 ID, SKU, 판매가, 수량, 주문번호) |
| 2 | GET | `/device/sales/summary` | 판매 요약 통계 (선택) | 중간 | 시간 단위(일/주/월), 그룹화 기준(자판기/상품/매장), 시간 범위 | 매출액, 판매량, 비중 등 |

> **주의**: 기존 주문 인터페이스는 단건 조회만 지원. 통계 API가 미제공 시 고객 백엔드에서 판매 내역 기반 자체 집계 필요.

#### 6.1.5 광고 LED 관리 API (신규 모듈)

| # | Method | Endpoint (예상) | 인터페이스 명칭 | 우선순위 | 필수 입력 | 기대 출력 |
|---|--------|----------------|---------------|---------|----------|----------|
| 1 | POST | `/device/ads/upload` | 광고 영상 업로드 | 높음 | 파일 바이너리, 파일명, 해상도(선택), 재생시간(선택) | 광고 ID, 영상 URL |
| 2 | POST | `/device/ads` | 광고 항목 생성 | 높음 | 광고 명칭, 파일 유형, 영상 URL, 재생시간, 상태(활성/비활성) | 광고 ID |
| 3 | PUT | `/device/ads/:id` | 광고 항목 업데이트 | 높음 | 광고 ID, 업데이트 대상 필드 | 성공/실패 |
| 4 | DELETE | `/device/ads/:id` | 광고 삭제 | 높음 | 광고 ID | 성공/실패 |
| 5 | PUT | `/device/machines/:id/ads/schedule` | 자판기 광고 재생 계획 설정 | 높음 | 자판기 ID, 광고 재생 계획 배열(광고 ID, 순서, 활성화 여부, 일일 재생 시간대, 공휴일 목록) | 성공/실패 |
| 6 | POST | `/device/machines/:id/ads/trigger` | 자판기 광고 업데이트 트리거 | 높음 | 자판기 ID | 명령 하달 성공/실패 |
| 7 | GET | `/device/machines/:id/ads/status` | 자판기 광고 업데이트 상태 조회 | 높음 | 자판기 ID | 업데이트 상태(성공/실패/진행 중), 최종 업데이트 시간 |

#### 6.1.6 증정품/프로모션 규칙 API

| # | Method | Endpoint (예상) | 인터페이스 명칭 | 우선순위 | 필수 입력 | 기대 출력 |
|---|--------|----------------|---------------|---------|----------|----------|
| 1 | POST | `/device/promotions` | 증정 규칙 생성 | 높음 | 주 상품 SKU, 증정 상품 SKU, 규칙 시작/종료 시간, 구매 수량 조건(1+1), 증정 수량 | 규칙 ID |
| 2 | GET | `/device/promotions` | 증정 규칙 조회 | 중간 | 주 상품 SKU / 규칙 ID | 규칙 상세 목록 |
| 3 | DELETE | `/device/promotions/:id` | 증정 규칙 삭제 | 중간 | 규칙 ID | 성공/실패 |

> **주의**: 주문 생성 시 기기 측 내부에서 자동으로 증정품을 주문에 추가함. 고객 백엔드에서 추가 파라미터 불필요.

#### 6.1.7 기기 측 이벤트/콜백

| 이벤트 | 방식 | 설명 | Payload (예상) |
|--------|------|------|---------------|
| 자판기 상태 변경 | Webhook 콜백 | 정상/오프라인/점검 중 변경 시 자동 통지 | `{ machineId, status, timestamp }` |
| 재고 부족 통지 | Webhook 콜백 | 등록된 임계값 미달 시 통지 | `{ machineId, slotNo, skuCode, currentStock, threshold }` |

---

### 6.2 고객 백엔드 API (BFF) - 자체 구축

#### 6.2.1 인증 API

| Method | Endpoint | 설명 | Request Body | Response |
|--------|----------|------|-------------|----------|
| POST | `/api/auth/register` | 매장관리자 신청 | `{ name, email, password, phone, businessNumber, businessName, businessAddress }` | `{ id, status: "PENDING" }` |
| GET | `/api/auth/register/status` | 승인 상태 조회 | - | `{ status, reason? }` |
| POST | `/api/auth/login` | 로그인 | `{ email, password }` | `{ accessToken, refreshToken, user: { id, name, role } }` |
| POST | `/api/auth/refresh` | 토큰 갱신 | `{ refreshToken }` | `{ accessToken, refreshToken }` |
| POST | `/api/auth/logout` | 로그아웃 | - | `{ success }` |
| PUT | `/api/auth/password` | 비밀번호 변경 | `{ currentPassword, newPassword }` | `{ success }` |

#### 6.2.2 대시보드/집계 API (자체 집계)

| Method | Endpoint | 설명 | Parameters | Response |
|--------|----------|------|-----------|----------|
| GET | `/api/dashboard/summary` | 매출 요약 | `?period=TODAY\|WEEK\|MONTH\|YEAR` | `{ totalIncome, totalRefund, todaySales, todayOrders, todayRefund, yesterdaySales, yesterdayOrders, yesterdayRefund }` |
| GET | `/api/dashboard/machines` | 장비 현황 요약 | - | `{ total, online, offline, maintenance }` |
| GET | `/api/dashboard/sales-trend` | 매출 추이 | `?period=DAILY\|WEEKLY\|MONTHLY&from=&to=` | `{ data: [{ date, sales, orders, refund }] }` |
| GET | `/api/dashboard/ranking` | 제품별 매출 순위 | `?period=&limit=` | `{ products: [{ skuCode, name, sales, quantity, rank }] }` |

> **구현 전략**: 기기 측 `판매 요약 통계 API`가 제공되면 직접 사용. 미제공 시 `판매 내역 조회 API`로 원시 데이터를 수집하여 고객 백엔드에서 자체 집계.

#### 6.2.3 알림 & 메시지 API

| Method | Endpoint | 설명 | Parameters | Response |
|--------|----------|------|-----------|----------|
| GET | `/api/notifications` | 알림 목록 | `?page=&size=&read=&type=` | `{ notifications: [...], total }` |
| PUT | `/api/notifications/:id/read` | 알림 읽음 처리 | - | `{ success }` |
| PUT | `/api/notifications/read-all` | 전체 읽음 처리 | - | `{ success }` |
| GET | `/api/notifications/unread-count` | 미읽음 수 | - | `{ count }` |
| GET | `/api/dm/messages` | DM 메시지 목록 | `?page=&size=` | `{ messages: [...], total }` |
| POST | `/api/dm/messages` | DM 메시지 발송 | `{ content }` | `{ id, content, createdAt }` |

#### 6.2.4 마이페이지 API

| Method | Endpoint | 설명 | Request | Response |
|--------|----------|------|---------|----------|
| GET | `/api/users/me` | 내 정보 조회 | - | `{ id, name, email, phone, businessName, role, createdAt }` |
| PUT | `/api/users/me` | 내 정보 수정 | `{ name, phone }` | `{ success }` |

#### 6.2.5 Webhook 수신 엔드포인트 (기기 측 콜백 수신용)

| Method | Endpoint | 설명 | 처리 |
|--------|----------|------|------|
| POST | `/api/webhooks/machine-status` | 자판기 상태 변경 수신 | 알림 저장 + WebSocket 푸시 |
| POST | `/api/webhooks/low-stock` | 재고 부족 수신 | 알림 저장 + WebSocket 푸시 |

#### 6.2.6 WebSocket 이벤트 (프론트엔드 ↔ BFF)

| 이벤트 | 방향 | 설명 | Payload |
|--------|------|------|---------|
| `machine:status` | Server → Client | 자판기 상태 변경 | `{ machineId, status, timestamp }` |
| `notification:new` | Server → Client | 새 알림 수신 | `{ id, title, body, type }` |
| `dm:new` | Server → Client | 새 DM 수신 | `{ id, content, sender, createdAt }` |
| `inventory:low` | Server → Client | 재고 부족 알림 | `{ machineId, slotNo, skuCode, stock }` |

---

## 7. 프로젝트 디렉토리 구조

```
VMMS/
├── public/
│   └── favicon.ico
├── src/
│   ├── api/
│   │   ├── client.ts                 # Axios 인스턴스 (JWT 인터셉터, API Key 주입)
│   │   ├── auth.ts                   # 인증 API
│   │   ├── machines.ts               # 자판기 관리 (기기 측 프록시)
│   │   ├── products.ts               # 상품 SKU 관리 (기기 측 프록시)
│   │   ├── slots.ts                  # 슬롯/재고 설정 (기기 측 프록시)
│   │   ├── sales.ts                  # 판매 데이터 (기기 측 프록시 + 자체 집계)
│   │   ├── ads.ts                    # 광고 LED 관리 (기기 측 프록시)
│   │   ├── promotions.ts             # 증정/프로모션 (기기 측 프록시)
│   │   ├── dashboard.ts              # 대시보드 집계 API
│   │   ├── notifications.ts          # 알림 API
│   │   └── dm.ts                     # DM API
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppShell.tsx
│   │   │   ├── BottomTabBar.tsx
│   │   │   └── Header.tsx
│   │   ├── ui/
│   │   │   ├── Badge.tsx
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── StatusBadge.tsx
│   │   │   ├── Tabs.tsx
│   │   │   └── FileUpload.tsx
│   │   └── charts/
│   │       ├── SalesLineChart.tsx
│   │       ├── SalesBarChart.tsx
│   │       └── ProductRankChart.tsx
│   │
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useMachines.ts
│   │   ├── useProducts.ts
│   │   ├── useSlots.ts
│   │   ├── useSales.ts
│   │   ├── useAds.ts
│   │   ├── usePromotions.ts
│   │   ├── useNotifications.ts
│   │   └── useWebSocket.ts
│   │
│   ├── pages/
│   │   ├── auth/
│   │   │   ├── LoginPage.tsx
│   │   │   ├── RegisterPage.tsx
│   │   │   └── RegisterStatusPage.tsx
│   │   ├── dashboard/
│   │   │   └── DashboardPage.tsx
│   │   ├── machines/
│   │   │   ├── MachineListPage.tsx
│   │   │   ├── MachineNewPage.tsx
│   │   │   └── MachineDetailPage.tsx
│   │   ├── products/
│   │   │   ├── ProductListPage.tsx
│   │   │   ├── ProductNewPage.tsx
│   │   │   ├── ProductDetailPage.tsx
│   │   │   └── CategoryPage.tsx
│   │   ├── inventory/
│   │   │   ├── InventoryPage.tsx
│   │   │   └── LowStockPage.tsx
│   │   ├── sales/
│   │   │   ├── SalesSummaryPage.tsx
│   │   │   ├── SalesDetailPage.tsx
│   │   │   └── SalesRankingPage.tsx
│   │   ├── ads/
│   │   │   ├── AdsListPage.tsx
│   │   │   ├── AdsNewPage.tsx
│   │   │   ├── AdsDetailPage.tsx
│   │   │   └── AdsSchedulePage.tsx
│   │   ├── promotions/
│   │   │   ├── PromotionListPage.tsx
│   │   │   └── PromotionNewPage.tsx
│   │   ├── orders/
│   │   │   └── OrderListPage.tsx
│   │   ├── messages/
│   │   │   ├── NoticesPage.tsx
│   │   │   └── DMPage.tsx
│   │   └── my/
│   │       ├── MyPage.tsx
│   │       └── SettingsPage.tsx
│   │
│   ├── store/
│   │   ├── authStore.ts
│   │   └── notificationStore.ts
│   │
│   ├── types/
│   │   ├── auth.ts
│   │   ├── machine.ts
│   │   ├── product.ts
│   │   ├── slot.ts
│   │   ├── sales.ts
│   │   ├── ads.ts
│   │   ├── promotion.ts
│   │   └── message.ts
│   │
│   ├── utils/
│   │   ├── format.ts
│   │   └── constants.ts
│   │
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
│
├── index.html
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── vite.config.ts
```

---

## 8. 화면별 와이어프레임 구성

### 8.1 대시보드 (`/dashboard`)
```
┌─────────────────────────────┐
│ VMMS              🔔(badge) │
├─────────────────────────────┤
│ ┌─────────────────────────┐ │
│ │ 누적매출 ₩0 │ 누적환불 ₩0│ │
│ │ [오늘][이번주][이번달]   │ │
│ │ 금일매출  금일주문 금일환불│ │
│ │ 전일매출  전일주문 전일환불│ │
│ └─────────────────────────┘ │
│                             │
│ 장비 현황                    │
│ [전체:N] [정상:N] [오프:N]   │
│                             │
│ 주요 기능                    │
│ ┌────┐ ┌────┐ ┌────┐       │
│ │상품 │ │재고 │ │자판기│      │
│ └────┘ └────┘ └────┘       │
│ ┌────┐ ┌────┐ ┌────┐       │
│ │광고 │ │순위 │ │증정 │      │
│ └────┘ └────┘ └────┘       │
│ ┌────┐ ┌────┐ ┌────┐       │
│ │주문 │ │알림 │ │설정 │      │
│ └────┘ └────┘ └────┘       │
├─────────────────────────────┤
│ 홈    자판기   메시지    MY  │
└─────────────────────────────┘
```

### 8.2 자판기 상세 - 슬롯 설정 탭
```
┌─────────────────────────────┐
│ ← 자판기A 상세               │
├─────────────────────────────┤
│ [기본정보] [슬롯설정] [재고] [매출]│
├─────────────────────────────┤
│ [일괄설정]          [비우기] │
│                             │
│ ┌─────────────────────────┐ │
│ │ 슬롯 #1                  │ │
│ │ SKU: 콜라 500ml          │ │
│ │ 재고: 15/20  임계값: 5   │ │
│ │ [수정]                   │ │
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ 슬롯 #2                  │ │
│ │ SKU: (미설정)             │ │
│ │ [설정]                   │ │
│ └─────────────────────────┘ │
├─────────────────────────────┤
│ 홈    자판기   메시지    MY  │
└─────────────────────────────┘
```

### 8.3 광고 재생 계획 설정
```
┌─────────────────────────────┐
│ ← 자판기A 광고 재생 계획      │
├─────────────────────────────┤
│ [+ 광고 추가]               │
│                             │
│ ┌─────────────────────────┐ │
│ │ ≡ 1. 봄 세일 영상         │ │
│ │   활성 ●  재생시간: 30초  │ │
│ │   시간대: 09:00~22:00    │ │
│ │   공휴일: 제외            │ │
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ ≡ 2. 신제품 홍보          │ │
│ │   비활성 ○  재생시간: 15초│ │
│ └─────────────────────────┘ │
│                             │
│ [저장]  [업데이트 트리거 ▶]  │
│                             │
│ 최종 업데이트: 성공 (3/10)   │
├─────────────────────────────┤
│ 홈    자판기   메시지    MY  │
└─────────────────────────────┘
```

---

## 9. 개발 단계 (Phase)

### Phase 1 - 기반 구축
- 프로젝트 초기 세팅 (Vite + React + TypeScript + Tailwind)
- 공용 UI 컴포넌트 개발
- 레이아웃 구성 (AppShell, BottomTabBar, Header)
- 라우팅 설정 및 인증 가드
- API 클라이언트 설정 (JWT 인터셉터, API Key 주입, 기기 측 프록시)

### Phase 2 - 인증 기능
- 로그인/회원가입/승인상태 페이지
- JWT 토큰 관리
- 역할 기반 접근 제어 (매입가 노출 등)

### Phase 3 - 자판기 관리 & 모니터링
- 자판기 CRUD (등록/수정/삭제/정지)
- 자판기 리스트 (상태 필터, 검색)
- 자판기 상세 (확장 정보 포함)
- 장비 현황 요약
- 상태 변경 콜백 수신 처리

### Phase 4 - 상품 SKU 관리
- SKU CRUD
- 카테고리 관리
- 자판기별 상품 목록 (권한별 매입가 제어)
- 상품 라이브러리 동기화

### Phase 5 - 슬롯 & 재고 관리
- 슬롯 상품 설정 (단건/일괄)
- 슬롯 비우기
- 재고 현황 표시
- 재고 부족 Webhook 콜백 등록 & 수신 처리

### Phase 6 - 판매 데이터 & 매출
- 판매 내역 조회 (필터링)
- 매출 통계 (기기 측 API 또는 자체 집계)
- 매출 추이 차트 (Recharts)
- 제품별 매출 순위

### Phase 7 - 광고 LED 관리 (신규)
- 광고 영상 업로드
- 광고 항목 CRUD
- 자판기별 재생 계획 설정 (순서, 시간대, 공휴일)
- 업데이트 트리거 & 상태 확인

### Phase 8 - 증정/프로모션 관리 (신규)
- 증정 규칙 CRUD
- 규칙 목록/상세 조회
- 주문 내 증정품 내역 표시

### Phase 9 - 대시보드
- 매출 요약 위젯
- 장비 현황 위젯
- 기능 바로가기 그리드 (확장된 기능 반영)

### Phase 10 - 알림 & 메시지
- Webhook 수신 엔드포인트 구축
- WebSocket 연결 (프론트 ↔ BFF)
- 알림 수신함 / DM 채팅
- 미읽음 배지

### Phase 11 - 마이페이지 & 마무리
- 마이페이지 / 설정
- 반응형 최적화 (320px ~ 768px)
- 에러 핸들링 & 로딩 상태
- 테스트 & QA

---

## 10. 기기 측 API 연동 시 주요 고려사항

| # | 항목 | 설명 | 대응 전략 |
|---|------|------|----------|
| 1 | **자판기 등록 API 미존재** | 현재 조회만 가능, 등록 불가 | 기기 측에 API 추가 요청 필요 |
| 2 | **확장 인터페이스 독립 제공** | 기존 인터페이스 수정 불가 시 별도 엔드포인트 | 두 가지 엔드포인트 모두 호출하여 병합 |
| 3 | **슬롯 쓰기 API 미존재** | 기존 슬롯 목록은 읽기 전용 | 기기 측에 쓰기 API 추가 요청 필요 |
| 4 | **판매 통계 API 선택 제공** | 기기 측에서 집계 데이터 미제공 가능 | 고객 백엔드에서 원시 판매 내역 기반 자체 집계 로직 구현 |
| 5 | **권한 기반 필드 제어** | 매입가 등 민감 필드는 역할별 노출 | API Key + Role 매핑, 요청 시 역할 정보 포함 |
| 6 | **상품 라이브러리 동기화** | 기기 측과 고객 백엔드 간 상품 데이터 일치 | 주기적 동기화 또는 이벤트 기반 동기화 구현 |
| 7 | **무선 네트워크 주소** | 자판기 자동 보고 또는 수동 관리 | 하트비트/상태 보고에 필드 추가 + 수동 입력 UI 제공 |
| 8 | **주문 증정품 자동 처리** | 기기 측 내부에서 자동 적용 | 주문 조회 시 증정품 내역을 별도 표시하는 UI 구현 |

---

## 11. 비기능 요구사항

| 항목 | 요구사항 |
|------|---------|
| **반응형** | 320px ~ 768px (모바일 우선), 태블릿/데스크톱 대응 |
| **성능** | 초기 로딩 3초 이내, API 응답 후 렌더링 300ms 이내 |
| **보안** | JWT + API Key 인증, HTTPS 필수, XSS/CSRF 방어, 역할별 데이터 필터링 |
| **접근성** | 최소 WCAG 2.1 AA 수준 |
| **브라우저** | Chrome, Safari(iOS), Samsung Internet 최신 2버전 |
| **오프라인** | 네트워크 오류 시 안내 메시지 표시, 재시도 로직 |
| **파일 업로드** | 광고 영상 MP4 업로드 지원, 업로드 진행률 표시 |

---

## 12. 참고: 주요 데이터 모델

```typescript
// 자판기
interface Machine {
  id: string;
  fixedId: string;
  name: string;
  installLocation: string;
  detailAddress: string;
  gpsCoordinates: { lat: number; lng: number };
  wirelessNetworkAddress?: string;
  status: 'NORMAL' | 'OFFLINE' | 'MAINTENANCE';
  registeredAt: string;
}

// 상품 SKU
interface ProductSKU {
  skuCode: string;
  name: string;
  category: string;
  costPrice?: number;       // 매입가 (관리자 전용, 역할별 노출)
  sellingPrice: number;
  status: string;
  barcodeUrl: string;
}

// 슬롯
interface Slot {
  slotNo: number;
  skuCode: string | null;
  productName: string | null;
  initialStock: number;
  currentStock: number;
  minStockThreshold: number;
}

// 판매 기록
interface SalesRecord {
  saleTime: string;
  machineId: string;
  skuCode: string;
  sellingPrice: number;
  quantity: number;
  orderNumber: string;
}

// 매출 요약
interface SalesSummary {
  totalIncome: number;
  totalRefund: number;
  todaySales: number;
  todayOrders: number;
  todayRefund: number;
  yesterdaySales: number;
  yesterdayOrders: number;
  yesterdayRefund: number;
}

// 광고
interface Advertisement {
  id: string;
  name: string;
  fileType: string;
  videoUrl: string;
  duration: number;
  status: 'ACTIVE' | 'INACTIVE';
}

// 광고 재생 계획
interface AdsScheduleItem {
  adId: string;
  order: number;
  enabled: boolean;
  dailyTimeSlot: { start: string; end: string };
  holidays: string[];
}

// 증정 규칙
interface PromotionRule {
  id: string;
  mainProductSku: string;
  giftProductSku: string;
  startTime: string;
  endTime: string;
  purchaseCondition: number;  // 구매 수량 조건
  giftQuantity: number;
}

// 알림
interface Notification {
  id: string;
  title: string;
  body: string;
  type: 'SYSTEM' | 'ADMIN' | 'LOW_STOCK' | 'MACHINE_STATUS';
  read: boolean;
  createdAt: string;
}

// DM 메시지
interface DMMessage {
  id: string;
  content: string;
  sender: 'USER' | 'ADMIN';
  createdAt: string;
}
```
