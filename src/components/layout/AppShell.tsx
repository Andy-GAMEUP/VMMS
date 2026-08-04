import type { ReactNode } from 'react';
import { Header } from './Header';
import { BottomTabBar } from './BottomTabBar';
import { Sidebar } from './Sidebar';
import { useBreakpoint } from '@/hooks/useBreakpoint';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { isDesktop } = useBreakpoint();

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--c-bg)' }}>
      {isDesktop ? <Sidebar /> : <Header />}
      <main
        className="page"
        style={isDesktop ? { marginLeft: 'var(--sidebar-w)', paddingTop: '24px' } : undefined}
      >
        {children}
      </main>
      {!isDesktop && <BottomTabBar />}
    </div>
  );
}
