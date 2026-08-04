import { clsx } from 'clsx';

interface Tab {
  key: string;
  label: string;
  count?: number;
}

interface TabsProps {
  tabs: Tab[];
  activeKey: string;
  onChange: (key: string) => void;
}

export function Tabs({ tabs, activeKey, onChange }: TabsProps) {
  return (
    <div className="flex" style={{ borderBottom: '1px solid var(--c-bd)' }}>
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={clsx(
            'flex-1 py-3 text-center text-title relative touch-target transition-colors',
            activeKey === tab.key
              ? 'after:absolute after:bottom-0 after:left-1/4 after:right-1/4 after:h-0.5 after:rounded-full'
              : '',
          )}
          style={{
            color: activeKey === tab.key ? 'var(--c-pri)' : 'var(--c-tx3)',
            ...(activeKey === tab.key ? { '--tw-after-bg': 'var(--c-pri)' } as any : {}),
          }}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className="ml-1 text-caption" style={{ color: 'var(--c-tx3)' }}>{tab.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}
