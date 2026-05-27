# VMMS API 연동 작업계획서

## 鑫之源(Xinzhiyuan) 자판기 플랫폼 API 분석 및 개발 계획

> **문서 이력**
> | 버전 | 날짜 | 변경 내용 |
> |------|------|---------|
> | v1.0 | 2026-05-26 | 최초 작성 (API 문서 분석 기반) |
> | v1.1 | 2026-05-26 | 鑫之源 회신 반영 — 크리덴셜 확보, 환경 제약사항 업데이트 |

---

## 0. 연동 크리덴셜 현황 (2026-05-26 회신 확보)

> 📬 **회신 출처**: 鑫之源 담당자 (不想起名字), 2026-05-26 16:39~16:42
> **회신 방식**: 요청 문서(鑫之源_对接信息申请.docx)에 Word 댓글(Comment)로 회신

### ✅ REST API 인증 정보

| 항목 | 값 | 비고 |
|------|---|------|
| **appId** (운영상 ID) | `245` | 商户管理 → 商户列表에서도 확인 가능 |
| **API Key** (MD5 서명 키) | `AE802B9283894398BD695D2AA63C375F` | 32자 MD5 형식 |

### ✅ AMQP 메시지 큐 접속 정보

| 항목 | 값 | 비고 |
|------|---|------|
| **서버 주소** | `47.238.121.18` | 포트 미기재 → 기본 5672 사용 |
| **계정** | `ko_user` | |
| **비밀번호** | `Aa123456` | |
| **Virtual Host** | 지정 없음 → 기본값 `/` | |
| **접속 URL** | `amqp://ko_user:Aa123456@47.238.121.18:5672/` | 조합 완료 |

### ✅ 운영 환경 조건 확인

| 확인 항목 | 회신 내용 | 영향 |
|----------|---------|------|
| **테스트 환경** | ❌ 없음 (운영 환경만 존재) | 개발 시 Mock 데이터 병행 필요 |
| **MQ 테스트** | 설비 번호 제출 필요 | 자판기 생산 완료 후 가능 |
| **자판기 현황** | ⏳ 현재 생산 중 | 생산 완료 → 제조사 플랫폼 바인딩 → 설비 코드 확인 |
| **API 호출 제한** | 없음 (无限制) | QPS/QPM 리밋 없이 자유 호출 |
| **IP 화이트리스트** | 불필요 (无) | 별도 IP 등록 없이 접속 가능 |

---

## 1. API 문서 분석 요약

### 1.1 플랫폼 정보

| 항목 | 내용 |
|------|------|
| **플랫폼** | 鑫之源全球无人自助平台 (Xinzhiyuan Global Unattended Self-service Platform) |
| **API 버전** | V1.1 (설비/상품/화도 관리) + V1.2 (사용자/조직/매출 통계) |
| **통신 프로토콜** | HTTP POST (`application/x-www-form-urlencoded`) |
| **인증 방식** | MD5 서명 (파라미터 ASCII 정렬 → URL 인코딩 → 키 append → MD5 대문자) |
| **메시지 큐** | AMQP 0-9-1 (RabbitMQ 기반 추정) |

### 1.2 API Base URL

| 버전 | Base URL | 용도 |
|------|----------|------|
| **V1.1** | `http://api.xzyvend.com/remotingData/{method}` | 설비, 상품, 화도(슬롯) 관리 |
| **V1.2** | `http://api.xzyvend.com/remotingCust/{method}` | 사용자, 부서(운영상), 매출 통계 |

### 1.3 인증 서명 생성 규칙

```
1. 비어있지 않은 파라미터를 ASCII 오름차순 정렬
2. key1=value1&key2=value2 형태로 연결 → stringA
3. stringA + "&key={플랫폼 할당 키}" → stringSignTemp
4. MD5(stringSignTemp).toUpperCase() → signValue

* sign 파라미터 자체는 서명 계산에 포함하지 않음
* null/빈 문자열 파라미터는 서명에 포함하지 않음
* 파라미터명은 대소문자 구분
```

---

## 2. 제공 API 전체 목록

### 2.1 REST API (10개 엔드포인트)

