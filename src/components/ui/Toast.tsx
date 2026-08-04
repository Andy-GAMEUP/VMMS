import { useToastStore } from '@/store/toastStore';

export function Toast() {
  const message = useToastStore((s) => s.message);
  if (!message) return null;

  return (
    <div
      className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 px-6 py-3 rounded-xl text-[12.5px] font-semibold whitespace-nowrap"
      style={{
        backgroundColor: 'var(--c-tx1)',
        color: 'var(--c-sf)',
        animation: 'vmToast 2.4s ease forwards',
      }}
    >
      {message}
    </div>
  );
}
