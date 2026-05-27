import { clsx } from 'clsx';
import { type DeviceStatusType, DEVICE_STATUS_MAP } from '@/types';

interface StatusBadgeProps {
  status: DeviceStatusType;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const { label, dotClass } = DEVICE_STATUS_MAP[status];

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 font-medium',
        size === 'sm' ? 'text-[11px]' : 'text-meta',
      )}
    >
      <span className={clsx('status-dot', dotClass)} />
      {label}
    </span>
  );
}
