import { useSyncExternalStore } from 'react';

const mqDesktop = typeof window !== 'undefined' ? window.matchMedia('(min-width: 1024px)') : null;
const mqTablet = typeof window !== 'undefined' ? window.matchMedia('(min-width: 768px)') : null;

function subscribe(mq: MediaQueryList | null) {
  return (cb: () => void) => {
    mq?.addEventListener('change', cb);
    return () => mq?.removeEventListener('change', cb);
  };
}

export function useBreakpoint() {
  const isDesktop = useSyncExternalStore(
    subscribe(mqDesktop),
    () => mqDesktop?.matches ?? false,
    () => false,
  );
  const isTabletUp = useSyncExternalStore(
    subscribe(mqTablet),
    () => mqTablet?.matches ?? false,
    () => false,
  );

  return {
    isDesktop,
    isTablet: isTabletUp && !isDesktop,
    isMobile: !isTabletUp,
  };
}
