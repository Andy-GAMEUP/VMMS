import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { useAuthStore } from '@/store/authStore';
import { useRealtimeAlerts } from '@/hooks/useWebSocket';
import { useEffect } from 'react';

// Pages — lazy loaded
import { lazy, Suspense } from 'react';

const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'));
const RegisterStatusPage = lazy(() => import('@/pages/auth/RegisterStatusPage'));

const DashboardPage = lazy(() => import('@/pages/dashboard/DashboardPage'));
const MachineListPage = lazy(() => import('@/pages/machines/MachineListPage'));
const MachineDetailPage = lazy(() => import('@/pages/machines/MachineDetailPage'));
const NoticesPage = lazy(() => import('@/pages/messages/NoticesPage'));
const MyPage = lazy(() => import('@/pages/my/MyPage'));
const SalesSummaryPage = lazy(() => import('@/pages/sales/SalesSummaryPage'));

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

/** 인증 필요 라우트 가드 — AppShell + SSE 연결 포함 */
function ProtectedLayout() {
  const { isAuthenticated, isLoading } = useAuthStore();

  // 인증된 상태에서 SSE 실시간 알림 연결
  useRealtimeAlerts();

  if (isLoading) return <PageLoader />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return (
    <AppShell>
      <Suspense fallback={<PageLoader />}>
        <Outlet />
      </Suspense>
    </AppShell>
  );
}

/** 이미 인증된 사용자는 대시보드로 리다이렉트 */
function GuestRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) return <PageLoader />;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

export default function App() {
  const initialize = useAuthStore((s) => s.initialize);

  // 앱 시작 시 토큰 검증 & 사용자 복원
  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* 공개 라우트 (비로그인) */}
        <Route
          path="/login"
          element={<GuestRoute><LoginPage /></GuestRoute>}
        />
        <Route
          path="/register"
          element={<GuestRoute><RegisterPage /></GuestRoute>}
        />
        <Route
          path="/register/complete"
          element={<GuestRoute><RegisterStatusPage /></GuestRoute>}
        />

        {/* 보호된 라우트 (로그인 필요) — AppShell 레이아웃 */}
        <Route element={<ProtectedLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/machines" element={<MachineListPage />} />
          <Route path="/machines/:id" element={<MachineDetailPage />} />
          <Route path="/messages" element={<NoticesPage />} />
          <Route path="/my" element={<MyPage />} />
          <Route path="/sales" element={<SalesSummaryPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Suspense>
  );
}
