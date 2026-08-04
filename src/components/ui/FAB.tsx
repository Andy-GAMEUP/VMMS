import type { ReactNode } from 'react';

interface FABProps {
  onClick: () => void;
  icon: ReactNode;
  bottom?: string;
}

export function FAB({ onClick, icon, bottom = '80px' }: FABProps) {
  return (
    <button
      onClick={onClick}
      className="fixed right-6 z-[15] w-[52px] h-[52px] rounded-full flex items-center justify-center text-white border-none cursor-pointer"
      style={{
        bottom,
        backgroundColor: 'var(--c-pri)',
        boxShadow: '0 8px 20px rgba(0,0,0,.22)',
      }}
    >
      {icon}
    </button>
  );
}