| # | 버전 | 엔드포인트 | 기능 | 읽기/쓰기 | VMMS 매핑 |
|---|------|----------|------|---------|----------|
| 1 | V1.1 | `getFunByDept` | 부서별 전체 설비 목록 조회 | 읽기 | 자판기 리스트 |
| 2 | V1.1 | `getFunById` | 단일 설비 상세 조회 | 읽기 | 자판기 상세 |
| 3 | V1.1 | `getRoodById` | 설비별 화도(슬롯) 정보 조회 | 읽기 | 슬롯/재고 현황 |
| 4 | V1.1 | `getGoodsById` | 상품 정보 페이징 조회 | 읽기 | 상품 목록 |
| 5 | V1.2 | `getUserInfo` | 사용자 정보 조회 (필터 지원) | 읽기 | 사용자 관리 |
| 6 | V1.2 | `addUserInfo` | 사용자 추가 (배치) | 쓰기 | 사용자 등록 |
| 7 | V1.2 | `getDeptInfo` | 부서/운영상 조직 조회 | 읽기 | 부서 관리 |
| 8 | V1.2 | `addDeptInfo` | 부서/운영상 추가 | 쓰기 | 부서 추가 |
| 9 | V1.2 | `countInfo` | 매출 통계 (다차원) | 읽기 | 매출 현황 |

### 2.2 메시지 큐 (AMQP, 3개 큐)

| # | 큐 이름 | 용도 | 트리거 조건 | VMMS 매핑 |
|---|--------|------|----------|----------|
| 1 | `ko_fun_inventory_queue` | 재고 부족 알림 | 화도 재고 < 예경값(funWaring) | 재고 부족 알림 |
| 2 | `ko_fun_queue` | 설비 상태 변경 | 상태/온라인 변경 시 | 설비 상태 모니터링 |
| 3 | `ko_fun_stock` | 보충 완료 통지 | 보충 작업 완료 후 | 재고 갱신 |

---

## 3. 개발계획서 대비 GAP 분석

### 3.1 제공되는 기능 (구현 가능)

| 개발계획서 기능 | 대응 API | 비고 |
|-------------|---------|------|
| 자판기 리스트 조회 | `getFunByDept` | 부서 단위 전체 조회 |
| 자판기 상세 조회 | `getFunById` | GPS, IMEI, 온도, 버전 등 상세 |
| 슬롯/재고 현황 조회 | `getRoodById` | 화도별 재고량, 용량, 상품 매핑 |
| 상품 SKU 목록 조회 | `getGoodsById` | 페이징, 설비별 필터 지원 |
| 매출 통계 | `countInfo` | 일/주/월/년/상품별 다차원 집계 |
| 사용자 관리 | `getUserInfo` + `addUserInfo` | 조회(필터) + 배치 추가 |
| 부서/조직 관리 | `getDeptInfo` + `addDeptInfo` | 트리 구조, 부모-자식 관계 |
| 재고 부족 알림 | `ko_fun_inventory_queue` | AMQP 메시지 수신 |
| 설비 상태 모니터링 | `ko_fun_queue` | 실시간 상태 + 온라인 상태 |
| 보충 완료 동기화 | `ko_fun_stock` | 화도별 최신 재고 동기화 |

### 3.2 미제공 기능 (⚠️ API 없음)

| 개발계획서 기능 | 예상 API | 현재 상태 | 대응 방안 |
|-------------|---------|---------|---------|
| 자판기 등록/수정/삭제 | POST/PUT/DELETE machines | ❌ 미제공 | 플랫폼 관리자 화면에서 직접 처리, VMMS는 읽기 전용 |
| 상품 SKU CRUD | POST/PUT/DELETE products | ❌ 미제공 | 플랫폼에서 관리, VMMS는 조회만 |
| 슬롯 상품 설정/변경 | PUT slots | ❌ 미제공 | 플랫폼에서 관리, VMMS는 조회만 |
| 광고 LED 관리 | ads CRUD + 재생 계획 | ❌ 미제공 | 향후 API 추가 시 대응, 현재 제외 |
| 증정/프로모션 규칙 | promotions CRUD | ❌ 미제공 | 향후 API 추가 시 대응, 현재 제외 |
| 주문 내역 조회 | orders query | ❌ 미제공 | `countInfo`로 매출 통계 대체 |
| 카테고리 관리 | categories CRUD | ❌ 미제공 | 상품 조회 시 goodsTypeName으로 대체 |

