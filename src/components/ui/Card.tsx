import { clsx } from 'clsx';
import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Card({ children, className, onClick }: CardProps) {
  return (
    <div
      className={clsx('card', onClick && 'cursor-pointer active:shadow-card-hover', className)}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

/** KPI 통계 카드 */
interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  highlight?: boolean;
}

export function StatCard({ label, value, sub, highlight }: StatCardProps) {
  return (
    <div className={clsx('stat-card', highlight && 'bg-primary-500 text-white')}>
      <span className={clsx('stat-card-label', highlight && '!text-primary-100')}>{label}</span>
      <span className={clsx('stat-card-value', highlight && '!text-white')}>{value}</span>
      {sub && (
        <span className={clsx('text-meta', highlight ? 'text-primary-100' : 'text-success-500')}>
          {sub}
        </span>
      )}
    </div>
  );
}
