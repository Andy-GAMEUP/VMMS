import type { ReactNode } from 'react';
import { Header } from './Header';
import { BottomTabBar } from './BottomTabBar';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="page">{children}</main>
      <BottomTabBar />
    </div>
  );
}