### 3.3 차이점 정리

| 항목 | 개발계획서 예상 | 실제 API |
|------|-------------|---------|
| **설비 관리** | CRUD 전체 | 읽기 전용(R) |
| **상품 관리** | CRUD 전체 | 읽기 전용(R) |
| **슬롯 관리** | 읽기+쓰기 | 읽기 전용(R) |
| **알림 수신** | HTTP Webhook 콜백 | AMQP 메시지 큐 |
| **인증 방식** | JWT + API Key | MD5 서명 (appId + key) |
| **요청 형식** | JSON (RESTful) | x-www-form-urlencoded (POST only) |
| **매출 통계** | 자체 집계 예상 | 플랫폼 제공 (countInfo) |
| **사용자/조직** | 자체 BFF 관리 | 플랫폼 API 제공 (V1.2) |

---

## 4. 수정된 시스템 아키텍처

```
┌──────────────────────────────────────────────────────────────────┐
│                    VMMS 시스템 아키텍처 (수정)                       │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐                                                │
│  │  VMMS 프론트   │  React 18 + TypeScript + Vite                 │
│  │  (모바일 웹)   │  Tailwind CSS + Zustand + TanStack Query      │
│  └──────┬───────┘                                                │
│         │ REST API + WebSocket                                   │
│  ┌──────▼───────┐                                                │
│  │  VMMS 백엔드   │  Node.js (Express/Fastify)                    │
│  │  (BFF 서버)   │                                                │
│  │              │                                                │
│  │  ┌──────────┐│  ┌────────────────────────────────────────┐    │
│  │  │ API 프록시 ├┼─▶│  鑫之源 REST API                        │    │
│  │  │ (서명생성)  ││  │  V1.1: remotingData/ (설비/상품/화도)    │    │
│  │  └──────────┘│  │  V1.2: remotingCust/ (사용자/부서/매출)   │    │
│  │              │  └────────────────────────────────────────┘    │
│  │  ┌──────────┐│  ┌────────────────────────────────────────┐    │
│  │  │ MQ 소비자  ├┼─▶│  鑫之源 AMQP 메시지 큐                    │    │
│  │  │ (AMQP)   ││  │  ko_fun_inventory_queue (재고 부족)      │    │
│  │  └──────────┘│  │  ko_fun_queue (설비 상태)                │    │
│  │              │  │  ko_fun_stock (보충 완료)                │    │
│  │  ┌──────────┐│  └────────────────────────────────────────┘    │
│  │  │ 자체 DB   ││                                                │
│  │  │ (알림/DM  ││  ← 알림 저장, DM, 사용자 세션, 캐시              │
│  │  │  세션/캐시) ││                                                │
│  │  └──────────┘│                                                │
│  └──────────────┘                                                │
└──────────────────────────────────────────────────────────────────┘
```

---

## 5. 개발 작업 목록 (Phase별)

### Phase 1: 프로젝트 기반 구축 (1주)

#### 1-1. 프론트엔드 프로젝트 초기화
| 작업 | 파일 | 설명 |
|------|------|------|
| Vite + React + TS 설정 | `vite.config.ts`, `tsconfig.json` | React 18, TypeScript 5, 경로 alias |
| Tailwind CSS 설정 | `tailwind.config.js`, `src/index.css` | 모바일 퍼스트 디자인 시스템 |
| 패키지 설치 | `package.json` | zustand, @tanstack/react-query, react-router-dom, recharts, axios, amqplib |
| 라우터 설정 | `src/App.tsx` | React Router v6 전체 라우팅 |

#### 1-2. 백엔드 BFF 서버 구축
| 작업 | 파일 | 설명 |
|------|------|------|
| Express 서버 | `server/index.ts` | BFF 서버 설정, CORS, 미들웨어 |
| MD5 서명 모듈 | `server/lib/sign.ts` | 鑫之源 API 서명 생성 유틸리티 |
| API 프록시 기반 | `server/lib/xzyClient.ts` | x-www-form-urlencoded POST 클라이언트 |
| 환경 변수 | `.env` | `XZY_APP_ID`, `XZY_API_KEY`, `XZY_AMQP_URL` |

#### 1-3. TypeScript 타입 정의
| 작업 | 파일 | 설명 |
|------|------|------|
| 설비 타입 | `src/types/machine.ts` | `Machine`, `MachineDetail` (getFunByDept/getFunById 응답 매핑) |
| 상품 타입 | `src/types/product.ts` | `Product`, `ProductPage` (getGoodsById 응답 매핑) |
| 슬롯 타입 | `src/types/slot.ts` | `Road`, `RoadInfo` (getRoodById 응답 매핑) |
| 매출 타입 | `src/types/sales.ts` | `SalesStat`, `CountInfoParams` (countInfo 응답 매핑) |
| 사용자 타입 | `src/types/auth.ts` | `UserVO`, `UserCreateDTO` (getUserInfo/addUserInfo 매핑) |
| 부서 타입 | `src/types/dept.ts` *(신규)* | `DeptVO`, `DeptCreateDTO` (getDeptInfo/addDeptInfo 매핑) |
| 메시지 큐 타입 | `src/types/message.ts` | `InventoryAlert`, `DeviceStatus`, `StockUpdate` (MQ 메시지 매핑) |

---

### Phase 2: 鑫之源 API 연동 계층 (1주)

#### 2-1. 백엔드 API 프록시 구현

| 작업 | 서버 라우트 | 鑫之源 API | 설명 |
|------|----------|----------|------|
| 설비 전체 조회 | `GET /api/machines` | `remotingData/getFunByDept` | appId 기반 전체 설비 |
| 설비 상세 조회 | `GET /api/machines/:funId` | `remotingData/getFunById` | GPS, IMEI, 온도 포함 |
| 화도(슬롯) 조회 | `GET /api/machines/:funId/roads` | `remotingData/getRoodById` | 화도별 재고/용량/상품 |
| 상품 목록 조회 | `GET /api/products` | `remotingData/getGoodsById` | 페이징, 설비별 필터 |
| 사용자 조회 | `GET /api/users` | `remotingCust/getUserInfo` | 계정/전화/부서/상태 필터 |
| 사용자 추가 | `POST /api/users` | `remotingCust/addUserInfo` | 배치 사용자 등록 |
| 부서 조회 | `GET /api/departments` | `remotingCust/getDeptInfo` | 조직 트리 구조 |
| 부서 추가 | `POST /api/departments` | `remotingCust/addDeptInfo` | 하위 부서 생성 |
| 매출 통계 | `GET /api/sales/stats` | `remotingCust/countInfo` | 일/주/월/년/상품 차원 |

#### 2-2. MD5 서명 생성 모듈 상세

```typescript
// server/lib/sign.ts 구현 사양
interface SignParams {
  [key: string]: string | number | undefined;
}

function generateSign(params: SignParams, apiKey: string): string {
  // 1. null/빈 문자열 제거, sign 파라미터 제외
  // 2. 파라미터명 ASCII 오름차순 정렬
  // 3. key1=value1&key2=value2 형태로 연결
  // 4. 끝에 &key={apiKey} 추가
  // 5. MD5 해시 → 대문자 변환
}
```

#### 2-3. AMQP 메시지 큐 소비자 구현

| 작업 | 큐 이름 | 처리 로직 |
|------|--------|---------|
| 재고 부족 소비자 | `ko_fun_inventory_queue` | 메시지 수신 → DB 저장 → WebSocket 푸시 |
| 설비 상태 소비자 | `ko_fun_queue` | 메시지 수신 → 상태 갱신 → WebSocket 푸시 |
| 보충 완료 소비자 | `ko_fun_stock` | 메시지 수신 → 재고 갱신 → WebSocket 푸시 |

```typescript
// server/mq/consumer.ts 구현 사양
// AMQP 0-9-1 프로토콜, amqplib 사용
// 각 큐별 consumer 등록
// JSON 파싱 → 타입 검증 → 비즈니스 처리
// 연결 끊김 시 자동 재연결 로직
```

---

### Phase 3: 프론트엔드 공통 컴포넌트 (1주)

#### 3-1. 레이아웃 컴포넌트

| 컴포넌트 | 파일 | 설명 |
|---------|------|------|
| AppShell | `components/layout/AppShell.tsx` | 모바일 앱 셸 (헤더 + 콘텐츠 + 하단탭) |
| Header | `components/layout/Header.tsx` | 상단 바 (타이틀, 뒤로가기, 알림 아이콘) |
| BottomTabBar | `components/layout/BottomTabBar.tsx` | 하단 4탭 (홈/자판기/메시지/MY) |

#### 3-2. UI 컴포넌트

| 컴포넌트 | 파일 | 설명 |
|---------|------|------|
| Button | `components/ui/Button.tsx` | primary/secondary/danger 변형 |
| Card | `components/ui/Card.tsx` | 정보 카드, 통계 카드 |
| Badge | `components/ui/Badge.tsx` | 숫자 뱃지, 알림 카운트 |
| StatusBadge | `components/ui/StatusBadge.tsx` | 설비 상태 (정상/고장/정지/온라인/오프라인) |
| Input | `components/ui/Input.tsx` | 텍스트, 검색, 숫자 입력 |
| Modal | `components/ui/Modal.tsx` | 바텀시트 모달 (모바일 최적화) |
| Tabs | `components/ui/Tabs.tsx` | 탭 전환 컴포넌트 |

#### 3-3. 차트 컴포넌트

| 컴포넌트 | 파일 | 설명 |
|---------|------|------|
| SalesLineChart | `components/charts/SalesLineChart.tsx` | 매출 추이 라인 차트 |
| SalesBarChart | `components/charts/SalesBarChart.tsx` | 기간별 매출 바 차트 |
| ProductRankChart | `components/charts/ProductRankChart.tsx` | 상품별 매출 순위 |

---

### Phase 4: 핵심 페이지 구현 (2주)

#### 4-1. 인증 영역

| 페이지 | 파일 | API 연동 | 설명 |
|--------|------|---------|------|
| 로그인 | `pages/auth/LoginPage.tsx` | 자체 BFF 인증 | ID/PW 로그인 → JWT 발급 |
| 매장관리자 신청 | `pages/auth/RegisterPage.tsx` | 자체 BFF + `addUserInfo` | 신청 → 플랫폼 사용자 등록 연계 |
| 승인 상태 확인 | `pages/auth/RegisterStatusPage.tsx` | 자체 BFF | 대기/승인/반려 확인 |

#### 4-2. 대시보드

| 페이지 | 파일 | API 연동 | 설명 |
|--------|------|---------|------|
| 대시보드 | `pages/dashboard/DashboardPage.tsx` | `getFunByDept` + `countInfo` + MQ상태 | 매출 요약, 설비 현황, 알림 |

**대시보드 표시 항목:**
- 오늘/이번주/이번달 매출 (countInfo: statType=day/week/month)
- 설비 현황 카드 (getFunByDept → 상태별 집계: 정상/고장/정지/온라인/오프라인)
- 최근 알림 목록 (MQ 수신 데이터 기반)
- 매출 추이 차트 (countInfo 기반)

#### 4-3. 자판기(설비) 관리

| 페이지 | 파일 | API 연동 | 설명 |
|--------|------|---------|------|
| 설비 리스트 | `pages/machines/MachineListPage.tsx` | `getFunByDept` | 전체 설비 목록 + 상태 필터 |
| 설비 상세 | `pages/machines/MachineDetailPage.tsx` | `getFunById` + `getRoodById` | 상세정보 탭 + 슬롯현황 탭 + 재고 탭 |

**설비 상세 탭 구성:**
- **기본정보 탭**: 설비명, 주소, GPS, IMEI, IP, 온도, 버전, 잠금/출화방식/환불 설정 (읽기 전용)
- **슬롯현황 탭**: 화도 그리드 뷰 (행×열), 각 화도의 상품/재고/용량 표시
- **재고현황 탭**: 화도별 재고율 바 차트, 재고 부족 화도 하이라이트

#### 4-4. 상품 관리

| 페이지 | 파일 | API 연동 | 설명 |
|--------|------|---------|------|
| 상품 목록 | `pages/products/ProductListPage.tsx` | `getGoodsById` | 페이징 목록, 설비별 필터 |
| 상품 상세 | `pages/products/ProductDetailPage.tsx` | `getGoodsById` | 상품 이미지, SKU, 가격, 보질기 정보 (읽기 전용) |

**상품 데이터 매핑:**
- 상품명: `goodsName`
- 이미지: `fileUrl` (주이미지), `fileCopyUrl` (부이미지)
- 카테고리: `goodsTypeName`
- 진화가(매입가): `oldBuyingPrice` (분 단위 → 원 변환)
- 판매가: `oldGoodsPrice` (분 단위 → 원 변환)
- SKU: `skuCode`, `skuName`
- 상태: `isList` (0:미상장, 1:상장)

#### 4-5. 매출 현황

| 페이지 | 파일 | API 연동 | 설명 |
|--------|------|---------|------|
| 매출 요약 | `pages/sales/SalesSummaryPage.tsx` | `countInfo` (day/week/month) | 기간별 매출 통계 |
| 매출 순위 | `pages/sales/SalesRankingPage.tsx` | `countInfo` (statType=goods) | 상품별 매출 순위 |

**countInfo 매출 데이터 매핑:**
- `orderMoney`: 주문 금액 (분 단위)
- `totalOrderMoney`: 총 성사 금액 (분 단위)
- `decTotalOrderMoney`: 총 성사 금액 (원 단위, /100 변환 완료)
- `totalOrderNumber`: 총 주문 건수
- `goodsId` + `fileUrl`: 상품별 통계 시 상품 식별

#### 4-6. 재고 관리

| 페이지 | 파일 | API 연동 | 설명 |
|--------|------|---------|------|
| 전체 재고 현황 | `pages/inventory/InventoryPage.tsx` | `getFunByDept` + `getRoodById` | 설비별 전체 재고 현황 |
| 재고 부족 목록 | `pages/inventory/LowStockPage.tsx` | MQ `ko_fun_inventory_queue` | 재고 부족 알림 목록 |

#### 4-7. 메시지

| 페이지 | 파일 | API 연동 | 설명 |
|--------|------|---------|------|
| 알림 메시지 | `pages/messages/NoticesPage.tsx` | 자체 DB (MQ 수신 데이터) | 재고 부족/설비 상태 알림 |
| DM 메시지 | `pages/messages/DMPage.tsx` | 자체 BFF | 관리자 1:1 메시지 |

#### 4-8. 마이페이지

| 페이지 | 파일 | API 연동 | 설명 |
|--------|------|---------|------|
| 내 정보 | `pages/my/MyPage.tsx` | `getUserInfo` + 자체 BFF | 계정 정보, 소속 부서 |
| 설정 | `pages/my/SettingsPage.tsx` | 자체 BFF | 알림 설정, 로그아웃 |

---

### Phase 5: 실시간 기능 구현 (1주)

#### 5-1. WebSocket 서버 (BFF)

```
BFF WebSocket 이벤트:
├── device:status      ← ko_fun_queue 수신 → 클라이언트 푸시
├── inventory:alert    ← ko_fun_inventory_queue 수신 → 클라이언트 푸시
├── stock:updated      ← ko_fun_stock 수신 → 클라이언트 푸시
├── notification:new   ← 새 알림 생성 시 → 클라이언트 푸시
└── dm:new             ← 새 DM 수신 시 → 클라이언트 푸시
```

#### 5-2. 프론트엔드 WebSocket 훅

| 훅 | 파일 | 기능 |
|------|------|------|
| useWebSocket | `hooks/useWebSocket.ts` | WS 연결 관리, 자동 재연결, 이벤트 구독 |
| useNotifications | `hooks/useNotifications.ts` | 알림 상태 관리, 미읽음 카운트 |

---

### Phase 6: 테스트 및 배포 (1주)

#### 6-1. API 연동 테스트
- MD5 서명 생성 검증
- 각 API 엔드포인트 호출 테스트
- AMQP 메시지 수신 테스트
- 에러 핸들링 (네트워크 오류, 서명 실패, 인증 만료)

#### 6-2. 배포
- Docker 컨테이너화 (프론트 + BFF)
- Nginx 리버스 프록시 설정
- AMQP 연결 정보 환경 변수 관리

---

## 6. 핵심 데이터 매핑 테이블

### 6.1 설비 상태 코드 매핑

| 鑫之源 필드 | 값 | VMMS 표시 | 색상 |
|----------|---|---------|------|
| `funStatus=1` + `lineStatus=0` | 정상+온라인 | 🟢 정상 운영 | green |
| `funStatus=1` + `lineStatus=1` | 정상+오프라인 | 🟡 네트워크 이상 | yellow |
| `funStatus=2` + `lineStatus=0` | 고장+온라인 | 🔴 설비 고장 | red |
| `funStatus=2` + `lineStatus=1` | 고장+오프라인 | 🔴 설비 고장(오프라인) | red |
| `funStatus=3` | 정지 | ⚫ 운영 정지 | gray |

> **주의**: 메시지 큐(ko_fun_queue)의 funStatus 값(1:정상, 2:고장, 3:정지)과 REST API(getFunById)의 funStatus 값(0:온라인, 1:오프라인)이 다름. 매핑 시 주의 필요.

### 6.2 금액 단위 변환

| API | 필드 | 단위 | VMMS 변환 |
|-----|------|------|---------|
| `countInfo` | `orderMoney` | 분(分, 1/100원) | ÷ 100 → 원(元) 표시 |
| `countInfo` | `totalOrderMoney` | 분(分) | ÷ 100 → 원(元) 표시 |
| `countInfo` | `decTotalOrderMoney` | 원(元) | 변환 불필요 |
| `getGoodsById` | `oldBuyingPrice` | 원(元, 미환산) | 그대로 표시 |
| `getGoodsById` | `oldGoodsPrice` | 원(元, 미환산) | 그대로 표시 |

### 6.3 시간 형식

| 소스 | 형식 | 예시 | 변환 |
|------|------|------|------|
| 鑫之源 REST API | Unix 밀리초 | `1779338880255` | `new Date(ts)` → 로컬 포맷 |
| 鑫之源 MQ 메시지 | Unix 밀리초 | `1779339970101` | 동일 |

---

## 7. 필요 환경 변수

```env
# 鑫之源 플랫폼 연동 (2026-05-26 확보 완료)
XZY_APP_ID=245
XZY_API_KEY=AE802B9283894398BD695D2AA63C375F
XZY_API_BASE_V11=http://api.xzyvend.com/remotingData
XZY_API_BASE_V12=http://api.xzyvend.com/remotingCust

# AMQP 메시지 큐 (2026-05-26 확보 완료)
XZY_AMQP_URL=amqp://ko_user:Aa123456@47.238.121.18:5672/
XZY_AMQP_INVENTORY_QUEUE=ko_fun_inventory_queue
XZY_AMQP_STATUS_QUEUE=ko_fun_queue
XZY_AMQP_STOCK_QUEUE=ko_fun_stock

# BFF 서버
BFF_PORT=4000
JWT_SECRET=
DATABASE_URL=

# 프론트엔드
VITE_API_BASE_URL=http://localhost:4000/api
VITE_WS_URL=ws://localhost:4000
```

---

## 8. 개발 일정 요약

| Phase | 기간 | 주요 작업 | 산출물 |
|-------|------|---------|--------|
| **Phase 1** | 1주 | 프로젝트 초기화, BFF 서버 기반, 타입 정의 | 실행 가능한 빈 프로젝트 |
| **Phase 2** | 1주 | 鑫之源 API 프록시 9개 + AMQP 소비자 3개 | API 연동 계층 완성 |
| **Phase 3** | 1주 | 공통 UI 컴포넌트 (레이아웃/UI/차트) | 디자인 시스템 완성 |
| **Phase 4** | 2주 | 핵심 페이지 18개 구현 | 전체 화면 완성 |
| **Phase 5** | 1주 | WebSocket 실시간 + 알림 시스템 | 실시간 기능 완성 |
| **Phase 6** | 1주 | 테스트, 배포, 문서화 | 프로덕션 배포 |
| **합계** | **7주** | | |

---

## 9. 개발 우선순위 (추천)

### 🔴 최우선 (Week 1-2)
1. MD5 서명 모듈 구현 + API 연결 검증
2. `getFunByDept` → 설비 리스트 페이지
3. `getFunById` + `getRoodById` → 설비 상세 + 슬롯 현황
4. `countInfo` → 대시보드 매출 요약

### 🟡 높음 (Week 3-4)
5. AMQP 소비자 구현 (3개 큐)
6. `getGoodsById` → 상품 목록
7. 매출 통계 페이지 (일/주/월/상품)
8. 재고 현황 + 재고 부족 알림

### 🟢 보통 (Week 5-6)
9. 사용자/부서 관리 (`getUserInfo`, `addUserInfo`, `getDeptInfo`, `addDeptInfo`)
10. WebSocket 실시간 알림
11. DM 메시지
12. 마이페이지

### ⚪ 향후 (API 추가 시)
13. 광고 LED 관리
14. 증정/프로모션 관리
15. 설비 등록/수정 (쓰기 API 제공 시)
16. 상품/슬롯 설정 (쓰기 API 제공 시)

---

## 10. 리스크 및 확인 사항

| # | 항목 | 리스크 | 현재 상태 | 필요 조치 |
|---|------|-------|---------|---------|
| 1 | **appId / API Key** | 연동 키가 없으면 API 호출 불가 | ✅ **해결** (appId: 245, Key 확보) | — |
| 2 | **AMQP 접속 정보** | 큐 서버 주소/계정 미확인 | ✅ **해결** (47.238.121.18, ko_user) | — |
| 3 | **테스트 환경 부재** | 별도 테스트 환경 없음, 운영만 존재 | ⚠️ **확인됨** | Mock 데이터 기반 개발, 신중한 API 호출 |
| 4 | **자판기 미생산** | 실물 설비 없어 MQ 메시지 수신 불가 | ⏳ **대기** | 생산 완료 → 설비 코드 확보 → MQ 테스트 |
| 5 | **funStatus 코드 불일치** | MQ(1/2/3)와 REST(0/1) 값이 다름 | ⚠️ **주의** | 양쪽 매핑 테이블 확인 후 통합 처리 |
| 6 | **금액 단위** | 분(分)/원(元) 혼재 | ⚠️ **주의** | 프론트엔드 표시 시 일괄 원(元) 변환 |
| 7 | **쓰기 API 부재** | 설비/상품/슬롯 CUD 불가 | ⚠️ **확인** | 읽기 전용 개발, 향후 API 추가 대비 인터페이스 설계 |
| 8 | **HTTP (비암호화)** | API URL이 http:// | ⚠️ **주의** | 프로덕션 시 HTTPS 전환 또는 VPN 터널 필요 |

---

## 11. 즉시 착수 가능 여부 판단

### ✅ 즉시 가능

| 작업 | 근거 |
|------|------|
| MD5 서명 모듈 구현 + 검증 | appId(245) + Key 확보 |
| REST API 호출 테스트 | `getFunByDept`, `getFunById`, `getGoodsById`, `countInfo` 등 |
| AMQP 연결 테스트 (접속 확인) | 서버주소 + 계정 확보 |
| 프론트엔드 전체 개발 | API 응답 구조 기반 Mock 데이터 활용 |
| 사용자/부서 관리 기능 | `getUserInfo`, `addUserInfo`, `getDeptInfo`, `addDeptInfo` |

### ⏳ 자판기 생산 완료 후

| 작업 | 대기 조건 |
|------|---------|
| 실제 설비 데이터 확인 | 제조사 플랫폼 바인딩 후 설비 코드 발급 |
| MQ 메시지 수신 테스트 | 설비 번호를 鑫之源에 제출 |
| 재고 부족 / 설비 상태 알림 실측 | 실물 자판기 동작 필요 |

---

*작성일: 2026-05-26*
*최종 수정: 2026-05-26 (v1.1 — 鑫之源 회신 반영)*
*기반 문서: 鑫之源全球无人自助平台接口文档 (V1.1+V1.2), 消息队列对接文档 (V1.0)*
*회신 문서: 鑫之源_对接信息申请_回复-1.docx (2026-05-26)*
